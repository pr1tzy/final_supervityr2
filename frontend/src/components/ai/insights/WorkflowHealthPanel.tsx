'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkflowHealth } from '@/hooks/useAIInsights'
import { cn } from '@/lib/utils'

interface WorkflowHealthPanelProps {
  health: WorkflowHealth | null
  loading?: boolean
}

export function WorkflowHealthPanel({ health, loading = false }: WorkflowHealthPanelProps) {
  const healthStatus = health?.successRate ? (health.successRate >= 85 ? 'healthy' : health.successRate >= 70 ? 'warning' : 'critical') : 'healthy'

  const healthColors = {
    healthy: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  }

  const colors = healthColors[healthStatus]

  return (
    <Card className={`border ${colors.border} ${colors.bg}`}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Icons.zap className={`h-5 w-5 ${colors.text}`} />
            AI Workflow Health
          </CardTitle>
          <div className={cn('inline-block px-3 py-1 rounded-full text-xs font-semibold', colors.text, colors.bg)}>
            {healthStatus.toUpperCase()}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {loading ? (
          <div className='space-y-3'>
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-full' />
          </div>
        ) : (
          <>
            {/* Success Rate Gauge */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Success Rate</span>
                <span className={cn('text-2xl font-bold', colors.text)}>{health?.successRate ?? 0}%</span>
              </div>
              <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className={cn('h-full transition-all duration-300', {
                    'bg-emerald-500': healthStatus === 'healthy',
                    'bg-amber-500': healthStatus === 'warning',
                    'bg-red-500': healthStatus === 'critical',
                  })}
                  style={{ width: `${Math.min(100, health?.successRate ?? 0)}%` }}
                />
              </div>
            </div>

            {/* Status Grid */}
            <div className='grid grid-cols-3 gap-3 pt-2'>
              <div className='text-center p-2 bg-white/50 rounded-lg'>
                <Icons.checkCircle className='h-5 w-5 text-emerald-600 mx-auto mb-1' />
                <p className='text-xs font-medium text-gray-700'>Completed</p>
                <p className='text-lg font-bold text-emerald-700'>{health?.completed ?? 0}</p>
              </div>
              <div className='text-center p-2 bg-white/50 rounded-lg'>
                <Icons.loader className='h-5 w-5 text-blue-600 mx-auto mb-1' />
                <p className='text-xs font-medium text-gray-700'>Running</p>
                <p className='text-lg font-bold text-blue-700'>{health?.running ?? 0}</p>
              </div>
              <div className='text-center p-2 bg-white/50 rounded-lg'>
                <Icons.close className='h-5 w-5 text-red-600 mx-auto mb-1' />
                <p className='text-xs font-medium text-gray-700'>Failed</p>
                <p className='text-lg font-bold text-red-700'>{health?.failed ?? 0}</p>
              </div>
            </div>

            {/* Duration */}
            <div className='flex items-center justify-between pt-2 border-t border-gray-200'>
              <span className='text-sm text-gray-600'>Avg Execution Time</span>
              <span className='font-semibold text-gray-900'>{health?.avgDuration ?? 0}s</span>
            </div>

            {/* Failure Rate */}
            <div className='flex items-center justify-between border-t border-gray-200 pt-2'>
              <span className='text-sm text-gray-600'>Failure Rate</span>
              <span className='font-semibold text-red-700'>{health?.failureRate ?? 0}%</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
