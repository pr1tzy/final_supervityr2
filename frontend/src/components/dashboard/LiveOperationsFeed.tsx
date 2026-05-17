'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { OperationalEvent } from '@/hooks/useDashboardData'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface LiveOperationsFeedProps {
  events: OperationalEvent[]
  loading?: boolean
}

const statusColors = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  failed: 'bg-red-50 border-red-200 text-red-700',
  escalated: 'bg-orange-50 border-orange-200 text-orange-700',
  pending: 'bg-amber-50 border-amber-200 text-amber-700',
}

export function LiveOperationsFeed({ events, loading = false }: LiveOperationsFeedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Operations Feed</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className='h-12 w-full' />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-2 border-green-500/30 bg-gradient-to-br from-green-50/50 to-emerald-50/30'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Icons.activity className='h-5 w-5 text-green-600' />
            Live Operations Feed
          </CardTitle>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 rounded-full bg-green-600 animate-pulse' />
            <span className='text-xs font-semibold text-green-700'>LIVE</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-2 max-h-96 overflow-y-auto'>
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className={cn('p-3 rounded-lg border', statusColors[event.status])}>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium'>
                      <span className='font-bold'>{event.agent}</span> {event.action}
                    </p>
                    {event.details && <p className='text-xs opacity-75 mt-1 truncate'>{event.details}</p>}
                  </div>
                  <span className='text-xs whitespace-nowrap flex-shrink-0 opacity-75'>
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-600 text-center py-8'>No recent operations</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
