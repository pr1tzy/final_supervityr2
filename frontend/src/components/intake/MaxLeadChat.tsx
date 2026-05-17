'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { submitLeadToJohn, fetchOrchestratorHealth, type LeadIntakePayload } from '@/lib/orchestrator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

const QUICK_PROMPTS = [
  { label: 'Website — $5k', project_type: 'website', budget: '$5000' },
  { label: 'AI Chatbot — $2k', project_type: 'ai_chatbot', budget: '$2000' },
  { label: 'Full stack — low budget', project_type: 'fullstack_product', budget: '$2000' },
]

export function MaxLeadChat({ compact = false }: { compact?: boolean }) {
  const [form, setForm] = useState<LeadIntakePayload>({
    name: '',
    email: '',
    company: '',
    phone: '',
    budget: '',
    project_type: 'website',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [result, setResult] = useState<string | null>(null)
  const [johnOnline, setJohnOnline] = useState<boolean | null>(null)

  useEffect(() => {
    fetchOrchestratorHealth()
      .then((h) => setJohnOnline(h?.status === 'ok'))
      .catch(() => setJohnOnline(false))
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setStatus('error')
      setResult('Name and email are required.')
      return
    }
    setStatus('loading')
    setResult(null)
    try {
      const res = await submitLeadToJohn(form)
      setStatus('ok')
      const score = (res.reasoning_trace as { scoring?: { score?: number } })?.scoring?.score
      setResult(
        res.success
          ? `Lead captured. John scored ${score ?? '—'}/100. Lead ID: ${res.lead_id ?? 'see CRM'}. Check Logs & CRM.`
          : res.message || 'Orchestrator returned without success.'
      )
      setForm({ name: '', email: '', company: '', phone: '', budget: '', project_type: 'website', message: '' })
    } catch (err) {
      setStatus('error')
      setResult(err instanceof Error ? err.message : 'Failed to reach John on :8001')
    }
  }

  return (
    <Card
      className={cn(
        'border-2 border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-blue-50/50 shadow-soft',
        compact && 'max-w-xl'
      )}
    >
      <CardHeader>
        <CardTitle className='flex items-center gap-2 font-display text-brand-navy'>
          <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white'>
            <Icons.sparkles className='h-5 w-5' />
          </span>
          Max AI — Lead intake
        </CardTitle>
        <CardDescription>
          Posts to John orchestrator ({process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}). Triggers Agent A + B pipeline.
          Same email updates the existing lead (name and company refresh). Use a new email for a brand-new person.
          {johnOnline === false && (
            <span className='mt-1 block text-amber-700'>John offline — start SupervityR2 backend first.</span>
          )}
          {johnOnline === true && (
            <span className='mt-1 block text-emerald-700'>John is online.</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <motion.div className='flex flex-wrap gap-2'>
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.label}
              type='button'
              className='rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-800 hover:bg-violet-50'
              onClick={() =>
                setForm((f) => ({ ...f, project_type: q.project_type, budget: q.budget }))
              }
            >
              {q.label}
            </button>
          ))}
        </motion.div>

        <form onSubmit={onSubmit} className='grid gap-3 sm:grid-cols-2'>
          <div className='space-y-1.5 sm:col-span-1'>
            <Label htmlFor='max-name'>Name</Label>
            <Input
              id='max-name'
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder='Alex Rivera'
            />
          </div>
          <div className='space-y-1.5 sm:col-span-1'>
            <Label htmlFor='max-email'>Email</Label>
            <Input
              id='max-email'
              type='email'
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder='alex@company.com'
            />
          </div>
          <div className='space-y-1.5 sm:col-span-1'>
            <Label htmlFor='max-company'>Company</Label>
            <Input
              id='max-company'
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              placeholder='Acme Inc'
            />
          </div>
          <div className='space-y-1.5 sm:col-span-1'>
            <Label htmlFor='max-budget'>Budget</Label>
            <Input
              id='max-budget'
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              placeholder='$5000 or 5 lakhs'
            />
          </div>
          <div className='space-y-1.5 sm:col-span-2'>
            <Label htmlFor='max-type'>Project type</Label>
            <select
              id='max-type'
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm'
              value={form.project_type}
              onChange={(e) => setForm((f) => ({ ...f, project_type: e.target.value }))}
            >
              <option value='website'>Website</option>
              <option value='ai_chatbot'>AI Chatbot</option>
              <option value='internal_tool'>Internal tool</option>
              <option value='fullstack_product'>Full-stack product</option>
            </select>
          </div>
          <div className='sm:col-span-2'>
            <Button type='submit' className='w-full' disabled={status === 'loading'}>
              {status === 'loading' ? (
                <>
                  <Icons.loader className='mr-2 h-4 w-4 animate-spin' />
                  Sending to John…
                </>
              ) : (
                <>
                  <Icons.send className='mr-2 h-4 w-4' />
                  Submit lead & run pipeline
                </>
              )}
            </Button>
          </div>
        </form>

        {result && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'rounded-lg border p-3 text-sm',
              status === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'
            )}
          >
            {result}
          </motion.p>
        )}
      </CardContent>
    </Card>
  )
}
