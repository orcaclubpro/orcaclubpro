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
  Search,
  LayoutList,
  Copy,
  Eye,
  EyeOff,
  Link2,
  KeyRound,
  FileDown,
  ChevronDown,
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

// ── Mini phase dots ───────────────────────────────────────────────────────────

function PhaseDots({ phases }: { phases: TimelinePhase[] }) {
  if (!phases.length) {
    return <span className="text-[9px] text-[#4A4A4A] italic">no phases</span>
  }
  const visible = phases.slice(0, 6)
  const rest = phases.length - visible.length
  return (
    <div className="flex items-center gap-1">
      {visible.map((phase, i) => {
        const color = phaseColor(phase)
        const isLaunch = phase.blockType === 'launch'
        return (
          <div
            key={i}
            title={phaseLabel(phase)}
            style={{
              width:  isLaunch ? 8 : 6,
              height: isLaunch ? 8 : 6,
              borderRadius: '50%',
              border: `1.5px solid ${color}88`,
              background: `${color}22`,
              boxShadow: isLaunch ? `0 0 6px ${color}40` : undefined,
              flexShrink: 0,
            }}
          />
        )
      })}
      {rest > 0 && (
        <span className="text-[9px] text-[#4A4A4A] ml-0.5">+{rest}</span>
      )}
    </div>
  )
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }
  return (
    <button
      onClick={e => { e.stopPropagation(); copy() }}
      title="Copy link"
      className={cn(
        'flex items-center justify-center size-6 rounded-lg',
        'text-[#4A4A4A] hover:text-[#F0F0F0] hover:bg-[#333333]',
        'transition-all duration-150',
        className,
      )}
    >
      {copied
        ? <span className="text-[8px] font-bold" style={{ color: 'var(--space-accent)' }}>OK</span>
        : <Copy className="size-3" />}
    </button>
  )
}

// ── Timeline row ──────────────────────────────────────────────────────────────

