'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatSupabaseError } from '@/lib/supabase-errors'
import { Lead, WorkbenchReview, PolicyViolation } from '@/lib/supabase'

export interface PaymentWorkflow {
  id: string
  lead_id: string
  company_name: string
  contact_name: string
  deal_size: number
  stage: 'not_eligible' | 'awaiting_payment' | 'payment_sent' | 'payment_received' | 'overdue' | 'failed'
  invoice_number?: string
  invoice_date?: string
  due_date?: string
  amount_due: number
  amount_paid: number
  payment_status: 'pending' | 'partial' | 'completed' | 'overdue' | 'failed'
  days_overdue: number
  payment_method?: string
  created_at: string
  updated_at: string
}

export interface PaymentMetrics {
  invoice_generated?: string
  payment_link_sent?: string
  payment_received?: string
  payment_failed?: string
  payment_reminder_sent?: string
}

export interface PaymentOrchestratorReasoning {
  lead_status: string
  contract_signed: boolean
  payment_link_generated: boolean
  invoice_sent: boolean
  payment_received: boolean
  days_overdue: number
  amount_paid_vs_due: number
  risk_score: number
  requires_follow_up: boolean
  requires_escalation: boolean
  reasoning: string
}

export function usePaymentsData() {
  const [payments, setPayments] = useState<PaymentWorkflow[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })

        if (leadsError) throw leadsError
        setLeads(leadsData || [])

        // Fetch activity logs for payment tracking
        const { data: activityData, error: activityError } = await supabase
          .from('crm_activity_logs')
          .select('*')
          .in('action_type', ['invoice_generated', 'payment_link_sent', 'payment_received', 'payment_failed', 'payment_reminder_sent', 'contract_signed'])
          .order('created_at', { ascending: false })

        if (activityError) throw activityError

        // Convert leads to payment workflows
        const paymentWorkflows = (leadsData || []).map((lead) => {
          // Map lead_status to payment stage
          let stage: PaymentWorkflow['stage'] = 'not_eligible'
          if (lead.lead_status === 'negotiation') {
            stage = 'awaiting_payment'
          } else if (lead.lead_status === 'closed_won') {
            stage = 'payment_received'
          }

          // Extract payment metrics from activity logs
          const leadActivities = (activityData || []).filter((a) => a.lead_id === lead.id)
          const invoiceActivity = leadActivities.find((a) =>
            ['invoice_generated', 'payment_link_sent'].includes(a.action_type)
          )
          const paymentActivity = leadActivities.find((a) => a.action_type === 'payment_received')
          const failureActivity = leadActivities.find((a) => a.action_type === 'payment_failed')

          // Calculate days overdue
          let daysOverdue = 0
          if (invoiceActivity) {
            const invoiceDate = new Date(invoiceActivity.created_at)
            const today = new Date()
            daysOverdue = Math.max(0, Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)) - 30)
          }

          // Update stage based on payment activity
          if (failureActivity && !paymentActivity) {
            stage = 'failed'
          } else if (daysOverdue > 0) {
            stage = 'overdue'
          } else if (paymentActivity) {
            stage = 'payment_received'
          } else if (invoiceActivity) {
            stage = 'payment_sent'
          } else if (stage === 'awaiting_payment') {
            stage = 'awaiting_payment'
          }

          // Determine payment status
          let paymentStatus: PaymentWorkflow['payment_status'] = 'pending'
          if (paymentActivity) {
            paymentStatus = 'completed'
          } else if (failureActivity) {
            paymentStatus = 'failed'
          } else if (daysOverdue > 0) {
            paymentStatus = 'overdue'
          }

          const invoiceMeta = (invoiceActivity?.metadata || {}) as Record<string, unknown>
          const depositFromLog = Number(
            invoiceMeta.deposit_amount_usd ?? invoiceMeta.amount_due_usd ?? 0
          )
          const amountDue =
            lead.estimated_deal_size ??
            (depositFromLog > 0 ? depositFromLog : null) ??
            150000

          return {
            id: lead.id,
            lead_id: lead.id,
            company_name: lead.company_name || '—',
            contact_name: lead.contact_name || '—',
            deal_size: amountDue,
            stage,
            invoice_number:
              (typeof invoiceMeta.invoice_number === 'string' && invoiceMeta.invoice_number) ||
              (invoiceActivity ? `INV-${lead.id.substring(0, 8).toUpperCase()}` : undefined),
            invoice_date: invoiceActivity?.created_at,
            due_date: invoiceActivity ? new Date(new Date(invoiceActivity.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            amount_due: amountDue,
            amount_paid: paymentActivity ? amountDue : 0,
            payment_status: paymentStatus,
            days_overdue: daysOverdue,
            payment_method: paymentActivity ? 'Wire Transfer' : undefined,
            created_at: lead.created_at,
            updated_at: lead.updated_at,
          } as PaymentWorkflow
        })

        setPayments(paymentWorkflows)
      } catch (error) {
        console.error('Error fetching payments data:', formatSupabaseError(error))
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Poll for updates
    const interval = setInterval(fetchData, 25000)
    return () => clearInterval(interval)
  }, [])

  return { payments, leads, loading }
}

