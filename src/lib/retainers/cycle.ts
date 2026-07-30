/**
 * Anniversary-based retainer billing cycle helpers.
 *
 * A retainer's billing cycle is a monthly window anchored on the day-of-month of
 * its activation date (the "anchor day"). Cycles are half-open windows [start, end)
 * and all math is performed in UTC.
 *
 * Pure, dependency-free: no imports, no side effects, no Date.now() — callers pass
 * every reference date explicitly.
 */

export interface Cycle {
  start: string // ISO string, inclusive start (00:00:00.000Z of the anchor day)
  end: string // ISO string, exclusive end (start of the next cycle)
  label: string // human label, e.g. "Jul 10 – Aug 9, 2026"
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Normalize a string | Date input into a UTC Date. Bare `YYYY-MM-DD` is treated as UTC midnight. */
function toUtcDate(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(input.getTime())
  }
  // Bare YYYY-MM-DD → construct explicit UTC midnight (avoids local-time parsing).
  const bare = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (bare) {
    return new Date(Date.UTC(Number(bare[1]), Number(bare[2]) - 1, Number(bare[3])))
  }
  return new Date(input)
}

/** Number of days in a given UTC year/month (month is 0-indexed). */
function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month = last day of this month.
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

/** UTC midnight for year/month/day with the day clamped to that month's length. */
function anchoredStart(year: number, month: number, anchorDay: number): Date {
  const day = Math.min(anchorDay, daysInMonth(year, month))
  return new Date(Date.UTC(year, month, day))
}

/** The cycle window that contains `date`, anchored on activatedAt's day-of-month. */
export function cycleFor(activatedAt: string | Date, date: string | Date): Cycle {
  const anchorDay = toUtcDate(activatedAt).getUTCDate()
  const target = toUtcDate(date)

  const year = target.getUTCFullYear()
  const month = target.getUTCMonth()
  const day = target.getUTCDate()

  const clampedAnchorThisMonth = Math.min(anchorDay, daysInMonth(year, month))

  // If the target day is on/after this month's anchor, the cycle started this month;
  // otherwise it started the previous month.
  let startYear = year
  let startMonth = month
  if (day < clampedAnchorThisMonth) {
    startMonth = month - 1
    if (startMonth < 0) {
      startMonth = 11
      startYear = year - 1
    }
  }

  const start = anchoredStart(startYear, startMonth, anchorDay)
  const end = anchoredStart(
    startMonth === 11 ? startYear + 1 : startYear,
    startMonth === 11 ? 0 : startMonth + 1,
    anchorDay,
  )

  return { start: start.toISOString(), end: end.toISOString(), label: buildLabel(start, end) }
}

/** Build the "{Mon} {D} – {Mon} {D}, {YYYY}" label using end-minus-one-day and end's year. */
function buildLabel(start: Date, end: Date): string {
  const lastDay = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  const startPart = `${MONTHS[start.getUTCMonth()]} ${start.getUTCDate()}`
  const endPart = `${MONTHS[lastDay.getUTCMonth()]} ${lastDay.getUTCDate()}`
  return `${startPart} – ${endPart}, ${end.getUTCFullYear()}`
}

/**
 * ISO start of the cycle immediately AFTER the cycle containing `from`. Used to schedule
 * plan changes / deactivations that "take effect next cycle / same date next month".
 */
export function nextCycleStart(activatedAt: string | Date, from: string | Date): string {
  return cycleFor(activatedAt, from).end
}

/** The cycle `n` windows away from the one containing `date` (negative n = past). */
export function shiftCycle(activatedAt: string | Date, date: string | Date, n: number): Cycle {
  const base = cycleFor(activatedAt, date)
  const start = toUtcDate(base.start)
  const anchorDay = toUtcDate(activatedAt).getUTCDate()

  // Advance/rewind n anchored months from the base cycle's start month.
  const startMonthIndex = start.getUTCFullYear() * 12 + start.getUTCMonth() + n
  const year = Math.floor(startMonthIndex / 12)
  const month = startMonthIndex % 12

  const shiftedStart = anchoredStart(year, month, anchorDay)
  // Land inside the shifted window (its start day) and recompute canonically.
  return cycleFor(activatedAt, shiftedStart)
}
