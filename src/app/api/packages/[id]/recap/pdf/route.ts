import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPackageRecapModel } from '@/actions/packageWork'
import { mergePackageRecap, type PackageRecapData } from '@/lib/packages/recap'
import { buildPackageRecapPdf } from '@/lib/pdf-generators'

/**
 * POST /api/packages/[id]/recap/pdf
 *
 * Body: { entryId: string; recap?: Partial<PackageRecapData> }
 *
 * Re-derives the authoritative model server-side (amounts, work items, schedule
 * position) and merges only the staff-edited narrative from the body — staff cannot
 * inject fabricated work or amounts. Returns the recap as a PDF. Staff only.
 */
export async function POST(
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

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      entryId?: string
      recap?: Partial<PackageRecapData>
    }
    if (!body.entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }

    // ── Re-derive the authoritative model, then overlay staff-edited text ────────
    const model = await getPackageRecapModel(id, body.entryId)
    if (!model.success) {
      return NextResponse.json({ error: model.error }, { status: 400 })
    }
    const merged = mergePackageRecap(model.model, body.recap)

    const pdfBytes = await buildPackageRecapPdf({ ...merged, generatedOn: new Date().toISOString() })

    return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="package-recap.pdf"',
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (err) {
    console.error('[package recap pdf]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
