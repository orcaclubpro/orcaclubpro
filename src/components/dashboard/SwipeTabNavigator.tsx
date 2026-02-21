'use client'

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const ADMIN_TABS = ['home', 'clients', 'projects', 'tasks'] as const
const CLIENT_TABS = ['home', 'projects', 'invoices'] as const

type Tab = (typeof ADMIN_TABS)[number] | (typeof CLIENT_TABS)[number]

interface SwipeTabNavigatorProps {
  username: string
  role: string | null | undefined
}

function tabHref(username: string, tab: Tab): string {
  return tab === 'home' ? `/u/${username}` : `/u/${username}?tab=${tab}`
}

export function SwipeTabNavigator({ username, role }: SwipeTabNavigatorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only active on the main dashboard page, not detail sub-pages
    if (pathname !== `/u/${username}`) return

    const tabs: readonly Tab[] = role === 'client' ? CLIENT_TABS : ADMIN_TABS
    const rawTab = searchParams.get('tab') ?? 'home'
    const idx = Math.max(0, tabs.indexOf(rawTab as Tab))

    let startX = 0
    let startY = 0
    let startTime = 0

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startTime = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const deltaX = endX - startX
      const deltaY = endY - startY
      const elapsed = Date.now() - startTime

      // Must be a fast, clearly horizontal gesture
      if (elapsed > 500) return              // too slow — probably a scroll
      if (Math.abs(deltaX) < 80) return     // too short
      if (Math.abs(deltaX) < Math.abs(deltaY) * 1.8) return  // too diagonal

      if (deltaX < 0) {
        // Swipe left → next tab
        const next = tabs[idx + 1]
        if (next) router.replace(tabHref(username, next), { scroll: false })
      } else {
        // Swipe right → prev tab
        const prev = tabs[idx - 1]
        if (prev) router.replace(tabHref(username, prev), { scroll: false })
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pathname, searchParams, username, role, router])

  return null
}
