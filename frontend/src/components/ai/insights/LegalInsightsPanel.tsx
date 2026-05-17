'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { LegalInsights } from '@/hooks/useAIInsights'

interface LegalInsightsPanelProps {
  insights: LegalInsights | null
  loading?: boolean
}

export function LegalInsightsPanel({ insights, loading = false }: LegalInsightsPanelProps) {
  return (
    <div className='grid gap-4 grid-cols-1 lg:grid-cols-2'>
      {/* Contract Validation */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.fileText className='h-5 w-5 text-purple-600' />
            Contract Validation Status
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2].map((i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : (
            <>
              <div className='p-3 rounded-lg bg-amber-50 border border-amber-100'>
                <p className='text-xs text-amber-600 font-semibold mb-1'>Awaiting Validation</p>
                <p className='text-2xl font-bold text-amber-700'>{insights?.contractsAwaitingValidation ?? 0}</p>
              </div>

              <div className='p-3 rounded-lg bg-red-50 border border-red-100'>
                <p className='text-xs text-red-600 font-semibold mb-1'>OCR Mismatches</p>
                <p className='text-2xl font-bold text-red-700'>{insights?.ocrMismatchCount ?? 0}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Signature Verification */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.checkCircle className='h-5 w-5 text-emerald-600' />
            Signature Verification
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2].map((i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : (
            <>
              {insights?.signatureVerificationStatus &&
                Object.entries(insights.signatureVerificationStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className={`p-3 rounded-lg ${status === 'verified' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}
                  >
                    <p className={`text-xs font-semibold mb-1 ${status === 'verified' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </p>
                    <p className={`text-2xl font-bold ${status === 'verified' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {count}
                    </p>
                  </div>
                ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Escalation Trend */}
      <Card className='lg:col-span-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.trendingUp className='h-5 w-5 text-blue-600' />
            Recent Escalations (7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className='h-10 w-full' />
          ) : (
            <div className='flex items-end gap-3'>
              <div className='flex-1'>
                <p className='text-sm text-gray-600 mb-2'>Contracts Escalated</p>
                <div className='flex items-end justify-center gap-1'>
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className='flex-1 rounded-t bg-blue-200'
                      style={{
                        height: `${Math.max(20, ((insights?.contractEscalationTrend ?? 0) / 7 / Math.max(1, (insights?.contractEscalationTrend ?? 1))) * 100)}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className='text-right'>
                <p className='text-2xl font-bold text-blue-700'>{insights?.contractEscalationTrend ?? 0}</p>
                <p className='text-xs text-gray-600'>total</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
