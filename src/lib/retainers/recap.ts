/**
 * Retainer cycle recap — shared shapes + default-derivation.
 *
 * A recap is a client-facing summary of one billing cycle: the deck-style
 * "monthly recap & insights" document. Numeric/factual fields are derived from
 * the cycle (see `deriveRecapDefaults`); narrative fields start blank for staff
 * to fill in the composer. This module is pure (no server/pdf deps) so both the
 * server action, the PDF route, and the client composer can import it.
 */
import type { RetainerTier, TimeEntryCategory } from '@/actions/retainers'

export const RECAP_CATEGORY_LABEL: Record<TimeEntryCategory, string> = {
  work: 'Work',
  meeting: 'Meetings',
  revision: 'Revisions',
  reporting: 'Reporting',
}

export interface RecapBucket {
  label: string // editable — defaults to the category label
  hours: number // server-authoritative (from byCategory)
  note: string // narrative — starts from logged descriptions
}
export interface RecapCampaign {
  channel: string
  title: string
  note: string
}
export interface RecapRecommendation {
  title: string
  note: string
}

export interface RecapData {
  // ── Cover (auto) ──
  clientName: string
  clientCompany: string | null
  tier: RetainerTier
  tierLabel: string
  periodLabel: string
  monthlyFee: number
  hoursPerMonth: number
  // ── At a glance ──
  headline: string // editable summary line
  hoursUsed: number // auto
  hoursUnused: number // auto
  itemsShipped: number // auto (logged-entry count)
  siteHealth: { label: string; note: string }
  openRequests: { count: number; note: string }
  // ── Where the hours went ──
  bucketsHeadline: string
  buckets: RecapBucket[] // auto set + hours; labels/notes editable
  // ── Campaigns (Growth / Enterprise only) ──
  showCampaigns: boolean
  campaigns: RecapCampaign[]
  // ── Recommendations ──
  recommendations: RecapRecommendation[]
  // ── Notes ──
  notesDecided: string[]
  notesOpen: string[]
  // ── Next month ──
  nextMonthPriorities: string[] // auto-seeded from next-cycle drafts
  asksFromClient: string[]
  nextCallLabel: string
}

/** Trim an hours value to at most 2 decimals for display in headlines. */
function fmtH(n: number): string {
  return (Math.round((n ?? 0) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export interface RecapDeriveInput {
  clientName: string
  clientCompany: string | null
  tier: RetainerTier
  tierLabel: string
  periodLabel: string
  monthlyFee: number
  hoursPerMonth: number
  hoursUsed: number
  byCategory: Record<TimeEntryCategory, number>
  loggedCount: number
  loggedDescriptions: Partial<Record<TimeEntryCategory, string[]>>
  nextMonthPriorities: string[]
}

/**
 * Build the default recap from a cycle's derived facts. Numbers and the bucket
 * set come straight from the cycle; narrative fields start blank/seeded so the
 * composer has something to edit. Growth/Enterprise tiers get a campaigns slide.
 */
export function deriveRecapDefaults(i: RecapDeriveInput): RecapData {
  const hoursUsed = Math.round((i.hoursUsed ?? 0) * 100) / 100
  const hoursUnused = Math.round(Math.max(0, i.hoursPerMonth - hoursUsed) * 100) / 100

  const buckets: RecapBucket[] = (Object.keys(i.byCategory) as TimeEntryCategory[])
    .filter((c) => (i.byCategory[c] ?? 0) > 0)
    .map((c) => ({
      label: RECAP_CATEGORY_LABEL[c],
      hours: Math.round((i.byCategory[c] ?? 0) * 100) / 100,
      note: (i.loggedDescriptions[c] ?? []).filter(Boolean).join('. '),
    }))

  const showCampaigns = i.tier === 'growth' || i.tier === 'enterprise'
  const priorities = i.nextMonthPriorities.filter(Boolean)

  return {
    clientName: i.clientName,
    clientCompany: i.clientCompany,
    tier: i.tier,
    tierLabel: i.tierLabel,
    periodLabel: i.periodLabel,
    monthlyFee: i.monthlyFee,
    hoursPerMonth: i.hoursPerMonth,
    headline: `${fmtH(hoursUsed)} of ${fmtH(i.hoursPerMonth)} hours used, ${i.loggedCount} item${i.loggedCount === 1 ? '' : 's'} shipped`,
    hoursUsed,
    hoursUnused,
    itemsShipped: i.loggedCount,
    siteHealth: { label: 'Healthy', note: '' },
    openRequests: { count: 0, note: '' },
    bucketsHeadline: '',
    buckets,
    showCampaigns,
    campaigns: showCampaigns ? [{ channel: '', title: '', note: '' }] : [],
    recommendations: [
      { title: '', note: '' },
      { title: '', note: '' },
      { title: '', note: '' },
    ],
    notesDecided: [''],
    notesOpen: [''],
    nextMonthPriorities: priorities.length ? priorities : [''],
    asksFromClient: [''],
    nextCallLabel: '',
  }
}

/**
 * Merge staff-edited recap text over the server's authoritative model. Numbers
 * (hours used/unused, items shipped, bucket hours, plan terms, client identity)
 * always come from `server`; everything narrative comes from `client`. Buckets
 * zip by index so client-edited labels/notes attach to server hours — a client
 * can never fabricate hours.
 */
export function mergeRecap(server: RecapData, client: Partial<RecapData> | null | undefined): RecapData {
  const c = client ?? {}
  const buckets = server.buckets.map((b, idx) => ({
    label: c.buckets?.[idx]?.label?.trim() || b.label,
    hours: b.hours, // server-authoritative
    note: c.buckets?.[idx]?.note ?? b.note,
  }))
  return {
    // ── server-authoritative ──
    clientName: server.clientName,
    clientCompany: server.clientCompany,
    tier: server.tier,
    tierLabel: server.tierLabel,
    periodLabel: server.periodLabel,
    monthlyFee: server.monthlyFee,
    hoursPerMonth: server.hoursPerMonth,
    hoursUsed: server.hoursUsed,
    hoursUnused: server.hoursUnused,
    itemsShipped: server.itemsShipped,
    buckets,
    // ── staff-editable text ──
    headline: c.headline ?? server.headline,
    siteHealth: {
      label: c.siteHealth?.label ?? server.siteHealth.label,
      note: c.siteHealth?.note ?? server.siteHealth.note,
    },
    openRequests: {
      count: Number.isFinite(c.openRequests?.count) ? Number(c.openRequests?.count) : server.openRequests.count,
      note: c.openRequests?.note ?? server.openRequests.note,
    },
    bucketsHeadline: c.bucketsHeadline ?? server.bucketsHeadline,
    showCampaigns: c.showCampaigns ?? server.showCampaigns,
    campaigns: Array.isArray(c.campaigns) ? c.campaigns : server.campaigns,
    recommendations: Array.isArray(c.recommendations) ? c.recommendations : server.recommendations,
    notesDecided: Array.isArray(c.notesDecided) ? c.notesDecided : server.notesDecided,
    notesOpen: Array.isArray(c.notesOpen) ? c.notesOpen : server.notesOpen,
    nextMonthPriorities: Array.isArray(c.nextMonthPriorities) ? c.nextMonthPriorities : server.nextMonthPriorities,
    asksFromClient: Array.isArray(c.asksFromClient) ? c.asksFromClient : server.asksFromClient,
    nextCallLabel: c.nextCallLabel ?? server.nextCallLabel,
  }
}
