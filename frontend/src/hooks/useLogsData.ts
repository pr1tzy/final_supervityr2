'use client'

import { useState, useEffect } from 'react'
import { supabase, AgentRun, CRMActivityLog } from '@/lib/supabase'

export function useAgentRuns(filter: 'all' | 'successful' | 'failed' = 'all') {
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRuns()
  }, [filter])

  const fetchRuns = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('agent_runs')
        .select('*')
        .order('started_at', { ascending: false })

      if (filter === 'successful') {
        query = query.eq('execution_status', 'completed')
      } else if (filter === 'failed') {
        query = query.eq('execution_status', 'failed')
      }

      const { data, error: fetchError } = await query

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

  return { runs, loading, error, refetch: fetchRuns }
}

export function useCRMActivityLogs() {
  const [logs, setLogs] = useState<CRMActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('crm_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

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

  return { logs, loading, error, refetch: fetchLogs }
}

export function useLogsMetrics() {
  const [metrics, setMetrics] = useState({
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    successRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)

      // Fetch all runs
      const { data: allRuns, error: runsError } = await supabase
        .from('agent_runs')
        .select('id, execution_status')

      if (runsError) throw runsError

      const total = allRuns?.length || 0
      const successful = allRuns?.filter((r: any) => r.execution_status === 'completed').length || 0
      const failed = allRuns?.filter((r: any) => r.execution_status === 'failed').length || 0
      const rate = total > 0 ? Math.round((successful / total) * 100) : 0

      setMetrics({
        totalRuns: total,
        successfulRuns: successful,
        failedRuns: failed,
        successRate: rate,
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
