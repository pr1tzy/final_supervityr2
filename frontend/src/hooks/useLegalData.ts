'use client'

import { useEffect, useState } from 'react'
import { supabase, Lead } from '@/lib/supabase'
import { formatSupabaseError } from '@/lib/supabase-errors'

export interface Contract {
  id: string
  lead_id: string
  company_name: string
  contact_name: string
  deal_size: number
  status: 'generated' | 'sent' | 'signed' | 'ocr_processing' | 'validation' | 'human_review' | 'approved' | 'payment_pending' | 'completed'
  ocr_status: 'not_started' | 'processing' | 'extracted' | 'failed'
  validation_status: 'not_started' | 'validated' | 'mismatches' | 'failed'
  created_at: string
  uploaded_at?: string
  ocr_completed_at?: string
}

export interface OCRExtractionResult {
  extracted_company: string
  extracted_contact: string
  extracted_deal_size: number | null
  extracted_next_steps: string | null
  signature_detected: boolean
  ocr_confidence: number
  raw_text: string
}

export interface ValidationResult {
  company_match: boolean
  contact_match: boolean
  deal_size_match: boolean
  signature_valid: boolean
  has_mismatches: boolean
  warnings: string[]
  mismatches: {
    field: string
    crm_value: string
    ocr_value: string
  }[]
}

export interface AIReasoning {
  ocr_confidence: number
  signature_detected: boolean
  company_match: boolean
  contact_match: boolean
  deal_size_match: boolean
  requires_human_review: boolean
  reasoning: string
}

// Simulate OCR extraction (will be replaced with real API calls)
export function simulateOCRExtraction(text: string): OCRExtractionResult {
  // Simulate confidence scoring
  const confidence = 0.75 + Math.random() * 0.23

  // Extract patterns from simulated PDF text
  const companyMatch = text.match(/Company:\s*(.+)/i)
  const contactMatch = text.match(/Contact:\s*(.+)/i)
  const amountMatch = text.match(/Amount:\s*\$?([\d,]+)/i)
  const signatureMatch = text.match(/Signature|signed/i)

  return {
    extracted_company: companyMatch?.[1]?.trim() || 'Unknown Corp',
    extracted_contact: contactMatch?.[1]?.trim() || 'John Doe',
    extracted_deal_size: amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null,
    extracted_next_steps: 'Implementation begins on Q2 2026. Support team onboarding required.',
    signature_detected: !!signatureMatch,
    ocr_confidence: Math.round(confidence * 100) / 100,
    raw_text: text,
  }
}

export function useLegalContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContracts = async () => {
    try {
      setLoading(true)

      // Fetch leads from CRM
      const { data: leadsData, error: leadsErr } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (leadsErr) throw leadsErr
      setLeads(leadsData || [])

      // Convert leads to contracts (simulating contract queue)
      const contractsFromLeads: Contract[] = (leadsData || []).map((lead, idx) => {
        const statuses: Contract['status'][] = [
          'generated',
          'sent',
          'signed',
          'ocr_processing',
          'validation',
          'human_review',
          'approved',
          'payment_pending',
          'completed',
        ]

        // Assign status based on lead_status
        let status: Contract['status'] = 'generated'
        if (lead.lead_status === 'qualified') status = 'sent'
        if (lead.lead_status === 'proposal_sent') status = 'signed'
        if (lead.lead_status === 'negotiation') status = 'ocr_processing'
        if (lead.lead_status === 'needs_review') status = 'human_review'
        if (lead.lead_status === 'closed_won') status = 'approved'

        return {
          id: `contract-${lead.id}`,
          lead_id: lead.id,
          company_name: lead.company_name,
          contact_name: lead.contact_name,
          deal_size: lead.estimated_deal_size || 0,
          status,
          ocr_status: status === 'signed' || status === 'ocr_processing' ? 'extracted' : 'not_started',
          validation_status: status === 'validation' || status === 'human_review' ? 'validated' : 'not_started',
          created_at: lead.created_at,
        }
      })

      setContracts(contractsFromLeads)
    } catch (err) {
      console.error('Failed to fetch contracts:', formatSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()

    // Poll every 30 seconds
    const interval = setInterval(fetchContracts, 30000)
    return () => clearInterval(interval)
  }, [])

  return { contracts, leads, loading, refetch: fetchContracts }
}

