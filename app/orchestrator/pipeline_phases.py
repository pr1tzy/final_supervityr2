"""Phase 2 (legal) and Phase 3 (payment) — triggers and Supabase logging."""

from __future__ import annotations

import logging
from typing import Any
from uuid import uuid4

from .agents_config import build_crm_inputs, build_legal_inputs, build_payment_inputs
from .contract_files import contract_pdf_public_url, orchestrator_base_url, save_contract_pdf
from .contract_pdf import markdown_to_pdf_bytes
from .schemas import OrchestratorEventResponse, SubflowResult, TranscriptPayload
from .scoring import parse_budget_usd
from .supervity_parse import find_step_result, parse_operator_output

log = logging.getLogger(__name__)


async def run_phase_legal(
    orchestrator: Any,
    *,
    lead_id: str,
    transcript: TranscriptPayload,
    correlation: str,
    trace: dict[str, Any],
) -> OrchestratorEventResponse:
    """Phase 2 — meeting done → Agent C (draft + send contract)."""
    raw = (
        transcript.project_description
        or transcript.meeting_transcript_summary
        or transcript.summary
        or ""
    )
    if not raw.strip():
        return OrchestratorEventResponse(
            success=False,
            lead_id=lead_id,
            event_handled="transcript_ready",
            message="transcript text required",
            reasoning_trace=trace,
        )

    if not orchestrator.settings.supervity_configured():
        return OrchestratorEventResponse(
            success=False,
            lead_id=lead_id,
            event_handled="transcript_ready",
            message="Supervity not configured — set SUPERVITY_WORKFLOW_LEGAL and API token",
            reasoning_trace=trace,
        )

    lead = await orchestrator.db.get_lead(lead_id)
    if not lead:
        return OrchestratorEventResponse(
            success=False,
            lead_id=lead_id,
            event_handled="transcript_ready",
            message=f"lead_id {lead_id} not found in Supabase",
            reasoning_trace=trace,
        )

    deal_size = parse_budget_usd(
        transcript.scoped_budget or str(lead.get("estimated_deal_size") or "")
    )
    await orchestrator._safe_supabase(
        "create_transcript",
        orchestrator.db.create_transcript(
            raw,
            lead_id=lead_id,
            extracted={
                "company": lead.get("company_name"),
                "contact": lead.get("contact_name"),
                "deal_size": deal_size,
                "next_steps": "Contract draft",
                "confidence": 0.85,
            },
        ),
    )
    await orchestrator._safe_supabase(
        "log_transcript_saved",
        orchestrator.db.log_crm_activity(
            lead_id,
            "transcript_saved",
            f"Meeting transcript stored ({len(raw)} chars)",
            {"scoped_budget": transcript.scoped_budget, "scoped_timeline": transcript.scoped_timeline},
        ),
    )

    snap = _snap_from_lead(lead_id, lead, transcript)
    await orchestrator._safe_supabase(
        "update_lead_scoped",
        orchestrator.db.update_lead(
            lead_id,
            {
                "estimated_deal_size": deal_size,
                "notes": (lead.get("notes") or "") + f"\n[scoped] {raw[:500]}",
            },
        ),
    )

    # Optional CRM update via Agent A
    if orchestrator.settings.supervity_configured():
        crm_up = await orchestrator.supervity.execute_workflow(
            "crm",
            build_crm_inputs(
                orchestrator.settings,
                operation="update_lead",
                lead_id=lead_id,
                payload={
                    "lead_status": "proposal_sent",
                    "estimated_deal_size": deal_size,
                    "notes": f"[post-meeting] {transcript.scoped_budget or ''}",
                },
            ),
        )
        trace["crm_update"] = parse_operator_output("crm", crm_up.output).get("result")

    subflows: list[SubflowResult] = []

    legal_draft = await orchestrator.supervity.execute_workflow(
        "legal",
        build_legal_inputs(task="draft_contract", snap=snap, lead_id=lead_id),
    )
    subflows.append(legal_draft)
    draft_json = (
        parse_operator_output("legal", legal_draft.output, step_id_contains="draft").get("result")
        or find_step_result(legal_draft.output, "draft")
    )
    trace["legal_draft"] = draft_json

    contract_md = draft_json.get("contract_markdown") or "# AceLink Service Agreement\n\nTerms TBD."

    pdf_url = ""
    try:
        company = str(snap.get("company_name") or "Client")
        pdf_bytes = markdown_to_pdf_bytes(
            contract_md,
            title=f"AceLink Service Agreement - {company}",
        )
        save_contract_pdf(lead_id, pdf_bytes)
        pdf_url = contract_pdf_public_url(lead_id, orchestrator_base_url())
        trace["contract_pdf_url"] = pdf_url
    except Exception as e:
        log.exception("Contract PDF generation failed")
        trace["contract_pdf_error"] = str(e)
        # Minimal fallback PDF so phase 2 can still attach something
        try:
            pdf_bytes = markdown_to_pdf_bytes(
                "# AceLink Service Agreement\n\nPlease sign and return this PDF.",
                title="AceLink Service Agreement",
            )
            save_contract_pdf(lead_id, pdf_bytes)
            pdf_url = contract_pdf_public_url(lead_id, orchestrator_base_url())
            trace["contract_pdf_url"] = pdf_url
        except Exception as e2:
            trace["contract_pdf_fallback_error"] = str(e2)

    client_name = str(snap.get("contact_name") or snap.get("full_name") or "there")
    email_intro = (
        f"<p>Hi {client_name},</p>"
        f"<p>Please review the attached <strong>PDF Service Agreement</strong> for e-signature.</p>"
        f"<p><strong>Next step:</strong> Sign the PDF and <strong>reply to this email</strong> "
        f"with the signed PDF attached. We will verify via OCR and send your deposit link.</p>"
    )
    if pdf_url:
        email_intro += (
            f"<p>PDF download (same file attached): "
            f"<a href=\"{pdf_url}\">{pdf_url}</a></p>"
        )
    email_intro += "<p>- AceLink Legal</p>"

    await orchestrator._safe_supabase(
        "log_contract_drafted",
        orchestrator.db.log_crm_activity(
            lead_id,
            "contract_drafted",
            f"Contract {draft_json.get('contract_id', 'draft')} ready — PDF at {pdf_url}",
            {"contract_id": draft_json.get("contract_id"), "contract_pdf_url": pdf_url},
        ),
    )

    legal_send = await orchestrator.supervity.execute_workflow(
        "legal",
        build_legal_inputs(
            task="send_contract_email",
            snap=snap,
            lead_id=lead_id,
            contract_markdown=contract_md if not pdf_url else "",
            contract_pdf_url=pdf_url,
            email_body_html=email_intro,
            attach_as_pdf=bool(pdf_url),
        ),
    )
    subflows.append(legal_send)
    send_json = (
        parse_operator_output("legal", legal_send.output, step_id_contains="send").get("result")
        or find_step_result(legal_send.output, "send")
    )
    trace["legal_send"] = send_json

    sent = send_json.get("sent") is True or send_json.get("contract_status") == "sent"
    await orchestrator._safe_supabase(
        "log_contract_sent",
        orchestrator.db.log_crm_activity(
            lead_id,
            "contract_sent",
            f"Legal email to {snap.get('email')} sent={sent} (PDF: {pdf_url})",
            {
                "contract_status": send_json.get("contract_status", "sent"),
                "contract_pdf_url": pdf_url,
                "attach_as_pdf": True,
            },
        ),
    )

    await orchestrator._safe_supabase(
        "update_proposal_sent",
        orchestrator.db.update_lead(lead_id, {"lead_status": "proposal_sent"}),
    )

    return OrchestratorEventResponse(
        success=sent or legal_send.status not in ("ERROR", "FAILED"),
        lead_id=lead_id,
        event_handled="transcript_ready",
        lead_status="proposal_sent",
        subflows=subflows,
        next_event="wait_for_signature",
        message="Phase 2 complete — contract sent" if sent else "Phase 2 ran — verify legal send",
        reasoning_trace=trace,
    )