function TimelineRow({
  timeline,
  onEditBlocks,
  onUpdate,
}: {
  timeline: Timeline
  onEditBlocks: () => void
  onUpdate: (updated: Timeline) => void
}) {
  const phases     = (timeline.phases ?? []) as TimelinePhase[]
  const accessCode = (timeline as any).accessCode as string | null | undefined
  const shareUrl   = `orcaclub.pro/orcaclub/projects/${timeline.slug}`

  const [expanded,    setExpanded]    = useState(false)
  const [showCode,    setShowCode]    = useState(false)
  const [editingCode, setEditingCode] = useState(false)
  const [codeInput,   setCodeInput]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState<string | null>(null)

  const openCodeEditor = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCodeInput(accessCode ?? '')
    setSaveError(null)
    setEditingCode(true)
  }

  const saveCode = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/timelines/${timeline.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ accessCode: codeInput.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.errors?.[0]?.message ?? `Error ${res.status}`)
      }
      const data = await res.json()
      onUpdate(data.doc ?? data)
      setEditingCode(false)
    } catch (e: any) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={cn(
        'group border-b border-[#222222] last:border-b-0 transition-colors duration-150',
        expanded ? 'bg-[#1E1E1E]' : 'hover:bg-[#1A1A1A]',
      )}
    >
      {/* ── Main row ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Expand chevron */}
        <ChevronDown
          className={cn(
            'size-3.5 text-[#4A4A4A] shrink-0 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />

        {/* Phase dots */}
        <div className="shrink-0 w-[72px]">
          <PhaseDots phases={phases} />
        </div>

        {/* Title + eyebrow */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-[8.5px] font-bold tracking-[0.24em] uppercase truncate shrink-0"
              style={{ color: 'var(--space-accent)', opacity: 0.55 }}
            >
              {timeline.eyebrow}
            </span>
            {timeline.style && timeline.style !== 'cinematic' && (
              <span className="hidden sm:inline text-[7.5px] font-medium tracking-wide uppercase text-[#4A4A4A] border border-[#333333] px-1.5 py-px rounded shrink-0">
                {timeline.style.replace('-', ' ')}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-sm font-semibold text-[#E8E8E8] truncate leading-tight">
              {timeline.title}
            </span>
            {timeline.titleEmphasis && (
              <em
                className="not-italic text-sm font-normal truncate leading-tight shrink-0"
                style={{ color: 'var(--space-accent)', opacity: 0.65 }}
              >
                {timeline.titleEmphasis}
              </em>
            )}
          </div>
        </div>

        {/* Date range */}
        <div className="hidden lg:flex items-center gap-1 shrink-0 min-w-[120px]">
          {timeline.dateRange
            ? <>
                <CalendarRange className="size-3 text-[#4A4A4A] shrink-0" />
                <span className="text-[10px] text-[#6B6B6B] truncate">{timeline.dateRange}</span>
              </>
            : <span className="text-[10px] text-[#333333]">—</span>}
        </div>

        {/* Phase count */}
        <div className="shrink-0 hidden sm:block">
          <span className="text-[9px] font-medium tabular-nums text-[#4A4A4A]">
            {phases.length} {phases.length === 1 ? 'phase' : 'phases'}
          </span>
        </div>

        {/* Access code indicator */}
        <div className="shrink-0">
          <KeyRound
            className={cn('size-3', accessCode ? 'text-amber-400/40' : 'text-[#333333]')}
            aria-label={accessCode ? 'Access code set' : 'No access code'}
          />
        </div>

        {/* Actions — always visible on md+, hover-reveal on sm */}
        <div
          className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onEditBlocks}
            title="Edit blocks"
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg',
              'text-[9px] font-bold tracking-wide uppercase',
              'border border-amber-400/18 text-amber-400/50',
              'hover:text-amber-400 hover:border-amber-400/35 hover:bg-amber-400/[0.05]',
              'transition-all duration-150',
            )}
          >
            <LayoutList className="size-3" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <a
            href={`/api/timelines/${timeline.slug}/pdf`}
            download={`timeline-${timeline.slug}.pdf`}
            title="Download PDF"
            className="flex items-center justify-center size-7 rounded-lg text-[#4A4A4A] hover:text-[#F0F0F0] hover:bg-[#2D2D2D] transition-all duration-150"
          >
            <FileDown className="size-3.5" />
          </a>

          <a
            href={`/timelines/${timeline.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview"
            className="flex items-center justify-center size-7 rounded-lg text-[#4A4A4A] hover:text-[#F0F0F0] hover:bg-[#2D2D2D] transition-all duration-150"
          >
            <ExternalLink className="size-3.5" />
          </a>

          <CopyButton text={`https://${shareUrl}`} />
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[#252525] space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">

          {/* Slug + share link */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141414] border border-[#2A2A2A]">
            <Link2 className="size-3 shrink-0 text-[#4A4A4A]" />
            <span className="flex-1 font-mono text-[9px] text-[#4A4A4A] truncate tracking-wide">
              {shareUrl}
            </span>
            <CopyButton text={`https://${shareUrl}`} />
          </div>

          {/* Access code */}
          {editingCode ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <KeyRound className="size-3 shrink-0 text-amber-400/40" />
                <input
                  autoFocus
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  saveCode()
                    if (e.key === 'Escape') setEditingCode(false)
                  }}
                  placeholder="e.g. ORCA-2026 (blank to remove)"
                  className={cn(
                    'flex-1 px-2.5 py-1 text-[10px] font-mono tracking-widest',
                    'bg-[#141414] border rounded-lg text-[#F0F0F0] placeholder:text-[#4A4A4A]',
                    'focus:outline-none focus:border-amber-400/30 transition-all',
                    saveError ? 'border-red-500/40' : 'border-amber-400/20',
                  )}
                />
                <button
                  onClick={saveCode}
                  disabled={saving}
                  className="shrink-0 flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase bg-amber-400/[0.08] border border-amber-400/20 text-amber-400 hover:bg-amber-400/[0.15] disabled:opacity-40 transition-all"
                >
                  {saving
                    ? <span className="size-2.5 rounded-full border border-amber-400/30 border-t-amber-400 animate-spin" />
                    : 'Save'}
                </button>
                <button
                  onClick={() => setEditingCode(false)}
                  className="size-6 rounded-lg flex items-center justify-center text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
              {saveError && <p className="text-[9px] text-red-400 pl-4">{saveError}</p>}
            </div>
          ) : accessCode ? (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141414] border border-[#2A2A2A]">
              <KeyRound className="size-3 shrink-0 text-amber-400/40" />
              <span className="flex-1 font-mono text-[9px] tracking-widest text-[#6B6B6B] select-none">
                {showCode ? accessCode : '•'.repeat(Math.min(accessCode.length, 10))}
              </span>
              <button
                onClick={() => setShowCode(v => !v)}
                className="flex items-center justify-center size-5 rounded-md text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors"
              >
                {showCode ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </button>
              <CopyButton text={accessCode} />
              <button
                onClick={openCodeEditor}
                className="flex items-center justify-center size-5 rounded-md text-[#4A4A4A] hover:text-amber-400/70 transition-colors"
              >
                <Pencil className="size-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={openCodeEditor}
              className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#2A2A2A] hover:border-amber-400/18 hover:bg-amber-400/[0.02] transition-all group/code"
            >
              <KeyRound className="size-3 shrink-0 text-[#333333] group-hover/code:text-amber-400/35 transition-colors" />
              <span className="text-[9px] text-[#3A3A3A] italic group-hover/code:text-[#5A5A5A] transition-colors">
                Add access code…
              </span>
            </button>
          )}

          {/* Meta / date row */}
          {(timeline.metaLabel || timeline.dateRange) && (
            <div className="flex items-center gap-4 text-[9px] text-[#4A4A4A] pl-0.5">
              {timeline.dateRange && (
                <span className="flex items-center gap-1">
                  <CalendarRange className="size-2.5 opacity-50" />
                  {timeline.dateRange}
                </span>
              )}
              {timeline.metaLabel && <span className="italic">{timeline.metaLabel}</span>}
            </div>
          )}

          {/* Phase pills */}
          {phases.length > 0 && (
            <div className="flex flex-wrap gap-1 pl-0.5">
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
                      border: `1px solid ${color}30`,
                      color: `${color}99`,
                      background: `${color}0A`,
                    }}
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Create modal ──────────────────────────────────────────────────────────────

function CreateModal({
  onClose,
  onCreate,
}: {
  onClose:  () => void
  onCreate: (timeline: Timeline) => void
}) {
  const [form, setForm] = useState({
    title:         '',
    titleEmphasis: '',
    eyebrow:       '',
    dateRange:     '',
    metaLabel:     '',
    slug:          '',
    style:         'cinematic',
  })
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [slugTouched,  setSlugTouched]  = useState(false)

  const formatSlug = (v: string) =>
    v.replace(/ /g, '-').replace(/[^\w-]+/g, '').toLowerCase()

  const update = (field: keyof typeof form, value: string) =>
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:          form.title.trim(),
          ...(form.titleEmphasis.trim() ? { titleEmphasis: form.titleEmphasis.trim() } : {}),
          eyebrow:        form.eyebrow.trim(),
          ...(form.dateRange.trim()  ? { dateRange:  form.dateRange.trim()  } : {}),
          ...(form.metaLabel.trim()  ? { metaLabel:  form.metaLabel.trim()  } : {}),
          slug:   form.slug.trim() || formatSlug(form.title),
          style:  form.style,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.errors?.[0]?.message ?? `Error ${res.status}`)
      }
      const data     = await res.json()
      const newDoc   = data?.doc ?? data
      onClose()
      onCreate(newDoc as Timeline)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full sm:max-w-lg',
          'rounded-t-3xl sm:rounded-2xl border border-[#2A2A2A] overflow-hidden',
          'animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-250',
        )}
        style={{ background: '#141414' }}
      >
        {/* Accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(139,156,182,0.2)] to-transparent" />

        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-[#333333]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[#222222]">
          <div>
            <p className="text-[8px] font-bold tracking-[0.3em] uppercase mb-1.5" style={{ color: 'var(--space-accent)', opacity: 0.5 }}>
              New Timeline
            </p>
            <h2 className="text-base font-bold text-[#E8E8E8] leading-none">Create Timeline</h2>
            <p className="text-xs text-[#4A4A4A] mt-1">
              You&apos;ll add phases in the block editor right after.
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-lg border border-[#2A2A2A] flex items-center justify-center text-[#4A4A4A] hover:text-[#F0F0F0] hover:border-[#404040] transition-all mt-0.5"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Fields */}
        <div className="px-5 py-4 space-y-3.5 max-h-[55vh] overflow-y-auto">
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.05] text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Title + Emphasis */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[8.5px] font-bold tracking-[0.2em] uppercase text-[#4A4A4A] mb-1.5">
                Title <span className="opacity-60">*</span>
              </label>
              <input
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="Launch"
                className="w-full px-3 py-2 text-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[#E8E8E8] placeholder:text-[#3A3A3A] focus:outline-none focus:border-[rgba(139,156,182,0.25)] transition-all"
              />
            </div>
            <div>
              <label className="block text-[8.5px] font-bold tracking-[0.2em] uppercase text-[#4A4A4A] mb-1.5">
                Emphasis <span className="font-normal italic normal-case tracking-normal opacity-60">italic</span>
              </label>
              <input
                value={form.titleEmphasis}
                onChange={e => update('titleEmphasis', e.target.value)}
                placeholder="Roadmap"
                className="w-full px-3 py-2 text-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[#E8E8E8] placeholder:text-[#3A3A3A] focus:outline-none focus:border-[rgba(139,156,182,0.25)] transition-all"
              />
            </div>
          </div>

          {/* Eyebrow */}
          <div>
            <label className="block text-[8.5px] font-bold tracking-[0.2em] uppercase text-[#4A4A4A] mb-1.5">
              Eyebrow <span className="opacity-60">*</span>
            </label>
            <input
              value={form.eyebrow}
              onChange={e => update('eyebrow', e.target.value)}
              placeholder="Kawai Digital · Site Relaunch"
              className="w-full px-3 py-2 text-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[#E8E8E8] placeholder:text-[#3A3A3A] focus:outline-none focus:border-[rgba(139,156,182,0.25)] transition-all"
            />
          </div>

          {/* Date range + meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[8.5px] font-bold tracking-[0.2em] uppercase text-[#4A4A4A] mb-1.5">Date Range</label>
              <input
                value={form.dateRange}
                onChange={e => update('dateRange', e.target.value)}
                placeholder="March – April 2026"
                className="w-full px-3 py-2 text-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[#E8E8E8] placeholder:text-[#3A3A3A] focus:outline-none focus:border-[rgba(139,156,182,0.25)] transition-all"
              />
            </div>
            <div>
              <label className="block text-[8.5px] font-bold tracking-[0.2em] uppercase text-[#4A4A4A] mb-1.5">Meta Label</label>
              <input
                value={form.metaLabel}
                onChange={e => update('metaLabel', e.target.value)}
                placeholder="Internal Planning Doc"
                className="w-full px-3 py-2 text-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[#E8E8E8] placeholder:text-[#3A3A3A] focus:outline-none focus:border-[rgba(139,156,182,0.25)] transition-all"
              />
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[8.5px] font-bold tracking-[0.2em] uppercase text-[#4A4A4A] mb-1.5">Slug</label>
            <input
              value={form.slug}
              onChange={e => { setSlugTouched(true); update('slug', e.target.value) }}
              placeholder="launch-roadmap"
              className="w-full px-3 py-2 text-sm font-mono bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[#6B6B6B] placeholder:text-[#3A3A3A] focus:outline-none focus:border-[rgba(139,156,182,0.25)] transition-all"
            />
            {form.slug && (
              <p className="mt-1 text-[9px] text-[#3A3A3A] font-mono pl-0.5">/timelines/{form.slug}</p>
            )}
          </div>

          {/* Visual Style */}
          <div>
            <label className="block text-[8.5px] font-bold tracking-[0.2em] uppercase text-[#4A4A4A] mb-1.5">Visual Style</label>
            <select
              value={form.style}
              onChange={e => update('style', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-[#E8E8E8] focus:outline-none focus:border-[rgba(139,156,182,0.25)] transition-all"
            >
              <option value="cinematic">Cinematic — Dark gold horizontal</option>
              <option value="vertical-clean">Vertical Clean — Minimal scrollable</option>
              <option value="blueprint">Blueprint — Technical dark navy</option>
              <option value="editorial">Editorial — Magazine high-contrast</option>
              <option value="terminal">Terminal — CLI green on black</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-t border-[#222222] bg-[#111111]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#4A4A4A] hover:text-[#A0A0A0] rounded-xl hover:bg-[#1A1A1A] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || !form.title.trim() || !form.eyebrow.trim()}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl',
              'text-sm font-semibold',
              'bg-[rgba(139,156,182,0.07)] border border-[rgba(139,156,182,0.15)] text-[rgba(139,156,182,0.8)]',
              'hover:bg-[rgba(139,156,182,0.12)] hover:text-[rgba(139,156,182,1)]',
              'disabled:opacity-30 disabled:pointer-events-none',
              'transition-all duration-150',
            )}
          >
            {loading
              ? <><span className="size-3.5 rounded-full border-2 border-[rgba(139,156,182,0.2)] border-t-[rgba(139,156,182,0.8)] animate-spin" />Creating…</>
              : <>Create &amp; Edit Blocks <ChevronRight className="size-4" /></>}
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
      <div className="inline-flex p-4 rounded-2xl bg-[#111111] border border-[#222222] mb-5">
        <CalendarRange className="size-6 text-[#3A3A3A]" />
      </div>
      <p className="text-sm font-semibold text-[#6B6B6B] mb-1.5">No timelines yet</p>
      <p className="text-xs text-[#3A3A3A] max-w-xs mb-7 leading-relaxed">
        Build visual project roadmaps to share with clients. Each timeline shows phases, checklists, and a launch milestone.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.14)] text-[rgba(139,156,182,0.7)] hover:bg-[rgba(139,156,182,0.10)] hover:text-[rgba(139,156,182,1)] transition-all"
      >
        <Plus className="size-3.5" />
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
  const [timelines,       setTimelines]       = useState<Timeline[]>([])
  const [loading,         setLoading]         = useState(true)
  const [showCreate,      setShowCreate]      = useState(false)
  const [search,          setSearch]          = useState('')
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-28">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[8.5px] font-bold tracking-[0.32em] uppercase mb-1" style={{ color: 'var(--space-accent)', opacity: 0.6 }}>
            Operations
          </p>
          <h1 className="text-xl font-bold text-[#E8E8E8] tracking-tight leading-none">Timelines</h1>
          <p className="text-xs text-[#4A4A4A] mt-1">Build &amp; share client project roadmaps</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.14)] text-[rgba(139,156,182,0.7)] hover:bg-[rgba(139,156,182,0.10)] hover:text-[rgba(139,156,182,1)] transition-all"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New Timeline</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* ── Stats bar (only when data loaded) ── */}
      {!loading && timelines.length > 0 && (
        <div className="flex items-center gap-5 mb-5 px-1">
          <div className="flex items-center gap-1.5 text-[10px] text-[#4A4A4A]">
            <CalendarRange className="size-3 opacity-60" />
            <span className="tabular-nums font-semibold text-[#6B6B6B]">{timelines.length}</span>
            <span>timeline{timelines.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="w-px h-3 bg-[#2A2A2A]" />
          <div className="flex items-center gap-1.5 text-[10px] text-[#4A4A4A]">
            <Layers className="size-3 opacity-60" />
            <span className="tabular-nums font-semibold text-[#6B6B6B]">{totalPhases}</span>
            <span>phase{totalPhases !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      {!loading && timelines.length > 1 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-[#3A3A3A] pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search timelines…"
            className="w-full pl-8 pr-8 py-2 text-sm bg-[#111111] border border-[#222222] rounded-xl text-[#E8E8E8] placeholder:text-[#3A3A3A] focus:outline-none focus:border-[rgba(139,156,182,0.2)] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A3A3A] hover:text-[#A0A0A0] transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="flex gap-1.5">
            {[0, 120, 240].map(d => (
              <div
                key={d}
                className="w-1 h-1 rounded-full bg-[rgba(139,156,182,0.18)] animate-pulse"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
          <span className="text-[9px] text-[#3A3A3A] uppercase tracking-widest">Loading</span>
        </div>
      ) : timelines.length === 0 ? (
        <EmptyState onNew={() => setShowCreate(true)} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-[#4A4A4A] mb-2">No results for &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch('')} className="text-xs text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors">
            Clear search
          </button>
        </div>
      ) : (
        /* ── Table ── */
        <div className="rounded-xl border border-[#222222] overflow-hidden bg-[#111111]">
          {/* Column header */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1A1A1A] bg-[#0D0D0D]">
            <div className="w-3.5 shrink-0" /> {/* chevron spacer */}
            <div className="w-[72px] shrink-0">
              <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-[#333333]">Phases</span>
            </div>
            <div className="flex-1">
              <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-[#333333]">Timeline</span>
            </div>
            <div className="hidden lg:block w-[120px] shrink-0">
              <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-[#333333]">Date Range</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-[#333333] whitespace-nowrap">Count</span>
            </div>
            <div className="w-4 shrink-0" /> {/* key icon spacer */}
            <div className="w-[88px] shrink-0" /> {/* actions spacer */}
          </div>

          {/* Rows */}
          {filtered.map(t => (
            <TimelineRow
              key={t.id}
              timeline={t}
              onEditBlocks={() => setEditingTimeline(t)}
              onUpdate={updated =>
                setTimelines(prev => prev.map(x => (x.id === updated.id ? updated : x)))
              }
            />
          ))}
        </div>
      )}

      {/* ── Create modal ── */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={newTimeline => {
            setTimelines(prev => [newTimeline, ...prev])
            setEditingTimeline(newTimeline)
          }}
        />
      )}

      {/* ── Block editor ── */}
      {editingTimeline && (
        <TimelinesBlockEditor
          timeline={editingTimeline}
          onClose={() => setEditingTimeline(null)}
          onSave={updated => {
            setTimelines(prev => prev.map(t => (t.id === updated.id ? updated : t)))
            setEditingTimeline(updated)
          }}
        />
      )}
    </div>
  )
}
