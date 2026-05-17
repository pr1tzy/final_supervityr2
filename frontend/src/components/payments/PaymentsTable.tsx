'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatUsd } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { PaymentWorkflow } from '@/hooks/usePaymentsData'
import { PaymentStatusBadge } from './PaymentStatusBadge'

interface PaymentsTableProps {
  payments: PaymentWorkflow[]
  loading?: boolean
  onPaymentSelect?: (payment: PaymentWorkflow) => void
}

export function PaymentsTable({
  payments,
  loading = false,
  onPaymentSelect,
}: PaymentsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='space-y-3'>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className='h-12 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <Icons.barChart className='h-12 w-12 text-gray-300 mb-3' />
            <h3 className='font-semibold text-brand-navy'>No payments found</h3>
            <p className='text-sm text-brand-muted mt-1'>
              Payment invoices will appear here as contracts are signed
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Company</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Contact</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Invoice</th>
                <th className='px-4 py-3 text-right font-semibold text-gray-700'>Amount Due</th>
                <th className='px-4 py-3 text-center font-semibold text-gray-700'>Status</th>
                <th className='px-4 py-3 text-center font-semibold text-gray-700'>Due Date</th>
                <th className='px-4 py-3 text-right font-semibold text-gray-700'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className={cn(
                    'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                    payment.payment_status === 'overdue' && 'bg-orange-50/50',
                    payment.payment_status === 'failed' && 'bg-red-50/50'
                  )}
                >
                  {/* Company */}
                  <td className='px-4 py-3'>
                    <p className='font-medium text-brand-navy'>{payment.company_name}</p>
                  </td>

                  {/* Contact */}
                  <td className='px-4 py-3'>
                    <p className='text-gray-700'>{payment.contact_name}</p>
                  </td>

                  {/* Invoice */}
                  <td className='px-4 py-3'>
                    <p className='font-mono text-xs text-brand-muted'>{payment.invoice_number || '—'}</p>
                  </td>

                  {/* Amount Due */}
                  <td className='px-4 py-3 text-right'>
                    <p className='font-semibold text-brand-navy'>
                      ${formatUsd(payment.amount_due)}
                    </p>
                  </td>

                  {/* Status */}
                  <td className='px-4 py-3 text-center'>
                    <PaymentStatusBadge status={payment.payment_status} />
                  </td>

                  {/* Due Date */}
                  <td className='px-4 py-3 text-center'>
                    {payment.due_date ? (
                      <div className='flex flex-col items-center'>
                        <p className='text-xs text-brand-muted'>
                          {formatDistanceToNow(new Date(payment.due_date), { addSuffix: true })}
                        </p>
                        {payment.days_overdue > 0 && (
                          <p className='text-xs font-semibold text-red-600'>
                            {payment.days_overdue} days overdue
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className='text-xs text-brand-muted'>—</p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className='px-4 py-3 text-right'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onPaymentSelect?.(payment)}
                    >
                      <Icons.eye className='h-3 w-3 mr-1' />
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
