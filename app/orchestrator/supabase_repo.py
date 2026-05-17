"""Supabase REST client aligned to AceLink CRM schema."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

import httpx

from .config import OrchestratorSettings
from .schemas import LeadPayload, ScoringResult
from .scoring import lead_payload_to_notes, normalize_project_type, parse_budget_usd

log = logging.getLogger(__name__)


class SupabaseRepository:
    def __init__(self, settings: OrchestratorSettings):
        self._url = settings.normalize_supabase_url()
        self._key = settings.supabase_key
        self._headers = {
            "apikey": self._key,
            "Authorization": f"Bearer {self._key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _table(self, name: str) -> str:
        return f"{self._url}/rest/v1/{name}"

    async def _request(
        self,
        method: str,
        table: str,
        *,
        params: dict[str, str] | None = None,
        json_body: Any = None,
        optional: bool = False,
    ) -> list[dict[str, Any]] | dict[str, Any] | None:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.request(
                method,
                self._table(table),
                headers=self._headers,
                params=params,
                json=json_body,
            )
            if r.status_code >= 400:
                log.error("Supabase %s %s: %s", method, table, r.text)
                if optional:
                    return None
                hint = ""
                if r.status_code in (401, 403) or "row-level security" in r.text.lower():
                    hint = " — use service_role key or run scripts/supabase_rls_hackathon.sql"
                raise RuntimeError(f"Supabase {method} {table} failed: {r.text}{hint}") from None
            if r.status_code == 204 or not r.content:
                return None
            data = r.json()
            return data

    async def get_lead(self, lead_id: str) -> dict[str, Any] | None:
        rows = await self._request(
            "GET",
            "leads",
            params={"id": f"eq.{lead_id}", "select": "*"},
        )
        if isinstance(rows, list) and rows:
            return rows[0]
        return None

    async def get_lead_by_email(self, email: str) -> dict[str, Any] | None:
        rows = await self._request(
            "GET",
            "leads",
            params={"contact_email": f"eq.{email}", "select": "*", "limit": "1"},
        )
        if isinstance(rows, list) and rows:
            return rows[0]
        return None

    async def create_lead_from_payload(
        self,
        lead_id: str | None,
        payload: LeadPayload,
        scoring: ScoringResult,
        source: str,
    ) -> dict[str, Any]:
        budget_usd = parse_budget_usd(payload.budget)
        row = {
            "company_name": (payload.company or "Individual").strip() or "Individual",
            "contact_name": payload.name,
            "contact_email": payload.email,
            "phone": payload.phone,
            "source": source,
            "industry": normalize_project_type(payload.project_type),
            "lead_status": "new",
            "lead_score": scoring.score,
            "estimated_deal_size": budget_usd,
            "notes": lead_payload_to_notes(payload, scoring),
            "created_by_agent": "john_local",
            "updated_by_agent": "john_local",
        }
        if lead_id:
            try:
                UUID(lead_id)
                row["id"] = lead_id
            except ValueError:
                pass

        result = await self._request("POST", "leads", json_body=row)
        if isinstance(result, list) and result:
            return result[0]
        if isinstance(result, dict):
            return result
        raise RuntimeError("Failed to create lead in Supabase")

    async def update_lead(
        self,
        lead_id: str,
        updates: dict[str, Any],
        *,
        agent: str = "john_local",
    ) -> dict[str, Any]:
        updates = {
            **updates,
            "updated_by_agent": agent,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        result = await self._request(
            "PATCH",
            "leads",
            params={"id": f"eq.{lead_id}"},
            json_body=updates,
        )
        if isinstance(result, list) and result:
            return result[0]
        return await self.get_lead(lead_id) or {}

    async def log_crm_activity(
        self,
        lead_id: str,
        action_type: str,
        description: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        await self._request(
            "POST",
            "crm_activity_logs",
            json_body={
                "lead_id": lead_id,
                "action_type": action_type,
                "action_description": description,
                "performed_by": "john_local",
                "metadata": metadata or {},
            },
            optional=True,
        )

    async def start_agent_run(
        self,
        *,
        lead_id: str | None = None,
        transcript_id: str | None = None,
        operator_agent: str | None = None,
        reasoning: dict[str, Any],
    ) -> str:
        row = {
            "transcript_id": transcript_id,
            "orchestrator_agent": "john_local",
            "operator_agent": operator_agent,
            "execution_status": "running",
            "reasoning_trace": reasoning,
        }
        result = await self._request("POST", "agent_runs", json_body=row, optional=True)
        run_id = str(uuid4())
        if isinstance(result, list) and result:
            run_id = result[0].get("id", run_id)
        elif isinstance(result, dict):
            run_id = result.get("id", run_id)
        return run_id

    async def complete_agent_run(
        self,
        run_id: str,
        status: str,
        reasoning: dict[str, Any],
    ) -> None:
        await self._request(
            "PATCH",
            "agent_runs",
            params={"id": f"eq.{run_id}"},
            json_body={
                "execution_status": status,
                "reasoning_trace": reasoning,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            },
            optional=True,
        )

    async def list_active_policies(self) -> list[dict[str, Any]]:
        result = await self._request(
            "GET",
            "ai_policies",
            params={"active": "eq.true", "select": "id,policy_name,policy_description"},
            optional=True,
        )
        if isinstance(result, list):
            return result
        return []

    async def create_policy_violation(
        self,
        *,
        lead_id: str,
        policy_id: str,
        violation_reason: str,
        blocked_action: str = "outreach",
    ) -> None:
        await self._request(
            "POST",
            "policy_violations",
            json_body={
                "lead_id": lead_id,
                "violated_policy_id": policy_id,
                "violation_reason": violation_reason,
                "blocked_action": blocked_action,
            },
            optional=True,
        )

    async def create_workbench_review(
        self,
        lead_id: str,
        issue_type: str,
        description: str,
        *,
        transcript_id: str | None = None,
        requested_by: str = "john_local",
    ) -> dict[str, Any]:
        result = await self._request(
            "POST",
            "workbench_reviews",
            json_body={
                "lead_id": lead_id,
                "transcript_id": transcript_id,
                "issue_type": issue_type,
                "issue_description": description,
                "requested_by_agent": requested_by,
                "review_status": "pending",
            },
            optional=True,
        )
        if isinstance(result, list) and result:
            return result[0]
        return result if isinstance(result, dict) else {}

    async def create_transcript(
        self,
        raw_text: str,
        *,
        lead_id: str | None = None,
        extracted: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        ext = extracted or {}
        row: dict[str, Any] = {
            "raw_text": raw_text,
            "processing_status": "processed",
            "extracted_company": ext.get("company"),
            "extracted_contact": ext.get("contact"),
            "extracted_deal_size": ext.get("deal_size"),
            "extracted_next_steps": ext.get("next_steps"),
            "ai_confidence": ext.get("confidence", 0.85),
        }
        if lead_id:
            row["lead_id"] = lead_id
        result = await self._request("POST", "meeting_transcripts", json_body=row, optional=True)
        if isinstance(result, list) and result:
            return result[0]
        return result if isinstance(result, dict) else {}

    async def record_metric(self, name: str, value: float, metadata: dict | None = None) -> None:
        await self._request(
            "POST",
            "ai_metrics",
            json_body={
                "metric_name": name,
                "metric_value": value,
                "metadata": metadata or {},
            },
            optional=True,
        )
