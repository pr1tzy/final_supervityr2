'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { LeadIntel } from '@/hooks/useAIInsights'
import { cn } from '@/lib/utils'

interface LeadIntelligencePanelProps {
  intel: LeadIntel | null
  loading?: boolean
}

export function LeadIntelligencePanel({ intel, loading = false }: LeadIntelligencePanelProps) {
  return (
    <div className='grid gap-4 grid-cols-1 lg:grid-cols-2'>
      {/* Hot Leads */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.zap className='h-5 w-5 text-orange-600' />
            Hottest Leads (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : intel?.hotLeads && intel.hotLeads.length > 0 ? (
            intel.hotLeads.map((lead) => (
              <div key={lead.id} className='p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-brand-navy truncate'>{lead.company_name}</p>
                    <p className='text-xs text-gray-600'>{lead.contact_name}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-bold text-orange-600'>{lead.lead_score}/100</p>
                    <p className='text-xs text-gray-500'>${(lead.estimated_deal_size / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-500'>No hot leads</p>
          )}
        </CardContent>
      </Card>

      {/* Lead Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.barChart className='h-5 w-5 text-blue-600' />
            Lead Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className='h-6 w-full' />
              ))}
            </div>
          ) : (
            <>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600'>Total Leads</span>
                <span className='font-bold text-brand-navy'>{intel?.totalLeads ?? 0}</span>
              </div>
              <div className='flex items-center justify-between border-t border-gray-100 pt-3'>
                <span className='text-sm text-gray-600'>Avg Deal Size</span>
                <span className='font-bold text-brand-navy'>${(intel?.avgDealSize ?? 0).toLocaleString()}</span>
              </div>
              <div className='flex items-center justify-between border-t border-gray-100 pt-3'>
                <span className='text-sm text-gray-600'>Revenue Pipeline</span>
                <span className='font-bold text-blue-700'>${((intel?.revenuePipeline ?? 0) / 1000).toFixed(0)}K</span>
              </div>
              <div className='flex items-center justify-between border-t border-gray-100 pt-3'>
                <span className='text-sm text-gray-600'>Closed Revenue</span>
                <span className='font-bold text-emerald-700'>${((intel?.closedRevenue ?? 0) / 1000).toFixed(0)}K</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stage Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.checkCircle className='h-5 w-5 text-purple-600' />
            Lead Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-8 w-full' />
              ))}
            </div>
          ) : intel?.stageDistribution ? (
            <div className='space-y-2'>
              {Object.entries(intel.stageDistribution).map(([stage, count]) => (
                <div key={stage} className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600 capitalize'>{stage.replace(/_/g, ' ')}</span>
                  <div className='flex items-center gap-2'>
                    <div className='w-24 h-2 bg-gray-200 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-purple-500'
                        style={{ width: `${Math.min(100, (count / (intel.totalLeads || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className='text-sm font-semibold text-gray-900 w-8 text-right'>{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Lead Sources */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.barChart className='h-5 w-5 text-cyan-600' />
            Top Lead Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-8 w-full' />
              ))}
            </div>
          ) : intel?.leadSourceIntel ? (
            <div className='space-y-2'>
              {Object.entries(intel.leadSourceIntel)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([source, count]) => (
                  <div key={source} className='flex items-center justify-between p-2 rounded-lg bg-gray-50'>
                    <span className='text-sm text-gray-700 capitalize'>{source || 'Direct'}</span>
                    <span className='font-semibold text-cyan-700'>{count}</span>
                  </div>
                ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
