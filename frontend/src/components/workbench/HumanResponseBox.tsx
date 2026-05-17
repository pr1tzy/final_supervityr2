'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

interface HumanResponseBoxProps {
  initialResponse?: string | null
  onSubmit: (response: string) => Promise<void>
  loading?: boolean
  disabled?: boolean
}

export function HumanResponseBox({
  initialResponse = '',
  onSubmit,
  loading = false,
  disabled = false,
}: HumanResponseBoxProps) {
  const [response, setResponse] = useState(initialResponse || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!response.trim()) return

    try {
      setIsSubmitting(true)
      await onSubmit(response)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Response</CardTitle>
        <CardDescription>
          Explain your decision and provide context for this review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder='Enter your review decision and reasoning...'
            className='w-full min-h-32 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
            disabled={disabled || isSubmitting}
          />

          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => setResponse('')}
              disabled={disabled || isSubmitting}
            >
              Clear
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={disabled || isSubmitting || !response.trim()}
              className='gap-2'
            >
              {isSubmitting && <Icons.loader className='h-4 w-4 animate-spin' />}
              Save Response
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
