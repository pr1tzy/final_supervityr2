"""Input builders for 4 consolidated Auto agents + optional RAG."""

from __future__ import annotations

import json
from typing import Any

from .config import OrchestratorSettings


def build_crm_inputs(
    settings: OrchestratorSettings,
    *,
    operation: str,
    lead_id: str,
    payload: dict[str, Any],
) -> dict[str, str]:
    url = settings.normalize_supabase_url()
    token = settings.supabase_key
    request = {
        "operation": operation,
        "lead_id": lead_id,
        "payload": _crm_payload(payload) if operation == "create_lead" else payload,
        # Agent A code often reads these exact names from parsed request_json
        "SUPABASE_URL": url,
        "SUPABASE_TOKEN": token,
        "supabase_url": url,
        "supabase_token": token,
    }
    return {
        "request_json": json.dumps(request, default=str),
        # Auto workflows vary — send all common aliases
        "input_supabase_url": url,
        "input_supabase_token": token,
        "SUPABASE_URL": url,
        "SUPABASE_TOKEN": token,
        "supabase_url": url,
        "supabase_token": token,
    }


def build_email_inputs(
    *,
    operation: str,
    lead_id: str,
    snap: dict[str, Any],
    subject: str = "",
    body_html: str = "",
) -> dict[str, str]:
    """Flat inputs matching Auto Agent B (operation, to_address, …)."""
    out: dict[str, str] = {
        "operation": operation,
        "lead_id": lead_id,
        "full_name": _name(snap),
        "company_name": str(snap.get("company_name") or "Individual"),
        "project_type": str(snap.get("project_type") or "website"),
        "preliminary_budget": str(
            snap.get("preliminary_budget") or snap.get("budget") or ""
        ),
        "to_address": str(snap.get("email") or snap.get("contact_email") or ""),
        "subject": subject,
        "body_html": body_html,
    }
    return out


def build_legal_inputs(
    *,
    task: str,
    snap: dict[str, Any],
    lead_id: str,
    contract_markdown: str = "",
) -> dict[str, str]:
    return {
        "task": task,
        "lead_id": lead_id,
        "human_override": "false",
        "client_email": str(snap.get("email") or ""),
        "client_name": _name(snap),
        "company_name": str(snap.get("company_name") or "Individual"),
        "project_type": str(snap.get("project_type") or "website"),
        "project_description": str(snap.get("project_description") or "Website project"),
        "scoped_budget": str(snap.get("scoped_budget") or "500000"),
        "scoped_timeline": str(snap.get("scoped_timeline") or "October 2026"),
        "pipeline_stage": str(snap.get("pipeline_stage") or "scoped"),
        "custom_clauses": "",
        "signed_pdf_url": "",
        "contract_markdown": contract_markdown[:50000] if contract_markdown else "",
    }


def build_payment_inputs(
    snap: dict[str, Any], lead_id: str, deposit_usd: int = 150000
) -> dict[str, str]:
    return {
        "lead_id": lead_id,
        "client_email": str(snap.get("email") or ""),
        "client_name": _name(snap),
        "contract_status": "signed",
        "scoped_budget": str(snap.get("scoped_budget") or "500000"),
        "deposit_amount_usd": str(deposit_usd),
        "slack_channel": "#sales-ops",
    }


def build_rag_inputs(query: str, caller: str = "crm") -> dict[str, str]:
    return {
        "input_json": json.dumps({"query": query, "caller": caller}, default=str),
    }


def build_check_inputs(
    settings: OrchestratorSettings,
    *,
    lead_id: str,
    client_email: str = "",
    client_name: str = "",
    silence_threshold_days: int = 4,
    signed_pdf_url: str = "",
    doc_type: str = "signed_contract",
    expected_name: str = "",
    expected_amount_usd: float | int = 0,
    slack_channel: str = "",
) -> dict[str, str]:
    """
    Agent E — runs only when action=check.
    Command Center / John call this on button click (no cron).
    """
    return {
        "action": "check",
        "lead_id": lead_id,
        "client_email": client_email,
        "client_name": client_name,
        "silence_threshold_days": str(silence_threshold_days),
        "signed_pdf_url": signed_pdf_url,
        "doc_type": doc_type,
        "expected_name": expected_name or client_name,
        "expected_amount_usd": str(expected_amount_usd),
        "slack_channel": slack_channel,
    }


def _crm_payload(snap: dict[str, Any]) -> dict[str, Any]:
    return {
        "email": snap.get("email") or snap.get("contact_email"),
        "full_name": _name(snap),
        "phone": snap.get("phone") or "",
        "company_name": snap.get("company_name") or snap.get("company") or "Individual",
        "project_type": snap.get("project_type") or "website",
        "preliminary_budget": snap.get("preliminary_budget") or snap.get("budget") or "",
        "preliminary_timeline": snap.get("preliminary_timeline") or snap.get("timeline") or "",
        "notes": snap.get("notes") or "",
    }


def _name(snap: dict[str, Any]) -> str:
    return str(
        snap.get("full_name") or snap.get("contact_name") or snap.get("name") or "Unknown"
    )
