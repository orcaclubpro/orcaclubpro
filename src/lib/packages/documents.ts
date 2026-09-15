import type { SowFormData, SowScopeItem } from '@/lib/document-generators'
import { DEFAULT_HOURLY_RATE, normalizeSowItems } from '@/lib/sow/clauses'
import { buildPackagePdf, buildOrcaclubSowPdf } from '@/lib/pdf-generators'

/** The three renderings of a package: the pitch, a straight invoice copy, and the contract. */
export type PackageDocumentType = 'proposal' | 'invoice' | 'sow'

export interface BillToOverride {
  name: string
  company?: string
  email: string
  phone?: string
  address: { line1: string; line2?: string; city: string; state: string; zip: string }
}

/** A bill-to override is only applied when every required field is filled in. */
export function isBillToComplete(b?: BillToOverride | null): b is BillToOverride {
  return !!(
    b &&
    b.name?.trim() &&
    b.email?.trim() &&
    b.address?.line1?.trim() &&
    b.address?.city?.trim() &&
    b.address?.state?.trim() &&
    b.address?.zip?.trim()
  )
}

export interface ResolvedBillTo {
  name?: string
  company?: string
  email?: string
  phone?: string
  address?: { line1?: string; line2?: string; city?: string; state?: string; zip?: string }
}

/**
 * Resolve the effective bill-to for a package document: the manual override wins
 * only when it is fully filled in, otherwise the client account's saved details.
 * Overriding replaces the block wholesale — never field-by-field.
 */
export function resolvePackageBillTo(pkg: any, billTo?: BillToOverride | null): ResolvedBillTo {
  const clientAccount = pkg?.clientAccount
  const client = clientAccount && typeof clientAccount === 'object' ? clientAccount : null
  const override = isBillToComplete(billTo) ? billTo : null
  return override
    ? {
        name: override.name,
        company: override.company?.trim() || undefined,
        email: override.email,
        phone: override.phone?.trim() || undefined,
        address: override.address,
      }
    : {
        name: client?.name ?? undefined,
        company: client?.company ?? undefined,
        email: client?.email ?? undefined,
        phone: client?.phone ?? undefined,
        address: client?.address ?? undefined,
      }
}

/** Same reference format the print page uses (PKG-XXXXXX). */
export function packageRef(packageId: string) {
  return `PKG-${packageId.slice(-6).toUpperCase()}`
}

/**
 * Best-effort parse of a package's `notes` field back into SOW milestones + terms.
 * Packages created via createPackageFromSow store notes in a known shape
 * ("Milestones:\n…\n\nTerms:\n…"); freeform notes fall back to defaults.
 */
function parseSowExtrasFromNotes(notes?: string | null) {
  const extras = {
    milestones: [] as Array<{ name: string; date: string; notes: string }>,
    netDays: '30',
    lateFee: '1.5',
    revisionRounds: '2',
    revisionRate: '',
    // Blank, not a guess. These print in the fees section of a retainer
    // contract, so a default invents a term nobody agreed to; an empty one
    // falls through to the package's own recurring interval and to prose that
    // reads correctly with no term stated at all.
    contractTerm: '',
    billingCycle: '',
  }
  if (!notes) return extras

  const msBlock = notes.match(/Milestones:\n([\s\S]*?)(?:\n\n|$)/)
  if (msBlock) {
    for (const line of msBlock[1].split('\n').map(l => l.trim()).filter(Boolean)) {
      const date = line.match(/\(([^)]+)\)/)?.[1] ?? ''
      const note = line.match(/—\s*(.+)$/)?.[1] ?? ''
      const name = line.replace(/\s*\([^)]*\)/, '').replace(/\s*—.*$/, '').trim()
      if (name) extras.milestones.push({ name, date, notes: note })
    }
  }

  const termsBlock = notes.match(/Terms:\n([\s\S]*)$/)
  if (termsBlock) {
    const t = termsBlock[1]
    extras.netDays = t.match(/Net Days:\s*(\d+)/)?.[1] ?? extras.netDays
    extras.lateFee = t.match(/Late Fee:\s*([\d.]+)/)?.[1] ?? extras.lateFee
    const rev = t.match(/Revisions:\s*(\d+)\s*rounds(?:\s*@\s*\$([\d.]+))?/)
    if (rev) { extras.revisionRounds = rev[1]; if (rev[2]) extras.revisionRate = rev[2] }
    extras.contractTerm = t.match(/Term:\s*(.+)/)?.[1]?.trim() ?? extras.contractTerm
    extras.billingCycle = t.match(/Billing:\s*(.+)/)?.[1]?.trim() ?? extras.billingCycle
  }

  return extras
}

