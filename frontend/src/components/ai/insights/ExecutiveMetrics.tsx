'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { ExecutiveMetrics as IExecutiveMetrics } from '@/hooks/useAIInsights'

interface ExecutiveMetricsProps {
  metrics: IExecutiveMetrics | null
  loading?: boolean
}

export function ExecutiveMetrics({ metrics, loading = false }: ExecutiveMetricsProps) {
  const metricCards = [
    {
      label: 'Total Leads',
      value: metrics?.totalLeads ?? 0,
      icon: Icons.users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Workflows',
      value: metrics?.activeWorkflows ?? 0,
      icon: Icons.zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Escalations',
      value: metrics?.humanEscalations ?? 0,
      icon: Icons.alertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Policies Triggered',
      value: metrics?.policiesTriggered ?? 0,
      icon: Icons.shield,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Contracts Pending',
      value: metrics?.contractsInReview ?? 0,
      icon: Icons.fileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Pipeline Value',
      value: `$${((metrics?.revenuePipeline ?? 0) / 1000).toFixed(0)}K`,
      icon: Icons.barChart,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      label: 'Closed Revenue',
      value: `$${((metrics?.closedRevenue ?? 0) / 1000).toFixed(0)}K`,
      icon: Icons.checkCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Success Rate',
      value: `${metrics?.workflowSuccessRate ?? 0}%`,
      icon: Icons.trendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ]

  return (
    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
      {metricCards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className={`border-0 ${card.bg}`}>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-sm font-medium text-gray-700'>{card.label}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className={`text-3xl font-bold ${card.color}`}>
                  {card.value}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
