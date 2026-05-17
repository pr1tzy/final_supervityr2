'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useAIInsights } from '@/hooks/useAIInsights'
import { useClientTimeString } from '@/hooks/useClientTime'
import {
  ExecutiveMetrics,
  WorkflowHealthPanel,
  LeadIntelligencePanel,
  AgentPerformancePanel,
  HumanReviewAnalytics,
  PolicyIntelligencePanel,
  LegalInsightsPanel,
  PaymentInsightsPanel,
  FailureAnalysisPanel,
  OperationsFeed,
  AIRecommendationsPanel,
} from '@/components/ai/insights'
import { Card, CardContent } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function AIInsightsPage() {
  const {
    loading,
    executiveMetrics,
    workflowHealth,
    leadIntel,
    agentPerf,
    humanReviewStats,
    policyIntel,
    legalInsights,
    paymentIntel,
    failureAnalysis,
    operationsFeed,
    recommendations,
  } = useAIInsights()

  const lastUpdated = useClientTimeString(30_000)

  return (
    <motion.div
      className='space-y-8 p-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className='flex flex-col gap-2 mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='font-display text-4xl font-bold tracking-tight text-brand-navy'>
                Executive AI Command Center
              </h1>
              <p className='text-lg text-brand-muted mt-2'>
                Real-time autonomous operations intelligence from across your platform
              </p>
            </div>
            <div className='flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200'>
              <div className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
              <span className='text-xs font-semibold text-emerald-700'>LIVE</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 1: Executive Metrics */}
      <motion.div variants={itemVariants}>
        <div className='space-y-4'>
          <h2 className='text-2xl font-bold text-brand-navy flex items-center gap-2'>
            <Icons.barChart className='h-6 w-6' />
            Executive Metrics
          </h2>
          <ExecutiveMetrics metrics={executiveMetrics} loading={loading} />
        </div>
      </motion.div>

      {/* Section 2: AI Workflow Health & Lead Intelligence */}
      <motion.div variants={itemVariants}>
        <div className='grid gap-4 grid-cols-1 lg:grid-cols-2'>
          <div>
            <h3 className='text-lg font-bold text-brand-navy mb-3 flex items-center gap-2'>
              <Icons.zap className='h-5 w-5' />
              Workflow Intelligence
            </h3>
            <WorkflowHealthPanel health={workflowHealth} loading={loading} />
          </div>
          <div>
            <h3 className='text-lg font-bold text-brand-navy mb-3 flex items-center gap-2'>
              <Icons.users className='h-5 w-5' />
              Lead Funnel
            </h3>
            <LeadIntelligencePanel intel={leadIntel} loading={loading} />
          </div>
        </div>
      </motion.div>

      {/* Section 3: Agent Performance & Human Reviews */}
      <motion.div variants={itemVariants}>
        <div className='space-y-4'>
          <h2 className='text-2xl font-bold text-brand-navy flex items-center gap-2'>
            <Icons.bot className='h-6 w-6' />
            Agent & Human Operations
          </h2>
          <div className='grid gap-4 grid-cols-1'>
            <AgentPerformancePanel perf={agentPerf} loading={loading} />
            <HumanReviewAnalytics stats={humanReviewStats} loading={loading} />
          </div>
        </div>
      </motion.div>

      {/* Section 4: Policy & Compliance Intelligence */}
      <motion.div variants={itemVariants}>
        <div className='space-y-4'>
          <h2 className='text-2xl font-bold text-brand-navy flex items-center gap-2'>
            <Icons.shield className='h-6 w-6' />
            Policy & Compliance
          </h2>
          <PolicyIntelligencePanel intel={policyIntel} loading={loading} />
        </div>
      </motion.div>

      {/* Section 5: Specialized Intelligence Panels */}
      <motion.div variants={itemVariants}>
        <div className='grid gap-4 grid-cols-1 lg:grid-cols-3'>
          {/* Legal Insights */}
          <div className='lg:col-span-1'>
            <h3 className='text-lg font-bold text-brand-navy mb-3 flex items-center gap-2'>
              <Icons.fileText className='h-5 w-5' />
              Legal Intelligence
            </h3>
            <LegalInsightsPanel insights={legalInsights} loading={loading} />
          </div>

          {/* Payment Intelligence */}
          <div className='lg:col-span-1'>
            <h3 className='text-lg font-bold text-brand-navy mb-3 flex items-center gap-2'>
              <Icons.barChart className='h-5 w-5' />
              Payment Ops
            </h3>
            <PaymentInsightsPanel intel={paymentIntel} loading={loading} />
          </div>

          {/* Failure Analysis */}
          <div className='lg:col-span-1'>
            <h3 className='text-lg font-bold text-brand-navy mb-3 flex items-center gap-2'>
              <Icons.alertTriangle className='h-5 w-5' />
              System Health
            </h3>
            <FailureAnalysisPanel analysis={failureAnalysis} loading={loading} />
          </div>
        </div>
      </motion.div>

      {/* Section 6: Real-Time Operations Feed & Recommendations */}
      <motion.div variants={itemVariants}>
        <div className='grid gap-4 grid-cols-1 lg:grid-cols-2'>
          <div>
            <h3 className='text-lg font-bold text-brand-navy mb-3 flex items-center gap-2'>
              <Icons.activity className='h-5 w-5' />
              Operations Feed
            </h3>
            <OperationsFeed items={operationsFeed} loading={loading} />
          </div>

          <div>
            <h3 className='text-lg font-bold text-brand-navy mb-3 flex items-center gap-2'>
              <Icons.lightbulb className='h-5 w-5' />
              AI Intelligence Layer
            </h3>
            <AIRecommendationsPanel recommendations={recommendations} loading={loading} />
          </div>
        </div>
      </motion.div>

      {/* Info Section */}
      <motion.div variants={itemVariants}>
        <Card className='bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'>
          <CardContent className='pt-6'>
            <div className='flex gap-4'>
              <Icons.info className='h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5' />
              <div className='text-sm text-blue-800'>
                <p className='font-semibold mb-2'>AI Operations Intelligence</p>
                <p className='mb-2'>
                  This executive command center aggregates real-time data from all autonomous systems:
                </p>
                <ul className='text-xs space-y-1 ml-4'>
                  <li>• <strong>CRM Operations:</strong> Lead pipeline, conversion funnels, deal flow</li>
                  <li>• <strong>AI Agents:</strong> Workflow execution, performance metrics, failure analysis</li>
                  <li>• <strong>Escalations:</strong> Human review queue, resolution times, categories</li>
                  <li>• <strong>Compliance:</strong> Policy violations, blocked actions, risk assessment</li>
                  <li>• <strong>Legal:</strong> Contract validation, OCR analysis, signature verification</li>
                  <li>• <strong>Payments:</strong> Revenue pipeline, collection status, conversion metrics</li>
                </ul>
                <p className='text-xs text-blue-600 mt-3' suppressHydrationWarning>
                  {lastUpdated
                    ? `Last updated: ${lastUpdated} • Auto-refreshing every 30s`
                    : 'Auto-refreshing every 30s'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

