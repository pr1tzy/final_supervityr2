'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { DashboardMetrics } from '@/hooks/useDashboardData'
import { Skeleton } from '@/components/ui/skeleton'

interface HumanAICollaborationProps {
  metrics: DashboardMetrics | null
  loading?: boolean
}

export function HumanAICollaboration({ metrics, loading = false }: HumanAICollaborationProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Human + AI Collaboration</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-32 w-full' />
        </CardContent>
      </Card>
    )
  }

  const autonomyRate = metrics?.autonomyRate ?? 0
  const escalationRate = metrics?.escalationRate ?? 0

  return (
    <Card className='bg-gradient-to-br from-purple-50 to-pink-50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.users className='h-5 w-5 text-purple-600' />
          Human + AI Collaboration
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Autonomy Rate */}
        <div>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-sm font-medium text-gray-700'>AI Autonomous Actions</span>
            <span className='text-2xl font-bold text-purple-600'>{autonomyRate}%</span>
          </div>
          <div className='w-full h-4 bg-gray-200 rounded-full overflow-hidden'>
            <div
              className='h-full transition-all bg-gradient-to-r from-purple-500 to-blue-500'
              style={{ width: `${autonomyRate}%` }}
            />
          </div>
          <p className='text-xs text-gray-600 mt-2'>Workflows completed autonomously by AI agents</p>
        </div>

        {/* Escalation Rate */}
        <div>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-sm font-medium text-gray-700'>Human Escalations</span>
            <span className='text-2xl font-bold text-orange-600'>{escalationRate}%</span>
          </div>
          <div className='w-full h-4 bg-gray-200 rounded-full overflow-hidden'>
            <div
              className='h-full transition-all bg-gradient-to-r from-orange-500 to-red-500'
              style={{ width: `${escalationRate}%` }}
            />
          </div>
          <p className='text-xs text-gray-600 mt-2'>Workflows requiring human review and approval</p>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-2 gap-4 pt-4 border-t border-purple-200'>
          <div className='text-center p-3 rounded-lg bg-purple-100'>
            <p className='text-xs text-purple-700 font-semibold mb-1'>Autonomous Workflows</p>
            <p className='text-2xl font-bold text-purple-800'>{metrics?.completedWorkflows ?? 0}</p>
          </div>
          <div className='text-center p-3 rounded-lg bg-orange-100'>
            <p className='text-xs text-orange-700 font-semibold mb-1'>Human Escalations</p>
            <p className='text-2xl font-bold text-orange-800'>{Math.round((metrics?.completedWorkflows ?? 0) * (escalationRate / (100 - escalationRate || 1)))}</p>
          </div>
        </div>

        <div className='pt-4 border-t border-purple-200 text-xs text-gray-700 space-y-1'>
          <p>
            <strong>AI Strengths:</strong> Fast processing, pattern recognition, rule-based decisions
          </p>
          <p>
            <strong>Human Value:</strong> Complex judgment, edge cases, approval authority
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
