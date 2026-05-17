#!/usr/bin/env python3
"""CLI: run full AceLink dummy agent scenario (Jack → Gap)."""

import asyncio
import json
import sys
from pathlib import Path

# project root on path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.orchestrator.demo_scenario import run_full_demo_scenario


async def main() -> None:
    stop = sys.argv[1] if len(sys.argv) > 1 else "all"
    print(f"Starting demo scenario (stop_after={stop}) — this may take several minutes...\n")
    result = await run_full_demo_scenario(stop_after=stop)  # type: ignore[arg-type]
    print(json.dumps(result.model_dump(), indent=2, default=str))
    print(f"\n{'='*60}")
    print(result.message)
    print(f"Passed: {result.agents_passed}/{len(result.steps)} in {result.total_seconds}s")
    for s in result.steps:
        icon = "OK" if s.success else "FAIL"
        print(f"  [{icon}] Step {s.step} {s.agent}.{s.task} — {s.status} ({s.duration_seconds}s)")


if __name__ == "__main__":
    asyncio.run(main())
