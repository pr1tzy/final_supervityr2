'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import {
  triggerMonitorCheck,
  triggerPhaseLegal,
  triggerPhasePayment,
} from '@/lib/orchestrator'
import { cn } from '@/lib/utils'

const TRISTAN_DEMO_ID = '11111111-1111-4111-8111-111111111104'

type PipelineActionsCardProps = {
  leadId: string
  contactEmail?: string
  contactName?: string
  companyName?: string
  estimatedDealSize?: number | null
  compact?: boolean
}

export function PipelineActionsCard({
  leadId,
  contactEmail,
  contactName,
  companyName,
  estimatedDealSize,
  compact = false,
}: PipelineActionsCardProps) {
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState('')

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key)
    setMessage(null)
    try {
      const res = await fn()
      setMessage(typeof res === 'object' && res && 'message' in res ? String((res as { message?: string }).message) : 'Done — refresh Logs / CRM')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setBusy(null)
    }
  }

  const deposit = Math.min(Math.round((estimatedDealSize ?? 500000) * 0.3), 150000)

  return (
    <Card className={cn('border-violet-200/60 bg-violet-50/30', compact && 'shadow-sm')}>
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Icons.zap className='h-4 w-4 text-violet-600' />
          John pipeline actions
        </CardTitle>
        <CardDescription>
          Phases 2–4 via local orchestrator. Agent E checks Outlook for contract replies (and optional PDF OCR).
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap gap-2'>
          <Button
            size='sm'
            variant='outline'
            disabled={!!busy}
            onClick={() =>
              run('legal', () =>
                triggerPhaseLegal(leadId, {
                  project_description: `Scoped engagement for ${companyName || 'client'} — marketing site, CMS, launch timeline per transcript.`,
                  scoped_budget: String(estimatedDealSize ?? 500000),
                  scoped_timeline: 'October 2026',
                })
              )
            }
          >
            {busy === 'legal' ? <Icons.loader className='h-4 w-4 animate-spin' /> : <Icons.fileText className='mr-1 h-4 w-4' />}
            Phase 2 · Legal
          </Button>
          <Button
            size='sm'
            variant='outline'
            disabled={!!busy}
            onClick={() => run('payment', () => triggerPhasePayment(leadId, deposit))}
          >
            {busy === 'payment' ? <Icons.loader className='h-4 w-4 animate-spin' /> : <Icons.barChart className='mr-1 h-4 w-4' />}
            Phase 3 · Payment
          </Button>
          <Button
            size='sm'
            className='bg-violet-600 hover:bg-violet-700'
            disabled={!!busy}
            onClick={() =>
              run('check', () =>
                triggerMonitorCheck({
                  leadId,
                  clientEmail: contactEmail,
                  clientName: contactName,
                })
              )
            }
          >
            {busy === 'check' ? <Icons.loader className='h-4 w-4 animate-spin' /> : <Icons.mail className='mr-1 h-4 w-4' />}
            Agent E · Check replies
          </Button>
        </div>

        <div className='space-y-2 rounded-lg border border-violet-100 bg-white/80 p-3'>
          <Label htmlFor='pdf-url' className='text-xs'>
            Optional: signed PDF URL for OCR (Agent E)
          </Label>
          <div className='flex gap-2'>
            <Input
              id='pdf-url'
              placeholder='https://…/signed-contract.pdf'
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              className='text-sm'
            />
            <Button
              size='sm'
              variant='secondary'
              disabled={!!busy || !pdfUrl.trim()}
              onClick={() =>
                run('ocr', () =>
                  triggerMonitorCheck({
                    leadId,
                    clientEmail: contactEmail,
                    clientName: contactName,
                    signedPdfUrl: pdfUrl.trim(),
                    expectedName: contactName,
                    expectedAmountUsd: estimatedDealSize ?? undefined,
                  })
                )
              }
            >
              OCR
            </Button>
          </div>
        </div>

        {leadId === TRISTAN_DEMO_ID && (
          <p className='text-[10px] text-brand-muted'>Demo lead Tristan — use after seed script.</p>
        )}

        {message && (
          <p
            className={cn(
              'rounded-md border p-2 text-xs',
              message.toLowerCase().includes('fail') || message.toLowerCase().includes('error')
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            )}
          >
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
