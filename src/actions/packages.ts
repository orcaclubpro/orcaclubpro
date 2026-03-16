'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import {
  sendGenericInvoiceEmail,
  sendPaymentScheduleEmail,
  sendProposalEmailToAddresses,
  generateProposalEmail,
  generateProposalEmailText,
} from '@/lib/payload/utils/genericInvoiceEmailTemplate'
import {
  hashProposalDocument,
  buildSigningCertificate,
  ESIGN_CONSENT_TEXT,
} from '@/lib/contract-terms'
import { generateContractPDF } from '@/lib/generate-contract-pdf'

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
    const statusReset = (existing as any)?.status === 'accepted' ? { status: 'sent' as const } : {}

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

    const lineItems = (pkg.lineItems ?? []) as any[]
    if (lineItems.length === 0) {
      return { success: false, error: 'Package has no line items to invoice' }
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
    if (entry.orderId) return { success: false, error: 'Cannot remove an already-invoiced entry' }

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

    const invoiceType = entry.label.toLowerCase().includes('deposit')
      ? 'deposit'
      : entry.label.toLowerCase().includes('milestone')
        ? 'installment'
        : entry.label.toLowerCase().includes('final')
          ? 'balance'
          : 'installment'

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
  entry: { id: string; label: string; amount: number; dueDate?: string | null },
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
  const invoiceType = entry.label.toLowerCase().includes('deposit') ? 'deposit'
    : entry.label.toLowerCase().includes('final') ? 'balance'
    : 'installment'

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

/** Saves payment schedule entries to DB without sending Stripe invoices or emails. Admin/user only. */
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

    const statusReset = (pkg as any)?.status === 'accepted' ? { status: 'sent' } : {}

    await payload.update({
      collection: 'packages',
      id: packageId,
      data: { paymentSchedule: entries, ...statusReset } as any,
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
    const lineItems = (proposal.lineItems ?? []) as any[]

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

/** Client-initiated: re-sends the fully-executed contract URL to the client's own email. */
export async function emailContractToSelf(packageId: string) {
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

    const clientSig = (proposal as any).clientSignature
    const orcaclubSig = (proposal as any).orcaclubSignature
    if (!clientSig?.signedAt || !orcaclubSig?.authorizedAt) {
      return { success: false, error: 'Contract is not fully executed yet' }
    }

    const clientAccount = proposal.clientAccount as any
    const email = clientAccount?.email
    if (!email) return { success: false, error: 'No email address on file' }

    const contractUrl = `${APP_BASE}/u/${user.username}/packages/${packageId}/print`
    const signedDate = new Date(clientSig.signedAt).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })
    const authorizedDate = new Date(orcaclubSig.authorizedAt).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })

    const subject = `Contract Signed | ${proposal.name}`
    const htmlBody = `
      <p>Hi${clientAccount?.name ? ` ${clientAccount.name}` : ''},</p>
      <p>Your service agreement for <strong>${proposal.name}</strong> has been fully executed. Both parties have signed.</p>
      <p><a href="${contractUrl}" style="color:#0891b2;font-weight:600;">View &amp; Print Signed Contract →</a></p>
      <p style="font-size:12px;color:#6b7280;">
        Client signed: ${signedDate}<br>
        ORCACLUB authorized: ${authorizedDate}
      </p>
      <p>Keep this email and the contract link for your records.</p>
      <p>— ORCACLUB</p>
    `
    const textBody = `Your service agreement for ${proposal.name} has been fully executed. Both parties have signed.\n\nView the signed contract at: ${contractUrl}\n\nClient signed: ${signedDate}\nORCACLUB authorized: ${authorizedDate}\n\nKeep this email and the contract link for your records.`

    await payload.sendEmail({ to: email, from: 'carbon@orcaclub.pro', subject, html: htmlBody, text: textBody })
    return { success: true }
  } catch (error) {
    console.error('[emailContractToSelf]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

export async function sendProposalEmail(
  packageId: string,
  emails: string[],
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

    const result = await sendProposalEmailToAddresses(payload, {
      packageName: pkg.name,
      packageDescription: pkg.description ?? undefined,
      coverMessage: (pkg as any).coverMessage ?? undefined,
      lineItems: lineItems.map((item: any) => ({
        name: item.name,
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
    }, validEmails)

    return result
  } catch (error) {
    console.error('[sendProposalEmail]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send proposal' }
  }
}

// ── E-Signature Actions ──────────────────────────────────────────────────────

/**
 * Emails the fully-executed (signed by both parties) contract to the client
 * and ORCACLUB. This is a non-blocking fire-and-forget email — it does not
 * return invoices or change package status.
 */
export async function sendSignedContract(packageId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!pkg || pkg.type !== 'proposal') return { success: false, error: 'Proposal not found' }

    const clientSig = (pkg as any).clientSignature
    const orcaclubSig = (pkg as any).orcaclubSignature
    const bothSigned = !!clientSig?.signedAt && !!orcaclubSig?.authorizedAt

    if (!bothSigned) {
      return { success: false, error: 'Both parties must sign before sending the contract.' }
    }

    const clientAccount = pkg.clientAccount as any
    const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount?.id
    const clientEmail = typeof clientAccount === 'object' ? (clientAccount?.email ?? null) : null
    const clientName  = typeof clientAccount === 'object' ? (clientAccount?.name  ?? null) : null

    const clientUsername = await getClientUsername(payload, clientAccountId)
    const contractUrl = clientUsername
      ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
      : null

    if (!contractUrl) {
      return { success: false, error: 'Could not build contract URL — client has no username.' }
    }

    const signedDate = new Date(clientSig.signedAt).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })

    const subject = `Contract Signed |${pkg.name}`
    const htmlBody = `
      <p>Hi${clientName ? ` ${clientName}` : ''},</p>
      <p>Your service agreement for <strong>${pkg.name}</strong> has been fully executed. Both parties have signed.</p>
      <p><a href="${contractUrl}" style="color:#0891b2;font-weight:600;">View &amp; Print Signed Contract →</a></p>
      <p style="font-size:12px;color:#6b7280;">
        Client signed: ${signedDate}<br>
        ORCACLUB authorized: ${new Date(orcaclubSig.authorizedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
      <p>Keep this email and the contract link for your records.</p>
      <p>— ORCACLUB</p>
    `
    const textBody = `Your service agreement for ${pkg.name} has been fully executed. Both parties have signed.\n\nView the signed contract at: ${contractUrl}\n\nClient signed: ${signedDate}\nORCACLUB authorized: ${new Date(orcaclubSig.authorizedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\nKeep this email and the contract link for your records.`

    const sends: Promise<any>[] = []

    if (clientEmail) {
      sends.push(
        payload.sendEmail({
          to: clientEmail,
          from: 'carbon@orcaclub.pro',
          subject,
          html: htmlBody,
          text: textBody,
        })
      )
    }

    sends.push(
      payload.sendEmail({
        to: 'carbon@orcaclub.pro',
        from: 'carbon@orcaclub.pro',
        subject: `[Contract Executed] ${pkg.name} — ${clientName ?? clientEmail}`,
        html: `<p>The service agreement for <strong>${pkg.name}</strong> has been fully executed by both parties.</p>${htmlBody}`,
        text: textBody,
      })
    )

    await Promise.allSettled(sends)

    // Non-blocking: generate PDF if not already archived
    if (!(pkg as any).contractFile) {
      ;(async () => {
        try {
          await generateContractPDF(payload, packageId, pkg)
        } catch (e) {
          console.error('[sendSignedContract] Contract PDF generation failed:', e)
        }
      })()
    }

    revalidatePath(`/u/${user.username}/clients`)
    return { success: true, contractUrl }
  } catch (error) {
    console.error('[sendSignedContract]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send contract' }
  }
}

