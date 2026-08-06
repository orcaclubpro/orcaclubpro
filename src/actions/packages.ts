'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { SowFormData } from '@/lib/document-generators'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { assertOrderPersisted, createStripeInvoiceForOrder } from '@/lib/stripe/invoices'
import {
  sendGenericInvoiceEmail,
  sendInvoiceCopyToAddresses,
  sendPaymentScheduleEmail,
  sendProposalEmailToAddresses,
  sendSowToAddresses,
  generateProposalEmail,
  generateProposalEmailText,
  type EmailAttachment,
} from '@/lib/payload/utils/genericInvoiceEmailTemplate'
import { buildPackagePdf, buildOrcaclubSowPdf, buildPackageRecapPdf } from '@/lib/pdf-generators'
import { buildWorkLines, type WorkCategory } from '@/lib/packages/workLines'
import { mergePackageRecap, type PackageRecapData } from '@/lib/packages/recap'
import { getPackageRecapModel } from '@/actions/packageWork'

const APP_BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://app.orcaclub.pro'

/** Resolve the portal username for a client account — needed to build print URLs. */
async function getClientUsername(
  payload: Awaited<ReturnType<typeof getPayload>>,
  clientAccountId: string,
): Promise<string | null> {
  try {
    const { docs } = await payload.find({
      collection: 'users',
      where: { clientAccount: { equals: clientAccountId } },
      depth: 0,
      limit: 1,
    })
    return (docs[0] as any)?.username ?? null
  } catch {
    return null
  }
}

/**
 * Resolve an Order invoiceType from a payment-schedule entry.
 * Prefers the explicit entryType field; falls back to the legacy label heuristic
 * for entries created before entryType existed.
 */
function resolveInvoiceType(entry: {
  entryType?: string | null
  label?: string | null
}): 'deposit' | 'installment' | 'balance' {
  if (entry.entryType === 'deposit' || entry.entryType === 'installment' || entry.entryType === 'balance') {
    return entry.entryType
  }
  const label = (entry.label ?? '').toLowerCase()
  if (label.includes('deposit')) return 'deposit'
  if (label.includes('final') || label.includes('balance')) return 'balance'
  return 'installment'
}

/**
 * Legacy INV-NNNN generator. Now used ONLY for placeholder orders that are NOT
 * backed by a Stripe invoice (see linkScheduleEntriesToOrders). Every real
 * invoiced order takes its number from the finalized Stripe invoice
 * (`invoice.number`) instead, so those two never share a numbering scheme.
 */
async function nextOrderNumber(payload: Awaited<ReturnType<typeof getPayload>>): Promise<string> {
  const { docs } = await payload.find({
    collection: 'orders',
    sort: '-orderNumber',
    limit: 10,
    depth: 0,
  })
  let max = 0
  for (const o of docs) {
    const m = (o.orderNumber ?? '').match(/^INV-(\d+)$/)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > max) max = n
    }
  }
  return `INV-${String(max + 1).padStart(4, '0')}`
}

export async function createPackage({
  name,
  description,
  coverMessage,
  notes,
  lineItems,
}: {
  name: string
  description?: string
  coverMessage?: string
  notes?: string
  lineItems: Array<{
    name: string
    description?: string
    price: number
    quantity?: number
    isRecurring?: boolean
    recurringInterval?: 'month' | 'year'
    stripePriceId?: string
  }>
}) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Clients cannot create packages' }

    const payload = await getPayload({ config })

    const pkg = await payload.create({
      collection: 'packages',
      data: {
        name,
        description,
        coverMessage,
        notes,
        lineItems,
        type: 'template',
        status: 'draft',
      },
    })

    return { success: true, package: pkg }
  } catch (error) {
    console.error('[createPackage]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create package' }
  }
}

export async function createPackageFromSow(
  sowData: SowFormData,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Clients cannot create packages' }

    const payload = await getPayload({ config })

    const name = sowData.projectName.trim() || sowData.clientName.trim() || 'New Package'
    const description = sowData.projectOverview || undefined

    // Scope items → coverMessage
    const scopeLines = sowData.scopeItems.filter(s => s.trim())
    const coverMessage = scopeLines.length > 0
      ? scopeLines.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : undefined

    // Milestones + terms → notes
    const milestoneLines = sowData.milestones
      .filter(m => m.name.trim())
      .map(m => {
        const parts = [m.name]
        if (m.date) parts.push(`(${m.date})`)
        if (m.notes) parts.push(`— ${m.notes}`)
        return parts.join(' ')
      })
    const termsLines = [
      `Net Days: ${sowData.netDays || '30'}`,
      `Late Fee: ${sowData.lateFee || '1.5'}%/mo`,
      `Revisions: ${sowData.revisionRounds || '2'} rounds${sowData.revisionRate ? ` @ $${sowData.revisionRate}/hr` : ''}`,
      sowData.contractTerm ? `Term: ${sowData.contractTerm}` : '',
      sowData.pricingType !== 'project' && sowData.billingCycle ? `Billing: ${sowData.billingCycle}` : '',
    ].filter(Boolean)
    const notesSections = [
      milestoneLines.length > 0 ? `Milestones:\n${milestoneLines.join('\n')}` : '',
      termsLines.length > 0 ? `Terms:\n${termsLines.join('\n')}` : '',
    ].filter(Boolean)
    const notes = notesSections.length > 0 ? notesSections.join('\n\n') : undefined

    // Line items
    const lineItems: Array<{
      name: string
      price: number
      quantity: number
      isRecurring: boolean
      recurringInterval?: 'month' | 'year'
    }> = []

    if (sowData.pricingType === 'project' || sowData.pricingType === 'both') {
      for (const item of sowData.projectItems.filter(i => i.desc.trim())) {
        lineItems.push({ name: item.desc, price: parseFloat(item.amount) || 0, quantity: 1, isRecurring: false })
      }
    }
    if (sowData.pricingType === 'retainer' || sowData.pricingType === 'both') {
      for (const item of sowData.retainerItems.filter(i => i.desc.trim())) {
        lineItems.push({ name: item.desc, price: parseFloat(item.amount) || 0, quantity: 1, isRecurring: true, recurringInterval: 'month' })
      }
    }

    // Payment schedule — convert percentages to dollar amounts
    const total = lineItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const paymentSchedule = sowData.paymentSchedule
      .filter(e => e.label.trim())
      .map(e => ({
        label: e.label,
        amount: Math.round(total * (parseFloat(e.pct) || 0) / 100 * 100) / 100,
      }))

    const pkg = await payload.create({
      collection: 'packages',
      data: {
        name,
        description,
        coverMessage,
        notes,
        lineItems,
        paymentSchedule,
        type: 'template',
        status: 'draft',
      },
    })

    return { success: true, id: pkg.id }
  } catch (error) {
    console.error('[createPackageFromSow]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create package' }
  }
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
    contractTerm: '3 months',
    billingCycle: 'Monthly',
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
function packageToSowData(pkg: any): SowFormData {
  const lineItems = (pkg.lineItems ?? []) as any[]
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

  // Scope items: prefer the cover message (numbered list), else fall back to
  // the line-item names so the scope section isn't empty.
  const coverLines = (pkg.coverMessage ?? '')
    .split('\n')
    .map((l: string) => l.replace(/^\s*\d+\.\s*/, '').trim())
    .filter(Boolean)
  const scopeItems: string[] = coverLines.length
    ? coverLines
    : lineItems.map(i => i.name as string).filter(Boolean)

  // Payment schedule: convert stored dollar amounts back to percentages.
  // The SOW PDF computes each installment's dollar amount off the project-items
  // subtotal (or retainer subtotal when retainer-only), so use that same base
  // here for an exact round-trip.
  const projectTotal = projectItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const retainerTotal = retainerItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const scheduleBase = pricingType === 'retainer' ? retainerTotal : projectTotal
  const schedule = (pkg.paymentSchedule ?? []) as any[]
  const paymentSchedule = schedule.length
    ? schedule.map(e => ({
        label: e.label ?? '',
        pct: scheduleBase > 0 ? String(Math.round((e.amount ?? 0) / scheduleBase * 100)) : '',
        note: '',
      }))
    : [
        { label: 'Deposit', pct: '50', note: 'Due before work begins' },
        { label: 'Final Payment', pct: '50', note: 'Due upon project completion' },
      ]

  const extras = parseSowExtrasFromNotes(pkg.notes)
  const client = pkg.clientAccount && typeof pkg.clientAccount === 'object' ? pkg.clientAccount : null

  return {
    providerName: 'ORCACLUB',
    providerContact: 'team@orcaclub.pro',
    clientName: client?.name ?? client?.company ?? '',
    clientContact: client?.email ?? client?.phone ?? '',
    effectiveDate: new Date().toISOString().split('T')[0],
    projectName: pkg.name ?? '',
    projectOverview: pkg.description ?? '',
    scopeItems: scopeItems.length ? scopeItems : [''],
    milestones: extras.milestones.length ? extras.milestones : [{ name: '', date: '', notes: '' }],
    pricingType,
    projectItems: projectItems.length ? projectItems : [{ desc: '', amount: '' }],
    retainerItems: retainerItems.length ? retainerItems : [{ desc: '', amount: '' }],
    billingCycle: extras.billingCycle,
    contractTerm: extras.contractTerm,
    netDays: extras.netDays,
    paymentSchedule,
    lateFee: extras.lateFee,
    revisionRounds: extras.revisionRounds,
    revisionRate: extras.revisionRate,
  }
}

