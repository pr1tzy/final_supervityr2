#!/usr/bin/env python3
"""
End-to-end test: Agents A → B → C → D → E (live Supervity).

Usage:
  python scripts/test_all_agents.py           # full pipeline
  python scripts/test_all_agents.py crm       # single agent
  python scripts/test_all_agents.py check <lead_id>
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.orchestrator.agents_config import (
    build_check_inputs,
    build_crm_inputs,
    build_email_inputs,
    build_legal_inputs,
    build_payment_inputs,
)
from app.orchestrator.config import get_settings
from app.orchestrator.supervity import SupervityClient
from app.orchestrator.supervity_parse import parse_operator_output

PASS = "PASS"
FAIL = "FAIL"
SKIP = "SKIP"


async def run_step(
    sv: SupervityClient, label: str, agent: str, form: dict[str, str]
) -> tuple[str, dict]:
    wid = sv.workflow_id_for(agent)
    print(f"\n--- {label} ({agent}) workflow={wid}")
    try:
        r = await sv.execute_workflow(agent, form)
        p = parse_operator_output(agent, r.output)
        res = p.get("result") or {}
        ok = (
            r.status not in ("ERROR", "FAILED", "SKIPPED")
            and res.get("success") is not False
            and not res.get("error")
        )
        status = PASS if ok else FAIL
        print(f"    {status} | run_status={r.status}")
        print(f"    {json.dumps(res, default=str)[:400]}")
        if r.error:
            print(f"    error: {r.error}")
        return status, res
    except Exception as e:
        print(f"    {FAIL} | {e}")
        return FAIL, {}


async def full_pipeline(only: str | None = None) -> int:
    settings = get_settings()
    sv = SupervityClient(settings)
    uid = uuid4().hex[:8]
    lead_id = str(uuid4())
    snap = {
        "email": f"test-{uid}@acelink.test",
        "full_name": f"Test User {uid}",
        "phone": "9876543210",
        "company_name": "AceLink Test Co",
        "project_type": "website",
        "preliminary_budget": "5 lakhs",
        "preliminary_timeline": "October 2026",
        "project_description": "Marketing website with blog and contact form.",
        "scoped_budget": "500000",
        "scoped_timeline": "October 2026",
    }
    results: dict[str, str] = {}

    async def step(name: str, agent: str, form: dict) -> dict:
        if only and only != agent:
            results[name] = SKIP
            return {}
        st, data = await run_step(sv, name, agent, form)
        results[name] = st
        return data

    # A — CRM create
    crm = await step(
        "A CRM create",
        "crm",
        build_crm_inputs(settings, operation="create_lead", lead_id=lead_id, payload=snap),
    )
    lead_id = str(crm.get("lead_id") or lead_id)
    snap["email"] = crm.get("contact_email") or snap["email"]
    snap["full_name"] = crm.get("contact_name") or snap["full_name"]

    # B — Email draft + send
    draft = await step(
        "B Email draft",
        "email",
        build_email_inputs(operation="draft", lead_id=lead_id, snap=snap),
    )
    await step(
        "B Email send",
        "email",
        build_email_inputs(
            operation="send",
            lead_id=lead_id,
            snap=snap,
            subject=draft.get("subject") or "AceLink — next steps",
            body_html=draft.get("body_html") or "<p>Thanks for your interest in AceLink.</p>",
        ),
    )

    # C — Legal draft + send
    legal = await step(
        "C Legal draft",
        "legal",
        build_legal_inputs(task="draft_contract", snap=snap, lead_id=lead_id),
    )
    await step(
        "C Legal send",
        "legal",
        build_legal_inputs(
            task="send_contract_email",
            snap=snap,
            lead_id=lead_id,
            contract_markdown=legal.get("contract_markdown") or "# Service Agreement\n\nTest contract.",
        ),
    )

    # D — Payment
    await step("D Payment", "payment", build_payment_inputs(snap, lead_id, deposit_usd=150000))

    # E — Check (no PDF unless provided)
    await step(
        "E Monitor check",
        "check",
        build_check_inputs(
            settings,
            lead_id=lead_id,
            client_email=snap["email"],
            client_name=snap["full_name"],
            silence_threshold_days=4,
        ),
    )

    print("\n========== SUMMARY ==========")
    for k, v in results.items():
        print(f"  {v:4}  {k}")
    print(f"\nlead_id={lead_id}")
    failed = sum(1 for v in results.values() if v == FAIL)
    return 1 if failed else 0


async def check_only(lead_id: str) -> int:
    settings = get_settings()
    sv = SupervityClient(settings)
    _, _ = await run_step(
        sv,
        "E Monitor check",
        "check",
        build_check_inputs(settings, lead_id=lead_id, silence_threshold_days=4),
    )
    return 0


def main() -> None:
    if not get_settings().supervity_configured():
        print("ERROR: Set WORKFLOW_SVC_URL, SUPERVITY_API_TOKEN, SUPERVITY_MOCK_MODE=false")
        print("       and SUPERVITY_WORKFLOW_CRM/EMAIL/LEGAL/PAYMENT/CHECK in .env")
        sys.exit(2)

    missing = []
    s = get_settings()
    for name, wid in [
        ("CRM", s.workflow_crm),
        ("EMAIL", s.workflow_email),
        ("LEGAL", s.workflow_legal),
        ("PAYMENT", s.workflow_payment),
        ("CHECK", s.workflow_check),
    ]:
        if not wid:
            missing.append(name)
    if missing:
        print(f"WARNING: Missing workflow IDs in .env: {', '.join(missing)}")

    arg = sys.argv[1].lower() if len(sys.argv) > 1 else None
    if arg == "check" and len(sys.argv) > 2:
        sys.exit(asyncio.run(check_only(sys.argv[2])))
    sys.exit(asyncio.run(full_pipeline(only=arg)))


if __name__ == "__main__":
    main()
