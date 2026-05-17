'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { WorkflowEvent } from '@/hooks/useDashboardData'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface WorkflowTimelineProps {
  events: WorkflowEvent[]
  loading?: boolean
}

const statusIcons = {
  success: Icons.checkCircle,
  info: Icons.info,
  warning: Icons.alertTriangle,
  error: Icons.close,
}

const statusColors = {
  success: 'text-emerald-600 bg-emerald-50',
  info: 'text-blue-600 bg-blue-50',
  warning: 'text-amber-600 bg-amber-50',
  error: 'text-red-600 bg-red-50',
}

export function WorkflowTimeline({ events, loading = false }: WorkflowTimelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Timeline</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className='h-12 w-full' />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.clock className='h-5 w-5 text-purple-600' />
          Workflow Execution Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-0'>
          {events.length > 0 ? (
            events.map((event, idx) => {
              const Icon = statusIcons[event.status]
              return (
                <div key={idx} className='flex gap-4 pb-6 relative last:pb-0'>
                  {/* Timeline line */}
                  {idx < events.length - 1 && (
                    <div className='absolute left-5 top-10 h-6 w-0.5 bg-gradient-to-b from-purple-400 to-purple-200' />
                  )}

                  {/* Icon */}
                  <div className={cn('relative z-10 mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center', statusColors[event.status])}>
                    <Icon className='h-5 w-5' />
                  </div>

                  {/* Content */}
                  <div className='flex-1 min-w-0 pt-1'>
                    <div className='flex items-start justify-between gap-2'>
                      <div>
                        <p className='text-sm font-semibold text-gray-900'>
                          {event.agent} — {event.action}
                        </p>
                        {event.leadCompanyName && <p className='text-xs text-gray-600 mt-1'>{event.leadCompanyName}</p>}
                      </div>
                      <span className='text-xs font-medium text-gray-600 whitespace-nowrap'>{event.time}</span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className='text-sm text-gray-600 text-center py-8'>No workflow events</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
