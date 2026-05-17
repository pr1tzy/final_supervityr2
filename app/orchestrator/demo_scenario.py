"""
Full dummy pipeline — exercises Jack → Jim → Jack → Jennie → Jason → Gap.

Each step calls Supervity live and records pass/fail + parsed return payload.
Typical runtime: 3–8 minutes (stream calls are slow).
"""

from __future__ import annotations

import logging
import time
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field

from .config import OrchestratorSettings, get_settings
from .jack_only import run_jack_crm_sync
from .schemas import LeadPayload, ScoringResult, SubflowResult
from .scoring import score_lead
from .supabase_repo import SupabaseRepository
from .supervity import SupervityClient

log = logging.getLogger(__name__)

StopAfter = Literal["jack", "jim", "enrich", "jennie", "jason", "gap", "all"]


class AgentStepResult(BaseModel):
    step: int
    agent: str
    task: str
    success: bool
    status: str
    run_id: str | None = None
    duration_seconds: float = 0
    summary: str = ""
    parsed_result: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None


class DemoScenarioResponse(BaseModel):
    scenario_id: str
    demo_email: str
    lead_id: str | None = None
    scoring: ScoringResult | None = None
    steps: list[AgentStepResult] = Field(default_factory=list)
    agents_passed: int = 0
    agents_failed: int = 0
    all_passed: bool = False
    total_seconds: float = 0
    message: str = ""


def build_dummy_lead() -> LeadPayload:
    uid = uuid4().hex[:8]
    return LeadPayload(
        name="Demo User",
        email=f"demo-{uid}@acelink.test",
        phone="9999999999",
        company="AceLink Demo Corp",
        project_type="Websites",
        budget="around 5 lakhs",
        timeline="by end of Q4 2026",
        availability=["Tuesday 3pm IST", "Thursday 7pm IST"],
    )


