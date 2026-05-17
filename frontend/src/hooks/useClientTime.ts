'use client'

import { useEffect, useState } from 'react'

/** Fixed locale/options so server and client never disagree (still only render after mount). */
export function formatTimeEnUS(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

/**
 * Time string safe for hydration — null on server/first paint, then updates on client.
 * @param intervalMs Optional poll interval (e.g. 10000 for dashboard footer).
 */
export function useClientTimeString(intervalMs?: number): string | null {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => setTime(formatTimeEnUS(new Date()))
    tick()
    if (!intervalMs) return
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return time
}
