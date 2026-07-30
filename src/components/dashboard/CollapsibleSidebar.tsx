'use client'

import { useState, useEffect } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSidebarProps {
  children: React.ReactNode
  /** Short label shown on the collapsed rail so users know what's tucked away. */
  railLabel?: string
}

const STORAGE_KEY = 'orca:detail-sidebar-collapsed'

/**
 * Persistent detail sidebar. Open by default and stays put — a single collapse
 * toggle (state remembered in localStorage) swaps it to a slim, labeled rail.
 * No hover-to-expand: no accidental triggers, no width/opacity reflow race.
 */
export function CollapsibleSidebar({ children, railLabel = 'Details' }: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  // Gate the width transition until after the first client paint so restoring a
  // saved "collapsed" preference snaps into place instead of animating on load.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setCollapsed(true)
    } catch {
      /* localStorage unavailable — default to open */
    }
    setMounted(true)
  }, [])

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })

  return (
    <aside
      className={cn(
        'hidden lg:block shrink-0 border-r border-[var(--space-border-hard)] bg-[var(--space-bg-card)]',
        mounted && 'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-12' : 'w-72 xl:w-80',
      )}
    >
      {/* Sticky panel pins below the header while the aside background spans the page. */}
      <div className="sticky top-[49px] h-[calc((100vh-64px)/1.3)] flex flex-col overflow-hidden">
        {collapsed ? (
          // ── Collapsed rail — click anywhere to expand, labeled for discoverability ──
          <button
            onClick={toggle}
            className="group flex h-full w-full flex-col items-center gap-4 pt-3 pb-5 text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] transition-colors"
            aria-label={`Expand ${railLabel.toLowerCase()} panel`}
          >
            <span className="p-1.5 rounded-md group-hover:bg-[var(--space-bg-card-hover)] transition-colors">
              <PanelLeftOpen className="size-4" />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] [writing-mode:vertical-rl] rotate-180">
              {railLabel}
            </span>
          </button>
        ) : (
          <>
            {/* Collapse toggle */}
            <div className="flex shrink-0 justify-end pr-3 pt-3">
              <button
                onClick={toggle}
                className="p-1.5 rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card-hover)] transition-colors"
                aria-label={`Collapse ${railLabel.toLowerCase()} panel`}
              >
                <PanelLeftClose className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </>
        )}
      </div>
    </aside>
  )
}
