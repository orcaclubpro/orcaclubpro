'use client'

import { useEffect, useRef } from 'react'

interface DetailTabSlideProps {
  children: React.ReactNode
  activeTab: string
  tabOrder: readonly string[]
  storageKey: string
  className?: string
}

/**
 * Wraps tab content on detail pages (project, client) and plays a
 * directional slide-in animation on mount. Uses sessionStorage to track
 * the previous tab so the direction (left/right) can be determined.
 *
 * Since Next.js re-renders the page (not the layout) on each ?tab= change,
 * this component remounts on every tab switch — which is exactly what we want.
 */
export function DetailTabSlide({
  children,
  activeTab,
  tabOrder,
  storageKey,
  className,
}: DetailTabSlideProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prev = sessionStorage.getItem(storageKey)
    const prevIdx = prev !== null ? tabOrder.indexOf(prev) : -1
    const currIdx = tabOrder.indexOf(activeTab)

    let animName: string
    if (prevIdx === -1 || prevIdx === currIdx) {
      animName = 'pageSlideUp'
    } else if (currIdx > prevIdx) {
      animName = 'tabContentEnterFromRight'
    } else {
      animName = 'tabContentEnterFromLeft'
    }

    el.style.animation = `${animName} 260ms cubic-bezier(0.36, 0.66, 0.04, 1) forwards`
    sessionStorage.setItem(storageKey, activeTab)
  }, []) // Intentionally empty — runs once per mount (once per navigation)

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}