/** Map a package/proposal document to a SOW form payload (inverse of createPackageFromSow). */
export function packageToSowData(pkg: any): SowFormData {
  // A SOW is a contract, so add-ons are excluded outright — an option the client has
  // not taken must never appear as agreed, priced scope.
  const lineItems = ((pkg.lineItems ?? []) as any[]).filter((i: any) => !i.isAddOn)
  const amountOf = (item: any) => (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1)

  // Fold the optional line description into the SOW's Description cell so it
  // carries through to the contract PDF (SowLineItem is just desc + amount).
  const descOf = (i: any) =>
    i.description?.trim() ? `${i.name} — ${i.description.trim()}` : (i.name as string)
  const projectItems = lineItems
    .filter(i => !i.isRecurring)
    .map(i => ({ desc: descOf(i), amount: String(amountOf(i)) }))
  const retainerItems = lineItems
    .filter(i => i.isRecurring)
    .map(i => ({ desc: descOf(i), amount: String(amountOf(i)) }))

  const pricingType: SowFormData['pricingType'] =
    projectItems.length && retainerItems.length ? 'both'
    : retainerItems.length ? 'retainer'
    : 'project'

  // Scope = the services, taken from the cover message's numbered list. Falls
  // back to the line items so the section is never empty.
  const coverLines = (pkg.coverMessage ?? '')
    .split('\n')
    .map((l: string) => l.replace(/^\s*\d+\.\s*/, '').trim())
    .filter(Boolean)
  const scopeItems: SowScopeItem[] = coverLines.length
    ? coverLines.map((title: string) => ({ title, description: '' }))
    : lineItems.map(i => ({ title: i.name as string, description: (i.description ?? '').trim() }))
        .filter(i => i.title)

  // Deliverables = the priced line items, carrying the description staff already
  // wrote in the package builder rather than asking for it twice.
  const deliverables: SowScopeItem[] = lineItems
    .map(i => ({ title: i.name as string, description: (i.description ?? '').trim() }))
    .filter(i => i.title)

  // Payment schedule: convert stored dollar amounts back to percentages.
  // The SOW PDF computes each installment's dollar amount off the project-items
  // subtotal (or retainer subtotal when retainer-only), so use that same base
  // here for an exact round-trip.
  const projectTotal = projectItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const retainerTotal = retainerItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const scheduleBase = pricingType === 'retainer' ? retainerTotal : projectTotal
  // The package's schedule is authoritative, so each entry carries its exact
  // amount. The percentage is kept for display only — deriving dollars back out
  // of a rounded percentage is how the contract ends up quoting a figure the
  // client never saw.
  const schedule = (pkg.paymentSchedule ?? []) as any[]
  const paymentSchedule = schedule.length
    ? schedule.map(e => ({
        label: e.label ?? '',
        pct: scheduleBase > 0 ? String(Math.round((e.amount ?? 0) / scheduleBase * 100)) : '',
        note: '',
        amount: String(e.amount ?? 0),
      }))
    : [
        { label: 'Deposit', pct: '50', note: 'Due before work begins' },
        { label: 'Final Payment', pct: '50', note: 'Due upon project completion' },
      ]

  const extras = parseSowExtrasFromNotes(pkg.notes)
  const client = pkg.clientAccount && typeof pkg.clientAccount === 'object' ? pkg.clientAccount : null

  // How often the retainer bills is already on the line items — reading it there
  // beats scraping the freeform notes, which only carry it for packages that
  // came from `createPackageFromSow` in the first place.
  const recurringInterval = lineItems.find(i => i.isRecurring)?.recurringInterval
  const derivedBillingCycle = recurringInterval === 'year' ? 'Annually' : 'Monthly'

  return {
    providerName: 'ORCACLUB',
    providerContact: 'team@orcaclub.pro',
    clientName: client?.name ?? client?.company ?? '',
    clientContact: client?.email ?? client?.phone ?? '',
    effectiveDate: new Date().toISOString().split('T')[0],
    projectName: pkg.name ?? '',
    projectOverview: pkg.description ?? '',
    scopeItems,
    deliverables,
    milestones: extras.milestones.length ? extras.milestones : [{ name: '', date: '', notes: '' }],
    pricingType,
    projectItems: projectItems.length ? projectItems : [{ desc: '', amount: '' }],
    retainerItems: retainerItems.length ? retainerItems : [{ desc: '', amount: '' }],
    billingCycle: extras.billingCycle || (retainerItems.length ? derivedBillingCycle : ''),
    contractTerm: extras.contractTerm,
    netDays: extras.netDays,
    paymentSchedule,
    lateFee: extras.lateFee,
    revisionRounds: extras.revisionRounds,
    revisionRate: extras.revisionRate,
    // Same defaults the SOW builder seeds a blank form with, so a package-driven
    // SOW and a hand-built one come out of the clause registry identically. The
    // rate is the one exception: a package built from a SOW that stated its own
    // rate carries it in the notes, and that survives the round-trip.
    hourlyRate: extras.revisionRate || DEFAULT_HOURLY_RATE,
    warrantyDays: '30',
    acceptanceDays: '7',
    stallDays: '30',
    reactivationFee: '500',
    liabilityFloor: '1000',
    venueCounty: 'Orange County',
  }
}