/**
 * Create a Scope of Work document (files collection) prefilled from a package's
 * line items, client, and terms. The document opens editable in the Files tab's
 * SOW builder for final review before generating the contract PDF.
 */
export async function createSowFromPackage(packageId: string, projectId?: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!pkg) return { success: false, error: 'Package not found' }

    const sowData = packageToSowData(pkg)

    const linkedProjectId =
      projectId ??
      (typeof (pkg as any).projectRef === 'string'
        ? (pkg as any).projectRef
        : (pkg as any).projectRef?.id) ??
      undefined

    const doc = await payload.create({
      collection: 'files',
      data: {
        name: `SOW — ${pkg.name}`,
        description: `Scope of Work generated from package "${pkg.name}"`,
        fileType: 'document',
        documentTemplate: 'sow',
        documentBrand: 'orcaclub',
        documentData: sowData,
        ...(linkedProjectId ? { project: linkedProjectId } : {}),
      } as any,
    })

    revalidatePath(`/u/${user.username}/files`)

    return { success: true, id: doc.id }
  } catch (error) {
    console.error('[createSowFromPackage]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create SOW' }
  }
}

export async function assignPackageToClient({
  packageId,
  clientAccountId,
  proposalName,
}: {
  packageId: string
  clientAccountId: string
  proposalName?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Clients cannot assign packages' }

    const payload = await getPayload({ config })

    const template = await payload.findByID({
      collection: 'packages',
      id: packageId,
      depth: 0,
    })

    if (!template || template.type !== 'template') {
      return { success: false, error: 'Package template not found' }
    }

    const proposal = await payload.create({
      collection: 'packages',
      data: {
        name: proposalName?.trim() || template.name,
        description: template.description,
        coverMessage: template.coverMessage,
        notes: template.notes,
        type: 'proposal',
        status: 'draft',
        clientAccount: clientAccountId,
        sourcePackage: packageId,
        // Start with every template option selected — staff usually keep all
        // of them and can still uncheck in the proposal editor
        lineItems: (template.lineItems ?? []).map(({ id: _id, ...item }: any) => item),
      } as any,
    })

    revalidatePath(`/u/${user.username}/clients/${clientAccountId}`)

    return { success: true, proposal }
  } catch (error) {
    console.error('[assignPackageToClient]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to assign package' }
  }
}

export async function getPackages() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, packages: [] as any[], error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'packages',
      where: { type: { equals: 'template' } },
      sort: '-updatedAt',
      limit: 100,
      depth: 0,
    })

    return { success: true, packages: docs }
  } catch (error) {
    console.error('[getPackages]', error)
    return { success: false, packages: [] as any[], error: error instanceof Error ? error.message : 'Failed' }
  }
}

export async function updatePackage({
  packageId,
  name,
  description,
  coverMessage,
  notes,
  lineItems,
  projectRef,
}: {
  packageId: string
  name: string
  description?: string
  coverMessage?: string
  notes?: string
  lineItems: Array<{
    name: string
    description?: string
    price: number
    quantity?: number
    isRecurring?: boolean
    recurringInterval?: 'month' | 'year'
  }>
  projectRef?: string | null
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const existing = await payload.findByID({ collection: 'packages', id: packageId, depth: 0 })
    const currentStatus = (existing as any)?.status
    const statusReset = currentStatus === 'accepted' ? { status: 'sent' as const } : currentStatus === 'draft' ? { status: 'sent' as const } : {}

    const pkg = await payload.update({
      collection: 'packages',
      id: packageId,
      data: { name, description, coverMessage, notes, lineItems, projectRef: projectRef || null, ...statusReset } as any,
    })

    return { success: true, package: pkg }
  } catch (error) {
    console.error('[updatePackage]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update package' }
  }
}

export async function getClientAccountsList() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, clients: [] as any[], error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'client-accounts',
      depth: 0,
      sort: 'name',
      limit: 200,
    })

    return {
      success: true,
      clients: docs.map((c: any) => ({
        id: c.id,
        name: c.name,
        company: c.company ?? null,
      })),
    }
  } catch (error) {
    console.error('[getClientAccountsList]', error)
    return { success: false, clients: [] as any[], error: error instanceof Error ? error.message : 'Failed' }
  }
}

export async function deleteProposal(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    await payload.delete({ collection: 'packages', id: packageId })
    return { success: true }
  } catch (error) {
    console.error('[deleteProposal]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete' }
  }
}

export async function getProposalWithTemplate(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized', templateLineItems: [] as any[] }

    const payload = await getPayload({ config })

    const proposal = await payload.findByID({
      collection: 'packages',
      id: packageId,
      depth: 1,
    })

    if (!proposal) return { success: false, error: 'Not found', templateLineItems: [] as any[] }

    const sourceRef = (proposal as any).sourcePackage
    let templateLineItems: any[] = []

    if (sourceRef) {
      const templateId = typeof sourceRef === 'string' ? sourceRef : sourceRef.id
      const template = await payload.findByID({ collection: 'packages', id: templateId, depth: 0 })
      templateLineItems = (template?.lineItems ?? []) as any[]
    }

    return {
      success: true,
      templateLineItems,
      requestedItems: ((proposal as any).requestedItems ?? []) as Array<{ name: string; requestedAt?: string }>,
    }
  } catch (error) {
    console.error('[getProposalWithTemplate]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed', templateLineItems: [] as any[], requestedItems: [] as any[] }
  }
}

export async function getClientProposalTemplateItems(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized', items: [] as any[], requestedItems: [] as any[] }

    const payload = await getPayload({ config })

    const proposal = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!proposal || proposal.type !== 'proposal') {
      return { success: false, error: 'Not found', items: [] as any[], requestedItems: [] as any[] }
    }

    // Clients: verify this proposal belongs to their account
    if (user.role === 'client') {
      const proposalClientId =
        typeof proposal.clientAccount === 'string'
          ? proposal.clientAccount
          : (proposal.clientAccount as any)?.id
      const userClientId =
        typeof user.clientAccount === 'string'
          ? user.clientAccount
          : (user.clientAccount as any)?.id
      if (proposalClientId !== userClientId) {
        return { success: false, error: 'Not authorized', items: [] as any[], requestedItems: [] as any[] }
      }
    }

    const sourceRef = (proposal as any).sourcePackage
    let templateItems: any[] = []
    if (sourceRef) {
      const templateId = typeof sourceRef === 'string' ? sourceRef : sourceRef.id
      const template = await payload.findByID({ collection: 'packages', id: templateId, depth: 0 })
      templateItems = (template?.lineItems ?? []) as any[]
    }

    return {
      success: true,
      items: templateItems,
      requestedItems: ((proposal as any).requestedItems ?? []) as Array<{ name: string; requestedAt?: string }>,
    }
  } catch (error) {
    console.error('[getClientProposalTemplateItems]', error)
    return { success: false, error: 'Failed', items: [] as any[], requestedItems: [] as any[] }
  }
}

