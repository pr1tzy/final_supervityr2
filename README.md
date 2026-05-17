# AceLink — Autonomous Revenue Operations (Final)

Monorepo for **John** (local orchestrator) + **Twisty Command Center** (Next.js UI) + **Supervity Agents A–E**.

This folder is a clean copy for GitHub / demo. Source trees elsewhere in the hackathon workspace are unchanged.

## Structure

```
final_supervityr2/
├── app/                 # FastAPI backend + John orchestrator
├── frontend/            # Next.js Command Center (CRM, Legal, Payments, Max AI, …)
├── docs/                # Pipeline curls, agent prompts, integration notes
├── scripts/             # Demo seed, Supabase RLS, test runners
├── tests/
├── docker-compose.yml
├── .env.example         # Backend secrets (copy → .env)
└── DEMO.md              # Full presentation runbook
```

## Prerequisites

- Docker Desktop (optional — can run backend/frontend natively)
- Python 3.11+
- Node.js 20+
- Supabase project (shared CRM)
- Supervity Auto workflow IDs (Agents A–E) — mock mode works without live calls

## Quick start (local demo)

### 1. Backend

```powershell
cd final_supervityr2
Copy-Item .env.example .env
# Edit .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ORCHESTRATOR_WEBHOOK_SECRET, Supervity IDs

pip install -r packages/requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Health: http://localhost:8001/api/orchestrator/health

### 2. Seed Supabase demo data

```powershell
python scripts/reset_and_seed_acelink_demo.py
```

### 3. Frontend

```powershell
cd frontend
Copy-Item .env.local.example .env.local
# Set Supabase anon/service key + same ORCHESTRATOR_WEBHOOK_SECRET as backend

npm install
npm run dev
```

Open http://localhost:3001 (or the port shown in the terminal).

### 4. Full demo path

See **[DEMO.md](./DEMO.md)** — Max AI intake → CRM → Logs → Legal → Payments → Policies → Workbench.

## Key URLs (UI)

| Route | Purpose |
|-------|---------|
| `/` | Dashboard + embedded Max intake |
| `/max` | Lead chatbot → `POST /api/orchestrator/webhook/lead` |
| `/crm` | Kanban pipeline |
| `/logs` | CRM activity + John `agent_runs` |
| `/legal` | Contracts / phase 2 |
| `/payments` | Invoices / phase 3 |
| `/ai/policies` | Governance rules (John enforces min score) |
| `/ai/insights` | AI Manager analytics |
| `/workbench` | Human escalations |

Header **sparkle** icon opens AI Manager (demo replies if `/api/ai/chat` is not deployed).

## Docker (all services)

```powershell
Copy-Item .env.example .env
# Set FRONTEND_TARGET=dev in .env for hot reload

docker compose up --build
```

Backend: http://localhost:8001 · Frontend: http://localhost:3001

## Docs

- `docs/PIPELINE_TRIGGERS.md` — phase 1–4 API
- `docs/tristan-pipeline-curl.sh` — Tristan end-to-end curls
- `docs/front-twist-integration.md` — UI ↔ John wiring

## Security

Never commit `.env`, `.env.local`, or real API keys. Use `.env.example` / `frontend/.env.local.example` only.
