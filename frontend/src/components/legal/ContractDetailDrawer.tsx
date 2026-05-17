'use client'

import React, { useState } from 'react'
import { Contract, OCRExtractionResult, ValidationResult, AIReasoning } from '@/hooks/useLegalData'
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
import { formatDistanceToNow } from 'date-fns'
import { ContractPipeline } from './ContractPipeline'
import { OCRViewer } from './OCRViewer'
import { ValidationPanel } from './ValidationPanel'
import { AIReasoningPanel } from './AIReasoningPanel'
import { UploadZone } from './UploadZone'

interface ContractDetailDrawerProps {
  contract: Contract | null
  open: boolean
  onOpenChange: (open: boolean) => void
  ocrData?: OCRExtractionResult | null
  validation?: ValidationResult | null
  reasoning?: AIReasoning | null
  onUploadComplete?: (result: OCRExtractionResult) => void
}

export function ContractDetailDrawer({
  contract,
  open,
  onOpenChange,
  ocrData,
  validation,
  reasoning,
  onUploadComplete,
}: ContractDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ocr' | 'validation' | 'reasoning'>(
    'overview'
  )

  if (!contract) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-4xl overflow-y-auto'>
        <SheetHeader className='mb-6'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <SheetTitle className='text-2xl'>{contract.company_name}</SheetTitle>
              <SheetDescription className='mt-2'>
                Contract ID: <span className='font-mono'>{contract.id.substring(0, 20)}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className='space-y-6'>
          {/* Pipeline */}
          <ContractPipeline contract={contract} />

          {/* Tabs */}
          <div className='flex gap-2 border-b border-gray-200'>
            {[
              { id: 'overview' as const, label: 'Overview', icon: <Icons.fileText className='h-4 w-4' /> },
              { id: 'ocr' as const, label: 'OCR', icon: <Icons.zap className='h-4 w-4' /> },
              { id: 'validation' as const, label: 'Validation', icon: <Icons.checkCircle className='h-4 w-4' /> },
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
                  <CardTitle>Contract Information</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                    <span className='text-sm text-brand-muted'>Contact Name</span>
                    <span className='font-medium text-brand-navy'>{contract.contact_name}</span>
                  </div>
                  <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                    <span className='text-sm text-brand-muted'>Deal Size</span>
                    <span className='font-bold text-brand-navy'>
                      ${contract.deal_size.toLocaleString()}
                    </span>
                  </div>
                  <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
                    <span className='text-sm text-brand-muted'>Status</span>
                    <span className='text-sm font-semibold capitalize'>
                      {contract.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-brand-muted'>Created</span>
                    <span className='text-sm text-brand-navy'>
                      {formatDistanceToNow(new Date(contract.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Area */}
              {contract.status === 'sent' || contract.status === 'signed' ? (
                <UploadZone onOCRComplete={onUploadComplete} />
              ) : null}
            </div>
          )}

          {activeTab === 'ocr' && <OCRViewer ocrData={ocrData || null} />}

          {activeTab === 'validation' && <ValidationPanel validation={validation || null} />}

          {activeTab === 'reasoning' && <AIReasoningPanel reasoning={reasoning || null} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
