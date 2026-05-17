"""Deterministic outreach copy — John must supply body (Auto Email Send does not draft)."""

from __future__ import annotations

from typing import Any

from .scoring import ScoringResult


def build_outreach_email(
    snap: dict[str, Any],
    scoring: ScoringResult | None = None,
) -> tuple[str, str]:
    name = (
        snap.get("full_name")
        or snap.get("contact_name")
        or snap.get("name")
        or "there"
    )
    company = snap.get("company_name") or snap.get("company") or "your company"
    project = (snap.get("project_type") or "website").replace("_", " ")
    budget = snap.get("preliminary_budget") or snap.get("budget") or "your stated budget"
    tier = scoring.tier if scoring else snap.get("orchestrator_tier") or "warm"

    subject = f"AceLink — next steps for {company}'s {project} project"

    body_html = f"""
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
  <p>Hi {name},</p>
  <p>Thanks for reaching out to <strong>AceLink</strong>. We received your inquiry about a
  <strong>{project}</strong> engagement for <strong>{company}</strong>.</p>
  <p>Based on what you shared (budget: {budget}), our team has classified this as a
  <strong>{tier}</strong> opportunity and assigned a specialist to your account.</p>
  <p><strong>What happens next</strong></p>
  <ol>
    <li>15-minute discovery call to confirm scope and timeline</li>
    <li>Scoped proposal and service agreement (PDF for e-signature)</li>
    <li>Deposit link to kick off delivery</li>
  </ol>
  <p>Reply to this email with your availability this week, or book via our calendar link.</p>
  <p>Best regards,<br/>
  <strong>AceLink Sales</strong><br/>
  <a href="mailto:sales@acelink.com">sales@acelink.com</a></p>
</div>
""".strip()

    return subject, body_html
