'use client'

import React from 'react'
import { CRMActivityLog } from '@/lib/supabase'
import { Icons } from '@/components/ui/icons'
import { formatDistanceToNow } from 'date-fns'

interface ActivityTimelineProps {
  logs: CRMActivityLog[]
  loading?: boolean
}

const actionColors: Record<string, string> = {
  created: 'bg-blue-500/10 text-blue-600',
  updated: 'bg-purple-500/10 text-purple-600',
  reviewed: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  rejected: 'bg-red-500/10 text-red-600',
  assigned: 'bg-indigo-500/10 text-indigo-600',
}

export function ActivityTimeline({ logs, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className='space-y-4'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='flex gap-4'>
            <div className='h-10 w-10 flex-shrink-0 rounded-full bg-gray-200' />
            <div className='flex-1 space-y-2'>
              <div className='h-4 w-24 rounded bg-gray-200' />
              <div className='h-3 w-48 rounded bg-gray-100' />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className='flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300'>
        <p className='text-sm text-brand-muted'>No activity yet</p>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {logs.map((log, index) => {
        const actionType = log.action_type || 'updated'
        const colorClass =
          actionColors[actionType] || 'bg-gray-500/10 text-gray-600'

        return (
          <div key={log.id} className='relative flex gap-4 pb-4'>
            {/* Timeline line */}
            {index < logs.length - 1 && (
              <div className='absolute left-5 top-10 h-8 w-0.5 bg-gray-200' />
            )}

            {/* Icon */}
            <div className={`relative mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${colorClass}`}>
              <Icons.checkCircle className='h-5 w-5' />
            </div>

            {/* Content */}
            <div className='flex-1 min-w-0'>
              <p className='font-medium text-brand-navy'>
                {log.performed_by}
                <span className='ml-1 text-sm font-normal text-brand-muted'>
                  {log.action_description}
                </span>
              </p>
              <p className='mt-1 text-xs text-brand-muted'>
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </p>

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className='mt-2 rounded bg-gray-50 p-2 text-xs text-brand-muted'>
                  {Object.entries(log.metadata).map(([key, value]) => (
                    <div key={key}>
                      <span className='font-medium'>{key}:</span>{' '}
                      {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
