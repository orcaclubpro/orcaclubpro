'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  ExternalLink,
  Pencil,
  X,
  ChevronRight,
  CalendarRange,
  Layers,
  Zap,
  Search,
  LayoutList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Timeline } from '@/types/payload-types'
import { TimelinesBlockEditor } from '@/components/dashboard/TimelinesBlockEditor'

// ── Phase color system ────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  build:     '#7BAE9A',
  integrate: '#A88FD4',
  touchup:   '#D4A06B',
  prep:      '#C97A7A',
  checklist: '#6B9FD4',
  launch:    '#C9A84C',
}

type TimelinePhase = NonNullable<Timeline['phases']>[number]

function phaseColor(phase: TimelinePhase): string {
  if (phase.blockType === 'launch')    return PHASE_COLORS.launch
  if (phase.blockType === 'checklist') return PHASE_COLORS.checklist
  const color = (phase as Extract<TimelinePhase, { blockType: 'phase' }>).tagColor ?? 'build'
  return PHASE_COLORS[color] ?? PHASE_COLORS.build
}

function phaseLabel(phase: TimelinePhase): string {
  if (phase.blockType === 'launch')    return 'Launch'
  if (phase.blockType === 'checklist') return 'Checklist'
  const p = phase as Extract<TimelinePhase, { blockType: 'phase' }>
  return p.tag ?? p.tagColor ?? 'Phase'
}

// ── Mini timeline strip ───────────────────────────────────────────────────────

