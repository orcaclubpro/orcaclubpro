'use client'

import { useMemo } from 'react'
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
const CX = 96
const CY = 96
const R  = 72   // circle radius
const SW = 26   // stroke (ring) width
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

// ── Component ─────────────────────────────────────────────────────────────────

export function RevenueChart({
  allOrders,
  range,
}: {
  allOrders: any[]
  range: Range
}) {
  const d = useMemo(() => {
    const since = Date.now() - RANGE_DAYS[range] * 86_400_000
    const inRange = allOrders.filter((o: any) => new Date(o.createdAt ?? 0).getTime() > since)

    const paid       = inRange.filter((o: any) => o.status === 'paid')
    const pending    = inRange.filter((o: any) => o.status === 'pending')
    const cancelled  = inRange.filter((o: any) => o.status === 'cancelled')

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
  }, [allOrders, range])

  const paidFrac     = d.total > 0 ? d.paidAmt     / d.total : 0
  const pendingFrac  = d.total > 0 ? d.pendingAmt   / d.total : 0

  return (
    <div className="rounded-xl border border-white/[0.10] bg-[#0a0a0a] overflow-hidden">
      <div className="flex items-center gap-6 sm:gap-10 px-6 sm:px-8 py-6 sm:py-7">

        {/* ── Donut SVG ───────────────────────────────────────────────────── */}
        <div className="relative shrink-0" style={{ width: CX * 2, height: CY * 2 }}>
          <svg width={CX * 2} height={CY * 2}>
            <defs>
              <linearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#67e8f9" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.85" />
              </linearGradient>
            </defs>

            {/* Background track */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={SW}
            />

            {d.total === 0 ? (
              /* Empty state — gradient blue full ring */
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke="url(#emptyGrad)"
                strokeWidth={SW}
                style={{ filter: 'drop-shadow(0 0 12px rgba(103,232,249,0.35))' }}
              />
            ) : (
              <>
                {/* Collected — cyan */}
                <Arc
                  value={d.paidAmt} total={d.total}
                  startFrac={0}
                  color="#67e8f9"
                  glow="rgba(103,232,249,0.4)"
                />
                {/* Pending — amber */}
                <Arc
                  value={d.pendingAmt} total={d.total}
                  startFrac={paidFrac}
                  color="#fbbf24"
                  glow="rgba(251,191,36,0.3)"
                />
                {/* Cancelled — muted red */}
                <Arc
                  value={d.cancelledAmt} total={d.total}
                  startFrac={paidFrac + pendingFrac}
                  color="rgba(248,113,113,0.45)"
                />
              </>
            )}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {d.total > 0 ? (
              <>
                <p className="text-[28px] font-black tabular-nums leading-none" style={{ color: '#67e8f9' }}>
                  {d.collectRate}%
                </p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mt-1.5">
                  collected
                </p>
              </>
            ) : (
              <p className="text-[10px] uppercase tracking-wider text-white/30">No data</p>
            )}
          </div>
        </div>

        {/* ── Breakdown ───────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] tracking-[0.3em] uppercase font-semibold text-white/40 mb-1">
            Revenue
          </p>
          <p className="text-[10px] text-white/25 mb-5">{RANGE_LABEL[range]}</p>

          <div className="space-y-3.5">

            {/* Collected */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="size-3 rounded-full shrink-0"
                  style={{ background: '#67e8f9', boxShadow: '0 0 8px rgba(103,232,249,0.55)' }}
                />
                <div>
                  <p className="text-[12px] font-medium text-white/70 leading-none">Collected</p>
                  {d.paidCt > 0 && (
                    <p className="text-[10px] text-white/25 mt-0.5">{d.paidCt} order{d.paidCt !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              <p className="text-[14px] font-bold tabular-nums shrink-0" style={{ color: '#67e8f9' }}>
                {fmt(d.paidAmt)}
              </p>
            </div>

            {/* Pending */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="size-3 rounded-full shrink-0 bg-amber-400"
                  style={{ boxShadow: '0 0 7px rgba(251,191,36,0.45)' }}
                />
                <div>
                  <p className="text-[12px] font-medium text-white/70 leading-none">Pending</p>
                  {d.pendingCt > 0 && (
                    <p className="text-[10px] text-white/25 mt-0.5">{d.pendingCt} order{d.pendingCt !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              <p className="text-[14px] font-bold text-amber-400 tabular-nums shrink-0">
                {fmt(d.pendingAmt)}
              </p>
            </div>

            {/* Cancelled — only show if non-zero */}
            {d.cancelledAmt > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full shrink-0" style={{ background: 'rgba(248,113,113,0.45)' }} />
                  <div>
                    <p className="text-[12px] font-medium text-white/40 leading-none">Cancelled</p>
                    {d.cancelledCt > 0 && (
                      <p className="text-[10px] text-white/20 mt-0.5">{d.cancelledCt} order{d.cancelledCt !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
                <p className="text-[14px] font-medium text-red-400/50 tabular-nums shrink-0">
                  {fmt(d.cancelledAmt)}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="pt-3.5 border-t border-white/[0.07] flex items-center justify-between gap-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Pipeline</p>
              <p className="text-[18px] font-black text-white tabular-nums">{fmt(d.total)}</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
