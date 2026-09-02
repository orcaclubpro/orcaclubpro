'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { parseDateValue, toDateValue, type CustomRange } from '@/lib/dashboard/period'
import { useTheme } from '@/app/(spaces)/ThemeContext'
import { THEMES, DEFAULT_THEME } from '@/app/(spaces)/themes'
import { cn } from '@/lib/utils'

// ─── Range calendar ──────────────────────────────────────────────────────────
// Two months side by side, and one rule for what a click means:
//
//   no start yet ................ the day becomes the start
//   start but no end ............ the day becomes the end
//   …and it fell before the start  the two swap, so the click still completes
//                                  a range instead of throwing the first one away
//   both already chosen ......... the day becomes a new start, and the end clears
//
// Colour comes from --space-* tokens only, so it holds on paper and charcoal
// alike. Text on the accent fill uses the page background, which is the one
// colour guaranteed to contrast with the accent in every theme.

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_YEAR = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const MONTH_ONLY = new Intl.DateTimeFormat('en-US', { month: 'long' })
const FULL_DATE = new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
})

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** Every cell of a month grid: leading blanks, then the days. */
function monthCells(anchor: Date): (Date | null)[] {
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const lead = new Date(year, month, 1).getDay()
  const length = new Date(year, month + 1, 0).getDate()
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length }, (_, i) => new Date(year, month, i + 1)),
  ]
}

/**
 * The year as its own field. Paging a year back through the month chevrons is
 * twelve clicks; this is one. The list always spans the years already in the
 * range, so a stored date can never fall outside its own picker.
 */
function YearSelect({
  value, month, years, colorScheme, onChange,
}: {
  value: number
  month: string
  years: number[]
  colorScheme: 'light' | 'dark'
  onChange: (year: number) => void
}) {
  return (
    <span className="relative inline-flex items-center">
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={`Year for ${month}`}
        className="appearance-none rounded-md border border-[var(--space-border-hard)] bg-transparent py-[3px] pl-2 pr-[22px] text-[13px] tabular-nums text-[var(--space-text-primary)] transition-colors hover:bg-[var(--space-bg-base)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]"
        style={{ colorScheme }}
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-1.5 size-3 text-[var(--space-text-tertiary)]"
      />
    </span>
  )
}

interface RangeCalendarProps {
  value: CustomRange
  onChange: (next: CustomRange) => void
  /** Called once a complete range has been chosen, and on Escape. */
  onClose: () => void
}

