"""Local contract PDF storage + public URL for Agent C attach / Agent E OCR."""

from __future__ import annotations

import os
from pathlib import Path

CONTRACTS_SUBDIR = "contracts"


def contracts_dir() -> Path:
    base = Path(os.getenv("LOCAL_STORAGE_PATH", "./document_storage"))
    path = base / CONTRACTS_SUBDIR
    path.mkdir(parents=True, exist_ok=True)
    return path


def contract_pdf_path(lead_id: str) -> Path:
    safe = lead_id.replace("/", "_")
    return contracts_dir() / f"{safe}.pdf"


def save_contract_pdf(lead_id: str, pdf_bytes: bytes) -> Path:
    path = contract_pdf_path(lead_id)
    path.write_bytes(pdf_bytes)
    return path


def contract_pdf_public_url(lead_id: str, base_url: str) -> str:
    base = base_url.rstrip("/")
    safe = lead_id.replace("/", "_")
    return f"{base}/api/orchestrator/contracts/{safe}/agreement.pdf"


def orchestrator_base_url() -> str:
    return (
        os.getenv("ORCHESTRATOR_PUBLIC_URL", "").strip()
        or os.getenv("NEXT_PUBLIC_API_URL", "").strip()
        or "http://localhost:8001"
    ).rstrip("/")