/**
 * Client signs the proposal with a typed name e-signature (ESIGN/UETA compliant).
 * Captures a full audit trail: typed name, timestamp, IP, user agent, document hash,
 * and a tamper-evident signing certificate hash.
 * On success, calls the existing acceptPackage logic to create invoices.
 */
export async function signProposal({
  packageId,
  typedName,
}: {
  packageId: string
  typedName: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (!typedName.trim()) return { success: false, error: 'Please type your full legal name to sign.' }

    const payload = await getPayload({ config })

    // Fetch and verify ownership
    const proposal = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!proposal || proposal.type !== 'proposal') return { success: false, error: 'Proposal not found' }

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
      return { success: false, error: 'This proposal has already been signed.' }
    }
    if ((proposal as any).clientSignature?.signedAt) {
      return { success: false, error: 'This proposal has already been signed.' }
    }

    // Compute document hash server-side (source of truth)
    const documentHash = hashProposalDocument({
      id: proposal.id,
      name: proposal.name,
      description: (proposal as any).description,
      coverMessage: (proposal as any).coverMessage,
      notes: (proposal as any).notes,
      lineItems: (proposal.lineItems ?? []) as any,
      paymentSchedule: ((proposal as any).paymentSchedule ?? []) as any,
      updatedAt: proposal.updatedAt,
    })

    // Collect audit data
    const hdrs = await headers()
    const ipAddress =
      hdrs.get('x-forwarded-for')?.split(',')[0].trim() ||
      hdrs.get('x-real-ip') ||
      hdrs.get('cf-connecting-ip') ||
      '0.0.0.0'
    const userAgent = hdrs.get('user-agent') || ''
    const signedAt = new Date().toISOString()

    // Build tamper-evident signing certificate
    const { signingCertificate, certificateHash } = buildSigningCertificate({
      packageId,
      typedName: typedName.trim(),
      signedByEmail: user.email,
      signedAt,
      ipAddress,
      userAgent,
      documentHash,
    })

    // Persist the signature record (overrideAccess defaults to true for Local API)
    await payload.update({
      collection: 'packages',
      id: packageId,
      data: {
        clientSignature: {
          typedName: typedName.trim(),
          signedByEmail: user.email,
          signedByUserId: String(user.id),
          signedAt,
          ipAddress,
          userAgent,
          documentHash,
          consentText: ESIGN_CONSENT_TEXT,
          certificateHash,
          signingCertificate,
        },
      } as any,
    })

    // Send certificate hash confirmation email to both parties (non-blocking, independent timestamp anchor)
    ;(async () => {
      try {
        const clientAccount = proposal.clientAccount as any
        const clientEmail = typeof clientAccount === 'object' ? clientAccount?.email : null
        const clientName = typeof clientAccount === 'object' ? clientAccount?.name : null
        const orcaclubSig = (proposal as any).orcaclubSignature

        const signedLine = `Signed by: ${typedName.trim()} <${user.email}> on ${new Date(signedAt).toUTCString()}`
        const certLine = `Certificate hash: ${certificateHash}`
        const docLine = `Document hash: ${documentHash.slice(0, 16)}...`

        if (clientEmail) {
          await payload.sendEmail({
            to: clientEmail,
            from: 'carbon@orcaclub.pro',
            subject: `Signed: ${proposal.name} — ORCACLUB`,
            html: `<p>Hi ${clientName ?? 'there'},</p><p>Your signature has been recorded for <strong>${proposal.name}</strong>.</p><p style="font-family:monospace;font-size:12px;background:#f4f4f4;padding:12px;border-radius:4px;">${signedLine}<br>${docLine}<br>${certLine}</p><p>Keep this email as your signature record. Your invoices will follow separately.</p><p>— ORCACLUB</p>`,
            text: `Your signature has been recorded for ${proposal.name}.\n\n${signedLine}\n${docLine}\n${certLine}\n\nKeep this email as your signature record.`,
          })
        }
        // Notify ORCACLUB
        await payload.sendEmail({
          to: 'carbon@orcaclub.pro',
          from: 'carbon@orcaclub.pro',
          subject: `[Signed] ${proposal.name} — ${clientName ?? clientEmail}`,
          html: `<p><strong>${proposal.name}</strong> has been signed by ${typedName.trim()} (${user.email}).</p><p style="font-family:monospace;font-size:12px;background:#f4f4f4;padding:12px;border-radius:4px;">${signedLine}<br>IP: ${ipAddress}<br>${docLine}<br>${certLine}</p>`,
          text: `${proposal.name} signed by ${typedName.trim()} (${user.email}).\nIP: ${ipAddress}\n${docLine}\n${certLine}`,
        })

        // If ORCACLUB had already signed, the contract is now fully executed — send the signed copy to both parties.
        if (orcaclubSig?.authorizedAt) {
          const clientAccountId = typeof clientAccount === 'object'
            ? clientAccount?.id
            : clientAccount
          const clientUsername = await getClientUsername(payload, clientAccountId)
          const contractUrl = clientUsername
            ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
            : null

          if (contractUrl) {
            const executedDate = new Date(signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            const contractSubject = `Contract Signed |${proposal.name}`
            const contractHtml = `<p>Hi ${clientName ?? 'there'},</p><p>Your service agreement for <strong>${proposal.name}</strong> is now fully executed. Both parties have signed.</p><p><a href="${contractUrl}" style="color:#0891b2;font-weight:600;">View &amp; Print Signed Contract →</a></p><p style="font-size:12px;color:#6b7280;">Client signed: ${executedDate}<br>ORCACLUB authorized: ${new Date(orcaclubSig.authorizedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p><p>Keep this email for your records.</p><p>— ORCACLUB</p>`
            const contractText = `Your service agreement for ${proposal.name} is now fully executed.\n\nView the signed contract: ${contractUrl}\n\nClient signed: ${executedDate}\nORCACLUB authorized: ${new Date(orcaclubSig.authorizedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`

            const contractSends: Promise<any>[] = []
            if (clientEmail) {
              contractSends.push(payload.sendEmail({ to: clientEmail, from: 'carbon@orcaclub.pro', subject: contractSubject, html: contractHtml, text: contractText }))
            }
            contractSends.push(payload.sendEmail({ to: 'carbon@orcaclub.pro', from: 'carbon@orcaclub.pro', subject: `[Contract Executed] ${proposal.name} — ${clientName ?? clientEmail}`, html: contractHtml, text: contractText }))
            await Promise.allSettled(contractSends)
          }

          // Non-blocking: generate and archive the signed contract PDF
          ;(async () => {
            try {
              await generateContractPDF(payload, packageId, proposal)
            } catch (e) {
              console.error('[signProposal] Contract PDF generation failed:', e)
            }
          })()
        }
      } catch (e) {
        console.error('[signProposal] Confirmation email failed:', e)
      }
    })()

    // Send only the FIRST pending schedule entry; leave the rest for staff to invoice manually.
    const schedule = ((proposal as any).paymentSchedule ?? []) as Array<{
      id: string; label: string; amount: number; dueDate?: string | null; orderId?: string | null
    }>
    const pendingEntries = schedule.filter(e => !e.orderId)
    const lineItems = (proposal.lineItems ?? []) as any[]

    const clientAccount = proposal.clientAccount as any
    const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount?.id
    const stripeCustomerId = typeof clientAccount === 'object' ? clientAccount?.stripeCustomerId : null

    if (!stripeCustomerId || (pendingEntries.length === 0 && lineItems.length === 0)) {
      // No billing info or nothing to invoice — still mark accepted, return partial success if needed
      await payload.update({
        collection: 'packages',
        id: packageId,
        data: { status: 'accepted' } as any,
      })
      revalidatePath(`/u/${user.username}`)
      const warning = !stripeCustomerId
        ? 'No payment method on file — contact your team to set up billing.'
        : undefined
      return { success: true, invoiceUrls: [], warning }
    }

    const stripe = getStripe()
    const invoiceUrls: string[] = []

    if (schedule.length > 0 && pendingEntries.length > 0) {
      // Invoice only the first pending entry; the rest stay pending for staff to push later.
      const firstEntry = pendingEntries[0]
      const { orderId, invoiceUrl } = await _sendScheduleEntryInvoice(
        payload, stripe, firstEntry, packageId, proposal.name, clientAccountId, stripeCustomerId, user.id,
      )

      const updatedSchedule = schedule.map(e =>
        e.id === firstEntry.id ? { ...e, orderId, invoicedAt: new Date().toISOString() } : e
      )

      await payload.update({
        collection: 'packages',
        id: packageId,
        data: { paymentSchedule: updatedSchedule, status: 'accepted' } as any,
      })

      if (invoiceUrl) invoiceUrls.push(invoiceUrl)

      // Non-blocking: send a schedule overview email so the client sees all upcoming payments
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
          console.error('[signProposal] Schedule confirmation email failed:', e)
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

      await payload.update({
        collection: 'packages',
        id: packageId,
        data: { status: 'accepted' } as any,
      })

      // Non-blocking invoice email
      ;(async () => {
        try {
          const clientUsername = await getClientUsername(payload, clientAccountId)
          const proposalPrintUrl = clientUsername
            ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
            : undefined
          await sendGenericInvoiceEmail(payload, order.id, user.id, proposalPrintUrl)
        } catch (e) {
          console.error('[signProposal] Invoice email failed:', e)
        }
      })()
    }

    revalidatePath(`/u/${user.username}`)
    return { success: true, invoiceUrls }
  } catch (error) {
    console.error('[signProposal]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to sign proposal' }
  }
}

