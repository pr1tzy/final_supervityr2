'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { AgentStatus, AGENTS } from '@/hooks/useDashboardData'
import { cn } from '@/lib/utils'

interface AgentCardProps {
  status: AgentStatus
}

export function AgentCard({ status }: AgentCardProps) {
  const agent = AGENTS[status.agent]

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-800',
    idle: 'bg-gray-100 text-gray-800',
    offline: 'bg-red-100 text-red-800',
  }

  return (
    <Card className={cn('border-2', agent.color, 'border-opacity-20')}>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1'>
            <CardTitle className='text-base'>{agent.name}</CardTitle>
            <p className='text-xs text-gray-600 mt-1'>{agent.role}</p>
          </div>
          <div className={cn('inline-block px-2 py-1 rounded-full text-xs font-semibold', statusColors[status.operationalStatus])}>
            {status.operationalStatus.toUpperCase()}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        {/* Confidence */}
        <div className='flex items-center justify-between'>
          <span className='text-xs text-gray-600'>AI Confidence</span>
          <div className='flex items-center gap-2'>
            <div className='w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden'>
              <div className={cn('h-full transition-all', agent.color)} style={{ width: `${status.aiConfidence}%` }} />
            </div>
            <span className='text-xs font-bold text-gray-900'>{status.aiConfidence}%</span>
          </div>
        </div>

        {/* Active Workflows */}
        <div className='flex items-center justify-between'>
          <span className='text-xs text-gray-600'>Active</span>
          <span className='text-sm font-bold text-blue-600'>{status.activeWorkflows}</span>
        </div>

        {/* Completed */}
        <div className='flex items-center justify-between'>
          <span className='text-xs text-gray-600'>Completed</span>
          <span className='text-sm font-bold text-emerald-600'>{status.completedWorkflows}</span>
        </div>

        {/* Failed */}
        {status.failedWorkflows > 0 && (
          <div className='flex items-center justify-between'>
            <span className='text-xs text-gray-600'>Failed</span>
            <span className='text-sm font-bold text-red-600'>{status.failedWorkflows}</span>
          </div>
        )}

        {/* Escalations */}
        {status.escalations > 0 && (
          <div className='flex items-center justify-between'>
            <span className='text-xs text-gray-600'>Escalations</span>
            <span className='text-sm font-bold text-orange-600'>{status.escalations}</span>
          </div>
        )}

        {/* Last Activity */}
        <div className='text-xs text-gray-500 pt-2 border-t border-gray-100'>
          Last: {new Date(status.lastActivity).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </CardContent>
    </Card>
  )
}
