'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Wallet, Send, Check, AlertCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { BusinessPulseProps } from './BusinessPulse'

// ─── Formatter ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1C1C1C] border border-[#404040] rounded-lg px-3 py-2 text-xs shadow-xl shadow-[#000000]/[0.40]">
      <p className="text-[#6B6B6B] mb-1">{label}</p>
      <p className="text-[#F0F0F0] font-medium">{fmt(payload[0]?.value ?? 0)}</p>
      <p className="text-[#4A4A4A]">
        {payload[0]?.payload?.orders} order
        {payload[0]?.payload?.orders !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ─── Due-date badge helper ─────────────────────────────────────────────────────

function dueBadge(dueDate: string | null | undefined): { label: string; cls: string } {
  if (!dueDate) return { label: 'No due date', cls: 'text-[#4A4A4A]' }
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000)
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`,  cls: 'text-red-400 bg-red-400/[0.08] border border-red-400/20 px-1.5 py-0.5 rounded-md' }
  if (diff === 0) return { label: 'Due today',                  cls: 'text-amber-400 bg-amber-400/[0.08] border border-amber-400/20 px-1.5 py-0.5 rounded-md' }
  if (diff === 1) return { label: 'Tomorrow',                   cls: 'text-amber-400/80 bg-amber-400/[0.05] border border-amber-400/15 px-1.5 py-0.5 rounded-md' }
  if (diff <= 7)  return { label: `${diff}d left`,              cls: 'text-[#6B6B6B] bg-[#252525] border border-[#404040] px-1.5 py-0.5 rounded-md' }
  return {
    label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dueDate)),
    cls: 'text-[#4A4A4A]',
  }
}

// ─── Pending invoice card ──────────────────────────────────────────────────────

type SendState = 'idle' | 'sending' | 'sent' | 'error'

function PendingInvoiceCard({ order }: { order: any }) {
  const [sendState, setSendState] = useState<SendState>('idle')

  const clientName: string =
    typeof order.clientAccount === 'object'
      ? (order.clientAccount?.name ?? order.clientAccount?.firstName ?? 'Unknown')
      : 'Unknown'

  const projectName: string | null =
    typeof order.projectRef === 'object' && order.projectRef?.name
      ? order.projectRef.name
      : (order.project as string | null) ?? null

  const invoiceLabel =
    order.orderNumber ??
    `INV-${String(order.id).slice(-6).toUpperCase()}`

  const invoiceType: string | null = order.invoiceType ?? null

  const { label: dueLabel, cls: dueCls } = dueBadge(order.dueDate)

  const handleSend = async () => {
    if (sendState !== 'idle') return
    setSendState('sending')
    try {
      const res  = await fetch('/api/invoices/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      setSendState(res.ok && data.success ? 'sent' : 'error')
    } catch {
      setSendState('error')
    }
    setTimeout(() => setSendState('idle'), 3000)
  }

  return (
    <div className="rounded-xl border border-[#404040] bg-[#1C1C1C] overflow-hidden group hover:border-[#404040] transition-colors duration-150">

      {/* Main content */}
      <div className="px-3.5 pt-3.5 pb-3 space-y-2">

        {/* Row 1 — client + amount */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] font-semibold text-[#F0F0F0] leading-tight truncate">{clientName}</p>
          <p className="text-[14px] font-bold text-amber-400 tabular-nums shrink-0 leading-tight">{fmt(order.amount ?? 0)}</p>
        </div>

        {/* Row 2 — project + invoice type */}
        <div className="flex items-center gap-1.5 min-w-0">
          {projectName && (
            <span className="text-[10px] text-[#6B6B6B] truncate">{projectName}</span>
          )}
          {projectName && invoiceType && (
            <span className="text-[#4A4A4A] text-[10px]">·</span>
          )}
          {invoiceType && (
            <span className="text-[9px] font-medium text-[#4A4A4A] uppercase tracking-wide capitalize shrink-0">{invoiceType}</span>
          )}
        </div>

        {/* Row 3 — invoice label + due date */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#4A4A4A] truncate">{invoiceLabel}</span>
          <span className={`text-[9px] font-semibold whitespace-nowrap tabular-nums ${dueCls}`}>{dueLabel}</span>
        </div>
      </div>

      {/* Send invoice button */}
      <button
        onClick={handleSend}
        disabled={sendState === 'sending' || sendState === 'sent'}
        className={`w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-[11px] font-medium border-t transition-all duration-200
          ${sendState === 'sent'
            ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-400 cursor-default'
            : sendState === 'error'
            ? 'border-red-400/20 bg-red-400/[0.06] text-red-400 cursor-pointer'
            : sendState === 'sending'
            ? 'border-[#404040] bg-[#252525] text-[#4A4A4A] cursor-wait'
            : 'border-[#404040] bg-transparent text-[#6B6B6B] hover:bg-[#2D2D2D] hover:text-[#A0A0A0] cursor-pointer'
          }`}
      >
        {sendState === 'sending' && (
          <svg className="size-3 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {sendState === 'sent'    && <Check        className="size-3 shrink-0" />}
        {sendState === 'error'   && <AlertCircle  className="size-3 shrink-0" />}
        {sendState === 'idle'    && <Send         className="size-3 shrink-0" />}
        {sendState === 'idle'    ? 'Send Invoice'
          : sendState === 'sending' ? 'Sending…'
          : sendState === 'sent'    ? 'Invoice sent'
          : 'Failed · tap to retry'}
      </button>

    </div>
  )
}

// ─── Sidebar content (shared between desktop panel + mobile sheet) ─────────────

function SidebarContent({
  weeklyRevenue,
  orderPipeline,
  projectStatus,
  kpis,
  allOrders,
}: BusinessPulseProps & { allOrders?: any[] }) {
  const pendingOrders = allOrders
    ? allOrders
        .filter((o: any) => o.status === 'pending')
        .sort((a: any, b: any) => {
          // Soonest due date first; no dueDate goes to the bottom
          const aT = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bT = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          return aT - bT
        })
    : []
  const pendingTotal = pendingOrders.reduce((s: number, o: any) => s + (o.amount ?? 0), 0)
  const maxRevenue = Math.max(...weeklyRevenue.map((w) => w.revenue), 1)

  const pipelineTotal =
    orderPipeline.paidAmount +
    orderPipeline.pendingAmount +
    orderPipeline.cancelledAmount
  const paidPct =
    pipelineTotal > 0 ? (orderPipeline.paidAmount / pipelineTotal) * 100 : 0
  const pendingPct =
    pipelineTotal > 0 ? (orderPipeline.pendingAmount / pipelineTotal) * 100 : 0
  const cancelledPct =
    pipelineTotal > 0
      ? (orderPipeline.cancelledAmount / pipelineTotal) * 100
      : 0

  const projectTotal =
    projectStatus.active + projectStatus.pending + projectStatus.completed
  const activePct =
    projectTotal > 0 ? (projectStatus.active / projectTotal) * 100 : 0
  const pendingProjPct =
    projectTotal > 0 ? (projectStatus.pending / projectTotal) * 100 : 0
  const completedPct =
    projectTotal > 0 ? (projectStatus.completed / projectTotal) * 100 : 0

  return (
    <div className="space-y-7">

      {/* Projected Revenue — only when pending orders exist */}
      {pendingOrders.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] uppercase tracking-widest text-[#4A4A4A] font-medium">
            Projected Revenue
          </p>
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] px-4 py-3.5">
            <p className="text-[9px] uppercase tracking-widest text-amber-400/50 font-medium mb-1">
              Outstanding
            </p>
            <p className="text-2xl font-bold text-amber-400 tabular-nums leading-none">
              {fmt(pendingTotal)}
            </p>
            <p className="text-[10px] text-[#4A4A4A] mt-1">
              {pendingOrders.length} pending invoice{pendingOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-2">
            {pendingOrders.slice(0, 5).map((o: any) => (
              <PendingInvoiceCard key={o.id} order={o} />
            ))}
            {pendingOrders.length > 5 && (
              <p className="text-[10px] text-[#4A4A4A] text-center pt-0.5">
                +{pendingOrders.length - 5} more
              </p>
            )}
          </div>
          <div className="h-px bg-[#333333]" />
        </div>
      )}

      {/* KPI 2×2 grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-[rgba(139,156,182,0.15)] bg-[rgba(139,156,182,0.06)] p-4">
          <p className="text-[9px] uppercase tracking-widest text-[#4A4A4A] font-medium">
            30d Revenue
          </p>
          <p className="text-xl font-bold tabular-nums mt-1.5" style={{ color: 'var(--space-accent)' }}>
            {fmt(kpis.revenue30d)}
          </p>
        </div>
        <div className="rounded-xl border border-[#404040] bg-[#252525] p-4">
          <p className="text-[9px] uppercase tracking-widest text-[#4A4A4A] font-medium">
            Orders
          </p>
          <p className="text-xl font-bold text-[#F0F0F0] tabular-nums mt-1.5">
            {kpis.orders30d}
          </p>
        </div>
        <div className="rounded-xl border border-[#404040] bg-[#252525] p-4">
          <p className="text-[9px] uppercase tracking-widest text-[#4A4A4A] font-medium">
            Active Clients
          </p>
          <p className="text-xl font-bold text-[#F0F0F0] tabular-nums mt-1.5">
            {kpis.activeClients}
          </p>
        </div>
        <div className="rounded-xl border border-[#404040] bg-[#252525] p-4">
          <p className="text-[9px] uppercase tracking-widest text-[#4A4A4A] font-medium">
            Projects
          </p>
          <p className="text-xl font-bold text-[#F0F0F0] tabular-nums mt-1.5">
            {kpis.activeProjects}
          </p>
        </div>
      </div>

      {/* Weekly revenue chart */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#4A4A4A] font-medium mb-3">
          Weekly Revenue
        </p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyRevenue}
              barSize={22}
              margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fill: '#4A4A4A', fontSize: 9, fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                {weeklyRevenue.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.revenue === maxRevenue && entry.revenue > 0
                        ? '#1E3A6E'
                        : 'rgba(139,156,182,0.12)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order pipeline */}
      <div className="space-y-2.5">
        <p className="text-[10px] uppercase tracking-widest text-[#4A4A4A] font-medium">
          Order Pipeline
        </p>
        <div className="h-2 w-full rounded-full overflow-hidden flex bg-[#2D2D2D]">
          {paidPct > 0 && (
            <div
              style={{ width: `${paidPct}%` }}
              className="bg-emerald-400/70 transition-all duration-500"
            />
          )}
          {pendingPct > 0 && (
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-amber-400/70 transition-all duration-500"
            />
          )}
          {cancelledPct > 0 && (
            <div
              style={{ width: `${cancelledPct}%` }}
              className="bg-red-400/40 transition-all duration-500"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-[10px] text-[#4A4A4A]">
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400/70 inline-block shrink-0" />
              Paid
            </span>
            <span className="tabular-nums text-[#6B6B6B]">{fmt(orderPipeline.paidAmount)}</span>
          </span>
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400/70 inline-block shrink-0" />
              Pending
            </span>
            <span className="tabular-nums text-[#6B6B6B]">{fmt(orderPipeline.pendingAmount)}</span>
          </span>
          {orderPipeline.cancelledCount > 0 && (
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-red-400/40 inline-block shrink-0" />
                Cancelled
              </span>
              <span className="tabular-nums text-[#6B6B6B]">{fmt(orderPipeline.cancelledAmount)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Project health */}
      <div className="space-y-2.5">
        <p className="text-[10px] uppercase tracking-widest text-[#4A4A4A] font-medium">
          Project Health
        </p>
        <div className="h-2 w-full rounded-full overflow-hidden flex bg-[#2D2D2D]">
          {activePct > 0 && (
            <div
              style={{ width: `${activePct}%` }}
              className="bg-[#1E3A6E]/70 transition-all duration-500"
            />
          )}
          {pendingProjPct > 0 && (
            <div
              style={{ width: `${pendingProjPct}%` }}
              className="bg-amber-400/50 transition-all duration-500"
            />
          )}
          {completedPct > 0 && (
            <div
              style={{ width: `${completedPct}%` }}
              className="bg-[#4A4A4A]/60 transition-all duration-500"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-[10px] text-[#4A4A4A]">
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#1E3A6E]/70 inline-block shrink-0" />
              Active
            </span>
            <span className="tabular-nums text-[#6B6B6B]">{projectStatus.active}</span>
          </span>
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400/50 inline-block shrink-0" />
              Pending
            </span>
            <span className="tabular-nums text-[#6B6B6B]">{projectStatus.pending}</span>
          </span>
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#4A4A4A]/60 inline-block shrink-0" />
              Completed
            </span>
            <span className="tabular-nums text-[#6B6B6B]">{projectStatus.completed}</span>
          </span>
        </div>
      </div>

    </div>
  )
}

// ─── Panel header ─────────────────────────────────────────────────────────────

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-[#404040] shrink-0">
      <div>
        <h2 className="text-sm font-semibold text-[#F0F0F0]">Analytics</h2>
        <p className="text-[10px] text-[#4A4A4A] mt-0.5 uppercase tracking-wider">
          Last 30 days
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-[#2D2D2D] text-[#4A4A4A] hover:text-[#6B6B6B] transition-all"
        aria-label="Close analytics"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AnalyticsSidebar({
  allOrders,
  open: externalOpen,
  onOpenChange,
  ...props
}: BusinessPulseProps & {
  allOrders?: any[]
  open?: boolean
  onOpenChange?: (v: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  // Delay render until client-side so createPortal can target document.body
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Sync external open signal into local state
  useEffect(() => {
    if (externalOpen === true) setOpen(true)
  }, [externalOpen])

  const handleClose = () => {
    setOpen(false)
    onOpenChange?.(false)
  }

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    onOpenChange?.(next)
  }

  // All fixed UI portaled to document.body to escape the zoom:1.3 stacking
  // context on <main>, which would otherwise trap z-indices below the header.
  const portal = (
    <>
      {/* ── Desktop: right-edge vertical tab ────────────────────────────── */}
      <button
        onClick={handleToggle}
        className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-[60]
                   flex-col items-center gap-2.5
                   pl-3 pr-2.5 py-5
                   bg-[#1C1C1C] border border-r-0 border-[#404040]
                   rounded-l-xl
                   hover:border-[rgba(139,156,182,0.20)] hover:bg-[#252525]
                   transition-all duration-300 group"
        aria-label="Toggle revenue sidebar"
      >
        <Wallet className="size-3.5" style={{ color: 'var(--space-accent)' }} />
        <span
          className="text-[9px] font-semibold text-[#4A4A4A] uppercase tracking-[0.18em]
                     group-hover:text-[#6B6B6B] transition-colors
                     [writing-mode:vertical-rl] rotate-180"
        >
          Revenue
        </span>
      </button>

      {/* ── Mobile: right-edge vertical tab ─────────────────────────────── */}
      <button
        onClick={handleToggle}
        className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-[60]
                   flex flex-col items-center gap-2
                   pl-2.5 pr-2 py-4
                   bg-[#1C1C1C]/90 border border-r-0 border-[#404040]
                   rounded-l-xl
                   hover:border-[rgba(139,156,182,0.20)] hover:bg-[#252525]
                   transition-all duration-300 active:scale-95"
        aria-label="Toggle analytics"
      >
        <Wallet className="size-3.5" style={{ color: 'var(--space-accent)' }} />
        <span
          className="text-[8px] font-semibold text-[#4A4A4A] uppercase tracking-[0.15em]
                     [writing-mode:vertical-rl] rotate-180"
        >
          Revenue
        </span>
      </button>

      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[65] bg-[#000000]/[0.40]
                    transition-opacity duration-300
                    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* ── Desktop: slide-in panel from right ──────────────────────────── */}
      <aside
        className={`hidden md:flex fixed top-[65px] right-0 bottom-0 z-[70]
                    w-[360px] xl:w-[400px] flex-col
                    bg-[#1C1C1C] border-l border-[#404040]
                    transition-transform duration-300 ease-in-out
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Analytics sidebar"
      >
        <PanelHeader onClose={handleClose} />
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <SidebarContent {...props} allOrders={allOrders} />
        </div>
      </aside>

      {/* ── Mobile: slide-up bottom sheet ────────────────────────────────── */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-[70]
                    flex flex-col
                    bg-[#1C1C1C] border-t border-[#404040] rounded-t-2xl
                    transition-transform duration-300 ease-in-out
                    ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '82vh' }}
        aria-label="Analytics panel"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[#E5E1D9]" />
        </div>
        <PanelHeader onClose={handleClose} />
        <div className="overflow-y-auto px-6 pb-10 pt-5" style={{ overscrollBehavior: 'contain' }}>
          <SidebarContent {...props} allOrders={allOrders} />
        </div>
      </div>
    </>
  )

  if (!mounted) return null
  return createPortal(portal, document.body)
}