export function RangeCalendar({ value, onChange, onClose }: RangeCalendarProps) {
  const from = parseDateValue(value.from)
  const to = parseDateValue(value.to)
  const today = useMemo(() => startOfDay(new Date()), [])

  // Open on the chosen start, else on last month — a reporting range is almost
  // always behind us, so the useful pair is "previous month, this month".
  const [leftMonth, setLeftMonth] = useState<Date>(() =>
    from ? new Date(from.getFullYear(), from.getMonth(), 1) : addMonths(today, -1),
  )
  const [hovered, setHovered] = useState<Date | null>(null)
  const [focused, setFocused] = useState<Date>(() => from ?? today)

  const { themeId } = useTheme()
  const colorScheme = (THEMES[themeId] ?? THEMES[DEFAULT_THEME]).mode

  const rootRef = useRef<HTMLDivElement>(null)
  const focusedRef = useRef<HTMLButtonElement>(null)
  const shouldRefocus = useRef(false)

  // Escape closes; a click anywhere outside does too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [onClose])

  // Only move focus when a key press asked for it, so opening the calendar
  // doesn't yank focus and clicking a day doesn't fight the pointer.
  useEffect(() => {
    if (!shouldRefocus.current) return
    shouldRefocus.current = false
    focusedRef.current?.focus()
  }, [focused])

  const select = useCallback((day: Date) => {
    // A third click starts over; so does the very first one.
    if (!from || to) {
      onChange({ from: toDateValue(day), to: '' })
      return
    }
    // Second click. Reaching backwards past the start is a legitimate way to
    // draw a range, so the earlier day takes the start and the first pick
    // becomes the end.
    const [start, end] = day < from ? [day, from] : [from, day]
    onChange({ from: toDateValue(start), to: toDateValue(end) })
    // The range is complete — step out of the way rather than sit open.
    window.setTimeout(onClose, 180)
  }, [from, to, onChange, onClose])

  const moveFocus = useCallback((next: Date) => {
    shouldRefocus.current = true
    setFocused(next)
    // Keep the focused day on screen: shift the pair when it walks off an edge.
    const rightMonth = addMonths(leftMonth, 1)
    const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth()
    if (monthIndex(next) < monthIndex(leftMonth)) setLeftMonth(addMonths(leftMonth, -1))
    else if (monthIndex(next) > monthIndex(rightMonth)) setLeftMonth(addMonths(leftMonth, 1))
  }, [leftMonth])

  const onKeyDown = useCallback((e: React.KeyboardEvent, day: Date) => {
    const jump: Record<string, number> = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
    }
    if (e.key in jump) {
      e.preventDefault()
      moveFocus(addDays(day, jump[e.key]))
    } else if (e.key === 'PageUp') {
      e.preventDefault()
      moveFocus(new Date(day.getFullYear(), day.getMonth() - 1, day.getDate()))
    } else if (e.key === 'PageDown') {
      e.preventDefault()
      moveFocus(new Date(day.getFullYear(), day.getMonth() + 1, day.getDate()))
    }
  }, [moveFocus])

  // While only a start is set, the hovered day stands in for the other end so
  // the range you are about to pick is visible before you commit to it. Sorted,
  // because hovering backwards previews a backwards reach the same way a click
  // would resolve it.
  const [previewStart, previewEnd] = useMemo(() => {
    if (!from) return [null, null] as const
    const other = to ?? hovered
    if (!other) return [from, null] as const
    return other < from ? ([other, from] as const) : ([from, other] as const)
  }, [from, to, hovered])

  const dayState = (day: Date) => ({
    isEdge: Boolean(
      (previewStart && sameDay(day, previewStart)) || (previewEnd && sameDay(day, previewEnd)),
    ),
    inside: Boolean(previewStart && previewEnd && day > previewStart && day < previewEnd),
  })

  const months = [leftMonth, addMonths(leftMonth, 1)]

  // A decade back covers any realistic reporting range; the ends stretch to
  // include whatever the range already holds, and whichever years are on screen.
  const years = useMemo(() => {
    const anchors = [today.getFullYear(), from?.getFullYear(), to?.getFullYear(), ...months.map(m => m.getFullYear())]
      .filter((y): y is number => typeof y === 'number')
    const first = Math.min(today.getFullYear() - 8, ...anchors)
    const last = Math.max(today.getFullYear() + 1, ...anchors)
    return Array.from({ length: last - first + 1 }, (_, i) => first + i)
  }, [today, from, to, leftMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  // Changing a year keeps that calendar's month, and drags the pair with it so
  // the two stay adjacent.
  const setYearOf = (i: number, year: number) => {
    const shifted = new Date(year, months[i].getMonth(), 1)
    setLeftMonth(i === 0 ? shifted : addMonths(shifted, -1))
  }

  const hint =
    !from ? 'Pick the first day.'
    : !to ? 'Now pick the last day.'
    : 'Pick a day to start a new range.'

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Choose a date range"
      className="absolute right-0 top-full z-50 mt-2 w-max rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.18)]"
    >
      <div className="flex flex-col gap-6 sm:flex-row">
        {months.map((month, i) => (
          <div key={month.toISOString()} className="w-[224px]">
            <div className="mb-3 flex items-center justify-between">
              {i === 0 ? (
                <button
                  type="button"
                  onClick={() => setLeftMonth(addMonths(leftMonth, -1))}
                  aria-label="Previous month"
                  className="-ml-1 rounded p-1 text-[var(--space-text-tertiary)] transition-colors hover:text-[var(--space-text-primary)] focus-visible:text-[var(--space-text-primary)] focus-visible:outline-none"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
              ) : (
                <span className="size-6" aria-hidden="true" />
              )}

              <span className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-[var(--space-text-primary)]">
                  {MONTH_ONLY.format(month)}
                </span>
                <YearSelect
                  value={month.getFullYear()}
                  month={MONTH_ONLY.format(month)}
                  years={years}
                  colorScheme={colorScheme}
                  onChange={y => setYearOf(i, y)}
                />
              </span>

              {i === 1 ? (
                <button
                  type="button"
                  onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
                  aria-label="Next month"
                  className="-mr-1 rounded p-1 text-[var(--space-text-tertiary)] transition-colors hover:text-[var(--space-text-primary)] focus-visible:text-[var(--space-text-primary)] focus-visible:outline-none"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              ) : (
                <span className="size-6" aria-hidden="true" />
              )}
            </div>

            <div className="grid grid-cols-7" role="presentation">
              {WEEKDAYS.map((d, wi) => (
                <span
                  key={wi}
                  aria-hidden="true"
                  className="flex h-7 items-center justify-center text-[11px] text-[var(--space-text-tertiary)]"
                >
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7" role="grid" aria-label={MONTH_YEAR.format(month)}>
              {monthCells(month).map((day, ci) => {
                if (!day) return <span key={`pad-${ci}`} className="h-8" aria-hidden="true" />

                const { isEdge, inside } = dayState(day)
                const isToday = sameDay(day, today)

                return (
                  <button
                    key={day.toISOString()}
                    ref={sameDay(day, focused) ? focusedRef : undefined}
                    type="button"
                    tabIndex={sameDay(day, focused) ? 0 : -1}
                    aria-label={FULL_DATE.format(day)}
                    aria-pressed={isEdge}
                    onClick={() => { setFocused(day); select(day) }}
                    onMouseEnter={() => setHovered(day)}
                    onMouseLeave={() => setHovered(null)}
                    onKeyDown={e => onKeyDown(e, day)}
                    className={cn(
                      'relative flex h-8 items-center justify-center text-[13px] tabular-nums transition-colors duration-100',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]',
                      isEdge
                        ? 'font-medium'
                        : inside
                          ? 'text-[var(--space-text-primary)]'
                          : 'text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)]',
                    )}
                    style={
                      isEdge
                        ? { background: 'var(--space-accent)', color: 'var(--space-bg-base)' }
                        : inside
                          ? { background: 'var(--space-accent-soft)' }
                          : undefined
                    }
                  >
                    {day.getDate()}
                    {isToday && !isEdge && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 size-[3px] rounded-full bg-[var(--space-accent)]"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-[var(--space-divider)] pt-4">
        <p className="text-[13px] text-[var(--space-text-tertiary)]" aria-live="polite">{hint}</p>
        {(value.from || value.to) && (
          <button
            type="button"
            onClick={() => onChange({ from: '', to: '' })}
            className="text-[13px] text-[var(--space-text-tertiary)] underline decoration-[var(--space-divider)] underline-offset-4 transition-colors hover:text-[var(--space-text-primary)] focus-visible:text-[var(--space-text-primary)] focus-visible:outline-none"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
