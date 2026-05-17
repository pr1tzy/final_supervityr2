'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardMetrics } from '@/hooks/useDashboardData'
import { cn } from '@/lib/utils'

interface ExecutiveOverviewProps {
  metrics: DashboardMetrics | null
  loading?: boolean
  orchestrationActive: boolean
}

export function ExecutiveOverview({ metrics, loading = false, orchestrationActive }: ExecutiveOverviewProps) {
  const metricCards = [
    {
      label: 'Active Orchestrations',
      value: metrics?.activeOrchestrations ?? 0,
      icon: Icons.zap,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: orchestrationActive ? '↑ Live' : '—',
    },
    {
      label: 'Autonomy Rate',
      value: `${metrics?.autonomyRate ?? 0}%`,
      icon: Icons.checkCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      trend: 'AI-driven',
    },
    {
      label: 'Escalations',
      value: `${metrics?.escalationRate ?? 0}%`,
      icon: Icons.users,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      trend: 'Human review',
    },
    {
      label: 'System Health',
      value: `${metrics?.systemHealthScore ?? 0}%`,
      icon: Icons.heart,
      color: 'text-red-600',
      bg: 'bg-red-50',
      trend: 'Operational',
    },
    {
      label: 'Completed Workflows',
      value: metrics?.completedWorkflows ?? 0,
      icon: Icons.checkCircle,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      trend: 'processed',
    },
    {
      label: 'Failed Workflows',
      value: metrics?.failedWorkflows ?? 0,
      icon: Icons.alertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      trend: 'needs review',
    },
  ]

  return (
    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6'>
      {metricCards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className={`border-0 ${card.bg}`}>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-xs font-medium text-gray-700'>{card.label}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                  <p className='text-xs text-gray-600 mt-1'>{card.trend}</p>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
