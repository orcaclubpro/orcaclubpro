import Link from 'next/link'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { ClientActiveProjects } from '@/components/dashboard/ClientActiveProjects'
import { ClientInvoiceTimeline } from '@/components/dashboard/ClientInvoiceTimeline'
import { BalanceCard } from '@/components/dashboard/BalanceCard'
import type { ClientProjectSummary } from '@/components/dashboard/ClientActiveProjects'
import type { ClientOrderSummary } from '@/components/dashboard/ClientInvoiceTimeline'
import type { OrderSummary } from '@/components/dashboard/BalanceCard'
import { Receipt, ArrowRight, CalendarDays } from 'lucide-react'

function fmtCur(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtScheduleDate(iso: string): string {
  const parts = iso.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return iso
  const [y, m, d] = parts
  const dt = new Date(y, m - 1, d)
  if (!isFinite(dt.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(dt)
}

interface ClientHomeViewProps {
  user: { firstName?: string | null }
  username: string
  showTips?: boolean
  clientAccount: any
  clientProjects: any[]
  orders: any[]
  clientSprints: any[]
  clientPackages?: any[]
}

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

  // Upcoming scheduled payments from proposals
  const scheduledPkgs = clientPackages
    .map((pkg: any) => ({
      id: pkg.id as string,
      name: pkg.name as string,
      upcoming: ((pkg.paymentSchedule ?? []) as any[])
        .filter((e: any) => !e.orderId)
        .slice(0, 3),
    }))
    .filter(p => p.upcoming.length > 0)
    .slice(0, 2)

  function isDueSoon(dueDate: string | null | undefined): boolean {
    if (!dueDate) return false
    const parts = dueDate.split('T')[0].split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) return false
    const due = new Date(parts[0], parts[1] - 1, parts[2])
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + 30)
    return due <= cutoff
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20 space-y-8 sm:space-y-10">

      {/* ── HERO: Greeting + (PaymentSchedule above balance on mobile, beside on desktop) ── */}
      <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${scheduledPkgs.length > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>

        {/* Greeting — always first in DOM → first on mobile, col 1 on desktop */}
        <div className={`flex flex-col justify-center py-4 sm:py-8 lg:py-14 ${scheduledPkgs.length > 0 ? 'lg:order-1' : ''}`}>
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
        </div>

        {/* PaymentSchedule — second in DOM → above BalanceCard on mobile, col 3 on desktop */}
        {scheduledPkgs.length > 0 && (
          <div className="lg:order-3 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-gray-600" />
              <h2 className="text-sm font-semibold text-white">Payment Schedule</h2>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] overflow-hidden divide-y divide-white/[0.05]">
              {scheduledPkgs.map((pkg: any) => (
                <div key={pkg.id}>
                  <div className="px-4 py-2.5 bg-white/[0.015]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{pkg.name}</span>
                  </div>
                  {pkg.upcoming.map((entry: any) => {
                    const soon = isDueSoon(entry.dueDate)
                    return (
                      <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`size-1.5 rounded-full shrink-0 ${soon ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'bg-[#67e8f9]/40'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-300 truncate">{entry.label}</p>
                          {entry.dueDate && (
                            <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${soon ? 'text-amber-400' : 'text-gray-600'}`}>
                              <CalendarDays className="size-3 shrink-0" />
                              Due {fmtScheduleDate(entry.dueDate)}
                              {soon && <span className="text-[9px] px-1 py-px rounded-full bg-amber-400/10 border border-amber-400/20 ml-0.5">Soon</span>}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-[#67e8f9] shrink-0">{fmtCur(entry.amount)}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
              <div className="px-4 py-2.5 bg-white/[0.01]">
                <Link
                  href={`/u/${username}?tab=invoices`}
                  className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-1"
                >
                  View full payment schedule <ArrowRight className="size-2.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* BalanceCard — third in DOM → below PaymentSchedule on mobile, col 2 on desktop */}
        <div className={scheduledPkgs.length > 0 ? 'lg:order-2' : ''}>
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