/**
 * Staff (admin/user) authorizes a proposal on behalf of ORCACLUB.
 * Records the authorizing rep's name, email, and timestamp.
 * Optionally sets status to 'sent'.
 */
export async function authorizeProposal({
  packageId,
  authorizedByName,
  setSentStatus = true,
}: {
  packageId: string
  authorizedByName: string
  setSentStatus?: boolean
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }
    if (!authorizedByName.trim()) return { success: false, error: 'Please enter your full name.' }

    const payload = await getPayload({ config })

    const proposal = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
    if (!proposal || proposal.type !== 'proposal') return { success: false, error: 'Proposal not found' }

    const authorizedAt = new Date().toISOString()

    await payload.update({
      collection: 'packages',
      id: packageId,
      data: {
        ...(setSentStatus && (proposal as any).status === 'draft' ? { status: 'sent' } : {}),
        orcaclubSignature: {
          authorizedByName: authorizedByName.trim(),
          authorizedByEmail: user.email,
          authorizedByUserId: String(user.id),
          authorizedAt,
        },
      } as any,
    })

    // If the client had already signed, the contract is now fully executed — send it to both parties.
    const clientSig = (proposal as any).clientSignature
    if (clientSig?.signedAt) {
      ;(async () => {
        try {
          const clientAccount = proposal.clientAccount as any
          const clientAccountId = typeof clientAccount === 'string' ? clientAccount : clientAccount?.id
          const clientEmail = typeof clientAccount === 'object' ? (clientAccount?.email ?? null) : null
          const clientName  = typeof clientAccount === 'object' ? (clientAccount?.name  ?? null) : null

          const clientUsername = await getClientUsername(payload, clientAccountId)
          const contractUrl = clientUsername
            ? `${APP_BASE}/u/${clientUsername}/packages/${packageId}/print`
            : null

          if (contractUrl) {
            const contractSubject = `Contract Signed |${proposal.name}`
            const contractHtml = `<p>Hi ${clientName ?? 'there'},</p><p>Your service agreement for <strong>${proposal.name}</strong> is now fully executed. Both parties have signed.</p><p><a href="${contractUrl}" style="color:#0891b2;font-weight:600;">View &amp; Print Signed Contract →</a></p><p style="font-size:12px;color:#6b7280;">Client signed: ${new Date(clientSig.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}<br>ORCACLUB authorized: ${new Date(authorizedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p><p>Keep this email for your records.</p><p>— ORCACLUB</p>`
            const contractText = `Your service agreement for ${proposal.name} is now fully executed.\n\nView the signed contract: ${contractUrl}`

            const sends: Promise<any>[] = []
            if (clientEmail) {
              sends.push(payload.sendEmail({ to: clientEmail, from: 'carbon@orcaclub.pro', subject: contractSubject, html: contractHtml, text: contractText }))
            }
            sends.push(payload.sendEmail({ to: 'carbon@orcaclub.pro', from: 'carbon@orcaclub.pro', subject: `[Contract Executed] ${proposal.name} — ${clientName ?? clientEmail}`, html: contractHtml, text: contractText }))
            await Promise.allSettled(sends)

            // Non-blocking: generate and archive the signed contract PDF
            ;(async () => {
              try {
                // Attach the freshly-set orcaclubSignature so generateContractPDF sees both sigs
                const freshPkg = { ...proposal, orcaclubSignature: { authorizedByName: authorizedByName.trim(), authorizedByEmail: user.email, authorizedAt } }
                await generateContractPDF(payload, packageId, freshPkg)
              } catch (e) {
                console.error('[authorizeProposal] Contract PDF generation failed:', e)
              }
            })()
          }
        } catch (e) {
          console.error('[authorizeProposal] Contract email failed:', e)
        }
      })()
    }

    revalidatePath(`/u/${user.username}/clients`)
    return { success: true }
  } catch (error) {
    console.error('[authorizeProposal]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to authorize proposal' }
  }
}
