'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { PaymentWorkflow } from '@/hooks/usePaymentsData'

interface PaymentsMetricsRowProps {
  payments: PaymentWorkflow[]
  loading?: boolean
}

export function PaymentsMetricsRow({ payments, loading = false }: PaymentsMetricsRowProps) {
  const metrics = {
    revenueClosed: payments
      .filter((p) => p.payment_status === 'completed')
      .reduce((sum, p) => sum + (p.amount_paid ?? 0), 0),
    invoicesPending: payments.filter((p) => p.payment_status === 'pending').length,
    overduePayments: payments.filter((p) => p.payment_status === 'overdue').length,
    paymentSuccessRate: payments.length > 0
      ? ((payments.filter((p) => p.payment_status === 'completed').length / payments.length) * 100).toFixed(1)
      : '0',
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {/* Revenue Closed */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center justify-between text-sm font-medium'>
            <span>Revenue Closed</span>
            <Icons.barChart className='h-4 w-4 opacity-60' />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className='h-8 w-24' />
          ) : (
            <div className='text-3xl font-bold text-emerald-700'>
              ${(metrics.revenueClosed / 1000).toFixed(0)}K
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices Pending */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center justify-between text-sm font-medium'>
            <span>Invoices Pending</span>
            <Icons.fileText className='h-4 w-4 opacity-60' />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className='h-8 w-16' />
          ) : (
            <div className='text-3xl font-bold text-blue-700'>{metrics.invoicesPending}</div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Payments */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center justify-between text-sm font-medium'>
            <span>Overdue Payments</span>
            <Icons.alertTriangle className='h-4 w-4 opacity-60' />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className='h-8 w-16' />
          ) : (
            <div className='text-3xl font-bold text-red-700'>{metrics.overduePayments}</div>
          )}
        </CardContent>
      </Card>

      {/* Payment Success Rate */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center justify-between text-sm font-medium'>
            <span>Success Rate</span>
            <Icons.check className='h-4 w-4 opacity-60' />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className='h-8 w-16' />
          ) : (
            <div className='text-3xl font-bold text-emerald-700'>{metrics.paymentSuccessRate}%</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