export async function requestPackageLineItem({
  packageId,
  itemName,
}: {
  packageId: string
  itemName: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role !== 'client') return { success: false, error: 'Only clients can request items' }

    const payload = await getPayload({ config })

    const proposal = await payload.findByID({ collection: 'packages', id: packageId, depth: 0 })
    if (!proposal || proposal.type !== 'proposal') return { success: false, error: 'Not found' }

    // Verify ownership
    const proposalClientId =
      typeof proposal.clientAccount === 'string'
        ? proposal.clientAccount
        : (proposal.clientAccount as any)?.id
    const userClientId =
      typeof user.clientAccount === 'string'
        ? user.clientAccount
        : (user.clientAccount as any)?.id
    if (proposalClientId !== userClientId) return { success: false, error: 'Not authorized' }

    const existing = ((proposal as any).requestedItems ?? []) as Array<{ name: string; requestedAt?: string }>
    const alreadyRequested = existing.some((r) => r.name === itemName)

    const newRequestedItems = alreadyRequested
      ? existing.filter((r) => r.name !== itemName)
      : [...existing, { name: itemName, requestedAt: new Date().toISOString() }]

    await payload.update({
      collection: 'packages',
      id: packageId,
      data: { requestedItems: newRequestedItems } as any,
      overrideAccess: true,
    })

    return { success: true, requested: !alreadyRequested }
  } catch (error) {
    console.error('[requestPackageLineItem]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed' }
  }
}

export async function getPackageTemplates() {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized', templates: [] }
    if (user.role === 'client') return { success: false, error: 'Unauthorized', templates: [] }

    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'packages',
      where: { type: { equals: 'template' } },
      sort: 'name',
      limit: 100,
      depth: 0,
    })

    return { success: true, templates: docs }
  } catch (error) {
    console.error('[getPackageTemplates]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to load templates', templates: [] }
  }
}

export async function createOrderFromPackage(
  packageId: string,
  daysUntilDue: number = 30,
  projectId?: string,
) {
  // Track finalized Stripe invoice so we can void it if payload.create fails (orphan prevention)
  let finalizedInvoice: any = null
  let stripe: ReturnType<typeof getStripe> | null = null

  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({
      collection: 'packages',
      id: packageId,
      depth: 1,
    })

    if (!pkg || pkg.type !== 'proposal') {
      return { success: false, error: 'Package proposal not found' }
    }

    // Add-on items are optional extras the client hasn't purchased — never invoice them.
    const lineItems = ((pkg.lineItems ?? []) as any[]).filter((li: any) => !li.isAddOn)
    if (lineItems.length === 0) {
      return { success: false, error: 'Package has no billable line items to invoice' }
    }

    const clientAccount = pkg.clientAccount as any
    if (!clientAccount) {
      return { success: false, error: 'No client account associated with this proposal' }
    }

    const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount.id
    const stripeCustomerId = typeof clientAccount === 'object' ? clientAccount.stripeCustomerId : null

    if (!stripeCustomerId) {
      return { success: false, error: 'Client account has no Stripe customer ID — set it in the admin panel first' }
    }

    stripe = getStripe()

    const totalAmount = lineItems.reduce(
      (sum: number, item: any) => sum + (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1),
      0
    )

    // 1. Create Stripe invoice BEFORE touching the DB (create → attach items → finalize).
    //    Webhook looks up the order by stripeInvoiceId (more reliable than metadata).
    const { invoice: finalized } = await createStripeInvoiceForOrder({
      stripe,
      stripeCustomerId,
      daysUntilDue,
      description: pkg.name,
      invoiceMetadata: { orcaclub_package_id: packageId },
      lines: lineItems.map((item: any) => {
        const qty = item.quantity ?? 1
        const unitPrice = item.adjustedPrice ?? item.price ?? 0
        const descParts = [
          item.name,
          qty > 1 ? `${qty} × $${unitPrice}` : null,
          item.description || null,
        ].filter(Boolean)
        return { description: descParts.join(' — '), amount: unitPrice * qty }
      }),
    })
    finalizedInvoice = finalized
    // Stripe assigns the invoice number at finalization — use it as the order number.
    const orderNumber = finalized.number ?? finalized.id

    // 4. Single payload.create with ALL data — triggers updateClientBalance exactly once.
    //    Packages use 'name'; Orders use 'title' — mapped explicitly below.
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        clientAccount: clientAccountId,
        projectRef: projectId || undefined,
        packageRef: packageId,
        invoiceType: 'full',
        amount: totalAmount,
        status: 'pending',
        stripeCustomerId,
        stripeInvoiceId: finalizedInvoice.id,
        stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url || '',
        lineItems: lineItems.map((item: any) => ({
          title: item.name,        // Packages use 'name'; Orders use 'title'
          description: item.description ?? undefined,
          quantity: item.quantity ?? 1,
          price: item.adjustedPrice ?? item.price ?? 0,
          isRecurring: item.isRecurring ?? false,
        })),
      } as any,
    })

    // 5. Append an entry to paymentSchedule so the invoice shows in the schedule view.
    try {
      const existingSchedule = ((pkg as any).paymentSchedule ?? []) as any[]
      const dueDateStr = new Date(Date.now() + daysUntilDue * 86400000).toISOString().split('T')[0]
      await payload.update({
        collection: 'packages',
        id: packageId,
        data: {
          paymentSchedule: [
            ...existingSchedule,
            {
              label: 'Invoice',
              amount: totalAmount,
              dueDate: dueDateStr,
              orderId: order.id,
              invoicedAt: new Date().toISOString(),
            },
          ],
        } as any,
      })
    } catch (e) {
      console.error('[createOrderFromPackage] Failed to update payment schedule:', e)
    }

    revalidatePath(`/u/${user.username}/clients`)

    // Non-blocking: send "New Invoice" email to client
    ;(async () => {
      try {
        const clientUsername = await getClientUsername(payload, clientAccountId)
        const proposalPrintUrl = clientUsername
          ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
          : undefined
        await sendGenericInvoiceEmail(payload, order.id, user.id, proposalPrintUrl)
      } catch (e) {
        console.error('[createOrderFromPackage] Invoice email failed:', e)
      }
    })()

    return {
      success: true,
      invoiceUrl: finalizedInvoice.hosted_invoice_url,
      orderNumber,
      orderId: order.id,
    }
  } catch (error) {
    // If Stripe invoice was finalized but payload.create failed, void it
    // to prevent an orphaned Stripe invoice with no DB record.
    if (finalizedInvoice && stripe) {
      stripe.invoices.voidInvoice(finalizedInvoice.id).catch((e: any) =>
        console.error('[createOrderFromPackage] Failed to void orphaned Stripe invoice:', e)
      )
    }
    console.error('[createOrderFromPackage]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create invoice' }
  }
}

export async function savePaymentSchedule(
  packageId: string,
  entries: Array<{ label: string; amount: number; dueDate?: string }>,
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!pkg || pkg.type !== 'proposal') {
      return { success: false, error: 'Package proposal not found' }
    }

    const updated = await payload.update({
      collection: 'packages',
      id: packageId,
      data: { paymentSchedule: entries } as any,
    })

    revalidatePath(`/u/${user.username}/clients`)

    // Non-blocking: send "Payment Schedule" email to client
    ;(async () => {
      try {
        const clientAccount = pkg.clientAccount as any
        if (!clientAccount?.email) return
        const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount.id
        const clientUsername = await getClientUsername(payload, clientAccountId)
        const proposalPrintUrl = clientUsername
          ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
          : undefined
        const totalAmount = entries.reduce((s, e) => s + e.amount, 0)
        await sendPaymentScheduleEmail(payload, {
          customerEmail: clientAccount.email,
          customerName: clientAccount.name ?? undefined,
          packageName: pkg.name,
          packageDescription: pkg.description ?? undefined,
          entries,
          totalAmount,
          proposalPrintUrl,
        })
      } catch (e) {
        console.error('[savePaymentSchedule] Schedule email failed:', e)
      }
    })()

    return { success: true, schedule: (updated as any).paymentSchedule ?? [] }
  } catch (error) {
    console.error('[savePaymentSchedule]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save schedule' }
  }
}

