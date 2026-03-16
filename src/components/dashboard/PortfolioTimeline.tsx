'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Settings2, Minus, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SerializedProject } from './ProjectsCarousel'

export type Range = 'week' | 'month' | 'year'

// ── 8 distinct project accent colors ──────────────────────────────────────────
const PROJECT_COLORS = [
  { hex: '#67e8f9', rgb: '103,232,249' }, // cyan
  { hex: '#a78bfa', rgb: '167,139,250' }, // violet
  { hex: '#fb923c', rgb: '251,146,60'  }, // orange
  { hex: '#4ade80', rgb:  '74,222,128' }, // green
  { hex: '#f472b6', rgb: '244,114,182' }, // pink
  { hex: '#60a5fa', rgb:  '96,165,250' }, // blue
  { hex: '#facc15', rgb: '250,204,21'  }, // yellow
  { hex: '#f87171', rgb: '248,113,113' }, // red
] as const

type ProjectColor = (typeof PROJECT_COLORS)[number]

function rgba(c: ProjectColor, alpha: number) {
  return `rgba(${c.rgb},${alpha})`
}

// ── Order status colors ────────────────────────────────────────────────────────
const ORDER_COLORS = {
  pending:   { hex: '#fbbf24', rgb: '251,191,36'  },
  paid:      { hex: '#4ade80', rgb: '74,222,128'  },
  cancelled: { hex: '#f87171', rgb: '248,113,113' },
} as const

// ── Range config ───────────────────────────────────────────────────────────────
export const RANGE_CFG = {
  week:  { back: 3,  forward: 11,  pxPerDay: 58, label: 'Week'  },
  month: { back: 10, forward: 50,  pxPerDay: 14, label: 'Month' },
  year:  { back: 90, forward: 275, pxPerDay: 3,  label: 'Year'  },
} as const satisfies Record<Range, { back: number; forward: number; pxPerDay: number; label: string }>

// ── Layout constants ───────────────────────────────────────────────────────────
const LEFT_W       = 156
const HDR_H        = 40
const ROW_H        = 44
const BAND_Y       = 13
const BAND_H       = 16
const MIL_CY       = ROW_H / 2
const ORDERS_ROW_H = 56
const MORE_ROW_H   = 30

// ── Tick formatters ────────────────────────────────────────────────────────────
function fmtTick(d: Date, range: Range): string {
  if (range === 'week') {
    const wd = d.toLocaleDateString('en-US', { weekday: 'short' })
    return `${wd} ${d.getDate()}`
  }
  if (range === 'month') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    ...(d.getMonth() === 0 ? { year: '2-digit' } : {}),
  })
}

