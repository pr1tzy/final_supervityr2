'use client'

import { useEffect, useState } from 'react'
import { Lead, CRMActivityLog, AgentRun, WorkbenchReview, PolicyViolation } from '@/lib/supabase'
import { safeTable, supabase } from '@/lib/supabase-safe'

// Agent definitions matching the real workflow
export const AGENTS = {
  john: { name: 'John', role: 'Local Orchestrator', color: 'bg-blue-600' },
  jack: { name: 'Agent A', role: 'CRM (Supervity)', color: 'bg-cyan-600' },
  jim: { name: 'Agent B', role: 'Outreach Email', color: 'bg-purple-600' },
  jennie: { name: 'Agent C', role: 'Legal & Contracts', color: 'bg-pink-600' },
  jason: { name: 'Agent D', role: 'Payments', color: 'bg-green-600' },
  human: { name: 'Human', role: 'Workbench Escalations', color: 'bg-orange-600' },
}

function agentFromActionType(actionType?: string | null): keyof typeof AGENTS {
  const t = actionType || ''
  if (t.includes('outreach') || t.includes('email')) return 'jim'
  if (t.includes('contract') || t.includes('transcript') || t.includes('legal')) return 'jennie'
  if (t.includes('payment') || t.includes('invoice')) return 'jason'
  if (t.includes('crm') || t.includes('lead_created')) return 'jack'
  if (t.includes('monitor')) return 'john'
  return 'john'
}

function runLabel(run: { operator_agent?: string | null; orchestrator_agent?: string | null; reasoning_trace?: unknown }): string {
  const op = run.operator_agent
  if (op) return op
  const trace = run.reasoning_trace
  if (trace && typeof trace === 'object' && trace !== null && 'event' in trace) {
    return String((trace as { event?: string }).event || 'orchestrator')
  }
  return run.orchestrator_agent || 'john'
}

export interface AgentStatus {
  agent: keyof typeof AGENTS
  activeWorkflows: number
  completedWorkflows: number
  failedWorkflows: number
  escalations: number
  lastActivity: string
  operationalStatus: 'active' | 'idle' | 'offline'
  aiConfidence: number
}

export interface OperationalEvent {
  id: string
  timestamp: string
  agent: string
  action: string
  status: 'success' | 'failed' | 'escalated' | 'pending'
  leadId?: string
  details?: string
}

export interface PipelineStage {
  stage: string
  count: number
  percentage: number
}

export interface DashboardMetrics {
  totalLeads: number
  activeOrchestrations: number
  completedWorkflows: number
  failedWorkflows: number
  escalationRate: number
  autonomyRate: number
  avgExecutionTime: number
  systemHealthScore: number
}

export interface WorkflowEvent {
  timestamp: string
  time: string
  agent: string
  action: string
  leadCompanyName?: string
  status: 'success' | 'info' | 'warning' | 'error'
}