/**
 * Un-stamp every work entry consumed by an order — used when a scheduled payment fails
 * mid-flight, when its schedule entry is removed, or when Stripe voids the invoice. The
 * entries go back to pending so the next invoice can pick them up. Best-effort: a failure
 * here must never block the caller's primary operation. Returns how many were released.
 */
export async function releaseWorkEntriesForOrder(orderId: string): Promise<number> {
  if (!orderId) return 0
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'package-work-entries',
      where: { billedOrderId: { equals: orderId } },
      depth: 0,
      limit: 1000,
    })
    await Promise.all(
      (docs as any[]).map((d) =>
        payload
          .update({ collection: 'package-work-entries', id: d.id, data: { billedOrderId: '' } as any })
          .catch((e) => console.error('[releaseWorkEntriesForOrder] Failed to release entry:', d.id, e)),
      ),
    )
    return docs.length
  } catch (e) {
    console.error('[releaseWorkEntriesForOrder]', e)
    return 0
  }
}

export async function removeScheduleEntry(packageId: string, entryId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 0 })
    if (!pkg || pkg.type !== 'proposal') return { success: false, error: 'Package proposal not found' }

    const schedule = (pkg as any).paymentSchedule ?? []
    const entry = schedule.find((e: any) => e.id === entryId)
    if (!entry) return { success: false, error: 'Entry not found' }
    if (entry.invoicedAt) return { success: false, error: 'Cannot remove an entry that has already been invoiced via Stripe' }

    // Delete the pending order if one was created for this entry, releasing any work
    // entries it consumed back to pending first.
    if (entry.orderId && !entry.invoicedAt) {
      await releaseWorkEntriesForOrder(entry.orderId)
      try {
        await payload.delete({ collection: 'orders', id: entry.orderId })
      } catch (e) {
        console.error('[removeScheduleEntry] Failed to delete pending order:', e)
      }
    }

    const updated = await payload.update({
      collection: 'packages',
      id: packageId,
      data: { paymentSchedule: schedule.filter((e: any) => e.id !== entryId) } as any,
    })

    revalidatePath(`/u/${user.username}/clients`)
    return { success: true, schedule: (updated as any).paymentSchedule ?? [] }
  } catch (error) {
    console.error('[removeScheduleEntry]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to remove entry' }
  }
}

/**
 * Put an already-invoiced schedule entry back on the schedule as un-invoiced so it can
 * be sent again. Tears down only: voids the Stripe invoice, deletes the Payload order,
 * releases the work entries it consumed, then clears `orderId`/`invoicedAt` on the entry.
 *
 * Also the manual recovery path for a "ghost order" — a transaction abort can roll back
 * the order while leaving the entry stamped invoiced against an id that no longer exists.
 * That case still resets (and still releases stranded work entries).
 *
 * A paid order is never reset — resetting would detach a paid invoice.
 */
export async function resetScheduleEntry(packageId: string, entryId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 0 })
    if (!pkg || pkg.type !== 'proposal') return { success: false, error: 'Package proposal not found' }

    const schedule = ((pkg as any).paymentSchedule ?? []) as Array<{
      id: string
      orderId?: string | null
      invoicedAt?: string | null
    }>
    const entry = schedule.find((e) => e.id === entryId)
    if (!entry) return { success: false, error: 'Schedule entry not found' }

    const orderId = entry.orderId || null
    let order: any = null
    let orderWasMissing = false
    let stripeVoided = false

    if (orderId) {
      order = await payload
        .findByID({ collection: 'orders', id: orderId, depth: 0 })
        .catch(() => null)

      if (!order) {
        // Ghost order — the order was rolled back but the entry stayed stamped.
        orderWasMissing = true
      } else if (order.status === 'paid') {
        return {
          success: false,
          error: 'This payment has already been paid — reset would detach a paid invoice.',
        }
      }
    } else {
      orderWasMissing = true
    }

    // Void the Stripe invoice, then drop the order. Best-effort on Stripe: the point of
    // this action is unsticking a broken state, so a Stripe rejection (already void,
    // deleted, bad key) must never abort the reset.
    if (order) {
      if (order.stripeInvoiceId) {
        try {
          const stripe = getStripe()
          const invoice = await stripe.invoices.retrieve(order.stripeInvoiceId).catch(() => null)
          if (!invoice || invoice.status !== 'void') {
            await stripe.invoices.voidInvoice(order.stripeInvoiceId)
            stripeVoided = true
          }
        } catch (e) {
          console.error('[resetScheduleEntry] Failed to void Stripe invoice:', order.stripeInvoiceId, e)
        }
      }
      try {
        await payload.delete({ collection: 'orders', id: order.id })
      } catch (e) {
        console.error('[resetScheduleEntry] Failed to delete order:', order.id, e)
      }
    }

    // Release work entries even in the ghost case — that is exactly where they strand.
    const releasedWorkEntries = orderId ? await releaseWorkEntriesForOrder(orderId) : 0

    const updated = await payload.update({
      collection: 'packages',
      id: packageId,
      data: {
        paymentSchedule: schedule.map((e) =>
          e.id === entryId ? { ...e, orderId: null, invoicedAt: null } : e,
        ),
      } as any,
    })

    revalidatePath(`/u/${user.username}/clients`)

    return {
      success: true,
      schedule: (updated as any).paymentSchedule ?? [],
      releasedWorkEntries,
      orderWasMissing,
      stripeVoided,
    }
  } catch (error) {
    console.error('[resetScheduleEntry]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to reset entry' }
  }
}

export interface SendScheduledPaymentOpts {
  /** Create the order + Stripe invoice but send no email. */
  skipEmail?: boolean
  /**
   * Work entries to attach as $0 lines. Omit to attach every pending logged entry;
   * pass [] to attach none.
   */
  workLineIds?: string[]
  /** Staff-composed recap narrative (merged server-side before use). */
  recap?: Partial<PackageRecapData>
  /** Attach the recap PDF to the invoice email. */
  attachRecapPdf?: boolean
  /** Render the itemized work log in the invoice email body. */
  includeWorkInEmail?: boolean
}