function fmtMilDate(d: string | null | undefined): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${s} → ${e}`
}

const SPRINT_STATUS_COLOR: Record<string, string> = {
  'in-progress': '#1E3A6E',
  delayed:       '#fb923c',
  finished:      '#4ade80',
  pending:       '#9ca3af',
}

const SPRINT_STATUS_LABEL: Record<string, string> = {
  'in-progress': 'In Progress',
  delayed:       'Delayed',
  finished:      'Finished',
  pending:       'Pending',
}

// ── Tooltip ────────────────────────────────────────────────────────────────────
type TooltipState = { lines: string[]; x: number; y: number } | null

// ── Component ─────────────────────────────────────────────────────────────────

export function PortfolioTimeline({
  projects: allProjects,
  allOrders,
  username,
  externalRange,
  onRangeChange,
}: {
  projects: SerializedProject[]
  allOrders: any[]
  username: string
  externalRange?: Range
  onRangeChange?: (r: Range) => void
}) {
  const [internalRange, setInternalRange] = useState<Range>('week')
  const range = externalRange ?? internalRange
  const handleRangeChange = (r: Range) => { setInternalRange(r); onRangeChange?.(r) }

  const [projectLimit, setProjectLimit] = useState(5)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const showTooltip = (e: React.MouseEvent, lines: string[]) => {
    setTooltip({ lines, x: e.clientX, y: e.clientY })
  }
  const hideTooltip = () => setTooltip(null)

  const cfg = RANGE_CFG[range]
  const totalDays    = cfg.back + cfg.forward
  const timelineWidth = Math.max(500, totalDays * cfg.pxPerDay)

  const todayMs = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime()
  }, [])

  const windowStart = todayMs - cfg.back * 86_400_000
  const windowEnd   = todayMs + cfg.forward * 86_400_000
  const todayPx     = ((Date.now() - windowStart) / (windowEnd - windowStart)) * timelineWidth

  function toPx(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null
    const t = new Date(dateStr).getTime()
    const px = ((t - windowStart) / (windowEnd - windowStart)) * timelineWidth
    if (px < -20 || px > timelineWidth + 20) return null
    return px
  }

  const projects = useMemo(() =>
    [...allProjects]
      .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
      .slice(0, projectLimit),
    [allProjects, projectLimit]
  )
  const hiddenCount = Math.max(0, allProjects.length - projectLimit)

  const ordersInView = useMemo(() =>
    allOrders.filter((o: any) => {
      const t = new Date(o.dueDate ?? o.createdAt).getTime()
      return t >= windowStart - 86_400_000 && t <= windowEnd + 86_400_000
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [allOrders, range])

  const ticks = useMemo<{ label: string; px: number; major: boolean }[]>(() => {
    const result: { label: string; px: number; major: boolean }[] = []
    if (range === 'week') {
      const cursor = new Date(windowStart); cursor.setHours(0, 0, 0, 0)
      while (cursor.getTime() <= windowEnd) {
        const px = ((cursor.getTime() - windowStart) / (windowEnd - windowStart)) * timelineWidth
        result.push({ label: fmtTick(new Date(cursor), range), px, major: cursor.getDay() === 1 })
        cursor.setDate(cursor.getDate() + 1)
      }
    } else if (range === 'month') {
      const cursor = new Date(windowStart); cursor.setHours(0, 0, 0, 0)
      const dow = cursor.getDay()
      cursor.setDate(cursor.getDate() - (dow === 0 ? 6 : dow - 1))
      while (cursor.getTime() <= windowEnd) {
        const px = ((cursor.getTime() - windowStart) / (windowEnd - windowStart)) * timelineWidth
        if (cursor.getTime() >= windowStart - 86_400_000)
          result.push({ label: fmtTick(new Date(cursor), range), px, major: cursor.getDate() <= 7 })
        cursor.setDate(cursor.getDate() + 7)
      }
    } else {
      const cursor = new Date(new Date(windowStart).getFullYear(), new Date(windowStart).getMonth(), 1)
      while (cursor.getTime() <= windowEnd) {
        const px = ((cursor.getTime() - windowStart) / (windowEnd - windowStart)) * timelineWidth
        if (px >= 0)
          result.push({ label: fmtTick(new Date(cursor), range), px, major: cursor.getMonth() === 0 })
        cursor.setMonth(cursor.getMonth() + 1)
      }
    }
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Position today at ~40% from visible left so it's clearly "current"
    el.scrollLeft = Math.max(0, todayPx - (el.clientWidth - LEFT_W) * 0.40)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  if (allProjects.length === 0) return null

  return (
    <div className="space-y-3">

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#6B6B6B] font-semibold">
            Portfolio Timeline
          </p>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">
            {projects.length} of {allProjects.length} project{allProjects.length !== 1 ? 's' : ''} · sprints, milestones &amp; orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[#404040] text-[#6B6B6B] hover:text-[#A0A0A0] transition-colors"
            title="Timeline settings"
          >
            <Settings2 className="size-3.5" />
          </button>
          {/* Show own picker only when not controlled externally */}
          {!externalRange && (
            <div className="flex items-center p-1 bg-[rgba(255,255,255,0.06)] rounded-lg border border-[#404040]">
              {(['week', 'month', 'year'] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150',
                    range === r ? 'bg-[rgba(255,255,255,0.06)] text-[#F0F0F0] shadow-sm' : 'text-[#6B6B6B] hover:text-[#A0A0A0]',
                  )}
                >
                  {RANGE_CFG[r].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline card ────────────────────────────────────────────────── */}
      <div className="relative rounded-xl border border-[#404040] bg-[#252525] overflow-hidden">

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#333333] to-transparent pointer-events-none" />

        <svg width="60" height="60" viewBox="0 0 60 60" fill="none"
          className="absolute top-0 right-0 opacity-[0.04] pointer-events-none select-none" aria-hidden="true">
          <path d="M60 0 L60 60 L0 60" stroke="#333333" strokeWidth="1" />
        </svg>

        <div
          ref={scrollRef}
          data-h-scroll
          className="overflow-x-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
        >
          <div style={{ width: LEFT_W + timelineWidth, minWidth: '100%' }}>

            {/* ── Header row ─────────────────────────────────────────────── */}
            <div className="flex border-b border-[#404040]" style={{ height: HDR_H }}>
              <div
                className="sticky left-0 z-30 bg-[#252525] border-r border-[#404040] shrink-0 flex items-end px-4 pb-2"
                style={{ width: LEFT_W, minWidth: LEFT_W }}
              >
                <p className="text-[9px] tracking-[0.3em] uppercase text-[#6B6B6B]">Project</p>
              </div>
              <div className="relative" style={{ width: timelineWidth }}>
                {ticks.map((tick, i) => (
                  <div key={i} className="absolute top-0 bottom-0" style={{ left: tick.px }}>
                    <p
                      className={cn(
                        'absolute top-2 whitespace-nowrap leading-none',
                        range === 'week' ? 'text-[9px]' : 'text-[8px]',
                        tick.major ? 'text-[#A0A0A0]' : 'text-[#6B6B6B]',
                      )}
                      style={{ transform: 'translateX(-50%)' }}
                    >
                      {tick.label}
                    </p>
                    <div className={cn('absolute bottom-0 w-px', tick.major ? 'h-3 bg-[#404040]/30' : 'h-2 bg-[#333333]')} />
                  </div>
                ))}
                {todayPx >= 0 && todayPx <= timelineWidth && (
                  <div className="absolute top-0 bottom-0 z-10" style={{ left: todayPx }}>
                    <p
                      className="absolute top-2 text-[8px] font-bold tracking-[0.2em] uppercase text-[rgba(139,156,182,0.90)] whitespace-nowrap leading-none"
                      style={{ transform: 'translateX(-50%)' }}
                    >
                      Now
                    </p>
                    <div className="absolute bottom-0 w-px h-5 bg-[rgba(139,156,182,0.70)]" />
                  </div>
                )}
              </div>
            </div>

            {/* ── Project rows ───────────────────────────────────────────── */}
            {projects.map((project, idx) => {
              const color = PROJECT_COLORS[idx % PROJECT_COLORS.length]
              const sprintsInView = project.sprints.filter((s) =>
                new Date(s.startDate).getTime() < windowEnd && new Date(s.endDate).getTime() > windowStart
              )
              const milestonesInView = project.milestones.filter((m) => {
                if (!m.date) return false
                const t = new Date(m.date).getTime()
                return t >= windowStart - 86_400_000 && t <= windowEnd + 86_400_000
              })

              return (
                <div
                  key={project.id}
                  className="flex border-b border-[#404040] last:border-b-0 group/row"
                  style={{ height: ROW_H }}
                >
                  {/* Sticky label */}
                  <div
                    className="sticky left-0 z-20 bg-[#252525] border-r border-[#404040] shrink-0 flex items-center gap-2.5 px-4 group-hover/row:bg-[#2D2D2D] transition-colors"
                    style={{ width: LEFT_W, minWidth: LEFT_W }}
                  >
                    <div
                      className="size-2 rounded-full shrink-0"
                      style={{ background: color.hex, boxShadow: `0 0 6px ${rgba(color, 0.55)}` }}
                    />
                    <a
                      href={`/u/${username}/projects/${project.id}`}
                      className="text-[11px] text-[#A0A0A0] truncate hover:text-[#F0F0F0] transition-colors leading-snug font-medium"
                      title={project.name}
                    >
                      {project.name}
                    </a>
                  </div>

                  {/* Timeline lane */}
                  <div className="relative" style={{ width: timelineWidth, height: ROW_H }}>
                    <div
                      className="absolute left-0 right-0 h-px pointer-events-none"
                      style={{ top: ROW_H / 2, background: rgba(color, 0.12) }}
                    />
                    {todayPx >= 0 && todayPx <= timelineWidth && (
                      <div
                        className="absolute top-0 bottom-0 w-px z-10 pointer-events-none"
                        style={{ left: todayPx, background: 'rgba(139,156,182,0.10)' }}
                      />
                    )}

                    {/* Sprint bands */}
                    {sprintsInView.map((sprint) => {
                      const rawL = ((new Date(sprint.startDate).getTime() - windowStart) / (windowEnd - windowStart)) * timelineWidth
                      const rawR = ((new Date(sprint.endDate).getTime() - windowStart) / (windowEnd - windowStart)) * timelineWidth
                      const leftPx  = Math.max(0, rawL)
                      const rightPx = Math.min(timelineWidth, rawR)
                      const widthPx = Math.max(3, rightPx - leftPx)
                      const trimL   = rawL < 0
                      const trimR   = rawR > timelineWidth
                      const statusColor = SPRINT_STATUS_COLOR[sprint.status] ?? color.hex
                      const tooltipLines = [
                        sprint.name,
                        SPRINT_STATUS_LABEL[sprint.status] ?? sprint.status,
                        fmtDateRange(sprint.startDate, sprint.endDate),
                        sprint.totalTasksCount > 0
                          ? `${sprint.completedTasksCount}/${sprint.totalTasksCount} tasks`
                          : 'No tasks',
                      ]
                      return (
                        <div
                          key={sprint.id}
                          className="absolute cursor-default"
                          style={{
                            left:        leftPx,
                            width:       widthPx,
                            top:         BAND_Y,
                            height:      BAND_H,
                            background:  rgba(color, 0.28),
                            borderTop:   `2px solid ${color.hex}`,
                            borderLeft:  trimL ? 'none' : `1px solid ${rgba(color, 0.40)}`,
                            borderRight: trimR ? 'none' : `1px solid ${rgba(color, 0.40)}`,
                            borderRadius: `${trimL ? 0 : 3}px ${trimR ? 0 : 3}px ${trimR ? 0 : 3}px ${trimL ? 0 : 3}px`,
                          }}
                          onMouseEnter={(e) => showTooltip(e, tooltipLines)}
                          onMouseLeave={hideTooltip}
                        >
                          <div className="absolute top-1 left-1.5 size-1.5 rounded-full" style={{ background: statusColor }} />
                          {widthPx > 52 && (
                            <p className="absolute top-0.5 left-5 right-1 text-[8px] font-semibold truncate leading-tight" style={{ color: color.hex }}>
                              {sprint.name}
                            </p>
                          )}
                        </div>
                      )
                    })}

                    {/* Milestone diamonds */}
                    {milestonesInView.map((m, mi) => {
                      const px = toPx(m.date)
                      if (px === null) return null
                      const clampedPx = Math.max(3, Math.min(timelineWidth - 3, px))
                      const tooltipLines = [
                        m.title,
                        m.date ? fmtMilDate(m.date) : 'No date',
                        m.completed ? '✓ Completed' : 'Pending',
                        ...(m.description ? [m.description] : []),
                      ]
                      return (
                        <div
                          key={m.id || mi}
                          className="absolute z-20 cursor-default"
                          style={{
                            left:         clampedPx,
                            top:          MIL_CY,
                            transform:    'translate(-50%, -50%) rotate(45deg)',
                            width:        10,
                            height:       10,
                            background:   m.completed ? color.hex : 'rgba(242,240,235,0.9)',
                            border:       `2px solid ${color.hex}`,
                            borderRadius: 2,
                            boxShadow:    m.completed ? `0 0 10px ${rgba(color, 0.65)}` : `0 0 4px ${rgba(color, 0.3)}`,
                          }}
                          onMouseEnter={(e) => showTooltip(e, tooltipLines)}
                          onMouseLeave={hideTooltip}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* "N more" row */}
            {hiddenCount > 0 && (
              <div className="flex border-b border-[#404040]" style={{ height: MORE_ROW_H }}>
                <div
                  className="sticky left-0 z-20 bg-[#252525] border-r border-[#404040] shrink-0 flex items-center px-4"
                  style={{ width: LEFT_W, minWidth: LEFT_W }}
                >
                  <button onClick={() => setSettingsOpen(true)} className="text-[10px] text-[#6B6B6B] hover:text-[#A0A0A0] transition-colors">
                    +{hiddenCount} more project{hiddenCount !== 1 ? 's' : ''}
                  </button>
                </div>
                <div className="relative flex items-center" style={{ width: timelineWidth, height: MORE_ROW_H }}>
                  <div className="h-px w-full" style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 4px, transparent 4px, transparent 10px)' }} />
                </div>
              </div>
            )}

            {/* Orders row */}
            {allOrders.length > 0 && (
              <div className="flex border-t border-[#404040]" style={{ height: ORDERS_ROW_H }}>
                <div
                  className="sticky left-0 z-20 bg-[#252525] border-r border-[#404040] shrink-0 flex flex-col justify-center gap-0.5 px-4"
                  style={{ width: LEFT_W, minWidth: LEFT_W }}
                >
                  <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B6B6B]">Orders</p>
                  <p className="text-[8px] text-[#6B6B6B]">{allOrders.length} total</p>
                </div>
                <div className="relative" style={{ width: timelineWidth, height: ORDERS_ROW_H }}>
                  {todayPx >= 0 && todayPx <= timelineWidth && (
                    <div className="absolute top-0 bottom-0 w-px pointer-events-none" style={{ left: todayPx, background: 'rgba(139,156,182,0.10)' }} />
                  )}
                  {ordersInView.map((order: any, oi) => {
                    const px = toPx(order.dueDate ?? order.createdAt)
                    if (px === null) return null
                    const status = (order.status ?? 'pending') as keyof typeof ORDER_COLORS
                    const oColor = ORDER_COLORS[status] ?? ORDER_COLORS.pending
                    const amount = order.amount ?? 0
                    const maxH = ORDERS_ROW_H - 12
                    const barH = amount > 0 ? Math.min(maxH, 6 + Math.log10(amount + 1) * 9) : 6
                    const fmtAmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
                    const clientName = typeof order.clientAccount === 'object' ? (order.clientAccount?.name ?? '') : ''
                    return (
                      <div
                        key={order.id ?? oi}
                        className="absolute cursor-default"
                        style={{
                          left:         px - 3,
                          bottom:       6,
                          width:        6,
                          height:       barH,
                          background:   `rgba(${oColor.rgb},0.8)`,
                          borderRadius: '2px 2px 1px 1px',
                          boxShadow:    `0 0 6px rgba(${oColor.rgb},0.4)`,
                        }}
                        onMouseEnter={(e) => showTooltip(e, [
                          order.orderNumber ?? 'Order',
                          `${status.charAt(0).toUpperCase() + status.slice(1)} · ${fmtAmt}`,
                          ...(clientName ? [clientName] : []),
                        ])}
                        onMouseLeave={hideTooltip}
                      />
                    )
                  })}
                  <div className="absolute left-0 right-0 h-px" style={{ bottom: 6, background: 'rgba(255,255,255,0.06)' }} />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-t border-[#404040] space-y-3">
          <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-5 rounded-sm shrink-0" style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderTop: '2px solid rgba(255,255,255,0.10)' }} />
              <span className="text-[9px] text-[#6B6B6B] uppercase tracking-wider">Sprint</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="shrink-0" style={{ width: 9, height: 9, background: 'rgba(255,255,255,0.12)', transform: 'rotate(45deg)', borderRadius: 2 }} />
              <span className="text-[9px] text-[#6B6B6B] uppercase tracking-wider">Milestone ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="shrink-0" style={{ width: 9, height: 9, border: '2px solid rgba(255,255,255,0.10)', transform: 'rotate(45deg)', borderRadius: 2 }} />
              <span className="text-[9px] text-[#6B6B6B] uppercase tracking-wider">Milestone</span>
            </div>
            {allOrders.length > 0 && (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 rounded-sm" style={{ height: 12, background: 'rgba(251,191,36,0.8)' }} />
                  <span className="text-[9px] text-[#6B6B6B] uppercase tracking-wider">Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 rounded-sm" style={{ height: 12, background: 'rgba(74,222,128,0.8)' }} />
                  <span className="text-[9px] text-[#6B6B6B] uppercase tracking-wider">Paid</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <div className="w-px h-3 bg-[rgba(139,156,182,0.70)]" />
              <span className="text-[9px] text-[#6B6B6B] uppercase tracking-wider">Today</span>
            </div>
          </div>

          {projects.length > 1 && (
            <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5 pt-2 border-t border-[#404040]">
              {projects.map((p, i) => {
                const c = PROJECT_COLORS[i % PROJECT_COLORS.length]
                return (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-sm shrink-0" style={{ background: c.hex }} />
                    <span className="text-[9px] text-[#6B6B6B] truncate max-w-[100px]">{p.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Settings modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-[#252525] border border-[#404040] text-[#F0F0F0] max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[13px] font-semibold text-[#A0A0A0] tracking-wide">
              Timeline Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-1">
            <div>
              <p className="text-[10px] text-[#6B6B6B] uppercase tracking-[0.25em] mb-4">Projects shown</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setProjectLimit(l => Math.max(1, l - 1))}
                  className="size-9 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[#404040] text-[#6B6B6B] hover:text-[#F0F0F0] hover:bg-[rgba(255,255,255,0.06)] flex items-center justify-center transition-colors"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="text-3xl font-bold tabular-nums text-[#F0F0F0] w-8 text-center">{projectLimit}</span>
                <button
                  onClick={() => setProjectLimit(l => Math.min(allProjects.length || 20, l + 1))}
                  className="size-9 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[#404040] text-[#6B6B6B] hover:text-[#F0F0F0] hover:bg-[rgba(255,255,255,0.06)] flex items-center justify-center transition-colors"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-[#6B6B6B] mt-3">
                {allProjects.length} total · sorted by most recently edited
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating tooltip — fixed so it escapes overflow:hidden */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 8, transform: 'translateY(-100%)' }}
        >
          <div className="bg-[#252525] border border-[#404040] rounded-lg px-3 py-2.5 shadow-2xl space-y-0.5 max-w-[220px]">
            {tooltip.lines.map((l, i) => (
              <p
                key={i}
                className={cn(
                  'text-[10px] whitespace-nowrap',
                  i === 0 ? 'text-[#F0F0F0] font-semibold' : 'text-[#6B6B6B]',
                )}
              >
                {l}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
