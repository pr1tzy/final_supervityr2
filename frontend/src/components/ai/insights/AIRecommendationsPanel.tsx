'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { AIRecommendation } from '@/hooks/useAIInsights'
import { cn } from '@/lib/utils'

interface AIRecommendationsPanelProps {
  recommendations: AIRecommendation[]
  loading?: boolean
}

const priorityColors: Record<AIRecommendation['priority'], { bg: string; border: string; text: string; icon: string }> = {
  low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-600' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' },
}

const priorityIcons: Record<AIRecommendation['priority'], React.ElementType> = {
  low: Icons.info,
  medium: Icons.alertCircle,
  high: Icons.alertTriangle,
  critical: Icons.alertCircle,
}

export function AIRecommendationsPanel({ recommendations, loading = false }: AIRecommendationsPanelProps) {
  const sortedRecs = [...recommendations].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.lightbulb className='h-5 w-5 text-yellow-600' />
          AI Intelligence Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='space-y-3'>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className='h-20 w-full' />
            ))}
          </div>
        ) : sortedRecs.length > 0 ? (
          <div className='space-y-3'>
            {sortedRecs.map((rec, idx) => {
              const colors = priorityColors[rec.priority]
              const PriorityIcon = priorityIcons[rec.priority]

              return (
                <div
                  key={idx}
                  className={cn(
                    'p-4 rounded-lg border transition-all duration-200 hover:shadow-md',
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className='flex items-start gap-3'>
                    {/* Icon */}
                    <PriorityIcon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', colors.icon)} />

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2 mb-1'>
                        <h4 className={cn('font-semibold text-sm', colors.text)}>
                          {rec.title}
                        </h4>
                        <span
                          className={cn(
                            'text-xs font-bold px-2 py-1 rounded whitespace-nowrap flex-shrink-0',
                            rec.priority === 'critical' && 'bg-red-200 text-red-800',
                            rec.priority === 'high' && 'bg-orange-200 text-orange-800',
                            rec.priority === 'medium' && 'bg-amber-200 text-amber-800',
                            rec.priority === 'low' && 'bg-blue-200 text-blue-800'
                          )}
                        >
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>

                      <p className='text-sm text-gray-700 mb-2'>
                        {rec.description}
                      </p>

                      <div className='flex items-center justify-between text-xs'>
                        <span className='text-gray-600'>
                          Metric: <span className='font-mono font-semibold'>{rec.metric}</span>
                        </span>
                        {rec.action && (
                          <button className={cn(
                            'px-2 py-1 rounded text-xs font-medium transition-colors',
                            rec.priority === 'critical' && 'bg-red-200 text-red-800 hover:bg-red-300',
                            rec.priority === 'high' && 'bg-orange-200 text-orange-800 hover:bg-orange-300',
                            rec.priority === 'medium' && 'bg-amber-200 text-amber-800 hover:bg-amber-300',
                            rec.priority === 'low' && 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                          )}>
                            {rec.action}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Icons.checkCircle className='h-12 w-12 text-emerald-300 mb-3' />
            <p className='text-sm text-gray-600'>All systems operating normally</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
