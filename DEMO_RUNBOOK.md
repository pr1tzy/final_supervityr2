# AceLink — Full demo runbook (Round 2 deck aligned)

Maps to **Autopilot Round 2** pillars: AI Manager, AI Policies, Workbench, AI Insights, 4+ Operators + John + **OCR (Agent E)**.

---

## A. Before the room (15 min)

### 1. Environment

```powershell
cd c:\Users\vyrus\Hackathon\final_supervityr2   # or front_twist\SupervityR2 + separate backend

# Backend
Copy-Item .env.example .env
# Fill: SUPABASE_*, ORCHESTRATOR_WEBHOOK_SECRET, SUPERVITY_* (WORKFLOW_CHECK for Agent E)
pip install -r packages/requirements.txt

# Frontend
cd frontend
Copy-Item .env.local.example .env.local
# Supabase JWT (NOT Supervity SSO), NEXT_PUBLIC_API_URL=http://localhost:8001, same webhook secret
npm install
```

### 2. Start services

```powershell
# Terminal 1 — John
cd final_supervityr2
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001

# Terminal 2 — UI
cd frontend
npm run dev
```

Verify: http://localhost:8001/api/orchestrator/health → `"status":"ok"`

### 3. Seed Supabase

```powershell
cd final_supervityr2
python scripts/reset_and_seed_acelink_demo.py
```

**Tristan demo lead:** `11111111-1111-4111-8111-111111111104` · `tristanhancock@gmail.com` · Ovelia Health

### 4. Supervity Auto

| Agent | Role | Env var |
|-------|------|---------|
| A | CRM | `SUPERVITY_WORKFLOW_CRM` |
| B | Email outreach | `SUPERVITY_WORKFLOW_EMAIL` |
| C | Legal | `SUPERVITY_WORKFLOW_LEGAL` |
| D | Payment | `SUPERVITY_WORKFLOW_PAYMENT` |
| E | Monitor + **OCR** | `SUPERVITY_WORKFLOW_CHECK` |

For a flaky stage, set `SUPERVITY_MOCK_MODE=true` — John still writes Supabase logs; live Agent E needs real check workflow for Outlook/OCR.

---

## B. On-stage story (~10 min) — deck order

### 1. Problem (30 s)

*“VP Sales needs one system: intake → qualify → contract → payment, with policies and human override.”*

### 2. Command Center dashboard (`/`)

- Hero: John + Agents A–E, lead count
- Orchestration map + pipeline stages (seed data)
- **Max AI** widget — live intake

### 3. Phase 1 — Max AI → John → A + B (`/max`)

1. Open **Max AI**
2. Submit: your name, **your real email** (for reply test later), company, budget `$5000`, website
3. Show **Logs**: `lead_created`, maybe `outreach_dispatched`
4. Show **CRM**: new card + score

**Policy beat:** submit “Full stack — low budget” → **AI Policies** violation + **Workbench** (score &lt; 50)

### 4. AI Policies + Workbench (deck pillars)

- **AI Policies** — 3 seeded rules; John enforces minimum score on intake
- **Workbench** — pending review (seed has Fatima; policy violations create new rows)
- Say: *“Plain-language guardrails; orchestrator blocks outreach before Agent B runs.”*

### 5. Phase 2 — Legal (`/legal`)

1. Select **Ovelia Health / Tristan** in contract queue (or use default actions card)
2. Click **Phase 2 · Legal** on **John pipeline actions**
3. **Logs**: `transcript_saved`, `contract_drafted`, `contract_sent`

*Legal Hub OCR tab = **browser simulation** for UI polish. **Real OCR** = Agent E + PDF URL (below).*

### 6. Email reply check — Agent E (OCR capability path)

**What Agent E does (Supervity workflow):**

- Scans **Outlook** for replies from `client_email` on the contract thread
- Silence alert if no reply in N days (default 4)
- Optional **PDF OCR** when you pass `signed_pdf_url`

**Your email test (recommended):**

1. Use a lead whose **contact_email** is an inbox Agent E can read (e.g. Tristan seed email, or change seed / create lead with **your** email).
2. From John, run **Phase 2 · Legal** so a contract email is sent (or was sent in seed for Tristan).
3. From **another account**, reply to that contract thread (or email yourself if the workflow searches your address as “client”).
4. In UI: **Legal**, **CRM** (open lead), **Payments**, or **Logs** → click **Agent E · Check replies**
5. Refresh **Logs** → look for `monitor_check`

**If live Agent E is not wired:** explain mock mode; show button still calls `POST /api/orchestrator/check` and logs to Supabase.

**PDF OCR on stage:**

1. Host a signed PDF (OneDrive/GitHub raw URL) or use a public sample contract PDF
2. Paste URL in **Optional: signed PDF URL**
3. Click **OCR** → Agent E validates signature/amount

### 7. Phase 3 — Payments (`/payments`)

1. Select Tristan / invoice row
2. **Phase 3 · Payment**
3. **Logs**: `contract_signed`, `invoice_generated`, `payment_link_sent`
4. **Payments** board updates

### 8. Phase 4 — Monitor (same button)

- **Agent E · Check replies** again for overdue / silence narrative

### 9. AI Manager + Insights (deck)

- Header **sparkle** → AI Manager (demo answers if no `/api/ai/chat`)
- **AI Manager** sidebar route = `/ai/insights` — metrics, agent performance, policy intel

### 10. Logs + Settings

- **Logs** — full audit trail for judges
- **Settings** — orchestrator health, Supabase configured

### 11. Forced exception (deck: “win on Workbench”)

- Low-score lead → workbench
- Or trigger **Escalate** on overdue payment in Payments drawer

---

## C. Where buttons live (UI)

| Action | Where |
|--------|--------|
| New lead | **Max AI** `/max` |
| Phase 2 Legal | **John pipeline actions** on Legal, CRM lead drawer, Payments, Logs |
| Phase 3 Payment | Same card |
| **Agent E · Check replies** | Same card |
| PDF OCR | Same card — URL field + **OCR** |
| Simulated contract OCR | Legal drawer → Upload PDF (browser only) |

---

## D. Curl backup (if UI fails)

See `docs/tristan-pipeline-curl.sh`. Set:

```bash
export BASE=http://localhost:8001
export SECRET=your_webhook_secret
export LEAD_ID=11111111-1111-4111-8111-111111111104
```

Check only:

```bash
curl -X POST "$BASE/api/orchestrator/check" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $SECRET" \
  -d "{\"action\":\"check\",\"lead_id\":\"$LEAD_ID\",\"client_email\":\"you@example.com\"}"
```

---

## E. Gaps / honest notes for judges

| Item | Status |
|------|--------|
| 4+ Operators on Auto | A–E via Supervity workflows |
| John orchestrator | Local FastAPI |
| Command Center UI | Next.js (this repo) |
| AI Policies | Supabase + John enforcement |
| Workbench | Supabase + UI |
| AI Manager chat | Demo mode unless you add `/api/ai/chat` |
| Legal OCR upload | UI simulation |
| **Real OCR + inbox** | **Agent E** + `Check replies` / PDF URL |
| Core capability demo | Call out **OCR & Doc Parsing** on Agent E live |

---

## F. Reset between runs

```powershell
python scripts/reset_and_seed_acelink_demo.py
```
