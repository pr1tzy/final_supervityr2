'use client'

import { useEffect, useState } from 'react'
import { supabase, WorkbenchReview } from '@/lib/supabase'
import { formatSupabaseError } from '@/lib/supabase-errors'

interface WorkbenchMetrics {
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  avgResolutionTime: number // in minutes
}

export function useWorkbenchReviews(filter: 'all' | 'pending' | 'approved' | 'rejected' | 'resolved' = 'all') {
  const [reviews, setReviews] = useState<WorkbenchReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('workbench_reviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('review_status', filter)
      }

      const { data, error: err } = await query

      if (err) throw err
      setReviews(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()

    // Poll every 20 seconds for real-time feel
    const interval = setInterval(fetchReviews, 20000)
    return () => clearInterval(interval)
  }, [filter])

  return { reviews, loading, error, refetch: fetchReviews }
}

export function useWorkbenchReviewMetrics() {
  const [metrics, setMetrics] = useState<WorkbenchMetrics>({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    avgResolutionTime: 0,
  })
  const [loading, setLoading] = useState(true)

  const calculateMetrics = async () => {
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('workbench_reviews')
        .select('*')

      if (err) throw err

      const reviews = data || []

      const pending = reviews.filter(r => r.review_status === 'pending').length
      const approved = reviews.filter(r => r.review_status === 'approved').length
      const rejected = reviews.filter(r => r.review_status === 'rejected').length

      // Calculate average resolution time (in minutes)
      let totalTime = 0
      let resolvedCount = 0

      reviews.forEach(review => {
        if (review.resolved_at && review.created_at) {
          const createdTime = new Date(review.created_at).getTime()
          const resolvedTime = new Date(review.resolved_at).getTime()
          const diffMinutes = (resolvedTime - createdTime) / (1000 * 60)
          totalTime += diffMinutes
          resolvedCount++
        }
      })

      const avgResolutionTime = resolvedCount > 0 ? Math.round(totalTime / resolvedCount) : 0

      setMetrics({
        pendingCount: pending,
        approvedCount: approved,
        rejectedCount: rejected,
        avgResolutionTime,
      })
    } catch (err) {
      console.error('Failed to calculate metrics:', formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    calculateMetrics()

    // Poll every 20 seconds
    const interval = setInterval(calculateMetrics, 20000)
    return () => clearInterval(interval)
  }, [])

  return { metrics, loading }
}

export async function updateWorkbenchReview(
  reviewId: string,
  updates: {
    review_status?: string
    human_response?: string
    reviewed_by?: string
    resolved_at?: string | null
  }
) {
  try {
    const { error } = await supabase
      .from('workbench_reviews')
      .update(updates)
      .eq('id', reviewId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update review',
    }
  }
}
