'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { usePaymentsData } from '@/hooks/usePaymentsData'
import {
  PaymentsMetricsRow,
  PaymentsPipelineBoard,
  PaymentsTable,
  PaymentDetailDrawer,
} from '@/components/payments'
import { Card, CardContent } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { PaymentWorkflow } from '@/hooks/usePaymentsData'
import { PipelineActionsCard } from '@/components/orchestrator/PipelineActionsCard'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function PaymentsPage() {
  const { payments, leads, loading } = usePaymentsData()
  const [selectedPayment, setSelectedPayment] = useState<PaymentWorkflow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Find the lead data for the selected payment
  const selectedLead = selectedPayment
    ? leads.find((l) => l.id === selectedPayment.lead_id)
    : null

  const handlePaymentSelect = (payment: PaymentWorkflow) => {
    setSelectedPayment(payment)
    setDetailOpen(true)
  }

  return (
    <motion.div
      className='space-y-8 p-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className='flex flex-col gap-2 mb-6'>
          <h1 className='font-display text-4xl font-bold tracking-tight text-brand-navy'>
            Payments Tracker
          </h1>
          <p className='text-lg text-brand-muted'>
            AI-powered payment orchestration, invoice management, and revenue operations
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        {selectedPayment ? (
          <PipelineActionsCard
            leadId={selectedPayment.lead_id}
            contactEmail={selectedLead?.contact_email}
            contactName={selectedPayment.contact_name}
            companyName={selectedPayment.company_name}
            estimatedDealSize={selectedPayment.amount_due}
          />
        ) : (
          <PipelineActionsCard
            leadId='11111111-1111-4111-8111-111111111104'
            contactEmail='tristanhancock@gmail.com'
            contactName='Tristan Hancock'
            companyName='Ovelia Health'
            estimatedDealSize={500000}
          />
        )}
      </motion.div>

      {/* Metrics Row */}
      <motion.div variants={itemVariants}>
        <PaymentsMetricsRow payments={payments} loading={loading} />
      </motion.div>

      {/* Pipeline Board */}
      <motion.div variants={itemVariants}>
        <PaymentsPipelineBoard payments={payments} />
      </motion.div>

      {/* Payments Table */}
      <motion.div variants={itemVariants}>
        <div className='space-y-4'>
          <h2 className='text-2xl font-bold text-brand-navy'>Payment Queue</h2>
          <PaymentsTable
            payments={payments}
            loading={loading}
            onPaymentSelect={handlePaymentSelect}
          />
        </div>
      </motion.div>

      {/* Payment Detail Drawer */}
      <PaymentDetailDrawer
        payment={selectedPayment}
        lead={selectedLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Info Section */}
      <motion.div variants={itemVariants}>
        <Card className='bg-blue-50 border-blue-200'>
          <CardContent className='pt-6'>
            <div className='flex gap-3'>
              <Icons.info className='h-5 w-5 text-blue-600 flex-shrink-0' />
              <div className='text-sm text-blue-800'>
                <p className='font-semibold mb-1'>Payment Orchestration Workflow:</p>
                <p>
                  1. Contracts are automatically mapped to payment stages based on lead status. 2. Invoices are generated and tracked when contracts are signed. 3. System monitors payment receipt and calculates days overdue. 4. Overdue payments trigger automatic follow-up reminders. 5. Failed or severely overdue payments are escalated to the Workbench for human review. 6. Policy violations are created for payment threshold breaches.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
