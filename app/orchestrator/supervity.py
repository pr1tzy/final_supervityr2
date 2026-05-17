"""Trigger Supervity Auto operator workflows via REST API (stream + poll)."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import httpx

from .config import OrchestratorSettings
from .schemas import SubflowResult
from .supervity_parse import parse_operator_output

log = logging.getLogger(__name__)


class SupervityClient:
    """
    POST /api/v1/workflow-runs/execute/stream
    multipart: workflowId, inputs[key]=value
  Headers: Authorization Bearer, x-source: v1
    """

    def __init__(self, settings: OrchestratorSettings):
        self._settings = settings
        self._base = settings.workflow_svc_url.rstrip("/")
        self._token = settings.supervity_token
        self._execute_path = settings.supervity_execute_path
        self._source = settings.supervity_source_header
        self._active_org = settings.supervity_active_org
        self._active_team = settings.supervity_active_team
        self._supabase_url = settings.normalize_supabase_url()
        self._supabase_token = settings.supabase_key
        self._poll_interval = settings.supervity_poll_seconds
        self._poll_max = settings.supervity_poll_max_attempts
        self._mock = settings.supervity_mock_mode
        s = settings
        self._workflows = {
            "jack": s.workflow_jack,
            "jim": s.workflow_jim,
            "jennie": s.workflow_jennie,
            "jason": s.workflow_jason,
            "gap": s.workflow_gap,
            "crm": s.workflow_crm or s.workflow_jack,
            "email": s.workflow_email or s.workflow_jim,
            "legal": s.workflow_legal or s.workflow_jennie,
            "payment": s.workflow_payment or s.workflow_jason,
            "rag": s.workflow_rag,
            "check": s.workflow_check or s.workflow_gap,
            "monitor": s.workflow_check or s.workflow_gap,
            # legacy aliases
            "crm_create": s.workflow_crm or s.workflow_jack,
            "crm_update": s.workflow_crm or s.workflow_jack,
            "email_draft": s.workflow_email or s.workflow_jim,
            "email_send": s.workflow_email or s.workflow_jim,
            "legal_draft": s.workflow_legal or s.workflow_jennie,
            "legal_send": s.workflow_legal or s.workflow_jennie,
            "payment_link": s.workflow_payment or s.workflow_jason,
        }

    def _headers(self) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self._token}",
            "x-source": self._source,
        }
        if self._active_org:
            headers["x-active-org"] = self._active_org
        if self._active_team:
            headers["x-active-team"] = self._active_team
        return headers

    def workflow_id_for(self, agent: str) -> str | None:
        key = agent.lower()
        if key == "ocr":
            key = "jason"
        wid = self._workflows.get(key)
        return wid if wid else None

    async def execute_workflow(
        self,
        agent: str,
        inputs: dict[str, str],
        *,
        wait_for_completion: bool = True,
    ) -> SubflowResult:
        workflow_id = self.workflow_id_for(agent)
        if not workflow_id:
            return SubflowResult(
                agent=agent,
                workflow_id="",
                status="SKIPPED",
                error=f"No WORKFLOW_ID configured for agent '{agent}'",
            )

        if self._mock:
            log.warning("Supervity MOCK: %s task=%s", agent, inputs.get("task") or inputs.get("operation"))
            return SubflowResult(
                agent=agent,
                workflow_id=workflow_id,
                status="MOCK_OK",
                output={
                    "message": "SUPERVITY_MOCK_MODE — set WORKFLOW_SVC_URL + SUPERVITY_API_TOKEN",
                    "inputs_received": inputs,
                    "mock": True,
                },
            )

        form: dict[str, str] = {"workflowId": workflow_id}
        for key, value in inputs.items():
            form[f"inputs[{key}]"] = value if isinstance(value, str) else str(value)

        try:
            body, run_id, stream_events = await self._execute_stream(form)
        except Exception as stream_err:
            log.warning("Stream execute failed (%s), trying sync execute", stream_err)
            try:
                body, run_id = await self._execute_sync(form)
                stream_events = []
            except Exception as e:
                log.exception("Supervity execute failed for %s", agent)
                return SubflowResult(
                    agent=agent,
                    workflow_id=workflow_id,
                    status="ERROR",
                    error=str(e),
                )

        output: dict[str, Any] = body if isinstance(body, dict) else {"raw": body}
        if stream_events:
            output["stream_events"] = stream_events[-20:]

        status = _resolve_status(output)
        run_id = run_id or _extract_run_id(output.get("workflowRun"))

        if (
            wait_for_completion
            and run_id
            and status not in ("COMPLETED", "FAILED", "CANCELLED", "SUCCESS")
        ):
            polled = await self._poll_run(run_id)
            output = {**output, **polled}
            status = _resolve_status(polled)

        parsed = parse_operator_output(agent, output)

        return SubflowResult(
            agent=agent,
            workflow_id=workflow_id,
            run_id=run_id,
            status=status,
            output=output,
            parsed=parsed,
            error=parsed.get("reason") if not parsed.get("parsed") and status == "FAILED" else None,
        )

    async def _execute_stream(
        self, form: dict[str, str]
    ) -> tuple[dict[str, Any], str | None, list[dict[str, Any]]]:
        url = f"{self._base}{self._execute_path}"
        events: list[dict[str, Any]] = []
        last_payload: dict[str, Any] = {}
        run_id: str | None = None

        async with httpx.AsyncClient(timeout=httpx.Timeout(300.0, connect=30.0)) as client:
            async with client.stream("POST", url, data=form, headers=self._headers()) as resp:
                resp.raise_for_status()
                content_type = resp.headers.get("content-type", "")

                if "text/event-stream" in content_type or "stream" in self._execute_path:
                    async for line in resp.aiter_lines():
                        if not line or not line.startswith("data:"):
                            continue
                        raw = line[5:].strip()
                        if raw in ("", "[DONE]"):
                            continue
                        try:
                            evt = json.loads(raw)
                        except json.JSONDecode(json.JSONDecodeError, ValueError):
                            continue
                        events.append(evt)
                        if isinstance(evt, dict):
                            last_payload = evt
                            rid = _extract_run_id(evt)
                            if rid:
                                run_id = rid
                else:
                    body = await resp.aread()
                    last_payload = json.loads(body) if body else {}
                    run_id = _extract_run_id(last_payload)

        merged = _merge_stream_result(events, last_payload)
        if not run_id:
            run_id = _extract_run_id(merged)
        return merged, run_id, events

    async def _execute_sync(self, form: dict[str, str]) -> tuple[dict[str, Any], str | None]:
        path = self._execute_path.replace("/stream", "")
        if path == self._execute_path:
            path = "/api/v1/workflow-runs/execute"
        url = f"{self._base}{path}"

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, data=form, headers=self._headers())
            resp.raise_for_status()
            body = resp.json()
        return body if isinstance(body, dict) else {"raw": body}, _extract_run_id(body)

    async def _poll_run(self, run_id: str) -> dict[str, Any]:
        url = f"{self._base}/api/v1/workflow-runs/{run_id}"

        for _ in range(self._poll_max):
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.get(url, headers=self._headers())
                if r.status_code >= 400:
                    await asyncio.sleep(self._poll_interval)
                    continue
                data = r.json()
            status = (data.get("status") or "").lower()
            if status in ("completed", "failed", "cancelled", "success"):
                return data
            await asyncio.sleep(self._poll_interval)

        return {"status": "timeout", "run_id": run_id}

    def build_workflow_inputs(
        self,
        agent: str,
        *,
        lead_id: str,
        operation_or_task: str,
        payload: dict[str, Any],
        correlation_id: str | None = None,
    ) -> dict[str, str]:
        """Build multipart form fields matching each operator's Auto workflow inputs."""
        agent = agent.lower()
        if agent == "jack":
            return self.build_jack_inputs(
                lead_id=lead_id,
                operation=operation_or_task,
                payload=payload,
                correlation_id=correlation_id,
            )
        if agent == "jim":
            return self.build_jim_inputs(
                lead_id=lead_id,
                task=operation_or_task,
                payload=payload,
                correlation_id=correlation_id,
            )
        if agent == "jennie":
            snap = payload.get("crm_snapshot") or payload
            return self.build_jennie_inputs(
                task=operation_or_task,
                lead_id=lead_id,
                snap=snap,
                human_override=bool(payload.get("human_override", False)),
                signed_pdf_url=str(payload.get("signed_pdf_url", "")),
            )
        if agent == "jason":
            snap = payload.get("crm_snapshot") or payload
            return self.build_jason_inputs(
                lead_id=lead_id,
                snap=snap,
                contract_status=str(payload.get("contract_status", "signed")),
                deposit_amount_usd=payload.get("deposit_amount_usd", 150000),
                slack_channel=str(payload.get("slack_channel", "#sales-ops")),
            )
        return self.build_operator_inputs(
            lead_id=lead_id,
            operation_or_task=operation_or_task,
            payload=payload,
            correlation_id=correlation_id,
        )

    def build_jack_inputs(
        self,
        *,
        lead_id: str,
        operation: str,
        payload: dict[str, Any],
        correlation_id: str | None = None,
        requested_by: str = "john_local",
    ) -> dict[str, str]:
        """
        Jack Auto workflow expects:
          inputs[request_json], inputs[input_supabase_url], inputs[input_supabase_token]

        request_json shape (lead fields MUST be inside payload, not top-level):
          { operation, lead_id, correlation_id, requested_by, payload: { email, full_name, ... } }
        """
        snap = payload.get("crm_snapshot") or payload.get("payload") or payload
        lead_payload = self._jack_lead_payload(snap)

        if operation == "enrich_from_transcript":
            inner = payload.get("payload") or payload
            lead_payload.update(
                {
                    "project_description": inner.get("project_description"),
                    "scoped_budget": inner.get("scoped_budget"),
                    "scoped_timeline": inner.get("scoped_timeline"),
                    "meeting_transcript_summary": inner.get("meeting_transcript_summary"),
                    "project_categories": inner.get("project_categories", []),
                }
            )

        request = {
            "operation": operation,
            "lead_id": lead_id,
            "correlation_id": correlation_id or lead_id,
            "requested_by": payload.get("requested_by", requested_by),
            "payload": lead_payload,
        }

        return {
            "request_json": json.dumps(request, default=str),
            "input_supabase_url": self._supabase_url,
            "input_supabase_token": self._supabase_token,
        }

    @staticmethod
    def _jack_lead_payload(snap: dict[str, Any]) -> dict[str, Any]:
        """Fields Jack reads from request_json.payload → maps to Supabase columns."""
        return {
            "email": snap.get("email") or snap.get("contact_email"),
            "full_name": snap.get("full_name") or snap.get("contact_name") or snap.get("name"),
            "phone": snap.get("phone"),
            "company_name": snap.get("company_name") or snap.get("company") or "Individual",
            "project_type": snap.get("project_type") or snap.get("industry") or "other",
            "project_description": snap.get("project_description", ""),
            "project_categories": snap.get("project_categories", []),
            "preliminary_budget": snap.get("preliminary_budget") or snap.get("budget"),
            "preliminary_timeline": snap.get("preliminary_timeline") or snap.get("timeline"),
            "preferred_contact_times": snap.get("preferred_contact_times"),
            "orchestrator_interest_score": snap.get("orchestrator_interest_score"),
            "orchestrator_tier": snap.get("orchestrator_tier"),
            "outreach_approved": snap.get("outreach_approved"),
        }

    def build_jim_inputs(
        self,
        *,
        lead_id: str,
        task: str,
        payload: dict[str, Any],
        correlation_id: str | None = None,
    ) -> dict[str, str]:
        """
        Jim Auto workflow expects:
          inputs[input_json]
        """
        snap = payload.get("crm_snapshot") or payload
        body = {
            "task": task,
            "lead_id": lead_id,
            "correlation_id": correlation_id or lead_id,
            "outreach_approved": payload.get("outreach_approved", True),
            "orchestrator_tier": payload.get("orchestrator_tier", "hot"),
            "crm_snapshot": snap,
        }
        return {"input_json": json.dumps(body, default=str)}

    def build_jennie_inputs(
        self,
        *,
        task: str,
        lead_id: str,
        snap: dict[str, Any],
        human_override: bool = False,
        signed_pdf_url: str = "",
    ) -> dict[str, str]:
        """
        Jennie Auto workflow flat inputs (multipart form fields).
        """
        budget = _numeric_budget(snap.get("scoped_budget") or snap.get("preliminary_budget"))
        return {
            "task": task,
            "lead_id": lead_id,
            "human_override": "true" if human_override else "false",
            "client_email": str(snap.get("email") or snap.get("contact_email") or ""),
            "client_name": str(
                snap.get("full_name") or snap.get("contact_name") or snap.get("name") or ""
            ),
            "company_name": str(snap.get("company_name") or snap.get("company") or "Individual"),
            "project_type": str(snap.get("project_type") or "website"),
            "project_description": str(
                snap.get("project_description")
                or "Demo: AceLink marketing website with booking and CMS."
            ),
            "scoped_budget": str(budget),
            "scoped_timeline": str(snap.get("scoped_timeline") or "October 2026"),
            "pipeline_stage": str(snap.get("pipeline_stage") or "scoped"),
            "custom_clauses": str(snap.get("custom_clauses") or ""),
            "signed_pdf_url": signed_pdf_url,
        }

    def build_jason_inputs(
        self,
        *,
        lead_id: str,
        snap: dict[str, Any],
        contract_status: str = "signed",
        deposit_amount_usd: int | float = 150000,
        slack_channel: str = "#sales-ops",
    ) -> dict[str, str]:
        """
        Jason Auto workflow flat inputs (payment + OCR).
        """
        budget = _numeric_budget(snap.get("scoped_budget") or snap.get("preliminary_budget"))
        return {
            "lead_id": lead_id,
            "client_email": str(snap.get("email") or snap.get("contact_email") or ""),
            "client_name": str(
                snap.get("full_name") or snap.get("contact_name") or snap.get("name") or ""
            ),
            "contract_status": contract_status,
            "scoped_budget": str(budget),
            "deposit_amount_usd": str(int(deposit_amount_usd)),
            "slack_channel": slack_channel,
        }

    def build_operator_inputs(
        self,
        *,
        lead_id: str,
        operation_or_task: str,
        payload: dict[str, Any],
        correlation_id: str | None = None,
    ) -> dict[str, str]:
        """Legacy/generic shape for Jennie, Jason, Gap until mapped."""
        return {
            "lead_id": lead_id,
            "operation": operation_or_task,
            "task": operation_or_task,
            "correlation_id": correlation_id or lead_id,
            "payload_json": json.dumps(payload, default=str),
            "crm_snapshot_json": json.dumps(payload.get("crm_snapshot", payload), default=str),
        }


