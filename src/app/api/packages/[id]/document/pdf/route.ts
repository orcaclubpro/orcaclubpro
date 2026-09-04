import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import {
  buildPackageDocumentPdf,
  mergePackageSowData,
  packageToSowData,
  type BillToOverride,
  type PackageDocumentType,
} from '@/lib/packages/documents'
import type { SowFormData } from '@/lib/document-generators'

const TYPES: PackageDocumentType[] = ['proposal', 'invoice', 'sow']

/**
 * POST /api/packages/[id]/document/pdf
 *
 * Body: { type: 'proposal' | 'invoice' | 'sow'; billTo?: BillToOverride; sowData?: SowFormData }
 *
 * Renders one of a package's documents as a PDF for preview. Goes through the
 * same builder the email attachment uses, so the preview is exactly what gets
 * sent — including the bill-to override and the SOW edits staff have typed but
 * not yet saved. Staff only.
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
      type?: PackageDocumentType
      billTo?: BillToOverride | null
      sowData?: Partial<SowFormData> | null
    }
    const type = body.type ?? 'proposal'
    if (!TYPES.includes(type)) {
      return NextResponse.json({ error: 'Unknown document type' }, { status: 400 })
    }

    const pkg = await payload.findByID({ collection: 'packages', id, depth: 1 })
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

    // Unsaved SOW edits are merged over the package's own derivation so the
    // preview shows exactly what the editor currently holds.
    const sowData = type === 'sow' && body.sowData
      ? mergePackageSowData(packageToSowData(pkg), body.sowData)
      : null

    const { bytes, filename } = await buildPackageDocumentPdf(pkg, type, body.billTo, sowData)

    return new NextResponse(Buffer.from(bytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(bytes.length),
      },
    })
  } catch (err) {
    console.error('[package document pdf]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
