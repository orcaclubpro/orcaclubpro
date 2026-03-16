'use client'

import { Receipt, ExternalLink } from 'lucide-react'
import {
  fmtCurrency,
  fmtDate,
  ORDER_STATUS_CFG,
  type ClientOrderSummary,
} from '@/lib/dashboard/utils'

// Re-export so existing importers don't break
export type { ClientOrderSummary }

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientInvoiceTimelineProps {
  orders: ClientOrderSummary[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientInvoiceTimeline({ orders }: ClientInvoiceTimelineProps) {
  const pending = orders.filter(o => o.status === 'pending')
  const rest = orders.filter(o => o.status !== 'pending')

  const pendingTotal = pending.reduce((s, o) => s + o.amount, 0)
  const paidTotal = orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.amount, 0)

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#404040] bg-[#252525] py-12 text-center">
        <div className="inline-flex p-3 rounded-full bg-[rgba(255,255,255,0.06)] border border-[#404040] mb-4">
          <Receipt className="size-6 text-[#6B6B6B]" />
        </div>
        <p className="text-sm font-medium text-[#A0A0A0]">No invoices yet</p>
        <p className="text-xs text-[#6B6B6B] mt-1">Invoices will appear here once work begins.</p>
      </div>
    )
  }

  // Pending first, then rest (most recent)
  const displayed = [...pending, ...rest].slice(0, 8)

  return (
    <div className="space-y-3">
      {/* Summary totals */}
      <div className="flex items-center gap-4 text-xs">
        {paidTotal > 0 && (
          <span className="text-emerald-400/90 font-medium">{fmtCurrency(paidTotal)} paid</span>
        )}
        {pendingTotal > 0 && (
          <span className="text-amber-400 font-medium flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
            {fmtCurrency(pendingTotal)} outstanding
          </span>
        )}
      </div>

      {/* Invoice list */}
      <div className="rounded-xl border border-[#404040] bg-[#252525] overflow-hidden divide-y divide-[#333333]">
        {displayed.map(order => {
          const cfg = ORDER_STATUS_CFG[order.status] ?? ORDER_STATUS_CFG.cancelled
          const Icon = cfg.icon
          const isPending = order.status === 'pending'

          return (
            <div
              key={order.id}
              className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                isPending ? 'bg-amber-400/[0.03] hover:bg-amber-400/[0.05]' : 'hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              <Icon className={`size-3.5 shrink-0 ${cfg.iconColor}`} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#F0F0F0] truncate">
                  {order.title ?? order.orderNumber ?? `INV-${order.id.slice(-6).toUpperCase()}`}
                </p>
                <p className="text-xs text-[#A0A0A0] mt-0.5">
                  {order.orderNumber ? `#${order.orderNumber} · ` : ''}{fmtDate(order.createdAt)}
                </p>
              </div>

              <span className={`text-sm font-semibold tabular-nums shrink-0 ${isPending ? 'text-amber-400' : 'text-[#F0F0F0]'}`}>
                {fmtCurrency(order.amount)}
              </span>

              <span className={`inline-flex text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${cfg.badgeClass}`}>
                {cfg.label}
              </span>

              {isPending && order.stripeInvoiceUrl && (
                <a
                  href={order.stripeInvoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-md bg-amber-400/10 border border-amber-400/25 text-amber-400 hover:bg-amber-400/20 transition-all shrink-0 whitespace-nowrap"
                >
                  Pay Now <ExternalLink className="size-2.5" />
                </a>
              )}
            </div>
          )
        })}
      </div>

      {orders.length > 8 && (
        <p className="text-xs text-[#A0A0A0] text-center">
          Showing {Math.min(8, orders.length)} of {orders.length} invoices
        </p>
      )}
    </div>
  )
}
