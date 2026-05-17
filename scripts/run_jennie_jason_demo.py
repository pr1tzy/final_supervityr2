#!/usr/bin/env python3
"""CLI: Jennie + Jason demo (optionally seeds lead via Jack)."""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.orchestrator.demo_jennie_jason import run_jennie_jason_demo


async def main() -> None:
    lead_id = sys.argv[1] if len(sys.argv) > 1 else None
    print("Jennie + Jason demo (seeds Jack if no lead_id)...")
    result = await run_jennie_jason_demo(lead_id=lead_id, seed_with_jack=lead_id is None)
    print(json.dumps(result.model_dump(), indent=2, default=str))
    for s in result.steps:
        icon = "OK" if s.success else "FAIL"
        print(f"  [{icon}] {s.agent}.{s.task} — {s.status} — {s.summary[:120]}")


if __name__ == "__main__":
    asyncio.run(main())
