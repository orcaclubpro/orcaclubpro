'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getStripe } from '@/lib/stripe'

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
}: {
  packageId: string
  clientAccountId: string
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
        name: template.name,
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

    return { success: true, templateLineItems }
  } catch (error) {
    console.error('[getProposalWithTemplate]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed', templateLineItems: [] as any[] }
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

export async function createOrderFromPackage(packageId: string) {
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

    const stripe = getStripe()

    // Generate order number
    const orderCount = await payload.count({ collection: 'orders' })
    const orderNumber = `INV-${String(orderCount.totalDocs + 1).padStart(4, '0')}`

    const totalAmount = lineItems.reduce(
      (sum: number, item: any) => sum + (item.price ?? 0) * (item.quantity ?? 1),
      0
    )

    // Create Payload order first
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        clientAccount: clientAccountId,
        amount: totalAmount,
        status: 'pending',
        stripeCustomerId,
        lineItems: lineItems.map((item: any) => ({
          title: item.name,
          quantity: item.quantity ?? 1,
          price: item.price ?? 0,
          isRecurring: item.isRecurring ?? false,
        })),
      } as any,
    })

    // Create Stripe invoice items
    for (const item of lineItems) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        amount: Math.round((item.price ?? 0) * (item.quantity ?? 1) * 100),
        currency: 'usd',
        description: item.name,
        metadata: { order_number: orderNumber, orcaclub_order_id: order.id },
      })
    }

    // Create draft invoice
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      auto_advance: false,
      description: `Order ${orderNumber} — ${pkg.name}`,
      metadata: {
        order_number: orderNumber,
        orcaclub_order_id: order.id,
        orcaclub_package_id: packageId,
      },
    })

    if (!invoice.lines?.data || invoice.lines.data.length === 0) {
      throw new Error('Invoice was created but has no line items')
    }

    // Finalize → hosted_invoice_url
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id)

    // Update order with Stripe invoice details
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        stripeInvoiceId: finalized.id,
        stripeInvoiceUrl: finalized.hosted_invoice_url || '',
      } as any,
    })

    revalidatePath(`/u/${user.username}/clients`)

    return {
      success: true,
      invoiceUrl: finalized.hosted_invoice_url,
      orderNumber,
      orderId: order.id,
    }
  } catch (error) {
    console.error('[createOrderFromPackage]', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create invoice' }
  }
}
