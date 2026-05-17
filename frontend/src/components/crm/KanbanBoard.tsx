'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lead } from '@/lib/supabase'
import { LeadCard } from './LeadCard'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

interface KanbanBoardProps {
  leads: Lead[]
  loading?: boolean
  onLeadClick?: (lead: Lead) => void
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New Lead', color: 'bg-blue-50' },
  qualified: { label: 'Qualified', color: 'bg-purple-50' },
  proposal_sent: { label: 'Proposal Sent', color: 'bg-amber-50' },
  negotiation: { label: 'Negotiation', color: 'bg-indigo-50' },
  needs_review: { label: 'Needs Review', color: 'bg-red-50' },
  closed_won: { label: 'Closed Won', color: 'bg-emerald-50' },
  closed_lost: { label: 'Closed Lost', color: 'bg-gray-50' },
}

function KanbanColumn({
  status,
  leads,
  onLeadClick,
}: {
  status: string
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
}) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-50' }

  return (
    <div className={cn('flex flex-col gap-3 rounded-xl p-4', config.color)}>
      {/* Column Header */}
      <div className='flex items-center justify-between gap-2'>
        <h3 className='font-semibold text-brand-navy'>{config.label}</h3>
        <span className='inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-navy/10 text-xs font-bold text-brand-navy'>
          {leads.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex max-h-[500px] flex-col gap-3 overflow-y-auto'>
        {leads.length === 0 ? (
          <div className='flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300'>
            <p className='text-sm text-brand-muted'>No leads</p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick?.(lead)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ leads, loading, onLeadClick }: KanbanBoardProps) {
  // Group leads by status
  const groupedLeads = Object.keys(statusConfig).reduce(
    (acc, status) => {
      acc[status] = leads.filter((lead) => lead.lead_status === status)
      return acc
    },
    {} as Record<string, Lead[]>
  )

  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-center gap-2 py-12'>
            <Icons.loader className='h-5 w-5 animate-spin text-brand-cornflower' />
            <span className='text-sm text-brand-muted'>Loading leads...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='overflow-x-auto'>
      <div className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 inline-flex min-w-full gap-4 pb-4'>
        {Object.entries(statusConfig).map(([status, { label }]) => (
          <div key={status} className='min-w-80 flex-shrink-0'>
            <KanbanColumn
              status={status}
              leads={groupedLeads[status]}
              onLeadClick={onLeadClick}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