export function generatePaymentReasoning(
  payment: PaymentWorkflow,
  lead: Lead | undefined
): PaymentOrchestratorReasoning {
  const contractSigned = lead?.lead_status === 'closed_won' || lead?.lead_status === 'negotiation'
  const paymentReceived = payment.payment_status === 'completed'
  const invoiceSent = payment.stage === 'payment_sent' || payment.stage === 'payment_received' || payment.stage === 'overdue'
  const daysOverdue = payment.days_overdue || 0

  const amountPaidVsDue =
    payment.amount_due > 0 ? payment.amount_paid / payment.amount_due : 0
  const riskScore = Math.min(100, Math.max(0, daysOverdue * 5 + (1 - amountPaidVsDue) * 30))
  const requiresFollowUp = daysOverdue > 0 || payment.payment_status === 'failed'
  const requiresEscalation = daysOverdue > 7 || payment.payment_status === 'failed'

  const reasoningText = `Contract Status: ${contractSigned ? 'Signed' : 'Pending'}. Invoice: ${invoiceSent ? 'Sent' : 'Pending'}. Payment: ${paymentReceived ? 'Received' : 'Awaiting'}. Days Overdue: ${daysOverdue}. Risk Score: ${riskScore.toFixed(0)}/100.`

  return {
    lead_status: lead?.lead_status || 'unknown',
    contract_signed: contractSigned,
    payment_link_generated: invoiceSent,
    invoice_sent: invoiceSent,
    payment_received: paymentReceived,
    days_overdue: daysOverdue,
    amount_paid_vs_due: parseFloat(amountPaidVsDue.toFixed(2)),
    risk_score: parseFloat(riskScore.toFixed(1)),
    requires_follow_up: requiresFollowUp,
    requires_escalation: requiresEscalation,
    reasoning: reasoningText,
  }
}

export async function simulatePaymentAction(
  paymentId: string,
  action: 'send_reminder' | 'mark_received' | 'escalate',
  leadId: string
): Promise<void> {
  // Log the action to crm_activity_logs
  const actionTypeMap = {
    send_reminder: 'payment_reminder_sent',
    mark_received: 'payment_received',
    escalate: 'escalation_triggered',
  }

  const { error: activityError } = await supabase.from('crm_activity_logs').insert([
    {
      lead_id: leadId,
      action_type: actionTypeMap[action],
      action_description: `Payment action: ${action}`,
      performed_by: 'payments_ui',
      metadata: { source: 'payments_tracker' },
    },
  ])

  if (action === 'mark_received') {
    await supabase.from('leads').update({ lead_status: 'closed_won' }).eq('id', leadId)
  }

  if (activityError) throw activityError

  // Create workbench review for escalations
  if (action === 'escalate') {
    const { error: reviewError } = await supabase.from('workbench_reviews').insert([
      {
        lead_id: leadId,
        issue_type: 'payment_escalation',
        issue_description: `Payment escalation triggered for invoice ${paymentId}`,
        requested_by_agent: 'payment_orchestrator',
        review_status: 'pending',
      },
    ])

    if (reviewError) throw reviewError
  }
}

export async function createPaymentPolicyViolation(
  leadId: string,
  violationType: 'payment_overdue' | 'payment_failed' | 'amount_mismatch' | 'suspicious_delay',
  details: string
): Promise<void> {
  const violationReasonMap = {
    payment_overdue: 'Payment overdue beyond 30-day terms',
    payment_failed: 'Payment transaction failed',
    amount_mismatch: 'Paid amount does not match invoice',
    suspicious_delay: 'Unusual delay in payment processing',
  }

  const { error } = await supabase.from('policy_violations').insert([
    {
      lead_id: leadId,
      policy_name: 'Payment Operations',
      violation_reason: violationReasonMap[violationType],
      action_type: 'payment_policy_violation',
      details,
      blocked_action: 'payment_completion',
    },
  ])

  if (error) throw error
}
