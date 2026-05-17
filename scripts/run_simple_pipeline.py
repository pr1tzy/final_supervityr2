#!/usr/bin/env python3
"""4-agent pipeline: CRM → Email (draft+send) → Legal (draft+send) → Payment."""

import asyncio
import json
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.orchestrator.agents_config import (
    build_crm_inputs,
    build_email_inputs,
    build_legal_inputs,
    build_payment_inputs,
)
from app.orchestrator.config import get_settings
from app.orchestrator.schemas import LeadPayload
from app.orchestrator.supervity import SupervityClient
from app.orchestrator.supervity_parse import parse_operator_output


async def run(sv: SupervityClient, agent: str, form: dict) -> dict:
    print(f"\n>>> {agent}")
    r = await sv.execute_workflow(agent, form)
    p = parse_operator_output(agent, r.output)
    res = p.get("result") or {}
    print(f"    {r.status} | {json.dumps(res, default=str)[:200]}")
    return res


async def main() -> None:
    settings = get_settings()
    sv = SupervityClient(settings)
    lead_id = str(uuid4())
    uid = uuid4().hex[:8]
    snap = {
        "email": f"pipe-{uid}@acelink.test",
        "full_name": "Pipeline User",
        "phone": "9876543210",
        "company_name": "Pipeline Co",
        "project_type": "website",
        "preliminary_budget": "5 lakhs",
        "preliminary_timeline": "October 2026",
        "project_description": "Website with booking and blog.",
        "scoped_budget": "500000",
        "scoped_timeline": "October 2026",
    }

    crm = await run(
        sv, "crm", build_crm_inputs(settings, operation="create_lead", lead_id=lead_id, payload=snap)
    )
    lead_id = crm.get("lead_id") or lead_id
    snap["email"] = crm.get("contact_email") or snap["email"]
    snap["full_name"] = crm.get("contact_name") or snap["full_name"]

    draft = await run(
        sv, "email", build_email_inputs(operation="draft", lead_id=lead_id, snap=snap)
    )
    await run(
        sv,
        "email",
        build_email_inputs(
            operation="send",
            lead_id=lead_id,
            snap=snap,
            subject=draft.get("subject", "AceLink follow-up"),
            body_html=draft.get("body_html", "<p>Hello</p>"),
        ),
    )

    legal = await run(
        sv, "legal", build_legal_inputs(task="draft_contract", snap=snap, lead_id=lead_id)
    )
    await run(
        sv,
        "legal",
        build_legal_inputs(
            task="send_contract_email",
            snap=snap,
            lead_id=lead_id,
            contract_markdown=legal.get("contract_markdown", "# Agreement"),
        ),
    )

    await run(sv, "payment", build_payment_inputs(snap, lead_id))
    print(f"\nDone. lead_id={lead_id}")


if __name__ == "__main__":
    asyncio.run(main())
