'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'

interface InsightItemProps {
  icon: React.ReactNode
  title: string
  value: number
  color: 'emerald' | 'amber' | 'red' | 'blue' | 'purple'
  description?: string
  loading?: boolean
}

function InsightItem({
  icon,
  title,
  value,
  color,
  description,
  loading,
}: InsightItemProps) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-500/5',
    amber: 'from-amber-500/20 to-amber-500/5',
    red: 'from-red-500/20 to-red-500/5',
    blue: 'from-blue-500/20 to-blue-500/5',
    purple: 'from-purple-500/20 to-purple-500/5',
  }

  const textColorClasses = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  }

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br ${colorClasses[color]}`}>
        <CardContent className='pt-6'>
          <Skeleton className='h-6 w-20 mb-2' />
          <Skeleton className='h-8 w-12' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} border-0`}>
      <CardContent className='pt-6'>
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <div className={`${textColorClasses[color]} rounded-lg p-2`}>{icon}</div>
            <div className='flex-1'>
              <p className='text-sm font-medium text-brand-navy'>{title}</p>
              {description && (
                <p className='text-xs text-brand-muted'>{description}</p>
              )}
            </div>
          </div>

          <div className={`${textColorClasses[color]} text-2xl font-bold`}>
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface AIInsightsBarProps {
  insights: {
    leadsNeedingReview: number
    pendingContracts: number
    stalledHighValueLeads: number
    automationSuccessPercentage: number
    activeAIAgents: number
    policyViolations: number
  }
  loading?: boolean
}

export function AIInsightsBar({ insights, loading }: AIInsightsBarProps) {
  const insightItems = [
    {
      icon: <Icons.user className='h-5 w-5' />,
      title: 'Leads Needing Review',
      value: insights.leadsNeedingReview,
      color: 'amber' as const,
    },
    {
      icon: <Icons.fileText className='h-5 w-5' />,
      title: 'Pending Contracts',
      value: insights.pendingContracts,
      color: 'blue' as const,
    },
    {
      icon: <Icons.alertCircle className='h-5 w-5' />,
      title: 'Stalled High-Value Leads',
      value: insights.stalledHighValueLeads,
      color: 'red' as const,
    },
    {
      icon: <Icons.zap className='h-5 w-5' />,
      title: 'Automation Success',
      value: insights.automationSuccessPercentage,
      color: 'emerald' as const,
      description: '%',
    },
    {
      icon: <Icons.bot className='h-5 w-5' />,
      title: 'Active AI Agents',
      value: insights.activeAIAgents,
      color: 'purple' as const,
    },
    {
      icon: <Icons.alertTriangle className='h-5 w-5' />,
      title: 'Policy Violations',
      value: insights.policyViolations,
      color: 'red' as const,
    },
  ]

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6'>
      {insightItems.map((item) => (
        <InsightItem key={item.title} {...item} loading={loading} />
      ))}
    </div>
  )
}
