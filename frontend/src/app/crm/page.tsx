'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CRMHeader } from '@/components/crm/CRMHeader'
import { AIInsightsBar } from '@/components/crm/AIInsightsBar'
import { MetricsRow } from '@/components/crm/MetricsRow'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { LeadDetailDrawer } from '@/components/crm/LeadDetailDrawer'
import { useLeads, useMetrics, useInsights, useLead, useActivityLogs, useAgentRuns, usePolicyViolations } from '@/hooks/useCRMData'
import { Lead } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function CRMPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  // Fetch all leads
  const { leads, loading: leadsLoading, refetch: refetchLeads } = useLeads()

  // Fetch selected lead details
  const { lead: selectedLead } = useLead(selectedLeadId)

  // Fetch related data for selected lead
  const { logs: activityLogs, loading: logsLoading } = useActivityLogs(selectedLeadId)
  const { runs: agentRuns, loading: runsLoading } = useAgentRuns(selectedLeadId)
  const { violations: policyViolations, loading: violationsLoading } = usePolicyViolations(selectedLeadId)

  // Fetch metrics and insights
  const { metrics, loading: metricsLoading } = useMetrics()
  const { insights, loading: insightsLoading } = useInsights()

  // Handle lead selection
  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLeadId(lead.id)
  }, [])

  // Handle drawer close
  const handleDrawerClose = useCallback(() => {
    setSelectedLeadId(null)
  }, [])

  // Handle create lead
  const handleCreateLead = useCallback(() => {
    toast.success('Create Lead feature coming soon!')
  }, [])

  // Handle run analysis
  const handleRunAnalysis = useCallback(() => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Running AI analysis...',
        success: 'Analysis complete!',
        error: 'Analysis failed',
      }
    )
    refetchLeads()
  }, [refetchLeads])

  // Handle export
  const handleExport = useCallback(() => {
    toast.success('Export feature coming soon!')
  }, [])

  return (
    <main className='space-y-8 p-8'>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CRMHeader
          onCreateLead={handleCreateLead}
          onRunAnalysis={handleRunAnalysis}
          onExport={handleExport}
        />
      </motion.div>

      {/* AI Insights Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <AIInsightsBar insights={insights} loading={insightsLoading} />
      </motion.div>

      {/* Metrics Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <MetricsRow metrics={metrics} loading={metricsLoading} />
      </motion.div>

      {/* Kanban Board */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className='rounded-2xl border border-black/[0.06] bg-white/50 p-6 backdrop-blur-sm'>
          <h2 className='mb-6 font-display text-xl font-semibold text-brand-navy'>
            Leads Pipeline
          </h2>
          <KanbanBoard
            leads={leads}
            loading={leadsLoading}
            onLeadClick={handleLeadClick}
          />
        </div>
      </motion.div>

      {/* Lead Detail Drawer */}
      <AnimatePresence>
        {selectedLeadId && (
          <LeadDetailDrawer
            lead={selectedLead}
            open={!!selectedLeadId}
            onOpenChange={handleDrawerClose}
            activityLogs={activityLogs}
            agentRuns={agentRuns}
            policyViolations={policyViolations}
            loadingLogs={logsLoading}
            loadingRuns={runsLoading}
            loadingViolations={violationsLoading}
          />
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!leadsLoading && leads.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='flex h-64 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/30 backdrop-blur-sm'
        >
          <div className='text-center'>
            <p className='text-lg font-medium text-brand-navy'>No leads yet</p>
            <p className='mt-1 text-sm text-brand-muted'>Create your first lead to get started</p>
          </div>
        </motion.div>
      )}
    </main>
  )
}