/**
 * Fields the package owns outright. A saved SOW document keeps its staff-written
 * wording, but the client, the project, and every number always follow the
 * package — otherwise editing a line item on the proposal would leave the
 * contract quoting last week's prices.
 */
const PACKAGE_OWNED_SOW_FIELDS = [
  'clientName',
  'projectName',
  'pricingType',
  'projectItems',
  'retainerItems',
  'paymentSchedule',
] as const

/**
 * Item lists the package seeds and the document then owns.
 *
 * The package derives the first draft of these, but once a SOW document exists
 * they are staff prose: a line retitled for the contract is a deliberate edit,
 * not a stale copy of a line item, and re-deriving them threw those edits away
 * on every reload. The money still follows the package — pricing, the payment
 * schedule, and the client are in PACKAGE_OWNED_SOW_FIELDS — and the SOW editor
 * offers an explicit reset back to the package's own lists.
 */
const DOCUMENT_OWNED_SOW_ITEMS = ['scopeItems', 'deliverables'] as const

/**
 * Combine a package's derived SOW with the wording saved on its SOW document.
 * The document wins for everything staff wrote; the package wins for the client,
 * the project, and the money.
 */
export function mergePackageSowData(
  derived: SowFormData,
  saved: Partial<SowFormData> | null | undefined,
): SowFormData {
  if (!saved) return derived
  const merged = { ...derived, ...saved } as SowFormData
  for (const field of PACKAGE_OWNED_SOW_FIELDS) {
    ;(merged as any)[field] = (derived as any)[field]
  }
  for (const field of DOCUMENT_OWNED_SOW_ITEMS) {
    // Normalized on the way through: documents saved before items carried
    // descriptions hold plain strings. An empty saved list falls back to the
    // package rather than printing a contract with no scope.
    const savedItems = normalizeSowItems((saved as any)[field])
    ;(merged as any)[field] = savedItems.length ? savedItems : (derived as any)[field]
  }
  return merged
}

