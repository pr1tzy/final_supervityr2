'use client'

import React from 'react'
import { Icons } from '@/components/ui/icons'

interface ReviewStatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const statusConfig: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  pending: {
    color: 'bg-amber-100 text-amber-800 border border-amber-300',
    icon: <Icons.clock className='h-3 w-3' />,
    label: 'Pending',
  },
  approved: {
    color: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    icon: <Icons.check className='h-3 w-3' />,
    label: 'Approved',
  },
  rejected: {
    color: 'bg-red-100 text-red-800 border border-red-300',
    icon: <Icons.close className='h-3 w-3' />,
    label: 'Rejected',
  },
  resolved: {
    color: 'bg-blue-100 text-blue-800 border border-blue-300',
    icon: <Icons.checkCircle className='h-3 w-3' />,
    label: 'Resolved',
  },
}

export function ReviewStatusBadge({ status, size = 'md' }: ReviewStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending
  const isSmall = size === 'sm'

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${config.color} ${
        isSmall ? 'py-0.5 px-2' : ''
      }`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  )
}
