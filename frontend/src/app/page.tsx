'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useClientTimeString } from '@/hooks/useClientTime'
import Link from 'next/link'
import {
  ExecutiveOverview,
  OrchestrationMap,
  AgentStatusBoard,
  WorkflowPipeline,
  LiveOperationsFeed,
} from '@/components/dashboard'
import { MaxLeadChat } from '@/components/intake/MaxLeadChat'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

function HeroSection({ totalLeads }: { totalLeads: number }) {
  return (
    <motion.div
      className='relative overflow-hidden rounded-2xl border border-brand-cornflower/20 bg-gradient-to-br from-brand-navy via-indigo-900 to-violet-900 p-8 text-white shadow-accent'
      variants={itemVariants}
    >
      <motion.div className='absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl' />
      <div className='relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
        <div className='space-y-3 max-w-xl'>
          <p className='text-xs font-semibold uppercase tracking-widest text-white/70'>AceLink · Twisty Command Center</p>
          <h1 className='font-display text-4xl font-bold tracking-tight sm:text-5xl'>Autonomous revenue operations</h1>
          <p className='text-lg text-white/80'>
            John orchestrates Agents A–E across CRM, outreach, legal, and payments — {totalLeads} leads in pipeline.
          </p>
          <div className='flex flex-wrap gap-2 pt-1'>
            <Button size='sm' className='bg-white text-brand-navy hover:bg-white/90' asChild>
              <Link href='/max'>
                <Icons.sparkles className='mr-2 h-4 w-4' />
                Demo: Max AI intake
              </Link>
            </Button>
            <Button size='sm' variant='outline' className='border-white/30 text-white hover:bg-white/10' asChild>
              <Link href='/logs'>View logs</Link>
            </Button>
          </div>
        </div>
        <div className='grid grid-cols-2 gap-3 sm:gap-4'>
          {[
            { label: 'Orchestrator', value: 'John' },
            { label: 'Agents', value: 'A–E' },
            { label: 'Data', value: 'Supabase' },
            { label: 'Leads', value: String(totalLeads) },
          ].map((s) => (
            <div key={s.label} className='rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur'>
              <p className='text-[10px] uppercase tracking-wide text-white/60'>{s.label}</p>
              <p className='text-xl font-semibold'>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Main Dashboard Component
export default function HomePage() {
  const {
    metrics,
    agentStatuses,
    operationalEvents,
    pipelineStages,
    orchestrationActive,
    loading
  } = useDashboardData()
  const refreshTime = useClientTimeString(10_000)

  return (
    <motion.div
      className='space-y-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Hero Section */}
      <HeroSection totalLeads={metrics?.totalLeads ?? 0} />

      <motion.section className='grid gap-6 lg:grid-cols-2' variants={sectionVariants}>
        <MaxLeadChat compact />
      </motion.section>

      {/* Section 1: Executive Overview - 6 Key Metrics */}
      <motion.section
        className='space-y-4'
        variants={sectionVariants}
      >
        <div className='flex items-center gap-2'>
          <div className='h-1 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full' />
          <h2 className='text-xl font-semibold text-slate-900'>Executive Overview</h2>
        </div>
        <ExecutiveOverview
          metrics={metrics}
          loading={loading}
          orchestrationActive={orchestrationActive || false}
        />
      </motion.section>

      {/* Section 2: Orchestration Map - THE CENTERPIECE */}
      <motion.section
        className='space-y-4'
        variants={sectionVariants}
      >
        <div className='flex items-center gap-2'>
          <div className='h-1 w-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full' />
          <h2 className='text-xl font-semibold text-slate-900'>AI Orchestration Engine</h2>
        </div>
        <OrchestrationMap
          agents={agentStatuses || []}
          metrics={metrics}
          loading={loading}
          orchestrationActive={orchestrationActive || false}
        />
      </motion.section>

      {/* Section 3: Agent Status Board - Individual Agent Status */}
      <motion.section
        className='space-y-4'
        variants={sectionVariants}
      >
        <div className='flex items-center gap-2'>
          <div className='h-1 w-8 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-full' />
          <h2 className='text-xl font-semibold text-slate-900'>Agent Command Status</h2>
        </div>
        <AgentStatusBoard agents={agentStatuses || []} loading={loading} />
      </motion.section>

      {/* Section 4: Workflow Pipeline - Lead Stages */}
      <motion.section
        className='space-y-4'
        variants={sectionVariants}
      >
        <div className='flex items-center gap-2'>
          <div className='h-1 w-8 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full' />
          <h2 className='text-xl font-semibold text-slate-900'>Pipeline Stages</h2>
        </div>
        <WorkflowPipeline
          stages={pipelineStages || []}
          loading={loading}
        />
      </motion.section>

      {/* Section 5: Live Operations Feed - Real-time Events */}
      <motion.section
        className='space-y-4'
        variants={sectionVariants}
      >
        <div className='flex items-center gap-2'>
          <div className='h-1 w-8 bg-gradient-to-r from-emerald-600 to-yellow-600 rounded-full' />
          <h2 className='text-xl font-semibold text-slate-900'>Live Operations Feed</h2>
        </div>
        <LiveOperationsFeed events={operationalEvents || []} loading={loading} />
      </motion.section>


      {/* Footer Info */}
      <motion.div
        className='border-t border-slate-200 pt-8 pb-4'
        variants={itemVariants}
      >
        <p className='text-sm text-slate-500' suppressHydrationWarning>
          Real-time data. Updates every 10 seconds.
          {refreshTime ? ` Last refresh: ${refreshTime}` : ''}
        </p>
      </motion.div>
    </motion.div>
  )
}
