'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CalendarDays, Search } from 'lucide-react'
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
    i % 2 === 0 ? 'border-l-0 pl-0' : 'border-l pl-3 sm:pl-5',
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
        'py-4 pr-3 text-left transition-colors duration-150 sm:pr-5',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]',
        active ? 'bg-[var(--space-bg-card)]' : 'hover:bg-[var(--space-bg-card)]',
        className,
      )}
    >
      <span
        className="block font-semibold tabular-nums leading-none tracking-[-0.02em] text-[var(--space-text-primary)]"
        // The floor carries a six-figure sum inside a half-width phone column;
        // above `md` the figures sit four across and the vw term takes over.
        style={{ fontSize: 'clamp(28px, 3.6vw, 46px)' }}
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

/**
 * A section's heading and its running total.
 *
 * One baseline row from `sm` up. On a phone the aside drops to its own line —
 * an aside carrying two figures and a control cannot share 336px with a title,
 * and `main` clips overflow rather than scrolling it, so the squeeze would have
 * silently cut the controls off the right edge instead of showing a scrollbar.
 * It stays right-aligned there, keeping the ledger's label-left/figure-right
 * rhythm intact on both layouts.
 */
export function SectionTitle({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[var(--space-border-hard)] pb-3 sm:flex-row sm:items-baseline sm:gap-3">
      <h2 className="text-[15px] font-semibold text-[var(--space-text-primary)]">{title}</h2>
      {aside !== undefined && aside !== null && (
        <div className="text-[13px] text-[var(--space-text-tertiary)] sm:ml-auto">{aside}</div>
      )}
    </div>
  )
}

/**
 * The ledger's one text input — a filter over the rows below it.
 *
 * Deliberately not a boxed field. Every other control on a ledger page is a
 * hairline and a piece of type, so a bordered pill with a background would be
 * the loudest thing on the page while doing the quietest job. It is a rule and
 * a caret, sitting exactly where the first row would be, and it inherits the
 * row's own left padding so the caret lines up with the titles it filters.
 *
 * `type="search"` rather than `text`, so the platform's own clear affordance
 * and the Escape-to-clear behaviour come for free; Escape is handled here too
 * because Firefox does not fire it on the input.
 */
export function SearchField({
  value, onChange, placeholder, label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  /** Accessible name. The visible placeholder is not one. */
  label: string
}) {
  return (
    <div className="group relative flex items-center gap-3 border-b border-[var(--space-divider)] pl-5 pr-1">
      <Search
        aria-hidden="true"
        className="size-[15px] shrink-0 text-[var(--space-text-muted)] transition-colors group-focus-within:text-[var(--space-text-secondary)]"
      />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape' && value) { e.preventDefault(); onChange('') } }}
        placeholder={placeholder}
        aria-label={label}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent py-4 text-[15px] text-[var(--space-text-primary)] outline-none',
          'placeholder:text-[var(--space-text-muted)]',
          // Safari draws its own cancel button; the trailing count would collide
          // with it, and Escape already clears.
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="shrink-0 rounded-lg px-2 py-1 text-[13px] text-[var(--space-text-tertiary)] transition-colors hover:text-[var(--space-text-primary)] focus-visible:outline-none focus-visible:text-[var(--space-text-primary)]"
        >
          Clear
        </button>
      )}
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
//
// Sticky at both sizes, and for the same reason: a ledger page is one long
// section, so a nav that scrolls away leaves the only way out at the top of the
// document. On a phone it parks directly under the portal header; on desktop it
// keeps its 20px of air. The solid background is load-bearing rather than
// decorative — the panel is a row of pills with gaps, and content would
// otherwise track through them as it passes underneath.

export interface LedgerSection<T extends string> {
  id: T
  label: string
  icon: LucideIcon
}

export function SectionNav<T extends string>({
  sections, value, onChange, counts, navRef,
  layoutId = 'section-chip',
  ariaLabel = 'Page sections',
  className,
}: {
  sections: readonly LedgerSection<T>[]
  value: T
  onChange: (id: T) => void
  counts?: Partial<Record<T, number>>
  /**
   * Placement classes. The nav must be a DIRECT child of the workspace flex
   * container, because a sticky element travels only inside its containing
   * block — wrapped in a div of its own height it would have nowhere to go on
   * a phone, where the workspace stacks and the wrapper hugs the nav. Callers
   * therefore pass their ordering here instead of wrapping.
   */
  className?: string
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
  //
  // Instant rather than smooth: the nudge fires on the same click that swaps
  // the section below it, and an animated slide there is one more thing moving
  // on its own at exactly the moment the reader is trying to read.
  useEffect(() => {
    const el = nav.current
    const button = refs.current[sections.findIndex(s => s.id === value)]
    if (!el || !button || el.scrollWidth <= el.clientWidth) return

    const left = button.offsetLeft
    const right = left + button.offsetWidth
    if (left < el.scrollLeft) el.scrollTo({ left: left - 12, behavior: 'auto' })
    else if (right > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: right - el.clientWidth + 12, behavior: 'auto' })
    }
  }, [value, sections, nav])

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
      className={cn(
        'scrollbar-none sticky z-20 flex shrink-0 gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-base)] p-1.5',
        'top-[var(--space-header)] lg:top-[calc(var(--space-header)_+_20px)]',
        'lg:w-[212px] lg:flex-col lg:overflow-visible',
        // `self-stretch` is what makes the row scrollable on a phone, and it is
        // load-bearing rather than cosmetic. The workspace stacks (`flex-col`)
        // below `lg`, so the nav's cross axis is its *width*: with the
        // `align-self: flex-start` that used to sit here, the nav sized itself
        // to its content instead of to the column, grew wider than the screen,
        // and `overflow-x: auto` had nothing to scroll because the scrollport
        // was the content. The pills past the right edge were simply clipped by
        // `main`'s `overflow-x: clip` and unreachable.
        //
        // From `lg` up the workspace is a row, the cross axis is the height, and
        // stretching there would make the nav as tall as the whole workspace and
        // strand its sticky position — so it goes back to `flex-start`.
        'self-stretch lg:self-start',
        className,
      )}
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
              'relative flex min-h-[44px] shrink-0 items-center rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors duration-150 lg:min-h-0 lg:w-full',
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
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 42 }}
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
// Moved to `./use-section-cycle` so a nav can take the behaviour without pulling
// in this module's motion and calendar imports. Re-exported here because the
// ledger's own consumers have always imported it from this file.

export { useSectionCycle } from './use-section-cycle'

// ─── The standing band does not collapse ──────────────────────────────────────
// There was a `useScrollCollapse` here that shut the masthead and figures once
// you scrolled past 150px. It is gone, and nothing replaced it, because the
// shape of the idea was unfixable at that size: the band it removed is ~410px
// tall on the staff home, so tripping at 150px deleted 260px of document from
// *above* the reader's scroll position. The browser clamped the scroll back
// toward zero, zero is below any sane re-open threshold, so the band opened
// again and pushed all 410px back in. Asymmetric thresholds did not help — the
// clamp lands at 0, outside the hysteresis entirely — and Chrome's scroll
// anchoring, trying to compensate for the same shift, made the loop tighter.
//
// The band sits at the top of the document, so it scrolls away on its own. The
// section nav is sticky and the portal header carries the page's title the
// whole way down, so the collapse was reclaiming room the reader had already
// left behind, at the cost of a guaranteed jump. Do not reintroduce it without
// synchronous scroll compensation.

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
