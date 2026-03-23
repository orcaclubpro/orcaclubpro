'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExternalLink } from 'lucide-react'

export interface OrderSummary {
  id: string
  orderNumber?: string | null
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  stripeInvoiceUrl?: string | null
  createdAt: string
}

interface BalanceCardProps {
  orders: OrderSummary[]
  activeProjectCount: number
  mostRecentOrder: OrderSummary | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtCompact = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function DonutSegment({
  pct,
  offset,
  color,
  r = 40,
}: {
  pct: number
  offset: number
  color: string
  r?: number
}) {
  const circumference = 2 * Math.PI * r
  return (
    <circle
      cx="50"
      cy="50"
      r={r}
      fill="none"
      stroke={color}
      strokeWidth="10"
      strokeDasharray={`${pct * circumference} ${(1 - pct) * circumference}`}
      strokeDashoffset={-offset * circumference}
      transform="rotate(-90 50 50)"
      strokeLinecap="butt"
    />
  )
}

export function BalanceCard({ orders, activeProjectCount, mostRecentOrder }: BalanceCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const paidAmount = orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.amount, 0)
  const pendingAmount = orders.filter(o => o.status === 'pending').reduce((s, o) => s + o.amount, 0)
  const cancelledAmount = orders.filter(o => o.status === 'cancelled').reduce((s, o) => s + o.amount, 0)
  const total = paidAmount + pendingAmount + cancelledAmount

  const pendingOrders = orders.filter(o => o.status === 'pending')

  const paidPct = total > 0 ? paidAmount / total : (orders.length === 0 ? 0 : 1)
  const pendingPct = total > 0 ? pendingAmount / total : 0
  const cancelledPct = total > 0 ? cancelledAmount / total : 0

  const paidOffset = 0
  const pendingOffset = paidPct
  const cancelledOffset = paidPct + pendingPct

  const hasOrders = orders.length > 0

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] p-6 sm:p-7">
      {pendingAmount > 0 && (
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/[0.06] blur-3xl pointer-events-none animate-pulse" />
      )}

      <div className="relative z-10">
        <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[var(--space-text-muted)] mb-5">
          Account Overview
        </p>

        {/* Top: donut + summary */}
        <div className="flex items-center gap-6 mb-5">

          {/* SVG donut */}
          <div className="relative shrink-0 w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Background track */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
              {!hasOrders ? (
                <DonutSegment pct={1} offset={0} color="rgba(255,255,255,0.05)" />
              ) : (
                <>
                  {paidPct > 0 && <DonutSegment pct={paidPct} offset={paidOffset} color="#4ade80" />}
                  {pendingPct > 0 && <DonutSegment pct={pendingPct} offset={pendingOffset} color="#fbbf24" />}
                  {cancelledPct > 0 && <DonutSegment pct={cancelledPct} offset={cancelledOffset} color="rgba(255,255,255,0.06)" />}
                </>
              )}
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-1">
                {pendingAmount > 0 ? (
                  <>
                    <p className="text-[8px] text-amber-400/70 font-semibold uppercase tracking-wider leading-none mb-0.5">due</p>
                    <p className="text-[10px] font-black text-amber-400 tabular-nums leading-none">
                      {fmtCompact(pendingAmount)}
                    </p>
                  </>
                ) : hasOrders ? (
                  <p className="text-base font-bold text-green-400 leading-none">✓</p>
                ) : (
                  <p className="text-[9px] text-[var(--space-text-muted)] leading-none">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Summary text */}
          <div className="flex-1 space-y-2">
            {pendingAmount > 0 ? (
              <>
                <div>
                  <p className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-amber-400">
                    {fmt(pendingAmount)}
                  </p>
                  <p className="text-xs text-[var(--space-text-secondary)] mt-0.5">
                    {pendingOrders.length} pending invoice{pendingOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {paidAmount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-[var(--space-text-secondary)]">
                      <span className="size-1.5 rounded-full bg-green-400 shrink-0" />
                      {fmt(paidAmount)} paid
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-[var(--space-text-secondary)]">
                    <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                    {fmt(pendingAmount)} due
                  </span>
                </div>
                <button
                  onClick={() => setDialogOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-400 hover:bg-amber-400/15 transition-all"
                >
                  View &amp; Pay Invoices
                  <ExternalLink className="size-3" />
                </button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-green-400">
                    {hasOrders ? 'All clear' : 'No invoices'}
                  </p>
                  <p className="text-xs text-[var(--space-text-secondary)] mt-0.5">
                    {hasOrders ? 'No outstanding invoices' : 'Nothing yet'}
                  </p>
                </div>
                {paidAmount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--space-text-secondary)]">
                    <span className="size-1.5 rounded-full bg-green-400 shrink-0" />
                    {fmt(paidAmount)} paid total
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--space-border-hard)] mb-5" />

        {/* Bottom metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[9px] text-[var(--space-text-muted)] uppercase tracking-wider font-semibold mb-1">Projects</p>
            <p className="text-2xl font-bold text-[var(--space-text-primary)] tabular-nums">{activeProjectCount}</p>
            <p className="text-[10px] text-[var(--space-text-muted)]">Active</p>
          </div>
          <div>
            <p className="text-[9px] text-[var(--space-text-muted)] uppercase tracking-wider font-semibold mb-1">Invoices</p>
            <p className="text-2xl font-bold text-[var(--space-text-primary)] tabular-nums">{orders.length}</p>
            <p className="text-[10px] text-[var(--space-text-muted)]">Total</p>
          </div>
          {mostRecentOrder && (
            <div>
              <p className="text-[9px] text-[var(--space-text-muted)] uppercase tracking-wider font-semibold mb-1">Latest</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${
                mostRecentOrder.status === 'paid'
                  ? 'text-green-400 bg-green-400/10 border-green-400/20'
                  : mostRecentOrder.status === 'pending'
                    ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                    : 'text-red-400 bg-red-400/10 border-red-400/20'
              }`}>
                <span className={`size-1 rounded-full ${
                  mostRecentOrder.status === 'paid' ? 'bg-green-400' :
                  mostRecentOrder.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                {mostRecentOrder.status === 'paid' ? 'Paid' : mostRecentOrder.status === 'pending' ? 'Pending' : 'Cancelled'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pay Invoices Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--space-text-primary)] text-base font-semibold">
              Outstanding Invoices
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {pendingOrders.map(order => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--space-text-primary)] truncate">
                    {order.orderNumber ?? `INV-${order.id.slice(-6).toUpperCase()}`}
                  </p>
                  <p className="text-[10px] text-[var(--space-text-secondary)] mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-bold text-amber-400 tabular-nums">
                    {fmt(order.amount)}
                  </p>
                  {order.stripeInvoiceUrl ? (
                    <a
                      href={order.stripeInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-400 hover:bg-amber-400/20 transition-all whitespace-nowrap"
                    >
                      Pay <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--space-text-muted)] italic">No link</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {pendingOrders.length > 1 && (
            <div className="pt-3 mt-2 border-t border-[var(--space-border-hard)] flex items-center justify-between">
              <p className="text-xs text-[var(--space-text-secondary)]">Total outstanding</p>
              <p className="text-sm font-bold text-amber-400 tabular-nums">{fmt(pendingAmount)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
