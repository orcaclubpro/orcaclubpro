'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/** Quiet enough to be free, frequent enough that a payment lands within half a minute. */
const DEFAULT_INTERVAL_MS = 20_000

/**
 * Routes that render orders: the home tab, the client's invoices, and the staff
 * clients list + client detail. Mounted from the portal layout, so everywhere else
 * (tasks, files, timelines) this component is inert — no polling, no timers.
 */
const ORDER_ROUTES = /^\/u\/[^/]+(\/(invoices|orders|clients)(\/.*)?)?\/?$/

/**
 * Keeps an order view current without a manual reload. Renders nothing.
 *
 * In-app mutations already call `router.refresh()` themselves. What this covers is
 * everything that changes an order *outside* this browser — a Stripe webhook marking
 * an invoice paid, an edit in the Payload admin, another staff member's action — where
 * no server action runs here and nothing tells the tab to look again.
 *
 * It polls `/api/orders/pulse` (one indexed query) and refreshes only when the
 * fingerprint moves, so the route's real loaders re-run on a change and never on a tick.
 * While the tab is hidden it stops entirely, and it checks immediately on the way back —
 * the common case being: pay in Stripe in another tab, come back, see it paid.
 */
export function LiveOrders({ intervalMs = DEFAULT_INTERVAL_MS }: { intervalMs?: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const watching = ORDER_ROUTES.test(pathname ?? '')
  /** Last fingerprint seen. null until the first read establishes a baseline. */
  const pulse = useRef<string | null>(null)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!watching) return
    let cancelled = false

    async function check() {
      if (cancelled || inFlight.current || document.visibilityState !== 'visible') return
      inFlight.current = true
      try {
        const res = await fetch('/api/orders/pulse', { cache: 'no-store' })
        if (!res.ok) return
        const { pulse: next } = (await res.json()) as { pulse?: string }
        if (cancelled || typeof next !== 'string') return
        // The first read only establishes the baseline — never refresh on mount.
        if (pulse.current !== null && pulse.current !== next) router.refresh()
        pulse.current = next
      } catch {
        // Offline, or a blip mid-deploy. The next tick tries again.
      } finally {
        inFlight.current = false
      }
    }

    void check()
    const timer = setInterval(check, intervalMs)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)

    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [intervalMs, router, watching])

  return null
}
