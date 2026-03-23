'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Package,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  FolderKanban,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { ClientAccount, Project } from '@/types/payload-types'
import { ClientTabNav } from '@/components/dashboard/ClientTabNav'
import { ClientCredentialsTab } from '@/components/dashboard/ClientCredentialsTab'
import { ClientOrdersTab } from '@/components/dashboard/ClientOrdersTab'
import { ScheduledPaymentsSection } from '@/components/dashboard/ScheduledPaymentsSection'
import { ClientSettingsCard } from '@/components/dashboard/ClientSettingsCard'
import { ClientPortfolioTimeline } from '@/components/dashboard/ClientPortfolioTimeline'
import type { SerializedProject } from '@/components/dashboard/ProjectsCarousel'
import { ProjectRowActions } from '@/components/dashboard/ProjectRowActions'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'

const ClientPackagesTab = dynamic(
  () => import('@/components/dashboard/ClientPackagesTab').then(m => ({ default: m.ClientPackagesTab }))
)

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(d: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(d))
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  string,
  {
    color: string
    bg: string
    border: string
    icon: React.ComponentType<{ className?: string }>
    label: string
  }
> = {
  pending: {
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    icon: Clock,
    label: 'Pending',
  },
  'in-progress': {
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    icon: Clock,
    label: 'In Progress',
  },
  completed: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    icon: CheckCircle,
    label: 'Completed',
  },
  'on-hold': {
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
    icon: AlertCircle,
    label: 'On Hold',
  },
  cancelled: {
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    icon: XCircle,
    label: 'Cancelled',
  },
}

// ── Project row ───────────────────────────────────────────────────────────────

