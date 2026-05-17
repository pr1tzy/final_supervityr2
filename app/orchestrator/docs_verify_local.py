"""
Local document verification (NOT on Supervity).
Called by John when client uploads to Supabase Storage — no cron.

TODO: wire Groq vision or pypdf + rules for signature / invoice amount.
"""

from __future__ import annotations

from typing import Any


async def verify_document(
    *,
    doc_type: str,
    file_url: str,
    expected_name: str = "",
    expected_amount_usd: float = 0,
) -> dict[str, Any]:
    """Stub — returns needs_implementation until file fetch + OCR added."""
    if not file_url:
        return {
            "success": False,
            "passed": False,
            "doc_type": doc_type,
            "message": "file_url required — upload PDF to Supabase Storage first",
        }
    return {
        "success": True,
        "passed": None,
        "doc_type": doc_type,
        "file_url": file_url,
        "message": "local verify stub — implement with httpx download + Groq/pypdf",
        "expected_name": expected_name,
        "expected_amount_usd": expected_amount_usd,
    }
