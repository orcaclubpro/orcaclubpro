import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AlertCircle } from 'lucide-react'
import { CollapsibleSidebar } from '@/components/dashboard/CollapsibleSidebar'
import { ClientSidebar, ClientSidebarContent } from '@/components/dashboard/ClientSidebar'
import { SetHeaderTitle } from '@/components/layout/SetHeaderTitle'
import { PageEnterAnimation } from '@/components/dashboard/PageEnterAnimation'
import type { ClientAccount, User as UserType } from '@/types/payload-types'

export default async function ClientDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string; client: string }>
}) {
  const { username, client: clientId } = await params

  const user = await getCurrentUser()
  if (!user || user.username !== username) redirect('/login')
  if (user.role === 'client') redirect(`/u/${username}`)

  const payload = await getPayload({ config })

  let clientAccount: ClientAccount
  try {
    clientAccount = await payload.findByID({
      collection: 'client-accounts',
      id: clientId,
      depth: 2,
    })
  } catch {
    notFound()
  }

  if (user.role !== 'admin') {
    const assignedIds = Array.isArray(clientAccount.assignedTo)
      ? clientAccount.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
      : []
    if (!assignedIds.includes(user.id)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl border border-red-400/20 bg-[#252525] p-8 text-center">
            <div className="inline-flex p-5 rounded-xl bg-red-400/10 border border-red-400/20 mb-6">
              <AlertCircle className="size-10 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-[#F0F0F0] mb-2">Access Denied</h2>
            <p className="text-[#6B6B6B] text-sm">
              You do not have permission to view this client account.
            </p>
          </div>
        </div>
      )
    }
  }

  const [{ docs: ordersLite }, { totalDocs: projectsCount }, { docs: clientUsers }, { docs: allClients }] =
    await Promise.all([
      payload.find({
        collection: 'orders',
        where: { clientAccount: { equals: clientId } },
        select: { amount: true, status: true },
        depth: 0,
        limit: 200,
      }),
      payload.find({
        collection: 'projects',
        where: { client: { equals: clientId } },
        depth: 0,
        limit: 0,
      }),
      payload.find({
        collection: 'users',
        where: { clientAccount: { equals: clientId }, role: { equals: 'client' } },
        depth: 0,
        sort: 'firstName',
        limit: 50,
      }),
      payload.find({
        collection: 'client-accounts',
        user,
        overrideAccess: false,
        depth: 0,
        sort: 'name',
        limit: 100,
        select: { name: true, company: true },
      }),
    ])

  const totalRevenue = ordersLite
    .filter((o) => o.status === 'paid')
    .reduce((s, o) => s + (o.amount || 0), 0)

  const teamMembers = Array.isArray(clientAccount.assignedTo)
    ? clientAccount.assignedTo
        .filter((u): u is UserType => typeof u !== 'string')
        .map((u) => ({
          id: u.id,
          name: (u.name || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email) ?? '',
          title: u.title ?? null,
        }))
    : []

  const sidebarProps = {
    id: clientId,
    name: clientAccount.name,
    firstName: clientAccount.firstName ?? '',
    lastName: clientAccount.lastName ?? '',
    email: clientAccount.email,
    company: clientAccount.company,
    accountBalance: clientAccount.accountBalance ?? 0,
    totalRevenue,
    ordersCount: ordersLite.length,
    projectsCount,
    stripeCustomerId: clientAccount.stripeCustomerId,
    teamMembers,
    clientUsers: clientUsers.map((u) => ({
      id: u.id,
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
      email: u.email,
    })),
    username,
    allClients: allClients.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company ?? null,
    })),
  }

  return (
    <div className="lg:flex" style={{ minHeight: 'calc((100vh - 64px) / 1.3)' }}>
      <SetHeaderTitle title={clientAccount.name} />

      <CollapsibleSidebar>
        <ClientSidebarContent {...sidebarProps} />
      </CollapsibleSidebar>

      <div className="flex-1 min-w-0 flex flex-col">
        <ClientSidebar {...sidebarProps} />
        <PageEnterAnimation>
          {children}
        </PageEnterAnimation>
      </div>
    </div>
  )
}