export function useDashboardData() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([])
  const [operationalEvents, setOperationalEvents] = useState<OperationalEvent[]>([])
  const [workflowTimeline, setWorkflowTimeline] = useState<WorkflowEvent[]>([])
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])
  const [orchestrationActive, setOrchestrationActive] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        const [leads, activities, agentRuns, workbenchReviews, violations] = await Promise.all([
          safeTable<Lead[]>('leads', () =>
            supabase.from('leads').select('*').order('created_at', { ascending: false })
          ),
          safeTable<CRMActivityLog[]>('crm_activity_logs', () =>
            supabase.from('crm_activity_logs').select('*').order('created_at', { ascending: false }).limit(500)
          ),
          safeTable<AgentRun[]>('agent_runs', () =>
            supabase.from('agent_runs').select('*').order('started_at', { ascending: false }).limit(500)
          ),
          safeTable<WorkbenchReview[]>('workbench_reviews', () =>
            supabase.from('workbench_reviews').select('*').order('created_at', { ascending: false }).limit(500)
          ),
          safeTable<PolicyViolation[]>('policy_violations', () =>
            supabase.from('policy_violations').select('*').order('created_at', { ascending: false }).limit(500)
          ),
        ])

        // === CALCULATE METRICS ===
        const totalLeads = leads.length
        const activeOrchestrations = agentRuns.filter((r) => r.execution_status === 'running').length
        const completedWorkflows = agentRuns.filter((r) => r.execution_status === 'completed').length
        const failedWorkflows = agentRuns.filter((r) => r.execution_status === 'failed').length
        const totalWorkflows = agentRuns.length

        const autonomousActions = activities.filter((a) => !a.action_type?.includes('manual')).length
        const humanInterventions = workbenchReviews.length
        const autonomyRate = totalWorkflows > 0 ? Math.round(((totalWorkflows - humanInterventions) / totalWorkflows) * 100) : 100

        const escalationRate = totalWorkflows > 0 ? Math.round((humanInterventions / totalWorkflows) * 100) : 0

        const avgExecutionTime = agentRuns.reduce((sum, r) => {
          if (r.completed_at && r.started_at) {
            return sum + (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime())
          }
          return sum
        }, 0) / (completedWorkflows || 1)

        const systemHealthScore = Math.max(0, Math.min(100, autonomyRate + (1 - failedWorkflows / Math.max(1, totalWorkflows)) * 50))

        setMetrics({
          totalLeads,
          activeOrchestrations,
          completedWorkflows,
          failedWorkflows,
          escalationRate,
          autonomyRate,
          avgExecutionTime: Math.round(avgExecutionTime / 1000),
          systemHealthScore: Math.round(systemHealthScore),
        })

        // === BUILD AGENT STATUSES ===
        const agentMap: Record<string, AgentStatus> = {
          john: {
            agent: 'john',
            activeWorkflows: activeOrchestrations,
            completedWorkflows: completedWorkflows,
            failedWorkflows: failedWorkflows,
            escalations: workbenchReviews.length,
            lastActivity: agentRuns[0]?.started_at || new Date().toISOString(),
            operationalStatus: activeOrchestrations > 0 ? 'active' : 'idle',
            aiConfidence: 94,
          },
          jack: {
            agent: 'jack',
            activeWorkflows: activities.filter((a) => /lead_created|crm/i.test(a.action_type || '')).length,
            completedWorkflows: activities.filter((a) => a.action_type === 'lead_created').length,
            failedWorkflows: 0,
            escalations: workbenchReviews.filter((w) => /crm/i.test(w.issue_type || '')).length,
            lastActivity:
              activities.find((a) => /lead_created|crm/i.test(a.action_type || ''))?.created_at ||
              new Date().toISOString(),
            operationalStatus: activities.some((a) => a.action_type === 'lead_created') ? 'active' : 'idle',
            aiConfidence: 91,
          },
          jim: {
            agent: 'jim',
            activeWorkflows: activities.filter((a) => /outreach|email/i.test(a.action_type || '')).length,
            completedWorkflows: activities.filter((a) => a.action_type === 'outreach_dispatched').length,
            failedWorkflows: 0,
            escalations: 0,
            lastActivity:
              activities.find((a) => /outreach|email/i.test(a.action_type || ''))?.created_at ||
              new Date().toISOString(),
            operationalStatus: activities.some((a) => a.action_type === 'outreach_dispatched') ? 'active' : 'idle',
            aiConfidence: 88,
          },
          jennie: {
            agent: 'jennie',
            activeWorkflows: activities.filter((a) => /contract|transcript/i.test(a.action_type || '')).length,
            completedWorkflows: activities.filter((a) =>
              ['contract_drafted', 'contract_sent', 'contract_signed'].includes(a.action_type)
            ).length,
            failedWorkflows: 0,
            escalations: workbenchReviews.filter((w) => /contract|legal/i.test(w.issue_type || '')).length,
            lastActivity:
              activities.find((a) => /contract|transcript/i.test(a.action_type || ''))?.created_at ||
              new Date().toISOString(),
            operationalStatus: activities.some((a) => /contract/i.test(a.action_type || '')) ? 'active' : 'idle',
            aiConfidence: 92,
          },
          jason: {
            agent: 'jason',
            activeWorkflows: activities.filter((a) => /payment|invoice/i.test(a.action_type || '')).length,
            completedWorkflows: activities.filter((a) =>
              ['payment_link_sent', 'payment_received', 'invoice_generated'].includes(a.action_type)
            ).length,
            failedWorkflows: violations.length,
            escalations: workbenchReviews.filter((w) => /payment/i.test(w.issue_type || '')).length,
            lastActivity:
              activities.find((a) => /payment|invoice/i.test(a.action_type || ''))?.created_at ||
              new Date().toISOString(),
            operationalStatus: activities.some((a) => /invoice|payment/i.test(a.action_type || '')) ? 'active' : 'idle',
            aiConfidence: 89,
          },
          human: {
            agent: 'human',
            activeWorkflows: workbenchReviews.filter((w) => w.review_status === 'pending').length,
            completedWorkflows: workbenchReviews.filter((w) => w.review_status !== 'pending').length,
            failedWorkflows: 0,
            escalations: workbenchReviews.length,
            lastActivity: workbenchReviews[0]?.created_at || new Date().toISOString(),
            operationalStatus: workbenchReviews.filter((w) => w.review_status === 'pending').length > 0 ? 'active' : 'idle',
            aiConfidence: 100,
          },
        }

        setAgentStatuses(Object.values(agentMap))
        setOrchestrationActive(activeOrchestrations > 0)

        // === BUILD OPERATIONAL EVENTS ===
        const events: OperationalEvent[] = []

        // Agent run events
        agentRuns.slice(0, 50).forEach((run) => {
          events.push({
            id: run.id,
            timestamp: run.started_at,
            agent: agentFromActionType(runLabel(run)),
            action: `Orchestrator run (${run.execution_status})`,
            status: run.execution_status === 'failed' ? 'failed' : 'success',
            details: runLabel(run),
          })
        })

        // Activity events
        activities.slice(0, 30).forEach((activity) => {
          events.push({
            id: activity.id,
            timestamp: activity.created_at,
            agent: agentFromActionType(activity.action_type),
            action: activity.action_type?.replace(/_/g, ' ') || 'Activity',
            status: 'success',
            details: activity.action_description,
          })
        })

        // Workbench events
        workbenchReviews.slice(0, 20).forEach((review) => {
          events.push({
            id: review.id,
            timestamp: review.created_at,
            agent: 'human',
            action: `Review escalation (${review.issue_type})`,
            status: review.review_status === 'pending' ? 'pending' : 'success',
            details: review.issue_description,
          })
        })

        const sortedEvents = events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20)
        setOperationalEvents(sortedEvents)

        // === BUILD PIPELINE STAGES ===
        const stageMap: Record<string, number> = {}
        const stageOrder = [
          'new',
          'qualified',
          'proposal_sent',
          'negotiation',
          'closed_won',
        ]

        leads.forEach((lead) => {
          const stage = lead.lead_status || 'new'
          stageMap[stage] = (stageMap[stage] || 0) + 1
        })

        const stages: PipelineStage[] = stageOrder.map((stage) => ({
          stage: stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          count: stageMap[stage] || 0,
          percentage: totalLeads > 0 ? Math.round(((stageMap[stage] || 0) / totalLeads) * 100) : 0,
        }))

        setPipelineStages(stages)

        // === BUILD WORKFLOW TIMELINE ===
        const timelineEvents: WorkflowEvent[] = []

        // Get recent activities and convert to timeline
        activities.slice(0, 50).forEach((activity) => {
          const date = new Date(activity.created_at)
          const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          const agentKey = agentFromActionType(activity.action_type)
          const agent = AGENTS[agentKey].name

          timelineEvents.push({
            timestamp: activity.created_at,
            time,
            agent,
            action: activity.action_type?.replace(/_/g, ' ') || 'Activity',
            status: 'success',
          })
        })

        setWorkflowTimeline(timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 10000)
    return () => clearInterval(interval)
  }, [])

  return {
    loading,
    metrics,
    agentStatuses,
    operationalEvents,
    workflowTimeline,
    pipelineStages,
    orchestrationActive,
  }
}
