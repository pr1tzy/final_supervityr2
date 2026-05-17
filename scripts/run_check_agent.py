#!/usr/bin/env python3
"""Test Agent E — POST body action=check."""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.orchestrator.check_runner import CheckRequest, run_check


async def main() -> None:
    lead_id = sys.argv[1] if len(sys.argv) > 1 else ""
    pdf_url = sys.argv[2] if len(sys.argv) > 2 else ""
    if not lead_id:
        print("Usage: python scripts/run_check_agent.py <lead_id> [signed_pdf_url]")
        sys.exit(1)

    resp = await run_check(
        CheckRequest(
            action="check",
            lead_id=lead_id,
            signed_pdf_url=pdf_url,
            silence_threshold_days=4,
        )
    )
    print(json.dumps(resp.model_dump(), indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(main())
