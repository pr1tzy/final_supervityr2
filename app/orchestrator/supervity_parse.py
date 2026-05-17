"""Parse structured operator results from Supervity workflowRun.activityRuns."""

from __future__ import annotations

import json
import re
from typing import Any


def parse_operator_output(
    agent: str,
    supervity_output: dict[str, Any],
    *,
    operation: str | None = None,
    step_id_contains: str | None = None,
) -> dict[str, Any]:
    """
    Extract JSON from activity steps. Prefer success=true and matching operation/step.
    """
    agent = agent.lower()
    wr = supervity_output.get("workflowRun")
    if not isinstance(wr, dict):
        return {"parsed": False, "reason": "no workflowRun in response"}

    activity_runs = wr.get("activityRuns") or []
    parsed_steps: list[dict[str, Any]] = []
    candidates: list[tuple[int, dict[str, Any]]] = []

    for ar in activity_runs:
        if not isinstance(ar, dict):
            continue
        sid = str(ar.get("stepId") or "")
        step = {
            "step_id": sid,
            "step_name": ar.get("stepName"),
            "status": ar.get("status"),
        }
        outputs = ar.get("outputs") or {}
        raw = outputs.get("output") or outputs.get("result") or ""
        data: dict[str, Any] | None = None
        if isinstance(raw, dict):
            data = raw
        elif isinstance(raw, str) and raw.strip():
            parsed = _try_parse_json(raw)
            if isinstance(parsed, dict):
                data = parsed

        if data:
            step["data"] = data
            score = _score_result(data, operation, sid, step_id_contains)
            candidates.append((score, data))
        elif isinstance(raw, str) and raw.strip():
            step["text"] = raw.strip()
        parsed_steps.append(step)

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        best_score, best = candidates[0]
        if best_score >= 0:
            return {
                "parsed": True,
                "agent": agent,
                "run_id": wr.get("id"),
                "workflow_status": wr.get("status"),
                "result": best,
                "steps": parsed_steps,
            }

    return {
        "parsed": False,
        "agent": agent,
        "workflow_status": wr.get("status"),
        "steps": parsed_steps,
        "reason": "no JSON result in activity outputs",
    }


def find_step_result(
    supervity_output: dict[str, Any], *step_id_parts: str
) -> dict[str, Any]:
    """Return parsed JSON from first activity whose stepId contains any of step_id_parts."""
    wr = supervity_output.get("workflowRun")
    if not isinstance(wr, dict):
        return {}
    for ar in wr.get("activityRuns") or []:
        if not isinstance(ar, dict):
            continue
        sid = str(ar.get("stepId") or "").lower()
        if not any(p.lower() in sid for p in step_id_parts):
            continue
        raw = (ar.get("outputs") or {}).get("output") or ""
        if isinstance(raw, dict):
            return raw
        if isinstance(raw, str):
            data = _try_parse_json(raw)
            if isinstance(data, dict):
                return data
    return {}


def _score_result(
    data: dict[str, Any],
    operation: str | None,
    step_id: str,
    step_id_contains: str | None,
) -> int:
    score = 0
    if data.get("success") is True:
        score += 10
    if data.get("success") is False:
        score -= 30
    if operation and data.get("operation") == operation:
        score += 25
    sid = step_id.lower()
    if operation and operation in sid:
        score += 15
    if step_id_contains and step_id_contains.lower() in sid:
        score += 20
    if data.get("error"):
        score -= 40
    return score


def _try_parse_json(text: str) -> dict[str, Any] | list[Any] | None:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
    return None
