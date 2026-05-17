'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { AgentStatus } from '@/hooks/useDashboardData'
import { AgentCard } from './AgentCard'
import { Skeleton } from '@/components/ui/skeleton'

interface AgentStatusBoardProps {
  agents: AgentStatus[]
  loading?: boolean
}

export function AgentStatusBoard({ agents, loading = false }: AgentStatusBoardProps) {
  return (
    <Card className='border-2 border-brand-navy/10 bg-gradient-to-br from-white to-blue-50/30'>
      <div className='p-6 space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-xl font-bold text-brand-navy flex items-center gap-2'>
            <Icons.users className='h-6 w-6' />
            Autonomous Agent Network
          </h3>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
            <span className='text-xs font-semibold text-emerald-700'>LIVE</span>
          </div>
        </div>

        {loading ? (
          <div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className='h-48 w-full rounded-lg' />
            ))}
          </div>
        ) : (
          <div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
            {agents.map((agent) => (
              <AgentCard key={agent.agent} status={agent} />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className='mt-6 pt-4 border-t border-gray-200'>
          <p className='text-xs font-semibold text-gray-700 mb-3'>Agent Roles:</p>
          <div className='text-xs text-gray-600 space-y-1'>
            <p>
              <strong>John:</strong> Central orchestration engine routing all workflows
            </p>
            <p>
              <strong>Jack:</strong> CRM intelligence - lead enrichment and customer tracking
            </p>
            <p>
              <strong>Jim:</strong> Operations manager - meeting scheduling and coordination
            </p>
            <p>
              <strong>Jennie:</strong> Legal automation - contracts and OCR verification
            </p>
            <p>
              <strong>Jason:</strong> Payment operations - invoices and revenue tracking
            </p>
            <p>
              <strong>Human Review:</strong> Escalation handler for critical decisions
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
