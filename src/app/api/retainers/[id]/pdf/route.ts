import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { getRetainerSummary } from '@/actions/retainers'
import { buildRetainerStatementPdf } from '@/lib/pdf-generators'
import type { ClientAccount, Retainer } from '@/types/payload-types'

/** Capitalize a tier key for display (e.g. "growth" → "Growth"). */
function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await getPayload({ config })

    // ── Auth: staff only ────────────────────────────────────────────────────────
    const { user } = await payload.auth({ headers: await headers() })
    if (!user || user.role === 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Load the retainer, derive the client account id ──────────────────────────
    const { id } = await params
    const retainer = (await payload
      .findByID({ collection: 'retainers', id, depth: 0 })
      .catch(() => null)) as Retainer | null
    if (!retainer) {
      return NextResponse.json({ error: 'Retainer not found' }, { status: 404 })
    }

    const clientAccountId =
      typeof retainer.clientAccount === 'object' && retainer.clientAccount
        ? retainer.clientAccount.id
        : (retainer.clientAccount as string)
    if (!clientAccountId) {
      return NextResponse.json({ error: 'Retainer has no client account' }, { status: 404 })
    }

    // ── Load the billing-cycle summary ───────────────────────────────────────────
    const ref = new URL(request.url).searchParams.get('ref')
    const summary = await getRetainerSummary(clientAccountId, ref ?? undefined)
    if (!summary.success) {
      return NextResponse.json({ error: summary.error }, { status: 400 })
    }
    if (!summary.cycle || !summary.terms) {
      return NextResponse.json({ error: 'No active retainer cycle to report' }, { status: 404 })
    }

    // ── Client header details ────────────────────────────────────────────────────
    const account = (await payload
      .findByID({ collection: 'client-accounts', id: clientAccountId, depth: 0 })
      .catch(() => null)) as ClientAccount | null
    const clientName = account?.name ?? 'Client'
    const clientCompany = account?.company ?? null

    // ── Build the PDF ─────────────────────────────────────────────────────────────
    const pdfBytes = await buildRetainerStatementPdf({
      clientName,
      clientCompany,
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
      })),
      totals: {
        used: summary.totals.used,
        remaining: summary.totals.remaining,
        overageHours: summary.totals.overageHours,
        overageAmount: summary.totals.overageAmount,
      },
      generatedOn: new Date().toISOString(),
    })

    return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="retainer-statement.pdf"',
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (err) {
    console.error('[retainer pdf]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
