'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import type { Range } from './PortfolioTimeline'

// ── Range → lookback window ────────────────────────────────────────────────────
const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30, year: 365 }
const RANGE_LABEL: Record<Range, string> = {
  week:  'Last 7 days',
  month: 'Last 30 days',
  year:  'Last 365 days',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

// ── Donut geometry ─────────────────────────────────────────────────────────────
const CX = 82
const CY = 82
const R  = 61   // circle radius
const SW = 22   // stroke (ring) width
const C  = 2 * Math.PI * R
const GAP = 4   // visual gap between segments (px)

interface ArcProps {
  value:     number
  total:     number
  startFrac: number
  color:     string
  glow?:     string
}

function Arc({ value, total, startFrac, color, glow }: ArcProps) {
  if (!total || !value) return null
  const len = Math.max(0, (value / total) * C - GAP)
  if (len <= 0) return null
  return (
    <circle
      cx={CX} cy={CY} r={R}
      fill="none"
      stroke={color}
      strokeWidth={SW}
      strokeDasharray={`${len} ${C - len}`}
      strokeDashoffset={C * (1 - startFrac)}
      transform={`rotate(-90 ${CX} ${CY})`}
      style={glow ? { filter: `drop-shadow(0 0 10px ${glow})` } : undefined}
    />
  )
}

// ── Period delta helpers ───────────────────────────────────────────────────────

interface DeltaResult {
  pct: number | null  // null = no previous data
  isNew: boolean      // current > 0 but no previous
  isUp: boolean
}

function calcDelta(current: number, prev: number): DeltaResult {
  if (current === 0 && prev === 0) return { pct: null, isNew: false, isUp: false }
  if (prev === 0) return { pct: null, isNew: true, isUp: true }
  const pct = Math.round(((current - prev) / prev) * 100)
  return { pct, isNew: false, isUp: pct >= 0 }
}

function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  const { pct, isNew, isUp } = calcDelta(current, prev)

  if (isNew && current > 0) {
    return (
      <span className="text-[9px] font-semibold tracking-wide" style={{ color: 'var(--space-accent)' }}>
        new
      </span>
    )
  }
  if (pct === null) return null

  const Icon = pct === 0 ? Minus : isUp ? TrendingUp : TrendingDown
  const color = pct === 0
    ? 'rgba(255,255,255,0.08)'
    : isUp
      ? '#4ade80'
      : '#f87171'

  return (
    <span className="flex items-center gap-0.5" style={{ color }}>
      <Icon style={{ width: 9, height: 9 }} />
      <span className="text-[9px] font-semibold tabular-nums">
        {pct === 0 ? '—' : `${isUp ? '+' : ''}${pct}%`}
      </span>
    </span>
  )
}

