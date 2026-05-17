"""Local John orchestrator API — replaces Auto orchestrator."""

import logging
import os
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel

from uuid import uuid4

from app.orchestrator import JohnOrchestrator
from app.orchestrator.pipeline_phases import run_phase_payment
from app.orchestrator.config import get_settings
from app.orchestrator.demo_jennie_jason import JennieJasonDemoResponse, run_jennie_jason_demo
from app.orchestrator.demo_scenario import DemoScenarioResponse, StopAfter, run_full_demo_scenario
from app.orchestrator.check_runner import CheckRequest, CheckResponse, run_check
from app.orchestrator.jack_only import run_jack_crm_sync
from app.orchestrator.schemas import (
    LeadPayload,
    OrchestratorEventRequest,
    OrchestratorEventResponse,
    TranscriptPayload,
)
from app.orchestrator.contract_files import contract_pdf_path
from app.orchestrator.supabase_repo import SupabaseRepository
from app.orchestrator.supervity import SupervityClient

log = logging.getLogger(__name__)

router = APIRouter(prefix="/orchestrator", tags=["Orchestrator"])


def _check_webhook_secret(x_webhook_secret: str | None) -> None:
    secret = get_settings().webhook_secret
    if secret and x_webhook_secret != secret:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")


@router.get("/contracts/{lead_id}/agreement.pdf")
async def download_contract_pdf(lead_id: str) -> FileResponse:
    """Public PDF for legal attach + Agent E OCR demo (no auth)."""
    path = contract_pdf_path(lead_id)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Contract PDF not generated yet — run Phase 2 Legal")
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=f"AceLink-Service-Agreement-{lead_id[:8]}.pdf",
    )


@router.get("/health")
async def orchestrator_health() -> dict[str, Any]:
    s = get_settings()
    supabase_url = s.normalize_supabase_url()
    supabase_ok = s.configured()
    return {
        "status": "ok",
        "supabase_url": supabase_url if s.supabase_url else None,
        "supabase": supabase_ok,
        "supabase_key_hint": "service_role recommended (anon may hit RLS)",
        "env_hint": (
            None
            if supabase_ok
            else "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in process env — restart backend after .env fix"
        ),
        "supervity_live": s.supervity_configured(),
        "supervity_mock_mode": s.supervity_mock_mode,
        "supervity_org": s.supervity_active_org or None,
        "llm": s.llm_enabled,
        "ocr_via": "check_agent_e",
        "agents": {
            "crm": bool(s.workflow_crm or s.workflow_jack),
            "email": bool(s.workflow_email or s.workflow_jim),
            "legal": bool(s.workflow_legal or s.workflow_jennie),
            "payment": bool(s.workflow_payment or s.workflow_jason),
            "check": bool(s.workflow_check or s.workflow_gap),
        },
    }


