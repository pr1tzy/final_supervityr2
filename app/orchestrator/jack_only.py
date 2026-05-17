"""Jack-only CRM sync — test and production path without Jim/Jennie/Jason."""

from __future__ import annotations

import logging
from typing import Any
from uuid import uuid4

from .schemas import LeadPayload, OrchestratorEventResponse, ScoringResult, SubflowResult
from .scoring import score_lead
from .supabase_repo import SupabaseRepository
from .supervity import SupervityClient

log = logging.getLogger(__name__)


async def run_jack_crm_sync(
    *,
    db: SupabaseRepository,
    supervity: SupervityClient,
    lead_payload: LeadPayload,
    lead_id: str | None,
    source: str,
    operation: str = "create_lead",
    scoring: ScoringResult | None = None,
) -> OrchestratorEventResponse:
    """
    1. Optionally score + write to Supabase (local orchestrator DB)
    2. Call Jack on Supervity
    3. Return Jack's parsed JSON back to caller (two-way, not fire-and-forget)
    """
    correlation = str(uuid4())
    scoring = scoring or score_lead(lead_payload)

    local_lead_id = lead_id
    local_lead: dict[str, Any] = {}

    if lead_payload.email:
        existing = await db.get_lead_by_email(lead_payload.email)
        if existing:
            local_lead_id = str(existing["id"])
            local_lead = await db.update_lead(
                local_lead_id,
                {"lead_score": scoring.score, "updated_by_agent": "john_local"},
            )
        else:
            try:
                created = await db.create_lead_from_payload(
                    local_lead_id, lead_payload, scoring, source
                )
                local_lead_id = str(created["id"])
                local_lead = created
            except Exception as e:
                log.warning("Local Supabase lead create failed: %s", e)

    crm_snapshot = _snapshot(local_lead_id or lead_id or correlation, local_lead, lead_payload, scoring)

    jack_inputs = supervity.build_jack_inputs(
        lead_id=crm_snapshot["lead_id"],
        operation=operation,
        payload={"crm_snapshot": crm_snapshot, "payload": crm_snapshot},
        correlation_id=correlation,
    )

    jack_result: SubflowResult = await supervity.execute_workflow("jack", jack_inputs)

    jack_parsed = jack_result.parsed
    jack_crm = jack_parsed.get("result") if jack_parsed.get("parsed") else {}

    if local_lead_id and jack_crm.get("lead_id"):
        try:
            await db.log_crm_activity(
                local_lead_id,
                "jack_sync",
                jack_crm.get("message", "Jack CRM sync"),
                {"jack_result": jack_crm, "supervity_run_id": jack_result.run_id},
            )
        except Exception:
            pass

    success = jack_result.status in ("COMPLETED", "SUCCESS", "MOCK_OK") and (
        not jack_crm or jack_crm.get("success", True)
    )

    return OrchestratorEventResponse(
        success=success,
        lead_id=jack_crm.get("lead_id") or local_lead_id,
        event_handled=f"jack_{operation}",
        scoring=scoring,
        lead_status=jack_crm.get("pipeline_stage") or jack_crm.get("status"),
        subflows=[jack_result],
        workbench_required=bool(jack_crm.get("workbench_reason")),
        workbench_reason=jack_crm.get("workbench_reason"),
        next_event="jack_complete" if success else "workbench",
        message=_build_message(jack_result, jack_crm),
        reasoning_trace={
            "correlation_id": correlation,
            "two_way_response": True,
            "jack_parsed": jack_parsed,
            "supervity_run_id": jack_result.run_id,
            "local_lead_id": local_lead_id,
        },
    )


def _snapshot(
    lead_id: str,
    lead: dict[str, Any],
    payload: LeadPayload,
    scoring: ScoringResult,
) -> dict[str, Any]:
    return {
        "lead_id": lead_id,
        "email": payload.email or lead.get("contact_email"),
        "full_name": payload.name or lead.get("contact_name"),
        "phone": payload.phone or lead.get("phone"),
        "company_name": payload.company or lead.get("company_name") or "Individual",
        "project_type": (payload.project_type or "other").lower(),
        "preliminary_budget": payload.budget,
        "preliminary_timeline": payload.timeline,
        "preferred_contact_times": (
            ", ".join(payload.availability)
            if isinstance(payload.availability, list)
            else payload.availability
        ),
        "orchestrator_interest_score": scoring.score,
        "orchestrator_tier": scoring.tier,
        "outreach_approved": scoring.outreach_approved,
    }


def _build_message(jack: SubflowResult, crm: dict[str, Any]) -> str:
    if jack.parsed.get("parsed") and crm:
        return (
            f"Jack returned: success={crm.get('success')} "
            f"lead_id={crm.get('lead_id')} stage={crm.get('pipeline_stage') or crm.get('status')} "
            f"— {crm.get('message', '')}"
        )
    if jack.status == "COMPLETED":
        return f"Jack completed (run {jack.run_id}) — parse CRM JSON from activity outputs"
    return f"Jack {jack.status}: {jack.error or 'see subflows[0].parsed'}"
