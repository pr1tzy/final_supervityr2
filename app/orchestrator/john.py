"""John — local orchestrator brain."""

from __future__ import annotations

import json
import logging
from typing import Any
from uuid import uuid4

from .agents_config import build_crm_inputs, build_email_inputs
from .pipeline_phases import run_phase_legal, run_phase_payment
from .config import OrchestratorSettings, get_settings
from .llm import LLMClient
from .schemas import (
    LeadPayload,
    OperatorCallback,
    OrchestratorEventRequest,
    OrchestratorEventResponse,
    ScoringResult,
    SubflowResult,
    TranscriptPayload,
)
from .scoring import normalize_project_type, parse_budget_usd, score_lead
from .supabase_repo import SupabaseRepository
from .supervity import SupervityClient
from .supervity_parse import find_step_result, parse_operator_output

log = logging.getLogger(__name__)

PLACEHOLDER_TRANSCRIPT_MARKERS = (
    "lead onboarding completed",
    "onboarding completed",
    "placeholder",
)


class JohnOrchestrator:
    def __init__(self, settings: OrchestratorSettings | None = None):
        self.settings = settings or get_settings()
        self.db = SupabaseRepository(self.settings)
        self.supervity = SupervityClient(self.settings)
        self.llm = LLMClient(self.settings)

    async def _safe_supabase(self, label: str, coro: Any, *, required: bool = False) -> Any:
        """Best-effort local Supabase — must not block CRM + email pipeline."""
        try:
            return await coro
        except RuntimeError as e:
            if required:
                raise
            log.warning("Supabase %s skipped: %s", label, str(e)[:240])
            return None

    async def handle(self, req: OrchestratorEventRequest) -> OrchestratorEventResponse:
        event = req.event.strip().lower().replace("-", "_")
        lead_id = req.lead_id
        correlation = req.workflow_id or str(uuid4())
        trace: dict[str, Any] = {"event": event, "correlation_id": correlation, "source": req.source}

        run_id = await self.db.start_agent_run(
            lead_id=lead_id,
            reasoning={"phase": "start", "event": event},
        )

        try:
            if event in ("lead_created", "lead.captured", "lead_captured"):
                resp = await self._handle_lead_created(req, correlation, trace)
            elif event in ("transcript_ready", "meeting.transcript_ready"):
                resp = await self._handle_transcript(req, correlation, trace)
            elif event in (
                "contract_signed",
                "payment_requested",
                "phase_payment",
                "payment.link",
            ):
                if not lead_id:
                    resp = OrchestratorEventResponse(
                        success=False,
                        event_handled=event,
                        message="lead_id required for payment phase",
                        reasoning_trace=trace,
                    )
                else:
                    deposit = int(req.deposit_amount_usd or 150000)
                    resp = await run_phase_payment(
                        self,
                        lead_id=lead_id,
                        deposit_usd=deposit,
                        correlation=correlation,
                        trace=trace,
                    )
            elif event in ("operator_callback", "operator.callback"):
                resp = await self._handle_operator_callback(req, correlation, trace)
            elif event in ("gap_scan", "gap.alert"):
                resp = await self._handle_gap_scan(req, correlation, trace)
            elif event in ("check", "monitor.check"):
                resp = await self._handle_check(req, correlation, trace)
            else:
                resp = OrchestratorEventResponse(
                    success=False,
                    lead_id=lead_id,
                    event_handled=event,
                    message=f"Unknown event: {event}",
                    reasoning_trace=trace,
                )

            await self.db.complete_agent_run(
                run_id,
                "completed" if resp.success else "failed",
                {**trace, "response": resp.model_dump()},
            )
            resp.agent_run_id = run_id
            return resp
        except Exception as e:
            log.exception("Orchestrator failed")
            await self.db.complete_agent_run(run_id, "failed", {**trace, "error": str(e)})
            if lead_id:
                await self.db.create_workbench_review(
                    lead_id,
                    "orchestrator_error",
                    str(e),
                )
            return OrchestratorEventResponse(
                success=False,
                lead_id=lead_id,
                event_handled=event,
                workbench_required=True,
                workbench_reason=str(e),
                message=f"Orchestrator error: {e}",
                reasoning_trace=trace,
                agent_run_id=run_id,
            )

    async def _enforce_ai_policies(
        self,
        lead_id: str,
        scoring: ScoringResult,
        trace: dict[str, Any],
    ) -> bool:
        """Apply active Supabase ai_policies (demo: minimum score). Returns True if outreach blocked."""
        policies = await self._safe_supabase("list_policies", self.db.list_active_policies())
        if not isinstance(policies, list) or not policies:
            return False

        threshold = 50
        min_policy = next(
            (p for p in policies if "minimum" in (p.get("policy_name") or "").lower()),
            policies[0],
        )
        policy_id = str(min_policy.get("id") or "")
        if scoring.score >= threshold or not policy_id:
            return False

        reason = f"Lead score {scoring.score} below policy threshold {threshold}"
        await self._safe_supabase(
            "policy_violation",
            self.db.create_policy_violation(
                lead_id=lead_id,
                policy_id=policy_id,
                violation_reason=reason,
                blocked_action="outreach",
            ),
        )
        await self._safe_supabase(
            "policy_workbench",
            self.db.create_workbench_review(lead_id, "policy_violation", reason),
        )
        await self._safe_supabase(
            "policy_log",
            self.db.log_crm_activity(
                lead_id,
                "policy_violation",
                reason,
                {"score": scoring.score, "policy_id": policy_id},
            ),
        )
        trace["policy_enforcement"] = {
            "blocked_outreach": True,
            "policy_id": policy_id,
            "threshold": threshold,
        }
        return True

    async def _handle_lead_created(
        self,
        req: OrchestratorEventRequest,
        correlation: str,
        trace: dict[str, Any],
    ) -> OrchestratorEventResponse:
        payload = _parse_lead_payload(req)
        if not payload.email:
            return OrchestratorEventResponse(
                success=False,
                event_handled="lead_created",
                workbench_required=True,
                workbench_reason="missing_email",
                message="Email is required",
                reasoning_trace=trace,
            )

        scoring = score_lead(payload)
        trace["scoring"] = scoring.model_dump()

        lead_id = req.lead_id or str(uuid4())
        lead: dict[str, Any] = {}

        existing = await self._safe_supabase(
            "get_lead_by_email", self.db.get_lead_by_email(payload.email)
        )
        if existing:
            lead_id = str(existing["id"])
            lead = existing
            updated = await self._safe_supabase(
                "update_lead",
                self.db.update_lead(
                    lead_id,
                    {
                        "lead_score": scoring.score,
                        "notes": (existing.get("notes") or "")
                        + f"\n[re-intake] {payload.budget or ''}",
                    },
                ),
            )
            if isinstance(updated, dict):
                lead = updated

        subflows: list[SubflowResult] = []
        crm_snapshot = _lead_to_crm_snapshot(lead_id, lead, payload, scoring)
        crm_ok = False

        # 1) CRM — local Supabase first (hackathon default; Agent A optional)
        if self.settings.crm_local_first:
            local_row = await self._safe_supabase(
                "create_lead",
                self.db.create_lead_from_payload(lead_id, payload, scoring, req.source),
                required=True,
            )
            if isinstance(local_row, dict) and local_row.get("id"):
                lead_id = str(local_row["id"])
                lead = local_row
                crm_snapshot = _lead_to_crm_snapshot(lead_id, lead, payload, scoring)
                crm_ok = True
                trace["crm"] = {"source": "local_supabase", "lead_id": lead_id}

        if not crm_ok and self.settings.supervity_configured():
            crm_result = await self.supervity.execute_workflow(
                "crm",
                build_crm_inputs(
                    self.settings,
                    operation="create_lead",
                    lead_id=lead_id,
                    payload=crm_snapshot,
                ),
            )
            subflows.append(crm_result)
            crm_json = parse_operator_output(
                "crm", crm_result.output, step_id_contains="process"
            ).get("result") or find_step_result(crm_result.output, "process")
            trace["crm_auto"] = crm_json
            if crm_json.get("lead_id"):
                lead_id = str(crm_json["lead_id"])
                crm_snapshot["lead_id"] = lead_id
            crm_ok = (
                crm_result.status not in ("ERROR", "FAILED")
                and crm_json.get("success") is not False
                and not crm_json.get("error")
            )
            if not crm_ok:
                crm_err = crm_json.get("error") or crm_result.error or "CRM failed"
                trace["crm_error"] = crm_err
                local_row = await self._safe_supabase(
                    "create_lead_fallback",
                    self.db.create_lead_from_payload(lead_id, payload, scoring, req.source),
                )
                if isinstance(local_row, dict) and local_row.get("id"):
                    lead_id = str(local_row["id"])
                    crm_snapshot["lead_id"] = lead_id
                    crm_ok = True
                    trace["crm_fallback"] = "local_supabase"

        if not crm_ok:
            await self._safe_supabase(
                "workbench_review",
                self.db.create_workbench_review(lead_id, "crm_failed", "Could not create lead"),
            )
            return OrchestratorEventResponse(
                success=False,
                lead_id=lead_id,
                event_handled="lead_created",
                scoring=scoring,
                lead_status="needs_review",
                subflows=subflows,
                workbench_required=True,
                workbench_reason="crm_failed",
                next_event="workbench",
                message="CRM failed — check SUPABASE_SERVICE_ROLE_KEY in .env",
                reasoning_trace=trace,
            )

        lead_status = "qualified" if scoring.outreach_approved else "new"
        await self._safe_supabase(
            "update_lead_status",
            self.db.update_lead(lead_id, {"lead_status": lead_status}),
        )
        await self._safe_supabase(
            "crm_activity",
            self.db.log_crm_activity(
                lead_id,
                "lead_created",
                f"Scored {scoring.score} ({scoring.tier}), outreach_approved={scoring.outreach_approved}",
                {"scoring": scoring.model_dump()},
            ),
        )
        trace["supabase_local"] = "synced" if existing else "crm_only_or_skipped_rls"

        policy_block = await self._enforce_ai_policies(lead_id, scoring, trace)

        # 2) Agent B — one call: operation=send runs draft+send inside Auto workflow
        next_event = "nurture_only"
        if scoring.outreach_approved and not policy_block:
            snap = {
                **crm_snapshot,
                "email": crm_snapshot.get("email"),
                "full_name": crm_snapshot.get("full_name"),
            }
            send_result = await self.supervity.execute_workflow(
                "email",
                build_email_inputs(
                    operation="send",
                    lead_id=lead_id,
                    snap=snap,
                    subject="",
                    body_html="",
                ),
            )
            subflows.append(send_result)
            out = send_result.output
            draft_json = find_step_result(out, "draft_email", "draft")
            send_json = (
                parse_operator_output(
                    "email", out, operation="send", step_id_contains="send_email"
                ).get("result")
                or find_step_result(out, "send_email", "send")
            )
            trace["email_draft"] = draft_json
            trace["email_send"] = send_json
            await self._safe_supabase(
                "crm_activity",
                self.db.log_crm_activity(
                    lead_id,
                    "outreach_dispatched",
                    f"Email sent={send_json.get('sent')} subject={send_json.get('subject') or draft_json.get('subject')}",
                ),
            )
            next_event = "wait_for_email_reply"
        else:
            await self.db.log_crm_activity(
                lead_id, "outreach_skipped", f"Tier {scoring.tier} — no email"
            )

        await self.db.record_metric("leads_intake", 1, {"tier": scoring.tier})

        return OrchestratorEventResponse(
            success=True,
            lead_id=lead_id,
            event_handled="lead_created",
            scoring=scoring,
            lead_status=lead_status,
            subflows=subflows,
            next_event=next_event,
            message=f"Lead {lead_id} processed — tier {scoring.tier}",
            reasoning_trace=trace,
        )

    async def _handle_transcript(
        self,
        req: OrchestratorEventRequest,
        correlation: str,
        trace: dict[str, Any],
    ) -> OrchestratorEventResponse:
        lead_id = req.lead_id
        if not lead_id:
            return OrchestratorEventResponse(
                success=False,
                event_handled="transcript_ready",
                message="lead_id required",
                reasoning_trace=trace,
            )

        transcript = _parse_transcript_payload(req)
        raw = (
            transcript.project_description
            or transcript.meeting_transcript_summary
            or transcript.summary
            or ""
        )

        if _is_placeholder_transcript(raw):
            return OrchestratorEventResponse(
                success=False,
                lead_id=lead_id,
                event_handled="transcript_ready",
                workbench_required=False,
                next_event="wait_for_real_transcript",
                message="Transcript is placeholder — not calling legal agent",
                reasoning_trace=trace,
            )

        if self.llm.enabled and len(raw) < 200:
            enriched = await self.llm.enrich_transcript(raw)
            if enriched:
                transcript = TranscriptPayload(**{**transcript.model_dump(), **enriched})

        if not self.settings.supervity_configured():
            return OrchestratorEventResponse(
                success=False,
                lead_id=lead_id,
                event_handled="transcript_ready",
                message="Supervity not configured — set SUPERVITY_WORKFLOW_LEGAL and API token",
                reasoning_trace=trace,
            )

        return await run_phase_legal(
            self,
            lead_id=lead_id,
            transcript=transcript,
            correlation=correlation,
            trace=trace,
        )

    async def _handle_operator_callback(
        self,
        req: OrchestratorEventRequest,
        correlation: str,
        trace: dict[str, Any],
    ) -> OrchestratorEventResponse:
        lead_id = req.lead_id
        cb = _parse_operator_callback(req)
        agent = (cb.agent or cb.source or "").lower()
        response = cb.response or {}
        trace["callback"] = cb.model_dump()

        if not lead_id:
            return OrchestratorEventResponse(
                success=False,
                event_handled="operator_callback",
                message="lead_id required on callback",
                reasoning_trace=trace,
            )

        subflows: list[SubflowResult] = []
        next_event = "unknown"

        # Forward Jack CRM updates from Jim
        for upd in response.get("jack_crm_updates", []):
            op = upd.get("operation", "update_outreach_status")
            jack_r = await self.supervity.execute_workflow(
                "jack",
                self.supervity.build_jack_inputs(
                    lead_id=lead_id,
                    operation=op,
                    payload=upd,
                    correlation_id=correlation,
                ),
            )
            subflows.append(jack_r)

        if "jim" in agent:
            meeting = response.get("meeting") or {}
            if meeting.get("scheduled"):
                await self.db.update_lead(lead_id, {"lead_status": "qualified"})
                next_event = "wait_for_transcript"
            else:
                next_event = "wait_for_jim_reply"

        elif "legal" in agent or "jennie" in agent:
            contract = response.get("contract") or {}
            if contract.get("status") == "signed" or response.get("ocr_result", {}).get("passed"):
                pay_resp = await run_phase_payment(
                    self,
                    lead_id=lead_id,
                    correlation=correlation,
                    trace={**trace, "trigger": "operator_callback"},
                )
                subflows.extend(pay_resp.subflows or [])
                next_event = pay_resp.next_event or "wait_for_payment"
            elif response.get("ocr_request", {}).get("invoke"):
                ocr_req = response["ocr_request"]
                doc_type = ocr_req.get("doc_type", "signed_contract")
                jason_task = (
                    "verify_invoice_ocr"
                    if doc_type == "payment_invoice"
                    else "verify_signature_ocr"
                )
                ocr_r = await self.supervity.execute_workflow(
                    "jason",
                    self.supervity.build_operator_inputs(
                        lead_id=lead_id,
                        operation_or_task=jason_task,
                        payload={"task": jason_task, **ocr_req},
                        correlation_id=correlation,
                    ),
                )
                subflows.append(ocr_r)
                next_event = "wait_for_ocr"

        elif "payment" in agent or "jason" in agent:
            payment = response.get("payment") or {}
            if payment.get("payment_status") == "paid" or response.get("ocr_result", {}).get("passed"):
                await self.db.update_lead(lead_id, {"lead_status": "closed_won"})
                await self._safe_supabase(
                    "log_payment_received",
                    self.db.log_crm_activity(lead_id, "payment_received", "Payment confirmed"),
                )
                next_event = "complete"
            else:
                next_event = "wait_for_payment"

        elif "ocr" in agent or response.get("ocr_result"):
            ocr = response.get("ocr_result") or response.get("overall") or response
            if not ocr.get("passed"):
                await self.db.create_workbench_review(
                    lead_id, "ocr_failed", "OCR verification failed"
                )
                await self.db.update_lead(lead_id, {"lead_status": "needs_review"})
                next_event = "workbench"
            else:
                next_event = "resume_chain"

        elif "gap" in agent:
            for item in response.get("john_dispatch_queue", []):
                for action in item.get("approved_actions", []):
                    agent_name = action.get("target_agent", "jim").replace("_ops_outreach", "").lower()
                    task = action.get("task", "send_follow_up")
                    r = await self.supervity.execute_workflow(
                        agent_name.split("_")[0] if agent_name else "jim",
                        self.supervity.build_operator_inputs(
                            lead_id=lead_id,
                            operation_or_task=task,
                            payload=action.get("payload", {}),
                            correlation_id=correlation,
                        ),
                    )
                    subflows.append(r)
            next_event = "gap_handled"

        return OrchestratorEventResponse(
            success=True,
            lead_id=lead_id,
            event_handled="operator_callback",
            subflows=subflows,
            next_event=next_event,
            message=f"Handled callback from {agent}",
            reasoning_trace=trace,
        )

    async def _handle_check(
        self,
        req: OrchestratorEventRequest,
        correlation: str,
        trace: dict[str, Any],
    ) -> OrchestratorEventResponse:
        from .check_runner import CheckRequest, run_check

        if not req.lead_id:
            return OrchestratorEventResponse(
                success=False,
                event_handled="check",
                message="lead_id required for check",
                reasoning_trace=trace,
            )
        raw = req.model_dump()
        check_req = CheckRequest(
            action="check",
            lead_id=req.lead_id,
            client_email=raw.get("client_email"),
            client_name=raw.get("client_name"),
            silence_threshold_days=int(raw.get("silence_threshold_days") or 4),
            signed_pdf_url=str(raw.get("signed_pdf_url") or ""),
            doc_type=str(raw.get("doc_type") or "signed_contract"),
            expected_name=str(raw.get("expected_name") or ""),
            expected_amount_usd=float(raw.get("expected_amount_usd") or 0),
            slack_channel=str(raw.get("slack_channel") or "#sales-ops"),
        )
        check_resp = await run_check(check_req, settings=self.settings, db=self.db, supervity=self.supervity)
        trace["check"] = check_resp.model_dump()
        return OrchestratorEventResponse(
            success=check_resp.success,
            lead_id=req.lead_id,
            event_handled="check",
            message=check_resp.message,
            reasoning_trace=trace,
            next_event="check_complete",
        )

    async def _handle_gap_scan(
        self,
        req: OrchestratorEventRequest,
        correlation: str,
        trace: dict[str, Any],
    ) -> OrchestratorEventResponse:
        lead_id = req.lead_id or ""
        inputs = {
            "mode": "scan_single_lead" if lead_id else "scan_pipeline",
            "lead_id": lead_id,
            "correlation_id": correlation,
        }
        gap_r = await self.supervity.execute_workflow(
            "gap",
            {
                "mode": inputs["mode"],
                "lead_id": lead_id,
                "correlation_id": correlation,
                "payload_json": json.dumps(inputs),
            },
        )
        return OrchestratorEventResponse(
            success=gap_r.status not in ("ERROR", "FAILED"),
            lead_id=lead_id or None,
            event_handled="gap_scan",
            subflows=[gap_r],
            next_event="gap_dispatch",
            message="Gap scan completed",
            reasoning_trace=trace,
        )

    async def _invoke_jason_payment(
        self, lead_id: str, correlation: str
    ) -> list[SubflowResult]:
        resp = await run_phase_payment(
            self,
            lead_id=lead_id,
            correlation=correlation,
            trace={"phase": "payment", "trigger": "legacy_jason_invoke"},
        )
        return list(resp.subflows or [])