@router.post("/events", response_model=OrchestratorEventResponse)
async def handle_event(
    body: OrchestratorEventRequest,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> OrchestratorEventResponse:
    """
    Main orchestrator entry — same semantics as former Auto John.

    Example body:
    ```json
    {
      "event": "lead_created",
      "lead_id": "uuid",
      "workflow_id": "corr-123",
      "lead_payload": {
        "name": "Tristan Singh",
        "email": "a@example.com",
        "phone": "9819861904",
        "company": "ovelia health",
        "project_type": "Websites",
        "budget": "around 5 lakhs",
        "timeline": "by the end of october 2026",
        "availability": ["thursday 7pm"]
      },
      "source": "AceLink Website"
    }
    ```
    """
    _check_webhook_secret(x_webhook_secret)
    settings = get_settings()
    if not settings.configured():
        raise HTTPException(
            status_code=503,
            detail="Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        )
    john = JohnOrchestrator(settings)
    return await john.handle(body)


@router.post("/webhook/lead", response_model=OrchestratorEventResponse)
async def webhook_lead_from_max(
    request: Request,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> OrchestratorEventResponse:
    """
    Accepts form-urlencoded or JSON from AceLink Max / Supervity-style triggers.

    Form fields supported:
    - event, lead_id, source
    - lead_payload_json (string)
    - inputs[event], inputs[lead_id], inputs[lead_payload_json], etc.
    """
    _check_webhook_secret(x_webhook_secret)

    content_type = request.headers.get("content-type", "")
    data: dict[str, Any] = {}

    if "application/json" in content_type:
        data = await request.json()
    else:
        form = await request.form()
        data = dict(form)

    def pick(*keys: str) -> Any:
        for k in keys:
            if k in data and data[k] not in (None, ""):
                return data[k]
        return None

    event = pick("event", "inputs[event]") or "lead_created"
    lead_id = pick("lead_id", "inputs[lead_id]")
    source = pick("source", "inputs[source]") or "AceLink Website"
    workflow_id = pick("workflow_id", "workflowId", "inputs[workflowId]")

    # JSON clients send lead_payload (object); forms send lead_payload_json (string)
    lp = pick(
        "lead_payload",
        "lead_payload_json",
        "inputs[lead_payload_json]",
        "inputs[lead_payload]",
    )
    oc = pick("operator_callback_json", "inputs[operator_callback_json]")
    tp = pick("transcript_payload_json", "inputs[transcript_payload_json]")

    lead_payload: dict[str, Any] | None = None
    lead_payload_json: str | dict[str, Any] | None = None
    if isinstance(lp, dict):
        lead_payload = lp
    elif isinstance(lp, str) and lp.strip():
        lead_payload_json = lp

    req = OrchestratorEventRequest(
        event=str(event),
        lead_id=str(lead_id) if lead_id else None,
        workflow_id=str(workflow_id) if workflow_id else None,
        lead_payload=lead_payload,
        lead_payload_json=lead_payload_json,
        operator_callback_json=oc,
        transcript_payload_json=tp,
        source=str(source),
    )
    settings = get_settings()
    if not settings.configured():
        raise HTTPException(status_code=503, detail="Supabase not configured")
    return await JohnOrchestrator(settings).handle(req)


class JackSyncRequest(BaseModel):
    """Jack-only — no Jim/outreach."""

    operation: str = "create_lead"
    lead_id: str | None = None
    lead_payload: LeadPayload | None = None
    source: str = "AceLink Website"


class PhaseLegalRequest(BaseModel):
    """Phase 2 — meeting transcript → Agent C (draft + send contract)."""

    lead_id: str
    transcript_payload: TranscriptPayload | dict[str, Any] | None = None
    transcript_payload_json: str | dict[str, Any] | None = None
    source: str = "Command Center"


class PhasePaymentRequest(BaseModel):
    """Phase 3 — contract signed → Agent D payment link email."""

    lead_id: str
    deposit_amount_usd: int = 150000
    source: str = "Command Center"


@router.post("/phase/legal", response_model=OrchestratorEventResponse)
async def phase_legal(
    body: PhaseLegalRequest,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> OrchestratorEventResponse:
    """
    **Phase 2 trigger** — same as `POST /events` with `event: transcript_ready`.

    Requires existing `lead_id` from Phase 1 and real transcript text (not placeholder).
    """
    _check_webhook_secret(x_webhook_secret)
    settings = get_settings()
    if not settings.configured():
        raise HTTPException(status_code=503, detail="Supabase not configured")
    req = OrchestratorEventRequest(
        event="transcript_ready",
        lead_id=body.lead_id,
        transcript_payload=body.transcript_payload,
        transcript_payload_json=body.transcript_payload_json,
        source=body.source,
    )
    return await JohnOrchestrator(settings).handle(req)


@router.post("/phase/payment", response_model=OrchestratorEventResponse)
async def phase_payment(
    body: PhasePaymentRequest,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> OrchestratorEventResponse:
    """
    **Phase 3 trigger** — Agent D sends deposit payment link after contract is signed.
    """
    _check_webhook_secret(x_webhook_secret)
    if not (body.lead_id and body.lead_id.strip()):
        raise HTTPException(status_code=400, detail="lead_id is required")
    settings = get_settings()
    if not settings.configured():
        raise HTTPException(status_code=503, detail="Supabase not configured")
    john = JohnOrchestrator(settings)
    return await run_phase_payment(
        john,
        lead_id=body.lead_id,
        deposit_usd=body.deposit_amount_usd,
        correlation=str(uuid4()),
        trace={"source": body.source, "phase": "payment"},
    )


@router.post("/check", response_model=CheckResponse)
async def run_monitor_check(
    body: CheckRequest,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> CheckResponse:
    """
    **Agent E — on-demand only.** Body must include `"action": "check"`.

    Runs on Supervity when user clicks Check in Command Center:
    - Legal contract email replies (Outlook)
    - Silence alert if no client reply for N days (default 4)
    - PDF legality via OCR when `signed_pdf_url` is set

    No cron — call this endpoint manually or from the UI.
    """
    _check_webhook_secret(x_webhook_secret)
    if body.action.strip().lower() != "check":
        raise HTTPException(status_code=400, detail='action must be "check"')
    settings = get_settings()
    if not settings.supervity_configured() and not settings.workflow_check and not settings.workflow_gap:
        raise HTTPException(
            status_code=503,
            detail="Set SUPERVITY_WORKFLOW_CHECK (Agent E) and Supervity API token.",
        )
    return await run_check(body)


@router.post("/jack", response_model=OrchestratorEventResponse)
async def jack_crm_only(
    body: JackSyncRequest,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> OrchestratorEventResponse:
    """
  **Jack only** — calls Supervity Jack workflow and returns parsed CRM JSON.

  This is **two-way**: response includes `reasoning_trace.jack_parsed.result` with
  lead_id, pipeline_stage, changes_applied, etc. from Jack's activity outputs.
    """
    _check_webhook_secret(x_webhook_secret)
    if not body.lead_payload or not body.lead_payload.email:
        raise HTTPException(status_code=400, detail="lead_payload.email required")

    settings = get_settings()
    return await run_jack_crm_sync(
        db=SupabaseRepository(settings),
        supervity=SupervityClient(settings),
        lead_payload=body.lead_payload,
        lead_id=body.lead_id,
        source=body.source,
        operation=body.operation,
    )


class DemoScenarioRequest(BaseModel):
    """Run dummy lead through all Supervity operators (Jack → Jim → … → Gap)."""

    stop_after: StopAfter = "all"
    simulate_legal_and_payment: bool = True
    lead_payload: LeadPayload | None = None


@router.post("/demo/full", response_model=DemoScenarioResponse)
async def demo_full_pipeline(
    body: DemoScenarioRequest | None = None,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> DemoScenarioResponse:
    """
    **Hackathon demo** — one call checks every agent with a unique dummy lead.

    Steps (live Supervity, ~3–8 min total):
    1. Jack `create_lead`
    2. Jim `send_initial_outreach`
    3. Jack `enrich_from_transcript`
    4. Jennie `draft_contract` + `send_contract_email`
    5. Jason `create_payment_request` + `send_payment_link_email` + `verify_invoice_ocr`
    6. Gap `scan_single_lead`

    Use `stop_after: "jim"` to run only first N agents.  
    Response `steps[]` shows per-agent pass/fail + parsed CRM JSON.
    """
    _check_webhook_secret(x_webhook_secret)
    body = body or DemoScenarioRequest()
    return await run_full_demo_scenario(
        stop_after=body.stop_after,
        lead_payload=body.lead_payload,
        simulate_legal_and_payment=body.simulate_legal_and_payment,
    )


class JennieJasonDemoRequest(BaseModel):
    lead_id: str | None = None
    seed_with_jack: bool = True


@router.post("/demo/jennie-jason", response_model=JennieJasonDemoResponse)
async def demo_jennie_jason(
    body: JennieJasonDemoRequest | None = None,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> JennieJasonDemoResponse:
    """Jack (optional) → Jennie draft+send → Jason payment. Uses flat Auto input fields."""
    _check_webhook_secret(x_webhook_secret)
    body = body or JennieJasonDemoRequest()
    return await run_jennie_jason_demo(
        lead_id=body.lead_id,
        seed_with_jack=body.seed_with_jack,
    )


@router.post("/callback/operator", response_model=OrchestratorEventResponse)
async def operator_callback(
    body: OrchestratorEventRequest,
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> OrchestratorEventResponse:
    """Call when a Supervity operator finishes — forwards into John chain."""
    body.event = "operator_callback"
    _check_webhook_secret(x_webhook_secret)
    return await JohnOrchestrator().handle(body)
