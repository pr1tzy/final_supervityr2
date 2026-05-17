# front_twist ↔ SupervityR2 backend

Twisty’s UI lives in **`/Hackathon/front_twist/SupervityR2/frontend`**.  
Your John orchestrator + agents live in **`/Hackathon/SupervityR2`** (Docker on port **8001**).

They share **one Supabase project** — the frontend reads tables; the backend writes them.

---

## Architecture

```
Max / curl  →  SupervityR2 backend (John)  →  Supabase
                      ↑
Payments UI  →  Supabase (read)  +  optional POST /phase/* (write via agents)
```

**Important:** `front_twist`’s bundled backend folder does **not** include `pipeline_phases.py` — run **`Hackathon/SupervityR2`** for orchestrator APIs.

---

## Supabase: what Payments page needs

| Source | Field | John writes | Twisty reads |
|--------|-------|-------------|--------------|
| `leads` | `lead_status` | `negotiation` after payment phase | `negotiation` → awaiting_payment |
| `crm_activity_logs` | `action_type` | `invoice_generated`, `payment_link_sent`, `contract_signed` | Stage **invoice sent** |
| `crm_activity_logs` | `created_at` | auto | Was wrongly `recorded_at` in hook — **fixed in front_twist** |
| `crm_activity_logs` | `action_description` | yes | Was wrongly `details` on insert — **fixed** |
| `crm_activity_logs` | `action_type` | `payment_received` (callback) | Stage **payment received** |

Drawer buttons **Send reminder / Mark received / Escalate** write directly to Supabase (`simulatePaymentAction`) — they do **not** call John unless you wire them.

---

## Env for Twisty frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://oswgepszkvaxxskksuxa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or service_role for hackathon>
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_ORCHESTRATOR_WEBHOOK_SECRET=igenuinelydontcareaboutthis
```

Run frontend from `front_twist/SupervityR2/frontend`:

```bash
npm install
npm run dev
```

---

## Empty buttons Twisty mentioned

Helper added: `frontend/src/lib/orchestrator.ts`

```typescript
import { triggerPhasePayment, triggerPhaseLegal } from '@/lib/orchestrator'

// Payment button
await triggerPhasePayment(leadId, 150000)

// Legal button (after meeting)
await triggerPhaseLegal(leadId, {
  project_description: '...',
  scoped_budget: '500000',
  scoped_timeline: 'October 2026',
})
```

---

## Legal Hub (`useLegalData.ts`)

- **Does not** read `crm_activity_logs` for contract status yet.
- **Derives** contract stage from `leads.lead_status` only (`qualified` → sent, `proposal_sent` → signed, etc.).
- OCR/validation is **simulated** in the browser — real OCR is Agent E via `POST /api/orchestrator/check`.

So Legal UI updates when John sets `lead_status` after Phase 2 (`proposal_sent`).

---

## Checklist

| Item | Status |
|------|--------|
| Same Supabase URL/key in frontend + backend `.env` | You verify |
| RLS script run | `scripts/supabase_rls_hackathon.sql` |
| Backend restarted after `invoice_generated` logging | Yes |
| `usePaymentsData` uses `created_at` | Fixed in front_twist |
| Orchestrator API wired to buttons | Helper ready — Twisty connects in UI |
| `front_twist` backend used for agents | **No** — use main SupervityR2 |
