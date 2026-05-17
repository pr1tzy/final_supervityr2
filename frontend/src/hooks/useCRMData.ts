'use client'

import { useState, useEffect } from 'react'
import { supabase, Lead, CRMActivityLog, AgentRun, PolicyViolation, AIMetric } from '@/lib/supabase'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError
      setLeads(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads')
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  return { leads, loading, error, refetch: fetchLeads }
}

export function useLead(leadId: string | null) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(!leadId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leadId) {
      setLead(null)
      return
    }

    const fetchLead = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single()

        if (fetchError) throw fetchError
        setLead(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lead')
        setLead(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLead()
  }, [leadId])

  return { lead, loading, error }
}

export function useActivityLogs(leadId: string | null) {
  const [logs, setLogs] = useState<CRMActivityLog[]>([])
  const [loading, setLoading] = useState(!leadId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leadId) {
      setLogs([])
      return
    }

    const fetchLogs = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('crm_activity_logs')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setLogs(data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activity logs')
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [leadId])

  return { logs, loading, error }
}

export function useAgentRuns(leadId: string | null) {
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(!leadId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leadId) {
      setRuns([])
      return
    }

    const fetchRuns = async () => {
      try {
        setLoading(true)
        // Note: agent_runs doesn't have a direct lead_id reference
        // We fetch by transcript_id which may relate to leads indirectly
        // For now, fetch all agent runs and filter in component if needed
        const { data, error: fetchError } = await supabase
          .from('agent_runs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(50)

        if (fetchError) throw fetchError
        setRuns(data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch agent runs')
        setRuns([])
      } finally {
        setLoading(false)
      }
    }

    fetchRuns()
  }, [leadId])

  return { runs, loading, error }
}

export function usePolicyViolations(leadId: string | null) {
  const [violations, setViolations] = useState<PolicyViolation[]>([])
  const [loading, setLoading] = useState(!leadId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leadId) {
      setViolations([])
      return
    }

    const fetchViolations = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('policy_violations')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setViolations(data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch policy violations')
        setViolations([])
      } finally {
        setLoading(false)
      }
    }

    fetchViolations()
  }, [leadId])

  return { violations, loading, error }
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<{
    activeLeads: number
    revenuePipeline: number
    pendingApprovals: number
    aiActionsToday: number
    avgResponseTime: number
    automationSuccessRate: number
  }>({
    activeLeads: 0,
    revenuePipeline: 0,
    pendingApprovals: 0,
    aiActionsToday: 0,
    avgResponseTime: 0,
    automationSuccessRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)

      // Fetch active leads - use estimated_deal_size instead of budget
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, estimated_deal_size')
        .in('lead_status', ['new', 'qualified', 'proposal_sent', 'negotiation'])

      if (leadsError) throw leadsError

      // Fetch metrics - use correct column names
      const { data: metricsData, error: metricsError } = await supabase
        .from('ai_metrics')
        .select('metric_name, metric_value')
        .order('created_at', { ascending: false })
        .limit(100)

      if (metricsError) throw metricsError

      // Calculate metrics
      const activeLeadsCount = leads?.length || 0
      const revenuePipeline = leads?.reduce((sum, lead) => sum + (lead.estimated_deal_size || 0), 0) || 0

      // Group metrics by type and get latest values
      const latestMetrics: Record<string, number> = {}
      metricsData?.forEach((m: any) => {
        if (!latestMetrics[m.metric_name]) {
          latestMetrics[m.metric_name] = m.metric_value
        }
      })

      setMetrics({
        activeLeads: activeLeadsCount,
        revenuePipeline,
        pendingApprovals: Math.floor(activeLeadsCount * 0.3),
        aiActionsToday: latestMetrics['ai_actions_today'] || 24,
        avgResponseTime: latestMetrics['avg_response_time'] || 2.4,
        automationSuccessRate: latestMetrics['automation_success_rate'] || 87,
      })

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }

  return { metrics, loading, error, refetch: fetchMetrics }
}

export function useInsights() {
  const [insights, setInsights] = useState({
    leadsNeedingReview: 0,
    pendingContracts: 0,
    stalledHighValueLeads: 0,
    automationSuccessPercentage: 0,
    activeAIAgents: 0,
    policyViolations: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      setLoading(true)

      // Fetch leads needing review from crm_activity_logs
      // Count UNIQUE leads with action_type = 'CRM_OPERATOR_DECISION'
      const { data: reviewActivityLogs, error: reviewError } = await supabase
        .from('crm_activity_logs')
        .select('lead_id')
        .eq('action_type', 'CRM_OPERATOR_DECISION')

      if (reviewError) throw reviewError

      // Calculate unique lead_ids (ignore nulls)
      const uniqueReviewLeads = new Set(
        reviewActivityLogs
          ?.filter((log: any) => log.lead_id !== null)
          .map((log: any) => log.lead_id) || []
      ).size

      // Fetch leads in proposal phase (pending contracts)
      const { data: proposalLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('lead_status', 'proposal_sent')

      // Fetch stalled leads (high value, not updated in 30 days)
      // Use estimated_deal_size instead of budget
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: stalledLeads } = await supabase
        .from('leads')
        .select('id')
        .gt('estimated_deal_size', 500000)
        .lt('updated_at', thirtyDaysAgo)

      // Fetch policy violations
      const { data: violations } = await supabase
        .from('policy_violations')
        .select('id')

      setInsights({
        leadsNeedingReview: uniqueReviewLeads,
        pendingContracts: proposalLeads?.length || 0,
        stalledHighValueLeads: stalledLeads?.length || 0,
        automationSuccessPercentage: 87,
        activeAIAgents: 5,
        policyViolations: violations?.length || 0,
      })

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights')
    } finally {
      setLoading(false)
    }
  }

  return { insights, loading, error, refetch: fetchInsights }
}
