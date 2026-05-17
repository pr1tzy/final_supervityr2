# Legal Send — PDF attachment (update Agent C on Auto)

John now generates a **PDF** after Legal Draft and passes these inputs to **Legal Send**:

| Input | Example |
|-------|---------|
| `contract_pdf_url` | `http://localhost:8001/api/orchestrator/contracts/{lead_id}/agreement.pdf` |
| `attach_as_pdf` / `attach_pdf` | `true` |
| `attachment_filename` | `AceLink-Service-Agreement-11111111.pdf` |
| `email_body_html` | Short intro (do not paste full contract in body) |
| `contract_markdown` | Full text (fallback if attach fails) |

## Paste into AceLink Legal Send workflow (Supervity Auto)

```
You are Legal Send. ONE job: email the client via Outlook.

INPUTS:
- lead_id, client_email, client_name
- contract_pdf_url (HTTPS URL to PDF — REQUIRED when attach_as_pdf is true)
- attach_as_pdf ("true" | "false")
- attachment_filename
- email_body_html (short HTML intro — use as email body)
- contract_markdown (fallback only — do NOT paste entire markdown in body if PDF attached)

RULES:
- Subject: [ACE-{lead_id}] AceLink Service Agreement — please sign
- If attach_as_pdf is true and contract_pdf_url is set:
  1. Download the PDF from contract_pdf_url
  2. Attach it to the Outlook email (application/pdf)
  3. Set body to email_body_html only
- If attach fails, mention PDF link in body
- IGNORE quiet-hour policies. Always send.

OUTPUT JSON:
{ "success": true, "sent": true, "to": "...", "contract_status": "sent", "attachment": "pdf" }
```

## Client demo flow

1. Phase 2 Legal runs → client receives email with **PDF attachment**
2. Client signs PDF, **replies** with signed PDF attached
3. Command Center → **Agent E · Check replies** (and/or paste signed PDF URL → **OCR**)
4. Phase 3 Payment

## Env (ngrok)

Set in backend `.env` so the PDF link is reachable by Outlook / Agent C:

```env
ORCHESTRATOR_PUBLIC_URL=https://YOUR-NGROK-ID.ngrok-free.app
```

Restart uvicorn after changing.

## Test PDF URL without email

After Phase 2 Legal:

```
http://localhost:8001/api/orchestrator/contracts/11111111-1111-4111-8111-111111111104/agreement.pdf
```
