// Calendar periods for the staff dashboard.
//
// Distinct from `Range` in ./range.ts, which is a rolling day window used to
// scale the timeline axis. This one answers a bookkeeping question — "what came
// in this month?" — so its boundaries are calendar boundaries, not "30 days
// back", and the preset periods end at now rather than running into the future.

export type PeriodId = 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'

/** The presets, in the order the control shows them. `custom` is appended. */
export const PERIOD_IDS: PeriodId[] = ['week', 'month', 'quarter', 'year', 'all', 'custom']

export const PERIOD_LABEL: Record<PeriodId, string> = {
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
  all: 'All time',
  custom: 'Custom',
}

/** The two `<input type="date">` values, as `yyyy-mm-dd` or empty. */
export interface CustomRange {
  from: string
  to: string
}

export const EMPTY_CUSTOM_RANGE: CustomRange = { from: '', to: '' }

export interface Period {
  id: PeriodId
  /** Epoch ms the period opens, or null for no lower bound. */
  start: number | null
  /** Epoch ms the period closes. */
  end: number
  /** How the period reads on its own: "September", "Q3 2026", "Mar 3 – Apr 12". */
  name: string
  /**
   * How the period reads after a verb — "Collected {phrase}". Presets take a
   * preposition ("in September"); an explicit range reads as itself, because
   * "in Jul 1 – Aug 31" is not a sentence.
   */
  phrase: string
  /**
   * The concrete days the period covers — "Sep 1 – Sep 2, 2026". Every preset
   * shows this, so choosing "Quarter" tells you which days that actually means
   * rather than leaving you to work it out.
   */
  rangeLabel: string
  /**
   * True when the upper bound is meaningful. Presets all end at now, so
   * anything dated ahead is simply "still to come" and the timeline keeps
   * showing it. A custom range is a window with two walls, and honouring only
   * one of them would quietly show rows outside the range the user asked for.
   */
  bounded: boolean
}

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'long' })
const DAY_MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/** Parse a `yyyy-mm-dd` value as local midnight. Returns null if unusable. */
export function parseDateValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Format a Date as the `yyyy-mm-dd` value the range uses. Local, not UTC. */
export function toDateValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** "Sep 1 – Sep 2, 2026", collapsing the repeated month and year where it can. */
function spanLabel(start: number | null, end: number): string {
  const to = new Date(end)
  if (start === null) return `everything up to ${DAY_MONTH.format(to)}, ${to.getFullYear()}`

  const from = new Date(start)
  const sameYear = from.getFullYear() === to.getFullYear()
  const sameMonth = sameYear && from.getMonth() === to.getMonth()

  if (sameMonth && from.getDate() === to.getDate()) {
    return `${DAY_MONTH.format(from)}, ${from.getFullYear()}`
  }
  if (sameMonth) {
    return `${DAY_MONTH.format(from)} – ${to.getDate()}, ${to.getFullYear()}`
  }
  if (sameYear) {
    return `${DAY_MONTH.format(from)} – ${DAY_MONTH.format(to)}, ${to.getFullYear()}`
  }
  return `${DAY_MONTH.format(from)}, ${from.getFullYear()} – ${DAY_MONTH.format(to)}, ${to.getFullYear()}`
}

function resolveCustom(custom: CustomRange, now: number): Period {
  const fromDate = parseDateValue(custom.from)
  const toDate = parseDateValue(custom.to)

  // The `to` day is inclusive, so the window closes at the end of it.
  const start = fromDate ? fromDate.getTime() : null
  const end = toDate ? toDate.getTime() + 86_399_999 : now

  const name =
    fromDate && toDate ? `${DAY_MONTH.format(fromDate)} – ${DAY_MONTH.format(toDate)}`
    : fromDate ? `since ${DAY_MONTH.format(fromDate)}`
    : toDate ? `up to ${DAY_MONTH.format(toDate)}`
    : 'all time'

  return {
    id: 'custom', start, end, name, phrase: name,
    rangeLabel: fromDate || toDate ? spanLabel(start, end) : 'pick two days',
    bounded: Boolean(toDate),
  }
}

export function resolvePeriod(
  id: PeriodId,
  now: number = Date.now(),
  custom: CustomRange = EMPTY_CUSTOM_RANGE,
): Period {
  const d = new Date(now)
  const year = d.getFullYear()

  switch (id) {
    // Weeks open on Sunday, matching the range calendar's column order.
    case 'week': {
      const weekStart = new Date(year, d.getMonth(), d.getDate() - d.getDay()).getTime()
      return {
        id, start: weekStart, end: now, name: 'this week', phrase: 'this week',
        rangeLabel: spanLabel(weekStart, now), bounded: false,
      }
    }
    case 'month': {
      const monthStart = new Date(year, d.getMonth(), 1).getTime()
      return {
        id, start: monthStart, end: now,
        name: MONTH.format(d), phrase: `in ${MONTH.format(d)}`,
        rangeLabel: spanLabel(monthStart, now), bounded: false,
      }
    }
    case 'quarter': {
      const q = Math.floor(d.getMonth() / 3)
      const name = `Q${q + 1} ${year}`
      const quarterStart = new Date(year, q * 3, 1).getTime()
      return {
        id, start: quarterStart, end: now, name, phrase: `in ${name}`,
        rangeLabel: spanLabel(quarterStart, now), bounded: false,
      }
    }
    case 'year': {
      const yearStart = new Date(year, 0, 1).getTime()
      return {
        id, start: yearStart, end: now, name: String(year), phrase: `in ${year}`,
        rangeLabel: spanLabel(yearStart, now), bounded: false,
      }
    }
    case 'custom':
      return resolveCustom(custom, now)
    case 'all':
      return {
        id, start: null, end: now, name: 'all time', phrase: 'all time',
        rangeLabel: spanLabel(null, now), bounded: false,
      }
  }
}

/** True when an ISO date falls inside the period. Undated records are excluded. */
export function inPeriod(iso: string | null | undefined, period: Period): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  if (period.start !== null && t < period.start) return false
  return t <= period.end
}

/**
 * Timeline filter: inside the period, plus anything still ahead of us — unless
 * the period is a bounded custom window, where the upper wall is honoured.
 */
export function onTimeline(iso: string | null | undefined, period: Period): boolean {
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  if (period.start !== null && t < period.start) return false
  return period.bounded ? t <= period.end : true
}
