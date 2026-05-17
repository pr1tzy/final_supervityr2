'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { PaymentWorkflow } from '@/hooks/usePaymentsData'

interface PaymentsPipelineBoardProps {
  payments: PaymentWorkflow[]
}

const stageConfig: Record<
  PaymentWorkflow['stage'],
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  not_eligible: {
    label: 'Not Eligible',
    icon: Icons.clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
  awaiting_payment: {
    label: 'Awaiting Payment',
    icon: Icons.clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  payment_sent: {
    label: 'Invoice Sent',
    icon: Icons.send,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  payment_received: {
    label: 'Payment Received',
    icon: Icons.check,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  overdue: {
    label: 'Overdue',
    icon: Icons.alertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  failed: {
    label: 'Failed',
    icon: Icons.close,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
}

export function PaymentsPipelineBoard({ payments }: PaymentsPipelineBoardProps) {
  const stageCounts = {
    not_eligible: payments.filter((p) => p.stage === 'not_eligible').length,
    awaiting_payment: payments.filter((p) => p.stage === 'awaiting_payment').length,
    payment_sent: payments.filter((p) => p.stage === 'payment_sent').length,
    payment_received: payments.filter((p) => p.stage === 'payment_received').length,
    overdue: payments.filter((p) => p.stage === 'overdue').length,
    failed: payments.filter((p) => p.stage === 'failed').length,
  }

  const stages: PaymentWorkflow['stage'][] = [
    'not_eligible',
    'awaiting_payment',
    'payment_sent',
    'payment_received',
    'overdue',
    'failed',
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'>
          {stages.map((stage) => {
            const config = stageConfig[stage]
            const Icon = config.icon
            const count = stageCounts[stage]

            return (
              <div
                key={stage}
                className={cn(
                  'rounded-lg p-4 text-center transition-all duration-200 hover:shadow-md',
                  config.bgColor
                )}
              >
                <div className='flex justify-center mb-2'>
                  <Icon className={cn('h-6 w-6', config.color)} />
                </div>
                <p className='text-xs font-semibold text-gray-700 mb-2'>{config.label}</p>
                <p className={cn('text-2xl font-bold', config.color)}>{count}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
