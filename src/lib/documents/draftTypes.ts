/**
 * Draft document types for get_draft_pdf (src/actions/draftDocuments.ts). Kept out
 * of the 'use server' module, which may only export async functions.
 */
export const DRAFT_TYPES = [
  'sow',
  'proposal',
  'invoice-copy',
  'recap',
  'statement',
  'scope-recap',
  'retainer-proposal',
  'package-recap',
] as const
export type DraftType = (typeof DRAFT_TYPES)[number]

/** Which id each type is addressed by. */
export const DRAFT_SOURCE: Record<DraftType, 'packageId' | 'clientAccountId' | 'retainerId'> = {
  sow: 'packageId',
  proposal: 'packageId',
  'invoice-copy': 'packageId',
  'package-recap': 'packageId',
  recap: 'clientAccountId',
  statement: 'clientAccountId',
  'scope-recap': 'retainerId',
  'retainer-proposal': 'retainerId',
}

/** Types that print billing numbers; Finn reviews changes to these arms. */
export const MONEY_DRAFT_TYPES: ReadonlySet<DraftType> = new Set(['invoice-copy', 'statement'])

/**
 * Hold on the money arms until Finn's one-line review (board 6ae8f92eb561c9874fff2801).
 * While false, get_draft_pdf refuses invoice-copy and statement with code `needs-review`.
 * Flip to true in its own commit once Finn signs off.
 */
export const MONEY_DRAFTS_ENABLED = false

export type DraftInput = {
  type: DraftType
  packageId?: string
  clientAccountId?: string
  retainerId?: string
  /** recap / statement: any ISO date inside the cycle. */
  ref?: string
  /** package-recap: the payment-schedule entry id. */
  entryId?: string
  /** Return the PDF bytes as base64. Off by default: they are large. */
  includeBytes?: boolean
}

export type DraftResult = {
  success: true
  draft: true
  type: DraftType
  filename: string
  mimeType: 'application/pdf'
  size: number
  sha256: string
  client: { id: string | null; name: string | null }
  sourceRef: { type: DraftType; packageId?: string; clientAccountId?: string; retainerId?: string; ref?: string; entryId?: string }
  base64?: string
}

/** Validate the id a type needs. Pure, so it is unit-tested. */
export function checkDraftInput(input: DraftInput): { ok: true; id: string } | { ok: false; error: string } {
  if (!DRAFT_TYPES.includes(input.type)) return { ok: false, error: `Unknown draft type: ${String(input.type)}` }
  if (MONEY_DRAFT_TYPES.has(input.type) && !MONEY_DRAFTS_ENABLED) {
    return { ok: false, error: `${input.type} drafts are on hold until Finn's money review (code: needs-review)` }
  }
  const key = DRAFT_SOURCE[input.type]
  const id = input[key]?.trim()
  if (!id) return { ok: false, error: `${input.type} needs ${key}` }
  if (input.type === 'package-recap' && !input.entryId?.trim()) {
    return { ok: false, error: 'package-recap needs entryId (a payment-schedule entry of the package)' }
  }
  return { ok: true, id }
}

