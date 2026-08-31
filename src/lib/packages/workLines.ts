// src/lib/packages/workLines.ts
/**
 * Milestone work entries → invoice/order line shapes.
 *
 * Consumed work entries ride along on a scheduled-payment invoice as $0 lines:
 * the payment line carries the price, these document what the payment bought.
 * Pure (no server deps) so the action, the send modal, and the email builder can
 * all agree on the exact same wording.
 */

export type WorkCategory = 'work' | 'design' | 'revision' | 'meeting'

export const WORK_CATEGORY_LABEL: Record<WorkCategory, string> = {
  work: 'Work',
  design: 'Design',
  revision: 'Revisions',
  meeting: 'Meetings',
}

export interface WorkEntryLineInput {
  id: string
  /** ISO date — formatted in UTC so a day-only date never slips a day. */
  date: string
  description?: string | null
  /** Informational only — never priced. */
  hours?: number | null
  category?: WorkCategory | null
}

export interface WorkLine {
  entryId: string
  /** "May 2 — Rebuilt inventory sync" */
  title: string
  /** "3h · Work · milestone log" */
  description: string
}

/** Trim to at most 2 decimals — 1.256 → 1.26, 3 → 3. */
function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100
}

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/**
 * Build one $0 line per work entry, oldest first. Blank descriptions fall back to
 * the category label so a line is never untitled.
 */
export function buildWorkLines(entries: WorkEntryLineInput[]): WorkLine[] {
  return [...entries]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((e) => {
      const category = WORK_CATEGORY_LABEL[(e.category ?? 'work') as WorkCategory] ?? WORK_CATEGORY_LABEL.work
      const hours = round2(e.hours ?? 0)
      return {
        entryId: e.id,
        title: `${fmtDay(e.date)} — ${e.description?.trim() || category}`,
        description: [hours > 0 ? `${hours}h` : null, category, 'milestone log'].filter(Boolean).join(' · '),
      }
    })
}

// ── Work-log detail — the same entries as prose, on one line item ─────────────
/**
 * `buildWorkLines` renders entries as their own $0 invoice rows. That is right for an
 * invoice, where every row is something the payment bought, and wrong for a proposal,
 * where a dozen $0 rows bury the three deliverables that are actually priced.
 *
 * This is the other rendering: one block, attached as the `description` of the line
 * item the work belongs to. Grouped by calendar month so a client reading "Work
 * delivered to date" can find what happened in a given month instead of scanning a
 * flat run of dates.
 *
 * Newline-separated. Every client-facing surface must honour those breaks — the
 * package print page (`white-space: pre-line`) and `buildPackagePdf` both do.
 */
export interface WorkLogEntry {
  /** ISO date — formatted in UTC so a day-only date never slips a day. */
  date: string
  description?: string | null
  hours?: number | null
  /**
   * Display label, already resolved by the caller. Retainer entries and package work
   * entries have different category vocabularies (`reporting` vs `design`), and only
   * the caller knows which one it is holding. Used as the fallback when an entry has
   * no description, so a line is never blank.
   */
  category?: string | null
}

export interface WorkLogMonth {
  /** "August 2025" */
  label: string
  hours: number
  /** "Aug 4 · 2.5h · Discovery call" */
  lines: string[]
}

function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** One dated line: date · hours · what happened. Segments that are empty drop out. */
function workLogLine(e: WorkLogEntry): string {
  const hours = round2(e.hours ?? 0)
  const what = e.description?.trim() || e.category?.trim() || WORK_CATEGORY_LABEL.work
  return [fmtDay(e.date), hours > 0 ? `${hours}h` : null, what].filter(Boolean).join(' · ')
}

/** Entries bucketed into calendar months, oldest first, with each month's hours. */
export function groupWorkLogByMonth(entries: WorkLogEntry[]): WorkLogMonth[] {
  const buckets = new Map<string, WorkLogMonth>()
  for (const e of [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))) {
    const key = monthKey(e.date)
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { label: monthLabel(e.date), hours: 0, lines: [] }
      buckets.set(key, bucket)
    }
    bucket.hours = round2(bucket.hours + (e.hours ?? 0))
    bucket.lines.push(workLogLine(e))
  }
  return [...buckets.values()]
}

/**
 * The block that goes in a line item's description. A single month needs no heading —
 * the line item already says what it is — so headings appear only once the work spans
 * more than one, which is exactly when a client needs them to navigate.
 *
 * Returns '' for no entries, so callers can use it as the include/omit test.
 */
export function formatWorkLog(entries: WorkLogEntry[]): string {
  const months = groupWorkLogByMonth(entries)
  if (months.length === 0) return ''
  if (months.length === 1) return months[0].lines.join('\n')
  return months
    .map((m) => `${m.label} — ${m.hours}h\n${m.lines.join('\n')}`)
    .join('\n\n')
}
