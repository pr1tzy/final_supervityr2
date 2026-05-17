'use client'

import React from 'react'
import { WorkbenchReview } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { ReviewStatusBadge } from './ReviewStatusBadge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface ReviewQueueTableProps {
  reviews: WorkbenchReview[]
  loading?: boolean
  onRowClick: (review: WorkbenchReview) => void
}

function getIssueTypeIcon(issueType: string) {
  const iconMap: Record<string, React.ReactNode> = {
    policy: <Icons.shield className='h-4 w-4' />,
    payment: <Icons.barChart className='h-4 w-4' />,
    contract: <Icons.fileText className='h-4 w-4' />,
    crm: <Icons.briefcase className='h-4 w-4' />,
    escalation: <Icons.alertTriangle className='h-4 w-4' />,
  }
  return iconMap[issueType] || <Icons.flag className='h-4 w-4' />
}

function getIssueTypeBadgeColor(issueType: string): string {
  const colorMap: Record<string, string> = {
    policy: 'bg-red-100 text-red-800',
    payment: 'bg-green-100 text-green-800',
    contract: 'bg-blue-100 text-blue-800',
    crm: 'bg-purple-100 text-purple-800',
    escalation: 'bg-orange-100 text-orange-800',
  }
  return colorMap[issueType] || 'bg-gray-100 text-gray-800'
}

export function ReviewQueueTable({
  reviews,
  loading = false,
  onRowClick,
}: ReviewQueueTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300'>
            <p className='text-sm text-brand-muted'>No reviews found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Status</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Issue Type</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Description</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Requested By</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Created</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Lead</th>
                <th className='px-4 py-3 text-right font-semibold text-gray-700'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr
                  key={review.id}
                  className={cn(
                    'border-b border-gray-100 transition-colors hover:bg-gray-50',
                    review.review_status === 'pending' && 'border-l-4 border-l-amber-400 bg-amber-50/30',
                    review.review_status === 'rejected' && 'border-l-4 border-l-red-400 bg-red-50/30'
                  )}
                >
                  <td className='px-4 py-4'>
                    <ReviewStatusBadge status={review.review_status} size='sm' />
                  </td>
                  <td className='px-4 py-4'>
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getIssueTypeBadgeColor(review.issue_type)}`}>
                      {getIssueTypeIcon(review.issue_type)}
                      <span className='capitalize'>{review.issue_type}</span>
                    </div>
                  </td>
                  <td className='px-4 py-4'>
                    <p className='line-clamp-2 max-w-xs text-gray-700'>
                      {review.issue_description}
                    </p>
                  </td>
                  <td className='px-4 py-4'>
                    <p className='font-medium text-brand-navy'>{review.requested_by_agent}</p>
                  </td>
                  <td className='px-4 py-4'>
                    <p className='text-xs text-brand-muted'>
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </p>
                  </td>
                  <td className='px-4 py-4'>
                    <code className='text-xs text-brand-muted'>
                      {review.lead_id ? review.lead_id.substring(0, 8) : '-'}
                    </code>
                  </td>
                  <td className='px-4 py-4 text-right'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onRowClick(review)}
                      className='gap-2'
                    >
                      <Icons.eye className='h-4 w-4' />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
