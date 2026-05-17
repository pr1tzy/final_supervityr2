"""Deterministic lead scoring — no LLM required."""

from __future__ import annotations

import re
from typing import Any

from .schemas import LeadPayload, ScoringResult

PROJECT_SLUG_MAP = {
    "websites": "website",
    "website": "website",
    "ai chatbot": "ai_chatbot",
    "ai_chatbot": "ai_chatbot",
    "chatbot": "ai_chatbot",
    "internal tool": "internal_tool",
    "internal_tool": "internal_tool",
    "fullstack": "fullstack_product",
    "full stack": "fullstack_product",
    "fullstack_product": "fullstack_product",
}


def normalize_project_type(raw: str | None) -> str:
    if not raw:
        return "other"
    key = raw.strip().lower()
    return PROJECT_SLUG_MAP.get(key, key.replace(" ", "_"))


def parse_budget_usd(budget: str | None) -> float | None:
    if not budget:
        return None
    text = budget.lower().replace(",", "")
    # Indian lakhs: "5 lakhs", "5l", "₹5,00,000"
    lakh = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakhs?|l\b)", text)
    if lakh:
        return float(lakh.group(1)) * 100_000 / 83.0  # rough INR→USD for scoring
    inr = re.search(r"₹\s*([\d.]+)", text)
    if inr:
        return float(inr.group(1)) / 83.0
    usd_k = re.search(r"\$\s*(\d+(?:\.\d+)?)\s*k", text)
    if usd_k:
        return float(usd_k.group(1)) * 1000
    usd = re.search(r"\$\s*(\d+(?:,\d{3})*(?:\.\d+)?)", text)
    if usd:
        return float(usd.group(1).replace(",", ""))
    plain = re.search(r"(\d{4,})", text)
    if plain:
        n = float(plain.group(1))
        return n / 83.0 if n > 10000 else n
    return None


def score_lead(payload: LeadPayload) -> ScoringResult:
    breakdown: list[dict[str, Any]] = [{"rule": "base", "delta": 50}]
    score = 50

    project_type = normalize_project_type(payload.project_type)
    complexity_delta = {
        "ai_chatbot": 0,
        "website": 5,
        "internal_tool": 5,
        "fullstack_product": 15,
        "other": -10,
    }.get(project_type, -10)
    score += complexity_delta
    breakdown.append({"rule": "project_type", "delta": complexity_delta, "value": project_type})

    budget_usd = parse_budget_usd(payload.budget)
    if budget_usd is None:
        score -= 5
        breakdown.append({"rule": "budget_unknown", "delta": -5})
    elif project_type == "fullstack_product" and budget_usd < 3000:
        score -= 35
        breakdown.append({"rule": "fullstack_low_budget", "delta": -35})
    elif project_type == "ai_chatbot" and budget_usd < 500:
        score -= 25
        breakdown.append({"rule": "chatbot_low_budget", "delta": -25})
    elif project_type == "website" and budget_usd < 1000:
        score -= 20
        breakdown.append({"rule": "website_low_budget", "delta": -20})
    elif budget_usd >= 5000:
        score += 15
        breakdown.append({"rule": "budget_strong", "delta": 15})
    elif budget_usd >= 2000:
        score += 8
        breakdown.append({"rule": "budget_ok", "delta": 8})

    timeline = (payload.timeline or "").lower()
    if "asap" in timeline or re.search(r"<\s*2\s*week", timeline):
        if project_type == "fullstack_product":
            score -= 20
            breakdown.append({"rule": "aggressive_timeline", "delta": -20})
    elif timeline:
        score += 5
        breakdown.append({"rule": "timeline_provided", "delta": 5})
    else:
        score -= 5
        breakdown.append({"rule": "timeline_missing", "delta": -5})

    if payload.email:
        score += 10
        breakdown.append({"rule": "email", "delta": 10})
    if payload.phone:
        score += 5
        breakdown.append({"rule": "phone", "delta": 5})
    desc = payload.model_extra.get("project_description") if hasattr(payload, "model_extra") else None
    if desc and len(str(desc)) > 30:
        score += 10
        breakdown.append({"rule": "description", "delta": 10})

    score = max(0, min(100, score))

    if score >= 70:
        tier = "hot"
    elif score >= 45:
        tier = "warm"
    else:
        tier = "cold"

    outreach_approved = tier == "hot" or (
        tier == "warm" and bool(payload.email) and bool(payload.project_type)
    )

    return ScoringResult(
        score=score,
        tier=tier,
        outreach_approved=outreach_approved,
        breakdown=breakdown,
    )


def lead_payload_to_notes(payload: LeadPayload, scoring: ScoringResult) -> str:
    avail = payload.availability
    if isinstance(avail, list):
        avail_str = ", ".join(avail)
    else:
        avail_str = str(avail or "")
    return (
        f"project_type={normalize_project_type(payload.project_type)}; "
        f"budget={payload.budget}; timeline={payload.timeline}; "
        f"availability={avail_str}; tier={scoring.tier}; score={scoring.score}"
    )
