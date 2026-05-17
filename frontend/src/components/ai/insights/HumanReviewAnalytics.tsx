'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { HumanReviewStats } from '@/hooks/useAIInsights'

interface HumanReviewAnalyticsProps {
  stats: HumanReviewStats | null
  loading?: boolean
}

export function HumanReviewAnalytics({ stats, loading = false }: HumanReviewAnalyticsProps) {
  return (
    <div className='grid gap-4 grid-cols-1 lg:grid-cols-2'>
      {/* Overview Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.users className='h-5 w-5 text-blue-600' />
            Escalation Overview
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {loading ? (
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : (
            <>
              <div className='grid grid-cols-2 gap-3'>
                <div className='p-3 rounded-lg bg-amber-50 border border-amber-100'>
                  <p className='text-xs text-amber-600 font-semibold mb-1'>Pending</p>
                  <p className='text-2xl font-bold text-amber-700'>{stats?.pendingEscalations ?? 0}</p>
                </div>
                <div className='p-3 rounded-lg bg-emerald-50 border border-emerald-100'>
                  <p className='text-xs text-emerald-600 font-semibold mb-1'>Resolved</p>
                  <p className='text-2xl font-bold text-emerald-700'>{stats?.resolvedEscalations ?? 0}</p>
                </div>
              </div>

              <div className='border-t border-gray-100 pt-3'>
                <p className='text-xs text-gray-600 mb-2'>Avg Resolution Time</p>
                <p className='text-xl font-bold text-gray-900'>{stats?.avgResolutionTime ?? 0} min</p>
              </div>

              <div className='border-t border-gray-100 pt-3'>
                <p className='text-xs text-gray-600 mb-2'>AI vs Human Ratio</p>
                <p className='text-lg font-bold text-blue-700'>{stats?.aiToHumanRatio ?? 0}% escalations</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Escalation Categories */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.layers className='h-5 w-5 text-purple-600' />
            Top Escalation Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-8 w-full' />
              ))}
            </div>
          ) : stats?.topCategories ? (
            <div className='space-y-2'>
              {Object.entries(stats.topCategories)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => (
                  <div key={category} className='flex items-center justify-between p-2 rounded-lg bg-purple-50'>
                    <span className='text-sm text-gray-700 capitalize'>{category.replace(/_/g, ' ')}</span>
                    <div className='flex items-center gap-2'>
                      <div className='w-20 h-2 bg-gray-200 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-purple-500'
                          style={{
                            width: `${Math.min(100, (count / Math.max(...Object.values(stats.topCategories))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className='text-sm font-bold text-purple-700 w-6 text-right'>{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
