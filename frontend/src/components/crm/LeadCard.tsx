'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Lead } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { parseNotes } from '@/lib/notesParser'

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  // Parse notes to extract project type, budget, timeline, agents, and status indicators
  const parsed = parseNotes(lead.notes)
  const agents = parsed.agents
  const statusChips = parsed.statusIndicators

  // Color based on lead score (0-100)
  const scoreColor =
    lead.lead_score >= 80 ? 'text-emerald-600' :
    lead.lead_score >= 60 ? 'text-amber-600' :
    'text-red-600'

  // Format deal size safely
  const formatDealSize = (size: number | null | undefined): string => {
    if (!size) return '-'
    if (size >= 1000000) {
      return `$${(size / 1000000).toFixed(1)}M`
    } else if (size >= 1000) {
      return `$${(size / 1000).toFixed(0)}K`
    }
    return `$${size}`
  }

  return (
    <Card
      onClick={onClick}
      className='group relative cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg'
    >
      <CardContent className='p-5'>
        <div className='space-y-4'>
          {/* Header */}
          <div className='space-y-1'>
            <p className='font-semibold text-brand-navy line-clamp-1'>
              {lead.company_name}
            </p>
            <p className='text-sm text-brand-muted line-clamp-1'>
              {lead.contact_name}
            </p>
          </div>

          {/* Details */}
          <div className='space-y-2 border-t border-black/[0.06] pt-3 text-xs'>
            {parsed.projectType && (
              <div className='flex justify-between'>
                <span className='text-brand-muted'>Type:</span>
                <span className='font-medium text-brand-navy'>{parsed.projectType}</span>
              </div>
            )}
            {lead.estimated_deal_size && (
              <div className='flex justify-between'>
                <span className='text-brand-muted'>Deal Size:</span>
                <span className='font-medium text-brand-navy'>
                  {formatDealSize(lead.estimated_deal_size)}
                </span>
              </div>
            )}
            {parsed.timeline && (
              <div className='flex justify-between'>
                <span className='text-brand-muted'>Timeline:</span>
                <span className='font-medium text-brand-navy'>{parsed.timeline}</span>
              </div>
            )}
            {lead.industry && (
              <div className='flex justify-between'>
                <span className='text-brand-muted'>Industry:</span>
                <span className='font-medium text-brand-navy'>{lead.industry}</span>
              </div>
            )}
          </div>

          {/* AI Agents Chips */}
          {agents.length > 0 && (
            <div className='flex flex-wrap gap-1.5 border-t border-black/[0.06] pt-3'>
              {agents.map((agent) => (
                <span
                  key={agent}
                  className='inline-flex items-center rounded-full bg-brand-cornflower/10 px-2 py-1 text-[10px] font-semibold text-brand-cornflower'
                >
                  {agent}
                </span>
              ))}
            </div>
          )}

          {/* Status Chips */}
          {statusChips.length > 0 && (
            <div className='flex flex-wrap gap-1.5'>
              {statusChips.map((status) => {
                const statusColors: Record<string, string> = {
                  running: 'bg-blue-500/10 text-blue-600',
                  completed: 'bg-emerald-500/10 text-emerald-600',
                  pending: 'bg-amber-500/10 text-amber-600',
                  'human review': 'bg-red-500/10 text-red-600',
                }
                return (
                  <span
                    key={status}
                    className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${
                      statusColors[status] || 'bg-gray-500/10 text-gray-600'
                    }`}
                  >
                    {status}
                  </span>
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div className='flex items-center justify-between border-t border-black/[0.06] pt-3'>
            <div className='text-xs'>
              <span className='text-brand-muted'>Score: </span>
              <span className={`font-semibold ${scoreColor}`}>
                {lead.lead_score}
              </span>
            </div>
            <div className='text-xs text-brand-muted'>
              {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
            </div>
          </div>

          {/* Lead Score Indicator */}
          <div className='flex items-center gap-1.5 border-t border-black/[0.06] pt-3'>
            <div className='h-2 flex-1 rounded-full bg-gray-200'>
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  lead.lead_score >= 80
                    ? 'bg-emerald-500'
                    : lead.lead_score >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(lead.lead_score, 100)}%` }}
              />
            </div>
            <span className={`text-[10px] font-bold ${scoreColor}`}>
              {lead.lead_score}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Animated gradient overlay on hover */}
      <div className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-700' />
    </Card>
  )
}
