'use client'

import React, { useState } from 'react'
import { PaymentWorkflow, PaymentOrchestratorReasoning, generatePaymentReasoning, simulatePaymentAction, createPaymentPolicyViolation } from '@/hooks/usePaymentsData'
import { formatUsd } from '@/lib/utils'
import { Lead } from '@/lib/supabase'
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
import { InvoicePanel } from './InvoicePanel'
import { AIReasoningPanel } from './AIReasoningPanel'

interface PaymentDetailDrawerProps {
  payment: PaymentWorkflow | null
  lead: Lead | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaymentDetailDrawer({
  payment,
  lead,
  open,
  onOpenChange,
}: PaymentDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoice' | 'reasoning'>('overview')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!payment) return null

  const reasoning = generatePaymentReasoning(payment, lead)

  const handleSendReminder = async () => {
    setIsProcessing(true)
    try {
      await simulatePaymentAction(payment.id, 'send_reminder', payment.lead_id)
      alert('Payment reminder sent to ' + payment.contact_name)
    } catch (error) {
      console.error('Error sending reminder:', error)
      alert('Failed to send reminder')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkReceived = async () => {
    setIsProcessing(true)
    try {
      await simulatePaymentAction(payment.id, 'mark_received', payment.lead_id)
      alert('Payment marked as received')
    } catch (error) {
      console.error('Error marking payment:', error)
      alert('Failed to mark payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEscalate = async () => {
    setIsProcessing(true)
    try {
      await simulatePaymentAction(payment.id, 'escalate', payment.lead_id)
      await createPaymentPolicyViolation(
        payment.lead_id,
        'payment_overdue',
        `Payment overdue by ${payment.days_overdue} days for invoice ${payment.invoice_number}`
      )
      alert('Payment escalated to workbench')
    } catch (error) {
      console.error('Error escalating payment:', error)
      alert('Failed to escalate payment')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-4xl overflow-y-auto'>
        <SheetHeader className='mb-6'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <SheetTitle className='text-2xl'>{payment.company_name}</SheetTitle>
              <SheetDescription className='mt-2'>
                Invoice: <span className='font-mono'>{payment.invoice_number}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className='space-y-6'>
          {/* Payment Summary */}
          <Card className='border-blue-200 bg-blue-50'>
            <CardContent className='pt-6'>
              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <p className='text-xs text-blue-600 font-semibold mb-1'>Amount Due</p>
                  <p className='text-2xl font-bold text-brand-navy'>${formatUsd(payment.amount_due)}</p>
                </div>
                <div>
                  <p className='text-xs text-blue-600 font-semibold mb-1'>Amount Paid</p>
                  <p className='text-2xl font-bold text-emerald-600'>${formatUsd(payment.amount_paid)}</p>
                </div>
                <div>
                  <p className='text-xs text-blue-600 font-semibold mb-1'>Balance</p>
                  <p className='text-2xl font-bold text-orange-600'>
                    ${formatUsd((payment.amount_due ?? 0) - (payment.amount_paid ?? 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className='flex gap-2 border-b border-gray-200'>
            {[
              { id: 'overview' as const, label: 'Overview', icon: <Icons.fileText className='h-4 w-4' /> },
              { id: 'invoice' as const, label: 'Invoice', icon: <Icons.barChart className='h-4 w-4' /> },
              { id: 'reasoning' as const, label: 'AI Reasoning', icon: <Icons.brain className='h-4 w-4' /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-cornflower text-brand-cornflower font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                    <span className='text-sm text-brand-muted'>Contact</span>
                    <span className='font-medium text-brand-navy'>{payment.contact_name}</span>
                  </div>
                  <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                    <span className='text-sm text-brand-muted'>Status</span>
                    <span className='text-sm font-semibold capitalize text-brand-navy'>
                      {payment.payment_status}
                    </span>
                  </div>
                  <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                    <span className='text-sm text-brand-muted'>Stage</span>
                    <span className='text-sm font-semibold capitalize text-brand-navy'>
                      {payment.stage.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-brand-muted'>Created</span>
                    <span className='text-sm text-brand-navy'>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Actions</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <Button
                    className='w-full'
                    variant='outline'
                    onClick={handleSendReminder}
                    disabled={isProcessing}
                  >
                    <Icons.send className='h-4 w-4 mr-2' />
                    Send Payment Reminder
                  </Button>
                  <Button
                    className='w-full'
                    onClick={handleMarkReceived}
                    disabled={isProcessing || payment.payment_status === 'completed'}
                  >
                    <Icons.check className='h-4 w-4 mr-2' />
                    Mark as Received
                  </Button>
                  {(payment.payment_status === 'overdue' || payment.payment_status === 'failed') && (
                    <Button
                      className='w-full'
                      variant='destructive'
                      onClick={handleEscalate}
                      disabled={isProcessing}
                    >
                      <Icons.alertTriangle className='h-4 w-4 mr-2' />
                      Escalate to Workbench
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'invoice' && <InvoicePanel payment={payment} />}

          {activeTab === 'reasoning' && <AIReasoningPanel reasoning={reasoning} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
