'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { AIPolicy, PolicyViolation } from '@/lib/supabase'
import { usePolicies, updatePolicy, deletePolicy } from '@/hooks/usePolicies'
import { usePolicyViolations, usePolicyViolationStats } from '@/hooks/usePolicyViolations'
import {
  PolicyList,
  CreatePolicyModal,
  PolicyViolationsPanel,
  ViolationDetailDrawer,
} from '@/components/ai/policies'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Skeleton } from '@/components/ui/skeleton'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function AIPoliciesPage() {
  // State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedViolation, setSelectedViolation] = useState<PolicyViolation | null>(null)
  const [violationDetailOpen, setViolationDetailOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Data hooks
  const { policies, loading: policiesLoading, refetch: refetchPolicies } = usePolicies()
  const { violations } = usePolicyViolations(50)
  const { stats: violationStats } = usePolicyViolationStats()

  // Create policy map for looking up names
  const policyMap = policies.reduce(
    (acc, policy) => {
      acc[policy.id] = policy.policy_name
      return acc
    },
    {} as Record<string, string>
  )

  // Handle policy toggle
  const handlePolicyToggle = async (policyId: string) => {
    const policy = policies.find((p) => p.id === policyId)
    if (!policy) return

    try {
      setIsUpdating(policyId)
      const result = await updatePolicy(policyId, { active: !policy.active })
      if (result.success) {
        refetchPolicies()
      }
    } finally {
      setIsUpdating(null)
    }
  }

  // Handle policy delete
  const handlePolicyDelete = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return

    try {
      setIsDeleting(policyId)
      const result = await deletePolicy(policyId)
      if (result.success) {
        refetchPolicies()
      }
    } finally {
      setIsDeleting(null)
    }
  }

  // Handle violation click
  const handleViolationClick = (violation: PolicyViolation) => {
    setSelectedViolation(violation)
    setViolationDetailOpen(true)
  }

  return (
    <motion.div
      className='space-y-8 p-8'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className='flex flex-col gap-2 mb-6'>
          <h1 className='font-display text-4xl font-bold tracking-tight text-brand-navy'>
            AI Governance
          </h1>
          <p className='text-lg text-brand-muted'>
            Manage policies and monitor policy compliance across AI workflows
          </p>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <motion.div variants={itemVariants}>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {/* Active Policies */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-sm font-medium'>
                <span>Active Policies</span>
                <Icons.shield className='h-4 w-4 opacity-60' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {policiesLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-3xl font-bold text-emerald-700'>
                  {policies.filter((p) => p.active).length}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Policies */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-sm font-medium'>
                <span>Total Policies</span>
                <Icons.layers className='h-4 w-4 opacity-60' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {policiesLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-3xl font-bold text-brand-navy'>
                  {policies.length}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Violations */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-sm font-medium'>
                <span>Recent Violations</span>
                <Icons.alertTriangle className='h-4 w-4 opacity-60' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-red-700'>
                {violationStats.recentViolations}
              </div>
            </CardContent>
          </Card>

          {/* Unique Policies Violated */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-sm font-medium'>
                <span>Policies Violated</span>
                <Icons.flag className='h-4 w-4 opacity-60' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-orange-700'>
                {violationStats.uniquePoliciesViolated}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Create Policy Button */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className='gap-2'
        >
          <Icons.plus className='h-4 w-4' />
          Create Policy
        </Button>
      </motion.div>

      {/* Policies Section */}
      <motion.div variants={itemVariants} className='space-y-4'>
        <h2 className='text-2xl font-bold text-brand-navy'>Policies</h2>
        <PolicyList
          policies={policies}
          loading={policiesLoading}
          onPolicyView={() => {}} // Could open detail modal
          onPolicyToggle={handlePolicyToggle}
          onPolicyDelete={handlePolicyDelete}
        />
      </motion.div>

      {/* Violations Section */}
      <motion.div variants={itemVariants} className='space-y-4'>
        <h2 className='text-2xl font-bold text-brand-navy'>Policy Violations</h2>
        <div onClick={(e) => {
          // Detect if violation row was clicked
          const target = e.target as HTMLElement
          const violationEl = target.closest('[data-violation-id]')
          if (violationEl) {
            const violationId = violationEl.getAttribute('data-violation-id')
            const violation = violations.find((v) => v.id === violationId)
            if (violation) {
              handleViolationClick(violation)
            }
          }
        }}>
          {/* Custom Violations Panel with Click Handling */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Policy Violations</CardTitle>
            </CardHeader>
            <CardContent>
              {violations.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-8 text-center'>
                  <Icons.checkCircle className='h-12 w-12 text-emerald-600 mb-3' />
                  <h3 className='font-medium text-brand-navy'>No policy violations</h3>
                  <p className='text-sm text-brand-muted mt-1'>
                    All workflows are compliant with active policies
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {violations.map((violation) => (
                    <div
                      key={violation.id}
                      data-violation-id={violation.id}
                      className='rounded-lg border border-red-200 bg-red-50 p-3 hover:bg-red-100 transition-colors cursor-pointer'
                      onClick={() => handleViolationClick(violation)}
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-semibold text-red-800'>
                            Policy: {policyMap[violation.violated_policy_id] || 'Unknown'}
                          </p>
                          <p className='text-xs text-red-700 mt-1 line-clamp-2'>
                            {violation.violation_reason}
                          </p>
                          <div className='flex items-center gap-3 mt-2 text-xs text-red-600'>
                            {violation.lead_id && (
                              <span>
                                Lead: <code className='text-[11px]'>{violation.lead_id.substring(0, 8)}</code>
                              </span>
                            )}
                          </div>
                        </div>
                        <Icons.alertTriangle className='h-5 w-5 text-red-600 flex-shrink-0 mt-0.5' />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Create Policy Modal */}
      <CreatePolicyModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={refetchPolicies}
      />

      {/* Violation Detail Drawer */}
      {selectedViolation && (
        <ViolationDetailDrawer
          violation={selectedViolation}
          policyName={policyMap[selectedViolation.violated_policy_id]}
          open={violationDetailOpen}
          onOpenChange={setViolationDetailOpen}
        />
      )}
    </motion.div>
  )
}
