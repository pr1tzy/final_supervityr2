'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { FailureAnalysis } from '@/hooks/useAIInsights'

interface FailureAnalysisPanelProps {
  analysis: FailureAnalysis | null
  loading?: boolean
}

export function FailureAnalysisPanel({ analysis, loading = false }: FailureAnalysisPanelProps) {
  return (
    <Card className='border-red-200 bg-red-50'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.close className='h-5 w-5 text-red-600' />
          AI Failure Analysis
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
            {/* Top Failure Reasons */}
            <div>
              <h4 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                <Icons.alertCircle className='h-4 w-4 text-red-600' />
                Top Failure Reasons
              </h4>
              {analysis?.topFailureReasons && analysis.topFailureReasons.length > 0 ? (
                <div className='space-y-2'>
                  {analysis.topFailureReasons.map((reason) => (
                    <div key={reason.reason} className='p-3 rounded-lg bg-white border border-red-100'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-medium text-gray-900 text-sm'>{reason.reason}</span>
                        <span className='text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded'>
                          {reason.count} failures
                        </span>
                      </div>
                      <div className='w-full h-1.5 bg-gray-200 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-red-500'
                          style={{
                            width: `${Math.min(100, (reason.count / Math.max(...analysis.topFailureReasons.map((r) => r.count))) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-gray-600'>No failures recorded</p>
              )}
            </div>

            {/* Failure Categories */}
            {analysis?.failureCategories && Object.keys(analysis.failureCategories).length > 0 && (
              <div className='border-t border-red-200 pt-4'>
                <h4 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                  <Icons.layers className='h-4 w-4 text-red-600' />
                  Failures by Workflow Category
                </h4>
                <div className='grid grid-cols-2 gap-2'>
                  {Object.entries(analysis.failureCategories)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4)
                    .map(([category, count]) => (
                      <div key={category} className='p-2 rounded-lg bg-white border border-red-100'>
                        <p className='text-xs font-medium text-gray-600 capitalize'>{category}</p>
                        <p className='text-lg font-bold text-red-700'>{count}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* System Bottlenecks */}
            {analysis?.systemBottlenecks && analysis.systemBottlenecks.length > 0 && (
              <div className='border-t border-red-200 pt-4'>
                <h4 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                  <Icons.zap className='h-4 w-4 text-orange-600' />
                  System Bottlenecks
                </h4>
                <div className='space-y-2'>
                  {analysis.systemBottlenecks.map((bottleneck) => (
                    <div
                      key={bottleneck}
                      className='p-3 rounded-lg bg-white border-l-4 border-orange-500 flex items-center justify-between'
                    >
                      <span className='text-sm font-medium text-gray-900'>{bottleneck}</span>
                      <Icons.alertTriangle className='h-4 w-4 text-orange-600' />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
