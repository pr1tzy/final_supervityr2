'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MaxLeadChat } from '@/components/intake/MaxLeadChat'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

export default function MaxAIPage() {
  return (
    <motion.div
      className='mx-auto max-w-2xl space-y-6'
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className='space-y-2'>
        <h1 className='font-display text-3xl font-bold text-brand-navy'>Max AI</h1>
        <p className='text-brand-muted'>
          Website chatbot intake for AceLink demos. Submits a lead to John; scoring and policies apply before Agent A/B run.
        </p>
        <motion.div className='flex gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href='/crm'>
              <Icons.crm className='mr-2 h-4 w-4' />
              View CRM
            </Link>
          </Button>
          <Button variant='outline' size='sm' asChild>
            <Link href='/logs'>
              <Icons.logs className='mr-2 h-4 w-4' />
              View logs
            </Link>
          </Button>
        </motion.div>
      </div>
      <MaxLeadChat />
    </motion.div>
  )
}
