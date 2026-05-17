# AceLink — Full demo runbook (presentation)

## Before you go on stage (5 min)

1. **Supabase** — run once:
   ```bash
   python scripts/reset_and_seed_acelink_demo.py
   ```
2. **Backend** — port 8001, health OK:
   ```bash
   curl http://localhost:8001/api/orchestrator/health
   ```
3. **Frontend** — `npm run dev` in `frontend/`, `.env.local` has Supabase + webhook secret.
4. **Supervity** — `SUPERVITY_MOCK_MODE=true` in `.env` if live agents are flaky (John still writes to Supabase).

## Story arc (~8 minutes)

### 1. Max AI — new lead (Phase 1)

- Open **Max AI** (sidebar) or dashboard widget.
- Submit: name, email, company, budget **$5000**, project **website**.
- Say: *"Max captures the lead; John scores and routes to Agent A + B."*
- Show **Logs** → `lead_created`, optional `outreach_dispatched`.
- Show **CRM** → new row, score, status.

**Policy demo:** submit **Full stack — low budget** ($2000) or use seeded **Nova Clinics** (score 45) → **AI Policies** violations + **Workbench**.

### 2. CRM pipeline

- Walk kanban: `new` → `qualified` → `proposal_sent` → `negotiation`.
- Tristan demo lead: `11111111-1111-4111-8111-111111111104` (tristanhancock@gmail.com).

### 3. Legal — Phase 2 (Agent C)

- **Legal Hub** → select Tristan / Ovelia Health.
- Trigger contract flow (UI or curl from `docs/tristan-pipeline-curl.sh`).
- **Logs**: `transcript_saved`, `contract_drafted`, `contract_sent`.

### 4. Payments — Phase 3 (Agent D)

- **Payments** → Tristan → trigger payment phase.
- **Logs**: `contract_signed`, `invoice_generated`, `payment_link_sent`.

### 5. Governance

- **AI Policies** — 3 seeded rules; John blocks outreach when score &lt; 50.
- **AI Manager** (header sparkle) — ask *"How do policies work?"* (demo mode if no chat API).

### 6. Command center

- **Dashboard** — John + Agents A–E map, pipeline counts, live feed.
- **Settings** — shows orchestrator URL + online status.

### 7. Optional — Phase 4 monitor (Agent E)

```bash
curl -X POST http://localhost:8001/api/orchestrator/check \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"lead_id":"11111111-1111-4111-8111-111111111104"}'
```

## Tristan quick curls

See `docs/tristan-pipeline-curl.txt` (WSL/Git Bash). Set `SECRET` and `BASE=http://localhost:8001`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty CRM / `{}` errors | Frontend `.env.local` must use **Supabase** JWT, not Supervity SSO token |
| John offline | Start uvicorn on 8001; check `NEXT_PUBLIC_API_URL` |
| 401 webhook | Match `ORCHESTRATOR_WEBHOOK_SECRET` backend + frontend |
| No policies | Re-run seed script (inserts `ai_policies`) |

## Reset between rehearsals

```bash
python scripts/reset_and_seed_acelink_demo.py
```
