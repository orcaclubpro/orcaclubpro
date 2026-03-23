'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ClientTabNavProps {
  activeTab: string
  basePath?: string
  onTabChange?: (tab: string) => void
}

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'projects', label: 'Projects' },
  { key: 'orders', label: 'Orders' },
  { key: 'packages', label: 'Packages' },
  { key: 'accounts', label: 'Accounts' },
]

export function ClientTabNav({ activeTab, basePath, onTabChange }: ClientTabNavProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const activeEl = container.querySelector<HTMLElement>('[data-active="true"]')
    if (!activeEl) return
    setIndicatorStyle({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
      opacity: 1,
    })
    // Scroll active tab into view
    const scroll = scrollRef.current
    if (scroll) {
      const elCenter = activeEl.offsetLeft + activeEl.offsetWidth / 2
      scroll.scrollTo({ left: elCenter - scroll.clientWidth / 2, behavior: 'smooth' })
    }
  }, [activeTab])

  return (
    <div ref={scrollRef} className="overflow-x-auto scrollbar-none px-6 lg:px-10">
    <div ref={containerRef} className="relative flex items-center h-11 gap-1 min-w-max">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        const sharedClassName = cn(
          'px-4 h-full flex items-center text-sm font-medium transition-colors duration-150',
          isActive ? 'text-[var(--space-text-primary)]' : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)]'
        )

        if (onTabChange) {
          return (
            <button
              key={tab.key}
              type="button"
              data-active={isActive ? 'true' : undefined}
              className={sharedClassName}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          )
        }

        return (
          <Link
            key={tab.key}
            href={`${basePath}?tab=${tab.key}`}
            data-active={isActive ? 'true' : undefined}
            className={sharedClassName}
          >
            {tab.label}
          </Link>
        )
      })}
      {/* Sliding active indicator */}
      <div
        className="absolute bottom-0 h-0.5 bg-[var(--space-accent)] rounded-full pointer-events-none"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          opacity: indicatorStyle.opacity,
          transition: 'left 220ms cubic-bezier(0.22, 1, 0.36, 1), width 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease',
        }}
      />
    </div>
    </div>
  )
}
