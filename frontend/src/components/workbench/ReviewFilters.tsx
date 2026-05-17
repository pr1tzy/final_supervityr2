'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ReviewFiltersProps {
  activeFilter: 'all' | 'pending' | 'approved' | 'rejected' | 'resolved'
  onFilterChange: (filter: 'all' | 'pending' | 'approved' | 'rejected' | 'resolved') => void
}

const filters = [
  { id: 'all', label: 'All Reviews' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'resolved', label: 'Resolved' },
] as const

export function ReviewFilters({ activeFilter, onFilterChange }: ReviewFiltersProps) {
  return (
    <div className='flex flex-wrap gap-2'>
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          size='sm'
          onClick={() => onFilterChange(filter.id as any)}
          className={cn(
            activeFilter === filter.id && [
              filter.id === 'pending' && 'bg-amber-600 hover:bg-amber-700',
              filter.id === 'approved' && 'bg-emerald-600 hover:bg-emerald-700',
              filter.id === 'rejected' && 'bg-red-600 hover:bg-red-700',
              filter.id === 'resolved' && 'bg-blue-600 hover:bg-blue-700',
            ]
          )}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}
