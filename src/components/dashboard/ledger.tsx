'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { RangeCalendar } from '@/components/dashboard/RangeCalendar'
import { PERIOD_IDS, PERIOD_LABEL, type PeriodId, type CustomRange } from '@/lib/dashboard/period'
import { toneColor, type StatusTone } from '@/lib/dashboard/status'
import { cn } from '@/lib/utils'

// ─── Ledger primitives ───────────────────────────────────────────────────────
// The shared vocabulary of the portal's "ledger" pages — the staff home
// (`_views/AdminHomeView`) and the client record (`clients/[client]`). Both read
// like the studio's books opened to a page: a standing band of figures that
// never leaves the screen, then one section of workings at a time.
//
// Two rules everything here holds to:
//   1. Every colour is a --space-* token or a status-ramp tone. No raw hex, no
//      Tailwind palette classes — `sonar` (warm paper) is the default theme, so
//      a hardcoded `text-white` or `amber-400` is a live bug, not a nit.
//   2. Type is authored in real px inside .space-true-scale, not in rem against
//      the portal's 1.5 root scale.
//
// These lived inside AdminHomeView until the client record needed the same
// shapes. Copying them would have meant two ledgers drifting apart, so they
// moved here whole — the staff home imports them and renders exactly as before.

// ─── Count-up ─────────────────────────────────────────────────────────────────
// The one orchestrated moment on a ledger page: the standing tallies itself on
// arrival, and re-tallies whenever its inputs change. State starts at the final
// value so server-rendered HTML is already correct; a layout effect resets to
// zero before the browser paints, so nobody sees the final figure flash first.

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(target)
  const reduce = useReducedMotion()

  useIsoLayoutEffect(() => {
    if (reduce || target === 0) {
      setValue(target)
      return
    }
    setValue(0)
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // ease-out cubic — fast, then settles
      setValue(target * eased)
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, reduce])

  return value
}

// ─── Standing figure ──────────────────────────────────────────────────────────

export interface FigureSpec<T extends string = string> {
  /** Doubles as the React key and the section this figure opens. */
  key: T
  value: number
  format: (n: number) => string
  label: string
  note?: string | null
}

/**
 * Dividers sit between figures, so which edges get a rule depends on where the
 * grid wraps: two per row on phones, four across from `md` up.
 */
export function figureEdges(i: number): string {
  return cn(
    'border-[var(--space-divider)]',
    i % 2 === 0 ? 'border-l-0 pl-0' : 'border-l pl-5',
    i >= 2 ? 'border-t' : '',
    i === 0 ? 'md:border-l-0 md:pl-0' : 'md:border-l md:pl-5',
    'md:border-t-0',
  )
}

export function Figure({
  value, format, label, note, active, onSelect, className,
}: Omit<FigureSpec, 'key'> & {
  active: boolean
  onSelect: () => void
  className?: string
}) {
  const shown = useCountUp(value)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'py-4 pr-5 text-left transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]',
        active ? 'bg-[var(--space-bg-card)]' : 'hover:bg-[var(--space-bg-card)]',
        className,
      )}
    >
      <span
        className="block font-semibold tabular-nums leading-none tracking-[-0.02em] text-[var(--space-text-primary)]"
        style={{ fontSize: 'clamp(30px, 3.6vw, 46px)' }}
      >
        {format(Math.round(shown))}
      </span>
      <span className={cn(
        'mt-3 block text-[13px]',
        active ? 'text-[var(--space-text-primary)]' : 'text-[var(--space-text-tertiary)]',
      )}>
        {label}
      </span>
      {note && <span className="mt-1 block text-[12px] text-[var(--space-text-tertiary)]">{note}</span>}
    </button>
  )
}

// ─── Shared section furniture ─────────────────────────────────────────────────

