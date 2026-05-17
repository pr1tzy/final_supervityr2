'use client'

import React from 'react'
import { PolicyViolation } from '@/lib/supabase'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { formatDistanceToNow } from 'date-fns'

interface ViolationDetailDrawerProps {
  violation: PolicyViolation | null
  policyName?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViolationDetailDrawer({
  violation,
  policyName,
  open,
  onOpenChange,
}: ViolationDetailDrawerProps) {
  if (!violation) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-2xl overflow-y-auto'>
        <SheetHeader className='mb-6'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <SheetTitle className='text-2xl'>Policy Violation</SheetTitle>
              <SheetDescription className='mt-2'>
                Violation ID: <span className='font-mono'>{violation.id.substring(0, 12)}</span>
              </SheetDescription>
            </div>
            <div className='rounded-full bg-red-100 p-3'>
              <Icons.alertTriangle className='h-6 w-6 text-red-600' />
            </div>
          </div>
        </SheetHeader>

        {/* Policy Information */}
        <Card className='mb-6 border-red-200 bg-red-50'>
          <CardHeader>
            <CardTitle className='text-lg text-red-800'>
              {policyName || 'Unknown Policy'}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Violation Details */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Violation Details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-xs font-semibold text-brand-muted mb-1'>Reason</p>
              <div className='rounded-lg bg-gray-50 p-3 border border-gray-200'>
                <p className='text-sm text-brand-navy leading-relaxed'>
                  {violation.violation_reason}
                </p>
              </div>
            </div>

            {violation.blocked_action && (
              <div>
                <p className='text-xs font-semibold text-brand-muted mb-1'>Blocked Action</p>
                <div className='rounded-lg bg-red-50 p-3 border border-red-100'>
                  <p className='text-sm text-red-700 font-mono'>
                    {violation.blocked_action}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Context</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <span className='text-sm text-brand-muted'>Occurred</span>
              <span className='text-sm text-brand-navy'>
                {formatDistanceToNow(new Date(violation.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {violation.lead_id && (
              <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                <span className='text-sm text-brand-muted'>Lead ID</span>
                <code className='text-xs font-mono text-brand-navy'>
                  {violation.lead_id.substring(0, 12)}
                </code>
              </div>
            )}

            {violation.transcript_id && (
              <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                <span className='text-sm text-brand-muted'>Transcript ID</span>
                <code className='text-xs font-mono text-brand-navy'>
                  {violation.transcript_id.substring(0, 12)}
                </code>
              </div>
            )}

            <div className='flex items-center justify-between'>
              <span className='text-sm text-brand-muted'>Policy ID</span>
              <code className='text-xs font-mono text-brand-navy'>
                {violation.violated_policy_id.substring(0, 12)}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className='bg-blue-50 border-blue-100'>
          <CardContent className='pt-6'>
            <div className='flex gap-3'>
              <Icons.info className='h-5 w-5 text-blue-600 flex-shrink-0' />
              <p className='text-sm text-blue-800'>
                This violation was flagged because the policy blocked an action that would have violated governance rules. Review the violation reason above to understand what happened.
              </p>
            </div>
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  )
}
