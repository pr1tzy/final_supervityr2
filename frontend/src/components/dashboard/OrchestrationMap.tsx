'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardMetrics, AgentStatus, AGENTS } from '@/hooks/useDashboardData'
import { cn } from '@/lib/utils'

interface OrchestrationMapProps {
  metrics: DashboardMetrics | null
  agents: AgentStatus[]
  loading?: boolean
  orchestrationActive: boolean
}

export function OrchestrationMap({ metrics, agents, loading = false, orchestrationActive }: OrchestrationMapProps) {
  const getAgentStatus = (agentName: keyof typeof AGENTS): AgentStatus | undefined =>
    agents.find((a) => a.agent === agentName)

  const johnStatus = getAgentStatus('john')
  const jackStatus = getAgentStatus('jack')
  const jimStatus = getAgentStatus('jim')
  const jennieStatus = getAgentStatus('jennie')
  const jasonStatus = getAgentStatus('jason')
  const humanStatus = getAgentStatus('human')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orchestration Map</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-96 w-full' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='border-2 border-blue-500/30 bg-gradient-to-br from-blue-50/50 to-cyan-50/30'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Icons.zap className='h-6 w-6 text-blue-600' />
            Autonomous Orchestration Map
          </CardTitle>
          {orchestrationActive && (
            <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 border border-blue-300'>
              <div className='h-2 w-2 rounded-full bg-blue-600 animate-pulse' />
              <span className='text-xs font-bold text-blue-700'>ORCHESTRATING</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {/* Lead Intake Stage */}
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <div className='w-24 px-4 py-3 rounded-lg bg-green-100 border-2 border-green-600 text-center'>
                <p className='text-xs font-bold text-green-800'>Lead</p>
                <p className='text-2xl font-bold text-green-700'>{metrics?.totalLeads ?? 0}</p>
              </div>
              <p className='text-xs text-gray-600 mt-2 text-center'>Intake</p>
            </div>

            {/* Arrow */}
            <div className='flex-1 flex justify-center'>
              <div className={cn('h-1 w-16 rounded-full', orchestrationActive ? 'bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse' : 'bg-gray-300')}>
                {' '}
              </div>
            </div>

            {/* John (Central Orchestrator) */}
            <div className='flex-1'>
              <div
                className={cn(
                  'w-32 px-4 py-4 rounded-lg border-2 text-center transition-all',
                  johnStatus?.operationalStatus === 'active'
                    ? 'bg-blue-100 border-blue-600 shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 border-gray-400'
                )}
              >
                <p className='text-xs font-bold text-blue-800'>John</p>
                <p className='text-sm font-bold text-blue-700 mt-1'>Orchestrator</p>
                <p className='text-xs text-gray-600 mt-2'>{johnStatus?.activeWorkflows ?? 0} active</p>
              </div>
            </div>
          </div>

          {/* Distribution to Agents */}
          <div className='grid grid-cols-3 gap-6'>
            {/* Jack - CRM */}
            <div className='flex flex-col items-center'>
              <div className={cn('h-1 w-1 rounded-full mb-3', orchestrationActive && 'bg-cyan-600 animate-pulse')} />
              <div
                className={cn(
                  'w-full px-3 py-3 rounded-lg border-2 text-center transition-all',
                  jackStatus?.operationalStatus === 'active'
                    ? 'bg-cyan-100 border-cyan-600 shadow-lg shadow-cyan-500/30'
                    : 'bg-gray-100 border-gray-400'
                )}
              >
                <p className='text-xs font-bold text-cyan-800'>Jack</p>
                <p className='text-[10px] text-cyan-700 font-semibold'>CRM Operator</p>
                <p className='text-xs text-gray-600 mt-2'>{jackStatus?.completedWorkflows ?? 0} ops</p>
              </div>
            </div>

            {/* Jim - Operations */}
            <div className='flex flex-col items-center'>
              <div className={cn('h-1 w-1 rounded-full mb-3', orchestrationActive && 'bg-purple-600 animate-pulse')} />
              <div
                className={cn(
                  'w-full px-3 py-3 rounded-lg border-2 text-center transition-all',
                  jimStatus?.operationalStatus === 'active'
                    ? 'bg-purple-100 border-purple-600 shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 border-gray-400'
                )}
              >
                <p className='text-xs font-bold text-purple-800'>Jim</p>
                <p className='text-[10px] text-purple-700 font-semibold'>Operations Mgr</p>
                <p className='text-xs text-gray-600 mt-2'>{jimStatus?.completedWorkflows ?? 0} ops</p>
              </div>
            </div>

            {/* Jennie - Legal */}
            <div className='flex flex-col items-center'>
              <div className={cn('h-1 w-1 rounded-full mb-3', orchestrationActive && 'bg-pink-600 animate-pulse')} />
              <div
                className={cn(
                  'w-full px-3 py-3 rounded-lg border-2 text-center transition-all',
                  jennieStatus?.operationalStatus === 'active'
                    ? 'bg-pink-100 border-pink-600 shadow-lg shadow-pink-500/30'
                    : 'bg-gray-100 border-gray-400'
                )}
              >
                <p className='text-xs font-bold text-pink-800'>Jennie</p>
                <p className='text-[10px] text-pink-700 font-semibold'>Legal Agent</p>
                <p className='text-xs text-gray-600 mt-2'>{jennieStatus?.completedWorkflows ?? 0} ops</p>
              </div>
            </div>
          </div>

          {/* Second Row Agents */}
          <div className='grid grid-cols-2 gap-6 mx-auto max-w-sm'>
            {/* Jason - Payments */}
            <div className='flex flex-col items-center'>
              <div className={cn('h-1 w-1 rounded-full mb-3', orchestrationActive && 'bg-green-600 animate-pulse')} />
              <div
                className={cn(
                  'w-full px-3 py-3 rounded-lg border-2 text-center transition-all',
                  jasonStatus?.operationalStatus === 'active'
                    ? 'bg-green-100 border-green-600 shadow-lg shadow-green-500/30'
                    : 'bg-gray-100 border-gray-400'
                )}
              >
                <p className='text-xs font-bold text-green-800'>Jason</p>
                <p className='text-[10px] text-green-700 font-semibold'>Payments Mgr</p>
                <p className='text-xs text-gray-600 mt-2'>{jasonStatus?.completedWorkflows ?? 0} ops</p>
              </div>
            </div>

            {/* Human Review */}
            <div className='flex flex-col items-center'>
              <div className={cn('h-1 w-1 rounded-full mb-3', orchestrationActive && 'bg-orange-600 animate-pulse')} />
              <div
                className={cn(
                  'w-full px-3 py-3 rounded-lg border-2 text-center transition-all',
                  humanStatus?.operationalStatus === 'active'
                    ? 'bg-orange-100 border-orange-600 shadow-lg shadow-orange-500/30'
                    : 'bg-gray-100 border-gray-400'
                )}
              >
                <p className='text-xs font-bold text-orange-800'>Human</p>
                <p className='text-[10px] text-orange-700 font-semibold'>Escalation Layer</p>
                <p className='text-xs text-gray-600 mt-2'>{humanStatus?.escalations ?? 0} reviews</p>
              </div>
            </div>
          </div>

          {/* Final Outcome */}
          <div className='flex items-center justify-end'>
            {/* Arrow */}
            <div className='flex-1 flex justify-center'>
              <div className={cn('h-1 w-16 rounded-full', orchestrationActive ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gray-300')} />
            </div>

            <div className='flex-1'>
              <div className='w-24 px-4 py-3 rounded-lg bg-emerald-100 border-2 border-emerald-600 text-center'>
                <p className='text-xs font-bold text-emerald-800'>Closed</p>
                <p className='text-2xl font-bold text-emerald-700'>
                  {metrics?.completedWorkflows ? Math.min(99, Math.round((metrics.completedWorkflows / Math.max(1, metrics.totalLeads)) * 100)) : 0}%
                </p>
              </div>
              <p className='text-xs text-gray-600 mt-2 text-center'>Won</p>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className='mt-8 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4 text-center text-xs'>
          <div>
            <p className='text-gray-600 mb-1'>Active Now</p>
            <p className='text-xl font-bold text-blue-600'>{metrics?.activeOrchestrations ?? 0}</p>
          </div>
          <div>
            <p className='text-gray-600 mb-1'>Success Rate</p>
            <p className='text-xl font-bold text-emerald-600'>{metrics?.autonomyRate ?? 0}%</p>
          </div>
          <div>
            <p className='text-gray-600 mb-1'>Failed</p>
            <p className='text-xl font-bold text-red-600'>{metrics?.failedWorkflows ?? 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