function ProjectRow({
  project,
  username,
}: {
  project: Project
  username: string
}) {
  const cfg = STATUS_CFG[project.status] ?? {
    color: 'text-[var(--space-text-secondary)]',
    bg: 'bg-[var(--space-bg-card-hover)]',
    border: 'border-[var(--space-border-hard)]',
    icon: Package,
    label: project.status,
  }
  const StatusIcon = cfg.icon
  const completedMilestones = project.milestones?.filter((m) => m.completed).length ?? 0
  const totalMilestones = project.milestones?.length ?? 0

  return (
    <div className="relative flex items-center group hover:bg-[var(--space-bg-card-hover)] transition-colors">
      <Link
        href={`/u/${username}/projects/${project.id}`}
        className="flex-1 flex items-center gap-4 px-5 py-4 min-w-0"
      >
        <div className="absolute left-0 top-0 h-full w-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'var(--space-accent)' }} />

        <div
          className={`size-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}
        >
          <StatusIcon className={`size-4 ${cfg.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-semibold text-[var(--space-text-primary)] transition-colors duration-150">
              {project.name}
            </span>
            <Badge
              variant="outline"
              className={`${cfg.color} ${cfg.bg} border ${cfg.border} text-[10px] px-1.5 py-0`}
            >
              {cfg.label}
            </Badge>
          </div>
          {project.description && (
            <p className="text-xs text-[var(--space-text-muted)] truncate">{project.description}</p>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-5 shrink-0 text-xs text-[var(--space-text-muted)]">
          {project.projectedEndDate && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {fmtDate(project.projectedEndDate)}
            </span>
          )}
          {totalMilestones > 0 && (
            <span className="font-mono tabular-nums">
              {completedMilestones}/{totalMilestones}
            </span>
          )}
          {project.budgetAmount && (
            <span className="font-mono tabular-nums text-[var(--space-text-secondary)]">
              {fmt(project.budgetAmount)}
            </span>
          )}
        </div>

        <ChevronRight className="size-4 text-[var(--space-text-muted)] group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
      </Link>
      <div className="pr-3 shrink-0">
        <ProjectRowActions project={project} username={username} />
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)]">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="size-48 rounded-full bg-[rgba(255,255,255,0.01)] blur-3xl" />
      </div>
      <div className="relative z-10 flex flex-col items-center text-center py-12 px-6">
        <h3 className="text-sm font-semibold text-[var(--space-text-primary)] mb-1">{title}</h3>
        <p className="text-[var(--space-text-muted)] text-xs max-w-xs mb-5">{description}</p>
        {action}
      </div>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

const TABS = ['overview', 'projects', 'orders', 'packages', 'accounts'] as const
type Tab = typeof TABS[number]

export interface ClientDetailTabViewProps {
  initialTab: Tab
  username: string
  clientId: string
  clientAccount: ClientAccount
  orders: any[]
  projects: Project[]
  clientUsers: Array<{ id: string; name: string; email: string }>
  packages: any[]
  credentials: any[]
  packageOrderMap: Record<string, any[]>
  serializedProjects: SerializedProject[]
  pendingOrders: any[]
  paidOrders: any[]
  totalRevenue: number
  teamMembers: Array<{ id: string; name: string; title: string | null }>
  userRole: string
}

// ── Main component ────────────────────────────────────────────────────────────

export function ClientDetailTabView({
  initialTab,
  username,
  clientId,
  clientAccount,
  orders,
  projects,
  clientUsers,
  packages,
  credentials,
  packageOrderMap,
  serializedProjects,
  pendingOrders,
  paidOrders,
  totalRevenue,
  teamMembers,
  userRole,
}: ClientDetailTabViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [tabKey, setTabKey] = useState(0)
  const [enterFrom, setEnterFrom] = useState<'left' | 'right'>('right')

  const navigate = useCallback(
    (tab: Tab) => {
      if (tab === activeTab) return
      const currIdx = TABS.indexOf(activeTab)
      const nextIdx = TABS.indexOf(tab)
      setEnterFrom(nextIdx > currIdx ? 'right' : 'left')
      setTabKey((k) => k + 1)
      setActiveTab(tab)
      const url =
        tab === 'overview'
          ? `/u/${username}/clients/${clientId}`
          : `/u/${username}/clients/${clientId}?tab=${tab}`
      window.history.replaceState(null, '', url)
    },
    [activeTab, username, clientId]
  )

  // ── Touch swipe gesture ───────────────────────────────────────────────────

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchTargetRef = useRef<EventTarget | null>(null)

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      touchTargetRef.current = e.target
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return

      // Don't swipe if inside a horizontally scrollable container
      if ((touchTargetRef.current as Element | null)?.closest('[data-h-scroll]')) {
        touchStartX.current = null
        touchStartY.current = null
        return
      }

      const dx = e.changedTouches[0].clientX - touchStartX.current
      const dy = e.changedTouches[0].clientY - touchStartY.current

      touchStartX.current = null
      touchStartY.current = null

      // Require mostly horizontal swipe
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.8) return

      const currIdx = TABS.indexOf(activeTab)
      if (dx < 0 && currIdx < TABS.length - 1) {
        navigate(TABS[currIdx + 1])
      } else if (dx > 0 && currIdx > 0) {
        navigate(TABS[currIdx - 1])
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [activeTab, navigate])

  // ── Wheel gesture ─────────────────────────────────────────────────────────

  const wheelCooldown = useRef(false)

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (wheelCooldown.current) return
      if (Math.abs(e.deltaX) < 120) return

      wheelCooldown.current = true
      setTimeout(() => {
        wheelCooldown.current = false
      }, 300)

      const currIdx = TABS.indexOf(activeTab)
      if (e.deltaX > 0 && currIdx < TABS.length - 1) {
        navigate(TABS[currIdx + 1])
      } else if (e.deltaX < 0 && currIdx > 0) {
        navigate(TABS[currIdx - 1])
      }
    }

    document.addEventListener('wheel', onWheel, { passive: true })
    return () => document.removeEventListener('wheel', onWheel)
  }, [activeTab, navigate])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="sticky top-[49px] z-10 bg-[var(--space-bg-card)] border-b border-[var(--space-border-hard)]">
        <ClientTabNav activeTab={activeTab} onTabChange={(tab) => navigate(tab as Tab)} />
      </div>

      <div
        key={tabKey}
        style={{
          animation:
            tabKey === 0
              ? 'pageSlideUp 260ms cubic-bezier(0.36, 0.66, 0.04, 1) forwards'
              : `${enterFrom === 'right' ? 'tabContentEnterFromRight' : 'tabContentEnterFromLeft'} 200ms cubic-bezier(0.36, 0.66, 0.04, 1) forwards`,
        }}
        className="flex-1 px-6 lg:px-10 py-8 space-y-8"
      >
        {/* ─── Overview tab ───────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            <ClientSettingsCard
              id={clientId}
              name={clientAccount.name}
              firstName={clientAccount.firstName ?? ''}
              lastName={clientAccount.lastName ?? ''}
              email={clientAccount.email}
              company={clientAccount.company}
              phone={(clientAccount as any).phone ?? null}
              address={(clientAccount as any).address ?? null}
              stripeCustomerId={clientAccount.stripeCustomerId}
              teamMembers={teamMembers}
              clientUsers={clientUsers}
            />

            {(clientAccount.accountBalance ?? 0) > 0 && (
              <div className="flex items-center gap-3 rounded-lg border border-amber-400/[0.18] bg-amber-400/[0.04] px-4 py-3">
                <AlertCircle className="size-3.5 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-400 font-medium">
                  {fmt(clientAccount.accountBalance ?? 0)} outstanding
                </p>
                <span className="text-[var(--space-text-muted)] text-xs">
                  · {pendingOrders.length} pending{' '}
                  {pendingOrders.length === 1 ? 'order' : 'orders'}
                </span>
                <Link
                  href={`/u/${username}/clients/${clientId}?tab=orders`}
                  className="ml-auto text-xs text-amber-600 hover:text-amber-400 transition-colors"
                >
                  View orders →
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: 'Revenue',
                  value: fmt(totalRevenue),
                  sub: `${paidOrders.length} paid order${paidOrders.length !== 1 ? 's' : ''}`,
                  icon: TrendingUp,
                  accent: '#34d399',
                  accentBg: 'rgba(52,211,153,0.06)',
                  accentBorder: 'rgba(52,211,153,0.12)',
                },
                {
                  label: 'Outstanding',
                  value: fmt(clientAccount.accountBalance ?? 0),
                  sub: `${pendingOrders.length} pending`,
                  icon: DollarSign,
                  accent: (clientAccount.accountBalance ?? 0) > 0 ? '#fbbf24' : '#3A3A3A',
                  accentBg: (clientAccount.accountBalance ?? 0) > 0 ? 'rgba(251,191,36,0.06)' : 'transparent',
                  accentBorder: (clientAccount.accountBalance ?? 0) > 0 ? 'rgba(251,191,36,0.12)' : 'transparent',
                },
                {
                  label: 'Projects',
                  value: String(projects.length),
                  sub: 'all time',
                  icon: FolderKanban,
                  accent: '#60a5fa',
                  accentBg: 'rgba(96,165,250,0.06)',
                  accentBorder: 'rgba(96,165,250,0.12)',
                },
                {
                  label: 'Orders',
                  value: String(orders.length),
                  sub: 'all time',
                  icon: ShoppingCart,
                  accent: 'var(--space-accent)',
                  accentBg: 'rgba(103,232,249,0.06)',
                  accentBorder: 'rgba(103,232,249,0.12)',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="group relative rounded-xl border bg-[var(--space-bg-base)] px-4 py-4 overflow-hidden
                    transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    borderColor: '#2A2A2A',
                  }}
                >
                  {/* Subtle top accent line on hover */}
                  <div
                    className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${stat.accent}, transparent)` }}
                  />
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-[10px] text-[var(--space-text-tertiary)] uppercase tracking-widest font-semibold">
                      {stat.label}
                    </p>
                    <div
                      className="size-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{ background: stat.accentBg, border: `1px solid ${stat.accentBorder}` }}
                    >
                      <stat.icon className="size-3" style={{ color: stat.accent }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: '#F0F0F0' }}>
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-[var(--space-text-tertiary)] mt-1.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            {serializedProjects.length > 0 && (
              <ClientPortfolioTimeline
                clientAccounts={[{ id: clientId, name: clientAccount.name }]}
                serializedProjects={serializedProjects}
                allOrders={orders as any[]}
                username={username}
              />
            )}
          </>
        )}

        {/* ─── Projects tab ───────────────────────────────────────────────── */}
        {activeTab === 'projects' && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <h2 className="text-base font-semibold text-[var(--space-text-primary)]">Projects</h2>
                <span className="text-xs text-[var(--space-text-muted)] tabular-nums">{projects.length}</span>
              </div>
              <CreateProjectModal clientId={clientId} clientName={clientAccount.name} />
            </div>

            {projects.length > 0 ? (
              <div className="rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] overflow-hidden divide-y divide-[var(--space-divider)]">
                {projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    username={username}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No projects yet"
                description="Create your first project to start tracking work."
                action={<CreateProjectModal clientId={clientId} clientName={clientAccount.name} />}
              />
            )}
          </section>
        )}

        {/* ─── Orders tab ─────────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <section className="space-y-6">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <h2 className="text-base font-semibold text-[var(--space-text-primary)]">Orders</h2>
                <span className="text-xs text-[var(--space-text-muted)] tabular-nums">{orders.length}</span>
              </div>
              {orders.length > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-emerald-400 font-mono">{fmt(totalRevenue)} paid</span>
                  {(clientAccount.accountBalance ?? 0) > 0 && (
                    <span className="text-amber-400 font-mono">
                      {fmt(clientAccount.accountBalance ?? 0)} due
                    </span>
                  )}
                </div>
              )}
            </div>
            <ScheduledPaymentsSection packages={packages as any} username={username} />
            <ClientOrdersTab
              orders={orders as any}
              role={userRole as 'admin' | 'user' | 'client'}
            />
          </section>
        )}

        {/* ─── Packages tab ───────────────────────────────────────────────── */}
        {activeTab === 'packages' && (
          <ClientPackagesTab
            packages={packages as any}
            clientId={clientId}
            username={username}
            projects={projects.map((p: any) => ({ id: p.id, name: p.name, status: p.status }))}
            packageOrders={packageOrderMap}
          />
        )}

        {/* ─── Accounts tab ───────────────────────────────────────────────── */}
        {activeTab === 'accounts' && (
          <ClientCredentialsTab credentials={credentials as any[]} />
        )}
      </div>
    </>
  )
}
