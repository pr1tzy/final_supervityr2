"""Tests for lead scoring."""

from app.orchestrator.schemas import LeadPayload
from app.orchestrator.scoring import normalize_project_type, parse_budget_usd, score_lead


def test_normalize_websites():
    assert normalize_project_type("Websites") == "website"


def test_parse_lakhs():
    assert parse_budget_usd("around 5 lakhs") is not None
    assert parse_budget_usd("around 5 lakhs") > 1000


def test_tristan_lead_hot_or_warm():
    payload = LeadPayload(
        name="Tristan Singh",
        email="a8f8yt@gmail.com",
        phone="9819861904",
        company="ovelia health",
        project_type="Websites",
        budget="around 5 lakhs",
        timeline="by the end of october 2026",
        availability=["thursday 7pm"],
    )
    result = score_lead(payload)
    assert result.score >= 45
    assert result.tier in ("hot", "warm")
    assert result.outreach_approved is True


def test_low_budget_fullstack_cold():
    payload = LeadPayload(
        email="x@y.com",
        project_type="fullstack_product",
        budget="$100",
    )
    result = score_lead(payload)
    assert result.tier == "cold"
    assert result.outreach_approved is False
