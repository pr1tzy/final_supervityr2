# Payments Tracker ↔ Supabase ↔ John (for Twisty)

Twisty’s **Payments Tracker** (`usePaymentsData.ts` in AutoPilot frontend) does **not** use a separate payments table. It derives everything from:

| Source | Fields used |
|--------|-------------|
| **`leads`** | `id`, `company_name`, `contact_name`, `contact_email`, `lead_status`, `estimated_deal_size`, `updated_at`, `notes` |
| **`crm_activity_logs`** | `lead_id`, `action_type`, `action_description`, `metadata`, `created_at` |
| **`workbench_reviews`** | Escalations (`issue_type = payment_escalation`) from UI demo actions |

---

## Pipeline stages (frontend logic)

| UI stage | How Twisty’s hook decides it |
|----------|------------------------------|
| **not_eligible** | Lead not in payment funnel yet (no `negotiation` / no payment activities) |
| **awaiting_payment** | `leads.lead_status = 'negotiation'` (and no invoice yet) |
| **invoice sent** | `crm_activity_logs.action_type = 'invoice_generated'` |
| **payment_received** | `action_type = 'payment_received'` |
| **overdue** | Invoice sent + no payment + age > 30 days (calculated in UI) |
| **failed** | `payment_failed` activity or demo simulate |

---

## What John writes today (after Phase 3 curl / button)

| When | `leads.lead_status` | `crm_activity_logs.action_type` |
|------|---------------------|----------------------------------|
| Phase 1 webhook | `qualified` (hot) | `lead_created`, `outreach_dispatched` |
| Phase 2 legal | `proposal_sent` | `transcript_saved`, `contract_drafted`, `contract_sent` |
| Phase 3 payment | `negotiation` | `contract_signed`, **`invoice_generated`**, `payment_link_sent` |
| Payment confirmed (callback / future button) | `closed_won` | `payment_received` |
| Agent E check | — | `monitor_check` |

**Important:** The UI was built expecting **`invoice_generated`**, not `payment_link_sent`. John now logs **both** so the Payments page populates.

### Recommended `metadata` on `invoice_generated`

```json
{
  "invoice_number": "INV-153A4581",
  "deposit_amount_usd": 150000,
  "amount_due_usd": 150000,
  "payment_status": "link_sent",
  "email_sent": true
}
```

---

## Empty button → wire to John

Twisty can add buttons that call the same endpoints as curl:

| Button | Method | URL | Body |
|--------|--------|-----|------|
| **Send payment / invoice** | `POST` | `/api/orchestrator/phase/payment` | `{ "lead_id": "<uuid>", "deposit_amount_usd": 150000 }` |
| **Run legal / contract** | `POST` | `/api/orchestrator/phase/legal` | `{ "lead_id": "<uuid>", "transcript_payload": { "project_description": "..." } }` |
| **Mark paid** (optional backend) | `POST` | `/api/orchestrator/events` | `{ "event": "operator_callback", "lead_id": "<uuid>", "operator_callback": { "agent": "payment", "response": { "payment": { "payment_status": "paid" } } } }` |

Headers:

```
Content-Type: application/json
X-Webhook-Secret: <ORCHESTRATOR_WEBHOOK_SECRET from .env>
```

Base URL: `http://127.0.0.1:8001` locally, or ngrok URL for deployed UI.

### Example (payment button handler)

```typescript
await fetch(`${ORCHESTRATOR_URL}/api/orchestrator/phase/payment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': process.env.NEXT_PUBLIC_ORCHESTRATOR_WEBHOOK_SECRET!,
  },
  body: JSON.stringify({
    lead_id: selectedLeadId,
    deposit_amount_usd: 150000,
  }),
});
```

Poll Supabase every 25s (already in hook) — new `invoice_generated` row should move the card to **Invoice Sent**.

---

## Gaps / demo actions

| Feature | Status |
|---------|--------|
| Show lead in Payments after Phase 3 | ✅ if `negotiation` + `invoice_generated` |
| **Send Reminder** / **Mark Received** / **Escalate** in drawer | Frontend `simulatePaymentAction()` — may only update local state unless wired to API |
| Real Stripe/Razorpay | Not integrated — placeholder link in Agent D email |
| `payment_received` | Only when John gets `operator_callback` with paid status — add a “Mark received” API if needed |

---

## Backfill Tristan test lead (SQL)

If Phase 3 ran before `invoice_generated` logging was added:

```sql
INSERT INTO crm_activity_logs (lead_id, action_type, action_description, performed_by, metadata)
VALUES (
  '153a4581-b3b5-48d3-9cde-7890abcc0e35',
  'invoice_generated',
  'Backfill — deposit invoice sent',
  'john_local',
  '{"invoice_number":"INV-153A4581","deposit_amount_usd":150000,"amount_due_usd":150000,"payment_status":"link_sent","email_sent":true}'::jsonb
);

UPDATE leads SET lead_status = 'negotiation' WHERE id = '153a4581-b3b5-48d3-9cde-7890abcc0e35';
```

Replace `lead_id` with the row shown in Supabase for tristanhancock@gmail.com.
