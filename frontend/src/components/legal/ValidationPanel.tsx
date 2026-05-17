'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { ValidationResult } from '@/hooks/useLegalData'

interface ValidationPanelProps {
  validation: ValidationResult | null
}

export function ValidationPanel({ validation }: ValidationPanelProps) {
  if (!validation) {
    return (
      <Card className='border-dashed'>
        <CardContent className='pt-6'>
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Icons.checkCircle className='h-10 w-10 text-gray-300 mb-2' />
            <p className='text-sm text-brand-muted'>No validation data yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusColor = validation.has_mismatches
    ? 'border-red-200 bg-red-50'
    : 'border-emerald-200 bg-emerald-50'

  const statusIcon = validation.has_mismatches ? (
    <Icons.alertTriangle className='h-5 w-5 text-red-600' />
  ) : (
    <Icons.checkCircle className='h-5 w-5 text-emerald-600' />
  )

  const statusText = validation.has_mismatches ? 'Validation Failed' : 'Validation Passed'
  const statusTextColor = validation.has_mismatches ? 'text-red-800' : 'text-emerald-800'

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.checkCircle className='h-5 w-5 text-blue-600' />
          CRM vs OCR Validation
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Status Bar */}
        <div className={`rounded-lg border p-4 ${statusColor}`}>
          <div className='flex items-center gap-2'>
            {statusIcon}
            <span className={`font-semibold ${statusTextColor}`}>{statusText}</span>
          </div>
        </div>

        {/* Validation Fields */}
        <div className='space-y-2'>
          {/* Company Match */}
          <div className='flex items-center justify-between p-2 rounded-lg bg-gray-50'>
            <span className='text-sm text-brand-navy'>Company Match</span>
            {validation.company_match ? (
              <Icons.check className='h-4 w-4 text-emerald-600' />
            ) : (
              <Icons.close className='h-4 w-4 text-red-600' />
            )}
          </div>

          {/* Contact Match */}
          <div className='flex items-center justify-between p-2 rounded-lg bg-gray-50'>
            <span className='text-sm text-brand-navy'>Contact Match</span>
            {validation.contact_match ? (
              <Icons.check className='h-4 w-4 text-emerald-600' />
            ) : (
              <Icons.close className='h-4 w-4 text-red-600' />
            )}
          </div>

          {/* Deal Size Match */}
          <div className='flex items-center justify-between p-2 rounded-lg bg-gray-50'>
            <span className='text-sm text-brand-navy'>Deal Size Match</span>
            {validation.deal_size_match ? (
              <Icons.check className='h-4 w-4 text-emerald-600' />
            ) : (
              <Icons.close className='h-4 w-4 text-red-600' />
            )}
          </div>

          {/* Signature Valid */}
          <div className='flex items-center justify-between p-2 rounded-lg bg-gray-50'>
            <span className='text-sm text-brand-navy'>Signature Valid</span>
            {validation.signature_valid ? (
              <Icons.check className='h-4 w-4 text-emerald-600' />
            ) : (
              <Icons.close className='h-4 w-4 text-red-600' />
            )}
          </div>
        </div>

        {/* Mismatches */}
        {validation.mismatches.length > 0 && (
          <div className='rounded-lg border border-red-200 bg-red-50 p-3 space-y-2'>
            <p className='font-semibold text-red-800 text-sm'>Mismatches Detected:</p>
            {validation.mismatches.map((mismatch, idx) => (
              <div key={idx} className='text-xs space-y-1'>
                <p className='font-medium text-red-700'>{mismatch.field}</p>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='rounded bg-white p-1 border border-red-100'>
                    <p className='text-xs font-medium text-brand-muted'>CRM:</p>
                    <p className='text-xs text-red-700'>{mismatch.crm_value}</p>
                  </div>
                  <div className='rounded bg-white p-1 border border-red-100'>
                    <p className='text-xs font-medium text-brand-muted'>OCR:</p>
                    <p className='text-xs text-red-700'>{mismatch.ocr_value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div className='rounded-lg border border-amber-200 bg-amber-50 p-3'>
            <p className='font-semibold text-amber-800 text-sm mb-2'>Warnings:</p>
            <ul className='space-y-1'>
              {validation.warnings.map((warning, idx) => (
                <li key={idx} className='text-xs text-amber-700 flex items-start gap-2'>
                  <Icons.alertTriangle className='h-3 w-3 mt-0.5 flex-shrink-0' />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
