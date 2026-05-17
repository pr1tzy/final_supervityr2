#!/usr/bin/env python3
"""
Wipe AceLink CRM tables and insert 10 demo leads at different pipeline stages.

Usage (from SupervityR2/):
  python scripts/reset_and_seed_acelink_demo.py
  python scripts/reset_and_seed_acelink_demo.py --no-reset   # seed only (may duplicate)

Requires .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

# Fixed IDs so docs/curls can reference stable examples
DEMO_LEADS: list[dict[str, Any]] = [
    {
        "id": "11111111-1111-4111-8111-111111111101",
        "company_name": "Nova Clinics",
        "contact_name": "Aisha Patel",
        "contact_email": "aisha.patel@demo.acelink.test",
        "phone": "9811000001",
        "source": "AceLink Website",
        "industry": "website",
        "lead_status": "new",
        "lead_score": 45,
        "estimated_deal_size": 200000,
        "notes": "Cold lead — budget unclear, no timeline.",
        "stage": "phase1_new",
    },
    {
        "id": "11111111-1111-4111-8111-111111111102",
        "company_name": "Bright Retail Co",
        "contact_name": "Marcus Chen",
        "contact_email": "marcus.chen@demo.acelink.test",
        "phone": "9811000002",
        "source": "AceLink Website",
        "industry": "website",
        "lead_status": "qualified",
        "lead_score": 88,
        "estimated_deal_size": 500000,
        "notes": "Hot — 5 lakhs, October launch.",
        "stage": "phase1_outreach",
    },
    {
        "id": "11111111-1111-4111-8111-111111111103",
        "company_name": "Summit Logistics",
        "contact_name": "Elena Rodriguez",
        "contact_email": "elena.rodriguez@demo.acelink.test",
        "phone": "9811000003",
        "source": "Referral",
        "industry": "app",
        "lead_status": "qualified",
        "lead_score": 72,
        "estimated_deal_size": 800000,
        "notes": "Warm — mobile app + admin portal.",
        "stage": "phase1_qualified_no_outreach",
    },
    {
        "id": "11111111-1111-4111-8111-111111111104",
        "company_name": "Ovelia Health",
        "contact_name": "Tristan Hancock",
        "contact_email": "tristanhancock@gmail.com",
        "phone": "9819861904",
        "source": "manual_curl_test",
        "industry": "website",
        "lead_status": "proposal_sent",
        "lead_score": 90,
        "estimated_deal_size": 500000,
        "notes": "Contract sent — marketing site + CMS.",
        "stage": "phase2_contract_sent",
    },
    {
        "id": "11111111-1111-4111-8111-111111111105",
        "company_name": "GreenGrid Energy",
        "contact_name": "Priya Nair",
        "contact_email": "priya.nair@demo.acelink.test",
        "phone": "9811000005",
        "source": "AceLink Website",
        "industry": "ai_chatbot",
        "lead_status": "proposal_sent",
        "lead_score": 85,
        "estimated_deal_size": 1200000,
        "notes": "Legal draft done, send pending.",
        "stage": "phase2_drafted_not_sent",
    },
    {
        "id": "11111111-1111-4111-8111-111111111106",
        "company_name": "Urban Bistro Group",
        "contact_name": "James Okonkwo",
        "contact_email": "james.okonkwo@demo.acelink.test",
        "phone": "9811000006",
        "source": "AceLink Website",
        "industry": "website",
        "lead_status": "negotiation",
        "lead_score": 92,
        "estimated_deal_size": 350000,
        "notes": "Invoice sent — awaiting deposit.",
        "stage": "phase3_invoice_sent",
    },
    {
        "id": "11111111-1111-4111-8111-111111111107",
        "company_name": "Skyline Architects",
        "contact_name": "Sofia Lindstrom",
        "contact_email": "sofia.lindstrom@demo.acelink.test",
        "phone": "9811000007",
        "source": "Partner",
        "industry": "website",
        "lead_status": "negotiation",
        "lead_score": 88,
        "estimated_deal_size": 900000,
        "notes": "Payment link emailed.",
        "stage": "phase3_payment_link",
    },
    {
        "id": "11111111-1111-4111-8111-111111111108",
        "company_name": "FinEdge Advisors",
        "contact_name": "David Kim",
        "contact_email": "david.kim@demo.acelink.test",
        "phone": "9811000008",
        "source": "AceLink Website",
        "industry": "app",
        "lead_status": "closed_won",
        "lead_score": 95,
        "estimated_deal_size": 650000,
        "notes": "Paid in full.",
        "stage": "phase3_paid",
    },
    {
        "id": "11111111-1111-4111-8111-111111111109",
        "company_name": "Rapid Courier",
        "contact_name": "Fatima Hassan",
        "contact_email": "fatima.hassan@demo.acelink.test",
        "phone": "9811000009",
        "source": "AceLink Website",
        "industry": "other",
        "lead_status": "needs_review",
        "lead_score": 60,
        "estimated_deal_size": 400000,
        "notes": "CRM sync failed — human review.",
        "stage": "workbench",
    },
    {
        "id": "11111111-1111-4111-8111-111111111110",
        "company_name": "Lakeview Schools",
        "contact_name": "Chris Morgan",
        "contact_email": "chris.morgan@demo.acelink.test",
        "phone": "9811000010",
        "source": "AceLink Website",
        "industry": "website",
        "lead_status": "negotiation",
        "lead_score": 80,
        "estimated_deal_size": 280000,
        "notes": "Overdue invoice — demo.",
        "stage": "phase3_overdue",
    },
]

# Tables to wipe (children first). policy_violations optional.
WIPE_TABLES = [
    "crm_activity_logs",
    "workbench_reviews",
    "follow_ups",
    "agent_runs",
    "meeting_transcripts",
    "policy_violations",
    "ai_metrics",
    "ai_policies",
    "leads",
]

DEMO_POLICIES = [
    {
        "id": "22222222-2222-4222-8222-222222222201",
        "policy_name": "Minimum Lead Score",
        "policy_description": "Leads scored below 50 require human review before outreach (John blocks Agent B).",
        "active": True,
    },
    {
        "id": "22222222-2222-4222-8222-222222222202",
        "policy_name": "Budget Floor — Chatbot",
        "policy_description": "AI chatbot projects under $500 are flagged in scoring (deterministic rules).",
        "active": True,
    },
    {
        "id": "22222222-2222-4222-8222-222222222203",
        "policy_name": "Full-Stack Low Budget",
        "policy_description": "Full-stack products under $3k are down-ranked; workbench may be required.",
        "active": True,
    },
]

NULL_UUID = "00000000-0000-0000-0000-000000000000"


def _headers(key: str) -> dict[str, str]:
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


async def wipe_table(client: httpx.AsyncClient, base: str, table: str, key: str) -> None:
    """Delete all rows (best-effort)."""
    for col in ("id", "lead_id"):
        r = await client.delete(
            f"{base}/rest/v1/{table}",
            headers=_headers(key),
            params={col: f"neq.{NULL_UUID}"},
        )
        if r.status_code in (200, 204):
            print(f"  cleared {table} (via {col})")
            return
        if r.status_code == 404:
            print(f"  skip {table} (table not found)")
            return
    print(f"  warn {table}: {r.status_code} {r.text[:120]}")


def _activity(
    lead_id: str,
    action_type: str,
    description: str,
    *,
    days_ago: int = 0,
    metadata: dict | None = None,
) -> dict[str, Any]:
    ts = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
    return {
        "lead_id": lead_id,
        "action_type": action_type,
        "action_description": description,
        "performed_by": "seed_script",
        "metadata": metadata or {},
        "created_at": ts,
    }


def activities_for_stage(lead: dict[str, Any]) -> list[dict[str, Any]]:
    lid = lead["id"]
    stage = lead["stage"]
    company = lead["company_name"]
    deposit = min(int(lead["estimated_deal_size"] * 0.3), 150000)

    if stage == "phase1_new":
        return [_activity(lid, "lead_created", f"Lead captured — {company}", days_ago=2)]

    if stage == "phase1_outreach":
        return [
            _activity(lid, "lead_created", f"Lead captured — {company}", days_ago=5),
            _activity(lid, "outreach_dispatched", "Welcome email sent", days_ago=4, metadata={"sent": True}),
        ]

    if stage == "phase1_qualified_no_outreach":
        return [_activity(lid, "lead_created", f"Qualified — outreach skipped (warm tier)", days_ago=3)]

    if stage == "phase2_drafted_not_sent":
        return [
            _activity(lid, "lead_created", "Lead captured", days_ago=10),
            _activity(lid, "outreach_dispatched", "Outreach sent", days_ago=9),
            _activity(lid, "transcript_saved", "Meeting transcript stored", days_ago=7),
            _activity(lid, "contract_drafted", "Contract draft ready", days_ago=6),
        ]

    if stage == "phase2_contract_sent":
        return [
            _activity(lid, "lead_created", "Lead captured", days_ago=12),
            _activity(lid, "outreach_dispatched", "Outreach sent", days_ago=11),
            _activity(lid, "transcript_saved", "Transcript saved", days_ago=8),
            _activity(lid, "contract_drafted", "Contract drafted", days_ago=7),
            _activity(lid, "contract_sent", f"Contract emailed to {lead['contact_email']}", days_ago=6),
        ]

    if stage == "phase3_invoice_sent":
        inv = f"INV-{lid[:8].upper()}"
        return [
            _activity(lid, "lead_created", "Lead captured", days_ago=20),
            _activity(lid, "outreach_dispatched", "Outreach", days_ago=19),
            _activity(lid, "transcript_saved", "Transcript", days_ago=15),
            _activity(lid, "contract_sent", "Contract sent", days_ago=12),
            _activity(lid, "contract_signed", "Contract signed", days_ago=10),
            _activity(
                lid,
                "invoice_generated",
                f"Invoice {inv} — deposit {deposit} USD",
                days_ago=5,
                metadata={
                    "invoice_number": inv,
                    "deposit_amount_usd": deposit,
                    "amount_due_usd": deposit,
                    "payment_status": "link_sent",
                    "email_sent": True,
                },
            ),
        ]

    if stage == "phase3_payment_link":
        inv = f"INV-{lid[:8].upper()}"
        return [
            _activity(lid, "lead_created", "Lead captured", days_ago=18),
            _activity(lid, "contract_sent", "Contract sent", days_ago=14),
            _activity(lid, "contract_signed", "Signed", days_ago=12),
            _activity(
                lid,
                "invoice_generated",
                f"Invoice {inv}",
                days_ago=8,
                metadata={"invoice_number": inv, "deposit_amount_usd": deposit, "amount_due_usd": deposit},
            ),
            _activity(lid, "payment_link_sent", "Payment link email sent", days_ago=7),
        ]

    if stage == "phase3_paid":
        inv = f"INV-{lid[:8].upper()}"
        return [
            _activity(lid, "lead_created", "Lead captured", days_ago=30),
            _activity(lid, "outreach_dispatched", "Outreach", days_ago=28),
            _activity(lid, "contract_sent", "Contract sent", days_ago=20),
            _activity(lid, "invoice_generated", f"Invoice {inv}", days_ago=15, metadata={"deposit_amount_usd": deposit}),
            _activity(lid, "payment_received", "Payment confirmed", days_ago=2),
        ]

    if stage == "phase3_overdue":
        inv = f"INV-{lid[:8].upper()}"
        return [
            _activity(lid, "lead_created", "Lead captured", days_ago=60),
            _activity(lid, "contract_sent", "Contract sent", days_ago=55),
            _activity(
                lid,
                "invoice_generated",
                f"Invoice {inv} — overdue demo",
                days_ago=45,
                metadata={"invoice_number": inv, "deposit_amount_usd": deposit, "amount_due_usd": deposit},
            ),
        ]

    if stage == "workbench":
        return [_activity(lid, "lead_created", "Lead captured", days_ago=4)]

    return []


async def main(reset: bool) -> int:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if url and not url.startswith("http"):
        url = f"https://{url}"
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
        return 1

    async with httpx.AsyncClient(timeout=60.0) as client:
        if reset:
            print("Wiping CRM tables...")
            for table in WIPE_TABLES:
                await wipe_table(client, url, table, key)
            print("Done wiping.\n")

        print("Inserting 10 demo leads...")
        for lead in DEMO_LEADS:
            row = {
                "id": lead["id"],
                "company_name": lead["company_name"],
                "contact_name": lead["contact_name"],
                "contact_email": lead["contact_email"],
                "phone": lead["phone"],
                "source": lead["source"],
                "industry": lead["industry"],
                "lead_status": lead["lead_status"],
                "lead_score": lead["lead_score"],
                "estimated_deal_size": lead["estimated_deal_size"],
                "notes": lead["notes"],
                "created_by_agent": "seed_script",
                "updated_by_agent": "seed_script",
            }
            r = await client.post(
                f"{url}/rest/v1/leads",
                headers={**_headers(key), "Prefer": "return=representation"},
                json=row,
            )
            if r.status_code >= 400:
                print(f"  FAIL lead {lead['contact_name']}: {r.status_code} {r.text[:200]}")
                continue

            acts = activities_for_stage(lead)
            if acts:
                r2 = await client.post(
                    f"{url}/rest/v1/crm_activity_logs",
                    headers=_headers(key),
                    json=acts,
                )
                if r2.status_code >= 400:
                    print(f"  WARN activities {lead['contact_name']}: {r2.text[:120]}")

            if lead["stage"] == "workbench":
                await client.post(
                    f"{url}/rest/v1/workbench_reviews",
                    headers=_headers(key),
                    json={
                        "lead_id": lead["id"],
                        "issue_type": "crm_failed",
                        "issue_description": "Demo workbench — CRM sync needs review",
                        "requested_by_agent": "seed_script",
                        "review_status": "pending",
                    },
                )

            if lead["stage"] in ("phase2_contract_sent", "phase2_drafted_not_sent", "phase3_invoice_sent"):
                await client.post(
                    f"{url}/rest/v1/meeting_transcripts",
                    headers=_headers(key),
                    json={
                        "lead_id": lead["id"],
                        "raw_text": f"Demo transcript for {lead['company_name']}. Scoped budget {lead['estimated_deal_size']}.",
                        "processing_status": "processed",
                        "extracted_company": lead["company_name"],
                        "extracted_contact": lead["contact_name"],
                        "extracted_deal_size": lead["estimated_deal_size"],
                        "extracted_next_steps": "Send contract",
                        "ai_confidence": 0.9,
                    },
                )

            print(f"  + {lead['lead_status']:14} | {lead['contact_name']:18} | {lead['stage']}")

        print("Inserting AI policies...")
        for pol in DEMO_POLICIES:
            r = await client.post(
                f"{url}/rest/v1/ai_policies",
                headers={**_headers(key), "Prefer": "return=minimal"},
                json=pol,
            )
            if r.status_code >= 400:
                print(f"  WARN policy {pol['policy_name']}: {r.text[:100]}")

    print("\nDemo seed complete. Refresh Command Center / Payments / Legal / AI Policies.")
    print("Tristan row: 11111111-1111-4111-8111-111111111104 (tristanhancock@gmail.com)")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-reset", action="store_true", help="Skip wipe (append only)")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(main(reset=not args.no_reset)))
