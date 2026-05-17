import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safe USD display — handles null/undefined from Supabase. */
export function formatUsd(value: number | null | undefined): string {
  const n = typeof value === 'number' && !Number.isNaN(value) ? value : 0
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}
