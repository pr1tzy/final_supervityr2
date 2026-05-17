'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { AIReasoning } from '@/hooks/useLegalData'

interface AIReasoningPanelProps {
  reasoning: AIReasoning | null
}

export function AIReasoningPanel({ reasoning }: AIReasoningPanelProps) {
  if (!reasoning) {
    return (
      <Card className='border-dashed'>
        <CardContent className='pt-6'>
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Icons.brain className='h-10 w-10 text-gray-300 mb-2' />
            <p className='text-sm text-brand-muted'>No AI reasoning yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const requiresReviewColor = reasoning.requires_human_review
    ? 'border-amber-200 bg-amber-50'
    : 'border-emerald-200 bg-emerald-50'

  const requiresReviewIcon = reasoning.requires_human_review ? (
    <Icons.alertTriangle className='h-5 w-5 text-amber-600' />
  ) : (
    <Icons.checkCircle className='h-5 w-5 text-emerald-600' />
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.brain className='h-5 w-5 text-purple-600' />
          AI Reasoning
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Review Status */}
        <div className={`rounded-lg border p-4 ${requiresReviewColor}`}>
          <div className='flex items-center gap-2 mb-2'>
            {requiresReviewIcon}
            <span className={`font-semibold ${reasoning.requires_human_review ? 'text-amber-800' : 'text-emerald-800'}`}>
              {reasoning.requires_human_review ? 'Human Review Required' : 'Auto-Approvable'}
            </span>
          </div>
          <p className='text-sm text-gray-700'>{reasoning.reasoning}</p>
        </div>

        {/* JSON Structure */}
        <div>
          <label className='text-xs font-semibold text-brand-muted mb-2 block'>
            Reasoning Data
          </label>
          <div className='rounded-lg bg-gray-900 p-4 font-mono text-xs text-gray-100 overflow-x-auto max-h-64 overflow-y-auto'>
            <pre>{JSON.stringify(
              {
                ocr_confidence: reasoning.ocr_confidence,
                signature_detected: reasoning.signature_detected,
                company_match: reasoning.company_match,
                contact_match: reasoning.contact_match,
                deal_size_match: reasoning.deal_size_match,
                requires_human_review: reasoning.requires_human_review,
              },
              null,
              2
            )}</pre>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div>
          <label className='text-xs font-semibold text-brand-muted mb-2 block'>
            OCR Confidence Score
          </label>
          <div className='flex items-center gap-2'>
            <div className='flex-1 h-2 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className={`h-full transition-all ${
                  reasoning.ocr_confidence >= 0.9
                    ? 'bg-emerald-500'
                    : reasoning.ocr_confidence >= 0.75
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${reasoning.ocr_confidence * 100}%` }}
              />
            </div>
            <span className='text-sm font-semibold text-brand-navy'>
              {(reasoning.ocr_confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Validation Checks */}
        <div className='space-y-1 text-xs'>
          <p className='font-semibold text-brand-navy mb-2'>Validation Checks:</p>
          <div className='flex items-center gap-2'>
            {reasoning.company_match ? (
              <Icons.check className='h-3 w-3 text-emerald-600' />
            ) : (
              <Icons.close className='h-3 w-3 text-red-600' />
            )}
            <span>Company match</span>
          </div>
          <div className='flex items-center gap-2'>
            {reasoning.contact_match ? (
              <Icons.check className='h-3 w-3 text-emerald-600' />
            ) : (
              <Icons.close className='h-3 w-3 text-red-600' />
            )}
            <span>Contact match</span>
          </div>
          <div className='flex items-center gap-2'>
            {reasoning.deal_size_match ? (
              <Icons.check className='h-3 w-3 text-emerald-600' />
            ) : (
              <Icons.close className='h-3 w-3 text-red-600' />
            )}
            <span>Deal size match</span>
          </div>
          <div className='flex items-center gap-2'>
            {reasoning.signature_detected ? (
              <Icons.check className='h-3 w-3 text-emerald-600' />
            ) : (
              <Icons.close className='h-3 w-3 text-red-600' />
            )}
            <span>Signature detected</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
