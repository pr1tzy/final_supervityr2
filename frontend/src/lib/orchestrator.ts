/**
 * John orchestrator — wire Payments / Legal buttons to backend (SupervityR2 on :8001).
 * Set in frontend/.env.local:
 *   NEXT_PUBLIC_API_URL=http://localhost:8001
 *   NEXT_PUBLIC_ORCHESTRATOR_WEBHOOK_SECRET=...
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
const WEBHOOK_SECRET = process.env.NEXT_PUBLIC_ORCHESTRATOR_WEBHOOK_SECRET || ''

function orchestratorHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(WEBHOOK_SECRET ? { 'X-Webhook-Secret': WEBHOOK_SECRET } : {}),
  }
}

export async function triggerPhasePayment(leadId: string, depositAmountUsd = 150000) {
  const res = await fetch(`${API_URL}/api/orchestrator/phase/payment`, {
    method: 'POST',
    headers: orchestratorHeaders(),
    body: JSON.stringify({ lead_id: leadId, deposit_amount_usd: depositAmountUsd }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Payment phase failed')
  }
  return res.json()
}

export type LeadIntakePayload = {
  name: string
  email: string
  company?: string
  phone?: string
  budget?: string
  project_type?: string
  message?: string
}

/** AceLink Max — POST new lead to John (phase 1 pipeline). */
export async function submitLeadToJohn(payload: LeadIntakePayload, source = 'Max AI Chat') {
  const res = await fetch(`${API_URL}/api/orchestrator/webhook/lead`, {
    method: 'POST',
    headers: orchestratorHeaders(),
    body: JSON.stringify({
      event: 'lead_created',
      source,
      lead_payload: {
        name: payload.name,
        email: payload.email,
        company: payload.company || payload.name,
        phone: payload.phone || '',
        budget: payload.budget || '',
        project_type: payload.project_type || 'website',
        message: payload.message || '',
      },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail) || 'Lead intake failed')
  }
  return res.json() as Promise<{
    success: boolean
    lead_id?: string
    message?: string
    reasoning_trace?: Record<string, unknown>
  }>
}

export async function fetchOrchestratorHealth() {
  const res = await fetch(`${API_URL}/api/orchestrator/health`)
  if (!res.ok) throw new Error('Orchestrator unreachable')
  return res.json()
}

export async function triggerPhaseLegal(
  leadId: string,
  transcript: { project_description: string; scoped_budget?: string; scoped_timeline?: string }
) {
  const res = await fetch(`${API_URL}/api/orchestrator/phase/legal`, {
    method: 'POST',
    headers: orchestratorHeaders(),
    body: JSON.stringify({ lead_id: leadId, transcript_payload: transcript }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Legal phase failed')
  }
  return res.json()
}
