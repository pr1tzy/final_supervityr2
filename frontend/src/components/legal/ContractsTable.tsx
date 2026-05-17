'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Contract } from '@/hooks/useLegalData'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ContractsTableProps {
  contracts: Contract[]
  loading?: boolean
  onContractSelect?: (contract: Contract) => void
}

function getStatusColor(status: Contract['status']): string {
  const colors: Record<Contract['status'], string> = {
    generated: 'bg-blue-100 text-blue-800',
    sent: 'bg-blue-100 text-blue-800',
    signed: 'bg-purple-100 text-purple-800',
    ocr_processing: 'bg-amber-100 text-amber-800',
    validation: 'bg-yellow-100 text-yellow-800',
    human_review: 'bg-orange-100 text-orange-800',
    approved: 'bg-emerald-100 text-emerald-800',
    payment_pending: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-gray-100 text-gray-800',
  }
  return colors[status]
}

function getOCRStatusIcon(status: Contract['ocr_status']): React.ReactNode {
  const icons: Record<Contract['ocr_status'], React.ReactNode> = {
    not_started: <Icons.clock className='h-4 w-4 text-gray-500' />,
    processing: <Icons.loader className='h-4 w-4 animate-spin text-amber-500' />,
    extracted: <Icons.check className='h-4 w-4 text-emerald-600' />,
    failed: <Icons.close className='h-4 w-4 text-red-600' />,
  }
  return icons[status]
}

function getValidationStatusIcon(status: Contract['validation_status']): React.ReactNode {
  const icons: Record<Contract['validation_status'], React.ReactNode> = {
    not_started: <Icons.clock className='h-4 w-4 text-gray-500' />,
    validated: <Icons.check className='h-4 w-4 text-emerald-600' />,
    mismatches: <Icons.alertTriangle className='h-4 w-4 text-red-600' />,
    failed: <Icons.close className='h-4 w-4 text-red-600' />,
  }
  return icons[status]
}

export function ContractsTable({
  contracts,
  loading = false,
  onContractSelect,
}: ContractsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='space-y-3'>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className='h-12 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <Icons.fileText className='h-12 w-12 text-gray-300 mb-3' />
            <h3 className='font-semibold text-brand-navy'>No contracts found</h3>
            <p className='text-sm text-brand-muted mt-1'>
              Start by uploading a signed contract to begin processing
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Company</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Contact</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Deal Size</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Status</th>
                <th className='px-4 py-3 text-center font-semibold text-gray-700'>OCR</th>
                <th className='px-4 py-3 text-center font-semibold text-gray-700'>Validation</th>
                <th className='px-4 py-3 text-left font-semibold text-gray-700'>Created</th>
                <th className='px-4 py-3 text-right font-semibold text-gray-700'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr
                  key={contract.id}
                  className={cn(
                    'border-b border-gray-100 hover:bg-gray-50 transition-colors',
                    contract.status === 'human_review' && 'bg-amber-50/50'
                  )}
                >
                  {/* Company */}
                  <td className='px-4 py-3'>
                    <p className='font-medium text-brand-navy'>{contract.company_name}</p>
                  </td>

                  {/* Contact */}
                  <td className='px-4 py-3'>
                    <p className='text-gray-700'>{contract.contact_name}</p>
                  </td>

                  {/* Deal Size */}
                  <td className='px-4 py-3'>
                    <p className='font-semibold text-brand-navy'>
                      ${contract.deal_size.toLocaleString()}
                    </p>
                  </td>

                  {/* Status */}
                  <td className='px-4 py-3'>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}
                    >
                      {contract.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* OCR Status */}
                  <td className='px-4 py-3 text-center'>
                    <div className='flex items-center justify-center'>
                      {getOCRStatusIcon(contract.ocr_status)}
                    </div>
                  </td>

                  {/* Validation Status */}
                  <td className='px-4 py-3 text-center'>
                    <div className='flex items-center justify-center'>
                      {getValidationStatusIcon(contract.validation_status)}
                    </div>
                  </td>

                  {/* Created */}
                  <td className='px-4 py-3'>
                    <p className='text-xs text-brand-muted'>
                      {formatDistanceToNow(new Date(contract.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className='px-4 py-3 text-right'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onContractSelect?.(contract)}
                    >
                      <Icons.eye className='h-3 w-3 mr-1' />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
