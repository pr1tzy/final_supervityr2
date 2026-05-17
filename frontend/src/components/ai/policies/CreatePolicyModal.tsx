'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { createPolicy } from '@/hooks/usePolicies'

interface CreatePolicyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreatePolicyModal({
  open,
  onOpenChange,
  onSuccess,
}: CreatePolicyModalProps) {
  const [policyName, setPolicyName] = useState('')
  const [policyDescription, setPolicyDescription] = useState('')
  const [active, setActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!policyName.trim()) {
      setError('Policy name is required')
      return
    }

    if (!policyDescription.trim()) {
      setError('Policy description is required')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const result = await createPolicy(
        policyName.trim(),
        policyDescription.trim(),
        active
      )

      if (result.success) {
        setSuccessMessage('Policy created successfully!')
        setTimeout(() => {
          setPolicyName('')
          setPolicyDescription('')
          setActive(true)
          setSuccessMessage(null)
          setError(null)
          onOpenChange(false)
          onSuccess?.()
        }, 1500)
      } else {
        const errorMsg = result.error || 'Failed to create policy'
        console.error('Policy creation failed:', errorMsg)
        setError(errorMsg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Create New Policy</DialogTitle>
          <DialogDescription>
            Define a new AI governance policy with a simple name and description
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Error Message */}
          {error && (
            <div className='rounded-lg bg-red-50 p-3 border border-red-200'>
              <p className='text-sm text-red-700'>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className='rounded-lg bg-emerald-50 p-3 border border-emerald-200'>
              <p className='text-sm text-emerald-700'>{successMessage}</p>
            </div>
          )}

          {/* Policy Name */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-1.5'>
              Policy Name *
            </label>
            <input
              type='text'
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              placeholder='e.g., Auto-Approve Low Value Items'
              className='w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-cornflower/50'
              disabled={isSubmitting}
            />
          </div>

          {/* Policy Description */}
          <div>
            <label className='block text-sm font-medium text-foreground mb-1.5'>
              Policy Description *
            </label>
            <textarea
              value={policyDescription}
              onChange={(e) => setPolicyDescription(e.target.value)}
              placeholder='Describe what this policy does and when it applies...'
              className='w-full px-3 py-2 rounded-lg border border-input bg-background text-sm min-h-24 focus:outline-none focus:ring-2 focus:ring-brand-cornflower/50'
              disabled={isSubmitting}
            />
          </div>

          {/* Active Toggle */}
          <div className='flex items-center gap-3'>
            <input
              type='checkbox'
              id='active-toggle'
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className='h-4 w-4 rounded border-gray-300'
              disabled={isSubmitting}
            />
            <label htmlFor='active-toggle' className='text-sm font-medium text-foreground cursor-pointer'>
              Activate this policy immediately
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !policyName.trim() || !policyDescription.trim()}
            className='gap-2'
          >
            {isSubmitting && <Icons.loader className='h-4 w-4 animate-spin' />}
            Create Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
