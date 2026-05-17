import { supabase } from '@/lib/supabase'

/** Fetch a table without failing the whole dashboard when RLS/schema differs. */
export async function safeTable<T>(
  label: string,
  query: () => PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>
): Promise<T> {
  try {
    const { data, error } = await query()
    if (error) {
      if (error.code === 'PGRST205') return [] as T
      console.warn(`[supabase] ${label}:`, error.message)
      return [] as T
    }
    return (data ?? []) as T
  } catch (e) {
    console.warn(`[supabase] ${label}:`, e)
    return [] as T
  }
}

export { supabase }
