'use client'

import React from 'react'
import { AIPolicy } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { PolicyStatusBadge } from './PolicyStatusBadge'
import { formatDistanceToNow } from 'date-fns'

interface PolicyCardProps {
  policy: AIPolicy
  triggerCount?: number
  lastTriggeredAt?: string | null
  onView?: () => void
  onEdit?: () => void
  onToggleActive?: () => void
  onDelete?: () => void
}

export function PolicyCard({
  policy,
  triggerCount = 0,
  lastTriggeredAt,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
}: PolicyCardProps) {
  return (
    <Card className='h-full hover:shadow-md transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-lg text-brand-navy break-words'>
              {policy.policy_name}
            </CardTitle>
            <p className='text-xs text-brand-muted mt-1 line-clamp-2'>
              {policy.policy_description}
            </p>
          </div>
          <PolicyStatusBadge active={policy.active} />
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Stats */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='rounded-lg bg-gray-50 p-2'>
            <p className='text-xs text-brand-muted mb-1'>Triggered</p>
            <p className='text-lg font-bold text-brand-navy'>{triggerCount}</p>
          </div>
          <div className='rounded-lg bg-gray-50 p-2'>
            <p className='text-xs text-brand-muted mb-1'>Created</p>
            <p className='text-xs font-medium text-brand-navy'>
              {formatDistanceToNow(new Date(policy.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>

        {/* Last Triggered */}
        {lastTriggeredAt && (
          <div className='rounded-lg bg-amber-50 p-2 border border-amber-100'>
            <p className='text-xs text-amber-700 font-medium'>
              Last triggered {formatDistanceToNow(new Date(lastTriggeredAt), { addSuffix: true })}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-2 pt-2'>
          {onView && (
            <Button
              size='sm'
              variant='outline'
              className='flex-1'
              onClick={onView}
            >
              <Icons.eye className='h-3 w-3 mr-1' />
              View
            </Button>
          )}
          {onToggleActive && (
            <Button
              size='sm'
              variant='outline'
              className='flex-1'
              onClick={onToggleActive}
              title={policy.active ? 'Disable policy' : 'Enable policy'}
            >
              {policy.active ? (
                <>
                  <Icons.check className='h-3 w-3 mr-1' />
                  Disable
                </>
              ) : (
                <>
                  <Icons.close className='h-3 w-3 mr-1' />
                  Enable
                </>
              )}
            </Button>
          )}
          {onDelete && (
            <Button
              size='sm'
              variant='outline'
              className='text-red-600 hover:text-red-700 hover:bg-red-50'
              onClick={onDelete}
              title='Delete policy'
            >
              <Icons.trash className='h-3 w-3' />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
