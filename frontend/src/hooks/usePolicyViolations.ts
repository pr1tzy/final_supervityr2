'use client'

import { useEffect, useState } from 'react'
import { supabase, PolicyViolation, AIPolicy } from '@/lib/supabase'
import { formatSupabaseError } from '@/lib/supabase-errors'

interface ViolationWithPolicy extends PolicyViolation {
  policyName?: string
}

export function usePolicyViolations(limit: number = 50) {
  const [violations, setViolations] = useState<ViolationWithPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchViolations = async () => {
    try {
      setLoading(true)

      // Fetch violations
      const { data: violationData, error: violationErr } = await supabase
        .from('policy_violations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (violationErr) throw violationErr

      // Fetch all policies to map IDs to names
      const { data: policyData, error: policyErr } = await supabase
        .from('ai_policies')
        .select('id, policy_name')

      // ai_policies optional — table may be empty on hackathon DB
      if (policyErr && policyErr.code !== 'PGRST205') throw policyErr

      // Create a map of policy ID to policy name
      const policyMap = (policyData || []).reduce(
        (acc, policy: any) => {
          acc[policy.id] = policy.policy_name
          return acc
        },
        {} as Record<string, string>
      )

      // Merge policy names into violations
      const enrichedViolations = (violationData || []).map((violation: any) => ({
        ...violation,
        policyName: policyMap[violation.violated_policy_id] || 'Unknown Policy',
      }))

      setViolations(enrichedViolations)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch violations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchViolations()

    // Poll every 20 seconds
    const interval = setInterval(fetchViolations, 20000)
    return () => clearInterval(interval)
  }, [limit])

  return { violations, loading, error, refetch: fetchViolations }
}

export function usePolicyViolationStats() {
  const [stats, setStats] = useState({
    totalViolations: 0,
    uniquePoliciesViolated: 0,
    recentViolations: 0, // last 24 hours
  })
  const [loading, setLoading] = useState(true)

  const calculateStats = async () => {
    try {
      setLoading(true)

      const { data, error: err } = await supabase
        .from('policy_violations')
        .select('*')

      if (err) throw err

      const violations = data || []
      const uniquePolicies = new Set(violations.map((v: any) => v.violated_policy_id))

      // Count violations from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const recent = violations.filter((v: any) => new Date(v.created_at) > new Date(oneDayAgo))

      setStats({
        totalViolations: violations.length,
        uniquePoliciesViolated: uniquePolicies.size,
        recentViolations: recent.length,
      })
    } catch (err) {
      console.error('Failed to calculate stats:', formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    calculateStats()

    // Poll every 20 seconds
    const interval = setInterval(calculateStats, 20000)
    return () => clearInterval(interval)
  }, [])

  return { stats, loading }
}

export function getPolicyViolationsByPolicy(policyId: string) {
  const [violations, setViolations] = useState<PolicyViolation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const { data, error: err } = await supabase
          .from('policy_violations')
          .select('*')
          .eq('violated_policy_id', policyId)
          .order('created_at', { ascending: false })

        if (err) throw err
        setViolations(data || [])
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [policyId])

  return { violations, loading }
}