# --- helpers ---


def _parse_lead_payload(req: OrchestratorEventRequest) -> LeadPayload:
    raw = req.lead_payload
    if raw is None and req.lead_payload_json:
        raw = (
            json.loads(req.lead_payload_json)
            if isinstance(req.lead_payload_json, str)
            else req.lead_payload_json
        )
    if isinstance(raw, LeadPayload):
        return raw
    if isinstance(raw, dict):
        return LeadPayload(**raw)
    return LeadPayload()


def _parse_transcript_payload(req: OrchestratorEventRequest) -> TranscriptPayload:
    raw = req.transcript_payload
    if raw is None and req.transcript_payload_json:
        raw = (
            json.loads(req.transcript_payload_json)
            if isinstance(req.transcript_payload_json, str)
            else req.transcript_payload_json
        )
    if isinstance(raw, TranscriptPayload):
        return raw
    if isinstance(raw, dict):
        return TranscriptPayload(**raw)
    return TranscriptPayload()


def _parse_operator_callback(req: OrchestratorEventRequest) -> OperatorCallback:
    raw = req.operator_callback
    if raw is None and req.operator_callback_json:
        raw = (
            json.loads(req.operator_callback_json)
            if isinstance(req.operator_callback_json, str)
            else req.operator_callback_json
        )
    if isinstance(raw, OperatorCallback):
        return raw
    if isinstance(raw, dict):
        return OperatorCallback(**raw)
    return OperatorCallback()


def _is_placeholder_transcript(text: str) -> bool:
    low = text.lower().strip()
    if len(low) < 20:
        return True
    return any(m in low for m in PLACEHOLDER_TRANSCRIPT_MARKERS)


def _lead_to_crm_snapshot(
    lead_id: str,
    lead: dict[str, Any],
    payload: LeadPayload | None,
    scoring: ScoringResult | None,
) -> dict[str, Any]:
    return {
        "lead_id": lead_id,
        "email": lead.get("contact_email") or (payload.email if payload else None),
        "full_name": lead.get("contact_name") or (payload.name if payload else None),
        "phone": lead.get("phone") or (payload.phone if payload else None),
        "company_name": lead.get("company_name") or (payload.company if payload else "Individual"),
        "project_type": normalize_project_type(
            (payload.project_type if payload else None) or lead.get("industry")
        ),
        "preliminary_budget": payload.budget if payload else None,
        "preliminary_timeline": payload.timeline if payload else None,
        "pipeline_stage": lead.get("lead_status", "new"),
        "orchestrator_interest_score": scoring.score if scoring else lead.get("lead_score"),
        "orchestrator_tier": scoring.tier if scoring else "warm",
        "outreach_approved": scoring.outreach_approved if scoring else False,
    }