export async function sendScheduledPayment(
  packageId: string,
  entryId: string,
  projectId?: string,
  opts?: SendScheduledPaymentOpts,
) {
  let finalizedInvoice: any = null
  let stripe: ReturnType<typeof getStripe> | null = null
  /** Entries stamped in this run — unstamped if anything downstream throws. */
  const stampedEntryIds: string[] = []

  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!pkg || pkg.type !== 'proposal') {
      return { success: false, error: 'Package proposal not found' }
    }

    const currentSchedule = ((pkg as any).paymentSchedule ?? []) as Array<{
      id: string
      label: string
      entryType?: 'deposit' | 'installment' | 'balance' | null
      amount: number
      dueDate?: string | null
      orderId?: string | null
      invoicedAt?: string | null
    }>

    const entry = currentSchedule.find((e) => e.id === entryId)
    if (!entry) return { success: false, error: 'Schedule entry not found' }
    if (entry.orderId) return { success: false, error: 'This entry has already been invoiced' }

    const clientAccount = pkg.clientAccount as any
    if (!clientAccount) return { success: false, error: 'No client account associated with this proposal' }

    const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount.id
    const stripeCustomerId = typeof clientAccount === 'object' ? clientAccount.stripeCustomerId : null

    if (!stripeCustomerId) {
      return { success: false, error: 'Client account has no Stripe customer ID — set it in the admin panel first' }
    }

    // ── Pending work this invoice consumes ──────────────────────────────────────
    // Default: every pending logged entry. `workLineIds: []` attaches none.
    const { docs: pendingDocs } = await payload.find({
      collection: 'package-work-entries',
      where: {
        and: [
          { package: { equals: packageId } },
          { status: { equals: 'logged' } },
          { billedOrderId: { exists: false } },
        ],
      },
      depth: 0,
      sort: 'date',
      limit: 500,
    })
    // `exists: false` misses documents stored with an empty string — filter defensively.
    const allPending = (pendingDocs as any[]).filter((d) => !d.billedOrderId)
    const selected = opts?.workLineIds
      ? allPending.filter((d) => opts.workLineIds!.includes(d.id))
      : allPending
    const workLines = buildWorkLines(
      selected.map((d) => ({
        id: d.id as string,
        date: typeof d.date === 'string' ? d.date : new Date(d.date).toISOString(),
        description: d.description ?? null,
        hours: d.hours ?? null,
        category: (d.category ?? 'work') as WorkCategory,
      })),
    )

    const daysUntilDue = entry.dueDate
      ? Math.max(1, Math.round((new Date(entry.dueDate).getTime() - Date.now()) / 86400000))
      : 30

    const invoiceType = resolveInvoiceType(entry)

    stripe = getStripe()

    // The payment line carries the price; work lines ride along at $0 so the invoice
    // documents what the payment bought without changing the total.
    const { invoice: finalized } = await createStripeInvoiceForOrder({
      stripe,
      stripeCustomerId,
      daysUntilDue,
      description: pkg.name,
      invoiceMetadata: {
        orcaclub_package_id: packageId,
        orcaclub_invoice_type: invoiceType,
        orcaclub_schedule_entry_id: entryId,
      },
      lines: [
        { description: `${entry.label} — ${pkg.name}`, amount: entry.amount },
        ...workLines.map((l) => ({ description: l.title, amount: 0 })),
      ],
    })
    finalizedInvoice = finalized
    const orderNumber = finalized.number ?? finalized.id

    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        clientAccount: clientAccountId,
        projectRef: projectId || undefined,
        packageRef: packageId,
        invoiceType,
        invoiceNote: entry.label,
        amount: entry.amount,
        status: 'pending',
        stripeCustomerId,
        stripeInvoiceId: finalizedInvoice.id,
        stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url || '',
        lineItems: [
          { title: entry.label, price: entry.amount, quantity: 1 },
          // Itemized work at $0 — covered by the payment line; the amount still balances.
          ...workLines.map((l) => ({ title: l.title, description: l.description, price: 0, quantity: 1 })),
        ],
      } as any,
    })

    // ── Confirm the order actually persisted ────────────────────────────────────
    // An Orders afterChange hook (updateClientBalance → syncClientAccountToUser) can
    // abort the create's Mongo transaction while swallowing the error — `payload.create`
    // still hands back a doc with an id for a row that was rolled back. Everything below
    // stamps that id onto work entries and the payment schedule, so verify FIRST: at this
    // point nothing has been stamped, so a throw here leaves no wreckage — the catch just
    // voids the Stripe invoice and returns a real error.
    try {
      await assertOrderPersisted(payload, order.id as string)
    } catch (e) {
      // Keep the diagnostic detail in the server log; surface something legible upstream.
      console.error('[sendScheduledPayment] Order did not persist:', e)
      throw new Error(
        'The invoice could not be saved, so this payment was not recorded. ' +
          'The Stripe invoice has been voided and nothing was billed — please try again.',
      )
    }

    // ── Recap model — MUST be captured before stamping ──────────────────────────
    // getPackageRecapModel derives from *pending* (unstamped) work entries. The loop
    // below stamps `billedOrderId` on every entry this invoice consumed, after which
    // they are no longer pending and the recap would come back empty. So capture it
    // here and let the email IIFE below close over the result. Non-blocking: a failure
    // means "send without a recap PDF", never a failed invoice.
    let recapModelForEmail: PackageRecapData | null = null
    if (!opts?.skipEmail && opts?.attachRecapPdf) {
      try {
        const recapResult = await getPackageRecapModel(packageId, entryId)
        if (recapResult.success) recapModelForEmail = recapResult.model
        else console.error('[sendScheduledPayment] Recap model unavailable:', recapResult.error)
      } catch (e) {
        console.error('[sendScheduledPayment] Recap model failed (sending without recap):', e)
      }
    }

    // ── Consume: stamp the entries this order carried ───────────────────────────
    for (const l of workLines) {
      try {
        await payload.update({
          collection: 'package-work-entries',
          id: l.entryId,
          data: { billedOrderId: order.id } as any,
        })
        stampedEntryIds.push(l.entryId)
      } catch (e) {
        console.error('[sendScheduledPayment] Failed to stamp work entry:', l.entryId, e)
      }
    }

    const updatedSchedule = currentSchedule.map((e) =>
      e.id === entryId
        ? { ...e, orderId: order.id, invoicedAt: new Date().toISOString() }
        : e
    )

    await payload.update({
      collection: 'packages',
      id: packageId,
      data: { paymentSchedule: updatedSchedule } as any,
    })

    revalidatePath(`/u/${user.username}/clients`)

    // Non-blocking: send "New Invoice" email to client (skipped if skipEmail is true).
    // The work section and the recap PDF are independently toggleable; either failing
    // must not stop the email, and the email failing must not stop the invoice.
    if (!opts?.skipEmail) {
      ;(async () => {
        try {
          const clientUsername = await getClientUsername(payload, clientAccountId)
          const proposalPrintUrl = clientUsername
            ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
            : undefined

          const attachments: EmailAttachment[] = []
          if (opts?.attachRecapPdf && recapModelForEmail) {
            try {
              const merged = mergePackageRecap(recapModelForEmail, opts.recap)
              const pdf = await buildPackageRecapPdf({ ...merged, generatedOn: new Date().toISOString() })
              attachments.push({
                filename: `ORCACLUB-Recap-${entry.label.replace(/[^\w-]+/g, '-')}.pdf`,
                content: Buffer.from(pdf).toString('base64'),
                encoding: 'base64',
                contentType: 'application/pdf',
              })
            } catch (e) {
              console.error('[sendScheduledPayment] Recap PDF failed (sending without):', e)
            }
          }

          await sendGenericInvoiceEmail(payload, order.id, user.id, proposalPrintUrl, {
            workLog: opts?.includeWorkInEmail
              ? workLines.map((l) => ({ title: l.title, description: l.description }))
              : undefined,
            attachments: attachments.length ? attachments : undefined,
          })
        } catch (e) {
          console.error('[sendScheduledPayment] Invoice email failed:', e)
        }
      })()
    }

    return {
      success: true,
      invoiceUrl: finalizedInvoice.hosted_invoice_url,
      orderNumber,
      orderId: order.id,
      workLineCount: workLines.length,
    }
  } catch (error) {
    // Release anything stamped before the failure, then void the orphaned invoice.
    if (stampedEntryIds.length > 0) {
      const cleanupPayload = await getPayload({ config }).catch(() => null)
      if (cleanupPayload) {
        await Promise.all(
          stampedEntryIds.map((id) =>
            cleanupPayload
              .update({ collection: 'package-work-entries', id, data: { billedOrderId: '' } as any })
              .catch((e) => console.error('[sendScheduledPayment] Failed to release work entry:', id, e)),
          ),
        )
      }
    }
    if (finalizedInvoice && stripe) {
      stripe.invoices.voidInvoice(finalizedInvoice.id).catch((e: any) =>
        console.error('[sendScheduledPayment] Failed to void orphaned Stripe invoice:', e)
      )
    }
    console.error('[sendScheduledPayment]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send scheduled payment' }
  }
}

