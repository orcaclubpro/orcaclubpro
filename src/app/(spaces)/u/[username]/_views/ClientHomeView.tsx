import Link from 'next/link'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { ClientActiveProjects } from '@/components/dashboard/ClientActiveProjects'
import { ClientInvoiceTimeline } from '@/components/dashboard/ClientInvoiceTimeline'
import { ActivityTimeline } from '@/components/dashboard/visualizations/ActivityTimeline'
import { BalanceCard } from '@/components/dashboard/BalanceCard'
import { Button } from '@/components/ui/button'
import type { ClientProjectSummary } from '@/components/dashboard/ClientActiveProjects'
import type { ClientOrderSummary } from '@/components/dashboard/ClientInvoiceTimeline'
import type { OrderSummary } from '@/components/dashboard/BalanceCard'
import type { ActivityEvent } from '@/components/dashboard/visualizations/ActivityTimeline'
import {
  Mail,
  FileText,
  ExternalLink,
  Receipt,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { WelcomeTipsBanner } from '@/components/dashboard/WelcomeTipsBanner'

interface ClientHomeViewProps {
  user: { firstName?: string | null }
  username: string
  showTips?: boolean
  clientAccount: any
  clientProjects: any[]
  orders: any[]
  clientSprints: any[]
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

export function ClientHomeView({
  user,
  username,
  showTips,
  clientAccount,
  clientProjects,
  orders,
  clientSprints,
}: ClientHomeViewProps) {
  const sprintPriority = (s: string) =>
    s === 'in-progress' ? 0 : s === 'pending' ? 1 : s === 'delayed' ? 2 : 3

  const bestSprintByProject: Record<string, any> = {}
  for (const sprint of clientSprints) {
    const pid = typeof sprint.project === 'string' ? sprint.project : (sprint.project as any)?.id ?? ''
    if (!bestSprintByProject[pid] || sprintPriority(sprint.status) < sprintPriority(bestSprintByProject[pid].status)) {
      bestSprintByProject[pid] = sprint
    }
  }

  const sortedClientProjects = [...clientProjects].sort((a: any, b: any) => {
    const priority = (s: string) => s === 'in-progress' ? 0 : s === 'active' || s === 'pending' ? 1 : 2
    return priority(a.status) - priority(b.status)
  })

  const activeProjectCount = clientProjects.filter(
    (p: any) => p.status === 'in-progress' || p.status === 'active' || p.status === 'pending'
  ).length

  const displayProjects: ClientProjectSummary[] = sortedClientProjects.slice(0, 3).map((p: any) => {
    const sprint = bestSprintByProject[p.id]
    return {
      id: p.id,
      name: p.name ?? '',
      status: p.status ?? 'pending',
      description: p.description ?? null,
      startDate: p.startDate ?? null,
      endDate: p.endDate ?? null,
      milestones: (p.milestones ?? []).map((m: any) => ({
        id: m.id ?? '',
        title: m.title ?? '',
        completed: m.completed ?? false,
      })),
      currentSprint: sprint
        ? {
            name: sprint.name ?? '',
            status: sprint.status ?? 'pending',
            completedTasksCount: sprint.completedTasksCount ?? 0,
            totalTasksCount: sprint.totalTasksCount ?? 0,
            endDate: sprint.endDate ?? '',
          }
        : null,
    }
  })

  const serializedOrders: ClientOrderSummary[] = orders.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber ?? null,
    amount: o.amount ?? 0,
    status: o.status ?? 'pending',
    createdAt: o.createdAt,
  }))

  const activityEvents: ActivityEvent[] = [
    ...orders.slice(0, 4).map((o: any) => ({
      id: `order-${o.id}`,
      title: o.status === 'paid' ? 'Invoice paid' : o.status === 'pending' ? 'Invoice awaiting payment' : 'Invoice cancelled',
      description: `${o.orderNumber ?? 'INV-' + o.id.slice(-6).toUpperCase()} · ${formatCurrency(o.amount ?? 0)}`,
      timestamp: new Date(o.createdAt),
      icon: (o.status === 'paid' ? 'CheckCircle' : o.status === 'pending' ? 'Clock' : 'XCircle') as ActivityEvent['icon'],
      variant: (o.status === 'paid' ? 'success' : o.status === 'pending' ? 'warning' : 'danger') as ActivityEvent['variant'],
    })),
    ...sortedClientProjects.slice(0, 2).map((p: any) => ({
      id: `project-${p.id}`,
      title: p.name,
      description: p.status === 'in-progress' ? 'In progress' : p.status === 'completed' ? 'Completed' : p.status,
      timestamp: new Date(p.updatedAt),
      icon: 'FolderPlus' as ActivityEvent['icon'],
      variant: (p.status === 'completed' ? 'success' : 'default') as ActivityEvent['variant'],
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  const ordersForCard: OrderSummary[] = orders.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber ?? null,
    amount: o.amount ?? 0,
    status: o.status ?? 'pending',
    stripeInvoiceUrl: o.stripeInvoiceUrl ?? null,
    createdAt: o.createdAt,
  }))
  const mostRecentOrder = ordersForCard[0] ?? null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20 space-y-10 sm:space-y-12">

      {/* ── WELCOME TIPS BANNER ──────────────────────────────────────────── */}
      {showTips && <WelcomeTipsBanner firstName={user.firstName} />}

      {/* ── HERO: Greeting + Account snapshot ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

        {/* Left: Greeting + quick actions */}
        <div className="flex flex-col justify-center py-4 sm:py-8 lg:py-14">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.25em] mb-5">
            Client Portal · ORCACLUB Spaces
          </p>
          <DashboardGreeting
            firstName={user.firstName}
            size="large"
            subtitle={
              activeProjectCount > 0
                ? `${activeProjectCount} active project${activeProjectCount !== 1 ? 's' : ''} · ${clientProjects.length} total`
                : 'Welcome to your ORCACLUB workspace.'
            }
          />
          <div className="flex items-center gap-2.5 mt-6">
            <Button asChild size="sm" className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-xs">
              <a href="/contact" className="gap-1.5">
                <Mail className="size-3.5" />
                Contact Us
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-white/[0.12] bg-[#1c1c1c] hover:bg-white/[0.08] text-xs">
              <a href="https://docs.orcaclub.dev" target="_blank" rel="noopener noreferrer" className="gap-1.5">
                <FileText className="size-3.5" />
                Resources
                <ExternalLink className="size-3 opacity-50" />
              </a>
            </Button>
          </div>
        </div>

        {/* Right: Account snapshot */}
        <BalanceCard
          orders={ordersForCard}
          activeProjectCount={activeProjectCount}
          mostRecentOrder={mostRecentOrder}
        />
      </div>

      {/* ── ACTIVE PROJECTS ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Active Projects</h2>
            {clientProjects.length > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">
                {activeProjectCount} active · {clientProjects.length} total
              </p>
            )}
          </div>
          {clientProjects.length > 3 && (
            <Link href={`/u/${username}?tab=projects`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              View all <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
        <ClientActiveProjects projects={displayProjects} username={username} totalCount={clientProjects.length} />
      </div>

      {/* ── BOTTOM: Invoices + Activity ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-white">Invoices</h2>
          </div>
          <ClientInvoiceTimeline orders={serializedOrders} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          </div>
          {activityEvents.length > 0 ? (
            <ActivityTimeline events={activityEvents} maxEvents={6} />
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-10 text-center">
              <p className="text-xs text-gray-600">No recent activity yet.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
