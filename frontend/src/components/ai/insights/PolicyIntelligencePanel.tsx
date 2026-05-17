'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { PolicyIntel } from '@/hooks/useAIInsights'
import { cn } from '@/lib/utils'

interface PolicyIntelligencePanelProps {
  intel: PolicyIntel | null
  loading?: boolean
}

export function PolicyIntelligencePanel({ intel, loading = false }: PolicyIntelligencePanelProps) {
  return (
    <div className='grid gap-4 grid-cols-1 lg:grid-cols-2'>
      {/* Most Triggered Policies */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.shield className='h-5 w-5 text-red-600' />
            Most Triggered Policies
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : intel?.mostTriggeredPolicies && intel.mostTriggeredPolicies.length > 0 ? (
            intel.mostTriggeredPolicies.map((policy) => (
              <div key={policy.policy_name} className='p-2 rounded-lg bg-red-50 border border-red-100'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-900'>{policy.policy_name}</span>
                  <span className='text-sm font-bold text-red-700'>{policy.violation_count}x</span>
                </div>
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-500'>No policy violations</p>
          )}
        </CardContent>
      </Card>

      {/* Violation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.alertTriangle className='h-5 w-5 text-orange-600' />
            Violation Summary
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
              <div className='p-3 rounded-lg bg-orange-50 border border-orange-100'>
                <p className='text-xs text-orange-600 font-semibold mb-1'>Total Violations</p>
                <p className='text-2xl font-bold text-orange-700'>{intel?.violationFrequency ?? 0}</p>
              </div>

              {intel?.highRiskWorkflows && intel.highRiskWorkflows.length > 0 && (
                <div className='p-3 rounded-lg bg-red-50 border border-red-100'>
                  <p className='text-xs text-red-600 font-semibold mb-2'>High-Risk Workflows</p>
                  <div className='flex flex-wrap gap-1'>
                    {intel.highRiskWorkflows.map((workflow) => (
                      <span
                        key={workflow}
                        className='inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded'
                      >
                        {workflow.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Blocked Actions */}
      <Card className='lg:col-span-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.close className='h-5 w-5 text-gray-600' />
            Blocked Actions by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-8 w-full' />
              ))}
            </div>
          ) : intel?.blockedActions ? (
            <div className='space-y-2'>
              {Object.entries(intel.blockedActions)
                .sort(([, a], [, b]) => b - a)
                .map(([action, count]) => (
                  <div key={action} className='flex items-center justify-between p-2 rounded-lg bg-gray-50'>
                    <span className='text-sm text-gray-700'>{action.replace(/_/g, ' ')}</span>
                    <div className='flex items-center gap-2'>
                      <div className='w-32 h-2 bg-gray-200 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-red-500'
                          style={{
                            width: `${Math.min(100, (count / Math.max(...Object.values(intel.blockedActions))) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className='text-sm font-bold text-gray-900 w-8 text-right'>{count}</span>
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
