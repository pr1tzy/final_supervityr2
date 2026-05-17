# Expose John orchestrator publicly (for Max chatbot)

Your teammate needs a **public HTTPS URL** that accepts lead JSON and runs CRM + email agents.

## Recommended for hackathon: ngrok (5 minutes)

### 1. Start the API locally

```powershell
cd c:\Users\vyrus\Hackathon\SupervityR2
.\scripts\start.ps1
```

API is at `http://localhost:8001` (Docker maps backend to port 8001).

### 2. Set a webhook secret

In `.env`:

```env
ORCHESTRATOR_WEBHOOK_SECRET=pick-a-long-random-string-here
```

Share this secret **only** with your teammate (not in public repos).

### 3. Install and run ngrok

Download: https://ngrok.com/download

```powershell
ngrok http 8001
```

Copy the **Forwarding** URL, e.g. `https://abc123.ngrok-free.app`

### 4. Give your teammate this endpoint

| Purpose | URL |
|--------|-----|
| Health | `GET https://YOUR-NGROK/api/orchestrator/health` |
| **Lead intake (Max)** | `POST https://YOUR-NGROK/api/orchestrator/webhook/lead` |
| JSON events | `POST https://YOUR-NGROK/api/orchestrator/events` |

Header on every POST:

```
X-Webhook-Secret: <same as ORCHESTRATOR_WEBHOOK_SECRET>
```

---

## Copy-paste curl for teammate (JSON)

Replace `BASE` and `SECRET`.

```bash
curl -X POST "https://BASE/api/orchestrator/webhook/lead" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: SECRET" \
  -d '{
    "event": "lead_created",
    "source": "AceLink Website",
    "lead_payload": {
      "name": "Tristan Singh",
      "email": "tristan@example.com",
      "phone": "9819861904",
      "company": "Ovelia Health",
      "project_type": "website",
      "budget": "around 5 lakhs",
      "timeline": "by October 2026"
    }
  }'
```

## Form-urlencoded (Supervity / Max style)

```bash
curl -X POST "https://BASE/api/orchestrator/webhook/lead" \
  -H "X-Webhook-Secret: SECRET" \
  -F "event=lead_created" \
  -F "source=AceLink Website" \
  -F 'lead_payload_json={"name":"Tristan Singh","email":"tristan@example.com","phone":"9819861904","company":"Ovelia Health","project_type":"website","budget":"5 lakhs","timeline":"October 2026"}'
```

Success response includes `lead_id`, `scoring`, `subflows` (CRM + email).

---

## Other ways to go public

| Method | Best for | Notes |
|--------|----------|--------|
| **ngrok** | Demo today | Free tier URL changes each restart unless paid |
| **Cloudflare Tunnel** | Stable free URL | `cloudflared tunnel --url http://localhost:8001` |
| **Railway / Render** | 24/7 demo | Deploy Docker backend; set env vars in dashboard |
| **Azure / AWS VM** | Production | Open port 443 + reverse proxy |

### Cloudflare Tunnel (free stable-ish)

```powershell
cloudflared tunnel --url http://localhost:8001
```

### Railway (always-on)

1. Push repo to GitHub.
2. New Railway project → deploy `SupervityR2` Dockerfile or backend service.
3. Set all `.env` vars (Supabase, Supervity workflows, `ORCHESTRATOR_WEBHOOK_SECRET`).
4. Public URL: `https://your-app.up.railway.app/api/orchestrator/webhook/lead`

---

## Security checklist

- [ ] `ORCHESTRATOR_WEBHOOK_SECRET` set (required for public webhooks).
- [ ] Do **not** set `AUTH_BYPASS=true` on a public internet deployment without a secret.
- [ ] Orchestrator routes are public in `public.map.json` but protected by `X-Webhook-Secret`.
- [ ] Demo routes (`/demo/*`, `/jack`) stay auth-protected — not in public map.

---

## Verify before sharing

```powershell
# Local
curl http://localhost:8001/api/orchestrator/health

# Public (after ngrok)
curl https://YOUR-NGROK/api/orchestrator/health
```
