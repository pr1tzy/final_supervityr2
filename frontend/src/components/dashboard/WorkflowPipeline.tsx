'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { PipelineStage } from '@/hooks/useDashboardData'
import { Skeleton } from '@/components/ui/skeleton'

interface WorkflowPipelineProps {
  stages: PipelineStage[]
  loading?: boolean
}

export function WorkflowPipeline({ stages, loading = false }: WorkflowPipelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-32 w-full' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.trendingUp className='h-5 w-5 text-blue-600' />
          Autonomous Business Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {stages.map((stage, idx) => (
            <div key={stage.stage} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='font-medium text-sm text-gray-900'>{stage.stage}</span>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-bold text-gray-900'>{stage.count}</span>
                  <span className='text-xs text-gray-600'>({stage.percentage}%)</span>
                </div>
              </div>
              <div className='w-full h-3 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className='h-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-cyan-500'
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
