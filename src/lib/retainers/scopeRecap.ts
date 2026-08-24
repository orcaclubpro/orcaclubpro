// src/lib/retainers/scopeRecap.ts
/**
 * Scope recap — the "here is what we have already done" document that backs a proposal.
 *
 * The third recap flavour. Its siblings are both anchored to a billing event — a cycle
 * (src/lib/retainers/recap.ts) or a scheduled payment (src/lib/packages/recap.ts) — and
 * a scoping retainer has neither: no anchor, so no cycle, so nothing billable. This one
 * is anchored to the pitch instead, and reads the same two piles the scoping console
 * collects: work already delivered, and work planned next. It is engagement-agnostic —
 * the same document precedes a recurring retainer and a one-off package.
 *
 * Numeric/factual fields are derived server-side (`deriveScopeRecapDefaults`); narrative
 * fields start blank for staff to fill in the composer, and `mergeScopeRecap` puts the
 * server's numbers back on top so a client can never fabricate hours or work.
 *
 * Pure (no server/pdf deps) so the server action, the PDF route, and the client composer
 * can all import it.
 */
import { RECAP_CATEGORY_LABEL } from './recap'
import type { TimeEntryCategory } from '@/actions/retainers'

export interface ScopeRecapItem {
  date: string
  description: string
  hours: number | null
}

export interface ScopeRecapBucket {
  label: string // editable — defaults to the category label
  items: ScopeRecapItem[] // server-authoritative
  hours: number // server-authoritative
  note: string // narrative — starts blank
}

/** One planned item, rendered as an unchecked box on the "What's next" slide. */
export interface ScopeRecapNext {
  kind: 'planned'
  label: string
  amount: number | null
  dueDate: string | null
}

export interface ScopeRecapData {
  // ── Cover (auto, except the title) ──
  clientName: string
  clientCompany: string | null
  scopeTitle: string // editable — seeded from the scope summary
  periodLabel: string // auto — the span the delivered work covers
  // ── At a glance (auto) ──
  hoursDelivered: number
  itemsDelivered: number
  hoursPlanned: number
  itemsPlanned: number
  /** Headline figure of the offer this recap accompanies — null until it is priced. */
  proposedAmountLabel: string | null
  proposedTermsLabel: string | null
  // ── Narrative ──
  headline: string // seeded
  accomplishedHeadline: string
  remainingHeadline: string
  // ── Delivered ──
  buckets: ScopeRecapBucket[] // auto set + hours + items; labels/notes editable
  // ── Planned next ──
  remaining: ScopeRecapNext[] // auto, non-editable
  // ── Notes ──
  notes: string[]
  nextSteps: string[]
}

export interface ScopeRecapEntryInput {
  date: string
  description: string
  hours: number | null
  category: TimeEntryCategory
}

export interface ScopeRecapDeriveInput {
  clientName: string
  clientCompany: string | null
  scopeSummary: string | null
  /** Logged (non-draft) entries — the work already delivered. */
  loggedEntries: ScopeRecapEntryInput[]
  /** Draft entries — the work being pitched. */
  plannedEntries: ScopeRecapEntryInput[]
  proposedAmountLabel: string | null
  proposedTermsLabel: string | null
}

function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100
}

/** Category order in the recap — stable regardless of log order. */
const BUCKET_ORDER: TimeEntryCategory[] = ['work', 'revision', 'meeting', 'reporting']

