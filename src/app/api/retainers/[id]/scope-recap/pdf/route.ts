import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { buildScopeRecapPdfFor } from '@/actions/retainers'
import type { ScopeRecapData } from '@/lib/retainers/scopeRecap'

/**
 * POST /api/retainers/[id]/scope-recap/pdf
 *
 * Body: { recap?: Partial<ScopeRecapData> }
 *
 * The scope recap is the document that backs a proposal — what has already been
 * delivered and what is planned next, before anything is billable. The authoritative
 * model is re-derived server-side and only the staff-edited narrative from the body is
 * merged over it, so hours and work items can never be injected. Staff only.
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
    const body = (await request.json().catch(() => ({}))) as { recap?: Partial<ScopeRecapData> }

    const built = await buildScopeRecapPdfFor(id, body.recap)
    if (!built.success) {
      return NextResponse.json({ error: built.error }, { status: 400 })
    }

    return new NextResponse(Buffer.from(built.bytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="scope-recap.pdf"',
        'Content-Length': String(built.bytes.length),
      },
    })
  } catch (err) {
    console.error('[scope recap pdf]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
