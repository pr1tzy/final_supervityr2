'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { OperationsFeedItem } from '@/hooks/useAIInsights'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface OperationsFeedProps {
  items: OperationsFeedItem[]
  loading?: boolean
}

const categoryIcons: Record<OperationsFeedItem['category'], React.ElementType> = {
  crm: Icons.zap,
  policy: Icons.shield,
  workbench: Icons.users,
  agent: Icons.loader,
  payment: Icons.barChart,
}

const statusColors: Record<OperationsFeedItem['status'], { bg: string; border: string; text: string; icon: string }> = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' },
}

export function OperationsFeed({ items, loading = false }: OperationsFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.activity className='h-5 w-5 text-green-600' />
          Real-Time Operations Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='space-y-3'>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className='space-y-2 max-h-96 overflow-y-auto'>
            {items.map((item) => {
              const Icon = categoryIcons[item.category]
              const colors = statusColors[item.status]

              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-3 rounded-lg border transition-all duration-200 hover:shadow-md',
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className='flex items-start gap-3'>
                    {/* Icon */}
                    <div className={cn('mt-1 flex-shrink-0', colors.icon)}>
                      <Icon className='h-4 w-4' />
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1'>
                          <p className={cn('font-medium text-sm', colors.text)}>
                            {item.action}
                          </p>
                          {item.agent && (
                            <p className='text-xs text-gray-600 mt-0.5'>
                              <span className='font-mono'>{item.agent}</span>
                            </p>
                          )}
                          {item.details && (
                            <p className='text-xs text-gray-600 mt-0.5 break-words'>
                              {item.details}
                            </p>
                          )}
                        </div>
                        <span className='text-xs text-gray-500 flex-shrink-0'>
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Icons.activity className='h-12 w-12 text-gray-300 mb-3' />
            <p className='text-sm text-gray-600'>No recent operations</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
