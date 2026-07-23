'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { SowFormData } from '@/lib/document-generators'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
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
import { buildPackagePdf, buildOrcaclubSowPdf } from '@/lib/pdf-generators'

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

/** Find the highest existing INV-NNNN number and return the next one. */
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

    // Generate order number (max-based — safe even if orders were deleted)
    const orderNumber = await nextOrderNumber(payload)

    const totalAmount = lineItems.reduce(
      (sum: number, item: any) => sum + (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1),
      0
    )

    // 1. Create Stripe invoice BEFORE touching the DB.
    //    Webhook looks up the order by stripeInvoiceId (more reliable than metadata).
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: daysUntilDue,
      auto_advance: false,
      description: `Order ${orderNumber} — ${pkg.name}`,
      metadata: {
        order_number: orderNumber,
        orcaclub_package_id: packageId,
      },
    })

    // 2. Attach each line item directly to this invoice.
    //    Explicit attachment avoids pending items floating to unrelated invoices.
    for (const item of lineItems) {
      const qty = item.quantity ?? 1
      const unitPrice = item.adjustedPrice ?? item.price ?? 0
      const totalCents = Math.round(unitPrice * qty * 100)
      const descParts = [
        item.name,
        qty > 1 ? `${qty} × $${unitPrice}` : null,
        item.description || null,
      ].filter(Boolean)
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        invoice: invoice.id,
        amount: totalCents,
        currency: 'usd',
        description: descParts.join(' — '),
        metadata: { order_number: orderNumber },
      })
    }

    // 3. Finalize → locks the invoice and generates hosted_invoice_url.
    finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

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

    // Delete the pending order if one was created for this entry
    if (entry.orderId && !entry.invoicedAt) {
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

export async function sendScheduledPayment(
  packageId: string,
  entryId: string,
  projectId?: string,
  skipEmail?: boolean,
) {
  let finalizedInvoice: any = null
  let stripe: ReturnType<typeof getStripe> | null = null

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

    const daysUntilDue = entry.dueDate
      ? Math.max(1, Math.round((new Date(entry.dueDate).getTime() - Date.now()) / 86400000))
      : 30

    const orderNumber = await nextOrderNumber(payload)

    const invoiceType = resolveInvoiceType(entry)

    stripe = getStripe()

    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: daysUntilDue,
      auto_advance: false,
      description: `Order ${orderNumber} — ${pkg.name}`,
      metadata: {
        order_number: orderNumber,
        orcaclub_package_id: packageId,
        orcaclub_invoice_type: invoiceType,
        orcaclub_schedule_entry_id: entryId,
      },
    })

    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: invoice.id,
      amount: Math.round(entry.amount * 100),
      currency: 'usd',
      description: `${entry.label} — ${pkg.name}`,
      metadata: { order_number: orderNumber },
    })

    finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

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
        lineItems: [{ title: entry.label, price: entry.amount, quantity: 1 }],
      } as any,
    })

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

    // Non-blocking: send "New Invoice" email to client (skipped if skipEmail is true)
    if (!skipEmail) {
      ;(async () => {
        try {
          const clientUsername = await getClientUsername(payload, clientAccountId)
          const proposalPrintUrl = clientUsername
            ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
            : undefined
          await sendGenericInvoiceEmail(payload, order.id, user.id, proposalPrintUrl)
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
    }
  } catch (error) {
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

    // Generate order number (max-based — safe even if orders were deleted)
    const orderNumber = await nextOrderNumber(payload)

    // Map label to invoiceType
    const invoiceType = label.toLowerCase().includes('deposit') ? 'deposit'
      : label.toLowerCase().includes('milestone') ? 'installment'
      : label.toLowerCase().includes('final') ? 'balance'
      : 'installment'

    // 1. Create Stripe invoice
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: daysUntilDue,
      auto_advance: false,
      description: `Order ${orderNumber} — ${pkg.name}`,
      metadata: {
        order_number: orderNumber,
        orcaclub_package_id: packageId,
        orcaclub_invoice_type: invoiceType,
      },
    })

    // 2. Single line item for the partial amount
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: invoice.id,
      amount: Math.round(amount * 100),
      currency: 'usd',
      description: `${label} — ${pkg.name}`,
      metadata: { order_number: orderNumber },
    })

    // 3. Finalize
    finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

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

  const orderNumber = await nextOrderNumber(payload)
  const invoiceType = resolveInvoiceType(entry)

  const invoice = await stripe.invoices.create({
    customer: stripeCustomerId,
    collection_method: 'send_invoice',
    days_until_due: daysUntilDue,
    auto_advance: false,
    description: `Order ${orderNumber} — ${proposalName}`,
    metadata: { order_number: orderNumber, orcaclub_package_id: packageId, orcaclub_invoice_type: invoiceType },
  })

  await stripe.invoiceItems.create({
    customer: stripeCustomerId,
    invoice: invoice.id,
    amount: Math.round(entry.amount * 100),
    currency: 'usd',
    description: `${entry.label} — ${proposalName}`,
    metadata: { order_number: orderNumber },
  })

  const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

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
      const orderNumber = await nextOrderNumber(payload)
      const totalAmount = lineItems.reduce((s: number, item: any) => s + (item.price ?? 0) * (item.quantity ?? 1), 0)

      const invoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        collection_method: 'send_invoice',
        days_until_due: 30,
        auto_advance: false,
        description: `Order ${orderNumber} — ${proposal.name}`,
        metadata: { order_number: orderNumber, orcaclub_package_id: packageId },
      })

      for (const item of lineItems) {
        await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          invoice: invoice.id,
          amount: Math.round((item.price ?? 0) * (item.quantity ?? 1) * 100),
          currency: 'usd',
          description: item.name,
          metadata: { order_number: orderNumber },
        })
      }

      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

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
