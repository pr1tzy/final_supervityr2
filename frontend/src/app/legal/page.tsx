'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  useLegalContracts,
  simulateOCRExtraction,
  validateOCRAgainstCRM,
  generateAIReasoning,
  createWorkbenchEscalation,
  Contract,
  OCRExtractionResult,
  ValidationResult,
  AIReasoning,
} from '@/hooks/useLegalData'
import {
  ContractsTable,
  ContractDetailDrawer,
} from '@/components/legal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function LegalHubPage() {
  const { contracts, leads, loading: contractsLoading } = useLegalContracts()
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [ocrData, setOCRData] = useState<OCRExtractionResult | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [reasoning, setReasoning] = useState<AIReasoning | null>(null)

  // Find the CRM data for the selected contract
  const selectedLead = selectedContract
    ? leads.find((l) => l.id === selectedContract.lead_id)
    : null

  const handleContractSelect = (contract: Contract) => {
    setSelectedContract(contract)
    setDetailOpen(true)
    // Reset OCR data when selecting a new contract
    setOCRData(null)
    setValidation(null)
    setReasoning(null)
  }

  const handleOCRComplete = async (result: OCRExtractionResult) => {
    if (!selectedContract || !selectedLead) return

    setOCRData(result)

    // Run validation
    const validationResult = validateOCRAgainstCRM(selectedLead, result)
    setValidation(validationResult)

    // Generate AI reasoning
    const reasoningResult = generateAIReasoning(result, validationResult)
    setReasoning(reasoningResult)

    // If validation failed or requires review, create workbench escalation
    if (validationResult.has_mismatches || reasoningResult.requires_human_review) {
      await createWorkbenchEscalation(selectedContract.id, selectedContract.lead_id, validationResult)
    }
  }

  // Calculate stats
  const stats = {
    totalContracts: contracts.length,
    activeContracts: contracts.filter(
      (c) => !['completed', 'payment_pending'].includes(c.status)
    ).length,
    needsReview: contracts.filter((c) => c.status === 'human_review').length,
    ocrProcessed: contracts.filter((c) => c.ocr_status === 'extracted').length,
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
            Legal Hub
          </h1>
          <p className='text-lg text-brand-muted'>
            AI-powered contract processing, OCR extraction, and validation
          </p>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <motion.div variants={itemVariants}>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {/* Total Contracts */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-sm font-medium'>
                <span>Total Contracts</span>
                <Icons.fileText className='h-4 w-4 opacity-60' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-3xl font-bold text-brand-navy'>{stats.totalContracts}</div>
              )}
            </CardContent>
          </Card>

          {/* Active Contracts */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-sm font-medium'>
                <span>In Progress</span>
                <Icons.zap className='h-4 w-4 opacity-60' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-3xl font-bold text-amber-700'>{stats.activeContracts}</div>
              )}
            </CardContent>
          </Card>

          {/* Needs Review */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-sm font-medium'>
                <span>Needs Review</span>
                <Icons.alertTriangle className='h-4 w-4 opacity-60' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-3xl font-bold text-red-700'>{stats.needsReview}</div>
              )}
            </CardContent>
          </Card>

          {/* OCR Processed */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-sm font-medium'>
                <span>OCR Processed</span>
                <Icons.check className='h-4 w-4 opacity-60' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-3xl font-bold text-emerald-700'>{stats.ocrProcessed}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Contracts Table */}
      <motion.div variants={itemVariants}>
        <div className='space-y-4'>
          <h2 className='text-2xl font-bold text-brand-navy'>Contract Queue</h2>
          <ContractsTable
            contracts={contracts}
            loading={contractsLoading}
            onContractSelect={handleContractSelect}
          />
        </div>
      </motion.div>

      {/* Contract Detail Drawer */}
      <ContractDetailDrawer
        contract={selectedContract}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        ocrData={ocrData}
        validation={validation}
        reasoning={reasoning}
        onUploadComplete={handleOCRComplete}
      />

      {/* Info Section */}
      <motion.div variants={itemVariants}>
        <Card className='bg-blue-50 border-blue-200'>
          <CardContent className='pt-6'>
            <div className='flex gap-3'>
              <Icons.info className='h-5 w-5 text-blue-600 flex-shrink-0' />
              <div className='text-sm text-blue-800'>
                <p className='font-semibold mb-1'>Legal Hub Workflow:</p>
                <p>
                  1. Select a contract from the queue. 2. Upload a signed PDF to trigger OCR extraction.
                  3. System validates extracted data against CRM. 4. Mismatches trigger human review.
                  5. Validated contracts move to approval stage.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
