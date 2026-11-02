'use server'

/**
 * Draft documents for review: every existing document builder, reached from one
 * switch and stamped DRAFT (src/lib/pdf/draftStamp.ts).
 *
 * Wrapped by the MCP tool get_draft_pdf. Rules:
 *
 * - **Render only.** No order, invoice, Stripe object, file row or email is
 *   created. The human send actions (sendProposalEmail, sendRetainerRecapEmail,
 *   sendDocumentEmail) build their own clean bytes and stay the only way a
 *   document reaches a client.
 * - **Numbers are derived on read.** Each arm calls the same model and builder the
 *   staff preview route uses (getRecapModel + mergeRecap, getPackageSowDraft,
 *   buildRetainerStatementPdfFor, ...), so a draft can never quote a number the
 *   app would not.
 * - **Staff only.** This module is 'use server', so its exports are public
 *   endpoints: the role check below gates them, and each underlying model repeats
 *   its own check.
 *
 * Money note (Finn): `invoice-copy`, `statement`, `proposal`, `retainer-proposal`
 * and `sow` render prices exactly as the staff preview does. Reading them is not
 * a write and the money guard is unchanged.
 */
import { createHash } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'

import { getCurrentUser } from '@/actions/auth'
import { getPackageSowDraft } from '@/actions/packages'
import { getPackageRecapModel } from '@/actions/packageWork'
import { buildProposalPdfFor, buildScopeRecapPdfFor, getRecapModel } from '@/actions/retainers'
import { buildPackageDocumentPdf } from '@/lib/packages/documents'
import { mergePackageRecap } from '@/lib/packages/recap'
import { buildPackageRecapPdf, buildRetainerRecapPdf } from '@/lib/pdf-generators'
import { draftFilename, stampDraftPdf } from '@/lib/pdf/draftStamp'
import { mergeRecap } from '@/lib/retainers/recap'
import { buildRetainerStatementPdfFor } from '@/lib/retainers/statementPdf'
import type { SowFormData } from '@/lib/document-generators'
import {
  checkDraftInput,
  DRAFT_SOURCE,
  type DraftInput,
  type DraftResult,
} from '@/lib/documents/draftTypes'

type Fail = { success: false; error: string }
const fail = (error: string): Fail => ({ success: false, error })

const idOf = (v: unknown): string | null =>
  v == null ? null : typeof v === 'object' ? (((v as { id?: unknown }).id as string | undefined) ?? null) : String(v)

const slug = (s: string | null | undefined, fallback: string) =>
  (s ?? '').trim().replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || fallback

async function clientOf(
  payload: Awaited<ReturnType<typeof getPayload>>,
  input: DraftInput,
): Promise<{ id: string | null; name: string | null }> {
  let clientId: string | null = input.clientAccountId ?? null
  if (!clientId && input.packageId) {
    const pkg = await payload.findByID({ collection: 'packages', id: input.packageId, depth: 0 }).catch(() => null)
    clientId = idOf((pkg as any)?.clientAccount)
  }
  if (!clientId && input.retainerId) {
    const r = await payload.findByID({ collection: 'retainers', id: input.retainerId, depth: 0 }).catch(() => null)
    clientId = idOf((r as any)?.clientAccount)
  }
  if (!clientId) return { id: null, name: null }
  const account = await payload.findByID({ collection: 'client-accounts', id: clientId, depth: 0 }).catch(() => null)
  return { id: clientId, name: ((account as any)?.company || (account as any)?.name) ?? null }
}

/** Render one document as a DRAFT-stamped PDF. Staff only; render only. */
export async function getDraftPdf(input: DraftInput): Promise<DraftResult | Fail> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'user')) return fail('Unauthorized')

    const check = checkDraftInput(input)
    if (!check.ok) return fail(check.error)
    const id = check.id
    const payload = await getPayload({ config })

    let bytes: Uint8Array
    let filename: string

    switch (input.type) {
      case 'sow': {
        // getPackageSowDraft: saved wording + package-owned money + project milestones.
        const draft = await getPackageSowDraft(id)
        if (!draft.success) return fail(draft.error)
        const pkg = await payload.findByID({ collection: 'packages', id, depth: 1 })
        ;({ bytes, filename } = await buildPackageDocumentPdf(pkg, 'sow', null, draft.sowData as SowFormData))
        break
      }
      case 'proposal':
      case 'invoice-copy': {
        const pkg = await payload.findByID({ collection: 'packages', id, depth: 1 }).catch(() => null)
        if (!pkg) return fail('Package not found')
        ;({ bytes, filename } = await buildPackageDocumentPdf(
          pkg,
          input.type === 'proposal' ? 'proposal' : 'invoice',
        ))
        break
      }
      case 'package-recap': {
        const model = await getPackageRecapModel(id, input.entryId!.trim())
        if (!model.success) return fail(model.error)
        const merged = mergePackageRecap(model.model, null)
        bytes = await buildPackageRecapPdf({ ...merged, generatedOn: new Date().toISOString() })
        filename = `Recap_${slug(merged.packageName, 'package')}_${slug(merged.paymentLabel, 'payment')}.pdf`
        break
      }
      case 'recap': {
        // getRecapModel already layers any saved recap draft over derived numbers.
        const model = await getRecapModel(id, input.ref)
        if (!model.success) return fail(model.error)
        const merged = mergeRecap(model.model, null)
        bytes = await buildRetainerRecapPdf({ ...merged, generatedOn: new Date().toISOString() })
        filename = `Recap_${slug(merged.clientName, 'client')}_${slug(merged.periodLabel, 'cycle')}.pdf`
        break
      }
      case 'statement': {
        const built = await buildRetainerStatementPdfFor(id, input.ref)
        if (!built.success) return fail(built.error)
        bytes = built.bytes
        filename = `Statement_${slug(built.periodLabel, 'cycle')}.pdf`
        break
      }
      case 'scope-recap': {
        const built = await buildScopeRecapPdfFor(id, null)
        if (!built.success) return fail(built.error)
        bytes = built.bytes
        filename = `Scope_Recap_${slug(built.merged.clientName, 'client')}.pdf`
        break
      }
      case 'retainer-proposal': {
        const built = await buildProposalPdfFor(id)
        if (!built.success) return fail(built.error)
        bytes = built.bytes
        filename = `Retainer_Proposal_${id.slice(-6).toUpperCase()}.pdf`
        break
      }
    }

    const stamped = await stampDraftPdf(bytes)
    const client = await clientOf(payload, input)
    const sourceRef: DraftResult['sourceRef'] = { type: input.type, [DRAFT_SOURCE[input.type]]: id }
    if (input.ref) sourceRef.ref = input.ref
    if (input.entryId) sourceRef.entryId = input.entryId

    return {
      success: true,
      draft: true,
      type: input.type,
      filename: draftFilename(filename),
      mimeType: 'application/pdf',
      size: stamped.length,
      sha256: createHash('sha256').update(stamped).digest('hex'),
      client,
      sourceRef,
      ...(input.includeBytes ? { base64: Buffer.from(stamped).toString('base64') } : {}),
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Draft generation failed')
  }
}
