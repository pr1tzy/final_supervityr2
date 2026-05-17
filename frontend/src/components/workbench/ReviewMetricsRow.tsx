'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'

interface ReviewMetricsRowProps {
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  avgResolutionTime: number
  loading?: boolean
}

export function ReviewMetricsRow({
  pendingCount,
  approvedCount,
  rejectedCount,
  avgResolutionTime,
  loading = false,
}: ReviewMetricsRowProps) {
  const metrics = [
    {
      label: 'Pending Reviews',
      value: pendingCount,
      icon: Icons.clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      valueColor: 'text-amber-700',
    },
    {
      label: 'Approved',
      value: approvedCount,
      icon: Icons.check,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      valueColor: 'text-emerald-700',
    },
    {
      label: 'Rejected',
      value: rejectedCount,
      icon: Icons.close,
      color: 'bg-red-50 text-red-700 border-red-200',
      valueColor: 'text-red-700',
    },
    {
      label: 'Avg Resolution Time',
      value: `${avgResolutionTime}m`,
      icon: Icons.clock,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      valueColor: 'text-blue-700',
    },
  ]

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.label} className={`border ${metric.color}`}>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-sm font-medium'>
                <span>{metric.label}</span>
                <Icon className='h-4 w-4 opacity-60' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className={`text-3xl font-bold ${metric.valueColor}`}>
                  {metric.value}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
