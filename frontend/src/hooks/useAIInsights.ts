'use client'

import { useEffect, useState } from 'react'
import { safeTable, supabase } from '@/lib/supabase-safe'
import { Lead, WorkbenchReview } from '@/lib/supabase'

// Type definitions for insights
export interface ExecutiveMetrics {
  totalLeads: number
  activeWorkflows: number
  humanEscalations: number
  policiesTriggered: number
  contractsInReview: number
  revenuePipeline: number
  closedRevenue: number
  workflowSuccessRate: number
}

export interface WorkflowHealth {
  completed: number
  failed: number
  running: number
  avgDuration: number
  successRate: number
  failureRate: number
}

export interface LeadIntel {
  totalLeads: number
  hotLeads: Array<{
    id: string
    company_name: string
    contact_name: string
    estimated_deal_size: number
    lead_score: number
    lead_status: string
  }>
  stageDistribution: Record<string, number>
  revenuePipeline: number
  avgDealSize: number
  closedRevenue: number
  leadSourceIntel: Record<string, number>
}

export interface AgentPerf {
  topOrchestratorAgents: Array<{
    agent: string
    completedWorkflows: number
    successRate: number
    failureRate: number
  }>
  mostActiveAgents: Array<{
    agent: string
    runCount: number
  }>
  failingAgents: Array<{
    agent: string
    failureCount: number
    failureRate: number
  }>
  escalationHeavyAgents: Array<{
    agent: string
    escalationCount: number
  }>
}

export interface HumanReviewStats {
  pendingEscalations: number
  resolvedEscalations: number
  avgResolutionTime: number
  topCategories: Record<string, number>
  aiToHumanRatio: number
}

export interface PolicyIntel {
  mostTriggeredPolicies: Array<{
    policy_name: string
    violation_count: number
  }>
  violationFrequency: number
  blockedActions: Record<string, number>
  highRiskWorkflows: string[]
}

export interface LegalInsights {
  contractsAwaitingValidation: number
  ocrMismatchCount: number
  signatureVerificationStatus: Record<string, number>
  contractEscalationTrend: number
}

export interface PaymentIntel {
  pipelineValue: number
  contractsAwaitingPayment: number
  overdueRisks: number
  revenueConversion: number
  closedWonRevenue: number
}

export interface FailureAnalysis {
  topFailureReasons: Array<{
    reason: string
    count: number
  }>
  failureCategories: Record<string, number>
  systemBottlenecks: string[]
}

export interface OperationsFeedItem {
  id: string
  timestamp: string
  agent?: string
  action: string
  status: 'info' | 'warning' | 'success' | 'error'
  category: 'crm' | 'policy' | 'workbench' | 'agent' | 'payment'
  details?: string
}

export interface AIRecommendation {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metric: string
  change?: number
  action?: string
}

