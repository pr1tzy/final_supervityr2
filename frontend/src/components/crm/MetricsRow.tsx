'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'

interface MetricCardProps {
  label: string
  value: number | string
  change?: number
  icon?: React.ReactNode
  loading?: boolean
}

function MetricCard({ label, value, change, icon, loading }: MetricCardProps) {
  if (loading) {
    return (
      <Card className='relative overflow-hidden'>
        <CardContent className='pt-6'>
          <Skeleton className='h-6 w-24 mb-2' />
          <Skeleton className='h-8 w-32' />
        </CardContent>
      </Card>
    )
  }

  const isPositive = change !== undefined && change > 0

  return (
    <Card className='relative overflow-hidden'>
      <CardContent className='pt-6'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-brand-muted'>{label}</span>
            {icon && <div className='text-brand-cornflower opacity-70'>{icon}</div>}
          </div>

          <div className='flex items-baseline gap-2'>
            <span className='font-display text-3xl font-bold text-brand-navy'>
              {typeof value === 'number' && value >= 1000
                ? `$${(value / 1000).toFixed(1)}K`
                : value}
            </span>
            {change !== undefined && (
              <span
                className={`text-sm font-medium ${
                  isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {isPositive ? '↑' : '↓'} {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>

        {/* Gradient accent */}
        <div className='absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-brand-cornflower/10 to-transparent blur-2xl' />
      </CardContent>
    </Card>
  )
}

interface MetricsRowProps {
  metrics: {
    activeLeads: number
    revenuePipeline: number
    pendingApprovals: number
    aiActionsToday: number
    avgResponseTime: number
    automationSuccessRate: number
  }
  loading?: boolean
}

export function MetricsRow({ metrics, loading }: MetricsRowProps) {
  const metricsData = [
    {
      label: 'Active Leads',
      value: metrics.activeLeads,
      icon: <Icons.users className='h-5 w-5' />,
    },
    {
      label: 'Revenue Pipeline',
      value: metrics.revenuePipeline,
      icon: <Icons.trendingUp className='h-5 w-5' />,
    },
    {
      label: 'Pending Approvals',
      value: metrics.pendingApprovals,
      icon: <Icons.checkCircle className='h-5 w-5' />,
    },
    {
      label: 'AI Actions Today',
      value: metrics.aiActionsToday,
      icon: <Icons.sparkles className='h-5 w-5' />,
    },
    {
      label: 'Avg Response Time',
      value: `${metrics.avgResponseTime}h`,
      icon: <Icons.clock className='h-5 w-5' />,
    },
    {
      label: 'Automation Success',
      value: `${metrics.automationSuccessRate}%`,
      icon: <Icons.zap className='h-5 w-5' />,
    },
  ]

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6'>
      {metricsData.map((metric) => (
        <MetricCard key={metric.label} {...metric} loading={loading} />
      ))}
    </div>
  )
}
