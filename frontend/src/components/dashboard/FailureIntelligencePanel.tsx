'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { DashboardMetrics } from '@/hooks/useDashboardData'
import { Skeleton } from '@/components/ui/skeleton'

interface FailureIntelligencePanelProps {
  metrics: DashboardMetrics | null
  loading?: boolean
}

export function FailureIntelligencePanel({ metrics, loading = false }: FailureIntelligencePanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failure Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-32 w-full' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-red-300 bg-red-50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.alertTriangle className='h-5 w-5 text-red-600' />
          Failure Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Failure Count */}
        <div className='p-4 rounded-lg bg-white border border-red-200'>
          <p className='text-sm text-gray-700 mb-2'>Failed Workflows (Recent)</p>
          <p className='text-3xl font-bold text-red-700'>{metrics?.failedWorkflows ?? 0}</p>
        </div>

        {/* Failure Rate */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm text-gray-700'>Failure Rate</span>
            {metrics?.completedWorkflows && metrics.failedWorkflows && (
              <span className='text-sm font-bold text-red-700'>
                {Math.round(((metrics.failedWorkflows) / (metrics.completedWorkflows + metrics.failedWorkflows)) * 100)}%
              </span>
            )}
          </div>
          <div className='w-full h-2 bg-gray-300 rounded-full overflow-hidden'>
            <div
              className='h-full bg-red-500'
              style={{
                width: metrics?.completedWorkflows
                  ? `${Math.min(100, Math.round(((metrics.failedWorkflows) / (metrics.completedWorkflows + metrics.failedWorkflows)) * 100))}%`
                  : '0%',
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div className='pt-4 border-t border-red-200'>
          <p className='text-xs font-semibold text-gray-700 mb-2'>Status:</p>
          {(metrics?.failedWorkflows ?? 0) === 0 ? (
            <p className='text-sm text-emerald-700 font-semibold'>No recent failures - system operating normally</p>
          ) : (
            <p className='text-sm text-red-700 font-semibold'>
              {metrics?.failedWorkflows} workflows need investigation
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
