'use client'

import { CheckCircle2, Clock, XCircle, Receipt } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientOrderSummary = {
  id: string
  orderNumber: string | null
  amount: number
  status: 'paid' | 'pending' | 'cancelled'
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))

const STATUS_CFG = {
  paid: {
    icon: CheckCircle2,
    iconColor: 'text-green-400',
    badge: 'text-green-400 bg-green-400/10 border-green-400/20',
    label: 'Paid',
  },
  pending: {
    icon: Clock,
    iconColor: 'text-amber-400',
    badge: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    label: 'Pending',
  },
  cancelled: {
    icon: XCircle,
    iconColor: 'text-red-400/60',
    badge: 'text-red-400 bg-red-400/10 border-red-400/20',
    label: 'Cancelled',
  },
} as const

// ─── Main export ──────────────────────────────────────────────────────────────

interface ClientInvoiceTimelineProps {
  orders: ClientOrderSummary[]
}

export function ClientInvoiceTimeline({ orders }: ClientInvoiceTimelineProps) {
  const pending = orders.filter(o => o.status === 'pending')
  const rest = orders.filter(o => o.status !== 'pending')

  const pendingTotal = pending.reduce((s, o) => s + o.amount, 0)
  const paidTotal = orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.amount, 0)

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt className="size-7 text-gray-800 mb-3" />
        <p className="text-sm font-medium text-gray-500">No invoices yet</p>
        <p className="text-xs text-gray-600 mt-1">
          Invoices will appear here once work begins.
        </p>
      </div>
    )
  }

  // Ordered: pending first, then rest (most recent)
  const displayed = [...pending, ...rest].slice(0, 8)

  return (
    <div className="space-y-3">
      {/* Summary totals */}
      <div className="flex items-center gap-4 text-xs">
        {paidTotal > 0 && (
          <span className="text-green-400/90 font-medium">{fmt(paidTotal)} paid</span>
        )}
        {pendingTotal > 0 && (
          <span className="text-amber-400 font-medium flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
            {fmt(pendingTotal)} outstanding
          </span>
        )}
      </div>

      {/* Invoice list */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0f0f0f] overflow-hidden divide-y divide-white/[0.05]">
        {displayed.map(order => {
          const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.cancelled
          const Icon = cfg.icon
          const isPending = order.status === 'pending'

          return (
            <div
              key={order.id}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                isPending ? 'bg-amber-400/[0.03] hover:bg-amber-400/[0.05]' : 'hover:bg-white/[0.02]'
              }`}
            >
              {/* Icon */}
              <Icon className={`size-3.5 shrink-0 ${cfg.iconColor}`} />

              {/* Order ID */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {order.orderNumber ?? `INV-${order.id.slice(-6).toUpperCase()}`}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">{fmtDate(order.createdAt)}</p>
              </div>

              {/* Amount */}
              <span className={`text-sm font-semibold tabular-nums shrink-0 ${isPending ? 'text-amber-400' : 'text-white'}`}>
                {fmt(order.amount)}
              </span>

              {/* Status badge */}
              <span className={`inline-flex text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
          )
        })}
      </div>

      {orders.length > 8 && (
        <p className="text-[10px] text-gray-600 text-center">
          Showing {Math.min(8, orders.length)} of {orders.length} invoices
        </p>
      )}
    </div>
  )
}
