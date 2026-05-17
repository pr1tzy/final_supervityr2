'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { usePolicyViolations } from '@/hooks/usePolicyViolations'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

interface PolicyViolationsPanelProps {
  onViolationClick?: (violationId: string) => void
}

export function PolicyViolationsPanel({
  onViolationClick,
}: PolicyViolationsPanelProps) {
  const { violations, loading } = usePolicyViolations(20)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Policy Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (violations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Policy Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Icons.checkCircle className='h-12 w-12 text-emerald-600 mb-3' />
            <h3 className='font-medium text-brand-navy'>No policy violations</h3>
            <p className='text-sm text-brand-muted mt-1'>
              All workflows are compliant with active policies
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Policy Violations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {violations.map((violation) => (
            <div
              key={violation.id}
              className='rounded-lg border border-red-200 bg-red-50 p-3 hover:bg-red-100 transition-colors cursor-pointer'
              onClick={() => onViolationClick?.(violation.id)}
            >
              <div className='flex items-start justify-between gap-3'>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-red-800'>
                    Policy: {violation.policyName}
                  </p>
                  <p className='text-xs text-red-700 mt-1 line-clamp-2'>
                    {violation.violation_reason}
                  </p>
                  <div className='flex items-center gap-3 mt-2 text-xs text-red-600'>
                    {violation.lead_id && (
                      <span>
                        Lead: <code className='text-[11px]'>{violation.lead_id.substring(0, 8)}</code>
                      </span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(violation.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <Icons.alertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
