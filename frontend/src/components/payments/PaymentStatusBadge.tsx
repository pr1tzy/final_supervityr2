'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { PaymentWorkflow } from '@/hooks/usePaymentsData'

interface PaymentStatusBadgeProps {
  status: PaymentWorkflow['payment_status']
}

const statusColors: Record<PaymentWorkflow['payment_status'], string> = {
  pending: 'bg-blue-100 text-blue-800',
  partial: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  overdue: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
}

const statusLabels: Record<PaymentWorkflow['payment_status'], string> = {
  pending: 'Pending',
  partial: 'Partial',
  completed: 'Completed',
  overdue: 'Overdue',
  failed: 'Failed',
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-2.5 py-1 rounded-full text-xs font-semibold',
        statusColors[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
