'use client'

import { useState } from 'react'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { AnalyticsSidebar } from '@/components/dashboard/AnalyticsSidebar'
import { PortfolioTimeline } from '@/components/dashboard/PortfolioTimeline'
import { ClientPortfolioTimeline } from '@/components/dashboard/ClientPortfolioTimeline'
import type { SerializedProject } from '@/components/dashboard/ProjectsCarousel'
import type { Range } from '@/components/dashboard/PortfolioTimeline'
import { RANGE_CFG } from '@/components/dashboard/PortfolioTimeline'
import { cn } from '@/lib/utils'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { Receipt } from 'lucide-react'

interface AdminHomeViewProps {
  user: { firstName?: string | null; role: string }
  username: string
  clientAccounts: any[]
  allOrders: any[]
  allProjects: any[]
  allTasks: any[]
  completedTasksCount: number
  completedSprintsCount: number
  timeframe: '7d' | '30d' | '90d'
  serializedProjects: SerializedProject[]
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

export function AdminHomeView({
  user,
  username,
  clientAccounts,
  allOrders,
  allProjects,
  allTasks,
  completedTasksCount,
  completedSprintsCount,
  timeframe,
  serializedProjects,
}: AdminHomeViewProps) {
  const [range, setRange] = useState<Range>('week')

  const now = Date.now()

  const activeProjects = allProjects.filter(
    (p: any) => p.status === 'in-progress' || p.status === 'pending'
  ).length

  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  const orders30d = allOrders.filter(
    (o: any) => new Date(o.createdAt).getTime() > thirtyDaysAgo
  )

  const weeklyRevenue = [3, 2, 1, 0].map((weeksAgo) => {
    const weekEnd = now - weeksAgo * 7 * 24 * 60 * 60 * 1000
    const wkStart = weekEnd - 7 * 24 * 60 * 60 * 1000
    const weekOrders = orders30d.filter((o: any) => {
      const t = new Date(o.createdAt).getTime()
      return t > wkStart && t <= weekEnd
    })
    const revenue = weekOrders
      .filter((o: any) => o.status === 'paid')
      .reduce((sum: number, o: any) => sum + (o.amount || 0), 0)
    const label = new Date(wkStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

  const projectedOrders = allOrders
    .filter((o: any) => o.status === 'pending')
    .sort((a: any, b: any) => {
      const aMs = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const bMs = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      return aMs - bMs
    })
  const projectedTotal = projectedOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0)

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20 space-y-6 sm:space-y-10">

        {/* ── GREETING + REVENUE CHART ─────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 sm:gap-8 py-6 sm:py-8">

          {/* Left: greeting */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.25em] mb-5">
              {user.role === 'admin' ? 'Admin' : 'Workspace'} · ORCACLUB Spaces
            </p>
            <DashboardGreeting
              firstName={user.firstName}
              size="large"
              subtitle={
                user.role === 'admin'
                  ? `Overseeing ${clientAccounts.length} client${clientAccounts.length !== 1 ? 's' : ''} · ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
                  : `${clientAccounts.length} assigned client${clientAccounts.length !== 1 ? 's' : ''} · ${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`
              }
            />
          </div>

          {/* Right: revenue donut — reacts to the timeline range picker */}
          <div className="w-full lg:w-auto lg:shrink-0" style={{ maxWidth: 420 }}>
            <RevenueChart allOrders={allOrders} range={range} />
          </div>

        </div>

        {/* ── PROJECTED REVENUE ───────────────────────────────────────────── */}
        {projectedTotal > 0 && (
          <div className="rounded-2xl border border-amber-400/[0.12] overflow-hidden">

            <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-amber-400/[0.05] to-transparent border-b border-amber-400/[0.08]">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 shrink-0">
                  <Receipt className="size-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/80">
                    Projected Revenue
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {projectedOrders.length} pending invoice{projectedOrders.length !== 1 ? 's' : ''} awaiting payment
                  </p>
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
                {formatCurrency(projectedTotal)}
              </p>
            </div>

            <div className="bg-[#0c0900]/60 divide-y divide-white/[0.04]">
              {projectedOrders.slice(0, 8).map((order: any) => {
                const clientName = typeof order.clientAccount === 'object'
                  ? ((order.clientAccount as any)?.name ?? '—')
                  : '—'
                const projectName = typeof order.projectRef === 'object' && order.projectRef
                  ? ((order.projectRef as any)?.name ?? null)
                  : null
                const dueDate = order.dueDate ? new Date(order.dueDate) : null
                const daysUntil = dueDate
                  ? Math.ceil((dueDate.getTime() - now) / (1000 * 60 * 60 * 24))
                  : null
                const isOverdue = daysUntil !== null && daysUntil < 0
                const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7

                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-0 pr-4 sm:pr-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={`w-0.5 self-stretch shrink-0 mr-4 ${
                      isOverdue
                        ? 'bg-red-400'
                        : isDueSoon
                          ? 'bg-amber-400'
                          : dueDate
                            ? 'bg-yellow-400/30'
                            : 'bg-white/[0.06]'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {order.orderNumber ?? `INV-${order.id.slice(-6).toUpperCase()}`}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                        {clientName}{projectName ? ` · ${projectName}` : ''}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-amber-400 tabular-nums">
                        {formatCurrency(order.amount ?? 0)}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${
                        isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-gray-600'
                      }`}>
                        {dueDate
                          ? isOverdue
                            ? `${Math.abs(daysUntil!)}d overdue`
                            : daysUntil === 0
                              ? 'Due today'
                              : daysUntil === 1
                                ? 'Due tomorrow'
                                : `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                          : 'No due date'
                        }
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {projectedOrders.length > 8 && (
              <div className="px-5 py-3 border-t border-amber-400/[0.06] text-center">
                <p className="text-[10px] text-gray-600">
                  Showing 8 of {projectedOrders.length} pending invoices
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TIMELINES ─────────────────────────────────────────────────────── */}
        {(serializedProjects.length > 0 || clientAccounts.length > 0) && (
          <div className="space-y-8">

            {/* ── Shared header: title + range picker ───────────────────────── */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.3em]">
                Timelines
              </p>
              <div className="flex items-center p-1 bg-white/[0.04] rounded-lg border border-white/[0.08]">
                {(['week', 'month', 'year'] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      'px-4 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150',
                      range === r ? 'bg-white/[0.12] text-white shadow-sm' : 'text-white/40 hover:text-white/65',
                    )}
                  >
                    {RANGE_CFG[r].label}
                  </button>
                ))}
              </div>
            </div>

            {serializedProjects.length > 0 && (
              <PortfolioTimeline
                projects={serializedProjects}
                allOrders={allOrders}
                username={username}
                externalRange={range}
                onRangeChange={setRange}
              />
            )}

            {clientAccounts.length > 0 && (
              <ClientPortfolioTimeline
                clientAccounts={clientAccounts}
                serializedProjects={serializedProjects}
                allOrders={allOrders}
                username={username}
                externalRange={range}
                onRangeChange={setRange}
              />
            )}

          </div>
        )}

      </div>

      {/* ── ANALYTICS SIDEBAR (floating) ────────────────────────────────────── */}
      <AnalyticsSidebar
        weeklyRevenue={weeklyRevenue}
        orderPipeline={orderPipeline}
        projectStatus={projectStatus}
        kpis={pulseKpis}
      />
    </>
  )
}
