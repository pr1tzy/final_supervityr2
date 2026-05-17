import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
}

// Reject Supervity SSO / Keycloak tokens pasted by mistake (causes empty {} fetch errors)
if (supabaseKey.includes('auto-sso') || supabaseKey.includes('Keycloak')) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY looks like a Supervity SSO token. Use the Supabase anon or service_role JWT from the Supabase dashboard (same as SupervityR2/.env SUPABASE_SERVICE_ROLE_KEY).'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Type definitions for CRM tables - ALIGNED WITH REAL SCHEMA

export type Lead = {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
  phone: string
  source: string | null
  industry: string | null
  lead_status: string
  lead_score: number
  estimated_deal_size: number | null
  competitor_mentioned: string | null
  notes: string | null
  assigned_to: string | null
  created_by_agent: string | null
  updated_by_agent: string | null
  created_at: string
  updated_at: string
}

export type CRMActivityLog = {
  id: string
  lead_id: string
  action_type: string
  action_description: string
  performed_by: string
  metadata: Record<string, any> | null
  created_at: string
}

export type AgentRun = {
  id: string
  transcript_id: string | null
  orchestrator_agent: string
  operator_agent: string | null
  execution_status: string
  reasoning_trace: string | Record<string, unknown> | null
  started_at: string
  completed_at: string | null
}

export type AIMetric = {
  id: string
  metric_name: string
  metric_value: number
  metadata: Record<string, any> | null
  recorded_at: string
}

export type AIPolicy = {
  id: string
  policy_name: string
  policy_description: string
  active: boolean
  created_at: string
}

export type PolicyViolation = {
  id: string
  lead_id: string | null
  transcript_id: string | null
  violated_policy_id: string
  violation_reason: string
  blocked_action: string | null
  created_at: string
}

export type WorkbenchReview = {
  id: string
  transcript_id: string | null
  lead_id: string | null
  issue_type: string
  issue_description: string
  requested_by_agent: string
  review_status: string
  human_response: string | null
  reviewed_by: string | null
  created_at: string
  resolved_at: string | null
}

export type MeetingTranscript = {
  id: string
  lead_id: string
  transcript_text: string
  duration: number | null
  recorded_at: string
}

export type FollowUp = {
  id: string
  lead_id: string
  follow_up_type: string
  scheduled_date: string
  status: string
  created_at: string
}
