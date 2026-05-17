'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { DashboardMetrics } from '@/hooks/useDashboardData'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SystemHealthPanelProps {
  metrics: DashboardMetrics | null
  loading?: boolean
}

export function SystemHealthPanel({ metrics, loading = false }: SystemHealthPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-32 w-full' />
        </CardContent>
      </Card>
    )
  }

  const healthScore = metrics?.systemHealthScore ?? 0
  const healthStatus = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical'
  const colors = {
    healthy: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
    critical: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500' },
  }

  const color = colors[healthStatus]

  return (
    <Card className={color.bg}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Icons.heart className='h-5 w-5 text-red-600' />
            System Health & Reliability
          </CardTitle>
          <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-bold', color.text, color.bg)}>
            {healthStatus.toUpperCase()}
          </span>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Health Score */}
        <div>
          <div className='flex items-center justify-between mb-3'>
            <span className='font-medium text-gray-900'>Overall Health Score</span>
            <span className={cn('text-3xl font-bold', color.text)}>{healthScore}%</span>
          </div>
          <div className='w-full h-3 bg-gray-200 rounded-full overflow-hidden'>
            <div className={cn('h-full transition-all', color.bar)} style={{ width: `${healthScore}%` }} />
          </div>
        </div>

        {/* Individual Metrics */}
        <div className='space-y-3 pt-4 border-t border-gray-200'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-gray-700'>Workflow Success Rate</span>
            <span className='font-bold text-emerald-700'>{metrics?.autonomyRate ?? 0}%</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-gray-700'>Failed Workflows</span>
            <span className='font-bold text-red-700'>{metrics?.failedWorkflows ?? 0}</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-gray-700'>Avg Execution Time</span>
            <span className='font-bold text-gray-900'>{metrics?.avgExecutionTime ?? 0}s</span>
          </div>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-gray-700'>Escalation Rate</span>
            <span className='font-bold text-orange-700'>{metrics?.escalationRate ?? 0}%</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className='mt-4 pt-4 border-t border-gray-200'>
          <div className='flex items-center gap-2'>
            <div className={cn('h-3 w-3 rounded-full animate-pulse', color.bar)} />
            <span className='text-xs text-gray-700'>
              {healthStatus === 'healthy' && 'System operating optimally'}
              {healthStatus === 'warning' && 'Monitor for potential issues'}
              {healthStatus === 'critical' && 'Immediate attention required'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
