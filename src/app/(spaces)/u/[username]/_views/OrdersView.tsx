'use client'

import { useState } from 'react'
import {
  Receipt, CheckCircle, CalendarDays,
  CreditCard, ChevronDown, ExternalLink, Minus, Package,
} from 'lucide-react'
import { BillingPortalButton } from '@/components/dashboard/BillingPortalButton'
import Link from 'next/link'
import type { Order } from '@/types/payload-types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledEntry {
  id: string
  label: string
  amount: number
  dueDate?: string | null
  orderId?: string | null
}

interface ScheduledPackage {
  id: string
  name: string
  paymentSchedule?: ScheduledEntry[]
}

interface OrdersViewProps {
  allOrders: Order[]
  clientAccount: any
  clientPackages?: ScheduledPackage[]
  username?: string
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))

const fmtMonthYear = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(iso))

function fmtScheduleDate(iso: string): string {
  const parts = iso.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return iso
  const [y, m, d] = parts
  const dt = new Date(y, m - 1, d)
  if (!isFinite(dt.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(dt)
}

function isDueSoon(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false
  const parts = dueDate.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return false
  const due = new Date(parts[0], parts[1] - 1, parts[2])
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + 30)
  return due <= cutoff
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS = {
  paid: {
    label: 'Paid',
    dotClass: 'bg-emerald-400',
    badgeClass: 'text-emerald-400 bg-emerald-400/[0.07] border-emerald-400/20',
    amountClass: 'text-white',
    cardClass: 'border-white/[0.08] hover:border-white/[0.13]',
    lineClass: 'bg-emerald-400/20',
    titleClass: 'text-white',
  },
  pending: {
    label: 'Pending',
    dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]',
    badgeClass: 'text-amber-400 bg-amber-400/[0.07] border-amber-400/20',
    amountClass: 'text-amber-400',
    cardClass: 'border-amber-400/20 hover:border-amber-400/30',
    lineClass: 'bg-amber-400/30',
    titleClass: 'text-white',
  },
  cancelled: {
    label: 'Cancelled',
    dotClass: 'bg-white/20',
    badgeClass: 'text-gray-600 bg-white/[0.03] border-white/[0.08]',
    amountClass: 'text-gray-600 line-through',
    cardClass: 'border-white/[0.05] hover:border-white/[0.08]',
    lineClass: 'bg-white/[0.07]',
    titleClass: 'text-gray-500',
  },
} as const

type StatusKey = keyof typeof STATUS
type TabType = 'all' | 'pending' | 'paid' | 'cancelled'

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function AccountDonut({
  paidPct, pendingPct, cancelledPct, pendingAmount, hasOrders,
}: {
  paidPct: number
  pendingPct: number
  cancelledPct: number
  pendingAmount: number
  hasOrders: boolean
}) {
  const r = 34
  const c = 2 * Math.PI * r
  const segs = [
    { pct: paidPct, offset: 0, color: '#34d399' },
    { pct: pendingPct, offset: paidPct, color: '#fbbf24' },
    { pct: cancelledPct, offset: paidPct + pendingPct, color: 'rgba(255,255,255,0.09)' },
  ]
  return (
    <div className="relative w-[68px] h-[68px] shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
        {!hasOrders ? (
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="16"
            strokeDasharray={`${c} 0`} />
        ) : segs.filter(s => s.pct > 0.005).map((s, i) => (
          <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="16"
            strokeDasharray={`${s.pct * c} ${(1 - s.pct) * c}`}
            strokeDashoffset={-s.offset * c} strokeLinecap="butt" />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {pendingAmount > 0 ? (
          <div className="text-center px-1">
            <p className="text-[7px] text-amber-400/50 font-bold uppercase tracking-wider leading-none">due</p>
            <p className="text-[9px] font-black text-amber-400 tabular-nums leading-snug mt-px">{fmt(pendingAmount)}</p>
          </div>
        ) : hasOrders ? (
          <CheckCircle className="size-3.5 text-emerald-400" />
        ) : (
          <Minus className="size-3 text-gray-700" />
        )}
      </div>
    </div>
  )
}

// ─── Invoice Row ──────────────────────────────────────────────────────────────

function InvoiceRow({ order, isLast }: { order: Order; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const statusKey = (order.status ?? 'pending') as StatusKey
  const cfg = STATUS[statusKey] ?? STATUS.pending
  const lineItems = (order.lineItems ?? []) as any[]
  const hasLineItems = lineItems.length > 0
  const showPay = statusKey === 'pending' && order.stripeInvoiceUrl
  const primaryTitle = lineItems[0]?.title ?? 'Invoice'
  const extraCount = lineItems.length - 1

  return (
    <div className="flex gap-0">
      {/* Timeline track */}
      <div className="flex flex-col items-center w-5 shrink-0">
        <div className={`size-2 rounded-full ring-[3px] ring-[#080808] shrink-0 mt-[18px] ${cfg.dotClass}`} />
        {!isLast && (
          <div className={`w-px flex-1 mt-1.5 ${cfg.lineClass}`} style={{ minHeight: 28 }} />
        )}
      </div>

      {/* Invoice card */}
      <div className={`flex-1 ml-4 mb-4 rounded-xl border overflow-hidden transition-all duration-200 bg-[#0b0b0b] ${cfg.cardClass}`}>

        {/* Card header */}
        <div className="flex items-start gap-3 p-4">
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold leading-snug truncate ${cfg.titleClass}`}>
              {primaryTitle}
              {extraCount > 0 && (
                <span className="text-[11px] text-gray-600 font-normal ml-2">+{extraCount} more</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-gray-600 font-mono">
                #{order.orderNumber ?? `INV-${order.id.slice(-6).toUpperCase()}`}
              </span>
              <span className="text-gray-800 text-[8px]">·</span>
              <span className="text-[10px] text-gray-600">{fmtDate(order.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 shrink-0">
            <span className={`text-base font-bold tabular-nums leading-tight ${cfg.amountClass}`}>
              {fmtFull(order.amount ?? 0)}
            </span>
            <span className={`mt-0.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Line items expandable */}
        {hasLineItems && (
          <div className="border-t border-white/[0.04]">
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/[0.02] transition-colors group"
            >
              <span className="flex items-center gap-1.5 text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors font-medium">
                <Package className="size-3 text-[#67e8f9]/40 group-hover:text-[#67e8f9]/60 transition-colors" />
                {lineItems.length} line {lineItems.length === 1 ? 'item' : 'items'}
              </span>
              <ChevronDown className={`size-3 text-gray-700 group-hover:text-gray-500 transition-all duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
              <div className="pb-3 px-4 space-y-1.5">
                {lineItems.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 font-medium truncate">{item.title}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{item.quantity ?? 1} × {fmtFull(item.price ?? 0)}</p>
                    </div>
                    <p className="text-xs font-semibold text-white tabular-nums shrink-0">
                      {fmtFull((item.quantity ?? 1) * (item.price ?? 0))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pay Now footer */}
        {showPay && (
          <div className="border-t border-amber-400/[0.08] bg-amber-400/[0.015] px-4 py-3">
            <a
              href={order.stripeInvoiceUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/[0.08] border border-amber-400/20 text-amber-400 text-xs font-semibold hover:bg-amber-400/[0.14] hover:border-amber-400/30 transition-all"
            >
              <CreditCard className="size-3.5" />
              Pay {fmtFull(order.amount ?? 0)}
              <ExternalLink className="size-3 opacity-60" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Month Group ──────────────────────────────────────────────────────────────

function MonthGroup({ monthLabel, orders, isLastGroup }: {
  monthLabel: string
  orders: Order[]
  isLastGroup: boolean
}) {
  return (
    <div>
      {/* Month label */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-0">
          <div className="w-5 flex justify-center shrink-0">
            <div className="size-1 rounded-full bg-white/20" />
          </div>
          <span className="ml-4 text-[9px] font-bold uppercase tracking-[0.22em] text-gray-600">
            {monthLabel}
          </span>
        </div>
        <div className="flex-1 h-px bg-white/[0.05]" />
      </div>

      {/* Invoices in this month */}
      {orders.map((order, i) => (
        <InvoiceRow
          key={order.id}
          order={order}
          isLast={isLastGroup && i === orders.length - 1}
        />
      ))}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function OrdersView({ allOrders, clientAccount, clientPackages = [], username }: OrdersViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const pendingOrders = allOrders.filter(o => o.status === 'pending')
  const paidOrders = allOrders.filter(o => o.status === 'paid')
  const cancelledOrders = allOrders.filter(o => o.status === 'cancelled')

  const pendingAmount = pendingOrders.reduce((s, o) => s + (o.amount ?? 0), 0)
  const paidAmount = paidOrders.reduce((s, o) => s + (o.amount ?? 0), 0)
  const cancelledAmount = cancelledOrders.reduce((s, o) => s + (o.amount ?? 0), 0)
  const totalAmount = pendingAmount + paidAmount + cancelledAmount

  const paidPct = totalAmount > 0 ? paidAmount / totalAmount : 0
  const pendingPct = totalAmount > 0 ? pendingAmount / totalAmount : 0
  const cancelledPct = totalAmount > 0 ? cancelledAmount / totalAmount : 0

  const scheduledPkgs = clientPackages
    .map(pkg => ({ ...pkg, upcoming: (pkg.paymentSchedule ?? []).filter(e => !e.orderId) }))
    .filter(pkg => pkg.upcoming.length > 0)

  const displayedOrders: Order[] = (() => {
    switch (activeTab) {
      case 'pending': return pendingOrders
      case 'paid': return paidOrders
      case 'cancelled': return cancelledOrders
      default: return allOrders
    }
  })()

  // Group by month for timeline
  const monthGroups: { monthKey: string; monthLabel: string; orders: Order[] }[] = []
  for (const order of displayedOrders) {
    const monthKey = order.createdAt.slice(0, 7)
    const monthLabel = fmtMonthYear(order.createdAt)
    const existing = monthGroups.find(g => g.monthKey === monthKey)
    if (existing) {
      existing.orders.push(order)
    } else {
      monthGroups.push({ monthKey, monthLabel, orders: [order] })
    }
  }

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allOrders.length },
    { id: 'pending', label: 'Pending', count: pendingOrders.length },
    { id: 'paid', label: 'Paid', count: paidOrders.length },
    ...(cancelledOrders.length > 0
      ? [{ id: 'cancelled' as TabType, label: 'Cancelled', count: cancelledOrders.length }]
      : []),
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">

      {/* Page header */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-1.5">Billing</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">Invoices &amp; Payments</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-7 items-start">

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <div className="w-full lg:w-[268px] xl:w-[288px] shrink-0 space-y-4 lg:sticky lg:top-24">

          {/* Account Balance Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#141414] to-[#0d0d0d] overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-gray-600 mb-4">
                Account Overview
              </p>

              {/* Donut + primary balance */}
              <div className="flex items-center gap-4 mb-5">
                <AccountDonut
                  paidPct={paidPct}
                  pendingPct={pendingPct}
                  cancelledPct={cancelledPct}
                  pendingAmount={pendingAmount}
                  hasOrders={allOrders.length > 0}
                />
                <div className="flex-1 min-w-0">
                  {pendingAmount > 0 ? (
                    <>
                      <p className="text-2xl font-black text-amber-400 tabular-nums leading-none">
                        {fmt(pendingAmount)}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">outstanding balance</p>
                      {paidAmount > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-[10px] text-gray-500">{fmt(paidAmount)} paid</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-black text-emerald-400 leading-none">
                        {allOrders.length > 0 ? 'All clear' : 'No invoices'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {allOrders.length > 0 ? 'No outstanding balance' : 'Nothing here yet'}
                      </p>
                      {paidAmount > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-[10px] text-gray-500">{fmt(paidAmount)} total paid</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Legend dots */}
              <div className="flex items-center gap-4 mb-5">
                {paidPct > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[10px] text-gray-600">Paid</span>
                  </div>
                )}
                {pendingPct > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-[10px] text-gray-600">Pending</span>
                  </div>
                )}
                {cancelledPct > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-white/20 shrink-0" />
                    <span className="text-[10px] text-gray-600">Cancelled</span>
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.06]">
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold mb-0.5">Total</p>
                  <p className="text-xl font-bold text-white tabular-nums">{allOrders.length}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold mb-0.5">Paid</p>
                  <p className={`text-xl font-bold tabular-nums ${paidOrders.length > 0 ? 'text-emerald-400' : 'text-gray-700'}`}>
                    {paidOrders.length}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold mb-0.5">Due</p>
                  <p className={`text-xl font-bold tabular-nums ${pendingOrders.length > 0 ? 'text-amber-400' : 'text-gray-700'}`}>
                    {pendingOrders.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Billing portal button */}
            {clientAccount?.id && clientAccount?.stripeCustomerId && (
              <div className="border-t border-white/[0.06] px-5 py-3.5">
                <BillingPortalButton
                  clientAccountId={clientAccount.id}
                  variant="subtle"
                  label="Manage Billing"
                />
              </div>
            )}
          </div>

          {/* Payment Schedule */}
          {scheduledPkgs.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d0d] overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.05]">
                <CalendarDays className="size-3.5 text-[#67e8f9]/50 shrink-0" />
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-gray-600">
                  Payment Schedule
                </p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {scheduledPkgs.map(pkg => (
                  <div key={pkg.id}>
                    {/* Package label row */}
                    <div className="flex items-center justify-between px-5 py-2 bg-white/[0.01]">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600 truncate">
                        {pkg.name}
                      </span>
                      {username && (
                        <Link
                          href={`/u/${username}/packages/${pkg.id}/print`}
                          className="text-[9px] text-[#67e8f9]/40 hover:text-[#67e8f9]/80 transition-colors ml-2 shrink-0"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                    {/* Schedule entries */}
                    {pkg.upcoming.map((entry) => {
                      const soon = isDueSoon(entry.dueDate)
                      return (
                        <div key={entry.id} className="flex items-start gap-3 px-5 py-3">
                          <div className={`size-1.5 rounded-full mt-[3px] shrink-0 ${
                            soon
                              ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                              : 'bg-[#67e8f9]/30'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-300 truncate leading-snug">
                              {entry.label}
                            </p>
                            {entry.dueDate && (
                              <p className={`text-[10px] mt-0.5 ${soon ? 'text-amber-400' : 'text-gray-600'}`}>
                                Due {fmtScheduleDate(entry.dueDate)}
                                {soon && (
                                  <span className="ml-1.5 text-[8px] px-1.5 py-px rounded-full bg-amber-400/10 border border-amber-400/20">
                                    Soon
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-[#67e8f9] tabular-nums shrink-0">
                            {fmt(entry.amount)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Tab strip */}
          <div className="flex items-center gap-1 mb-7 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              const countClass =
                tab.id === 'pending' && tab.count > 0
                  ? 'text-amber-400 bg-amber-400/10'
                  : tab.id === 'paid' && tab.count > 0
                  ? 'text-emerald-400/80 bg-emerald-400/[0.07]'
                  : isActive
                  ? 'text-gray-300 bg-white/10'
                  : 'text-gray-600 bg-white/[0.04]'
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${countClass}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Empty state */}
          {displayedOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center">
              <div className="inline-flex p-3 rounded-xl border border-white/[0.06] bg-[#111] mb-3">
                <Receipt className="size-5 text-gray-700" />
              </div>
              <p className="text-sm font-semibold text-gray-400">
                {activeTab === 'all' ? 'No invoices yet' : `No ${activeTab} invoices`}
              </p>
              <p className="text-xs text-gray-600 mt-1 max-w-xs leading-relaxed">
                {activeTab === 'all'
                  ? 'Invoices will appear here once work begins.'
                  : `You have no ${activeTab} invoices at this time.`}
              </p>
            </div>
          )}

          {/* Grouped timeline */}
          {monthGroups.length > 0 && (
            <div className="pl-1">
              {monthGroups.map((group, gi) => (
                <MonthGroup
                  key={group.monthKey}
                  monthLabel={group.monthLabel}
                  orders={group.orders}
                  isLastGroup={gi === monthGroups.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