export function validateOCRAgainstCRM(
  crmData: Lead,
  ocrData: OCRExtractionResult
): ValidationResult {
  const warnings: string[] = []
  const mismatches: ValidationResult['mismatches'] = []

  // Company validation
  const companyMatch =
    crmData.company_name.toLowerCase() === ocrData.extracted_company.toLowerCase()
  if (!companyMatch) {
    warnings.push('Company name mismatch detected')
    mismatches.push({
      field: 'Company',
      crm_value: crmData.company_name,
      ocr_value: ocrData.extracted_company,
    })
  }

  // Contact validation
  const contactMatch =
    crmData.contact_name.toLowerCase() === ocrData.extracted_contact.toLowerCase()
  if (!contactMatch) {
    warnings.push('Contact name mismatch detected')
    mismatches.push({
      field: 'Contact',
      crm_value: crmData.contact_name,
      ocr_value: ocrData.extracted_contact,
    })
  }

  // Deal size validation
  const dealSizeMatch =
    crmData.estimated_deal_size && ocrData.extracted_deal_size
      ? Math.abs(crmData.estimated_deal_size - ocrData.extracted_deal_size) < 1000
      : false
  if (!dealSizeMatch && ocrData.extracted_deal_size) {
    warnings.push('Deal size mismatch detected')
    mismatches.push({
      field: 'Deal Size',
      crm_value: `$${crmData.estimated_deal_size?.toLocaleString() || '0'}`,
      ocr_value: `$${ocrData.extracted_deal_size?.toLocaleString() || '0'}`,
    })
  }

  const signatureValid = ocrData.signature_detected
  if (!signatureValid) {
    warnings.push('Signature not detected in document')
  }

  return {
    company_match: companyMatch,
    contact_match: contactMatch,
    deal_size_match: dealSizeMatch,
    signature_valid: signatureValid,
    has_mismatches: mismatches.length > 0,
    warnings,
    mismatches,
  }
}

export function generateAIReasoning(
  ocrData: OCRExtractionResult,
  validation: ValidationResult
): AIReasoning {
  const requiresReview =
    !validation.signature_valid ||
    validation.has_mismatches ||
    ocrData.ocr_confidence < 0.85

  let reasoning = ''
  if (!validation.signature_valid) {
    reasoning += 'Signature not detected in document. '
  }
  if (validation.has_mismatches) {
    reasoning += `${validation.mismatches.length} field mismatches found between CRM and OCR extraction. `
  }
  if (ocrData.ocr_confidence < 0.85) {
    reasoning += 'OCR confidence below threshold. '
  }
  if (!requiresReview) {
    reasoning = 'All validations passed. Contract ready for approval.'
  }

  return {
    ocr_confidence: ocrData.ocr_confidence,
    signature_detected: ocrData.signature_detected,
    company_match: validation.company_match,
    contact_match: validation.contact_match,
    deal_size_match: validation.deal_size_match,
    requires_human_review: requiresReview,
    reasoning,
  }
}

export async function createWorkbenchEscalation(
  contract_id: string,
  lead_id: string,
  validation: ValidationResult
) {
  try {
    const { error } = await supabase.from('workbench_reviews').insert([
      {
        lead_id,
        transcript_id: null,
        issue_type: 'contract_validation',
        issue_description: `Contract validation failed: ${validation.warnings.join(', ')}`,
        requested_by_agent: 'legal_ai_system',
        review_status: 'pending',
        human_response: null,
        reviewed_by: null,
        created_at: new Date().toISOString(),
        resolved_at: null,
      },
    ])

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Failed to create workbench escalation:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function createPolicyViolation(
  contract_id: string,
  lead_id: string,
  policy_id: string,
  violation_reason: string
) {
  try {
    const { error } = await supabase.from('policy_violations').insert([
      {
        lead_id,
        transcript_id: null,
        violated_policy_id: policy_id,
        violation_reason,
        blocked_action: 'contract_approval',
        created_at: new Date().toISOString(),
      },
    ])

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Failed to create policy violation:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