export async function createPartialInvoiceFromPackage(
  packageId: string,
  amount: number,
  label: string,
  daysUntilDue: number = 30,
  projectId?: string,
) {
  let finalizedInvoice: any = null
  let stripe: ReturnType<typeof getStripe> | null = null

  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    if (!amount || amount <= 0) {
      return { success: false, error: 'Amount must be greater than $0' }
    }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({
      collection: 'packages',
      id: packageId,
      depth: 1,
    })

    if (!pkg || pkg.type !== 'proposal') {
      return { success: false, error: 'Package proposal not found' }
    }

    const lineItems = (pkg.lineItems ?? []) as any[]
    if (lineItems.length === 0) {
      return { success: false, error: 'Package has no line items' }
    }

    const clientAccount = pkg.clientAccount as any
    if (!clientAccount) {
      return { success: false, error: 'No client account associated with this proposal' }
    }

    const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount.id
    const stripeCustomerId = typeof clientAccount === 'object' ? clientAccount.stripeCustomerId : null

    if (!stripeCustomerId) {
      return { success: false, error: 'Client account has no Stripe customer ID — set it in the admin panel first' }
    }

    stripe = getStripe()

    // Map label to invoiceType
    const invoiceType = label.toLowerCase().includes('deposit') ? 'deposit'
      : label.toLowerCase().includes('milestone') ? 'installment'
      : label.toLowerCase().includes('final') ? 'balance'
      : 'installment'

    // 1. Create → attach the single partial line item → finalize
    const { invoice: finalized } = await createStripeInvoiceForOrder({
      stripe,
      stripeCustomerId,
      daysUntilDue,
      description: pkg.name,
      invoiceMetadata: {
        orcaclub_package_id: packageId,
        orcaclub_invoice_type: invoiceType,
      },
      lines: [{ description: `${label} — ${pkg.name}`, amount }],
    })
    finalizedInvoice = finalized
    const orderNumber = finalized.number ?? finalized.id

    // 4. Create order record
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        clientAccount: clientAccountId,
        projectRef: projectId || undefined,
        packageRef: packageId,
        invoiceType,
        invoiceNote: label,
        amount,
        status: 'pending',
        stripeCustomerId,
        stripeInvoiceId: finalizedInvoice.id,
        stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url || '',
        lineItems: [{ title: label, price: amount, quantity: 1 }],
      } as any,
    })

    revalidatePath(`/u/${user.username}/clients`)

    return {
      success: true,
      invoiceUrl: finalizedInvoice.hosted_invoice_url,
      orderNumber,
      orderId: order.id,
    }
  } catch (error) {
    if (finalizedInvoice && stripe) {
      stripe.invoices.voidInvoice(finalizedInvoice.id).catch((e: any) =>
        console.error('[createPartialInvoiceFromPackage] Failed to void orphaned Stripe invoice:', e)
      )
    }
    console.error('[createPartialInvoiceFromPackage]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create partial invoice' }
  }
}

/** Internal: create a Stripe invoice for one schedule entry, persist the order, and send an invoice email. */
async function _sendScheduleEntryInvoice(
  payload: Awaited<ReturnType<typeof getPayload>>,
  stripe: ReturnType<typeof getStripe>,
  entry: { id: string; label: string; entryType?: 'deposit' | 'installment' | 'balance' | null; amount: number; dueDate?: string | null },
  packageId: string,
  proposalName: string,
  clientAccountId: string,
  stripeCustomerId: string,
  actorUserId: string,
): Promise<{ orderId: string; invoiceUrl: string | null }> {
  const daysUntilDue = entry.dueDate
    ? Math.max(1, Math.round((new Date(entry.dueDate).getTime() - Date.now()) / 86400000))
    : 30

  const invoiceType = resolveInvoiceType(entry)

  const { invoice: finalizedInvoice } = await createStripeInvoiceForOrder({
    stripe,
    stripeCustomerId,
    daysUntilDue,
    description: proposalName,
    invoiceMetadata: { orcaclub_package_id: packageId, orcaclub_invoice_type: invoiceType },
    lines: [{ description: `${entry.label} — ${proposalName}`, amount: entry.amount }],
  })
  const orderNumber = finalizedInvoice.number ?? finalizedInvoice.id

  const order = await payload.create({
    collection: 'orders',
    data: {
      orderNumber,
      clientAccount: clientAccountId,
      packageRef: packageId,
      invoiceType,
      invoiceNote: entry.label,
      amount: entry.amount,
      status: 'pending',
      stripeCustomerId,
      stripeInvoiceId: finalizedInvoice.id,
      stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url || '',
      lineItems: [{ title: entry.label, price: entry.amount, quantity: 1 }],
    } as any,
  })

  // Non-blocking invoice email
  ;(async () => {
    try {
      const clientUsername = await getClientUsername(payload, clientAccountId)
      const proposalPrintUrl = clientUsername
        ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
        : undefined
      await sendGenericInvoiceEmail(payload, order.id, actorUserId, proposalPrintUrl)
    } catch (e) {
      console.error('[_sendScheduleEntryInvoice] Invoice email failed:', e)
    }
  })()

  return { orderId: order.id, invoiceUrl: finalizedInvoice.hosted_invoice_url ?? null }
}

/** Saves payment schedule entries to the DB. Does NOT create Orders — use Send Invoice for that. Admin/user only. */
export async function savePaymentScheduleOnly(
  packageId: string,
  entries: Array<{ label: string; amount: number; dueDate?: string }>,
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 0 })
    if (!pkg || pkg.type !== 'proposal') return { success: false, error: 'Package proposal not found' }

    const existingSchedule = ((pkg as any).paymentSchedule ?? []) as Array<{
      id: string; label: string; amount: number; dueDate?: string | null; orderId?: string | null; invoicedAt?: string | null
    }>

    const statusReset = (pkg as any)?.status === 'accepted' ? { status: 'sent' } : {}

    // Preserve orderId/invoicedAt from existing entries at the same position
    // (entries that were already sent as Stripe invoices must not lose their link)
    const mergedEntries = entries.map((entry, i) => {
      const prev = existingSchedule[i]
      if (prev?.orderId) {
        return { ...entry, orderId: prev.orderId, ...(prev.invoicedAt ? { invoicedAt: prev.invoicedAt } : {}) }
      }
      return entry
    })

    await payload.update({
      collection: 'packages',
      id: packageId,
      data: { paymentSchedule: mergedEntries, ...statusReset } as any,
    })

    revalidatePath(`/u/${user.username}/clients`)
    return { success: true }
  } catch (error) {
    console.error('[savePaymentScheduleOnly]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save schedule' }
  }
}

/** Sends Stripe invoices for all pending payment schedule entries. Admin/user only. */
export async function pushPackageSchedule(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!pkg || pkg.type !== 'proposal') return { success: false, error: 'Package proposal not found' }

    const currentSchedule = ((pkg as any).paymentSchedule ?? []) as Array<{
      id: string; label: string; amount: number; dueDate?: string | null; orderId?: string | null
    }>

    const pendingEntries = currentSchedule.filter(e => !e.orderId)
    if (pendingEntries.length === 0) return { success: false, error: 'No pending entries to push' }

    const clientAccount = pkg.clientAccount as any
    if (!clientAccount) return { success: false, error: 'No client account associated with this proposal' }

    const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount.id
    const stripeCustomerId = typeof clientAccount === 'object' ? clientAccount.stripeCustomerId : null

    if (!stripeCustomerId) return { success: false, error: 'Client has no Stripe customer ID' }

    const stripe = getStripe()
    const invoiceUrls: string[] = []
    let updatedSchedule = [...currentSchedule]

    for (const entry of pendingEntries) {
      const { orderId, invoiceUrl } = await _sendScheduleEntryInvoice(
        payload, stripe, entry, packageId, pkg.name, clientAccountId, stripeCustomerId, user.id,
      )

      updatedSchedule = updatedSchedule.map(e =>
        e.id === entry.id ? { ...e, orderId, invoicedAt: new Date().toISOString() } : e
      )

      await payload.update({
        collection: 'packages',
        id: packageId,
        data: { paymentSchedule: updatedSchedule } as any,
      })

      if (invoiceUrl) invoiceUrls.push(invoiceUrl)
    }

    revalidatePath(`/u/${user.username}/clients`)
    return { success: true, invoiceUrls, count: pendingEntries.length }
  } catch (error) {
    console.error('[pushPackageSchedule]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to push schedule' }
  }
}

