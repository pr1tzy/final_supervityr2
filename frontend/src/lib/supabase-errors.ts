/** PostgREST / Supabase errors often log as `{}` in console — extract a readable message. */
export function formatSupabaseError(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return String(err ?? 'Unknown error')
  }
  const e = err as { message?: string; details?: string; hint?: string; code?: string }
  const parts = [e.message, e.details, e.hint, e.code].filter(Boolean)
  return parts.length > 0 ? parts.join(' — ') : JSON.stringify(err)
}
