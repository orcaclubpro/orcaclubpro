'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PanelLeftOpen, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

interface CollapsibleSidebarProps {
  children: React.ReactNode
  /** Short label shown on the panel header and announced by the rail's toggle. */
  railLabel?: string
  /**
   * What the rail carries — a monogram, a status dot, whatever reads at 54px.
   * Falls back to the label set vertically.
   */
  rail?: React.ReactNode
}

// Authored in px, not rem: the portal runs a 1.5 root scale, so a rem width
// here would come out half again too wide. See `.space-true-scale`.
const RAIL_W = 54
const PANEL_W = 316
// Parked far enough left that the drawer's own shadow clears the rail too.
const PARKED_X = -(PANEL_W + 64)

// Opening is instant — the rail is the leftmost thing on the page, so a pointer
// only ever reaches it on purpose. Closing waits a beat, so the diagonal run
// out of the drawer's controls and back in is forgiven.
const CLOSE_DELAY = 130

/**
 * Detail sidebar for the client and project routes.
 *
 * A drawer, not a column: the aside is always 54px and the panel slides out
 * *over* the page rather than widening the layout — hover can't shove the
 * content sideways because the content never moves. Point at the rail and it's
 * there; move away and it's gone. Nothing to open, nothing to close, nothing
 * remembered.
 *
 * It holds open while focus is inside, so keyboard users and anyone typing in
 * the panel's inline fields keep it. Coarse pointers have no hover to give, so
 * there the rail's tap opens it and a close button appears in the header.
 */
export function CollapsibleSidebar({ children, railLabel = 'Details', rail }: CollapsibleSidebarProps) {
  const [open, setOpen] = useState(false)
  const [canHover, setCanHover] = useState(true)
  const reduce = useReducedMotion()

  // Three independent reasons to be open. Refs, not state — they change on
  // every pointer event and only their combination is worth a render.
  const hovering = useRef(false)
  const focused = useRef(false)
  const tapped = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setCanHover(
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
        : true,
    )
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  /** Open on the spot; close on a delay, so a wobble across the edge is free. */
  const sync = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    if (hovering.current || focused.current || tapped.current) setOpen(true)
    else timer.current = setTimeout(() => setOpen(false), CLOSE_DELAY)
  }, [])

  const shut = useCallback(() => {
    hovering.current = false
    focused.current = false
    tapped.current = false
    if (timer.current) clearTimeout(timer.current)
    setOpen(false)
  }, [])

  return (
    <aside
      className="space-true-scale relative z-30 hidden shrink-0 border-r border-[var(--space-border-hard)] lg:block"
      style={{ width: RAIL_W }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'touch') return
        hovering.current = true
        sync()
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'touch') return
        hovering.current = false
        sync()
      }}
      onFocus={() => {
        focused.current = true
        sync()
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        focused.current = false
        sync()
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !open) return
        const railButton = e.currentTarget.querySelector('button')
        shut()
        railButton?.focus()
      }}
    >
      {/* Sticky drawer pins below the header while the aside spans the page.
          Overflow stays visible: the panel is wider than its own column and
          hangs over the content on purpose. */}
      <div className="sticky top-[var(--space-header)] space-panel-h">
        <div className="relative h-full">

          {/* ── Rail ─────────────────────────────────────────────────────── */}
          {/* Always here, never animated — the drawer simply covers it. The
              whole column is the target, so a rail node can be as decorative as
              it likes without stealing the hit area. */}
          <button
            type="button"
            onClick={() => {
              // A mouse never reaches this: by click time the drawer already
              // covers the rail. It's the tap target for touch and the focus
              // stop for the keyboard.
              tapped.current = !tapped.current
              sync()
            }}
            aria-expanded={open}
            aria-label={`${open ? 'Close' : 'Open'} ${railLabel.toLowerCase()} panel`}
            className="absolute inset-y-0 left-0 flex flex-col items-center gap-5 pb-6 pt-4 text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:bg-[var(--space-bg-card)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]"
            style={{ width: RAIL_W }}
          >
            <PanelLeftOpen className="size-[15px] shrink-0" aria-hidden="true" />
            {rail ?? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] [writing-mode:vertical-rl]">
                {railLabel}
              </span>
            )}
          </button>

          {/* ── Drawer ───────────────────────────────────────────────────── */}
          {/* Always mounted, parked off-canvas. Hover has to answer on the first
              frame, and unmounting would put a React mount, a layout pass and
              the content's entrance stagger between the pointer and the panel
              every time. `inert` keeps the parked drawer out of the tab order,
              the a11y tree and the hit test. */}
          <motion.div
            initial={false}
            animate={{ x: open ? 0 : PARKED_X }}
            transition={
              reduce ? { duration: 0 } : { type: 'spring', stiffness: 560, damping: 48, mass: 0.9 }
            }
            inert={!open}
            className="absolute inset-y-0 left-0 flex flex-col border-r border-[var(--space-border-hard)] bg-[var(--space-bg-base)] shadow-[10px_0_34px_-16px_rgba(0,0,0,0.32)]"
            style={{ width: PANEL_W }}
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-[var(--space-border-hard)] py-3 pl-5 pr-3">
              <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--space-text-tertiary)]">
                {railLabel}
              </span>
              {/* Moving away closes it everywhere else; only a touch pointer
                  needs a way back out. */}
              {!canHover && (
                <button
                  type="button"
                  onClick={shut}
                  aria-label={`Close ${railLabel.toLowerCase()} panel`}
                  className="rounded-md p-1.5 text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]"
                >
                  <X className="size-[15px]" aria-hidden="true" />
                </button>
              )}
            </header>

            <div className="scrollbar-none flex-1 overflow-y-auto">{children}</div>
          </motion.div>

        </div>
      </div>
    </aside>
  )
}
