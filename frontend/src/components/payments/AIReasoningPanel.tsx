'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { PaymentOrchestratorReasoning } from '@/hooks/usePaymentsData'

interface AIReasoningPanelProps {
  reasoning: PaymentOrchestratorReasoning | null
}

export function AIReasoningPanel({ reasoning }: AIReasoningPanelProps) {
  if (!reasoning) {
    return (
      <Card className='border-dashed'>
        <CardContent className='pt-6'>
          <p className='text-center text-sm text-brand-muted'>AI reasoning will appear after orchestration analysis</p>
        </CardContent>
      </Card>
    )
  }

  const riskColor =
    reasoning.risk_score >= 75 ? 'text-red-600' : reasoning.risk_score >= 50 ? 'text-orange-600' : 'text-emerald-600'

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>AI Payment Orchestration</span>
          <Icons.brain className='h-5 w-5 text-brand-muted' />
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Risk Score Gauge */}
        <div className='flex items-center justify-between mb-4'>
          <span className='text-sm font-medium text-brand-navy'>Risk Score</span>
          <div className='flex items-center gap-3'>
            <div className='w-32 h-2 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  reasoning.risk_score >= 75
                    ? 'bg-red-500'
                    : reasoning.risk_score >= 50
                      ? 'bg-orange-500'
                      : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, reasoning.risk_score)}%` }}
              />
            </div>
            <span className={cn('font-bold text-lg', riskColor)}>{reasoning.risk_score.toFixed(1)}</span>
          </div>
        </div>

        {/* Orchestration Metrics */}
        <div className='grid grid-cols-2 gap-3 mb-4'>
          {/* Contract Signed */}
          <div className='flex items-center gap-2 p-2 rounded-lg bg-gray-50'>
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                reasoning.contract_signed ? 'bg-emerald-500' : 'bg-gray-300'
              )}
            />
            <span className='text-xs text-gray-700'>Contract Signed</span>
          </div>

          {/* Invoice Sent */}
          <div className='flex items-center gap-2 p-2 rounded-lg bg-gray-50'>
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                reasoning.invoice_sent ? 'bg-emerald-500' : 'bg-gray-300'
              )}
            />
            <span className='text-xs text-gray-700'>Invoice Sent</span>
          </div>

          {/* Payment Link Generated */}
          <div className='flex items-center gap-2 p-2 rounded-lg bg-gray-50'>
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                reasoning.payment_link_generated ? 'bg-emerald-500' : 'bg-gray-300'
              )}
            />
            <span className='text-xs text-gray-700'>Payment Link</span>
          </div>

          {/* Payment Received */}
          <div className='flex items-center gap-2 p-2 rounded-lg bg-gray-50'>
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                reasoning.payment_received ? 'bg-emerald-500' : 'bg-gray-300'
              )}
            />
            <span className='text-xs text-gray-700'>Payment Received</span>
          </div>
        </div>

        {/* Details */}
        <div className='space-y-3 border-t border-gray-100 pt-4'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-brand-muted'>Lead Status</span>
            <span className='text-sm font-semibold text-brand-navy capitalize'>
              {reasoning.lead_status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm text-brand-muted'>Days Overdue</span>
            <span className={cn('text-sm font-semibold', reasoning.days_overdue > 0 ? 'text-red-600' : 'text-gray-700')}>
              {reasoning.days_overdue}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm text-brand-muted'>Amount Paid vs Due</span>
            <span className='text-sm font-semibold text-brand-navy'>{(reasoning.amount_paid_vs_due * 100).toFixed(0)}%</span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm text-brand-muted'>Follow-up Required</span>
            <span className={cn('text-sm font-semibold', reasoning.requires_follow_up ? 'text-orange-600' : 'text-emerald-600')}>
              {reasoning.requires_follow_up ? 'Yes' : 'No'}
            </span>
          </div>

          <div className='flex items-center justify-between'>
            <span className='text-sm text-brand-muted'>Escalation Needed</span>
            <span className={cn('text-sm font-semibold', reasoning.requires_escalation ? 'text-red-600' : 'text-emerald-600')}>
              {reasoning.requires_escalation ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {/* Reasoning Text */}
        <div className='mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100'>
          <p className='text-xs text-blue-800'>{reasoning.reasoning}</p>
        </div>
      </CardContent>
    </Card>
  )
}