def _crm_snapshot(
    lead_id: str,
    payload: LeadPayload,
    scoring: ScoringResult,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    base = {
        "lead_id": lead_id,
        "email": payload.email,
        "full_name": payload.name,
        "phone": payload.phone,
        "company_name": payload.company or "Individual",
        "project_type": "website",
        "project_description": (
            "Demo: marketing website for healthcare startup with booking + blog."
        ),
        "preliminary_budget": payload.budget,
        "preliminary_timeline": payload.timeline,
        "preferred_contact_times": ", ".join(payload.availability or []),
        "orchestrator_interest_score": scoring.score,
        "orchestrator_tier": scoring.tier,
        "outreach_approved": scoring.outreach_approved,
        "contract_status": "not_started",
        "payment_status": "not_started",
        "pipeline_stage": "new",
    }
    if extra:
        base.update(extra)
    return base


def _step_ok(result: SubflowResult) -> bool:
    if result.status in ("ERROR", "FAILED", "SKIPPED"):
        return False
    if result.parsed.get("parsed"):
        inner = result.parsed.get("result") or {}
        if inner.get("success") is False:
            return False
    return result.status in ("COMPLETED", "SUCCESS", "MOCK_OK", "SUBMITTED")


def _summarize(agent: str, result: SubflowResult) -> str:
    if result.parsed.get("parsed"):
        r = result.parsed.get("result") or {}
        return (
            f"{agent}: {r.get('message') or r.get('status') or 'ok'} "
            f"(lead_id={r.get('lead_id', '—')})"
        )[:200]
    return f"{agent} {result.status} run={result.run_id or '—'}"


async def _run_agent(
    supervity: SupervityClient,
    *,
    step: int,
    agent: str,
    task: str,
    lead_id: str,
    payload: dict[str, Any],
    correlation: str,
) -> AgentStepResult:
    t0 = time.perf_counter()
    inputs = supervity.build_workflow_inputs(
        agent,
        lead_id=lead_id,
        operation_or_task=task,
        payload={"task": task, **payload},
        correlation_id=correlation,
    )
    try:
        result = await supervity.execute_workflow(agent, inputs)
        ok = _step_ok(result)
        return AgentStepResult(
            step=step,
            agent=agent,
            task=task,
            success=ok,
            status=result.status,
            run_id=result.run_id,
            duration_seconds=round(time.perf_counter() - t0, 1),
            summary=_summarize(agent, result),
            parsed_result=result.parsed.get("result") or {},
            error=result.error,
        )
    except Exception as e:
        log.exception("Demo step %s %s failed", agent, task)
        return AgentStepResult(
            step=step,
            agent=agent,
            task=task,
            success=False,
            status="ERROR",
            duration_seconds=round(time.perf_counter() - t0, 1),
            summary=str(e),
            error=str(e),
        )


async def run_full_demo_scenario(
    settings: OrchestratorSettings | None = None,
    *,
    stop_after: StopAfter = "all",
    lead_payload: LeadPayload | None = None,
    simulate_legal_and_payment: bool = True,
) -> DemoScenarioResponse:
    """
    Dummy end-to-end check of all Auto operators.

    simulate_legal_and_payment: after Jennie send, call Jason directly with
    crm_snapshot.contract_status=signed (demo shortcut — no real PDF/OCR).
    """
    settings = settings or get_settings()
    db = SupabaseRepository(settings)
    supervity = SupervityClient(settings)
    scenario_id = str(uuid4())
    correlation = f"demo-{scenario_id[:8]}"
    payload = lead_payload or build_dummy_lead()
    scoring = score_lead(payload)
    steps: list[AgentStepResult] = []
    t0 = time.perf_counter()

    # ── 1. JACK — create lead ─────────────────────────────────────────
    jack_resp = await run_jack_crm_sync(
        db=db,
        supervity=supervity,
        lead_payload=payload,
        lead_id=None,
        source="demo_scenario",
        operation="create_lead",
        scoring=scoring,
    )
    jack_parsed = jack_resp.reasoning_trace.get("jack_parsed", {})
    jack_result = jack_parsed.get("result") or {}
    lead_id = (
        jack_result.get("lead_id")
        or jack_resp.lead_id
        or str(uuid4())
    )
    steps.append(
        AgentStepResult(
            step=1,
            agent="jack",
            task="create_lead",
            success=jack_resp.success,
            status=jack_resp.subflows[0].status if jack_resp.subflows else "UNKNOWN",
            run_id=jack_resp.reasoning_trace.get("supervity_run_id"),
            duration_seconds=0,
            summary=jack_resp.message,
            parsed_result=jack_result,
        )
    )
    if not jack_resp.success or stop_after == "jack":
        return _finalize(scenario_id, payload, lead_id, scoring, steps, t0, stop_after)

    snapshot = _crm_snapshot(lead_id, payload, scoring, jack_result)

    # ── 2. JIM — outreach ─────────────────────────────────────────────
    if scoring.outreach_approved:
        steps.append(
            await _run_agent(
                supervity,
                step=2,
                agent="jim",
                task="send_initial_outreach",
                lead_id=lead_id,
                payload={
                    "outreach_approved": True,
                    "orchestrator_tier": scoring.tier,
                    "crm_snapshot": snapshot,
                },
                correlation=correlation,
            )
        )
    else:
        steps.append(
            AgentStepResult(
                step=2,
                agent="jim",
                task="send_initial_outreach",
                success=False,
                status="SKIPPED",
                summary=f"Outreach not approved (tier={scoring.tier})",
            )
        )
    if stop_after == "jim":
        return _finalize(scenario_id, payload, lead_id, scoring, steps, t0, stop_after)

    # ── 3. JACK — enrich from transcript ────────────────────────────────
    enrich_payload = {
        "operation": "enrich_from_transcript",
        "crm_snapshot": snapshot,
        "payload": {
            "project_description": (
                "Healthcare patient portal for Ovelia: appointment booking, "
                "doctor profiles, blog, HIPAA-aware forms. Hindi/English."
            ),
            "scoped_budget": "₹5,00,000",
            "scoped_timeline": "October 2026",
            "meeting_transcript_summary": (
                "Demo scoping call: client confirmed MVP by Oct 2026, "
                "budget 5L, needs CMS + analytics."
            ),
            "project_categories": ["healthcare", "booking", "cms"],
        },
    }
    steps.append(
        await _run_agent(
            supervity,
            step=3,
            agent="jack",
            task="enrich_from_transcript",
            lead_id=lead_id,
            payload=enrich_payload,
            correlation=correlation,
        )
    )
    snapshot.update(
        {
            "pipeline_stage": "scoped",
            "scoped_budget": "₹5,00,000",
            "scoped_timeline": "October 2026",
        }
    )
    if stop_after == "enrich":
        return _finalize(scenario_id, payload, lead_id, scoring, steps, t0, stop_after)

    # ── 4. JENNIE — draft + send contract ─────────────────────────────
    for i, task in enumerate(["draft_contract", "send_contract_email"], start=4):
        steps.append(
            await _run_agent(
                supervity,
                step=i,
                agent="jennie",
                task=task,
                lead_id=lead_id,
                payload={"crm_snapshot": snapshot},
                correlation=correlation,
            )
        )
    if stop_after == "jennie":
        return _finalize(scenario_id, payload, lead_id, scoring, steps, t0, stop_after)

    # Demo shortcut: mark legal signed so Jason can run without real OCR upload
    if simulate_legal_and_payment:
        snapshot.update(
            {
                "contract_status": "signed",
                "legal_confirmed_at": "2026-05-16T12:00:00Z",
                "pipeline_stage": "contract_signed",
            }
        )

    # ── 5. JASON — payment (flat Auto inputs) ─────────────────────────
    steps.append(
        await _run_agent(
            supervity,
            step=6,
            agent="jason",
            task="payment_flow",
            lead_id=lead_id,
            payload={
                "crm_snapshot": snapshot,
                "contract_status": "signed",
                "deposit_amount_usd": 150000,
                "slack_channel": "#sales-ops",
            },
            correlation=correlation,
        )
    )
    if stop_after == "jason":
        return _finalize(scenario_id, payload, lead_id, scoring, steps, t0, stop_after)

    # ── 6. GAP — pipeline scan ────────────────────────────────────────
    steps.append(
        await _run_agent(
            supervity,
            step=9,
            agent="gap",
            task="scan_single_lead",
            lead_id=lead_id,
            payload={
                "mode": "scan_single_lead",
                "lead_id": lead_id,
                "crm_snapshot": snapshot,
            },
            correlation=correlation,
        )
    )

    return _finalize(scenario_id, payload, lead_id, scoring, steps, t0, stop_after)


def _finalize(
    scenario_id: str,
    payload: LeadPayload,
    lead_id: str | None,
    scoring: ScoringResult,
    steps: list[AgentStepResult],
    t0: float,
    stop_after: str,
) -> DemoScenarioResponse:
    passed = sum(1 for s in steps if s.success)
    failed = sum(1 for s in steps if not s.success)
    all_ok = failed == 0
    return DemoScenarioResponse(
        scenario_id=scenario_id,
        demo_email=payload.email or "",
        lead_id=lead_id,
        scoring=scoring,
        steps=steps,
        agents_passed=passed,
        agents_failed=failed,
        all_passed=all_ok,
        total_seconds=round(time.perf_counter() - t0, 1),
        message=(
            f"Demo stopped after '{stop_after}': {passed}/{len(steps)} steps passed. "
            f"Email={payload.email}"
        ),
    )
