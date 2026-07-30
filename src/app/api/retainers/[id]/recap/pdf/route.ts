import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { getRecapModel } from '@/actions/retainers'
import { mergeRecap, type RecapData } from '@/lib/retainers/recap'
import { buildRetainerRecapPdf } from '@/lib/pdf-generators'
import type { Retainer } from '@/types/payload-types'

/**
 * POST /api/retainers/[id]/recap/pdf
 *
 * Body: { ref?: string; recap?: Partial<RecapData> }
 *
 * Re-derives the authoritative cycle model server-side (numbers, bucket hours,
 * client identity) and merges only the staff-edited narrative from the body —
 * a client can never inject fabricated hours. Returns the recap as a PDF. Staff only.
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

    // ── Parse the composer payload ───────────────────────────────────────────────
    const body = (await request.json().catch(() => ({}))) as {
      ref?: string
      recap?: Partial<RecapData>
    }

    // ── Re-derive the authoritative model, then overlay staff-edited text ────────
    const model = await getRecapModel(clientAccountId, body.ref)
    if (!model.success) {
      return NextResponse.json({ error: model.error }, { status: 400 })
    }
    const merged = mergeRecap(model.model, body.recap)

    // ── Build the PDF ─────────────────────────────────────────────────────────────
    const pdfBytes = await buildRetainerRecapPdf({ ...merged, generatedOn: new Date().toISOString() })

    return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="retainer-recap.pdf"',
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (err) {
    console.error('[retainer recap pdf]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
