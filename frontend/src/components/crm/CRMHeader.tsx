'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

interface CRMHeaderProps {
  onCreateLead?: () => void
  onRunAnalysis?: () => void
  onExport?: () => void
}

export function CRMHeader({ onCreateLead, onRunAnalysis, onExport }: CRMHeaderProps) {
  return (
    <div className='flex flex-col gap-6'>
      {/* Main heading */}
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <h1 className='font-display text-4xl font-bold tracking-tight text-brand-navy'>
            CRM Command Center
          </h1>
          <p className='mt-2 text-lg text-brand-muted'>
            AI-powered lead orchestration and sales operations
          </p>
        </div>

        {/* Action buttons */}
        <div className='flex gap-3'>
          <Button
            variant='glass'
            size='sm'
            onClick={onExport}
            className='flex items-center gap-2'
          >
            <Icons.download className='h-4 w-4' />
            Export
          </Button>

          <Button
            variant='glass'
            size='sm'
            onClick={onRunAnalysis}
            className='flex items-center gap-2'
          >
            <Icons.sparkles className='h-4 w-4' />
            Run AI Analysis
          </Button>

          <Button
            variant='gradient'
            size='sm'
            onClick={onCreateLead}
            className='flex items-center gap-2'
          >
            <Icons.plus className='h-4 w-4' />
            Create Lead
          </Button>
        </div>
      </div>
    </div>
  )
}
