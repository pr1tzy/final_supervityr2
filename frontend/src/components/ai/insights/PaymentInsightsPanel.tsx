'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { PaymentIntel } from '@/hooks/useAIInsights'

interface PaymentInsightsPanelProps {
  intel: PaymentIntel | null
  loading?: boolean
}

export function PaymentInsightsPanel({ intel, loading = false }: PaymentInsightsPanelProps) {
  return (
    <div className='grid gap-4 grid-cols-1 lg:grid-cols-2'>
      {/* Pipeline Value */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.barChart className='h-5 w-5 text-cyan-600' />
            Payment Pipeline
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
              <div className='p-3 rounded-lg bg-cyan-50 border border-cyan-100'>
                <p className='text-xs text-cyan-600 font-semibold mb-1'>Pipeline Value</p>
                <p className='text-2xl font-bold text-cyan-700'>${((intel?.pipelineValue ?? 0) / 1000).toFixed(0)}K</p>
              </div>

              <div className='p-3 rounded-lg bg-blue-50 border border-blue-100'>
                <p className='text-xs text-blue-600 font-semibold mb-1'>Closed Won Revenue</p>
                <p className='text-2xl font-bold text-blue-700'>${((intel?.closedWonRevenue ?? 0) / 1000).toFixed(0)}K</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Risks */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.alertTriangle className='h-5 w-5 text-red-600' />
            Payment Risks
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
                <p className='text-xs text-amber-600 font-semibold mb-1'>Awaiting Payment</p>
                <p className='text-2xl font-bold text-amber-700'>{intel?.contractsAwaitingPayment ?? 0}</p>
              </div>

              <div className='p-3 rounded-lg bg-red-50 border border-red-100'>
                <p className='text-xs text-red-600 font-semibold mb-1'>Overdue Payments</p>
                <p className='text-2xl font-bold text-red-700'>{intel?.overdueRisks ?? 0}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Conversion Metrics */}
      <Card className='lg:col-span-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.trendingUp className='h-5 w-5 text-emerald-600' />
            Revenue Conversion
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className='h-10 w-full' />
          ) : (
            <div className='space-y-4'>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-700'>Conversion Rate</span>
                  <span className='text-lg font-bold text-emerald-700'>{intel?.revenueConversion ?? 0}%</span>
                </div>
                <div className='w-full h-3 bg-gray-200 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-emerald-500'
                    style={{ width: `${Math.min(100, intel?.revenueConversion ?? 0)}%` }}
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3 pt-2'>
                <div className='p-2 rounded-lg bg-emerald-50'>
                  <p className='text-xs text-emerald-600 font-semibold'>Winning Rate</p>
                  <p className='text-lg font-bold text-emerald-700'>{intel?.revenueConversion ?? 0}%</p>
                </div>
                <div className='p-2 rounded-lg bg-gray-50'>
                  <p className='text-xs text-gray-600 font-semibold'>Open Deals</p>
                  <p className='text-lg font-bold text-gray-900'>{intel?.contractsAwaitingPayment ?? 0}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
