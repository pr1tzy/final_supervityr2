'use client'

import { useEffect, useState } from 'react'
import { supabase, AIPolicy } from '@/lib/supabase'

// Diagnostic function to test Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    const { data, error } = await supabase.from('ai_policies').select('count').limit(1)
    if (error) {
      console.error('Supabase connection error:', error)
      return { connected: false, error: error.message }
    }
    console.log('Supabase connection successful')
    return { connected: true }
  } catch (err) {
    console.error('Supabase test error:', err)
    return { connected: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export function usePolicies() {
  const [policies, setPolicies] = useState<AIPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('ai_policies')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setPolicies(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch policies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()

    // Poll every 20 seconds for real-time feel
    const interval = setInterval(fetchPolicies, 20000)
    return () => clearInterval(interval)
  }, [])

  return { policies, loading, error, refetch: fetchPolicies }
}

export async function createPolicy(
  policyName: string,
  policyDescription: string,
  active: boolean = true
) {
  try {
    console.log('Creating policy:', { policyName, policyDescription, active })

    // Test connection first
    const connTest = await testSupabaseConnection()
    if (!connTest.connected) {
      throw new Error(`Supabase connection failed: ${connTest.error}`)
    }

    const insertData = {
      policy_name: policyName,
      policy_description: policyDescription,
      active,
    }

    console.log('Inserting data:', insertData)

    const { data, error } = await supabase
      .from('ai_policies')
      .insert([insertData])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      throw new Error(`${error.message} (Code: ${error.code})`)
    }

    console.log('Policy created successfully:', data)
    return { success: true, data: data?.[0] }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create policy'
    console.error('Create policy error:', errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function updatePolicy(
  policyId: string,
  updates: {
    policy_name?: string
    policy_description?: string
    active?: boolean
  }
) {
  try {
    const { error } = await supabase
      .from('ai_policies')
      .update(updates)
      .eq('id', policyId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update policy',
    }
  }
}

export async function deletePolicy(policyId: string) {
  try {
    const { error } = await supabase
      .from('ai_policies')
      .delete()
      .eq('id', policyId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete policy',
    }
  }
}
