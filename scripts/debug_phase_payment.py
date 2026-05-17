#!/usr/bin/env python3
import asyncio
import traceback
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.orchestrator import JohnOrchestrator
from app.orchestrator.pipeline_phases import run_phase_payment


async def main() -> None:
    lead_id = "153a4581-b3b5-48d3-9cde-7890abcc0e35"
    j = JohnOrchestrator()
    try:
        r = await run_phase_payment(j, lead_id=lead_id, deposit_usd=150000)
        print("OK", r.success, r.message)
        print("trace keys", list((r.reasoning_trace or {}).keys()))
    except Exception:
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
