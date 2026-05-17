"""Demo: Jennie + Jason only (optionally seed lead via Jack first)."""

from __future__ import annotations

import time
from uuid import uuid4

from pydantic import BaseModel, Field

from .config import OrchestratorSettings, get_settings
from .demo_scenario import AgentStepResult, _run_agent
from .jack_only import run_jack_crm_sync
from .schemas import LeadPayload
from .scoring import score_lead
from .supabase_repo import SupabaseRepository
from .supervity import SupervityClient


class JennieJasonDemoResponse(BaseModel):
    scenario_id: str
    lead_id: str
    demo_email: str
    steps: list[AgentStepResult] = Field(default_factory=list)
    all_passed: bool = False
    total_seconds: float = 0
    message: str = ""


async def run_jennie_jason_demo(
    *,
    lead_id: str | None = None,
    seed_with_jack: bool = True,
    settings: OrchestratorSettings | None = None,
) -> JennieJasonDemoResponse:
    settings = settings or get_settings()
    supervity = SupervityClient(settings)
    db = SupabaseRepository(settings)
    scenario_id = str(uuid4())
    correlation = f"demo-jj-{scenario_id[:8]}"
    t0 = time.perf_counter()

    payload = LeadPayload(
        name="Demo Legal Pay User",
        email=f"demo-jj-{uuid4().hex[:8]}@acelink.test",
        phone="8888888888",
        company="Ovelia Health Demo",
        project_type="website",
        budget="around 5 lakhs",
        timeline="October 2026",
    )
    scoring = score_lead(payload)

    if seed_with_jack or not lead_id:
        jack_resp = await run_jack_crm_sync(
            db=db,
            supervity=supervity,
            lead_payload=payload,
            lead_id=lead_id,
            source="demo_jennie_jason",
            scoring=scoring,
        )
        jack_result = jack_resp.reasoning_trace.get("jack_parsed", {}).get("result") or {}
        lead_id = jack_result.get("lead_id") or jack_resp.lead_id or str(uuid4())
        steps_seed = [
            AgentStepResult(
                step=0,
                agent="jack",
                task="create_lead",
                success=jack_resp.success,
                status=jack_resp.subflows[0].status if jack_resp.subflows else "UNKNOWN",
                summary=jack_resp.message,
                parsed_result=jack_result,
            )
        ]
    else:
        steps_seed = []
        lead_id = lead_id or str(uuid4())

    snapshot = {
        "lead_id": lead_id,
        "email": payload.email,
        "full_name": payload.name,
        "phone": payload.phone,
        "company_name": payload.company,
        "project_type": "website",
        "project_description": (
            "Healthcare patient portal: appointments, doctor profiles, blog, HIPAA forms."
        ),
        "scoped_budget": "500000",
        "scoped_timeline": "October 2026",
        "pipeline_stage": "scoped",
        "contract_status": "not_started",
    }

    steps: list[AgentStepResult] = list(steps_seed)

    for i, task in enumerate(["draft_contract", "send_contract_email"], start=1):
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

    snapshot["contract_status"] = "signed"
    snapshot["pipeline_stage"] = "contract_signed"

    steps.append(
        await _run_agent(
            supervity,
            step=3,
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

    passed = sum(1 for s in steps if s.success)
    return JennieJasonDemoResponse(
        scenario_id=scenario_id,
        lead_id=lead_id,
        demo_email=payload.email or "",
        steps=steps,
        all_passed=passed == len(steps),
        total_seconds=round(time.perf_counter() - t0, 1),
        message=f"Jennie+Jason demo: {passed}/{len(steps)} passed for lead {lead_id}",
    )