function PhaseStrip({ phases }: { phases: TimelinePhase[] }) {
  if (!phases.length) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="h-px flex-1 bg-white/[0.05] rounded-full" />
        <span className="text-[9px] text-white/20 font-medium shrink-0">no phases yet</span>
        <div className="h-px flex-1 bg-white/[0.05] rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex items-center py-1" style={{ gap: 0 }}>
      {phases.map((phase, i) => {
        const color = phaseColor(phase)
        const nextColor = i < phases.length - 1 ? phaseColor(phases[i + 1]) : null
        const isLaunch = phase.blockType === 'launch'

        return (
          <div key={i} className="flex items-center" style={{ flex: 1, minWidth: 0 }}>
            {/* Node */}
            <div className="shrink-0 relative flex items-center justify-center" style={{ width: isLaunch ? 12 : 8, height: isLaunch ? 12 : 8 }}>
              {isLaunch ? (
                <>
                  <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    border: `1.5px solid ${color}`,
                    boxShadow: `0 0 8px ${color}50`,
                  }} />
                  <div style={{
                    width: 4, height: 4,
                    borderRadius: '50%',
                    background: color,
                    opacity: 0.9,
                  }} />
                </>
              ) : (
                <div style={{
                  width: 7, height: 7,
                  borderRadius: '50%',
                  border: `1.5px solid ${color}99`,
                  background: `${color}15`,
                }} />
              )}
            </div>
            {/* Connector line */}
            {nextColor && (
              <div style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(90deg, ${color}50, ${nextColor}30)`,
                minWidth: 4,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Timeline card ─────────────────────────────────────────────────────────────

function TimelineCard({ timeline, onEditBlocks }: { timeline: Timeline; onEditBlocks: () => void }) {
  const phases = (timeline.phases ?? []) as TimelinePhase[]

  return (
    <div className={cn(
      'group relative flex flex-col gap-4 p-5 rounded-2xl border',
      'bg-white/[0.02] border-white/[0.07]',
      'hover:bg-white/[0.035] hover:border-white/[0.13]',
      'transition-all duration-200',
      'animate-in fade-in slide-in-from-bottom-2 duration-300',
    )}>

      {/* Top row: eyebrow + phase badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold tracking-[0.28em] uppercase text-[#67e8f9]/70 truncate">
          {timeline.eyebrow}
        </span>
        <span className="shrink-0 text-[8px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border border-[#67e8f9]/15 text-[#67e8f9]/50 bg-[#67e8f9]/[0.04]">
          {phases.length} {phases.length === 1 ? 'phase' : 'phases'}
        </span>
        {timeline.style && timeline.style !== 'cinematic' && (
          <span className="shrink-0 text-[8px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border border-white/[0.10] text-white/30 bg-white/[0.03]">
            {timeline.style.replace('-', ' ')}
          </span>
        )}
      </div>

      {/* Title */}
      <div>
        <h3 className="text-base font-bold text-white leading-snug tracking-tight">
          {timeline.title}
          {timeline.titleEmphasis && (
            <em className="not-italic font-semibold text-[#67e8f9]/75 ml-1.5">
              {timeline.titleEmphasis}
            </em>
          )}
        </h3>
        <p className="mt-1 font-mono text-[10px] text-white/20 tracking-wide">
          /timelines/{timeline.slug}
        </p>
      </div>

      {/* Phase strip visualization */}
      <PhaseStrip phases={phases} />

      {/* Phase type pills */}
      {phases.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {phases.map((phase, i) => {
            const color = phaseColor(phase)
            const label = phaseLabel(phase)
            return (
              <span
                key={i}
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '2px 7px',
                  borderRadius: 999,
                  border: `1px solid ${color}35`,
                  color: `${color}BB`,
                  background: `${color}0D`,
                }}
              >
                {label}
              </span>
            )
          })}
        </div>
      )}

      {/* Meta row */}
      {(timeline.dateRange || timeline.metaLabel) && (
        <div className="flex items-center gap-3 flex-wrap">
          {timeline.dateRange && (
            <span className="flex items-center gap-1 text-[10px] text-white/35">
              <CalendarRange className="size-2.5 shrink-0 opacity-50" />
              {timeline.dateRange}
            </span>
          )}
          {timeline.metaLabel && (
            <span className="text-[10px] text-white/20 italic">{timeline.metaLabel}</span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-white/[0.05]" />

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={`/admin/collections/timelines/${timeline.id}`}
          className={cn(
            'flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl',
            'text-[11px] font-bold tracking-[0.1em] uppercase',
            'border border-white/[0.09] text-white/50',
            'hover:text-white hover:border-white/[0.18] hover:bg-white/[0.04]',
            'transition-all duration-150',
          )}
        >
          <Pencil className="size-3 shrink-0" />
          Edit
        </a>
        <button
          onClick={onEditBlocks}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl',
            'text-[11px] font-bold tracking-[0.1em] uppercase',
            'border border-amber-400/20 text-amber-400/60',
            'hover:text-amber-400 hover:border-amber-400/38 hover:bg-amber-400/[0.06]',
            'transition-all duration-150',
          )}
        >
          <LayoutList className="size-3 shrink-0" />
          Edit Blocks
        </button>
        <a
          href={`/timelines/${timeline.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl',
            'text-[11px] font-bold tracking-[0.1em] uppercase',
            'border border-[#67e8f9]/18 text-[#67e8f9]/60',
            'hover:text-[#67e8f9] hover:border-[#67e8f9]/38 hover:bg-[#67e8f9]/[0.05]',
            'transition-all duration-150',
          )}
        >
          <ExternalLink className="size-3 shrink-0" />
          Preview
        </a>
      </div>
    </div>
  )
}

// ── Create modal ──────────────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: '',
    titleEmphasis: '',
    eyebrow: '',
    dateRange: '',
    metaLabel: '',
    slug: '',
    style: 'cinematic',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)

  const formatSlug = (v: string) =>
    v.replace(/ /g, '-').replace(/[^\w-]+/g, '').toLowerCase()

  const update = (field: keyof typeof form | 'style', value: string) =>
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'title' && !slugTouched ? { slug: formatSlug(value) } : {}),
    }))

  const submit = async () => {
    if (!form.title.trim() || !form.eyebrow.trim()) {
      setError('Title and eyebrow are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/timelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          ...(form.titleEmphasis.trim() ? { titleEmphasis: form.titleEmphasis.trim() } : {}),
          eyebrow: form.eyebrow.trim(),
          ...(form.dateRange.trim()  ? { dateRange:  form.dateRange.trim()  } : {}),
          ...(form.metaLabel.trim()  ? { metaLabel:  form.metaLabel.trim()  } : {}),
          slug: form.slug.trim() || formatSlug(form.title),
          style: form.style,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.errors?.[0]?.message ?? `Error ${res.status}`)
      }
      const data = await res.json()
      const id = data?.doc?.id ?? data?.id
      if (id) window.location.href = `/admin/collections/timelines/${id}`
      else throw new Error('No document ID returned')
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          'relative z-10 w-full sm:max-w-lg',
          'rounded-t-3xl sm:rounded-2xl',
          'border border-white/[0.10] overflow-hidden',
          'animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300',
        )}
        style={{ background: 'linear-gradient(160deg, #141414 0%, #0d0d0d 100%)' }}
      >
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#67e8f9]/45 to-transparent" />

        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-white/[0.12]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/[0.05]">
          <div>
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase text-[#67e8f9]/60 mb-1">
              New
            </p>
            <h2 className="text-lg font-bold text-white leading-none">Create Timeline</h2>
            <p className="text-xs text-white/30 mt-1.5">
              Add phases after creation in the full editor.
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white hover:border-white/[0.18] transition-all mt-0.5"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Title + Emphasis */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-white/35 mb-1.5">
                Title <span className="text-[#67e8f9]/50">*</span>
              </label>
              <input
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="Launch"
                className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#67e8f9]/30 focus:bg-white/[0.06] transition-all"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-white/35 mb-1.5">
                Emphasis{' '}
                <span className="text-white/20 normal-case tracking-normal font-normal italic">
                  (italic)
                </span>
              </label>
              <input
                value={form.titleEmphasis}
                onChange={e => update('titleEmphasis', e.target.value)}
                placeholder="Roadmap"
                className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#67e8f9]/30 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          {/* Eyebrow */}
          <div>
            <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-white/35 mb-1.5">
              Eyebrow <span className="text-[#67e8f9]/50">*</span>
            </label>
            <input
              value={form.eyebrow}
              onChange={e => update('eyebrow', e.target.value)}
              placeholder="Kawai Digital · Site Relaunch"
              className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#67e8f9]/30 focus:bg-white/[0.06] transition-all"
            />
          </div>

          {/* Date range + meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-white/35 mb-1.5">
                Date Range
              </label>
              <input
                value={form.dateRange}
                onChange={e => update('dateRange', e.target.value)}
                placeholder="March – April 2026"
                className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#67e8f9]/30 focus:bg-white/[0.06] transition-all"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-white/35 mb-1.5">
                Meta Label
              </label>
              <input
                value={form.metaLabel}
                onChange={e => update('metaLabel', e.target.value)}
                placeholder="Internal Planning Doc"
                className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#67e8f9]/30 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-white/35 mb-1.5">
              Slug
            </label>
            <input
              value={form.slug}
              onChange={e => { setSlugTouched(true); update('slug', e.target.value) }}
              placeholder="launch-roadmap"
              className="w-full px-3 py-2.5 text-sm font-mono bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/60 placeholder:text-white/20 focus:outline-none focus:border-[#67e8f9]/30 focus:bg-white/[0.06] transition-all"
            />
            {form.slug && (
              <p className="mt-1.5 text-[9px] text-white/20 font-mono">
                /timelines/{form.slug}
              </p>
            )}
          </div>

          {/* Visual Style */}
          <div>
            <label className="block text-[9px] font-bold tracking-[0.2em] uppercase text-white/35 mb-1.5">
              Visual Style
            </label>
            <select
              value={form.style ?? 'cinematic'}
              onChange={e => update('style' as any, e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-[#67e8f9]/30 focus:bg-white/[0.06] transition-all"
            >
              <option value="cinematic">🎬 Cinematic — Dark gold horizontal</option>
              <option value="vertical-clean">📋 Vertical Clean — Minimal scrollable</option>
              <option value="blueprint">📐 Blueprint — Technical dark navy</option>
              <option value="editorial">📰 Editorial — Magazine high-contrast</option>
              <option value="terminal">💻 Terminal — CLI green on black</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.06] bg-black/20">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-white/35 hover:text-white rounded-xl hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || !form.title.trim() || !form.eyebrow.trim()}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl',
              'text-sm font-semibold tracking-wide',
              'bg-[#67e8f9]/[0.10] border border-[#67e8f9]/25 text-[#67e8f9]',
              'hover:bg-[#67e8f9]/[0.18] hover:border-[#67e8f9]/40',
              'disabled:opacity-30 disabled:pointer-events-none',
              'transition-all duration-150',
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 rounded-full border-2 border-[#67e8f9]/30 border-t-[#67e8f9] animate-spin" />
                Creating…
              </span>
            ) : (
              <>
                Create & Edit
                <ChevronRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      {/* Decorative icon + mini timeline */}
      <div className="relative mb-8">
        <div className="inline-flex p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] mb-4">
          <CalendarRange className="size-7 text-white/20" />
        </div>
        {/* Mini phase strip */}
        <div className="flex items-center justify-center gap-0">
          {(
            [
              { color: '#7BAE9A', w: 24 },
              { color: '#A88FD4', w: 24 },
              { color: '#D4A06B', w: 24 },
              { color: '#C9A84C', w: 16, launch: true },
            ] as { color: string; w: number; launch?: boolean }[]
          ).map((item, i, arr) => (
            <div key={i} className="flex items-center">
              <div
                style={{
                  width: item.launch ? 10 : 7,
                  height: item.launch ? 10 : 7,
                  borderRadius: '50%',
                  border: `1.5px solid ${item.color}80`,
                  background: `${item.color}15`,
                  boxShadow: item.launch ? `0 0 8px ${item.color}40` : undefined,
                }}
              />
              {i < arr.length - 1 && (
                <div
                  style={{
                    width: item.w,
                    height: 1,
                    background: `linear-gradient(90deg, ${item.color}40, ${arr[i + 1].color}25)`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm font-semibold text-white/45 mb-2">No timelines yet</p>
      <p className="text-xs text-white/25 max-w-sm mb-8 leading-relaxed">
        Build visual project roadmaps to share with clients. Each timeline shows phases, checklists, and a launch milestone.
      </p>
      <button
        onClick={onNew}
        className={cn(
          'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
          'bg-[#67e8f9]/[0.10] border border-[#67e8f9]/25 text-[#67e8f9]',
          'hover:bg-[#67e8f9]/[0.18] hover:border-[#67e8f9]/40',
          'transition-all duration-150',
        )}
      >
        <Plus className="size-4" />
        Create first timeline
      </button>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

interface Props {
  username: string
}

export function TimelinesAdminView({ username: _username }: Props) {
  const [timelines, setTimelines] = useState<Timeline[]>([])
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch]       = useState('')
  const [editingTimeline, setEditingTimeline] = useState<Timeline | null>(null)

  useEffect(() => {
    fetch('/api/timelines?limit=100&sort=-updatedAt')
      .then(r => r.json())
      .then(data => setTimelines(data?.docs ?? []))
      .catch(() => setTimelines([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? timelines.filter(t =>
        `${t.title} ${t.titleEmphasis ?? ''} ${t.eyebrow} ${t.slug}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : timelines

  const totalPhases = timelines.reduce((acc, t) => acc + (t.phases?.length ?? 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-28">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <p className="text-[9px] font-bold tracking-[0.32em] uppercase text-[#67e8f9]/80 mb-1">
            Operations
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">
            Timelines
          </h1>
          <p className="text-sm text-white/30 mt-1.5">
            Build &amp; manage client project roadmaps
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className={cn(
            'shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl',
            'text-sm font-semibold tracking-wide',
            'bg-[#67e8f9]/[0.10] border border-[#67e8f9]/25 text-[#67e8f9]',
            'hover:bg-[#67e8f9]/[0.18] hover:border-[#67e8f9]/40',
            'transition-all duration-150',
          )}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">New Timeline</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* ── Stats (only when data loaded and not empty) ── */}
      {!loading && timelines.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-7">
          {(
            [
              { label: 'Timelines',    value: timelines.length, icon: CalendarRange },
              { label: 'Total Phases', value: totalPhases,      icon: Layers },
              { label: 'Published',    value: timelines.length, icon: Zap },
            ] as const
          ).map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col gap-1.5 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center gap-1.5">
                <Icon className="size-3 text-white/25 shrink-0" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25 truncate">
                  {label}
                </span>
              </div>
              <span className="text-xl font-bold text-white tabular-nums leading-none">
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Search (only when there are timelines) ── */}
      {!loading && timelines.length > 1 && (
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-white/25 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search timelines…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-[#67e8f9]/30 focus:bg-white/[0.06] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        /* Loading pulse */
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="flex gap-1.5">
            {[0, 120, 240].map(d => (
              <div
                key={d}
                className="w-1.5 h-1.5 rounded-full bg-[#67e8f9]/35 animate-pulse"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
          <span className="text-[10px] text-white/20 uppercase tracking-widest">Loading</span>
        </div>
      ) : timelines.length === 0 ? (
        <EmptyState onNew={() => setShowCreate(true)} />
      ) : filtered.length === 0 ? (
        /* No search results */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-white/35 mb-1">No results for "{search}"</p>
          <button
            onClick={() => setSearch('')}
            className="text-xs text-[#67e8f9]/60 hover:text-[#67e8f9] transition-colors mt-2"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TimelineCard key={t.id} timeline={t} onEditBlocks={() => setEditingTimeline(t)} />
          ))}
        </div>
      )}

      {/* ── Create modal ── */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} />
      )}

      {/* ── Block editor ── */}
      {editingTimeline && (
        <TimelinesBlockEditor
          timeline={editingTimeline}
          onClose={() => setEditingTimeline(null)}
          onSave={updated => {
            setTimelines(prev =>
              prev.map(t => (t.id === updated.id ? updated : t)),
            )
            setEditingTimeline(null)
          }}
        />
      )}
    </div>
  )
}