/** Client accepts a package — pushes all pending schedule entries or creates a full invoice, then marks the package as accepted. */
export async function acceptPackage(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const proposal = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!proposal || proposal.type !== 'proposal') return { success: false, error: 'Package not found' }

    // Verify ownership for clients
    if (user.role === 'client') {
      const proposalClientId = typeof proposal.clientAccount === 'string'
        ? proposal.clientAccount
        : (proposal.clientAccount as any)?.id
      const userClientId = typeof user.clientAccount === 'string'
        ? user.clientAccount
        : (user.clientAccount as any)?.id
      if (proposalClientId !== userClientId) return { success: false, error: 'Not authorized' }
    }

    if ((proposal as any).status === 'accepted') {
      return { success: false, error: 'This package has already been accepted.' }
    }

    const clientAccount = proposal.clientAccount as any
    const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount?.id
    const stripeCustomerId = typeof clientAccount === 'object' ? clientAccount?.stripeCustomerId : null

    if (!stripeCustomerId) {
      return { success: false, error: 'No payment method on file — contact your team to set up billing.' }
    }

    const schedule = ((proposal as any).paymentSchedule ?? []) as Array<{
      id: string; label: string; amount: number; dueDate?: string | null; orderId?: string | null
    }>
    const pendingEntries = schedule.filter(e => !e.orderId)
    // Add-on items are optional extras — excluded from the accepted/charged total.
    const lineItems = ((proposal.lineItems ?? []) as any[]).filter((li: any) => !li.isAddOn)

    if (pendingEntries.length === 0 && lineItems.length === 0) {
      return { success: false, error: 'This package has no items configured yet — contact your team.' }
    }

    const stripe = getStripe()
    const invoiceUrls: string[] = []

    if (schedule.length > 0 && pendingEntries.length > 0) {
      // Push all pending schedule entries
      let updatedSchedule = [...schedule]

      for (const entry of pendingEntries) {
        const { orderId, invoiceUrl } = await _sendScheduleEntryInvoice(
          payload, stripe, entry, packageId, proposal.name, clientAccountId, stripeCustomerId, user.id,
        )

        updatedSchedule = updatedSchedule.map(e =>
          e.id === entry.id ? { ...e, orderId, invoicedAt: new Date().toISOString() } : e
        )

        await payload.update({
          collection: 'packages',
          id: packageId,
          data: { paymentSchedule: updatedSchedule } as any,
        })

        if (invoiceUrl) invoiceUrls.push(invoiceUrl)
      }

      // Send a single acceptance confirmation showing the full payment schedule
      ;(async () => {
        try {
          const clientUsername = await getClientUsername(payload, clientAccountId)
          const proposalPrintUrl = clientUsername
            ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
            : undefined
          const totalAmount = schedule.reduce((s, e) => s + (e.amount ?? 0), 0)
          await sendPaymentScheduleEmail(payload, {
            customerName: typeof clientAccount === 'object' ? (clientAccount?.name ?? undefined) : undefined,
            customerEmail: typeof clientAccount === 'object' ? (clientAccount?.email ?? '') : '',
            packageName: proposal.name,
            packageDescription: (proposal as any).description ?? undefined,
            entries: schedule.map(e => ({ label: e.label, amount: e.amount, dueDate: e.dueDate ?? null })),
            totalAmount,
            proposalPrintUrl,
          })
        } catch (e) {
          console.error('[acceptPackage] Schedule confirmation email failed:', e)
        }
      })()
    } else if (lineItems.length > 0) {
      // No schedule — create one full invoice from all line items
      const totalAmount = lineItems.reduce((s: number, item: any) => s + (item.price ?? 0) * (item.quantity ?? 1), 0)

      const { invoice: finalizedInvoice } = await createStripeInvoiceForOrder({
        stripe,
        stripeCustomerId,
        daysUntilDue: 30,
        description: proposal.name,
        invoiceMetadata: { orcaclub_package_id: packageId },
        lines: lineItems.map((item: any) => ({
          description: item.name,
          amount: (item.price ?? 0) * (item.quantity ?? 1),
        })),
      })
      const orderNumber = finalizedInvoice.number ?? finalizedInvoice.id

      const order = await payload.create({
        collection: 'orders',
        data: {
          orderNumber,
          clientAccount: clientAccountId,
          packageRef: packageId,
          invoiceType: 'full',
          amount: totalAmount,
          status: 'pending',
          stripeCustomerId,
          stripeInvoiceId: finalizedInvoice.id,
          stripeInvoiceUrl: finalizedInvoice.hosted_invoice_url || '',
          lineItems: lineItems.map((item: any) => ({
            title: item.name,
            description: item.description ?? undefined,
            quantity: item.quantity ?? 1,
            price: item.price ?? 0,
            isRecurring: item.isRecurring ?? false,
          })),
        } as any,
      })

      if (finalizedInvoice.hosted_invoice_url) invoiceUrls.push(finalizedInvoice.hosted_invoice_url)

      // Non-blocking invoice email
      ;(async () => {
        try {
          const clientUsername = await getClientUsername(payload, clientAccountId)
          const proposalPrintUrl = clientUsername
            ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
            : undefined
          await sendGenericInvoiceEmail(payload, order.id, user.id, proposalPrintUrl)
        } catch (e) {
          console.error('[acceptPackage] Invoice email failed:', e)
        }
      })()
    }

    // Mark as accepted
    await payload.update({
      collection: 'packages',
      id: packageId,
      data: { status: 'accepted' } as any,
    })

    revalidatePath(`/u/${user.username}`)
    return { success: true, invoiceUrls }
  } catch (error) {
    console.error('[acceptPackage]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to accept package' }
  }
}

