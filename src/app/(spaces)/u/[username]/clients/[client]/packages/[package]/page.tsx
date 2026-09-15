import { redirect, notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { getClientAccountDetail } from '../../detail-data'
import { getPackageDetail, getPackageOrders } from './detail-data'
import { PackageDetailView } from '@/components/dashboard/PackageDetailView'
import type { PackageDoc, PackageOrderSummary } from '@/components/dashboard/package-detail/utils'

/** The package must belong to the client in the URL — otherwise one client's
 *  route could be used to reach another's proposal. */
function belongsToClient(pkg: any, clientId: string) {
  const owner = typeof pkg.clientAccount === 'string' ? pkg.clientAccount : pkg.clientAccount?.id
  return pkg.type === 'proposal' && owner === clientId
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; client: string; package: string }>
}) {
  const { client: clientId, package: packageId } = await params
  const pkg = await getPackageDetail(packageId)
  if (!pkg || !belongsToClient(pkg, clientId)) return { title: 'Package — ORCACLUB' }
  return {
    title: `${pkg.name} — ORCACLUB`,
    description: pkg.description || `Service package ${pkg.name}`,
  }
}

export default async function PackageDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; client: string; package: string }>
  searchParams: Promise<{ doc?: string }>
}) {
  const { username, client: clientId, package: packageId } = await params
  // The Files tab links here for documents this package owns, so a package can be
  // opened straight into the Scope of Work editor rather than at the list.
  const { doc } = await searchParams

  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')

  // The client layout already gates staff-only access and the assignedTo check.
  const [pkg, clientAccount] = await Promise.all([
    getPackageDetail(packageId),
    getClientAccountDetail(clientId),
  ])
  if (!pkg || !clientAccount || !belongsToClient(pkg, clientId)) notFound()

  const payload = await getPayload({ config })

  const [{ docs: projects }, packageOrders, { docs: clientUsers }] = await Promise.all([
    payload.find({
      collection: 'projects',
      where: { client: { equals: clientId } },
      depth: 0,
      sort: '-createdAt',
      limit: 100,
      select: { name: true, status: true },
    }),
    getPackageOrders(packageId),
    // Offered as W-9 recipients — a tax form goes to the people on the account,
    // never to an address typed in from an email.
    payload.find({
      collection: 'users',
      where: { clientAccount: { equals: clientId }, role: { equals: 'client' } },
      depth: 0,
      sort: 'firstName',
      limit: 50,
      select: { firstName: true, lastName: true, email: true },
    }),
  ])

  const serializedPackage: PackageDoc = {
    id: pkg.id,
    name: pkg.name ?? '',
    description: pkg.description ?? null,
    coverMessage: pkg.coverMessage ?? null,
    notes: pkg.notes ?? null,
    status: pkg.status ?? 'draft',
    createdAt: pkg.createdAt,
    projectRef: pkg.projectRef ?? null,
    lineItems: (pkg.lineItems ?? []).map((li: any) => ({
      name: li.name ?? '',
      description: li.description ?? null,
      price: li.price ?? 0,
      adjustedPrice: li.adjustedPrice ?? null,
      quantity: li.quantity ?? 1,
      isRecurring: li.isRecurring ?? false,
      recurringInterval: li.recurringInterval ?? undefined,
      isAddOn: li.isAddOn ?? false,
    })),
    requestedItems: (pkg.requestedItems ?? []).map((r: any) => ({
      name: r.name ?? '',
      requestedAt: r.requestedAt ?? undefined,
    })),
    paymentSchedule: (pkg.paymentSchedule ?? []).map((e: any) => ({
      id: e.id,
      label: e.label ?? '',
      amount: e.amount ?? 0,
      dueDate: e.dueDate ?? null,
      orderId: e.orderId ?? null,
      invoicedAt: e.invoicedAt ?? null,
    })),
  }

  const serializedOrders: PackageOrderSummary[] = packageOrders.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber ?? null,
    amount: o.amount ?? 0,
    status: o.status ?? 'pending',
    invoiceType: o.invoiceType ?? null,
    invoiceNote: o.invoiceNote ?? null,
    stripeInvoiceUrl: o.stripeInvoiceUrl ?? null,
    createdAt: o.createdAt,
  }))

  return (
    <PackageDetailView
      pkg={serializedPackage}
      clientId={clientId}
      clientName={clientAccount.name}
      clientCompany={clientAccount.company ?? null}
      clientAddress={(clientAccount as any).address ?? null}
      clientUsers={clientUsers.map((u: any) => ({
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        email: u.email,
      }))}
      signerName={[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
      username={username}
      projects={projects.map((p: any) => ({ id: p.id, name: p.name ?? '', status: p.status ?? 'pending' }))}
      packageOrders={serializedOrders}
      initialDoc={doc === 'sow' ? 'sow' : null}
    />
  )
}
