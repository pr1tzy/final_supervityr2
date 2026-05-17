"""Generate Service Agreement PDF from contract markdown (Agent C output)."""

from __future__ import annotations

import re
import unicodedata

from fpdf import FPDF

# Helvetica core fonts only support Latin-1; normalize Unicode for PDF output.
_UNICODE_REPLACEMENTS = {
    "\u2014": "-",  # em dash
    "\u2013": "-",  # en dash
    "\u2018": "'",
    "\u2019": "'",
    "\u201c": '"',
    "\u201d": '"',
    "\u2022": "*",
    "\u2026": "...",
    "\u00a0": " ",
}


def sanitize_for_pdf(text: str) -> str:
    if not text:
        return ""
    for src, dst in _UNICODE_REPLACEMENTS.items():
        text = text.replace(src, dst)
    # Decompose then drop non-ascii where possible
    text = unicodedata.normalize("NFKD", text)
    out: list[str] = []
    for ch in text:
        if ord(ch) < 128:
            out.append(ch)
        elif ch.isascii():
            out.append(ch)
        else:
            out.append("?")
    return "".join(out)


def markdown_to_pdf_bytes(markdown: str, *, title: str = "AceLink Service Agreement") -> bytes:
    markdown = sanitize_for_pdf(markdown)
    title = sanitize_for_pdf(title)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    pdf.set_font("Helvetica", style="B", size=16)
    pdf.multi_cell(0, 10, title or "AceLink Service Agreement")
    pdf.ln(4)
    pdf.set_font("Helvetica", size=11)

    for raw in markdown.splitlines():
        line = sanitize_for_pdf(raw.strip())
        if not line:
            pdf.ln(3)
            continue
        line = re.sub(r"\*\*(.+?)\*\*", r"\1", line)
        line = re.sub(r"`(.+?)`", r"\1", line)
        if line.startswith("# "):
            pdf.set_font("Helvetica", style="B", size=14)
            pdf.multi_cell(0, 8, line[2:].strip())
            pdf.set_font("Helvetica", size=11)
        elif line.startswith("## "):
            pdf.set_font("Helvetica", style="B", size=12)
            pdf.multi_cell(0, 7, line[3:].strip())
            pdf.set_font("Helvetica", size=11)
        elif line.startswith("- "):
            pdf.multi_cell(0, 6, f"  * {line[2:].strip()}")
        else:
            pdf.multi_cell(0, 6, line)

    pdf.ln(8)
    pdf.set_font("Helvetica", style="B", size=11)
    pdf.multi_cell(0, 6, "Client signature (sign below and reply with this PDF attached)")
    pdf.ln(12)
    pdf.cell(90, 6, "Signature: ___________________________")
    pdf.ln(8)
    pdf.cell(90, 6, "Name: ________________________________")
    pdf.ln(8)
    pdf.cell(90, 6, "Date: __________________________________")

    out = pdf.output(dest="S")
    if isinstance(out, str):
        return out.encode("latin-1", errors="replace")
    return bytes(out)
