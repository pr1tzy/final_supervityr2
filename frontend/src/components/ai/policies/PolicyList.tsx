'use client'

import React, { useMemo } from 'react'
import { AIPolicy } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { PolicyCard } from './PolicyCard'
import { Skeleton } from '@/components/ui/skeleton'
import { usePolicyViolations } from '@/hooks/usePolicyViolations'

interface PolicyListProps {
  policies: AIPolicy[]
  loading?: boolean
  onPolicyView?: (policy: AIPolicy) => void
  onPolicyToggle?: (policyId: string) => void
  onPolicyDelete?: (policyId: string) => void
}

export function PolicyList({
  policies,
  loading = false,
  onPolicyView,
  onPolicyToggle,
  onPolicyDelete,
}: PolicyListProps) {
  // Fetch all violations to calculate trigger counts
  const { violations } = usePolicyViolations(1000)

  // Map violations by policy ID to get trigger counts and last triggered time
  const violationsByPolicy = useMemo(() => {
    const map: Record<string, { count: number; lastTriggered: string | null }> = {}

    violations.forEach((violation) => {
      if (!map[violation.violated_policy_id]) {
        map[violation.violated_policy_id] = { count: 0, lastTriggered: null }
      }
      map[violation.violated_policy_id].count++

      // Update last triggered time (keep the most recent)
      if (
        !map[violation.violated_policy_id].lastTriggered ||
        new Date(violation.created_at) > new Date(map[violation.violated_policy_id].lastTriggered!)
      ) {
        map[violation.violated_policy_id].lastTriggered = violation.created_at
      }
    })

    return map
  }, [violations])

  if (loading) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-64 w-full' />
        ))}
      </div>
    )
  }

  if (policies.length === 0) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <Icons.shield className='h-12 w-12 text-gray-300 mb-3' />
            <h3 className='font-semibold text-brand-navy'>No policies created yet</h3>
            <p className='text-sm text-brand-muted mt-1'>
              Create your first AI governance policy to get started
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {policies.map((policy) => {
        const stats = violationsByPolicy[policy.id] || { count: 0, lastTriggered: null }
        return (
          <PolicyCard
            key={policy.id}
            policy={policy}
            triggerCount={stats.count}
            lastTriggeredAt={stats.lastTriggered}
            onView={() => onPolicyView?.(policy)}
            onToggleActive={() => onPolicyToggle?.(policy.id)}
            onDelete={() => onPolicyDelete?.(policy.id)}
          />
        )
      })}
    </div>
  )
}
