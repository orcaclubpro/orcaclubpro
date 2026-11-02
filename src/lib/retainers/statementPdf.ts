import { getPayload } from 'payload'
import config from '@payload-config'

import { getRetainerSummary } from '@/actions/retainers'
import { buildRetainerStatementPdf } from '@/lib/pdf-generators'
import type { ClientAccount } from '@/types/payload-types'

/** Capitalize a tier key for display (e.g. "growth" → "Growth"). */
function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Render a client's retainer statement for one cycle. The single source of the
 * statement bytes: the staff download route and the MCP draft tool both call it.
 *
 * Every number comes from getRetainerSummary, which is also the staff gate.
 * Rendering only: nothing is created, billed or sent.
 */
export async function buildRetainerStatementPdfFor(
  clientAccountId: string,
  ref?: string,
): Promise<
  | { success: true; bytes: Uint8Array; periodLabel: string }
  | { success: false; error: string; notFound?: boolean }
> {
  const summary = await getRetainerSummary(clientAccountId, ref)
  if (!summary.success) return { success: false, error: summary.error ?? 'Failed to load the retainer' }
  if (!summary.cycle || !summary.terms) {
    return { success: false, error: 'No active retainer cycle to report', notFound: true }
  }

  const payload = await getPayload({ config })
  const account = (await payload
    .findByID({ collection: 'client-accounts', id: clientAccountId, depth: 0 })
    .catch(() => null)) as ClientAccount | null

  const bytes = await buildRetainerStatementPdf({
    clientName: account?.name ?? 'Client',
    clientCompany: account?.company ?? null,
    tierLabel: capitalize(summary.terms.tier),
    periodLabel: summary.cycle.label,
    monthlyFee: summary.terms.monthlyFee,
    hoursPerMonth: summary.terms.hoursPerMonth,
    overageRate: summary.terms.overageRate,
    entries: summary.logged.map((e) => ({
      date: e.date,
      description: e.description ?? '',
      category: e.category ?? 'work',
      hours: e.hours,
      priority: e.priority ?? 'medium',
    })),
    planned: summary.drafts.map((e) => ({
      date: e.date,
      description: e.description ?? '',
      category: e.category ?? 'work',
      priority: e.priority ?? 'medium',
      completion: e.completion ?? 'incomplete',
    })),
    totals: {
      used: summary.totals.used,
      remaining: summary.totals.remaining,
      overageHours: summary.totals.overageHours,
      overageAmount: summary.totals.overageAmount,
    },
    generatedOn: new Date().toISOString(),
  })

  return { success: true, bytes, periodLabel: summary.cycle.label }
}
