'use client'

import { useState, useEffect } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

interface CollapsibleSidebarProps {
  children: React.ReactNode
  /** Short label shown on the panel header and announced by the rail's toggle. */
  railLabel?: string
  /**
   * What the rail carries when the panel is shut — a monogram, a status dot,
   * whatever reads at 54px. Falls back to the label set vertically.
   */
  rail?: React.ReactNode
}

const STORAGE_KEY = 'orca:detail-sidebar-collapsed'

// Authored in px, not rem: the portal runs a 1.5 root scale, so a rem width
// here would come out half again too wide. See `.space-true-scale`.
const RAIL_W = 54
const PANEL_W = 316

/**
 * Detail sidebar for the client and project routes. Shut by default — the
 * record is the page, the panel is the aside — and reopened from the rail,
 * with the choice remembered in localStorage.
 *
 * No hover-to-expand: no accidental triggers, no width/opacity reflow race.
 */
export function CollapsibleSidebar({ children, railLabel = 'Details', rail }: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(true)
  // Gate the width transition until after the first client paint, so restoring
  // a saved "open" preference snaps into place instead of animating on load.
  const [mounted, setMounted] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '0') setCollapsed(false)
    } catch {
      /* localStorage unavailable — stay shut */
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
      className="space-true-scale hidden shrink-0 border-r border-[var(--space-border-hard)] lg:block"
      style={{
        width: collapsed ? RAIL_W : PANEL_W,
        transition: mounted && !reduce ? 'width 320ms cubic-bezier(0.22, 1, 0.36, 1)' : undefined,
      }}
    >
      {/* Sticky panel pins below the header while the aside spans the page. */}
      <div className="sticky top-[var(--space-header)] space-panel-h overflow-hidden">
        <div className="relative h-full">

          {/* ── Rail ─────────────────────────────────────────────────────── */}
          {/* The whole column is the target; anything inside it is inert, so a
              rail node can be as decorative as it likes without stealing the
              click that opens the panel. */}
          <div
            className={cn(
              'absolute inset-y-0 left-0 transition-opacity duration-200',
              collapsed ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            style={{ width: RAIL_W }}
            aria-hidden={collapsed ? undefined : true}
          >
            <button
              type="button"
              onClick={toggle}
              tabIndex={collapsed ? 0 : -1}
              aria-expanded={false}
              aria-label={`Open ${railLabel.toLowerCase()} panel`}
              className="group absolute inset-0 flex flex-col items-center gap-5 pb-6 pt-4 text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:bg-[var(--space-bg-card)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]"
            >
              <PanelLeftOpen className="size-[15px] shrink-0" aria-hidden="true" />
              {rail ?? (
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] [writing-mode:vertical-rl]">
                  {railLabel}
                </span>
              )}
            </button>
          </div>

          {/* ── Panel ────────────────────────────────────────────────────── */}
          {/* Mounted only while open, so the content plays its entrance every
              time — and fixed to PANEL_W so nothing reflows mid-slide. */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="panel"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 flex flex-col"
                style={{ width: PANEL_W }}
              >
                <header className="flex shrink-0 items-center gap-3 border-b border-[var(--space-border-hard)] py-3 pl-5 pr-3">
                  <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--space-text-tertiary)]">
                    {railLabel}
                  </span>
                  <button
                    type="button"
                    onClick={toggle}
                    aria-expanded
                    aria-label={`Close ${railLabel.toLowerCase()} panel`}
                    className="rounded-md p-1.5 text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]"
                  >
                    <PanelLeftClose className="size-[15px]" aria-hidden="true" />
                  </button>
                </header>

                <div className="scrollbar-none flex-1 overflow-y-auto">{children}</div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </aside>
  )
}
