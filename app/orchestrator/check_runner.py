"""On-demand Agent E (check) — legal replies, silence gap, PDF OCR."""

from __future__ import annotations

import logging
from typing import Any

from pydantic import BaseModel, Field

from .agents_config import build_check_inputs
from .config import OrchestratorSettings, get_settings
from .supabase_repo import SupabaseRepository
from .supervity import SupervityClient
from .supervity_parse import parse_operator_output

log = logging.getLogger(__name__)


class CheckRequest(BaseModel):
    """Frontend Command Center → POST /api/orchestrator/check"""

    action: str = Field(default="check", description='Must be "check" to run Agent E')
    lead_id: str
    client_email: str | None = None
    client_name: str | None = None
    silence_threshold_days: int = 4
    signed_pdf_url: str = ""
    doc_type: str = "signed_contract"
    expected_name: str = ""
    expected_amount_usd: float = 0
    slack_channel: str = "#sales-ops"

    model_config = {"extra": "allow"}


class CheckResponse(BaseModel):
    success: bool
    action: str = "check"
    lead_id: str
    message: str = ""
    result: dict[str, Any] = Field(default_factory=dict)
    notifications: list[dict[str, Any]] = Field(default_factory=list)
    agent_run_id: str | None = None
    workflow_status: str | None = None


async def run_check(
    body: CheckRequest,
    *,
    settings: OrchestratorSettings | None = None,
    db: SupabaseRepository | None = None,
    supervity: SupervityClient | None = None,
) -> CheckResponse:
    settings = settings or get_settings()
    if body.action.strip().lower() != "check":
        return CheckResponse(
            success=False,
            lead_id=body.lead_id,
            message='action must be "check"',
        )

    db = db or SupabaseRepository(settings)
    supervity = supervity or SupervityClient(settings)

    lead: dict[str, Any] = {}
    if settings.configured():
        try:
            lead = await db.get_lead(body.lead_id) or {}
        except Exception as e:
            log.warning("Could not load lead %s: %s", body.lead_id, e)

    client_email = body.client_email or str(lead.get("contact_email") or "")
    client_name = body.client_name or str(lead.get("contact_name") or "")

    run_id = None
    if settings.configured():
        run_id = await db.start_agent_run(
            lead_id=body.lead_id,
            reasoning={"phase": "check", "action": "check"},
        )

    inputs = build_check_inputs(
        settings,
        lead_id=body.lead_id,
        client_email=client_email,
        client_name=client_name,
        silence_threshold_days=body.silence_threshold_days,
        signed_pdf_url=body.signed_pdf_url,
        doc_type=body.doc_type,
        expected_name=body.expected_name or client_name,
        expected_amount_usd=body.expected_amount_usd,
        slack_channel=body.slack_channel,
    )

    try:
        flow = await supervity.execute_workflow("check", inputs)
        parsed = parse_operator_output("check", flow.output)
        result = parsed.get("result") or {}
        notifications = result.get("notifications") or []

        if settings.configured() and run_id:
            await db.complete_agent_run(
                run_id,
                "completed" if flow.status not in ("ERROR", "FAILED") else "failed",
                {"check_result": result, "notifications": notifications},
            )
            try:
                await db.log_crm_activity(
                    body.lead_id,
                    "monitor_check",
                    result.get("message") or "Agent E check completed",
                    {"notifications": notifications, "workflow_status": flow.status},
                )
            except Exception as e:
                log.warning("monitor_check log skipped: %s", e)

        return CheckResponse(
            success=bool(result.get("success")) and flow.status not in ("ERROR", "FAILED"),
            lead_id=body.lead_id,
            message=result.get("message") or "Check completed",
            result=result,
            notifications=notifications,
            agent_run_id=run_id,
            workflow_status=flow.status,
        )
    except Exception as e:
        log.exception("Check agent failed")
        if settings.configured() and run_id:
            await db.complete_agent_run(run_id, "failed", {"error": str(e)})
        return CheckResponse(
            success=False,
            lead_id=body.lead_id,
            message=str(e),
            agent_run_id=run_id,
        )
