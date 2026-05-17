# Fix Agent A — read Supabase from request_json

John already sends credentials **inside** `request_json`:

```json
{
  "operation": "create_lead",
  "lead_id": "...",
  "payload": { "email": "...", "full_name": "..." },
  "SUPABASE_URL": "https://xxxx.supabase.co",
  "SUPABASE_TOKEN": "eyJ..."
}
```

Your **Process CRM Request** code step must parse that string — not empty workflow variables.

## Python (paste in Auto code step)

```python
import json
import httpx

raw = inputs.get("request_json") or ""
req = json.loads(raw) if isinstance(raw, str) else (raw or {})

url = req.get("SUPABASE_URL") or req.get("supabase_url") or ""
token = req.get("SUPABASE_TOKEN") or req.get("supabase_token") or ""

if not url or not token:
    output = json.dumps({
        "success": False,
        "error": "SUPABASE_URL and SUPABASE_TOKEN required inside request_json",
    })
else:
    op = req.get("operation")
    lead_id = req.get("lead_id")
    payload = req.get("payload") or {}
    headers = {
        "apikey": token,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if op == "create_lead":
        row = {
            "contact_email": payload.get("email"),
            "contact_name": payload.get("full_name"),
            "phone": payload.get("phone"),
            "company_name": payload.get("company_name") or "Individual",
            "industry": payload.get("project_type"),
            "lead_status": "new",
            "source": "acelink",
            "notes": payload.get("notes") or "",
        }
        r = httpx.post(f"{url}/rest/v1/leads", headers=headers, json=row, timeout=30)
        data = r.json() if r.content else {}
        lid = data[0]["id"] if isinstance(data, list) and data else lead_id
        output = json.dumps({
            "success": r.status_code < 400,
            "operation": "create_lead",
            "lead_id": lid,
            "contact_email": payload.get("email"),
            "contact_name": payload.get("full_name"),
        })
    else:
        output = json.dumps({"success": False, "error": f"unknown operation {op}"})
```

Until this is fixed, John uses **local CRM** (`ORCHESTRATOR_CRM_LOCAL_FIRST=true` in `.env`).
