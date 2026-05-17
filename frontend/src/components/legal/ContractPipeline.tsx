'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Contract } from '@/hooks/useLegalData'
import { cn } from '@/lib/utils'

interface ContractPipelineProps {
  contract: Contract
}

const STAGES: { status: Contract['status']; label: string; icon: React.ReactNode }[] = [
  { status: 'generated', label: 'Generated', icon: <Icons.fileText className='h-4 w-4' /> },
  { status: 'sent', label: 'Sent', icon: <Icons.send className='h-4 w-4' /> },
  { status: 'signed', label: 'Signed', icon: <Icons.check className='h-4 w-4' /> },
  { status: 'ocr_processing', label: 'OCR', icon: <Icons.zap className='h-4 w-4' /> },
  { status: 'validation', label: 'Validation', icon: <Icons.checkCircle className='h-4 w-4' /> },
  {
    status: 'human_review',
    label: 'Review',
    icon: <Icons.user className='h-4 w-4' />,
  },
  { status: 'approved', label: 'Approved', icon: <Icons.check className='h-4 w-4' /> },
  {
    status: 'payment_pending',
    label: 'Payment',
    icon: <Icons.barChart className='h-4 w-4' />,
  },
  { status: 'completed', label: 'Completed', icon: <Icons.checkCircle className='h-4 w-4' /> },
]

export function ContractPipeline({ contract }: ContractPipelineProps) {
  const currentIndex = STAGES.findIndex((s) => s.status === contract.status)

  return (
    <Card className='p-6'>
      <h3 className='font-semibold text-brand-navy mb-4'>Contract Pipeline</h3>
      <div className='flex items-center justify-between gap-2 overflow-x-auto pb-2'>
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex
          const isActive = idx === currentIndex
          const isFuture = idx > currentIndex

          return (
            <div key={stage.status} className='flex items-center flex-shrink-0'>
              {/* Stage Circle */}
              <div
                className={cn(
                  'flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors',
                  isCompleted && 'bg-emerald-100 border-emerald-500 text-emerald-700',
                  isActive && 'bg-brand-cornflower/20 border-brand-cornflower text-brand-cornflower',
                  isFuture && 'bg-gray-100 border-gray-300 text-gray-500'
                )}
              >
                {stage.icon}
              </div>

              {/* Label */}
              <div className='text-center text-xs font-medium mt-2 -ml-4'>
                <p
                  className={cn(
                    'text-xs',
                    isCompleted && 'text-emerald-700',
                    isActive && 'text-brand-cornflower font-bold',
                    isFuture && 'text-gray-500'
                  )}
                >
                  {stage.label}
                </p>
              </div>

              {/* Connector */}
              {idx < STAGES.length - 1 && (
                <div
                  className={cn(
                    'h-1 w-12 mx-1 rounded-full',
                    isCompleted ? 'bg-emerald-500' : 'bg-gray-300'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
