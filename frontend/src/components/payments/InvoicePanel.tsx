'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { formatDistanceToNow } from 'date-fns'
import { PaymentWorkflow } from '@/hooks/usePaymentsData'
import { formatUsd } from '@/lib/utils'
import { PaymentStatusBadge } from './PaymentStatusBadge'

interface InvoicePanelProps {
  payment: PaymentWorkflow | null
}

export function InvoicePanel({ payment }: InvoicePanelProps) {
  if (!payment) {
    return (
      <Card className='border-dashed'>
        <CardContent className='pt-6'>
          <p className='text-center text-sm text-brand-muted'>Select a payment to view invoice details</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Invoice Information</span>
          <Icons.fileText className='h-5 w-5 text-brand-muted' />
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Invoice Number */}
        <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
          <span className='text-sm text-brand-muted'>Invoice Number</span>
          <span className='font-mono font-semibold text-brand-navy'>{payment.invoice_number || '—'}</span>
        </div>

        {/* Invoice Date */}
        <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
          <span className='text-sm text-brand-muted'>Invoice Date</span>
          <span className='text-sm text-brand-navy'>
            {payment.invoice_date
              ? formatDistanceToNow(new Date(payment.invoice_date), { addSuffix: true })
              : '—'}
          </span>
        </div>

        {/* Due Date */}
        <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
          <span className='text-sm text-brand-muted'>Due Date</span>
          <span className='text-sm text-brand-navy'>
            {payment.due_date
              ? formatDistanceToNow(new Date(payment.due_date), { addSuffix: true })
              : '—'}
          </span>
        </div>

        {/* Amount Due */}
        <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
          <span className='text-sm text-brand-muted'>Amount Due</span>
          <span className='font-semibold text-brand-navy'>
            ${formatUsd(payment.amount_due)}
          </span>
        </div>

        {/* Amount Paid */}
        <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
          <span className='text-sm text-brand-muted'>Amount Paid</span>
          <span className='font-semibold text-emerald-700'>
            ${formatUsd(payment.amount_paid)}
          </span>
        </div>

        {/* Balance */}
        <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
          <span className='text-sm text-brand-muted'>Balance</span>
          <span className='font-semibold text-orange-700'>
            ${formatUsd((payment.amount_due ?? 0) - (payment.amount_paid ?? 0))}
          </span>
        </div>

        {/* Payment Method */}
        <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
          <span className='text-sm text-brand-muted'>Payment Method</span>
          <span className='text-sm text-brand-navy'>{payment.payment_method || 'Pending'}</span>
        </div>

        {/* Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm text-brand-muted'>Status</span>
          <PaymentStatusBadge status={payment.payment_status} />
        </div>

        {/* Days Overdue */}
        {payment.days_overdue > 0 && (
          <div className='mt-4 p-3 rounded-lg bg-red-50 border border-red-100'>
            <p className='text-sm font-semibold text-red-800'>
              ⚠️ {payment.days_overdue} days overdue
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
