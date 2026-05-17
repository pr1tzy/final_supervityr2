'use client'

import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import { Lead, CRMActivityLog, AgentRun, PolicyViolation } from '@/lib/supabase'
import { ActivityTimeline } from './ActivityTimeline'
import { parseNotes } from '@/lib/notesParser'
import { formatDistanceToNow } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PipelineActionsCard } from '@/components/orchestrator/PipelineActionsCard'

interface LeadDetailDrawerProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  activityLogs?: CRMActivityLog[]
  agentRuns?: AgentRun[]
  policyViolations?: PolicyViolation[]
  loadingLogs?: boolean
  loadingRuns?: boolean
  loadingViolations?: boolean
}

export function LeadDetailDrawer({
  lead,
  open,
  onOpenChange,
  activityLogs = [],
  agentRuns = [],
  policyViolations = [],
  loadingLogs,
  loadingRuns,
  loadingViolations,
}: LeadDetailDrawerProps) {
  if (!lead) return null

  const parsed = parseNotes(lead.notes)

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    qualified: 'bg-purple-100 text-purple-800',
    proposal_sent: 'bg-amber-100 text-amber-800',
    negotiation: 'bg-indigo-100 text-indigo-800',
    needs_review: 'bg-red-100 text-red-800',
    closed_won: 'bg-emerald-100 text-emerald-800',
    closed_lost: 'bg-gray-100 text-gray-800',
  }

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-2xl overflow-y-auto'>
        {/* Header */}
        <SheetHeader className='mb-6'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <SheetTitle className='text-2xl'>{lead.company_name}</SheetTitle>
              <SheetDescription className='mt-2'>
                {lead.contact_name} • {lead.contact_email}
              </SheetDescription>
            </div>
            <Badge
              className={
                statusColors[lead.lead_status] || 'bg-gray-100 text-gray-800'
              }
            >
              {lead.lead_status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </SheetHeader>

        <PipelineActionsCard
          leadId={lead.id}
          contactEmail={lead.contact_email}
          contactName={lead.contact_name}
          companyName={lead.company_name}
          estimatedDealSize={lead.estimated_deal_size}
          compact
        />

        {/* Lead Summary Card */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Lead Summary</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-xs font-medium text-brand-muted'>Contact</p>
                <p className='mt-1 font-medium text-brand-navy'>{lead.contact_name}</p>
              </div>
              <div>
                <p className='text-xs font-medium text-brand-muted'>Email</p>
                <p className='mt-1 font-medium text-brand-navy text-sm break-all'>
                  {lead.contact_email || '-'}
                </p>
              </div>
              <div>
                <p className='text-xs font-medium text-brand-muted'>Phone</p>
                <p className='mt-1 font-medium text-brand-navy'>{lead.phone || '-'}</p>
              </div>
              <div>
                <p className='text-xs font-medium text-brand-muted'>Industry</p>
                <p className='mt-1 font-medium text-brand-navy'>
                  {lead.industry || '-'}
                </p>
              </div>
              <div>
                <p className='text-xs font-medium text-brand-muted'>Deal Size</p>
                <p className='mt-1 font-medium text-brand-navy'>
                  {formatDealSize(lead.estimated_deal_size)}
                </p>
              </div>
              <div>
                <p className='text-xs font-medium text-brand-muted'>Source</p>
                <p className='mt-1 font-medium text-brand-navy'>
                  {lead.source || '-'}
                </p>
              </div>
              <div>
                <p className='text-xs font-medium text-brand-muted'>Lead Score</p>
                <p className='mt-1 font-medium text-brand-navy'>{lead.lead_score}</p>
              </div>
              <div>
                <p className='text-xs font-medium text-brand-muted'>Assigned To</p>
                <p className='mt-1 font-medium text-brand-navy'>
                  {lead.assigned_to || '-'}
                </p>
              </div>
            </div>

            {/* Project details from notes */}
            {(parsed.projectType || parsed.budget || parsed.timeline) && (
              <div className='border-t border-black/[0.06] pt-4'>
                <p className='mb-3 text-xs font-medium text-brand-muted'>Project Details</p>
                <div className='space-y-2 text-sm'>
                  {parsed.projectType && (
                    <p>
                      <span className='font-medium text-brand-muted'>Type:</span>{' '}
                      <span className='text-brand-navy'>{parsed.projectType}</span>
                    </p>
                  )}
                  {parsed.budget && (
                    <p>
                      <span className='font-medium text-brand-muted'>Budget:</span>{' '}
                      <span className='text-brand-navy'>{parsed.budget}</span>
                    </p>
                  )}
                  {parsed.timeline && (
                    <p>
                      <span className='font-medium text-brand-muted'>Timeline:</span>{' '}
                      <span className='text-brand-navy'>{parsed.timeline}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {lead.notes && (
              <div className='border-t border-black/[0.06] pt-4'>
                <p className='text-xs font-medium text-brand-muted'>Notes</p>
                <p className='mt-2 text-sm text-brand-navy'>{lead.notes}</p>
              </div>
            )}

            {/* Created/Updated */}
            <div className='border-t border-black/[0.06] pt-4 flex items-center justify-between text-xs text-brand-muted'>
              <span>
                Created {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
              </span>
              <span>
                Updated {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for detailed information */}
        <Tabs defaultValue='timeline' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='timeline'>Timeline</TabsTrigger>
            <TabsTrigger value='agents'>Agents</TabsTrigger>
            <TabsTrigger value='violations'>Violations</TabsTrigger>
            <TabsTrigger value='more'>More</TabsTrigger>
          </TabsList>

          {/* Activity Timeline Tab */}
          <TabsContent value='timeline'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline logs={activityLogs} loading={loadingLogs} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Runs Tab */}
          <TabsContent value='agents'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>AI Agent Runs</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRuns ? (
                  <div className='flex items-center justify-center py-8'>
                    <Icons.loader className='h-5 w-5 animate-spin text-brand-cornflower' />
                  </div>
                ) : agentRuns.length === 0 ? (
                  <div className='flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300'>
                    <p className='text-sm text-brand-muted'>No agent runs</p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {agentRuns.map((run) => (
                      <div
                        key={run.id}
                        className='rounded-lg border border-black/[0.06] p-4'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='font-medium text-brand-navy'>
                              {run.orchestrator_agent || 'Unknown Agent'}
                            </p>
                            {run.operator_agent && (
                              <p className='text-xs text-brand-muted'>
                                Operator: {run.operator_agent}
                              </p>
                            )}
                            <p className='text-xs text-brand-muted mt-1'>
                              {formatDistanceToNow(new Date(run.started_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <Badge
                            className={
                              run.execution_status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : run.execution_status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                            }
                          >
                            {run.execution_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policy Violations Tab */}
          <TabsContent value='violations'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Policy Violations</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingViolations ? (
                  <div className='flex items-center justify-center py-8'>
                    <Icons.loader className='h-5 w-5 animate-spin text-brand-cornflower' />
                  </div>
                ) : policyViolations.length === 0 ? (
                  <div className='flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300'>
                    <p className='text-sm text-brand-muted'>No violations</p>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {policyViolations.map((violation) => (
                      <div
                        key={violation.id}
                        className='rounded-lg border border-black/[0.06] p-4'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='font-medium text-brand-navy'>
                              {violation.violation_reason}
                            </p>
                            {violation.blocked_action && (
                              <p className='text-xs text-brand-muted mt-1'>
                                Blocked: {violation.blocked_action}
                              </p>
                            )}
                            <p className='text-xs text-brand-muted mt-1'>
                              {formatDistanceToNow(new Date(violation.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <Badge className='bg-red-100 text-red-800'>
                            violation
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* More Info Tab */}
          <TabsContent value='more'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-xs font-medium text-brand-muted'>Lead ID</p>
                  <p className='mt-1 font-mono text-xs text-brand-navy break-all'>{lead.id}</p>
                </div>
                <div>
                  <p className='text-xs font-medium text-brand-muted'>Status</p>
                  <p className='mt-1 text-sm text-brand-navy'>
                    {lead.lead_status.replace(/_/g, ' ')}
                  </p>
                </div>
                {lead.created_by_agent && (
                  <div>
                    <p className='text-xs font-medium text-brand-muted'>Created By Agent</p>
                    <p className='mt-1 text-sm text-brand-navy'>{lead.created_by_agent}</p>
                  </div>
                )}
                {lead.updated_by_agent && (
                  <div>
                    <p className='text-xs font-medium text-brand-muted'>Updated By Agent</p>
                    <p className='mt-1 text-sm text-brand-navy'>{lead.updated_by_agent}</p>
                  </div>
                )}
                {lead.competitor_mentioned && (
                  <div>
                    <p className='text-xs font-medium text-brand-muted'>Competitor Mentioned</p>
                    <p className='mt-1 text-sm text-brand-navy'>{lead.competitor_mentioned}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