/**
 * The SOW data a stored file actually renders as.
 *
 * A SOW generated from a package is only half a document on its own: the client,
 * the project, the pricing, and the payment schedule live on the package and are
 * merged in on every read. Anything that renders or sends a file's `documentData`
 * directly — the Files tab's preview, its send action — was skipping that and
 * emailing contracts quoting whatever was true at the last save. Every reader
 * goes through here instead.
 *
 * Files with no package behind them (the standalone SOW builder) pass through
 * untouched.
 */
export async function resolveFileSowData(
  payload: any,
  file: any,
): Promise<SowFormData> {
  const data = (file?.documentData ?? {}) as SowFormData

  const linked = file?.packageRef
  let packageId: string | null =
    typeof linked === 'string' ? linked : linked?.id ? String(linked.id) : null

  // Documents created before `packageRef` existed only carry the forward link, so
  // fall back to the inverse and heal the record on the way past.
  if (!packageId && file?.id) {
    const { docs } = await payload
      .find({
        collection: 'packages',
        where: { sowDocument: { equals: file.id } },
        depth: 0,
        limit: 1,
      })
      .catch(() => ({ docs: [] as any[] }))
    if (docs.length > 0) {
      packageId = String(docs[0].id)
      await payload
        .update({ collection: 'files', id: file.id, data: { packageRef: packageId } as any })
        .catch(() => null)
    }
  }

  if (!packageId) return data

  const pkg = await payload
    .findByID({ collection: 'packages', id: packageId, depth: 1 })
    .catch(() => null)
  if (!pkg) return data

  return mergePackageSowData(packageToSowData(pkg), data)
}

const fmtPdfDate = (iso: string) => {
  const parts = iso.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return iso
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(parts[0], parts[1] - 1, parts[2]))
}

/**
 * Render one of a package's documents as a PDF. The single source of truth for
 * document bytes — the Documents modal previews exactly what an email attaches,
 * because both go through here.
 */
export async function buildPackageDocumentPdf(
  pkg: any,
  type: PackageDocumentType,
  billTo?: BillToOverride | null,
  /**
   * The package's edited Scope of Work — terms and clause overrides from its
   * linked SOW document. Omit to render the standard text derived from the
   * package alone.
   */
  sowData?: SowFormData | null,
): Promise<{ bytes: Uint8Array; filename: string }> {
  if (type === 'sow') {
    return {
      bytes: await buildOrcaclubSowPdf(sowData ?? packageToSowData(pkg)),
      filename: `SOW_${String(pkg.name ?? 'package').replace(/\s+/g, '_')}.pdf`,
    }
  }

  const bt = resolvePackageBillTo(pkg, billTo)
  const ref = packageRef(String(pkg.id))
  const allLineItems = (pkg.lineItems ?? []) as any[]

  const bytes = await buildPackagePdf({
    sendAs: type,
    ref,
    packageName: pkg.name,
    dateLabel: new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()),
    clientLines: [
      bt.name,
      bt.company,
      bt.address?.line1,
      bt.address?.line2,
      [bt.address?.city, bt.address?.state, bt.address?.zip].filter(Boolean).join(', ') || null,
      bt.email,
    ].filter(Boolean) as string[],
    description: pkg.description ?? null,
    coverMessage: pkg.coverMessage ?? null,
    // The PDF gets BOTH — it renders add-ons in their own section under the
    // total, so it needs the unfiltered list.
    lineItems: allLineItems.map((item: any) => ({
      name: item.name,
      description: item.description ?? null,
      quantity: item.quantity ?? 1,
      rate: item.adjustedPrice ?? item.price ?? 0,
      isAddOn: Boolean(item.isAddOn),
      isRecurring: item.isRecurring ?? false,
      recurringInterval: item.recurringInterval ?? undefined,
    })),
    paymentSchedule: (pkg.paymentSchedule ?? []).map((e: any) => ({
      label: e.label,
      amount: e.amount,
      dueDateLabel: e.dueDate ? fmtPdfDate(e.dueDate) : null,
    })),
  })

  return {
    bytes,
    filename: type === 'invoice'
      ? `Invoice_${ref}.pdf`
      : `Proposal_${String(pkg.name ?? 'package').replace(/\s+/g, '_')}.pdf`,
  }
}
