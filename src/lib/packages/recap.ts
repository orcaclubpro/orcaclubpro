// src/lib/packages/recap.ts
/**
 * Milestone package recap — shared shapes + default-derivation.
 *
 * A recap is the client-facing summary attached to one scheduled payment: what the
 * payment bought and what remains. Numeric/factual fields are derived from the work
 * log and the payment schedule (`derivePackageRecapDefaults`); narrative fields start
 * blank for staff to fill in the composer.
 *
 * Pure (no server/pdf deps) so the server action, the PDF route, and the client
 * composer can all import it. Mirrors src/lib/retainers/recap.ts.
 */
import { WORK_CATEGORY_LABEL, type WorkCategory } from './workLines'

export interface PackageRecapItem {
  date: string
  description: string
  hours: number | null
  category: WorkCategory
}

export interface PackageRecapBucket {
  label: string // editable — defaults to the category label
  items: PackageRecapItem[] // server-authoritative
  hours: number // server-authoritative
  note: string // narrative — starts blank
}

export interface PackageRecapRemaining {
  kind: 'planned' | 'payment'
  label: string
  amount: number | null
  dueDate: string | null
}

export interface PackageRecapData {
  // ── Cover (auto) ──
  clientName: string
  clientCompany: string | null
  packageName: string
  paymentLabel: string
  paymentAmount: number
  paymentDueDate: string | null
  paymentPosition: string // "Payment 2 of 3"
  paymentIndex: number
  paymentCount: number
  // ── At a glance (auto) ──
  packageTotal: number
  amountPaid: number
  amountRemaining: number
  itemsShipped: number
  totalHours: number
  // ── Narrative ──
  headline: string // editable summary line — seeded
  accomplishedHeadline: string
  remainingHeadline: string
  // ── Accomplished ──
  buckets: PackageRecapBucket[] // auto set + hours + items; labels/notes editable
  // ── What's left ──
  remaining: PackageRecapRemaining[] // auto, non-editable
  // ── Notes ──
  notes: string[]
  nextSteps: string[]
}

export interface PackageRecapEntryInput {
  date: string
  description: string
  hours: number | null
  category: WorkCategory
}

export interface PackageRecapDeriveInput {
  clientName: string
  clientCompany: string | null
  packageName: string
  paymentLabel: string
  paymentAmount: number
  paymentDueDate: string | null
  /** 1-based position of this payment in the schedule. */
  paymentIndex: number
  paymentCount: number
  packageTotal: number
  amountPaid: number
  /** Pending logged entries this payment will consume. */
  loggedEntries: PackageRecapEntryInput[]
  /** Planned entries still marked incomplete. */
  plannedOpen: PackageRecapEntryInput[]
  /** Schedule entries after this one that are still un-invoiced. */
  remainingPayments: { label: string; amount: number; dueDate: string | null }[]
}

function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100
}

/** Category order in the recap — stable regardless of log order. */
const BUCKET_ORDER: WorkCategory[] = ['work', 'design', 'revision', 'meeting']

/**
 * Build the default recap from a package's pending work and its schedule position.
 * Numbers, buckets, and the remaining list come straight from the server; narrative
 * fields start blank (headline is seeded so the composer opens with something).
 */
export function derivePackageRecapDefaults(i: PackageRecapDeriveInput): PackageRecapData {
  const buckets: PackageRecapBucket[] = BUCKET_ORDER.map((cat) => {
    const items = i.loggedEntries.filter((e) => (e.category ?? 'work') === cat)
    return {
      label: WORK_CATEGORY_LABEL[cat],
      items,
      hours: round2(items.reduce((s, e) => s + (e.hours ?? 0), 0)),
      note: '',
    }
  }).filter((b) => b.items.length > 0)

  const itemsShipped = i.loggedEntries.length
  const totalHours = round2(i.loggedEntries.reduce((s, e) => s + (e.hours ?? 0), 0))

  const remaining: PackageRecapRemaining[] = [
    ...i.plannedOpen.map((p) => ({
      kind: 'planned' as const,
      label: p.description,
      amount: null,
      dueDate: p.date ?? null,
    })),
    ...i.remainingPayments.map((p) => ({
      kind: 'payment' as const,
      label: p.label,
      amount: p.amount,
      dueDate: p.dueDate ?? null,
    })),
  ]

  return {
    clientName: i.clientName,
    clientCompany: i.clientCompany,
    packageName: i.packageName,
    paymentLabel: i.paymentLabel,
    paymentAmount: i.paymentAmount,
    paymentDueDate: i.paymentDueDate,
    paymentPosition: `Payment ${i.paymentIndex} of ${i.paymentCount}`,
    paymentIndex: i.paymentIndex,
    paymentCount: i.paymentCount,
    packageTotal: round2(i.packageTotal),
    amountPaid: round2(i.amountPaid),
    amountRemaining: round2(Math.max(0, i.packageTotal - i.amountPaid)),
    itemsShipped,
    totalHours,
    headline: `${itemsShipped} item${itemsShipped === 1 ? '' : 's'} delivered, ${totalHours} hour${totalHours === 1 ? '' : 's'} logged`,
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
 * every work item, and the whole remaining list come from `server`; only narrative
 * text comes from `client`. Buckets zip by index so client-edited labels/notes attach
 * to server hours and server items — a client can never fabricate work or amounts.
 */
export function mergePackageRecap(
  server: PackageRecapData,
  client: Partial<PackageRecapData> | null | undefined,
): PackageRecapData {
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
    packageName: server.packageName,
    paymentLabel: server.paymentLabel,
    paymentAmount: server.paymentAmount,
    paymentDueDate: server.paymentDueDate,
    paymentPosition: server.paymentPosition,
    paymentIndex: server.paymentIndex,
    paymentCount: server.paymentCount,
    packageTotal: server.packageTotal,
    amountPaid: server.amountPaid,
    amountRemaining: server.amountRemaining,
    itemsShipped: server.itemsShipped,
    totalHours: server.totalHours,
    buckets,
    remaining: server.remaining,
    // ── staff-editable text ──
    headline: c.headline ?? server.headline,
    accomplishedHeadline: c.accomplishedHeadline ?? server.accomplishedHeadline,
    remainingHeadline: c.remainingHeadline ?? server.remainingHeadline,
    notes: Array.isArray(c.notes) ? c.notes : server.notes,
    nextSteps: Array.isArray(c.nextSteps) ? c.nextSteps : server.nextSteps,
  }
}
