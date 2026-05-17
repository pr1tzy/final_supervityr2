'use client'

import React, { useState } from 'react'
import { WorkbenchReview } from '@/lib/supabase'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { ReviewStatusBadge } from './ReviewStatusBadge'
import { HumanResponseBox } from './HumanResponseBox'
import { updateWorkbenchReview } from '@/hooks/useWorkbenchReviews'
import { formatDistanceToNow } from 'date-fns'

interface ReviewDetailDrawerProps {
  review: WorkbenchReview | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onActionComplete?: () => void
}

export function ReviewDetailDrawer({
  review,
  open,
  onOpenChange,
  onActionComplete,
}: ReviewDetailDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  if (!review) return null

  const handleAction = async (
    newStatus: string,
    responseText?: string
  ) => {
    try {
      setIsUpdating(true)

      const updates: any = {
        review_status: newStatus,
      }

      if (responseText) {
        updates.human_response = responseText
      }

      // Set resolved_at if changing to resolved/approved/rejected
      if (['resolved', 'approved', 'rejected'].includes(newStatus)) {
        updates.resolved_at = new Date().toISOString()
      }

      const result = await updateWorkbenchReview(review.id, updates)

      if (result.success) {
        setActionMessage(`Review ${newStatus} successfully!`)
        setTimeout(() => {
          setActionMessage('')
          onOpenChange(false)
          onActionComplete?.()
        }, 1500)
      } else {
        setActionMessage(`Error: ${result.error}`)
      }
    } catch (err) {
      setActionMessage('An error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const isPending = review.review_status === 'pending'
  const isResolved = ['resolved', 'approved', 'rejected'].includes(review.review_status)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-2xl overflow-y-auto'>
        <SheetHeader className='mb-6'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <SheetTitle className='text-2xl'>Review Details</SheetTitle>
              <SheetDescription className='mt-2'>
                ID: <span className='font-mono'>{review.id.substring(0, 12)}</span>
              </SheetDescription>
            </div>
            <ReviewStatusBadge status={review.review_status} />
          </div>
        </SheetHeader>

        {/* Issue Information */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.alertTriangle className='h-5 w-5 text-amber-600' />
              Issue Description
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-xs font-semibold text-brand-muted mb-1'>Issue Type</p>
              <div className='inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 capitalize'>
                {review.issue_type}
              </div>
            </div>
            <div>
              <p className='text-xs font-semibold text-brand-muted mb-2'>Description</p>
              <div className='rounded-lg bg-gray-50 p-4 border border-gray-200'>
                <p className='text-sm text-brand-navy leading-relaxed'>
                  {review.issue_description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <span className='text-sm text-brand-muted'>Requested By Agent</span>
              <span className='font-medium text-brand-navy'>
                {review.requested_by_agent}
              </span>
            </div>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <span className='text-sm text-brand-muted'>Created</span>
              <span className='text-sm text-brand-navy'>
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
            {review.transcript_id && (
              <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                <span className='text-sm text-brand-muted'>Transcript ID</span>
                <code className='text-xs font-mono text-brand-muted'>
                  {review.transcript_id.substring(0, 12)}
                </code>
              </div>
            )}
            {review.lead_id && (
              <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                <span className='text-sm text-brand-muted'>Lead ID</span>
                <code className='text-xs font-mono text-brand-muted'>
                  {review.lead_id.substring(0, 12)}
                </code>
              </div>
            )}
            {review.resolved_at && (
              <div className='flex items-center justify-between'>
                <span className='text-sm text-brand-muted'>Resolved</span>
                <span className='text-sm text-brand-navy'>
                  {formatDistanceToNow(new Date(review.resolved_at), { addSuffix: true })}
                </span>
              </div>
            )}
            {review.reviewed_by && (
              <div className='flex items-center justify-between'>
                <span className='text-sm text-brand-muted'>Reviewed By</span>
                <span className='font-medium text-brand-navy'>{review.reviewed_by}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Response */}
        {review.human_response && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Current Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='rounded-lg bg-blue-50 p-4 border border-blue-200'>
                <p className='text-sm text-brand-navy'>{review.human_response}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Message */}
        {actionMessage && (
          <Card className='mb-6 border-emerald-200 bg-emerald-50'>
            <CardContent className='pt-6'>
              <p className='text-sm font-medium text-emerald-800'>{actionMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Response Input */}
        {isPending && !isResolved && (
          <HumanResponseBox
            initialResponse={review.human_response}
            onSubmit={async (response) => {
              await updateWorkbenchReview(review.id, {
                human_response: response,
              })
            }}
            disabled={isUpdating}
          />
        )}

        {/* Action Buttons */}
        {isPending && (
          <div className='mt-6 space-y-3 border-t border-gray-200 pt-6'>
            <div className='grid gap-2 sm:grid-cols-2'>
              <Button
                variant='outline'
                className='border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                onClick={() => handleAction('approved')}
                disabled={isUpdating}
              >
                <Icons.check className='mr-2 h-4 w-4' />
                Approve
              </Button>
              <Button
                variant='outline'
                className='border-red-300 text-red-700 hover:bg-red-50'
                onClick={() => handleAction('rejected')}
                disabled={isUpdating}
              >
                <Icons.close className='mr-2 h-4 w-4' />
                Reject
              </Button>
            </div>
            <Button
              variant='outline'
              className='w-full border-blue-300 text-blue-700 hover:bg-blue-50'
              onClick={() => handleAction('pending')}
              disabled={isUpdating}
            >
              <Icons.helpCircle className='mr-2 h-4 w-4' />
              Request More Info
            </Button>
            <Button
              variant='default'
              className='w-full bg-brand-navy hover:bg-brand-navy/90'
              onClick={() => handleAction('resolved')}
              disabled={isUpdating}
            >
              <Icons.checkCircle className='mr-2 h-4 w-4' />
              Mark as Resolved
            </Button>
          </div>
        )}

        {/* View-only state for resolved/approved/rejected */}
        {isResolved && (
          <div className='mt-6 border-t border-gray-200 pt-6'>
            <div className='rounded-lg bg-gray-50 p-4 border border-gray-200 text-center'>
              <p className='text-sm text-brand-muted'>
                This review has been {review.review_status}.
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
