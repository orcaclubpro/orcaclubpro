import Link from 'next/link'
import { ThemeSwitcher } from '@/components/dashboard/ThemeSwitcher'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { ClientActiveProjects } from '@/components/dashboard/ClientActiveProjects'
import { ClientInvoiceTimeline } from '@/components/dashboard/ClientInvoiceTimeline'
import { BalanceCard } from '@/components/dashboard/BalanceCard'
import { PaymentScheduleCard } from '@/components/dashboard/PaymentScheduleCard'
import type { ClientProjectSummary } from '@/components/dashboard/ClientActiveProjects'
import type { OrderSummary } from '@/components/dashboard/BalanceCard'
import {
  fmtCurrency,
  type ClientOrderSummary,
  type ScheduledPackage,
} from '@/lib/dashboard/utils'
import { Receipt, ArrowRight, CalendarDays } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientHomeViewProps {
  user: { firstName?: string | null }
  username: string
  showTips?: boolean
  clientAccount: any
  clientProjects: any[]
  orders: any[]
  clientSprints: any[]
  clientPackages?: ScheduledPackage[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientHomeView({
  user,
  username,
  showTips,
  clientProjects,
  orders,
  clientSprints,
  clientPackages = [],
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
    title: (o.lineItems as any[])?.[0]?.title ?? null,
    amount: o.amount ?? 0,
    status: o.status ?? 'pending',
    createdAt: o.createdAt,
  }))

  const ordersForCard: OrderSummary[] = orders.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber ?? null,
    amount: o.amount ?? 0,
    status: o.status ?? 'pending',
    stripeInvoiceUrl: o.stripeInvoiceUrl ?? null,
    createdAt: o.createdAt,
  }))
  const mostRecentOrder = ordersForCard[0] ?? null

  // Determine if there are upcoming scheduled payments (for layout branching)
  const hasSchedule = clientPackages.some(pkg =>
    (pkg.paymentSchedule ?? []).some(e => !e.orderId)
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20 space-y-8 sm:space-y-10">

      {/* ── HERO: Greeting + (PaymentSchedule above balance on mobile, beside on desktop) ── */}
      <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${hasSchedule ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>

        {/* Greeting — always first in DOM → first on mobile, col 1 on desktop */}
        <div className={`flex flex-col justify-center py-4 sm:py-8 lg:py-14 ${hasSchedule ? 'lg:order-1' : ''}`}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-semibold gradient-text uppercase tracking-[0.25em]">
              Client Portal · ORCACLUB Spaces
            </p>
            <ThemeSwitcher />
          </div>
          <DashboardGreeting
            firstName={user.firstName}
            size="large"
            subtitle={
              activeProjectCount > 0
                ? `${activeProjectCount} active project${activeProjectCount !== 1 ? 's' : ''} · ${clientProjects.length} total`
                : 'Welcome to your ORCACLUB workspace.'
            }
          />
        </div>

        {/* PaymentSchedule — second in DOM → above BalanceCard on mobile, col 3 on desktop */}
        {hasSchedule && (
          <div className="lg:order-3 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-gray-600" />
              <h2 className="text-sm font-semibold text-white">Payment Schedule</h2>
            </div>
            <PaymentScheduleCard
              packages={clientPackages}
              maxPackages={2}
              maxEntries={3}
              footerLink={{ label: 'View full payment schedule', href: `/u/${username}?tab=invoices` }}
            />
          </div>
        )}

        {/* BalanceCard — third in DOM → below PaymentSchedule on mobile, col 2 on desktop */}
        <div className={hasSchedule ? 'lg:order-2' : ''}>
          <BalanceCard
            orders={ordersForCard}
            activeProjectCount={activeProjectCount}
            mostRecentOrder={mostRecentOrder}
          />
        </div>
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

      {/* ── INVOICES ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-gray-600" />
            <h2 className="text-sm font-semibold text-white">Invoices</h2>
          </div>
          <Link
            href={`/u/${username}?tab=invoices`}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            View all <ArrowRight className="size-3" />
          </Link>
        </div>
        <ClientInvoiceTimeline orders={serializedOrders} />
      </div>

    </div>
  )
}
