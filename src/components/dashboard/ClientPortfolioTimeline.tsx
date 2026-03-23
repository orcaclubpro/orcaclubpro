'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Settings2, Minus, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SerializedProject } from './ProjectsCarousel'
import type { Range } from './PortfolioTimeline'
import { RANGE_CFG } from './PortfolioTimeline'

// ── 8 client accent colors ─────────────────────────────────────────────────────
const CLIENT_COLORS = [
  { hex: '#67e8f9', rgb: '103,232,249' }, // cyan
  { hex: '#a78bfa', rgb: '167,139,250' }, // violet
  { hex: '#fb923c', rgb: '251,146,60'  }, // orange
  { hex: '#4ade80', rgb:  '74,222,128' }, // green
  { hex: '#f472b6', rgb: '244,114,182' }, // pink
  { hex: '#60a5fa', rgb:  '96,165,250' }, // blue
  { hex: '#facc15', rgb: '250,204,21'  }, // yellow
  { hex: '#f87171', rgb: '248,113,113' }, // red
] as const

type ClientColor = (typeof CLIENT_COLORS)[number]

function rgba(c: ClientColor, alpha: number) {
  return `rgba(${c.rgb},${alpha})`
}

const ORDER_COLORS = {
  pending:   { hex: '#fbbf24', rgb: '251,191,36'  },
  paid:      { hex: '#4ade80', rgb: '74,222,128'  },
  cancelled: { hex: '#f87171', rgb: '248,113,113' },
} as const

const LEFT_W_BASE = 168
const LEFT_W_SM   = 88
const HDR_H      = 40
const CLIENT_H   = 36
const PROJECT_H  = 40
const BAND_Y     = 11
const BAND_H     = 14
const MIL_CY     = PROJECT_H / 2
const ORDER_BAR_MAX = CLIENT_H - 10

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

interface ClientGroup {
  id: string
  name: string
  colorIdx: number
  projects: SerializedProject[]
  orders: any[]
}

// ── Tooltip ────────────────────────────────────────────────────────────────────
type TooltipState = { lines: string[]; x: number; y: number } | null

// ── Component ─────────────────────────────────────────────────────────────────

