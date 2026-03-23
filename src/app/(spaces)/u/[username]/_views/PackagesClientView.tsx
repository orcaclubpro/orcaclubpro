'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft, ChevronRight, Check,
  Sparkles, CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

interface LineItem {
  name: string
  description?: string | null
  price: number
  adjustedPrice?: number | null
  quantity?: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

interface ScheduledEntry {
  id: string
  label: string
  amount: number
  dueDate?: string | null
  orderId?: string | null
}

interface PackageDoc {
  id: string
  name: string
  description?: string | null
  coverMessage?: string | null
  lineItems?: LineItem[]
  paymentSchedule?: ScheduledEntry[]
  status?: string
}

interface PackagesClientViewProps {
  clientPackages: PackageDoc[]
  username: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function computeTotals(lineItems: LineItem[] = []) {
  let oneTime = 0, monthly = 0, annual = 0
  for (const item of lineItems) {
    const total = (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1)
    if (item.isRecurring) {
      if (item.recurringInterval === 'year') annual += total
      else monthly += total
    } else {
      oneTime += total
    }
  }
  return { oneTime, monthly, annual }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return ''
  const parts = isoDate.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return ''
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d)
  if (!isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function statusStyle(status?: string) {
  switch (status) {
    case 'accepted': return 'text-emerald-400 border-emerald-400/25 bg-emerald-400/10'
    case 'sent':     return 'text-[var(--space-accent)] border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.10)]'
    default:         return 'text-[#4A4A4A] border-[#404040] bg-[rgba(255,255,255,0.02)]'
  }
}

// ── Package Detail Modal ────────────────────────────────────────────────────────

function PackageModal({
  pkg,
  username,
  onClose,
}: {
  pkg: PackageDoc
  username: string
  onClose: () => void
}) {
  const lineItems = pkg.lineItems ?? []
  const schedule = pkg.paymentSchedule ?? []
  const { oneTime, monthly, annual } = computeTotals(lineItems)
  const scheduleTotal = schedule.reduce((s, e) => s + e.amount, 0)

  // ESC close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const hasPricing = oneTime > 0 || monthly > 0 || annual > 0

  return (
    /* ── Single overlay div that IS the constraint ── */
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
    >
      {/* Tap-backdrop to close (only visible area outside panel) */}
      <div className="absolute inset-0" onClick={onClose} />

      {/*
        Panel:
        • Mobile  — sits at bottom, max 96dvh tall (leaves a tiny gap at top so user can tap-dismiss)
        • Desktop — centered card, 700px wide, max 82vh
        `overflow-hidden` + explicit height constraints = flex children (flex-1) actually constrain
      */}
      <div
        className={cn(
          'relative z-10 flex flex-col w-full overflow-hidden',
          'rounded-t-3xl sm:rounded-2xl',
          'border-t border-x border-white/[0.07] sm:border',
          // height constraints — the only source of truth
          'max-h-[96dvh] sm:max-h-[82vh] sm:max-w-[700px]',
        )}
        style={{ background: '#111111' }}
      >
        {/* ── CYAN ACCENT LINE ── */}
        <div className="shrink-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(103,232,249,0.4),transparent)' }} />

        {/* ── HEADER BAR ── */}
        <div
          className="shrink-0 flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]"
          style={{ paddingTop: 'max(0.875rem, env(safe-area-inset-top))' }}
        >
          <button
            onClick={onClose}
            className="flex items-center justify-center size-8 rounded-lg transition-all active:scale-90 shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
            aria-label="Close"
          >
            <ChevronLeft className="size-4 text-white/50" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-semibold tracking-[0.28em] uppercase text-white/30">Service Package</p>
            <h2 className="text-sm font-semibold text-white/85 truncate leading-tight">{pkg.name}</h2>
          </div>

          {pkg.status === 'accepted' && (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
              style={{ color: '#4ade80', background: 'rgba(74,222,128,0.09)', border: '1px solid rgba(74,222,128,0.18)' }}
            >Accepted</span>
          )}
        </div>

        {/* ── BODY: single column mobile / two-column desktop ── */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row min-h-0">

          {/* ── LEFT COLUMN — identity + pricing (sticky on desktop) ── */}
          <div
            className={cn(
              'shrink-0 flex flex-col gap-4 px-5 py-5',
              'border-b sm:border-b-0 sm:border-r border-white/[0.06]',
              // mobile: compact horizontal strip; desktop: fixed-width sidebar
              'sm:w-[240px] sm:overflow-y-auto',
            )}
            style={{ background: 'rgba(103,232,249,0.015)' }}
          >
            {/* Pricing hero */}
            {hasPricing && (
              <div>
                {oneTime > 0 && (
                  <div className="mb-3">
                    <p
                      className="font-bold leading-none tabular-nums"
                      style={{ fontSize: 'clamp(28px, 5vw, 36px)', color: '#F5F5F5', letterSpacing: '-0.02em' }}
                    >
                      {fmt(oneTime)}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mt-1.5">one-time</p>
                  </div>
                )}
                {monthly > 0 && (
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: '#F5F5F5', letterSpacing: '-0.02em' }}>{fmt(monthly)}</p>
                      <span className="text-sm text-white/25">/mo</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mt-1.5">monthly</p>
                  </div>
                )}
                {annual > 0 && (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: '#F5F5F5', letterSpacing: '-0.02em' }}>{fmt(annual)}</p>
                      <span className="text-sm text-white/25">/yr</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mt-1.5">annually</p>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {pkg.description && (
              <p className="text-[12px] text-white/35 leading-relaxed">{pkg.description}</p>
            )}

            {/* Cover message */}
            {pkg.coverMessage && (
              <div className="rounded-xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '2px solid rgba(103,232,249,0.2)' }}>
                <p className="text-[12px] text-white/40 leading-relaxed whitespace-pre-wrap">{pkg.coverMessage}</p>
              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN — scrollable details ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-w-0">

            {/* What's Included */}
            {lineItems.length > 0 && (
              <div className="px-5 py-5 border-b border-white/[0.05]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-white/25">Included</span>
                  <span className="text-[9px] font-semibold tabular-nums" style={{ color: 'rgba(103,232,249,0.6)' }}>
                    {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div>
                  {lineItems.map((item, i) => {
                    const qty = item.quantity ?? 1
                    const basePrice = item.price ?? 0
                    const adjustedTotal = (item.adjustedPrice ?? basePrice) * qty
                    const baseTotal = basePrice * qty
                    const hasDiscount = item.adjustedPrice != null && item.adjustedPrice !== basePrice
                    const isLast = i === lineItems.length - 1
                    return (
                      <div
                        key={i}
                        className={cn('flex items-start gap-3 py-3', !isLast && 'border-b border-white/[0.04]')}
                      >
                        <div
                          className="mt-0.5 size-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(103,232,249,0.07)', border: '1px solid rgba(103,232,249,0.15)' }}
                        >
                          <Check className="size-3" style={{ color: '#67e8f9' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-white/80 leading-snug">{item.name}</p>
                          {item.description && (
                            <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-0.5 pl-2">
                          {hasDiscount && (
                            <span className="text-[11px] text-white/20 line-through tabular-nums">{fmt(baseTotal)}</span>
                          )}
                          <span
                            className="text-[13px] font-semibold tabular-nums"
                            style={{ color: hasDiscount ? '#67e8f9' : 'rgba(255,255,255,0.7)' }}
                          >
                            {fmt(adjustedTotal)}
                            {item.isRecurring && (
                              <span className="text-[11px] font-normal text-white/25">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Payment Schedule */}
            {schedule.length > 0 && (
              <div className="px-5 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="size-3 text-white/20" />
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-white/25">Payment Schedule</span>
                </div>
                <div className="space-y-1.5">
                  {schedule.map((entry, i) => {
                    const isInvoiced = !!entry.orderId
                    return (
                      <div
                        key={entry.id ?? i}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                        style={{
                          background: isInvoiced ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isInvoiced ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)'}`,
                        }}
                      >
                        <div className="size-1.5 rounded-full shrink-0"
                          style={{ background: isInvoiced ? '#4ade80' : 'rgba(103,232,249,0.55)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-[13px] font-medium leading-snug', isInvoiced ? 'text-white/25' : 'text-white/60')}>
                            {entry.label}
                          </p>
                          {entry.dueDate && (
                            <p className="text-[10px] text-white/20 mt-0.5">Due {formatDisplayDate(entry.dueDate)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isInvoiced && (
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                              style={{ color: '#4ade80', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}
                            >Invoiced</span>
                          )}
                          <span className="text-[13px] font-semibold tabular-nums"
                            style={{ color: isInvoiced ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)' }}
                          >{fmt(entry.amount)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Total */}
                {scheduleTotal > 0 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">Total</span>
                    <span className="text-[15px] font-bold tabular-nums" style={{ color: 'rgba(255,255,255,0.8)' }}>{fmt(scheduleTotal)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {lineItems.length === 0 && schedule.length === 0 && (
              <div className="flex items-center justify-center px-6 py-12">
                <p className="text-[13px] text-white/25 text-center">Your team is still configuring this package.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          className="shrink-0 flex items-center gap-2.5 px-4 border-t border-white/[0.06]"
          style={{
            background: 'rgba(17,17,17,0.98)',
            paddingTop: '0.75rem',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all active:scale-95"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PackagesClientView({ clientPackages, username }: PackagesClientViewProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [modalPkg, setModalPkg] = useState<PackageDoc | null>(null)
  const total = clientPackages.length
  const containerRef = useRef<HTMLDivElement>(null)

  // Touch swipe on carousel
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchLocked = useRef<'h' | 'v' | null>(null)

  const goTo = (idx: number) => setActiveIdx(Math.max(0, Math.min(total - 1, idx)))

  // Keyboard nav (only when modal closed)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (modalPkg) return
      if (e.key === 'ArrowLeft') goTo(activeIdx - 1)
      if (e.key === 'ArrowRight') goTo(activeIdx + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIdx, modalPkg])

  // Touch on carousel container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      touchLocked.current = null
    }
    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current
      if (!touchLocked.current) {
        if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 8) touchLocked.current = 'h'
        else if (Math.abs(dy) > 8) touchLocked.current = 'v'
      }
      if (touchLocked.current === 'h') e.preventDefault()
    }
    const onEnd = (e: TouchEvent) => {
      if (touchLocked.current !== 'h') return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      if (dx < -40) goTo(activeIdx + 1)
      else if (dx > 40) goTo(activeIdx - 1)
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [activeIdx])

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (total === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <div className="text-center max-w-xs">
          <div className="inline-flex p-5 rounded-2xl bg-[#2D2D2D] border border-[#404040] mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,255,255,0.03)] to-transparent" />
            <Sparkles className="size-8 text-[#4A4A4A] relative z-10" />
          </div>
          <h3 className="text-lg font-semibold text-[#F0F0F0] mb-2">Your packages are on the way</h3>
          <p className="text-sm text-[#4A4A4A] leading-relaxed">
            Your team is curating custom service packages for you. They&apos;ll appear here once ready.
          </p>
        </div>
      </div>
    )
  }

  // ── Carousel ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col">

        {/* Header */}
        <div className="px-6 lg:px-10 pt-8 pb-6 flex items-end justify-between">
          <div>
            <p className="text-[9px] font-bold tracking-[0.32em] uppercase mb-1.5" style={{ color: 'var(--space-accent)' }}>
              Service Packages
            </p>
            <h2 className="text-xl font-bold text-[#F0F0F0] tracking-tight">Your Packages</h2>
          </div>
          {total > 1 && (
            <span className="text-sm font-mono text-[#A0A0A0] tabular-nums">
              {pad(activeIdx + 1)}<span className="text-[#4A4A4A] mx-1">/</span>{pad(total)}
            </span>
          )}
        </div>

        {/* ── Main carousel ────────────────────────────────────────────────── */}
        <div ref={containerRef} className="px-6 lg:px-10 overflow-hidden select-none">
          <div
            className="flex"
            style={{
              transform: `translateX(-${activeIdx * 100}%)`,
              transition: 'transform 420ms cubic-bezier(0.36, 0.66, 0.04, 1)',
            }}
          >
            {clientPackages.map((pkg, i) => {
              const { oneTime, monthly, annual } = computeTotals(pkg.lineItems ?? [])
              const lineItems = pkg.lineItems ?? []
              const isActive = i === activeIdx

              return (
                <div key={pkg.id} className="min-w-full">
                  <div
                    className={cn(
                      'relative rounded-2xl border overflow-hidden transition-all duration-500',
                      isActive ? 'border-[rgba(139,156,182,0.12)]' : 'border-[#404040]',
                    )}
                    style={{ background: '#252525' }}
                  >
                    {/* Top accent line */}
                    <div className={cn(
                      'h-px transition-all duration-700',
                      isActive
                        ? 'bg-gradient-to-r from-transparent via-[var(--space-accent)]/30 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-[#333333] to-transparent',
                    )} />

                    <div className="p-5 sm:p-8 lg:p-10">
                      {/* Eyebrow + status */}
                      <div className="flex items-center justify-between mb-5 lg:mb-8">
                        <p className="text-[9px] font-bold tracking-[0.32em] uppercase" style={{ color: 'var(--space-accent)' }}>
                          Service Package
                        </p>
                        {pkg.status && pkg.status !== 'draft' && (
                          <span className={cn(
                            'text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border',
                            statusStyle(pkg.status),
                          )}>
                            {pkg.status}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-bold text-[#F0F0F0] leading-tight tracking-tight mb-4">
                        {pkg.name}
                      </h3>

                      {pkg.description && (
                        <p className="text-sm text-[#6B6B6B] leading-relaxed mb-5 lg:mb-8 max-w-xl">
                          {pkg.description}
                        </p>
                      )}

                      {/* Pricing */}
                      {(oneTime > 0 || monthly > 0 || annual > 0) && (
                        <div className="flex items-end gap-8 flex-wrap mb-8">
                          {oneTime > 0 && (
                            <div>
                              <p className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] tabular-nums tracking-tight">{fmt(oneTime)}</p>
                              <p className="text-[9px] text-[#A0A0A0] mt-1.5 uppercase tracking-[0.2em]">one-time</p>
                            </div>
                          )}
                          {monthly > 0 && (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <p className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] tabular-nums tracking-tight">{fmt(monthly)}</p>
                                <p className="text-xl text-[#A0A0A0] font-normal">/mo</p>
                              </div>
                              <p className="text-[9px] text-[#A0A0A0] mt-1.5 uppercase tracking-[0.2em]">monthly</p>
                            </div>
                          )}
                          {annual > 0 && (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <p className="text-3xl sm:text-4xl font-bold text-[#F0F0F0] tabular-nums tracking-tight">{fmt(annual)}</p>
                                <p className="text-xl text-[#A0A0A0] font-normal">/yr</p>
                              </div>
                              <p className="text-[9px] text-[#A0A0A0] mt-1.5 uppercase tracking-[0.2em]">annually</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Services cluster */}
                      {lineItems.length > 0 && (
                        <div className="flex items-center gap-3 mb-6 lg:mb-9">
                          <div className="flex -space-x-1.5">
                            {Array.from({ length: Math.min(6, lineItems.length) }).map((_, j) => (
                              <div
                                key={j}
                                className="size-6 rounded-full bg-[rgba(139,156,182,0.06)] border-2 flex items-center justify-center"
                                style={{ borderColor: '#404040' }}
                              >
                                <Check className="size-3" style={{ color: 'var(--space-accent)' }} />
                              </div>
                            ))}
                            {lineItems.length > 6 && (
                              <div
                                className="size-6 rounded-full bg-[#2D2D2D] border-2 flex items-center justify-center"
                                style={{ borderColor: '#404040' }}
                              >
                                <span className="text-[9px] text-[#6B6B6B] font-bold">+{lineItems.length - 6}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-[#4A4A4A]">
                            {lineItems.length} service{lineItems.length !== 1 ? 's' : ''} included
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                        {/* View Details — primary action */}
                        <button
                          onClick={() => setModalPkg(pkg)}
                          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#2D2D2D] border border-[#404040] text-[#F0F0F0] hover:bg-[#E5E1D9] hover:border-[#404040] transition-all duration-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        {total > 1 && (
          <div className="flex items-center justify-between px-6 lg:px-10 pt-5 pb-2">
            {/* Arrow buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => goTo(activeIdx - 1)}
                disabled={activeIdx === 0}
                className={cn(
                  'size-9 rounded-xl border flex items-center justify-center transition-all duration-200',
                  activeIdx === 0
                    ? 'border-[#404040] text-[#4A4A4A] cursor-not-allowed'
                    : 'border-[#404040] text-[#6B6B6B] hover:border-[rgba(139,156,182,0.18)] hover:bg-[rgba(139,156,182,0.04)]',
                )}
                style={activeIdx !== 0 ? { } : {}}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => goTo(activeIdx + 1)}
                disabled={activeIdx === total - 1}
                className={cn(
                  'size-9 rounded-xl border flex items-center justify-center transition-all duration-200',
                  activeIdx === total - 1
                    ? 'border-[#404040] text-[#4A4A4A] cursor-not-allowed'
                    : 'border-[#404040] text-[#6B6B6B] hover:border-[rgba(139,156,182,0.18)] hover:bg-[rgba(139,156,182,0.04)]',
                )}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {clientPackages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === activeIdx
                      ? 'w-5 h-1.5'
                      : 'w-1.5 h-1.5 bg-[#333333] hover:bg-[#555555]',
                  )}
                  style={i === activeIdx ? { background: 'var(--space-accent)', width: '1.25rem', height: '0.375rem' } : {}}
                />
              ))}
            </div>

            {/* Spacer to balance arrows */}
            <div className="w-20" />
          </div>
        )}

        {/* ── Package selector strip ────────────────────────────────────────── */}
        {total > 1 && (
          <div className="px-6 lg:px-10 pt-4 pb-10">
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase text-[#1E3A6E] mb-3">
              All Packages
            </p>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
              {clientPackages.map((pkg, i) => {
                const { oneTime, monthly } = computeTotals(pkg.lineItems ?? [])
                const isActive = i === activeIdx
                return (
                  <button
                    key={pkg.id}
                    onClick={() => { goTo(i); setModalPkg(pkg) }}
                    className={cn(
                      'shrink-0 flex flex-col gap-1.5 p-3.5 rounded-xl border text-left transition-all duration-200',
                      isActive
                        ? 'border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)]'
                        : 'border-[#404040] bg-[#252525] hover:border-[#404040] hover:bg-[#2D2D2D]',
                    )}
                    style={{ minWidth: 150, maxWidth: 200 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[9px] font-bold tabular-nums', isActive ? '' : 'text-[#4A4A4A]')} style={isActive ? { color: 'var(--space-accent)', opacity: 0.6 } : {}}>
                        {pad(i + 1)}
                      </span>
                    </div>
                    <p className={cn('text-xs font-semibold leading-snug line-clamp-2', isActive ? 'text-[#F0F0F0]' : 'text-[#6B6B6B]')}>
                      {pkg.name}
                    </p>
                    {(oneTime > 0 || monthly > 0) && (
                      <p className={cn('text-xs font-mono tabular-nums')} style={isActive ? { color: 'var(--space-accent)' } : { color: '#4A4A4A' }}>
                        {oneTime > 0 ? fmt(oneTime) : `${fmt(monthly)}/mo`}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── Detail modal ─────────────────────────────────────────────────────── */}
      {modalPkg && (
        <PackageModal
          pkg={modalPkg}
          username={username}
          onClose={() => setModalPkg(null)}
        />
      )}
    </>
  )
}
