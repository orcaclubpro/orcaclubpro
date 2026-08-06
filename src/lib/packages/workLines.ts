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
