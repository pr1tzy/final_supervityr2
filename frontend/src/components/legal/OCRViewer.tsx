'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { OCRExtractionResult } from '@/hooks/useLegalData'

interface OCRViewerProps {
  ocrData: OCRExtractionResult | null
  loading?: boolean
}

export function OCRViewer({ ocrData, loading }: OCRViewerProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.zap className='h-5 w-5 text-amber-600' />
            OCR Extraction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <Icons.loader className='h-6 w-6 animate-spin text-brand-cornflower' />
            <span className='ml-2 text-sm text-brand-muted'>Processing document...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!ocrData) {
    return (
      <Card className='border-dashed'>
        <CardContent className='pt-6'>
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Icons.zap className='h-10 w-10 text-gray-300 mb-2' />
            <p className='text-sm text-brand-muted'>No OCR extraction yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const confidenceColor =
    ocrData.ocr_confidence >= 0.9
      ? 'text-emerald-700'
      : ocrData.ocr_confidence >= 0.75
        ? 'text-amber-700'
        : 'text-red-700'

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Icons.zap className='h-5 w-5 text-amber-600' />
            OCR Extraction
          </CardTitle>
          <div className={`text-sm font-semibold ${confidenceColor}`}>
            Confidence: {(ocrData.ocr_confidence * 100).toFixed(1)}%
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Signature Status */}
        <div className='rounded-lg bg-gray-50 p-3 border border-gray-200'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-brand-navy'>Signature Detected</span>
            <div className='flex items-center gap-2'>
              {ocrData.signature_detected ? (
                <>
                  <Icons.check className='h-4 w-4 text-emerald-600' />
                  <span className='text-xs font-semibold text-emerald-600'>Yes</span>
                </>
              ) : (
                <>
                  <Icons.close className='h-4 w-4 text-red-600' />
                  <span className='text-xs font-semibold text-red-600'>No</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Extracted Fields */}
        <div className='space-y-3'>
          {/* Company */}
          <div>
            <label className='text-xs font-semibold text-brand-muted mb-1 block'>Company</label>
            <div className='rounded-lg bg-brand-navy/5 p-2 border border-brand-navy/10'>
              <p className='text-sm text-brand-navy font-medium'>{ocrData.extracted_company}</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className='text-xs font-semibold text-brand-muted mb-1 block'>Contact</label>
            <div className='rounded-lg bg-brand-navy/5 p-2 border border-brand-navy/10'>
              <p className='text-sm text-brand-navy font-medium'>{ocrData.extracted_contact}</p>
            </div>
          </div>

          {/* Deal Size */}
          <div>
            <label className='text-xs font-semibold text-brand-muted mb-1 block'>Deal Size</label>
            <div className='rounded-lg bg-brand-navy/5 p-2 border border-brand-navy/10'>
              <p className='text-sm text-brand-navy font-medium'>
                {ocrData.extracted_deal_size
                  ? `$${ocrData.extracted_deal_size.toLocaleString()}`
                  : 'Not extracted'}
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <label className='text-xs font-semibold text-brand-muted mb-1 block'>Next Steps</label>
            <div className='rounded-lg bg-brand-navy/5 p-2 border border-brand-navy/10'>
              <p className='text-sm text-brand-navy'>{ocrData.extracted_next_steps}</p>
            </div>
          </div>
        </div>

        {/* Raw Text Preview */}
        <details className='text-xs'>
          <summary className='font-semibold text-brand-muted cursor-pointer hover:text-brand-navy'>
            View raw OCR text
          </summary>
          <div className='mt-2 rounded-lg bg-gray-50 p-2 border border-gray-200 max-h-32 overflow-y-auto'>
            <pre className='text-[10px] text-gray-600 whitespace-pre-wrap break-words'>
              {ocrData.raw_text}
            </pre>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