export function ClientPortfolioTimeline({
  clientAccounts,
  serializedProjects,
  allOrders,
  username,
  externalRange,
  onRangeChange,
}: {
  clientAccounts: any[]
  serializedProjects: SerializedProject[]
  allOrders: any[]
  username: string
  externalRange?: Range
  onRangeChange?: (r: Range) => void
}) {
  const [internalRange, setInternalRange] = useState<Range>('week')
  const range = externalRange ?? internalRange
  const handleRangeChange = (r: Range) => { setInternalRange(r); onRangeChange?.(r) }

  const [clientLimit, setClientLimit] = useState(5)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // expanded = set of client IDs that are currently open; starts empty (all collapsed)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const [isMobile, setIsMobile] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const leftWRef = useRef(LEFT_W_BASE)

  const showTooltip = (e: React.MouseEvent, lines: string[]) => {
    setTooltip({ lines, x: e.clientX, y: e.clientY })
  }
  const hideTooltip = () => setTooltip(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const narrow = entry.contentRect.width < 600
      setIsMobile(narrow)
      leftWRef.current = narrow ? LEFT_W_SM : LEFT_W_BASE
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const leftW = isMobile ? LEFT_W_SM : LEFT_W_BASE

  const cfg = RANGE_CFG[range]
  const totalDays     = cfg.back + cfg.forward
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

  const clientGroups = useMemo<ClientGroup[]>(() => {
    const groupMap = new Map<string, ClientGroup>()
    clientAccounts.forEach((ca: any, i) => {
      groupMap.set(ca.id, { id: ca.id, name: ca.name ?? 'Unknown', colorIdx: i, projects: [], orders: [] })
    })
    serializedProjects.forEach((p) => {
      if (!p.client) return
      let group = groupMap.get(p.client.id)
      if (!group) {
        group = { id: p.client.id, name: p.client.name, colorIdx: groupMap.size, projects: [], orders: [] }
        groupMap.set(p.client.id, group)
      }
      group.projects.push(p)
    })
    allOrders.forEach((o: any) => {
      const caRaw = o.clientAccount
      const caId = typeof caRaw === 'string' ? caRaw : caRaw?.id
      if (!caId) return
      const group = groupMap.get(caId)
      if (group) group.orders.push(o)
    })
    return Array.from(groupMap.values())
      .filter((g) => g.projects.length > 0)
      .sort((a, b) => {
        const aLatest = Math.max(...a.projects.map((p) => new Date(p.updatedAt ?? 0).getTime()))
        const bLatest = Math.max(...b.projects.map((p) => new Date(p.updatedAt ?? 0).getTime()))
        return bLatest - aLatest
      })
      .slice(0, clientLimit)
  }, [clientAccounts, serializedProjects, allOrders, clientLimit])

  const totalClientGroups = useMemo(() => {
    const ids = new Set(serializedProjects.filter(p => p.client).map(p => p.client!.id))
    return ids.size
  }, [serializedProjects])

  const hiddenCount = Math.max(0, totalClientGroups - clientLimit)

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
    el.scrollLeft = Math.max(0, todayPx - (el.clientWidth - leftWRef.current) * 0.40)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  if (clientGroups.length === 0) return null

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div ref={containerRef} className="space-y-3">

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--space-text-secondary)] font-semibold">
            Client Portfolio
          </p>
          <p className="text-[10px] text-[var(--space-text-secondary)] mt-0.5">
            {clientGroups.length} client{clientGroups.length !== 1 ? 's' : ''} · projects, sprints &amp; orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[var(--space-border-hard)] text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] transition-colors"
            title="Portfolio settings"
          >
            <Settings2 className="size-3.5" />
          </button>
          {/* Show own picker only when not controlled externally */}
          {!externalRange && (
            <div className="flex items-center p-1 bg-[rgba(255,255,255,0.06)] rounded-lg border border-[var(--space-border-hard)]">
              {(['week', 'month', 'year'] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150',
                    range === r ? 'bg-[rgba(255,255,255,0.06)] text-[var(--space-text-primary)] shadow-sm' : 'text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)]',
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
      <div className="relative rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] overflow-hidden">

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#333333] to-transparent pointer-events-none" />
        {isMobile && (
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-[var(--space-bg-card)] to-transparent pointer-events-none z-30" aria-hidden="true" />
        )}

        <svg width="60" height="60" viewBox="0 0 60 60" fill="none"
          className="absolute top-0 right-0 opacity-[0.04] pointer-events-none select-none" aria-hidden="true">
          <path d="M60 0 L60 60 L0 60" stroke="var(--space-divider)" strokeWidth="1" />
        </svg>

        <div
          ref={scrollRef}
          data-h-scroll
          className="overflow-x-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
        >
          <div style={{ width: leftW + timelineWidth, minWidth: '100%' }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex border-b border-[var(--space-border-hard)]" style={{ height: HDR_H }}>
              <div
                className="sticky left-0 z-30 bg-[var(--space-bg-card)] border-r border-[var(--space-border-hard)] shrink-0 flex items-end pb-2"
                style={{ width: leftW, minWidth: leftW, paddingLeft: isMobile ? 8 : 16 }}
              >
                <p className="text-[9px] tracking-[0.3em] uppercase text-[var(--space-text-secondary)]">{isMobile ? 'Client' : 'Client / Project'}</p>
              </div>
              <div className="relative" style={{ width: timelineWidth }}>
                {ticks.map((tick, i) => (
                  <div key={i} className="absolute top-0 bottom-0" style={{ left: tick.px }}>
                    <p
                      className={cn(
                        'absolute top-2 whitespace-nowrap leading-none',
                        range === 'week' ? 'text-[9px]' : 'text-[8px]',
                        tick.major ? 'text-[var(--space-text-tertiary)]' : 'text-[var(--space-text-secondary)]',
                      )}
                      style={{ transform: 'translateX(-50%)' }}
                    >
                      {tick.label}
                    </p>
                    <div className={cn('absolute bottom-0 w-px', tick.major ? 'h-3 bg-[#404040]/30' : 'h-2 bg-[var(--space-divider)]')} />
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

            {/* ── Client groups ───────────────────────────────────────────── */}
            {clientGroups.map((group) => {
              const color    = CLIENT_COLORS[group.colorIdx % CLIENT_COLORS.length]
              const isOpen   = expanded.has(group.id)
              const ordersInView = group.orders.filter((o: any) => {
                const t = new Date(o.dueDate ?? o.createdAt).getTime()
                return t >= windowStart - 86_400_000 && t <= windowEnd + 86_400_000
              })

              return (
                <div key={group.id}>

                  {/* Client header row */}
                  <div
                    className="flex border-b group/client"
                    style={{ height: CLIENT_H, borderColor: rgba(color, 0.18), background: rgba(color, 0.07) }}
                  >
                    <div
                      className="sticky left-0 z-20 border-r shrink-0 flex items-center"
                      style={{ width: leftW, minWidth: leftW, gap: isMobile ? 4 : 8, paddingLeft: isMobile ? 6 : 12, paddingRight: isMobile ? 4 : 8, borderColor: rgba(color, 0.18), background: rgba(color, 0.09) }}
                    >
                      {/* Collapse toggle */}
                      <button
                        onClick={() => toggleExpand(group.id)}
                        className="shrink-0 p-0.5 rounded hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                        aria-label={isOpen ? 'Collapse' : 'Expand'}
                      >
                        {isOpen
                          ? <ChevronDown className="size-3" style={{ color: rgba(color, 0.65) }} />
                          : <ChevronRight className="size-3" style={{ color: rgba(color, 0.65) }} />
                        }
                      </button>
                      <div className="size-2 rounded-full shrink-0" style={{ background: color.hex, boxShadow: `0 0 6px ${rgba(color, 0.55)}` }} />
                      {/* Client name — link to clients tab */}
                      <a
                        href={`/u/${username}/clients/${group.id}`}
                        className="font-semibold truncate flex-1 min-w-0 hover:opacity-80 transition-opacity"
                        style={{ fontSize: isMobile ? 10 : 11, color: color.hex }}
                        title={group.name}
                      >
                        {group.name}
                      </a>
                      {!isMobile && (
                        <span className="ml-auto text-[9px] shrink-0 font-medium" style={{ color: rgba(color, 0.55) }}>
                          {group.projects.length}p
                        </span>
                      )}
                    </div>

                    {/* Order bars on client row */}
                    <div className="relative" style={{ width: timelineWidth, height: CLIENT_H }}>
                      {todayPx >= 0 && todayPx <= timelineWidth && (
                        <div className="absolute top-0 bottom-0 w-px pointer-events-none" style={{ left: todayPx, background: 'rgba(139,156,182,0.10)' }} />
                      )}
                      {ordersInView.map((order: any, oi) => {
                        const px = toPx(order.dueDate ?? order.createdAt)
                        if (px === null) return null
                        const status = (order.status ?? 'pending') as keyof typeof ORDER_COLORS
                        const oColor = ORDER_COLORS[status] ?? ORDER_COLORS.pending
                        const amount = order.amount ?? 0
                        const barH = amount > 0 ? Math.min(ORDER_BAR_MAX, 5 + Math.log10(amount + 1) * 7) : 5
                        const fmtAmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
                        return (
                          <div
                            key={order.id ?? oi}
                            className="absolute cursor-default"
                            style={{
                              left: px - 2.5, bottom: 5, width: 5, height: barH,
                              background:   `rgba(${oColor.rgb},0.8)`,
                              borderRadius: '2px 2px 1px 1px',
                              boxShadow:    `0 0 5px rgba(${oColor.rgb},0.4)`,
                            }}
                            onMouseEnter={(e) => showTooltip(e, [
                              order.orderNumber ?? 'Order',
                              `${status.charAt(0).toUpperCase() + status.slice(1)} · ${fmtAmt}`,
                              group.name,
                            ])}
                            onMouseLeave={hideTooltip}
                          />
                        )
                      })}
                      <div className="absolute left-0 right-0 h-px" style={{ bottom: 5, background: rgba(color, 0.08) }} />
                    </div>
                  </div>

                  {/* Project sub-rows */}
                  {isOpen && group.projects.map((project) => {
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
                        className="flex border-b border-[var(--space-border-hard)] last:border-b-0 group/row"
                        style={{ height: PROJECT_H }}
                      >
                        <div
                          className="sticky left-0 z-20 bg-[var(--space-bg-card)] border-r border-[var(--space-border-hard)] shrink-0 flex items-center group-hover/row:bg-[var(--space-bg-card-hover)] transition-colors"
                          style={{ width: leftW, minWidth: leftW, paddingLeft: isMobile ? 16 : 28, paddingRight: isMobile ? 4 : 12, gap: isMobile ? 4 : 8 }}
                        >
                          <div className="size-1.5 rounded-full shrink-0" style={{ background: rgba(color, 0.7) }} />
                          {/* Project name — link to project detail */}
                          <a
                            href={`/u/${username}/projects/${project.id}`}
                            className="text-[var(--space-text-tertiary)] truncate hover:text-[var(--space-text-primary)] transition-colors leading-snug font-medium flex-1 min-w-0"
                            style={{ fontSize: isMobile ? 9 : 10 }}
                            title={project.name}
                          >
                            {project.name}
                          </a>
                        </div>

                        <div className="relative" style={{ width: timelineWidth, height: PROJECT_H }}>
                          <div className="absolute left-0 right-0 h-px pointer-events-none" style={{ top: PROJECT_H / 2, background: rgba(color, 0.08) }} />
                          {todayPx >= 0 && todayPx <= timelineWidth && (
                            <div className="absolute top-0 bottom-0 w-px pointer-events-none" style={{ left: todayPx, background: 'rgba(139,156,182,0.10)' }} />
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
                                  left: leftPx, width: widthPx, top: BAND_Y, height: BAND_H,
                                  background:  rgba(color, 0.25),
                                  borderTop:   `2px solid ${rgba(color, 0.85)}`,
                                  borderLeft:  trimL ? 'none' : `1px solid ${rgba(color, 0.35)}`,
                                  borderRight: trimR ? 'none' : `1px solid ${rgba(color, 0.35)}`,
                                  borderRadius: `${trimL ? 0 : 3}px ${trimR ? 0 : 3}px ${trimR ? 0 : 3}px ${trimL ? 0 : 3}px`,
                                }}
                                onMouseEnter={(e) => showTooltip(e, tooltipLines)}
                                onMouseLeave={hideTooltip}
                              >
                                <div className="absolute top-0.5 left-1 size-1.5 rounded-full" style={{ background: statusColor }} />
                                {widthPx > 48 && (
                                  <p className="absolute top-0 left-4 right-1 text-[7px] font-semibold truncate leading-[14px]" style={{ color: color.hex }}>
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
                                  left: clampedPx, top: MIL_CY,
                                  transform:    'translate(-50%, -50%) rotate(45deg)',
                                  width: 9, height: 9,
                                  background:   m.completed ? color.hex : 'rgba(242,240,235,0.9)',
                                  border:       `2px solid ${rgba(color, 0.85)}`,
                                  borderRadius: 2,
                                  boxShadow:    m.completed ? `0 0 8px ${rgba(color, 0.55)}` : `0 0 3px ${rgba(color, 0.25)}`,
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
                </div>
              )
            })}

            {/* "N more" row */}
            {hiddenCount > 0 && (
              <div className="flex" style={{ height: 30 }}>
                <div className="sticky left-0 z-20 bg-[var(--space-bg-card)] border-r border-[var(--space-border-hard)] shrink-0 flex items-center" style={{ width: leftW, minWidth: leftW, paddingLeft: isMobile ? 8 : 16 }}>
                  <button onClick={() => setSettingsOpen(true)} className="text-[10px] text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] transition-colors">
                    +{hiddenCount} more client{hiddenCount !== 1 ? 's' : ''}
                  </button>
                </div>
                <div className="relative flex items-center" style={{ width: timelineWidth, height: 30 }}>
                  <div className="h-px w-full" style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 4px, transparent 4px, transparent 10px)' }} />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-[var(--space-border-hard)] space-y-3">
          <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-5 rounded-sm shrink-0" style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderTop: '2px solid rgba(255,255,255,0.10)' }} />
              <span className="text-[9px] text-[var(--space-text-secondary)] uppercase tracking-wider">Sprint</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="shrink-0" style={{ width: 8, height: 8, background: 'rgba(255,255,255,0.12)', transform: 'rotate(45deg)', borderRadius: 2 }} />
              <span className="text-[9px] text-[var(--space-text-secondary)] uppercase tracking-wider">Milestone ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="shrink-0" style={{ width: 8, height: 8, border: '2px solid rgba(255,255,255,0.10)', transform: 'rotate(45deg)', borderRadius: 2 }} />
              <span className="text-[9px] text-[var(--space-text-secondary)] uppercase tracking-wider">Milestone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 rounded-sm" style={{ height: 11, background: 'rgba(251,191,36,0.8)' }} />
              <span className="text-[9px] text-[var(--space-text-secondary)] uppercase tracking-wider">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 rounded-sm" style={{ height: 11, background: 'rgba(74,222,128,0.8)' }} />
              <span className="text-[9px] text-[var(--space-text-secondary)] uppercase tracking-wider">Paid</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="w-px h-3 bg-[rgba(139,156,182,0.70)]" />
              <span className="text-[9px] text-[var(--space-text-secondary)] uppercase tracking-wider">Today</span>
            </div>
          </div>

          {clientGroups.length > 1 && (
            <div className="flex items-center flex-wrap gap-x-5 gap-y-1 pt-2 border-t border-[var(--space-border-hard)]">
              {clientGroups.map((g) => {
                const c = CLIENT_COLORS[g.colorIdx % CLIENT_COLORS.length]
                return (
                  <div key={g.id} className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-sm shrink-0" style={{ background: c.hex }} />
                    <span className="text-[9px] text-[var(--space-text-secondary)] truncate max-w-[100px]">{g.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Settings modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-[var(--space-bg-card)] border border-[var(--space-border-hard)] text-[var(--space-text-primary)] max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[13px] font-semibold text-[var(--space-text-tertiary)] tracking-wide">
              Client Portfolio Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-1">
            <div>
              <p className="text-[10px] text-[var(--space-text-secondary)] uppercase tracking-[0.25em] mb-4">Clients shown</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setClientLimit(l => Math.max(1, l - 1))}
                  className="size-9 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[var(--space-border-hard)] text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] hover:bg-[rgba(255,255,255,0.06)] flex items-center justify-center transition-colors"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="text-3xl font-bold tabular-nums text-[var(--space-text-primary)] w-8 text-center">{clientLimit}</span>
                <button
                  onClick={() => setClientLimit(l => Math.min(totalClientGroups || 20, l + 1))}
                  className="size-9 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[var(--space-border-hard)] text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] hover:bg-[rgba(255,255,255,0.06)] flex items-center justify-center transition-colors"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-[var(--space-text-secondary)] mt-3">
                {totalClientGroups} total client{totalClientGroups !== 1 ? 's' : ''} · sorted by recent activity
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
          <div className="bg-[var(--space-bg-card)] border border-[var(--space-border-hard)] rounded-lg px-3 py-2.5 shadow-2xl space-y-0.5 max-w-[220px]">
            {tooltip.lines.map((l, i) => (
              <p
                key={i}
                className={cn(
                  'text-[10px] whitespace-nowrap',
                  i === 0 ? 'text-[var(--space-text-primary)] font-semibold' : 'text-[var(--space-text-secondary)]',
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