/** Client emails the package proposal to their own account email. */
export async function emailPackageToSelf(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const proposal = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!proposal || proposal.type !== 'proposal') return { success: false, error: 'Package not found' }

    // Verify ownership
    const proposalClientId = typeof proposal.clientAccount === 'string'
      ? proposal.clientAccount
      : (proposal.clientAccount as any)?.id
    const userClientId = typeof user.clientAccount === 'string'
      ? user.clientAccount
      : (user.clientAccount as any)?.id
    if (proposalClientId !== userClientId) return { success: false, error: 'Not authorized' }

    const clientAccount = proposal.clientAccount as any
    const email = clientAccount?.email
    if (!email) return { success: false, error: 'No email address on file' }

    // Build totals from line items
    const lineItems = (proposal.lineItems ?? []) as any[]
    let totalOneTime = 0, totalMonthly = 0, totalAnnual = 0
    for (const item of lineItems) {
      const total = (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1)
      if (item.isRecurring) {
        if (item.recurringInterval === 'year') totalAnnual += total
        else totalMonthly += total
      } else {
        totalOneTime += total
      }
    }

    const clientUsername = await getClientUsername(payload, userClientId)
    const proposalPrintUrl = clientUsername
      ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
      : undefined

    const result = await sendProposalEmailToAddresses(payload, {
      recipientName: clientAccount?.name ?? undefined,
      recipientEmail: email,
      packageName: proposal.name,
      packageDescription: (proposal as any).description ?? undefined,
      coverMessage: (proposal as any).coverMessage ?? undefined,
      lineItems: lineItems.map((item: any) => ({
        name: item.name,
        price: item.adjustedPrice ?? item.price ?? 0,
        quantity: item.quantity ?? 1,
        isRecurring: item.isRecurring ?? false,
        recurringInterval: item.recurringInterval ?? undefined,
      })),
      totalOneTime,
      totalMonthly,
      totalAnnual,
      paymentSchedule: ((proposal as any).paymentSchedule ?? []).map((e: any) => ({
        label: e.label,
        amount: e.amount,
        dueDate: e.dueDate ?? null,
      })),
      proposalPrintUrl,
    }, [email])

    if (!result.success) {
      return { success: false, error: result.errors[0] ?? 'Failed to send email' }
    }
    return { success: true }
  } catch (error) {
    console.error('[emailPackageToSelf]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}


export interface BillToOverride {
  name: string
  company?: string
  email: string
  phone?: string
  address: { line1: string; line2?: string; city: string; state: string; zip: string }
}

/** A bill-to override is only applied when every required field is filled in. */
function isBillToComplete(b?: BillToOverride | null): b is BillToOverride {
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

/**
 * Return a package's client account bill-to details, flattened for the email
 * sender's override form (empty strings when a field is unset). Staff only.
 */
export async function getPackageBillTo(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!pkg) return { success: false as const, error: 'Package not found' }

    const c = pkg.clientAccount && typeof pkg.clientAccount === 'object' ? (pkg.clientAccount as any) : null
    const addr = c?.address ?? {}
    return {
      success: true as const,
      billTo: {
        name: c?.name ?? '',
        company: c?.company ?? '',
        email: c?.email ?? '',
        phone: c?.phone ?? '',
        line1: addr.line1 ?? '',
        line2: addr.line2 ?? '',
        city: addr.city ?? '',
        state: addr.state ?? '',
        zip: addr.zip ?? '',
      },
    }
  } catch (error) {
    console.error('[getPackageBillTo]', error)
    return { success: false as const, error: error instanceof Error ? error.message : 'Failed' }
  }
}

export async function sendProposalEmail(
  packageId: string,
  emails: string[],
  sendAs: 'proposal' | 'invoice' | 'sow' = 'proposal',
  billTo?: BillToOverride | null,
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const validEmails = emails.map(e => e.trim()).filter(e => e.includes('@'))
    if (validEmails.length === 0) return { success: false, error: 'No valid email addresses provided' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!pkg) return { success: false, error: 'Package not found' }

    const lineItems = (pkg.lineItems ?? []) as any[]
    let totalOneTime = 0, totalMonthly = 0, totalAnnual = 0
    for (const item of lineItems) {
      const total = (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1)
      if (item.isRecurring) {
        if (item.recurringInterval === 'year') totalAnnual += total
        else totalMonthly += total
      } else {
        totalOneTime += total
      }
    }

    // Build proposal print URL using client username if available
    const clientAccount = pkg.clientAccount as any
    const clientAccountId = clientAccount
      ? (typeof clientAccount === 'string' ? clientAccount : clientAccount.id)
      : null
    let proposalPrintUrl: string | undefined
    if (clientAccountId) {
      const clientUsername = await getClientUsername(payload, clientAccountId)
      if (clientUsername) {
        proposalPrintUrl = `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
      }
    }

    const clientObj = clientAccount && typeof clientAccount === 'object' ? clientAccount : null

    // Resolve the effective bill-to: the manual override wins only when it is
    // fully filled in (isBillToComplete); otherwise fall back to the client's
    // saved account details. Overriding replaces the block wholesale.
    const override = isBillToComplete(billTo) ? billTo : null
    const bt = override
      ? {
          name: override.name,
          company: override.company?.trim() || undefined,
          email: override.email,
          phone: override.phone?.trim() || undefined,
          address: override.address,
        }
      : {
          name: clientObj?.name ?? undefined,
          company: clientObj?.company ?? undefined,
          email: clientObj?.email ?? undefined,
          phone: clientObj?.phone ?? undefined,
          address: clientObj?.address ?? undefined,
        }

    // Same reference format as the print page (PKG-XXXXXX)
    const ref = `PKG-${packageId.slice(-6).toUpperCase()}`

    // Build the PDF attachment — non-blocking, the email still sends without it
    let attachments: EmailAttachment[] | undefined
    try {
      const fmtPdfDate = (iso: string) => {
        const parts = iso.split('T')[0].split('-').map(Number)
        if (parts.length !== 3 || parts.some(isNaN)) return iso
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          .format(new Date(parts[0], parts[1] - 1, parts[2]))
      }
      let bytes: Uint8Array
      let filename: string
      if (sendAs === 'sow') {
        bytes = await buildOrcaclubSowPdf(packageToSowData(pkg))
        filename = `SOW_${pkg.name.replace(/\s+/g, '_')}.pdf`
      } else {
        bytes = await buildPackagePdf({
          sendAs,
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
          coverMessage: (pkg as any).coverMessage ?? null,
          lineItems: lineItems.map((item: any) => ({
            name: item.name,
            description: item.description ?? null,
            quantity: item.quantity ?? 1,
            rate: item.adjustedPrice ?? item.price ?? 0,
            isRecurring: item.isRecurring ?? false,
            recurringInterval: item.recurringInterval ?? undefined,
          })),
          paymentSchedule: ((pkg as any).paymentSchedule ?? []).map((e: any) => ({
            label: e.label,
            amount: e.amount,
            dueDateLabel: e.dueDate ? fmtPdfDate(e.dueDate) : null,
          })),
        })
        filename = sendAs === 'invoice' ? `Invoice_${ref}.pdf` : `Proposal_${pkg.name.replace(/\s+/g, '_')}.pdf`
      }
      attachments = [{
        filename,
        content: Buffer.from(bytes).toString('base64'),
        encoding: 'base64',
        contentType: 'application/pdf',
      }]
    } catch (err) {
      console.error('[sendProposalEmail] PDF generation failed — sending without attachment:', err)
    }

    if (sendAs === 'sow') {
      return await sendSowToAddresses(payload, {
        packageName: pkg.name,
        recipientName: bt.name ?? undefined,
        recipientEmail: bt.email ?? validEmails[0],
      }, validEmails, attachments)
    }

    if (sendAs === 'invoice') {
      // Straight invoice copy — no Order or Stripe invoice is created.
      const totalDue = totalOneTime > 0 ? totalOneTime : totalMonthly + totalAnnual
      return await sendInvoiceCopyToAddresses(payload, {
        orderNumber: ref,
        customerName: bt.name ?? undefined,
        customerEmail: bt.email ?? validEmails[0],
        customerCompany: bt.company ?? undefined,
        customerPhone: bt.phone ?? undefined,
        customerAddress: bt.address ?? undefined,
        lineItems: lineItems.map((item: any) => ({
          title: item.name,
          description: item.description || undefined,
          quantity: item.quantity ?? 1,
          price: item.adjustedPrice ?? item.price ?? 0,
          isRecurring: item.isRecurring || undefined,
          recurringInterval: item.recurringInterval || undefined,
        })),
        totalAmount: totalDue,
        packageName: pkg.name,
        proposalPrintUrl,
      }, validEmails, attachments)
    }

    const result = await sendProposalEmailToAddresses(payload, {
      packageName: pkg.name,
      packageDescription: pkg.description ?? undefined,
      coverMessage: (pkg as any).coverMessage ?? undefined,
      lineItems: lineItems.map((item: any) => ({
        name: item.name,
        description: item.description || undefined,
        price: item.adjustedPrice ?? item.price ?? 0,
        quantity: item.quantity ?? 1,
        isRecurring: item.isRecurring ?? false,
        recurringInterval: item.recurringInterval ?? 'month',
      })),
      totalOneTime,
      totalMonthly,
      totalAnnual,
      paymentSchedule: ((pkg as any).paymentSchedule ?? []).map((e: any) => ({
        label: e.label,
        amount: e.amount,
        dueDate: e.dueDate ?? null,
      })),
      proposalPrintUrl,
      recipientEmail: validEmails[0],
    }, validEmails, attachments)

    return result
  } catch (error) {
    console.error('[sendProposalEmail]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send proposal' }
  }
}

/** Creates pending Orders for any schedule entries that don't have an orderId yet, without modifying the schedule structure. */
export async function linkScheduleEntriesToOrders(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!pkg || pkg.type !== 'proposal') return { success: false, error: 'Package proposal not found' }

    const schedule = ((pkg as any).paymentSchedule ?? []) as Array<{
      id: string; label: string; amount: number; dueDate?: string | null; orderId?: string | null
    }>

    const unlinked = schedule.filter(e => !e.orderId)
    if (unlinked.length === 0) return { success: true }

    const clientAccount = (pkg as any).clientAccount
    if (!clientAccount) return { success: false, error: 'No client account on this proposal' }
    const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount.id

    const updatedSchedule = [...schedule]

    for (const entry of unlinked) {
      const orderNumber = await nextOrderNumber(payload)
      const invoiceType = resolveInvoiceType(entry)

      const order = await payload.create({
        collection: 'orders',
        data: {
          orderNumber,
          clientAccount: clientAccountId,
          packageRef: packageId,
          invoiceType,
          invoiceNote: entry.label,
          amount: entry.amount,
          status: 'pending',
          lineItems: [{ title: entry.label, price: entry.amount, quantity: 1 }],
        } as any,
      })

      const idx = updatedSchedule.findIndex(e => e.id === entry.id)
      if (idx !== -1) updatedSchedule[idx] = { ...updatedSchedule[idx], orderId: order.id }
    }

    await payload.update({
      collection: 'packages',
      id: packageId,
      data: { paymentSchedule: updatedSchedule } as any,
    })

    revalidatePath(`/u/${user.username}/clients`)
    return { success: true, created: unlinked.length }
  } catch (error) {
    console.error('[linkScheduleEntriesToOrders]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to link schedule entries' }
  }
}
