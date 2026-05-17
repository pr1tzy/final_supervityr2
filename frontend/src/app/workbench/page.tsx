'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { WorkbenchReview } from '@/lib/supabase'
import { useWorkbenchReviews, useWorkbenchReviewMetrics } from '@/hooks/useWorkbenchReviews'
import {
  ReviewMetricsRow,
  ReviewQueueTable,
  ReviewDetailDrawer,
  ReviewFilters,
} from '@/components/workbench'

export default function WorkbenchPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'resolved'>('all')
  const [selectedReview, setSelectedReview] = useState<WorkbenchReview | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Fetch metrics
  const { metrics, loading: metricsLoading } = useWorkbenchReviewMetrics()

  // Fetch reviews based on filter
  const { reviews, loading: reviewsLoading, refetch } = useWorkbenchReviews(activeFilter)

  const handleRowClick = (review: WorkbenchReview) => {
    setSelectedReview(review)
    setDetailOpen(true)
  }

  const handleActionComplete = () => {
    refetch()
  }

  return (
    <main className='space-y-8 p-8'>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='flex flex-col gap-2'>
          <h1 className='font-display text-4xl font-bold tracking-tight text-brand-navy'>
            Human Review Center
          </h1>
          <p className='text-lg text-brand-muted'>
            Manage AI escalations, approve workflows, and handle manual interventions
          </p>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <ReviewMetricsRow
          pendingCount={metrics.pendingCount}
          approvedCount={metrics.approvedCount}
          rejectedCount={metrics.rejectedCount}
          avgResolutionTime={metrics.avgResolutionTime}
          loading={metricsLoading}
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ReviewFilters
          activeFilter={activeFilter}
          onFilterChange={(filter) => setActiveFilter(filter)}
        />
      </motion.div>

      {/* Review Queue Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <ReviewQueueTable
          reviews={reviews}
          loading={reviewsLoading}
          onRowClick={handleRowClick}
        />
      </motion.div>

      {/* Detail Drawer */}
      <ReviewDetailDrawer
        review={selectedReview}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onActionComplete={handleActionComplete}
      />
    </main>
  )
}