/** Month/day in UTC — day-only entry dates must never slip across a timezone. */
function shortUtc(val: string): string {
  const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(val)
  const dt = new Date(dayOnly ? `${val}T00:00:00.000Z` : val)
  return isNaN(dt.getTime())
    ? val
    : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** The span the delivered work covers — "Mar 3, 2026 – Aug 20, 2026", or a single day. */
function periodOf(entries: ScopeRecapEntryInput[]): string {
  const dates = entries.map((e) => e.date).filter(Boolean).sort()
  if (dates.length === 0) return 'Work to date'
  const from = shortUtc(dates[0])
  const to = shortUtc(dates[dates.length - 1])
  return from === to ? from : `${from} – ${to}`
}

/**
 * Build the default scope recap from the pitch. Numbers, buckets, and the planned list
 * come straight from the server; narrative fields start blank (title and headline are
 * seeded so the composer opens with something).
 */
export function deriveScopeRecapDefaults(i: ScopeRecapDeriveInput): ScopeRecapData {
  const buckets: ScopeRecapBucket[] = BUCKET_ORDER.map((cat) => {
    const items = i.loggedEntries
      .filter((e) => (e.category ?? 'work') === cat)
      .map((e) => ({ date: e.date, description: e.description, hours: e.hours }))
    return {
      label: RECAP_CATEGORY_LABEL[cat],
      items,
      hours: round2(items.reduce((s, e) => s + (e.hours ?? 0), 0)),
      note: '',
    }
  }).filter((b) => b.items.length > 0)

  const itemsDelivered = i.loggedEntries.length
  const hoursDelivered = round2(i.loggedEntries.reduce((s, e) => s + (e.hours ?? 0), 0))
  const itemsPlanned = i.plannedEntries.length
  const hoursPlanned = round2(i.plannedEntries.reduce((s, e) => s + (e.hours ?? 0), 0))

  const remaining: ScopeRecapNext[] = i.plannedEntries.map((p) => ({
    kind: 'planned' as const,
    label: p.description || RECAP_CATEGORY_LABEL[(p.category ?? 'work') as TimeEntryCategory],
    amount: null,
    dueDate: null,
  }))

  // Nothing delivered yet is a legitimate state — the recap then reads as a pure plan.
  const headline = itemsDelivered
    ? `${itemsDelivered} item${itemsDelivered === 1 ? '' : 's'} delivered, ${hoursDelivered} hour${hoursDelivered === 1 ? '' : 's'} logged`
    : `${itemsPlanned} item${itemsPlanned === 1 ? '' : 's'} planned, ${hoursPlanned} hour${hoursPlanned === 1 ? '' : 's'} estimated`

  return {
    clientName: i.clientName,
    clientCompany: i.clientCompany,
    scopeTitle: i.scopeSummary?.trim() || 'Work to date',
    periodLabel: periodOf(i.loggedEntries),
    hoursDelivered,
    itemsDelivered,
    hoursPlanned,
    itemsPlanned,
    proposedAmountLabel: i.proposedAmountLabel,
    proposedTermsLabel: i.proposedTermsLabel,
    headline,
    accomplishedHeadline: '',
    remainingHeadline: '',
    buckets,
    remaining,
    notes: [''],
    nextSteps: [''],
  }
}

/**
 * Merge staff-edited recap text over the server's authoritative model. Every number,
 * every work item, and the whole planned list come from `server`; only narrative text
 * comes from `client`. Buckets zip by index so client-edited labels/notes attach to
 * server hours and server items — a client can never fabricate work or amounts.
 */
export function mergeScopeRecap(
  server: ScopeRecapData,
  client: Partial<ScopeRecapData> | null | undefined,
): ScopeRecapData {
  const c = client ?? {}
  const buckets = server.buckets.map((b, idx) => ({
    label: c.buckets?.[idx]?.label?.trim() || b.label,
    items: b.items, // server-authoritative
    hours: b.hours, // server-authoritative
    note: c.buckets?.[idx]?.note ?? b.note,
  }))
  return {
    // ── server-authoritative ──
    clientName: server.clientName,
    clientCompany: server.clientCompany,
    periodLabel: server.periodLabel,
    hoursDelivered: server.hoursDelivered,
    itemsDelivered: server.itemsDelivered,
    hoursPlanned: server.hoursPlanned,
    itemsPlanned: server.itemsPlanned,
    proposedAmountLabel: server.proposedAmountLabel,
    proposedTermsLabel: server.proposedTermsLabel,
    buckets,
    remaining: server.remaining,
    // ── staff-editable text ──
    scopeTitle: c.scopeTitle?.trim() || server.scopeTitle,
    headline: c.headline ?? server.headline,
    accomplishedHeadline: c.accomplishedHeadline ?? server.accomplishedHeadline,
    remainingHeadline: c.remainingHeadline ?? server.remainingHeadline,
    notes: Array.isArray(c.notes) ? c.notes : server.notes,
    nextSteps: Array.isArray(c.nextSteps) ? c.nextSteps : server.nextSteps,
  }
}
