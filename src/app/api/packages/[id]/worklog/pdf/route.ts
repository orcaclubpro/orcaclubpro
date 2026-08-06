import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPackageWorkSummary } from '@/actions/packageWork'
import { buildPackageWorkLogPdf, type PackageWorkLogData } from '@/lib/pdf-generators'

/**
 * The package work-log sheet — the milestone counterpart to the retainer statement
 * (`/api/retainers/[id]/pdf`). A GET so the console can `window.open()` it directly.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })

    // ── Auth: staff only ────────────────────────────────────────────────────────
    const { user } = await payload.auth({ headers: await headers() })
    if (!user || user.role === 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Load the work summary ───────────────────────────────────────────────────
    const { id } = await params
    const summary = await getPackageWorkSummary(id)
    if (!summary.success) {
      return NextResponse.json({ error: summary.error }, { status: 400 })
    }

    // Pending + billed are both logged work — one table, date-ordered.
    const entries: PackageWorkLogData['entries'] = [...summary.pending, ...summary.billed]
      .map((e) => ({
        date: e.date,
        description: e.description,
        hours: e.hours,
        category: e.category,
        status: e.status,
        completion: e.completion,
        billedOrderId: e.billedOrderId,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const planned: PackageWorkLogData['entries'] = summary.planned.map((e) => ({
      date: e.date,
      description: e.description,
      hours: e.hours,
      category: e.category,
      status: e.status,
      completion: e.completion,
      billedOrderId: e.billedOrderId,
    }))

    const pdfBytes = await buildPackageWorkLogPdf({
      clientName: summary.package.clientName,
      clientCompany: summary.package.clientCompany,
      packageName: summary.package.name,
      entries: [...entries, ...planned],
      schedule: summary.schedule.map((s) => ({
        label: s.label,
        amount: s.amount,
        dueDate: s.dueDate,
        invoiced: Boolean(s.orderId && s.invoicedAt),
        paid: s.paid,
      })),
      totals: {
        loggedCount: entries.length,
        totalHours: entries.reduce((sum, e) => sum + (e.hours ?? 0), 0),
        pendingCount: summary.pending.length,
        plannedOpenCount: summary.planned.filter((p) => p.completion !== 'complete').length,
      },
      generatedOn: new Date().toISOString(),
    })

    return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="package-work-log.pdf"',
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (err) {
    console.error('[package worklog pdf]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
