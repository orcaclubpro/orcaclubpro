import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AccountOverview } from '@/components/dashboard/AccountOverview'
import { OrdersList } from '@/components/dashboard/OrdersList'
import { ProjectsList } from '@/components/dashboard/ProjectsList'
import { ActivityTimeline, type ActivityEvent } from '@/components/dashboard/visualizations/ActivityTimeline'
import {
  Mail,
  HelpCircle,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { BusinessPulse } from '@/components/dashboard/BusinessPulse'
import { Button } from '@/components/ui/button'
import type { Order } from '@/types/payload-types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Dashboard - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await getCurrentUser()

  if (!user || user.username !== username) {
    redirect('/login')
  }

  if (!user.username) {
    redirect('/login')
  }

  const payload = await getPayload({ config })

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatDateShort = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateString))

  // ─── ADMIN / USER VIEW ────────────────────────────────────────────────────

  if (user.role === 'admin' || user.role === 'user') {
    const { docs: clientAccounts } = await payload.find({
      collection: 'client-accounts',
      where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
      depth: 1,
      limit: 100,
    })

    const clientAccountIds = clientAccounts.map((ca: any) => ca.id)

    const [{ docs: allOrders }, { docs: allProjects }, { docs: allTasks }, { docs: recentOrders }] =
      await Promise.all([
        payload.find({
          collection: 'orders',
          where: clientAccountIds.length > 0 ? { clientAccount: { in: clientAccountIds } } : { id: { equals: 'none' } },
          limit: 100,
        }),
        payload.find({
          collection: 'projects',
          where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
          limit: 50,
        }),
        payload.find({
          collection: 'tasks',
          where: user.role === 'admin' ? {} : { assignedTo: { equals: user.id } },
          limit: 50,
        }),
        payload.find({
          collection: 'orders',
          where: clientAccountIds.length > 0 ? { clientAccount: { in: clientAccountIds } } : { id: { equals: 'none' } },
          depth: 2,
          sort: '-createdAt',
          limit: 10,
        }),
      ])

    const totalRevenue = allOrders
      .filter((o: any) => o.status === 'paid')
      .reduce((sum, o: any) => sum + (o.amount || 0), 0)

    const pendingBalance = allOrders
      .filter((o: any) => o.status === 'pending')
      .reduce((sum, o: any) => sum + (o.amount || 0), 0)

    const activeProjects = allProjects.filter(
      (p: any) => p.status === 'in-progress' || p.status === 'pending'
    ).length

    const pendingTasks = allTasks.filter((t: any) => t.status === 'pending').length

    const statusDot: Record<string, string> = {
      paid: 'bg-green-400',
      pending: 'bg-yellow-400',
      cancelled: 'bg-red-400',
    }

    const metrics = [
      { label: 'Total Revenue', value: formatCurrency(totalRevenue), sub: 'Paid orders', primary: true },
      { label: 'Pending Balance', value: formatCurrency(pendingBalance), sub: 'Outstanding' },
      { label: 'Active Projects', value: String(activeProjects), sub: 'In progress' },
      { label: 'Open Tasks', value: String(pendingTasks), sub: 'Pending' },
    ]

    // ── 30-day pulse data ──────────────────────────────────────────────────
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const orders30d = allOrders.filter(
      (o: any) => new Date(o.createdAt).getTime() > thirtyDaysAgo
    )

    // Weekly buckets: week 4 (oldest) → week 1 (most recent)
    const weeklyRevenue = [3, 2, 1, 0].map((weeksAgo) => {
      const weekEnd = now - weeksAgo * 7 * 24 * 60 * 60 * 1000
      const weekStart = weekEnd - 7 * 24 * 60 * 60 * 1000
      const weekOrders = orders30d.filter((o: any) => {
        const t = new Date(o.createdAt).getTime()
        return t > weekStart && t <= weekEnd
      })
      const revenue = weekOrders
        .filter((o: any) => o.status === 'paid')
        .reduce((sum: number, o: any) => sum + (o.amount || 0), 0)
      const weekDate = new Date(weekStart)
      const label = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return { label, revenue, orders: weekOrders.length }
    })

    const orderPipeline = {
      paidAmount: orders30d.filter((o: any) => o.status === 'paid').reduce((s: number, o: any) => s + (o.amount || 0), 0),
      pendingAmount: orders30d.filter((o: any) => o.status === 'pending').reduce((s: number, o: any) => s + (o.amount || 0), 0),
      cancelledAmount: orders30d.filter((o: any) => o.status === 'cancelled').reduce((s: number, o: any) => s + (o.amount || 0), 0),
      paidCount: orders30d.filter((o: any) => o.status === 'paid').length,
      pendingCount: orders30d.filter((o: any) => o.status === 'pending').length,
      cancelledCount: orders30d.filter((o: any) => o.status === 'cancelled').length,
    }

    const projectStatus = {
      active: allProjects.filter((p: any) => p.status === 'in-progress').length,
      pending: allProjects.filter((p: any) => p.status === 'pending').length,
      completed: allProjects.filter((p: any) => p.status === 'completed').length,
    }

    const pulseKpis = {
      revenue30d: orderPipeline.paidAmount,
      orders30d: orders30d.length,
      activeClients: clientAccounts.filter((ca: any) => ca.accountBalance > 0 || (ca.projects?.length ?? 0) > 0).length,
      activeProjects: projectStatus.active,
    }

    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-16 space-y-10">

        {/* Page Header */}
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-3">
            {user.role === 'admin' ? 'Admin' : 'Dashboard'}
          </p>
          <DashboardGreeting
            firstName={user.firstName}
            subtitle={
              user.role === 'admin'
                ? `${clientAccounts.length} clients · ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
                : `${clientAccounts.length} assigned client${clientAccounts.length !== 1 ? 's' : ''} · ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
            }
          />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <div
              key={i}
              className={`rounded-xl border p-5 ${
                m.primary
                  ? 'bg-gradient-to-br from-cyan-950/40 to-[#0a0a0a] border-cyan-400/20'
                  : 'bg-gradient-to-b from-[#141414] to-[#0e0e0e] border-white/[0.07]'
              }`}
            >
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{m.label}</p>
              <p className={`text-2xl font-bold mt-2 tracking-tight ${m.primary ? 'text-intelligence-cyan' : 'text-white'}`}>
                {m.value}
              </p>
              <p className="text-xs text-gray-600 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* 30-day business pulse */}
        <BusinessPulse
          weeklyRevenue={weeklyRevenue}
          orderPipeline={orderPipeline}
          projectStatus={projectStatus}
          kpis={pulseKpis}
        />

        {/* Two-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Recent Orders */}
          <div className="lg:col-span-3 rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141414] to-[#0e0e0e] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            </div>

            {recentOrders.length > 0 ? (
              <div>
                {recentOrders.map((order: any) => {
                  const ca = typeof order.clientAccount === 'object' ? order.clientAccount : null
                  const dotColor = statusDot[order.status] || 'bg-gray-600'
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                    >
                      <div className={`size-1.5 rounded-full shrink-0 ${dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white font-medium">{order.orderNumber}</span>
                        {ca && (
                          <span className="text-sm text-gray-500 ml-2 truncate">{ca.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-sm font-medium text-white">
                          {formatCurrency(order.amount || 0)}
                        </span>
                        <span className="text-xs text-gray-600 hidden sm:block w-16 text-right">
                          {formatDateShort(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600 py-10 text-center">No orders yet</p>
            )}
          </div>

          {/* Clients sidebar */}
          <div className="lg:col-span-2 rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141414] to-[#0e0e0e] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Clients</h2>
              <Link
                href={`/u/${username}/clients`}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                View all →
              </Link>
            </div>

            {clientAccounts.length > 0 ? (
              <div>
                {clientAccounts.slice(0, 8).map((account: any) => (
                  <Link
                    key={account.id}
                    href={`/u/${username}/clients/${account.id}`}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="size-7 rounded-full bg-[#111] border border-white/[0.08] flex items-center justify-center text-xs font-semibold text-gray-400 shrink-0">
                      {account.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-sm text-gray-300 flex-1 min-w-0 truncate">{account.name}</span>
                    <span className="text-xs text-gray-600 shrink-0 tabular-nums">
                      {formatCurrency(account.accountBalance || 0)}
                    </span>
                  </Link>
                ))}
                {clientAccounts.length > 8 && (
                  <p className="text-xs text-gray-600 px-2 pt-3">
                    +{clientAccounts.length - 8} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 py-10 text-center">No clients assigned</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── CLIENT VIEW ──────────────────────────────────────────────────────────

  const clientAccount = user.clientAccount
    ? await payload.findByID({
        collection: 'client-accounts',
        id: typeof user.clientAccount === 'string' ? user.clientAccount : user.clientAccount.id,
        depth: 2,
      })
    : null

  const { docs: orders } = clientAccount
    ? await payload.find({
        collection: 'orders',
        where: { clientAccount: { equals: clientAccount.id } },
        sort: '-createdAt',
        limit: 50,
      })
    : { docs: [] }

  if (!clientAccount) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-5">
            <HelpCircle className="size-7 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Account Not Found</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Your client account could not be found. Please contact support for assistance.
          </p>
          <Button
            asChild
            size="sm"
            className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium"
          >
            <a href="/contact" className="gap-2">
              <Mail className="size-3.5" />
              Contact Support
            </a>
          </Button>
        </div>
      </div>
    )
  }

  const recentActivity: ActivityEvent[] = [
    ...orders.slice(0, 10).map((order: any) => ({
      id: order.id,
      title: `Order ${order.orderNumber}`,
      description: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.amount || 0),
      timestamp: new Date(order.createdAt),
      icon: order.status === 'paid' ? 'CheckCircle' as const : order.status === 'pending' ? 'Clock' as const : 'XCircle' as const,
      variant: order.status === 'paid' ? 'success' as const : order.status === 'pending' ? 'warning' as const : 'danger' as const,
    })),
    ...(clientAccount.projects || []).slice(0, 5).map((project: any) => ({
      id: project.id,
      title: `Project: ${project.name}`,
      description: project.description || 'Project created',
      timestamp: new Date(project.createdAt || Date.now()),
      icon: 'FolderPlus' as const,
      variant: project.status === 'active' ? 'success' as const : project.status === 'completed' ? 'default' as const : 'warning' as const,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 7)

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-16 space-y-10">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-3">
            Client Dashboard
          </p>
          <DashboardGreeting
            firstName={user.firstName}
            subtitle="Welcome to your ORCACLUB workspace."
          />
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            asChild
            size="sm"
            className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-xs"
          >
            <a href="/contact" className="gap-1.5">
              <Mail className="size-3.5" />
              Contact Us
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-white/[0.12] bg-[#1c1c1c] hover:bg-white/[0.08] text-xs"
          >
            <a href="https://docs.orcaclub.dev" target="_blank" rel="noopener noreferrer" className="gap-1.5">
              <FileText className="size-3.5" />
              Resources
              <ExternalLink className="size-3 opacity-50" />
            </a>
          </Button>
        </div>
      </div>

      {/* Account Overview */}
      <AccountOverview account={clientAccount} orders={orders} />

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141414] to-[#0e0e0e] p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Recent Activity</h2>
          <ActivityTimeline events={recentActivity} maxEvents={7} />
        </div>
      )}

      {/* Projects */}
      {clientAccount.projects && clientAccount.projects.length > 0 ? (
        <ProjectsList projects={clientAccount.projects} />
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#141414] to-[#0e0e0e] p-10 text-center">
          <p className="text-sm font-semibold text-white mb-2">No Projects Yet</p>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Get started by reaching out to discuss your next project.
          </p>
          <Button
            asChild
            size="sm"
            className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-xs"
          >
            <a href="/contact" className="gap-1.5">
              <Mail className="size-3.5" />
              Start a Project
            </a>
          </Button>
        </div>
      )}

      {/* Orders */}
      <OrdersList accountId={clientAccount.id} />
    </div>
  )
}
