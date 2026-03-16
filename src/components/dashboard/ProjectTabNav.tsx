'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ProjectTabNavProps {
  activeTab: string
  basePath: string
}

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'credentials', label: 'Accounts' },
  { key: 'sprints', label: 'Sprints' },
]

export function ProjectTabNav({ activeTab, basePath }: ProjectTabNavProps) {
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
    const activeEl = container.querySelector<HTMLAnchorElement>('[data-active="true"]')
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
    <div ref={scrollRef} className="overflow-x-auto scrollbar-none">
    <div ref={containerRef} className="relative flex items-center h-11 gap-1 min-w-max">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`${basePath}?tab=${tab.key}`}
          data-active={activeTab === tab.key ? 'true' : undefined}
          className={cn(
            'px-4 h-full flex items-center text-sm font-medium transition-colors duration-150',
            activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
          )}
        >
          {tab.label}
        </Link>
      ))}
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