def _extract_run_id(body: Any) -> str | None:
    if not isinstance(body, dict):
        return None
    for key in ("runId", "run_id", "id", "workflowRunId", "workflow_run_id"):
        if body.get(key):
            return str(body[key])
    for nest in ("data", "workflowRun", "workflow_run", "run"):
        nested = body.get(nest)
        if isinstance(nested, dict):
            found = _extract_run_id(nested)
            if found:
                return found
    return None


def _merge_stream_result(events: list[dict[str, Any]], last: dict[str, Any]) -> dict[str, Any]:
    """Pick the most useful final payload from SSE events."""
    for evt in reversed(events):
        if not isinstance(evt, dict):
            continue
        etype = str(evt.get("type") or evt.get("event") or "").lower()
        if etype in ("workflow-run", "workflow_run", "complete", "completed", "result", "output"):
            inner = evt.get("data") or evt.get("payload") or evt
            if isinstance(inner, dict):
                return _strip_nested(inner)
    if isinstance(last, dict):
        return _strip_nested(last)
    return {"events_count": len(events)}


def _numeric_budget(value: Any) -> int:
    """Rough parse for form number fields (lakhs, INR, USD)."""
    if value is None:
        return 500000
    if isinstance(value, (int, float)):
        return int(value)
    text = str(value).lower().replace(",", "").replace("₹", "").strip()
    import re

    lakh = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakhs?|l\b)", text)
    if lakh:
        return int(float(lakh.group(1)) * 100_000)
    nums = re.findall(r"\d+", text)
    if nums:
        n = int(nums[0])
        return n if n > 1000 else n * 100_000
    return 500000


def _strip_nested(payload: dict[str, Any]) -> dict[str, Any]:
    """Avoid circular stream_events in stored output."""
    return {k: v for k, v in payload.items() if k != "stream_events"}


def _resolve_status(output: dict[str, Any]) -> str:
    wr = output.get("workflowRun")
    if isinstance(wr, dict) and wr.get("status"):
        return str(wr["status"]).upper()
    if output.get("success") is True:
        return "COMPLETED"
    if output.get("error"):
        return "FAILED"
    return str(output.get("status") or "SUBMITTED").upper()
