#!/usr/bin/env python3
"""Run Phase 1 → 2 → 3 via local John API (needs backend + .env)."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

BASE = os.getenv("ORCHESTRATOR_BASE_URL", "http://127.0.0.1:8001").rstrip("/")
SECRET = os.getenv("ORCHESTRATOR_WEBHOOK_SECRET", "")
API = f"{BASE}/api/orchestrator"
HEADERS = {"X-Webhook-Secret": SECRET, "Content-Type": "application/json"}


def post(path: str, body: dict) -> dict:
    r = httpx.post(f"{API}{path}", headers=HEADERS, json=body, timeout=600.0)
    print(f"\n=== POST {path} → {r.status_code} ===")
    data = r.json()
    print(json.dumps(data, indent=2, default=str)[:2000])
    r.raise_for_status()
    return data


def main() -> int:
    uid = os.urandom(4).hex()
    email = f"phase-test-{uid}@acelink.test"

    p1 = post(
        "/webhook/lead",
        {
            "event": "lead_created",
            "source": "phase_pipeline_test",
            "lead_payload": {
                "name": f"Phase Test {uid}",
                "email": email,
                "company": "AceLink QA",
                "project_type": "website",
                "budget": "5 lakhs",
                "timeline": "October 2026",
            },
        },
    )
    lead_id = p1.get("lead_id")
    if not lead_id:
        print("Phase 1 failed — no lead_id")
        return 1

    p2 = post(
        "/phase/legal",
        {
            "lead_id": lead_id,
            "transcript_payload": {
                "project_description": (
                    "Marketing website with blog, CMS, and contact form. "
                    "Budget 5 lakhs. Go-live October 2026."
                ),
                "scoped_budget": "500000",
                "scoped_timeline": "October 2026",
            },
        },
    )
    if not p2.get("success"):
        print("Phase 2 reported failure — check Supervity legal workflow")
        return 1

    p3 = post(
        "/phase/payment",
        {"lead_id": lead_id, "deposit_amount_usd": 150000},
    )
    if not p3.get("success"):
        print("Phase 3 reported failure — check Supervity payment workflow")
        return 1

    print(f"\nOK — pipeline complete for lead_id={lead_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
