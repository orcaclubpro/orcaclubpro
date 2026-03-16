'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, Check, AlertCircle, TrendingUp, Clock, Users, FolderKanban, Loader2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { BusinessPulseProps } from './BusinessPulse'

// ─── Constants ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-xs shadow-2xl shadow-black/60">
      <p className="text-[#555] mb-0.5 uppercase tracking-wider text-[10px]">{label}</p>
      <p className="text-[#F0F0F0] font-semibold tabular-nums">{fmt(payload[0]?.value ?? 0)}</p>
      {payload[0]?.payload?.orders > 0 && (
        <p className="text-[#444] text-[10px]">{payload[0].payload.orders} order{payload[0].payload.orders !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}

// ─── Due-date badge ────────────────────────────────────────────────────────────

function dueBadge(dueDate: string | null | undefined): { label: string; cls: string } {
  if (!dueDate) return { label: 'No due date', cls: 'text-[#444]' }
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000)
  if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, cls: 'text-red-400 bg-red-400/10 border border-red-400/20 px-1.5 py-0.5 rounded' }
  if (diff === 0) return { label: 'Due today',                  cls: 'text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded' }
  if (diff === 1) return { label: 'Tomorrow',                   cls: 'text-amber-400/70 bg-amber-400/[0.06] border border-amber-400/15 px-1.5 py-0.5 rounded' }
  if (diff <= 7)  return { label: `${diff}d left`,              cls: 'text-[#555] bg-[#1C1C1C] border border-[#262626] px-1.5 py-0.5 rounded' }
  return {
    label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dueDate)),
    cls: 'text-[#444]',
  }
}

// ─── Invoice card ─────────────────────────────────────────────────────────────

type SendState = 'idle' | 'sending' | 'sent' | 'error'