// ── pp delta for collection rate ──────────────────────────────────────────────
function RateDelta({ current, prev }: { current: number; prev: number }) {
  if (prev === 0 && current === 0) return null
  const pp = current - prev
  if (pp === 0) return null
  const up = pp > 0
  return (
    <span
      className="text-[9px] font-semibold tabular-nums"
      style={{ color: up ? '#4ade80' : '#f87171' }}
    >
      {up ? '+' : ''}{pp}pp
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RevenueChart({
  allOrders,
  range,
  onInfo,
}: {
  allOrders: any[]
  range: Range
  onInfo?: () => void
}) {
  const now = Date.now()

  const { cur, prev } = useMemo(() => {
    const days  = RANGE_DAYS[range]
    const since     = now - days * 86_400_000
    const prevSince = since - days * 86_400_000

    function calc(orders: any[]) {
      const paid       = orders.filter((o: any) => o.status === 'paid')
      const pending    = orders.filter((o: any) => o.status === 'pending')
      const cancelled  = orders.filter((o: any) => o.status === 'cancelled')
      const paidAmt      = paid.reduce((s: number, o: any) => s + (o.amount || 0), 0)
      const pendingAmt   = pending.reduce((s: number, o: any) => s + (o.amount || 0), 0)
      const cancelledAmt = cancelled.reduce((s: number, o: any) => s + (o.amount || 0), 0)
      const total        = paidAmt + pendingAmt + cancelledAmt
      return {
        paidAmt, pendingAmt, cancelledAmt, total,
        paidCt:     paid.length,
        pendingCt:  pending.length,
        cancelledCt: cancelled.length,
        collectRate: total > 0 ? Math.round((paidAmt / total) * 100) : 0,
      }
    }

    const cur  = calc(allOrders.filter((o: any) => new Date(o.createdAt ?? 0).getTime() > since))
    const prev = calc(allOrders.filter((o: any) => {
      const t = new Date(o.createdAt ?? 0).getTime()
      return t > prevSince && t <= since
    }))

    return { cur, prev }
  }, [allOrders, range])

  const pendingCount = useMemo(
    () => allOrders.filter((o: any) => o.status === 'pending').length,
    [allOrders]
  )

  const paidFrac    = cur.total > 0 ? cur.paidAmt    / cur.total : 0
  const pendingFrac = cur.total > 0 ? cur.pendingAmt / cur.total : 0

  return (
    <div className="rounded-xl border border-[#404040] bg-[#252525] overflow-hidden relative">

      {/* ── Info button — opens projected revenue in analytics panel ──────── */}
      {onInfo && pendingCount > 0 && (
        <button
          onClick={onInfo}
          title={`${pendingCount} pending invoice${pendingCount !== 1 ? 's' : ''} · view projected revenue`}
          className="absolute top-3 right-3 z-10 flex items-center justify-center size-6 rounded-full border border-[#404040] text-amber-400/50 hover:border-amber-400/40 hover:text-amber-400/90 hover:bg-amber-400/[0.05] transition-all duration-150"
        >
          <Info className="size-3" />
        </button>
      )}

      {/* ── Chart ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 sm:gap-7 px-5 sm:px-6 py-5 sm:py-6">

          {/* Donut SVG */}
          <div className="relative shrink-0" style={{ width: CX * 2, height: CY * 2 }}>
            <svg width={CX * 2} height={CY * 2}>
              <defs>
                <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#1E3A6E" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* Background track */}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth={SW}
              />

              {cur.total === 0 ? (
                <circle
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke="url(#emptyGrad)"
                  strokeWidth={SW}
                  style={{ filter: 'drop-shadow(0 0 12px rgba(139,156,182,0.22))' }}
                />
              ) : (
                <>
                  <Arc value={cur.paidAmt}      total={cur.total} startFrac={0}                       color="#1E3A6E" glow="rgba(139,156,182,0.25)" />
                  <Arc value={cur.pendingAmt}    total={cur.total} startFrac={paidFrac}                color="#fbbf24" glow="rgba(251,191,36,0.3)" />
                  <Arc value={cur.cancelledAmt}  total={cur.total} startFrac={paidFrac + pendingFrac}  color="rgba(248,113,113,0.45)" />
                </>
              )}
            </svg>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {cur.total > 0 ? (
                <>
                  <p className="text-[28px] font-black tabular-nums leading-none" style={{ color: 'var(--space-accent)' }}>
                    {cur.collectRate}%
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#4A4A4A] mt-1">
                    collected
                  </p>
                  <div className="mt-1.5">
                    <RateDelta current={cur.collectRate} prev={prev.collectRate} />
                  </div>
                </>
              ) : (
                <p className="text-[10px] uppercase tracking-wider text-[#4A4A4A]">No data</p>
              )}
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] tracking-[0.3em] uppercase font-semibold text-[#6B6B6B] mb-1">
              Revenue
            </p>
            <p className="text-[10px] text-[#4A4A4A] mb-5">{RANGE_LABEL[range]}</p>

            <div className="space-y-3.5">

              {/* Collected */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="size-3 rounded-full shrink-0"
                    style={{ background: 'var(--space-accent)', boxShadow: '0 0 8px rgba(139,156,182,0.45)' }}
                  />
                  <div>
                    <p className="text-[12px] font-medium text-[#6B6B6B] leading-none">Collected</p>
                    {cur.paidCt > 0 && (
                      <p className="text-[10px] text-[#4A4A4A] mt-0.5">{cur.paidCt} order{cur.paidCt !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-bold tabular-nums leading-none" style={{ color: 'var(--space-accent)' }}>
                    {fmt(cur.paidAmt)}
                  </p>
                  <div className="flex justify-end mt-0.5">
                    <DeltaBadge current={cur.paidAmt} prev={prev.paidAmt} />
                  </div>
                </div>
              </div>

              {/* Pending */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="size-3 rounded-full shrink-0 bg-amber-400"
                    style={{ boxShadow: '0 0 7px rgba(251,191,36,0.45)' }}
                  />
                  <div>
                    <p className="text-[12px] font-medium text-[#6B6B6B] leading-none">Pending</p>
                    {cur.pendingCt > 0 && (
                      <p className="text-[10px] text-[#4A4A4A] mt-0.5">{cur.pendingCt} order{cur.pendingCt !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-bold text-amber-400 tabular-nums leading-none">
                    {fmt(cur.pendingAmt)}
                  </p>
                  <div className="flex justify-end mt-0.5">
                    <DeltaBadge current={cur.pendingAmt} prev={prev.pendingAmt} />
                  </div>
                </div>
              </div>

              {/* Cancelled — only show if non-zero */}
              {cur.cancelledAmt > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-3 rounded-full shrink-0" style={{ background: 'rgba(248,113,113,0.45)' }} />
                    <div>
                      <p className="text-[12px] font-medium text-[#4A4A4A] leading-none">Cancelled</p>
                      {cur.cancelledCt > 0 && (
                        <p className="text-[10px] text-[#4A4A4A] mt-0.5">{cur.cancelledCt} order{cur.cancelledCt !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-medium text-red-400/50 tabular-nums leading-none">
                      {fmt(cur.cancelledAmt)}
                    </p>
                    <div className="flex justify-end mt-0.5">
                      <DeltaBadge current={cur.cancelledAmt} prev={prev.cancelledAmt} />
                    </div>
                  </div>
                </div>
              )}

              {/* Pipeline total */}
              <div className="pt-3.5 border-t border-[#404040] flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#4A4A4A] leading-none">Pipeline</p>
                  {prev.total > 0 && (
                    <p className="text-[9px] text-[#4A4A4A] mt-0.5">
                      prev. {fmt(prev.total)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[18px] font-black text-[#F0F0F0] tabular-nums leading-none">{fmt(cur.total)}</p>
                  <div className="flex justify-end mt-0.5">
                    <DeltaBadge current={cur.total} prev={prev.total} />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
  )
}