async def run_phase_payment(
    orchestrator: Any,
    *,
    lead_id: str,
    deposit_usd: int = 150000,
    correlation: str | None = None,
    trace: dict[str, Any] | None = None,
) -> OrchestratorEventResponse:
    """Phase 3 — contract signed → Agent D payment link email."""
    trace = dict(trace or {})
    trace.setdefault("phase", "payment")
    trace.setdefault("correlation_id", correlation or str(uuid4()))
    correlation = trace["correlation_id"]

    if not orchestrator.settings.supervity_configured():
        return OrchestratorEventResponse(
            success=False,
            lead_id=lead_id,
            event_handled="payment_requested",
            message="Supervity not configured — set SUPERVITY_WORKFLOW_PAYMENT and API token",
            reasoning_trace=trace,
        )

    lead = await orchestrator.db.get_lead(lead_id)
    if not lead:
        return OrchestratorEventResponse(
            success=False,
            lead_id=lead_id,
            event_handled="payment_requested",
            message=f"lead_id {lead_id} not found",
            reasoning_trace=trace,
        )

    snap = _snap_from_lead(lead_id, lead, None)
    payment_r = await orchestrator.supervity.execute_workflow(
        "payment",
        build_payment_inputs(snap, lead_id, deposit_usd=deposit_usd),
    )
    pay_json = (
        parse_operator_output("payment", payment_r.output).get("result")
        or find_step_result(payment_r.output, "payment")
        or {}
    )
    if not isinstance(pay_json, dict):
        pay_json = {"raw": pay_json}
    trace["payment"] = pay_json

    ok = pay_json.get("payment_status") == "link_sent" or pay_json.get("email_sent") is True
    invoice_meta = {
        "deposit_amount_usd": deposit_usd,
        "invoice_number": pay_json.get("invoice_number")
        or f"INV-{lead_id[:8].upper()}",
        "amount_due_usd": pay_json.get("deposit_amount_usd") or deposit_usd,
        "payment_status": pay_json.get("payment_status", "link_sent" if ok else "pending"),
        "email_sent": pay_json.get("email_sent", ok),
        **{k: v for k, v in pay_json.items() if k not in ("contract_markdown",)},
    }
    # Payments Tracker (Twisty) reads action_type invoice_generated → "invoice sent" stage
    await orchestrator._safe_supabase(
        "log_invoice_generated",
        orchestrator.db.log_crm_activity(
            lead_id,
            "invoice_generated",
            f"Invoice {invoice_meta['invoice_number']} — deposit {deposit_usd} USD sent={ok}",
            invoice_meta,
        ),
    )
    await orchestrator._safe_supabase(
        "log_payment_link_sent",
        orchestrator.db.log_crm_activity(
            lead_id,
            "payment_link_sent",
            f"Deposit {deposit_usd} USD link sent={ok}",
            invoice_meta,
        ),
    )
    await orchestrator._safe_supabase(
        "log_contract_signed",
        orchestrator.db.log_crm_activity(
            lead_id,
            "contract_signed",
            "Contract signed — payment phase triggered",
            {"deposit_amount_usd": deposit_usd},
        ),
    )
    await orchestrator._safe_supabase(
        "update_negotiation",
        orchestrator.db.update_lead(lead_id, {"lead_status": "negotiation"}),
    )

    return OrchestratorEventResponse(
        success=ok and payment_r.status not in ("ERROR", "FAILED"),
        lead_id=lead_id,
        event_handled="payment_requested",
        lead_status="negotiation",
        subflows=[payment_r],
        next_event="wait_for_payment",
        message="Phase 3 complete — payment link sent" if ok else "Phase 3 failed — check payment agent",
        reasoning_trace=trace,
    )


def _snap_from_lead(
    lead_id: str, lead: dict[str, Any], transcript: TranscriptPayload | None
) -> dict[str, Any]:
    return {
        "lead_id": lead_id,
        "email": lead.get("contact_email"),
        "full_name": lead.get("contact_name"),
        "phone": lead.get("phone"),
        "company_name": lead.get("company_name") or "Individual",
        "project_type": lead.get("industry") or "website",
        "project_description": (
            (transcript.project_description if transcript else None)
            or (transcript.meeting_transcript_summary if transcript else None)
            or lead.get("notes")
            or "Website project"
        ),
        "scoped_budget": (
            (transcript.scoped_budget if transcript else None)
            or str(lead.get("estimated_deal_size") or "500000")
        ),
        "scoped_timeline": (transcript.scoped_timeline if transcript else None) or "October 2026",
        "pipeline_stage": lead.get("lead_status", "qualified"),
    }