export function useAIInsights() {
  const [loading, setLoading] = useState(true)
  const [executiveMetrics, setExecutiveMetrics] = useState<ExecutiveMetrics | null>(null)
  const [workflowHealth, setWorkflowHealth] = useState<WorkflowHealth | null>(null)
  const [leadIntel, setLeadIntel] = useState<LeadIntel | null>(null)
  const [agentPerf, setAgentPerf] = useState<AgentPerf | null>(null)
  const [humanReviewStats, setHumanReviewStats] = useState<HumanReviewStats | null>(null)
  const [policyIntel, setPolicyIntel] = useState<PolicyIntel | null>(null)
  const [legalInsights, setLegalInsights] = useState<LegalInsights | null>(null)
  const [paymentIntel, setPaymentIntel] = useState<PaymentIntel | null>(null)
  const [failureAnalysis, setFailureAnalysis] = useState<FailureAnalysis | null>(null)
  const [operationsFeed, setOperationsFeed] = useState<OperationsFeedItem[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])

  useEffect(() => {
    const fetchAllInsights = async () => {
      try {
        setLoading(true)

        // Fetch all data in parallel
        const [leads, activities, agentRuns, workbench, policies, violations] = await Promise.all([
          safeTable<any[]>('leads', () => supabase.from('leads').select('*')),
          safeTable<any[]>('crm_activity_logs', () =>
            supabase.from('crm_activity_logs').select('*').order('created_at', { ascending: false }).limit(1000)
          ),
          safeTable<any[]>('agent_runs', () =>
            supabase.from('agent_runs').select('*').order('started_at', { ascending: false }).limit(500)
          ),
          safeTable<any[]>('workbench_reviews', () =>
            supabase.from('workbench_reviews').select('*').order('created_at', { ascending: false }).limit(500)
          ),
          safeTable<any[]>('ai_policies', () => supabase.from('ai_policies').select('*')),
          safeTable<any[]>('policy_violations', () =>
            supabase.from('policy_violations').select('*').order('created_at', { ascending: false }).limit(500)
          ),
        ])

        // === EXECUTIVE METRICS ===
        const activeWorkflows = agentRuns.filter((r) => r.execution_status === 'running').length
        const failedWorkflows = agentRuns.filter((r) => r.execution_status === 'failed').length
        const completedWorkflows = agentRuns.filter((r) => r.execution_status === 'completed').length
        const totalWorkflows = agentRuns.length
        const workflowSuccessRate = totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0

        const escalations = workbench.filter((w) => w.review_status === 'pending').length
        const contractsInReview = workbench.filter((w) => w.issue_type === 'contract_validation' && w.review_status === 'pending').length

        const closedWonLeads = leads.filter((l) => l.lead_status === 'closed_won')
        const negotiationLeads = leads.filter((l) => l.lead_status === 'negotiation')

        const revenuePipeline = negotiationLeads.reduce((sum, l) => sum + (l.estimated_deal_size || 0), 0)
        const closedRevenue = closedWonLeads.reduce((sum, l) => sum + (l.estimated_deal_size || 0), 0)

        setExecutiveMetrics({
          totalLeads: leads.length,
          activeWorkflows,
          humanEscalations: escalations,
          policiesTriggered: violations.length,
          contractsInReview,
          revenuePipeline,
          closedRevenue,
          workflowSuccessRate: Math.round(workflowSuccessRate),
        })

        // === WORKFLOW HEALTH ===
        const avgDuration = agentRuns.reduce((sum, r) => {
          if (r.completed_at && r.started_at) {
            return sum + (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime())
          }
          return sum
        }, 0) / (completedWorkflows || 1)

        setWorkflowHealth({
          completed: completedWorkflows,
          failed: failedWorkflows,
          running: activeWorkflows,
          avgDuration: Math.round(avgDuration / 1000), // seconds
          successRate: Math.round(workflowSuccessRate),
          failureRate: totalWorkflows > 0 ? Math.round((failedWorkflows / totalWorkflows) * 100) : 0,
        })

        // === LEAD INTELLIGENCE ===
        const sortedLeads = [...leads].sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
        const hotLeads = sortedLeads.slice(0, 5)

        const stageDistribution: Record<string, number> = {}
        leads.forEach((l) => {
          stageDistribution[l.lead_status] = (stageDistribution[l.lead_status] || 0) + 1
        })

        const avgDealSize = leads.length > 0 ? leads.reduce((sum, l) => sum + (l.estimated_deal_size || 0), 0) / leads.length : 0

        const leadSourceIntel: Record<string, number> = {}
        leads.forEach((l) => {
          leadSourceIntel[l.source] = (leadSourceIntel[l.source] || 0) + 1
        })

        setLeadIntel({
          totalLeads: leads.length,
          hotLeads: hotLeads.map((l) => ({
            id: l.id,
            company_name: l.company_name,
            contact_name: l.contact_name,
            estimated_deal_size: l.estimated_deal_size,
            lead_score: l.lead_score || 0,
            lead_status: l.lead_status,
          })),
          stageDistribution,
          revenuePipeline,
          avgDealSize: Math.round(avgDealSize),
          closedRevenue,
          leadSourceIntel,
        })

        // === AGENT PERFORMANCE ===
        const agentMetrics: Record<string, { completed: number; failed: number; escalations: number }> = {}
        agentRuns.forEach((r) => {
          const agent = r.orchestrator_agent
          if (!agentMetrics[agent]) {
            agentMetrics[agent] = { completed: 0, failed: 0, escalations: 0 }
          }
          if (r.execution_status === 'completed') agentMetrics[agent].completed++
          if (r.execution_status === 'failed') agentMetrics[agent].failed++
        })

        workbench.forEach((w) => {
          const agent = w.requested_by_agent
          if (agent && agentMetrics[agent]) {
            agentMetrics[agent].escalations++
          }
        })

        const topOrchestratorAgents = Object.entries(agentMetrics)
          .map(([agent, metrics]) => ({
            agent,
            completedWorkflows: metrics.completed,
            successRate: metrics.completed + metrics.failed > 0 ? Math.round((metrics.completed / (metrics.completed + metrics.failed)) * 100) : 0,
            failureRate: metrics.completed + metrics.failed > 0 ? Math.round((metrics.failed / (metrics.completed + metrics.failed)) * 100) : 0,
          }))
          .sort((a, b) => b.completedWorkflows - a.completedWorkflows)
          .slice(0, 5)

        const mostActiveAgents = Object.entries(agentMetrics)
          .map(([agent, metrics]) => ({
            agent,
            runCount: metrics.completed + metrics.failed,
          }))
          .sort((a, b) => b.runCount - a.runCount)
          .slice(0, 5)

        const failingAgents = Object.entries(agentMetrics)
          .filter(([_, metrics]) => metrics.failed > 0)
          .map(([agent, metrics]) => ({
            agent,
            failureCount: metrics.failed,
            failureRate: Math.round((metrics.failed / (metrics.completed + metrics.failed)) * 100),
          }))
          .sort((a, b) => b.failureCount - a.failureCount)
          .slice(0, 5)

        const escalationHeavyAgents = Object.entries(agentMetrics)
          .map(([agent, metrics]) => ({
            agent,
            escalationCount: metrics.escalations,
          }))
          .filter((a) => a.escalationCount > 0)
          .sort((a, b) => b.escalationCount - a.escalationCount)
          .slice(0, 5)

        setAgentPerf({
          topOrchestratorAgents,
          mostActiveAgents,
          failingAgents,
          escalationHeavyAgents,
        })

        // === HUMAN REVIEW ANALYTICS ===
        const pending = workbench.filter((w) => w.review_status === 'pending').length
        const resolved = workbench.filter((w) => w.review_status !== 'pending').length

        const avgResolutionTime = workbench.reduce((sum, w) => {
          if (w.resolved_at && w.created_at) {
            return sum + (new Date(w.resolved_at).getTime() - new Date(w.created_at).getTime())
          }
          return sum
        }, 0) / (resolved || 1)

        const topCategories: Record<string, number> = {}
        workbench.forEach((w) => {
          topCategories[w.issue_type] = (topCategories[w.issue_type] || 0) + 1
        })

        setHumanReviewStats({
          pendingEscalations: pending,
          resolvedEscalations: resolved,
          avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60)), // minutes
          topCategories,
          aiToHumanRatio: totalWorkflows > 0 ? Math.round((escalations / totalWorkflows) * 100) : 0,
        })

        // === POLICY INTELLIGENCE ===
        const policyViolationCounts: Record<string, number> = {}
        violations.forEach((v) => {
          policyViolationCounts[v.policy_name] = (policyViolationCounts[v.policy_name] || 0) + 1
        })

        const mostTriggeredPolicies = Object.entries(policyViolationCounts)
          .map(([name, count]) => ({ policy_name: name, violation_count: count }))
          .sort((a, b) => b.violation_count - a.violation_count)
          .slice(0, 5)

        const blockedActions: Record<string, number> = {}
        violations.forEach((v) => {
          blockedActions[v.action_type] = (blockedActions[v.action_type] || 0) + 1
        })

        const highRiskWorkflows = Object.entries(blockedActions)
          .filter(([_, count]) => count > 3)
          .map(([action]) => action)

        setPolicyIntel({
          mostTriggeredPolicies,
          violationFrequency: violations.length,
          blockedActions,
          highRiskWorkflows,
        })

        // === LEGAL INSIGHTS ===
        const contractValidations = workbench.filter((w) => w.issue_type === 'contract_validation')
        const contractsAwaiting = contractValidations.filter((w) => w.review_status === 'pending').length
        const ocrMismatches = contractValidations.filter((w) => w.issue_description?.includes('mismatch')).length
        const signatureStatus: Record<string, number> = {}

        const contractEscalationTrend = contractValidations.filter(
          (w) => new Date(w.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length

        setLegalInsights({
          contractsAwaitingValidation: contractsAwaiting,
          ocrMismatchCount: ocrMismatches,
          signatureVerificationStatus: { verified: contractValidations.length - ocrMismatches, mismatched: ocrMismatches },
          contractEscalationTrend: contractEscalationTrend,
        })

        // === PAYMENT INTELLIGENCE ===
        const paymentActivities = activities.filter((a) =>
          ['payment_received', 'payment_failed', 'invoice_generated', 'payment_link_sent'].includes(a.action_type)
        )
        const paymentEscalations = workbench.filter((w) => w.issue_type === 'payment_escalation')
        const awaitingPaymentCount = negotiationLeads.filter((l) => {
          const hasInvoice = activities.find((a) => a.lead_id === l.id && a.action_type === 'invoice_generated')
          const hasPayment = activities.find((a) => a.lead_id === l.id && a.action_type === 'payment_received')
          return hasInvoice && !hasPayment
        }).length

        const overdueCount = paymentEscalations.filter((w) => w.issue_description?.includes('overdue')).length

        setPaymentIntel({
          pipelineValue: revenuePipeline,
          contractsAwaitingPayment: awaitingPaymentCount,
          overdueRisks: overdueCount,
          revenueConversion: leads.length > 0 ? Math.round((closedWonLeads.length / leads.length) * 100) : 0,
          closedWonRevenue: closedRevenue,
        })

        // === FAILURE ANALYSIS ===
        const failureReasons: Record<string, number> = {}
        agentRuns
          .filter((r) => r.execution_status === 'failed')
          .forEach((r) => {
            try {
              const trace = typeof r.reasoning_trace === 'string' ? JSON.parse(r.reasoning_trace) : r.reasoning_trace
              const reason = trace?.error_reason || trace?.failure_reason || 'Unknown error'
              failureReasons[reason] = (failureReasons[reason] || 0) + 1
            } catch {
              failureReasons['Parse error'] = (failureReasons['Parse error'] || 0) + 1
            }
          })

        const topFailureReasons = Object.entries(failureReasons)
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        const failureCategories: Record<string, number> = {}
        agentRuns
          .filter((r) => r.execution_status === 'failed')
          .forEach((r) => {
            const category = r.workflow_name?.split('_')[0] || 'unknown'
            failureCategories[category] = (failureCategories[category] || 0) + 1
          })

        setFailureAnalysis({
          topFailureReasons,
          failureCategories,
          systemBottlenecks: ['CRM sync delays', 'Payment API timeouts'].filter((b) => failureReasons[b]),
        })

        // === OPERATIONS FEED ===
        const feedItems: OperationsFeedItem[] = []

        // Add recent agent run failures
        agentRuns
          .filter((r) => r.execution_status === 'failed')
          .slice(0, 3)
          .forEach((r) => {
            feedItems.push({
              id: r.id,
              timestamp: r.started_at,
              agent: r.orchestrator_agent,
              action: `Workflow execution failed`,
              status: 'error',
              category: 'agent',
              details: r.workflow_name,
            })
          })

        // Add recent policy violations
        violations
          .slice(0, 3)
          .forEach((v) => {
            feedItems.push({
              id: v.id,
              timestamp: v.created_at,
              action: `Policy engine blocked action`,
              status: 'warning',
              category: 'policy',
              details: v.policy_name,
            })
          })

        // Add recent workbench escalations
        workbench
          .filter((w) => w.review_status === 'pending')
          .slice(0, 3)
          .forEach((w) => {
            feedItems.push({
              id: w.id,
              timestamp: w.created_at,
              agent: w.requested_by_agent,
              action: `Escalated to human review`,
              status: 'info',
              category: 'workbench',
              details: w.issue_type,
            })
          })

        // Add recent CRM activities
        activities
          .slice(0, 3)
          .forEach((a) => {
            feedItems.push({
              id: a.id,
              timestamp: a.created_at,
              action: a.action_type.replace(/_/g, ' '),
              status: 'info',
              category: 'crm',
              details: a.action_description,
            })
          })

        // Sort by timestamp and take top 10
        const sortedFeed = feedItems
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)

        setOperationsFeed(sortedFeed)

        // === AI RECOMMENDATIONS ===
        const recs: AIRecommendation[] = []

        // High-value leads awaiting follow-up
        const hotLeadsAwaitingAction = hotLeads.filter((l) => l.lead_status === 'new').length
        if (hotLeadsAwaitingAction > 0) {
          recs.push({
            title: 'High-Value Leads Awaiting Follow-up',
            description: `${hotLeadsAwaitingAction} high-scoring leads (score 80+) are in new status`,
            priority: 'high',
            metric: 'lead_score',
            action: 'Initiate contact outreach',
          })
        }

        // Payment escalations trend
        if (paymentEscalations.length > 2) {
          recs.push({
            title: 'Payment Escalations Rising',
            description: `${paymentEscalations.length} payment-related escalations in past week`,
            priority: 'high',
            metric: 'payment_escalation_count',
            action: 'Review payment collection process',
          })
        }

        // Agent performance concerns
        if (failingAgents.length > 0) {
          recs.push({
            title: `${failingAgents[0].agent} Agent Failing Frequently`,
            description: `${failingAgents[0].failureRate}% failure rate (${failingAgents[0].failureCount} failures)`,
            priority: 'high',
            metric: 'agent_failure_rate',
            action: 'Debug workflow issues',
          })
        }

        // Contract review delays
        if (contractsInReview > 5) {
          recs.push({
            title: 'Contract Review Backlog',
            description: `${contractsInReview} contracts awaiting validation - may impact conversions`,
            priority: 'medium',
            metric: 'contract_backlog',
            action: 'Prioritize contract reviews',
          })
        }

        // Policy violations in specific workflows
        if (highRiskWorkflows.length > 0) {
          recs.push({
            title: 'Policy Violations in Key Workflows',
            description: `${violations.length} total violations - highest risk in ${highRiskWorkflows[0]}`,
            priority: 'medium',
            metric: 'policy_violations',
            action: 'Audit workflow policies',
          })
        }

        setRecommendations(recs)
      } catch (error) {
        console.error('Error fetching AI insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllInsights()

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchAllInsights, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    loading,
    executiveMetrics,
    workflowHealth,
    leadIntel,
    agentPerf,
    humanReviewStats,
    policyIntel,
    legalInsights,
    paymentIntel,
    failureAnalysis,
    operationsFeed,
    recommendations,
  }
}
