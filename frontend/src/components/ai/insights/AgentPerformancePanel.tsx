'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { AgentPerf } from '@/hooks/useAIInsights'
import { cn } from '@/lib/utils'

interface AgentPerformancePanelProps {
  perf: AgentPerf | null
  loading?: boolean
}

export function AgentPerformancePanel({ perf, loading = false }: AgentPerformancePanelProps) {
  return (
    <div className='grid gap-4 grid-cols-1 lg:grid-cols-2'>
      {/* Top Agents */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.users className='h-5 w-5 text-yellow-600' />
            Top Orchestrator Agents
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : perf?.topOrchestratorAgents && perf.topOrchestratorAgents.length > 0 ? (
            perf.topOrchestratorAgents.map((agent) => (
              <div key={agent.agent} className='p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='font-semibold text-gray-900 text-sm'>{agent.agent}</span>
                  <div className='flex items-center gap-2'>
                    <Icons.checkCircle className='h-4 w-4 text-emerald-600' />
                    <span className='text-sm font-bold text-emerald-700'>{agent.successRate}%</span>
                  </div>
                </div>
                <p className='text-xs text-gray-600'>{agent.completedWorkflows} completed workflows</p>
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-500'>No agent data</p>
          )}
        </CardContent>
      </Card>

      {/* Most Active Agents */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.zap className='h-5 w-5 text-blue-600' />
            Most Active Agents
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : perf?.mostActiveAgents && perf.mostActiveAgents.length > 0 ? (
            perf.mostActiveAgents.map((agent) => (
              <div key={agent.agent} className='p-2 rounded-lg bg-gray-50 flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-900'>{agent.agent}</span>
                <span className='text-sm font-bold text-blue-700'>{agent.runCount} runs</span>
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-500'>No activity data</p>
          )}
        </CardContent>
      </Card>

      {/* Failing Agents */}
      <Card className='lg:col-span-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Icons.alertTriangle className='h-5 w-5 text-red-600' />
            Agents With High Failure Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2].map((i) => (
                <Skeleton key={i} className='h-8 w-full' />
              ))}
            </div>
          ) : perf?.failingAgents && perf.failingAgents.length > 0 ? (
            <div className='space-y-2'>
              {perf.failingAgents.map((agent) => (
                <div key={agent.agent} className='p-3 rounded-lg bg-red-50 border border-red-100'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <p className='font-semibold text-gray-900'>{agent.agent}</p>
                      <p className='text-xs text-gray-600'>{agent.failureCount} failures</p>
                    </div>
                    <div className='text-right'>
                      <div className='inline-block px-2 py-1 rounded bg-red-100'>
                        <span className='text-xs font-bold text-red-700'>{agent.failureRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-gray-500'>No failing agents</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