export function SectionTitle({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-[var(--space-border-hard)] pb-3">
      <h2 className="text-[15px] font-semibold text-[var(--space-text-primary)]">{title}</h2>
      <div className="ml-auto text-[13px] text-[var(--space-text-tertiary)]">{aside}</div>
    </div>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-[14px] text-[var(--space-text-tertiary)]">{children}</p>
}

/** Shared left rule — the row's status lives here, so no dots or pills are needed. */
export function ToneRule({ tone }: { tone: StatusTone }) {
  return (
    <span
      aria-hidden="true"
      className="absolute left-0 top-0 h-full w-[2px] opacity-40 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      style={{ background: toneColor(tone) }}
    />
  )
}

/** A labelled hairline bar — the one chart primitive a ledger page uses. */
export function Meter({ pct, tone }: { pct: number; tone: StatusTone }) {
  return (
    <span aria-hidden="true" className="mt-3 block h-[2px] w-full bg-[var(--space-divider)]">
      <span
        className="block h-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: toneColor(tone) }}
      />
    </span>
  )
}

// ─── Section nav ──────────────────────────────────────────────────────────────
// A panel of section entries — a scrolling row of pills on phones, a column on
// the right from `lg` up. The active entry is a solid chip that slides between
// rows, which is the only thing on a ledger page that moves in response to a
// click.

export interface LedgerSection<T extends string> {
  id: T
  label: string
  icon: LucideIcon
}

export function SectionNav<T extends string>({
  sections, value, onChange, counts, navRef,
  layoutId = 'section-chip',
  ariaLabel = 'Page sections',
}: {
  sections: readonly LedgerSection<T>[]
  value: T
  onChange: (id: T) => void
  counts?: Partial<Record<T, number>>
  /** Exposed so `useSectionCycle` can move focus onto the entry it just opened. */
  navRef?: React.RefObject<HTMLElement | null>
  /**
   * Scopes the sliding chip's shared-layout animation. Two navs mounted at once
   * with the same id would animate the chip *between* them.
   */
  layoutId?: string
  ariaLabel?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const ownRef = useRef<HTMLElement>(null)
  const nav = navRef ?? ownRef
  const reduce = useReducedMotion()

  // On phones the panel is a scrolling row, so the chosen section can sit past
  // the right edge with nothing to say it is there. Nudge it into view — by
  // scrollLeft rather than scrollIntoView, which would also move the page.
  useEffect(() => {
    const el = nav.current
    const button = refs.current[sections.findIndex(s => s.id === value)]
    if (!el || !button || el.scrollWidth <= el.clientWidth) return

    const behavior = reduce ? 'auto' : 'smooth'
    const left = button.offsetLeft
    const right = left + button.offsetWidth
    if (left < el.scrollLeft) el.scrollTo({ left: left - 12, behavior })
    else if (right > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: right - el.clientWidth + 12, behavior })
    }
  }, [value, reduce, sections, nav])

  const onKeyDown = useCallback((e: React.KeyboardEvent, i: number) => {
    const last = sections.length - 1
    let next = i
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = i === last ? 0 : i + 1
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = i === 0 ? last : i - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    onChange(sections[next].id)
    refs.current[next]?.focus()
  }, [onChange, sections])

  return (
    <nav
      ref={nav as React.RefObject<HTMLElement>}
      aria-label={ariaLabel}
      className="scrollbar-none flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-[var(--space-border-hard)] p-1.5 lg:sticky lg:w-[212px] lg:flex-col lg:overflow-visible"
      style={{ top: 'calc(var(--space-header) + 20px)', alignSelf: 'flex-start' }}
    >
      {sections.map(({ id, label, icon: Icon }, i) => {
        const active = value === id
        const count = counts?.[id]
        return (
          <button
            key={id}
            ref={el => { refs.current[i] = el }}
            type="button"
            onClick={() => onChange(id)}
            onKeyDown={e => onKeyDown(e, i)}
            aria-current={active ? 'true' : undefined}
            tabIndex={active ? 0 : -1}
            className={cn(
              'relative shrink-0 rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors duration-150 lg:w-full',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]',
              !active && 'text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)]',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                className="absolute inset-0 rounded-lg"
                style={{ background: 'var(--space-text-primary)' }}
                transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              />
            )}
            <span
              className="relative z-10 flex items-center gap-2.5 whitespace-nowrap"
              style={active ? { color: 'var(--space-bg-base)' } : undefined}
            >
              <Icon className="size-4 shrink-0 opacity-70" aria-hidden="true" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={cn('ml-2 text-[13px] tabular-nums lg:ml-auto', !active && 'text-[var(--space-text-tertiary)]')}>
                  {count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Tab-key section cycling ──────────────────────────────────────────────────
// Tab walks the ledger's sections; Shift+Tab walks them backwards. Both wrap.
//
// This deliberately takes Tab away from the browser's focus-order duty on the
// page that opts in, so it is guarded rather than absolute. It stands down when
// taking the key would break something the user is in the middle of:
//
//   • a text field, textarea, select or contenteditable has focus — Tab there
//     is either typing or moving between fields
//   • a dialog is open anywhere in the document — every modal in the portal is
//     a Radix `Dialog` (portalled, `role="dialog"`) or hand-rolled with the
//     same attributes, so one query catches all of them
//   • a modifier is held, or an IME composition is running
//   • focus sits inside a subtree marked `data-tab-cycle="off"` — the escape
//     hatch for any future region that needs ordinary Tab behaviour
//
// After cycling, focus lands on the nav entry that just opened, so the ring
// tracks the change and screen readers announce it. `preventScroll` keeps that
// from yanking the page — the nav is sticky and already on screen.

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function takesTabItself(node: EventTarget | null): boolean {
  if (!(node instanceof HTMLElement)) return false
  if (TYPING_TAGS.has(node.tagName)) return true
  if (node.isContentEditable) return true
  return Boolean(node.closest('[contenteditable="true"],[data-tab-cycle="off"]'))
}

export function useSectionCycle<T extends string>(
  sections: readonly T[],
  value: T,
  onChange: (id: T) => void,
  navRef: React.RefObject<HTMLElement | null>,
) {
  // Set when a cycle fires, read by the effect below once React has committed
  // the new active entry — the button to focus does not exist until then.
  const pendingFocus = useRef(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return
      if (e.isComposing) return
      if (takesTabItself(e.target) || takesTabItself(document.activeElement)) return
      if (document.querySelector('[role="dialog"],[aria-modal="true"]')) return

      const i = sections.indexOf(value)
      if (i === -1) return

      e.preventDefault()
      const last = sections.length - 1
      const next = e.shiftKey ? (i === 0 ? last : i - 1) : (i === last ? 0 : i + 1)
      pendingFocus.current = true
      onChange(sections[next])
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sections, value, onChange])

  useEffect(() => {
    if (!pendingFocus.current) return
    pendingFocus.current = false
    navRef.current
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.focus({ preventScroll: true })
  }, [value, navRef])
}

// ─── Collapsing the standing band ─────────────────────────────────────────────
// The masthead and the figures are the page's title card: worth the room on
// arrival, wasted room once you are working in a section. This shuts them on
// the way down and opens them again at the top.
//
// The thresholds are deliberately asymmetric. A single trip point would sit
// exactly where shutting the band moves the page across it, and the band would
// flap open and shut on every frame; opening only near the very top also means
// the band never reappears *under* you mid-page, pushing the content you were
// reading out from under your eye.
//
// It stays open on pages too short to absorb the change: shutting the band
// there shortens the document past the current scroll position, the browser
// clamps back to the top, and you get one pointless open/shut. Note the room
// check only gates *entering* the shut state — re-checking it while shut would
// measure the already-shortened document and reintroduce the flapping.

export function useScrollCollapse(
  /** The band being collapsed. Measured to decide whether the page can spare it. */
  ref: React.RefObject<HTMLElement | null>,
  { collapseAt = 150, expandAt = 24 }: { collapseAt?: number; expandAt?: number } = {},
): boolean {
  const [collapsed, setCollapsed] = useState(false)
  /** The band's open height, remembered while it is shut. */
  const bandHeight = useRef(0)

  useEffect(() => {
    let frame = 0

    const read = () => {
      frame = 0
      const el = ref.current
      if (el && el.offsetHeight > 0) bandHeight.current = el.offsetHeight

      const y = window.scrollY
      const room = document.documentElement.scrollHeight - window.innerHeight

      setCollapsed(was =>
        was
          ? y > expandAt
          : y > collapseAt && room > bandHeight.current + collapseAt,
      )
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [ref, collapseAt, expandAt])

  return collapsed
}

// ─── Period control ───────────────────────────────────────────────────────────

export function PeriodControl({
  value, onChange, custom, onCustomChange, rangeLabel,
}: {
  value: PeriodId
  onChange: (id: PeriodId) => void
  custom: CustomRange
  onCustomChange: (r: CustomRange) => void
  /** The concrete days the chosen period covers, spelled out. */
  rangeLabel: string
}) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const reduce = useReducedMotion()

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    leaveTimer.current = null
  }
  const enter = () => { clearLeave(); setHovered(true) }
  const leave = () => {
    clearLeave()
    leaveTimer.current = setTimeout(() => setHovered(false), 140)
  }
  useEffect(() => clearLeave, [])

  // At rest the control is a single icon with the dates read out beneath it —
  // the ledger is the point of the page, not its filter. Hovering shows the
  // choices; clicking pins them open for anyone not using a mouse.
  const expanded = hovered || pinned || calendarOpen

  const choose = (id: PeriodId) => {
    onChange(id)
    // Custom cannot answer for itself, so picking it opens the calendar;
    // picking it again toggles that calendar back shut.
    setCalendarOpen(id === 'custom' ? !(value === 'custom' && calendarOpen) : false)
    // Unpin once a choice is made: still open while the pointer rests here,
    // and tucked away the moment it leaves.
    if (id !== 'custom') setPinned(false)
  }

  return (
    <div
      className="relative inline-flex flex-col items-end gap-3"
      onMouseEnter={enter}
      onMouseLeave={leave}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPinned(false)
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={reduce ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: 10 }}
            transition={{ duration: 0.14, ease: [0.25, 0.46, 0.45, 0.94] }}
            role="group"
            aria-label="Reporting period"
            /* One segmented control rather than five loose words: the hairline
               box says these are the choices, and the solid segment says which
               is on. The fill is --space-text-primary, so it is ink-black on
               the light themes and flips to paper-white on charcoal — a literal
               black chip would vanish into the dark theme's background. */
            className="flex items-stretch overflow-hidden rounded-lg border border-[var(--space-border-hard)]"
          >
            {PERIOD_IDS.map((id, i) => {
              const selected = value === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => choose(id)}
                  aria-pressed={selected}
                  aria-expanded={id === 'custom' ? calendarOpen : undefined}
                  className={cn(
                    // Six segments do not fit a phone at desktop sizing; the tap height is
                    // unchanged, only the type and side padding give way.
                    'flex items-center gap-1.5 whitespace-nowrap px-2 py-[9px] text-[12px] transition-colors duration-150 sm:px-4 sm:text-[13px]',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]',
                    i > 0 && 'border-l border-[var(--space-border-hard)]',
                    !selected && 'text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)]',
                  )}
                  style={selected ? { background: 'var(--space-text-primary)', color: 'var(--space-bg-base)' } : undefined}
                >
                  {PERIOD_LABEL[id]}
                  {id === 'custom' && (
                    <CalendarDays className="size-[14px] shrink-0 opacity-70" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            type="button"
            initial={reduce ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: 10 }}
            transition={{ duration: 0.14, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => setPinned(true)}
            onFocus={() => setPinned(true)}
            aria-expanded={false}
            aria-label={`Reporting period: ${PERIOD_LABEL[value]}, ${rangeLabel}. Open to change it.`}
            className="rounded-lg border border-[var(--space-border-hard)] p-[9px] text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]"
          >
            <CalendarDays className="size-[15px]" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      {calendarOpen && (
        <RangeCalendar
          value={custom}
          onChange={onCustomChange}
          onClose={() => { setCalendarOpen(false); setPinned(false) }}
        />
      )}
    </div>
  )
}
