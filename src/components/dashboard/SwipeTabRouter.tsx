'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SwipeTabRouterProps {
  tabs: readonly string[]
  activeTab: string
  basePath: string
}

/**
 * Invisible client component — attaches horizontal wheel + touch-swipe
 * handlers that navigate between URL-based tabs via router.push.
 * Mirrors the gesture logic in DashboardTabView but for ?tab= URL params.
 */
export function SwipeTabRouter({ tabs, activeTab, basePath }: SwipeTabRouterProps) {
  const router = useRouter()

  // Stable refs — updated every render so effects are never stale
  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs
  const basePathRef = useRef(basePath)
  basePathRef.current = basePath

  // ── Horizontal wheel / trackpad swipe ───────────────────────────────────
  useEffect(() => {
    let accumulated = 0
    let inCooldown = false
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    let cooldownTimer: ReturnType<typeof setTimeout> | null = null

    const onWheel = (e: WheelEvent) => {
      if (inCooldown) return

      // Don't hijack horizontal scrolling inside a scrollable container
      const hScrollEl = (e.target as Element)?.closest('[data-h-scroll]')
      if (hScrollEl && hScrollEl.scrollWidth > hScrollEl.clientWidth) return

      const absX = Math.abs(e.deltaX)
      const absY = Math.abs(e.deltaY)

      // Ignore predominantly vertical scrolls
      if (absY > absX * 1.2) return
      // Ignore noise
      if (absX < 3) return

      accumulated += e.deltaX

      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => { accumulated = 0 }, 200)

      const t = tabsRef.current
      const idx = t.indexOf(activeTabRef.current)
      const THRESHOLD = 80

      if (accumulated > THRESHOLD && idx < t.length - 1) {
        accumulated = 0
        inCooldown = true
        router.push(`${basePathRef.current}?tab=${t[idx + 1]}`)
        if (cooldownTimer) clearTimeout(cooldownTimer)
        cooldownTimer = setTimeout(() => { inCooldown = false }, 700)
      } else if (accumulated < -THRESHOLD && idx > 0) {
        accumulated = 0
        inCooldown = true
        router.push(`${basePathRef.current}?tab=${t[idx - 1]}`)
        if (cooldownTimer) clearTimeout(cooldownTimer)
        cooldownTimer = setTimeout(() => { inCooldown = false }, 700)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      if (resetTimer) clearTimeout(resetTimer)
      if (cooldownTimer) clearTimeout(cooldownTimer)
    }
  }, [router])

  // ── Touch swipe ─────────────────────────────────────────────────────────
  useEffect(() => {
    const drag = {
      active: false,
      startX: 0,
      startY: 0,
      startTime: 0,
      locked: false,
    }

    const onTouchStart = (e: TouchEvent) => {
      // Don't intercept touches that start inside a horizontal scroll container
      const hScrollEl = (e.target as Element)?.closest('[data-h-scroll]')
      if (hScrollEl && hScrollEl.scrollWidth > hScrollEl.clientWidth) {
        drag.active = false
        return
      }
      drag.active = true
      drag.startX = e.touches[0].clientX
      drag.startY = e.touches[0].clientY
      drag.startTime = Date.now()
      drag.locked = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!drag.active) return
      const deltaX = e.touches[0].clientX - drag.startX
      const deltaY = e.touches[0].clientY - drag.startY

      if (!drag.locked) {
        // Vertical gesture → release for browser scroll
        if (Math.abs(deltaY) > Math.abs(deltaX) * 0.85) { drag.active = false; return }
        if (Math.abs(deltaX) < 6) return
        drag.locked = true
      }

      // Prevent page scroll once locked into horizontal
      e.preventDefault()
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!drag.active || !drag.locked) { drag.active = false; return }
      drag.active = false

      const deltaX = e.changedTouches[0].clientX - drag.startX
      const elapsed = Math.max(1, Date.now() - drag.startTime)
      const velocity = Math.abs(deltaX) / elapsed

      const t = tabsRef.current
      const idx = t.indexOf(activeTabRef.current)
      const shouldNav = Math.abs(deltaX) > 55 || velocity > 0.45

      if (shouldNav && deltaX < 0 && idx < t.length - 1) {
        router.push(`${basePathRef.current}?tab=${t[idx + 1]}`)
      } else if (shouldNav && deltaX > 0 && idx > 0) {
        router.push(`${basePathRef.current}?tab=${t[idx - 1]}`)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [router])

  return null
}
