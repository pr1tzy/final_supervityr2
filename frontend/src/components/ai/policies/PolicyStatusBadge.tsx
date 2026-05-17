'use client'

import React from 'react'
import { Icons } from '@/components/ui/icons'

interface PolicyStatusBadgeProps {
  active: boolean
}

export function PolicyStatusBadge({ active }: PolicyStatusBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-gray-100 text-gray-700'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          active ? 'bg-emerald-600' : 'bg-gray-400'
        }`}
      />
      {active ? 'Active' : 'Inactive'}
    </div>
  )
}
