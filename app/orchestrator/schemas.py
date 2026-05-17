"""Pydantic models for orchestrator I/O."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class LeadPayload(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    project_type: str | None = None
    budget: str | None = None
    timeline: str | None = None
    availability: list[str] | str | None = None

    model_config = {"extra": "allow"}


class TranscriptPayload(BaseModel):
    summary: str | None = None
    project_description: str | None = None
    scoped_budget: str | None = None
    scoped_timeline: str | None = None
    meeting_transcript_summary: str | None = None

    model_config = {"extra": "allow"}


class OperatorCallback(BaseModel):
    agent: str | None = None
    source: str | None = None
    success: bool | None = None
    status: str | None = None
    response: dict[str, Any] = Field(default_factory=dict)

    model_config = {"extra": "allow"}


class OrchestratorEventRequest(BaseModel):
    """Matches AceLink / Supervity webhook shape."""

    event: str = Field(
        ...,
        description="lead_created | transcript_ready | contract_signed | operator_callback | gap_scan | check",
    )
    deposit_amount_usd: int | None = None
    lead_id: str | None = None
    workflow_id: str | None = None
    lead_payload: LeadPayload | dict[str, Any] | None = None
    lead_payload_json: str | dict[str, Any] | None = None
    operator_callback: OperatorCallback | dict[str, Any] | None = None
    operator_callback_json: str | dict[str, Any] | None = None
    transcript_payload: TranscriptPayload | dict[str, Any] | None = None
    transcript_payload_json: str | dict[str, Any] | None = None
    source: str = "AceLink Website"

    model_config = {"extra": "allow"}


class ScoringResult(BaseModel):
    score: int
    tier: str
    outreach_approved: bool
    breakdown: list[dict[str, Any]] = Field(default_factory=list)


class SubflowResult(BaseModel):
    agent: str
    workflow_id: str
    run_id: str | None = None
    status: str
    output: dict[str, Any] = Field(default_factory=dict)
    parsed: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None


class OrchestratorEventResponse(BaseModel):
    success: bool
    lead_id: str | None = None
    event_handled: str
    scoring: ScoringResult | None = None
    lead_status: str | None = None
    subflows: list[SubflowResult] = Field(default_factory=list)
    workbench_required: bool = False
    workbench_reason: str | None = None
    next_event: str | None = None
    agent_run_id: str | None = None
    message: str = ""
    reasoning_trace: dict[str, Any] = Field(default_factory=dict)
