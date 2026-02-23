'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getStripe } from '@/lib/stripe'

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
}) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const pkg = await payload.update({
      collection: 'packages',
      id: packageId,
      data: { name, description, coverMessage, notes, lineItems },
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
      (sum: number, item: any) => sum + (item.price ?? 0) * (item.quantity ?? 1),
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
      const totalCents = Math.round((item.price ?? 0) * qty * 100)
      const descParts = [
        item.name,
        qty > 1 ? `${qty} × $${item.price}` : null,
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
          price: item.price ?? 0,
          isRecurring: item.isRecurring ?? false,
        })),
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

    const pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 0 })
    if (!pkg || pkg.type !== 'proposal') {
      return { success: false, error: 'Package proposal not found' }
    }

    const updated = await payload.update({
      collection: 'packages',
      id: packageId,
      data: { paymentSchedule: entries } as any,
    })

    revalidatePath(`/u/${user.username}/clients`)

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