function InvoiceCard({ order }: { order: any }) {
  const [sendState, setSendState] = useState<SendState>('idle')

  const clientName: string =
    typeof order.clientAccount === 'object'
      ? (order.clientAccount?.name ?? order.clientAccount?.firstName ?? 'Unknown')
      : 'Unknown'

  const projectName: string | null =
    typeof order.projectRef === 'object' && order.projectRef?.name
      ? order.projectRef.name
      : (order.project as string | null) ?? null

  const invoiceLabel = order.orderNumber ?? `INV-${String(order.id).slice(-6).toUpperCase()}`
  const { label: dueLabel, cls: dueCls } = dueBadge(order.dueDate)

  const handleSend = async () => {
    if (sendState !== 'idle' && sendState !== 'error') return
    setSendState('sending')
    try {
      const res = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      setSendState(res.ok && data.success ? 'sent' : 'error')
    } catch {
      setSendState('error')
    }
    if (sendState !== 'error') setTimeout(() => setSendState('idle'), 4000)
  }

  const btnLabel =
    sendState === 'idle'    ? 'Send Invoice' :
    sendState === 'sending' ? 'Sending…' :
    sendState === 'sent'    ? 'Sent' :
    'Retry'

  return (
    <div
      className="rounded-xl border border-[#1C1C1C] bg-[#0D0D0D] overflow-hidden transition-colors duration-150 hover:border-[#262626]"
      role="article"
      aria-label={`Invoice for ${clientName}, ${fmt(order.amount ?? 0)}`}
    >
      {/* Content */}
      <div className="px-4 pt-3.5 pb-3 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] font-semibold text-[#E8E8E8] leading-tight truncate">{clientName}</p>
          <p className="text-[15px] font-bold text-amber-400 tabular-nums shrink-0 leading-tight">{fmt(order.amount ?? 0)}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          {projectName && <span className="text-[11px] text-[#555] truncate">{projectName}</span>}
          <span className="text-[10px] text-[#383838] font-mono shrink-0 ml-auto">{invoiceLabel}</span>
        </div>
        <span className={`inline-block text-[10px] font-semibold whitespace-nowrap ${dueCls}`}>{dueLabel}</span>
      </div>

      {/* Send button — a proper CTA */}
      <button
        onClick={handleSend}
        disabled={sendState === 'sending' || sendState === 'sent'}
        aria-label={`${btnLabel} — ${clientName}`}
        className={[
          'w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-semibold',
          'border-t transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]/60',
          sendState === 'sent'
            ? 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400 cursor-default'
            : sendState === 'error'
            ? 'border-red-500/20 bg-red-500/[0.06] text-red-400 cursor-pointer hover:bg-red-500/10'
            : sendState === 'sending'
            ? 'border-[#1C1C1C] bg-[#141414] text-[#444] cursor-wait'
            : 'border-[var(--space-accent)]/20 bg-[var(--space-accent)]/[0.06] text-[var(--space-accent)] hover:bg-[var(--space-accent)]/10 cursor-pointer',
        ].join(' ')}
      >
        {sendState === 'sending' && <Loader2 className="size-3 animate-spin shrink-0" />}
        {sendState === 'sent'    && <Check        className="size-3 shrink-0" />}
        {sendState === 'error'   && <AlertCircle  className="size-3 shrink-0" />}
        {sendState === 'idle'    && <Send         className="size-3 shrink-0" />}
        {btnLabel}
      </button>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHead({ label, aside }: { label: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#555]">{label}</p>
      {aside && <span className="text-[10px] text-[#3A3A3A] tabular-nums">{aside}</span>}
    </div>
  )
}

// ─── Segmented bar ────────────────────────────────────────────────────────────

function SegBar({ segments }: { segments: { pct: number; color: string; label: string }[] }) {
  return (
    <div
      className="h-[5px] w-full rounded-full overflow-hidden flex gap-px bg-[#1C1C1C]"
      role="img"
      aria-label={segments.map(s => `${s.label}: ${Math.round(s.pct)}%`).join(', ')}
    >
      {segments.map((s, i) => s.pct > 0 && (
        <div
          key={i}
          style={{ width: `${s.pct}%` }}
          className={`${s.color} transition-all duration-700 ease-out`}
        />
      ))}
    </div>
  )
}

// ─── KPI mini-card ────────────────────────────────────────────────────────────

function KpiMini({
  label, value, icon: Icon, accent = false,
}: {
  label: string; value: string; icon: React.ElementType; accent?: boolean
}) {
  return (
    <div
      className={[
        'rounded-xl p-3.5 border transition-all duration-150 focus-within:ring-1',
        accent
          ? 'bg-[rgba(139,156,182,0.05)] border-[rgba(139,156,182,0.15)] hover:bg-[rgba(139,156,182,0.08)]'
          : 'bg-[#0D0D0D] border-[#1C1C1C] hover:border-[#262626] hover:bg-[#111]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#555]">{label}</span>
        <Icon className={`size-3 ${accent ? 'text-[var(--space-accent)]/60' : 'text-[#2A2A2A]'}`} aria-hidden="true" />
      </div>
      <p className={`text-[18px] font-bold tabular-nums leading-none ${accent ? 'text-[var(--space-accent)]' : 'text-[#D0D0D0]'}`}>
        {value}
      </p>
    </div>
  )
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({
  weeklyRevenue, orderPipeline, projectStatus, kpis, allOrders,
}: BusinessPulseProps & { allOrders?: any[] }) {
  const pendingOrders = (allOrders ?? [])
    .filter((o: any) => o.status === 'pending')
    .sort((a: any, b: any) => {
      const aT = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const bT = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      return aT - bT
    })

  const pendingTotal = pendingOrders.reduce((s: number, o: any) => s + (o.amount ?? 0), 0)
  const maxRevenue   = Math.max(...weeklyRevenue.map(w => w.revenue), 1)

  const pipeTotal   = orderPipeline.paidAmount + orderPipeline.pendingAmount + orderPipeline.cancelledAmount || 1
  const paidPct     = (orderPipeline.paidAmount      / pipeTotal) * 100
  const pendingPct  = (orderPipeline.pendingAmount    / pipeTotal) * 100
  const cancelPct   = (orderPipeline.cancelledAmount  / pipeTotal) * 100

  const projTotal   = projectStatus.active + projectStatus.pending + projectStatus.completed || 1
  const activePct   = (projectStatus.active    / projTotal) * 100
  const pendProjPct = (projectStatus.pending    / projTotal) * 100
  const donePct     = (projectStatus.completed  / projTotal) * 100

  return (
    <div className="space-y-7 pb-4">

      {/* KPIs */}
      <section aria-label="Key performance indicators">
        <div className="grid grid-cols-2 gap-2">
          <KpiMini label="30d Revenue"  value={fmt(kpis.revenue30d)}              icon={TrendingUp}  accent />
          <KpiMini label="Pending"      value={fmt(orderPipeline.pendingAmount)}  icon={Clock} />
          <KpiMini label="Clients"      value={String(kpis.activeClients)}        icon={Users} />
          <KpiMini label="Projects"     value={String(kpis.activeProjects)}       icon={FolderKanban} />
        </div>
      </section>

      {/* Outstanding */}
      {pendingOrders.length > 0 && (
        <section aria-label="Outstanding invoices" className="space-y-3">
          <SectionHead
            label="Outstanding"
            aside={`${pendingOrders.length} invoice${pendingOrders.length !== 1 ? 's' : ''}`}
          />

          {/* Total callout */}
          <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.03] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-amber-400/50 font-semibold mb-1">Total Outstanding</p>
              <p className="text-2xl font-bold text-amber-400 tabular-nums leading-none">{fmt(pendingTotal)}</p>
            </div>
            <div className="size-9 rounded-full bg-amber-400/[0.06] border border-amber-400/15 flex items-center justify-center" aria-hidden="true">
              <Clock className="size-3.5 text-amber-400/50" />
            </div>
          </div>

          {/* Invoice cards */}
          <div className="space-y-2" role="list" aria-label="Pending invoices">
            {pendingOrders.slice(0, 5).map((o: any) => (
              <div key={o.id} role="listitem">
                <InvoiceCard order={o} />
              </div>
            ))}
          </div>
          {pendingOrders.length > 5 && (
            <p className="text-center text-[10px] text-[#3A3A3A] pt-1">
              +{pendingOrders.length - 5} more not shown
            </p>
          )}

          <div className="h-px bg-[#141414]" role="separator" />
        </section>
      )}

      {/* Weekly revenue chart */}
      <section aria-label="Weekly revenue chart" className="space-y-3">
        <SectionHead label="Weekly Revenue" aside={fmt(kpis.revenue30d)} />
        <div className="h-32" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyRevenue} barSize={22} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: '#3A3A3A', fontSize: 9, fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {weeklyRevenue.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.revenue === maxRevenue && entry.revenue > 0
                        ? 'rgba(139,156,182,0.55)'
                        : 'rgba(139,156,182,0.12)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Order pipeline */}
      <section aria-label="Order pipeline breakdown" className="space-y-3">
        <SectionHead label="Order Pipeline" />
        <SegBar segments={[
          { pct: paidPct,    color: 'bg-emerald-500/55', label: 'Paid' },
          { pct: pendingPct, color: 'bg-amber-500/55',   label: 'Pending' },
          { pct: cancelPct,  color: 'bg-red-500/30',     label: 'Cancelled' },
        ]} />
        <dl className="space-y-1.5">
          {[
            { dot: 'bg-emerald-500/55', label: 'Paid',      value: fmt(orderPipeline.paidAmount),      count: orderPipeline.paidCount },
            { dot: 'bg-amber-500/55',   label: 'Pending',   value: fmt(orderPipeline.pendingAmount),   count: orderPipeline.pendingCount },
            ...(orderPipeline.cancelledCount > 0
              ? [{ dot: 'bg-red-500/30', label: 'Cancelled', value: fmt(orderPipeline.cancelledAmount), count: orderPipeline.cancelledCount }]
              : []),
          ].map(({ dot, label, value, count }) => (
            <div key={label} className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-[11px] text-[#4A4A4A]">
                <span className={`size-[5px] rounded-full ${dot} shrink-0`} aria-hidden="true" />
                {label}
              </dt>
              <dd className="text-[11px] tabular-nums text-[#666] font-medium">
                {value}
                <span className="text-[9px] text-[#3A3A3A] ml-1.5">{count}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Project health */}
      <section aria-label="Project health" className="space-y-3">
        <SectionHead label="Project Health" />
        <SegBar segments={[
          { pct: activePct,   color: 'bg-[var(--space-accent)]/50', label: 'Active' },
          { pct: pendProjPct, color: 'bg-amber-500/40',             label: 'Pending' },
          { pct: donePct,     color: 'bg-[#333]',                   label: 'Completed' },
        ]} />
        <dl className="space-y-1.5">
          {[
            { dot: 'bg-[var(--space-accent)]/50', label: 'Active',    value: projectStatus.active },
            { dot: 'bg-amber-500/40',              label: 'Pending',   value: projectStatus.pending },
            { dot: 'bg-[#333]',                   label: 'Completed', value: projectStatus.completed },
          ].map(({ dot, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-[11px] text-[#4A4A4A]">
                <span className={`size-[5px] rounded-full ${dot} shrink-0`} aria-hidden="true" />
                {label}
              </dt>
              <dd className="text-[11px] tabular-nums text-[#666] font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

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
  const [mounted, setMounted] = useState(false)
  const triggerRef   = useRef<HTMLButtonElement>(null)
  const closeRef     = useRef<HTMLButtonElement>(null)
  const panelId      = 'analytics-sidebar-panel'
  const titleId      = 'analytics-sidebar-title'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (externalOpen === true) setOpen(true)
  }, [externalOpen])

  // Focus close button when panel opens; restore trigger on close
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => closeRef.current?.focus())
      return () => cancelAnimationFrame(id)
    } else {
      triggerRef.current?.focus()
    }
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setOpen(false)
    onOpenChange?.(false)
  }, [onOpenChange])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    onOpenChange?.(next)
  }

  const pendingCount = (allOrders ?? []).filter((o: any) => o.status === 'pending').length

  const portal = (
    <>
      {/* ── Trigger tab ────────────────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-label={`${open ? 'Close' : 'Open'} analytics panel${pendingCount > 0 ? `, ${pendingCount} pending invoice${pendingCount !== 1 ? 's' : ''}` : ''}`}
        className={[
          'fixed right-0 top-1/2 -translate-y-1/2 z-[60]',
          'flex flex-col items-center gap-2.5',
          'pl-3 pr-2.5 py-5',
          'rounded-l-2xl border border-r-0',
          'transition-all duration-300 group',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--space-accent)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-black',
          open
            ? 'bg-[#111] border-[#262626]'
            : 'bg-[#0A0A0A] border-[#1A1A1A] hover:bg-[#111] hover:border-[#242424]',
        ].join(' ')}
      >
        {/* Amber pulse ring when pending */}
        {pendingCount > 0 && !open && (
          <span className="relative flex size-2 -mb-0.5">
            <span className="animate-ping absolute inline-flex size-full rounded-full bg-amber-400 opacity-40" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-400/80" />
          </span>
        )}

        <TrendingUp
          aria-hidden="true"
          className={[
            'size-3.5 transition-colors duration-200',
            open
              ? 'text-[var(--space-accent)]'
              : 'text-[#404040] group-hover:text-[var(--space-accent)]/70',
          ].join(' ')}
        />

        <span
          aria-hidden="true"
          className={[
            'text-[8px] font-bold uppercase tracking-[0.22em] transition-colors duration-200',
            '[writing-mode:vertical-rl] rotate-180',
            open
              ? 'text-[var(--space-accent)]/70'
              : 'text-[#333] group-hover:text-[#555]',
          ].join(' ')}
        >
          Analytics
        </span>

        {pendingCount > 0 && (
          <span
            aria-hidden="true"
            className="text-[9px] font-bold tabular-nums text-amber-400/60"
          >
            {pendingCount}
          </span>
        )}
      </button>

      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        role="presentation"
        className={[
          'fixed inset-0 z-[65]',
          'bg-black/60 backdrop-blur-[2px]',
          'transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={handleClose}
      />

      {/* ── Desktop panel ─────────────────────────────────────────────────── */}
      <aside
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
        className={[
          'hidden md:flex fixed top-[65px] right-0 bottom-0 z-[70]',
          'w-[340px] xl:w-[380px] flex-col',
          'bg-[#080808] border-l border-[#1C1C1C]',
          'transition-transform duration-300 ease-[cubic-bezier(0.25,0,0.3,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Accent line at top */}
        <div
          aria-hidden="true"
          className="h-[2px] w-full shrink-0"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(139,156,182,0.35) 40%, rgba(139,156,182,0.12) 100%)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#141414] shrink-0">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="size-7 rounded-lg bg-[var(--space-accent)]/[0.08] border border-[var(--space-accent)]/15 flex items-center justify-center"
            >
              <TrendingUp className="size-3.5 text-[var(--space-accent)]/70" />
            </div>
            <div>
              <h2 id={titleId} className="text-[13px] font-semibold text-[#E0E0E0] leading-none">Analytics</h2>
              <p className="text-[9px] text-[#383838] mt-1 uppercase tracking-[0.18em]">
                Last 30 days{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={handleClose}
            aria-label="Close analytics panel"
            className="size-8 flex items-center justify-center rounded-lg text-[#383838] hover:text-[#888] hover:bg-[#141414] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]/40"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto px-6 pt-6"
          style={{ scrollbarWidth: 'none' }}
          tabIndex={-1}
        >
          <SidebarContent {...props} allOrders={allOrders} />
        </div>
      </aside>

      {/* ── Mobile bottom sheet ────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${titleId}-mobile`}
        aria-hidden={!open}
        className={[
          'md:hidden fixed bottom-0 left-0 right-0 z-[70]',
          'flex flex-col',
          'bg-[#080808] border-t border-[#1C1C1C] rounded-t-2xl',
          'transition-transform duration-300 ease-[cubic-bezier(0.25,0,0.3,1)]',
          open ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ maxHeight: '85vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-4 pb-1 shrink-0" aria-hidden="true">
          <div className="w-8 h-[3px] rounded-full bg-[#222]" />
        </div>

        {/* Accent line */}
        <div aria-hidden="true" className="h-[1px] mx-6 mb-1 shrink-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(139,156,182,0.25), transparent)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#141414] shrink-0">
          <div className="flex items-center gap-3">
            <div aria-hidden="true" className="size-7 rounded-lg bg-[var(--space-accent)]/[0.08] border border-[var(--space-accent)]/15 flex items-center justify-center">
              <TrendingUp className="size-3.5 text-[var(--space-accent)]/70" />
            </div>
            <div>
              <h2 id={`${titleId}-mobile`} className="text-[13px] font-semibold text-[#E0E0E0] leading-none">Analytics</h2>
              <p className="text-[9px] text-[#383838] mt-1 uppercase tracking-[0.18em]">
                Last 30 days{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close analytics panel"
            className="size-8 flex items-center justify-center rounded-lg text-[#383838] hover:text-[#888] hover:bg-[#141414] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]/40"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div
          className="overflow-y-auto px-6 pb-12 pt-5"
          style={{ overscrollBehavior: 'contain', scrollbarWidth: 'none' }}
        >
          <SidebarContent {...props} allOrders={allOrders} />
        </div>
      </div>
    </>
  )

  if (!mounted) return null
  return createPortal(portal, document.body)
}
