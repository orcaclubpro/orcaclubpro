'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Loader2, Plus, Trash2, Pencil, Check, X, ArrowRight, CalendarPlus, Search,
  CornerDownLeft, Milestone, Receipt, ListChecks, CircleCheck, Circle, CircleDot,
  AlertTriangle, Lock, FileDown, FileText, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isTypingTarget } from '@/lib/keyboard'
import { PackageBuilderModal, type ExistingProposal } from './PackageBuilderModal'
import { getPackageForBuilder } from '@/actions/package-builder'
import { SchedulePaymentInvoiceModal } from './SchedulePaymentInvoiceModal'
import { PackageRecapModal } from './PackageRecapModal'
import { EmailPackageModal } from './EmailPackageModal'
import { WORK_CATEGORY_LABEL, type WorkCategory } from '@/lib/packages/workLines'
import type { PackageRecapData } from '@/lib/packages/recap'
import {
  getMilestonePortfolio,
  getPackageWorkSummary,
  logPackageWork,
  createPackagePlan,
  logPlannedWork,
  updateWorkEntry,
  deleteWorkEntry,
  type MilestonePortfolioRow,
  type WorkEntryRow,
  type ScheduleRow,
} from '@/actions/packageWork'

// ─── The Milestones station — a focus flow ────────────────────────────────────
// The fixed-price sibling of the Retainer station, and the home of ALL non-recurring
// work: Build creates the proposal, this runs it. Same grammar: landing is an
// autofocused board of every package with a pending scheduled payment, plus every
// draft still being scoped (type, ↑↓, ↵). Once a package is picked, a persistent header holds the client, the package
// and the stage tabs; the body shows exactly one stage: Overview · Plan · Log ·
// Documents. Esc walks back one level (recap composer → send modal → editor →
// board). Keys 1–4 jump stages while not typing.
//
// Billing lives on documents and rows, not on a stage: the Overview payment
// schedule sends a pending payment (SchedulePaymentInvoiceModal — the one and only
// send path), and the Documents stage exports the work-log sheet or composes the
// recap, which can hand off to that same send modal.
//
// Work entries are consumed by an invoice, never moved: once an entry carries a
// `billedOrderId` the client has seen it on a document, so it renders frozen —
// greyed, tagged "billed", with no edit or delete controls (the actions reject
// those server-side too).

type Stage = 'overview' | 'plan' | 'log' | 'documents'

const STAGES: { id: Stage; label: string; icon: typeof Milestone }[] = [
  { id: 'overview',  label: 'Overview',  icon: Milestone },
  { id: 'plan',      label: 'Plan',      icon: CalendarPlus },
  { id: 'log',       label: 'Log',       icon: Plus },
  { id: 'documents', label: 'Documents', icon: FileText },
]

const CATEGORIES = Object.keys(WORK_CATEGORY_LABEL) as WorkCategory[]

/** The success half of a work summary — everything one package's stages render from. */
type WorkSummary = Extract<Awaited<ReturnType<typeof getPackageWorkSummary>>, { success: true }>

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}
function fmtHrs(n: number | null | undefined) {
  return `${Math.round((n ?? 0) * 100) / 100}`
}
function fmtDay(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (!isFinite(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
function toDayInput(iso: string | null | undefined) {
  return iso ? String(iso).slice(0, 10) : ''
}
function todayInput() {
  return new Date().toISOString().slice(0, 10)
}
/** A schedule entry is still open until it has both an order and an invoice date. */
function isPendingEntry(s: ScheduleRow) {
  return !(s.orderId && s.invoicedAt)
}

// ── Shared styles (verbatim from RetainerTab) ────────────────────────────────
const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const selectCls =
  'px-2.5 py-2 text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-secondary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const numCls =
  'text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] px-3 py-2 focus:outline-none focus:border-[rgba(139,156,182,0.20)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
const accentBtn =
  'flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50'
const ghostBtn =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-all disabled:opacity-50'
const fieldLabel = 'text-[10px] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]'

// ── Component ─────────────────────────────────────────────────────────────────

export interface MilestonesTabProps {
  /** Preselect this client's packages when launched from a search result. */
  clientId?: string
  /** Needed by the package builder this station can open. */
  username: string
  /** Deep-link straight to a package's Documents stage for one schedule entry. */
  /** entryId is optional: a proposal handed over from Build has no schedule yet. */
  initialTarget?: { packageId: string; entryId?: string | null } | null
}

export function MilestonesTab({ clientId, username, initialTarget }: MilestonesTabProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  // Board
  const [portfolio, setPortfolio] = useState<MilestonePortfolioRow[]>([])
  const [portfolioLoaded, setPortfolioLoaded] = useState(false)
  const [pickQuery, setPickQuery] = useState('')
  const [pickIdx, setPickIdx] = useState(0)
  const pickerRef = useRef<HTMLInputElement>(null)
  const pickListRef = useRef<HTMLDivElement>(null)

  // Selection
  const [packageId, setPackageId] = useState<string>(initialTarget?.packageId ?? '')
  const [stage, setStage] = useState<Stage>(initialTarget?.entryId ? 'documents' : 'overview')
  const [summary, setSummary] = useState<WorkSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Per-stage autofocus targets
  const planRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLInputElement>(null)

  // Log form
  const [logDate, setLogDate] = useState(todayInput())
  const [logHoursStr, setLogHoursStr] = useState('')
  const [logCategory, setLogCategory] = useState<WorkCategory>('work')
  const [logDesc, setLogDesc] = useState('')
  const [logging, setLogging] = useState(false)

  // Plan form
  const [planDate, setPlanDate] = useState(todayInput())
  const [planCategory, setPlanCategory] = useState<WorkCategory>('work')
  const [planDesc, setPlanDesc] = useState('')
  const [planning, setPlanning] = useState(false)

  // Inline entry editor (shared by planned + logged)
  const [editId, setEditId] = useState<string | null>(null)
  const [eLogMode, setELogMode] = useState(false) // true = logging a planned item as done
  const [eShowHours, setEShowHours] = useState(false)
  const [eDate, setEDate] = useState('')
  const [eHours, setEHours] = useState('')
  const [eCategory, setECategory] = useState<WorkCategory>('work')
  const [eDesc, setEDesc] = useState('')
  const [eSaving, setESaving] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Recap / send flow — drafts keyed by schedule-entry id so one can never attach
  // to a different payment. `docEntryId` is the payment the Documents stage is
  // pointed at; `sendEntryId` is the payment the send modal is open for.
  const [docEntryId, setDocEntryId] = useState<string | null>(initialTarget?.entryId ?? null)
  const [sendEntryId, setSendEntryId] = useState<string | null>(initialTarget?.entryId ?? null)
  const [recapOpen, setRecapOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [recapDrafts, setRecapDrafts] = useState<Record<string, PackageRecapData>>({})

  // ── Editing the package itself ─────────────────────────────────────────────
  // Milestones tracks the WORK against a package; the package's own lines, schedule
  // and copy live in the builder. Scope changes surface here first — a client asks for
  // something mid-project — so the builder opens over this station rather than sending
  // staff to the packages page and back.
  const [builderDoc, setBuilderDoc] = useState<ExistingProposal | null>(null)
  const [openingBuilder, setOpeningBuilder] = useState(false)

  async function openBuilder() {
    if (!packageId || openingBuilder) return
    setOpeningBuilder(true)
    setError(null)
    try {
      const res = await getPackageForBuilder(packageId, 'edit')
      if (!res.success) { setError(res.error ?? 'Could not open the package builder'); return }
      setBuilderDoc(res.package as ExistingProposal)
    } finally {
      setOpeningBuilder(false)
    }
  }

  /** The station is kept mounted-but-hidden by the console; only act when on screen. */
  const isVisible = useCallback(() => Boolean(rootRef.current?.offsetParent), [])

  // A deep link can arrive after mount (the console keeps this station alive), so
  // honour a *changed* target rather than only the initial one.
  const appliedTargetRef = useRef<string | null>(
    initialTarget ? `${initialTarget.packageId}:${initialTarget.entryId ?? ''}` : null,
  )
  useEffect(() => {
    if (!initialTarget?.packageId) return
    const key = `${initialTarget.packageId}:${initialTarget.entryId ?? ''}`
    if (appliedTargetRef.current === key) return
    appliedTargetRef.current = key
    setPackageId(initialTarget.packageId)
    setRecapOpen(false)
    // An entry-less target is a package with no schedule yet — a proposal just built
    // in Build. There is no document to compose, so land on Overview instead.
    if (initialTarget.entryId) {
      setStage('documents')
      setDocEntryId(initialTarget.entryId)
      setSendEntryId(initialTarget.entryId)
    } else {
      setStage('overview')
      setDocEntryId(null)
      setSendEntryId(null)
    }
  }, [initialTarget])

  // ── Loading ─────────────────────────────────────────────────────────────────

  const loadPortfolio = useCallback(async () => {
    const r = await getMilestonePortfolio()
    if (r.success) setPortfolio(r.rows)
    else setError(r.error ?? 'Failed to load milestone packages')
    setPortfolioLoaded(true)
  }, [])

  // The board refreshes whenever it is showing, so counts reflect work logged
  // moments ago inside a package.
  useEffect(() => {
    if (packageId) return
    void loadPortfolio()
  }, [packageId, loadPortfolio])

  const load = useCallback(async () => {
    if (!packageId) { setSummary(null); return }
    const r = await getPackageWorkSummary(packageId)
    if (r.success) setSummary(r)
    else { setSummary(null); setError(r.error ?? 'Failed to load this package') }
  }, [packageId])

  useEffect(() => {
    if (!packageId) { void load(); return }
    let alive = true
    setLoading(true); setError(null)
    ;(async () => { await load(); if (alive) setLoading(false) })()
    return () => { alive = false }
  }, [packageId, load])

  // ── Board: filtering + selection ────────────────────────────────────────────

  const pq = pickQuery.trim().toLowerCase()
  const scoped = clientId ? portfolio.filter((r) => r.clientAccountId === clientId) : portfolio
  const filtered = pq
    ? scoped.filter((r) =>
        r.clientName.toLowerCase().includes(pq) ||
        (r.clientCompany ?? '').toLowerCase().includes(pq) ||
        r.packageName.toLowerCase().includes(pq))
    : scoped
  const highlightIdx = Math.min(pickIdx, Math.max(0, filtered.length - 1))

  useEffect(() => { setPickIdx(0) }, [pickQuery])

  useEffect(() => {
    const el = pickListRef.current?.querySelector(`[data-pick-idx="${highlightIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlightIdx])

  function selectPackage(id: string) {
    setPackageId(id)
    setStage('overview')
    setError(null)
    setPickQuery('')
    setPickIdx(0)
    setEditId(null)
    setELogMode(false)
    setDocEntryId(null)
    setSendEntryId(null)
    setRecapOpen(false)
    setRecapDrafts({})
    setLogDate(todayInput())
    setPlanDate(todayInput())
  }

  const clearPackage = useCallback(() => {
    setPackageId('')
    setSummary(null)
    setStage('overview')
    setError(null)
    setEditId(null)
    setELogMode(false)
    setDocEntryId(null)
    setSendEntryId(null)
    setRecapOpen(false)
    setPickQuery('')
    setPickIdx(0)
  }, [])

  // ── Focus management — the board owns focus on entry; Plan/Log focus their
  // primary input so a stage switch lands ready to type.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isVisible()) return
      if (!packageId) pickerRef.current?.focus()
      else if (!loading && stage === 'plan') planRef.current?.focus()
      else if (!loading && stage === 'log') logRef.current?.focus()
    }, 60)
    return () => clearTimeout(t)
  }, [packageId, stage, loading, isVisible])

  // ── Esc walks back one level (recap composer → send modal → editor → board);
  // the final Esc from the board bubbles to the console, which collapses to
  // search. 1–4 jump stages while not typing. Capture phase so we run before the
  // console (which also means we own closing the modals — their own listeners
  // never see the event).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isVisible()) return
      if (e.key === 'Escape') {
        if (!packageId) return // board level — let the console handle it
        e.preventDefault()
        e.stopPropagation()
        // The builder is a whole tool on top of this station, with its own nested
        // dialogs. Let it keep the key — closing it from here would yank the surface
        // out from under a picker that is still open.
        if (builderDoc) { e.stopPropagation(); return }
        if (recapOpen) { setRecapOpen(false); return }
        if (sendEntryId) { setSendEntryId(null); return }
        if (editId) { setEditId(null); setELogMode(false); return }
        clearPackage()
        return
      }
      if (e.key >= '1' && e.key <= '4' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (isTypingTarget(e.target)) return
        if (!packageId || loading || sendEntryId || recapOpen || builderDoc) return
        setStage(STAGES[Number(e.key) - 1].id)
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [packageId, sendEntryId, recapOpen, editId, loading, builderDoc, clearPackage, isVisible])

  // ── Derived ─────────────────────────────────────────────────────────────────

  const pending = summary?.pending ?? []
  const billed = summary?.billed ?? []
  const planned = summary?.planned ?? []
  const schedule = summary?.schedule ?? []
  const plannedOpen = planned.filter((p) => p.completion !== 'complete')
  const pendingEntries = schedule.filter(isPendingEntry)
  const pendingHours = pending.reduce((s, e) => s + (e.hours ?? 0), 0)

  // The Documents stage always points at a payment: keep the selection on the next
  // pending one whenever the current pick is gone (just invoiced, package swapped).
  useEffect(() => {
    if (loading) return
    if (docEntryId && pendingEntries.some((s) => s.id === docEntryId)) return
    setDocEntryId(pendingEntries[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, packageId, summary])

  const docEntry = docEntryId ? schedule.find((s) => s.id === docEntryId) ?? null : null
  const sendEntry = sendEntryId ? schedule.find((s) => s.id === sendEntryId) ?? null : null

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleLog() {
    setError(null)
    if (!packageId) return
    if (!logDesc.trim()) { setError('Describe the work') ; return }
    setLogging(true)
    const r = await logPackageWork({
      packageId,
      date: logDate || todayInput(),
      hours: logHoursStr === '' ? undefined : parseFloat(logHoursStr),
      category: logCategory,
      description: logDesc.trim(),
    })
    if (r.success) {
      setLogDesc(''); setLogHoursStr('')
      await load()
      logRef.current?.focus()
    } else setError(r.error ?? 'Failed to log work')
    setLogging(false)
  }

  async function handlePlan() {
    setError(null)
    if (!packageId) return
    if (!planDesc.trim()) { setError('Describe the planned work'); return }
    setPlanning(true)
    const r = await createPackagePlan({
      packageId,
      date: planDate || todayInput(),
      category: planCategory,
      description: planDesc.trim(),
    })
    if (r.success) { setPlanDesc(''); await load(); planRef.current?.focus() }
    else setError(r.error ?? 'Failed to add planned item')
    setPlanning(false)
  }

  // logMode on a planned item opens the editor in "log" mode: saving creates a
  // SEPARATE logged entry and marks the plan complete — the plan stays listed.
  function openEditor(entry: WorkEntryRow, logMode = false) {
    const isLog = logMode && entry.status === 'planned'
    setEditId(entry.id)
    setELogMode(isLog)
    setEShowHours(isLog || entry.status === 'logged')
    setEDate(toDayInput(entry.date))
    setEHours(isLog ? '' : entry.hours != null ? String(entry.hours) : '')
    setECategory(entry.category ?? 'work')
    setEDesc(entry.description ?? '')
  }

  async function handleEditorSave() {
    if (!editId) return
    setError(null)

    if (eLogMode) {
      if (!eDesc.trim()) { setError('Describe the work'); return }
      setESaving(true)
      const r = await logPlannedWork({
        planId: editId,
        date: eDate || undefined,
        hours: eHours === '' ? undefined : parseFloat(eHours),
        category: eCategory,
        description: eDesc.trim(),
      })
      if (r.success) { setEditId(null); setELogMode(false); await load() }
      else setError(r.error ?? 'Failed to log planned work')
      setESaving(false)
      return
    }

    setESaving(true)
    const r = await updateWorkEntry({
      id: editId,
      date: eDate || undefined,
      hours: eHours === '' ? undefined : parseFloat(eHours),
      category: eCategory,
      description: eDesc,
    })
    if (r.success) { setEditId(null); await load() }
    else setError(r.error ?? 'Failed to update entry')
    setESaving(false)
  }

  async function handleToggleComplete(entry: WorkEntryRow) {
    setError(null)
    const next = entry.completion === 'complete' ? 'incomplete' : 'complete'
    const r = await updateWorkEntry({ id: entry.id, completion: next })
    if (r.success) await load()
    else setError(r.error ?? 'Failed to update status')
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const r = await deleteWorkEntry(id)
    if (r.success) await load()
    else setError(r.error ?? 'Failed to delete entry')
    setDeletingId(null)
  }

  // The work-log sheet covers the whole package, so it needs no entry — a plain GET.
  function handleExportWorkLog() {
    if (!packageId) return
    window.open(`/api/packages/${packageId}/worklog/pdf`, '_blank')
  }

  // Inline editor row (shared by planned + logged). In log mode saving creates a
  // separate logged entry against the plan (see handleEditorSave).
  const renderEditor = () => (
    <div className="space-y-1.5">
      {eLogMode && (
        <p className="text-[10px] text-[var(--space-text-muted)] px-1">
          Logging this keeps the item in Planned Work and marks it complete.
        </p>
      )}
      <div className="flex items-end gap-2 flex-wrap px-3 py-2.5 rounded-lg border border-[var(--space-accent)] bg-[var(--space-bg-card-hover)]">
        <input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} className={cn(numCls, 'w-36 text-xs py-1.5')} />
        {eShowHours && (
          <input type="number" min={0} step="0.25" value={eHours} onChange={(e) => setEHours(e.target.value)} placeholder="Hrs" autoFocus={eLogMode} className={cn(numCls, 'w-16 text-xs py-1.5')} />
        )}
        <select value={eCategory} onChange={(e) => setECategory(e.target.value as WorkCategory)} className={cn(selectCls, 'py-1.5')}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{WORK_CATEGORY_LABEL[c]}</option>)}
        </select>
        <input value={eDesc} onChange={(e) => setEDesc(e.target.value)} placeholder="Description" className={cn(inputCls, 'flex-1 min-w-[140px] py-1.5 text-xs')} />
        <button onClick={handleEditorSave} disabled={eSaving} className={accentBtn}>
          {eSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} {eLogMode ? 'Log' : 'Save'}
        </button>
        <button onClick={() => { setEditId(null); setELogMode(false) }} className="size-8 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )

  // One logged entry. Billed entries are frozen — greyed, tagged, no controls.
  const renderLoggedRow = (e: WorkEntryRow) => {
    const isBilled = Boolean(e.billedOrderId)
    if (!isBilled && editId === e.id) return <div key={e.id}>{renderEditor()}</div>
    return (
      <div
        key={e.id}
        className={cn(
          'flex items-center gap-3 px-3.5 py-3 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]',
          isBilled && 'opacity-55',
        )}
      >
        <span className="text-[11px] font-mono tabular-nums text-[var(--space-text-muted)] shrink-0 w-14">{String(e.date).slice(5, 10)}</span>
        <span className="text-sm font-bold tabular-nums text-[var(--space-text-primary)] shrink-0 w-12">
          {e.hours != null && e.hours > 0 ? `${fmtHrs(e.hours)}h` : '—'}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-[var(--space-text-muted)] shrink-0 w-20">{WORK_CATEGORY_LABEL[e.category ?? 'work']}</span>
        <span className="text-xs text-[var(--space-text-tertiary)] flex-1 min-w-0 truncate">{e.description || '—'}</span>
        {isBilled ? (
          <span
            className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded border border-[var(--space-border-hard)] text-[var(--space-text-muted)]"
            title="Already on an invoice — frozen"
          >
            <Lock className="size-2.5" /> billed
          </span>
        ) : (
          <>
            <button onClick={() => openEditor(e)} className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors" title="Edit entry">
              <Pencil className="size-3.5" />
            </button>
            <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id} className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 hover:bg-[var(--space-bg-card)] transition-colors disabled:opacity-50" title="Delete entry">
              {deletingId === e.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </button>
          </>
        )}
      </div>
    )
  }

  // ── Stage 0 — the portfolio board ───────────────────────────────────────────

  if (!packageId) {
    const needsRecapCount = filtered.filter((r) => r.needsRecap).length
    return (
      <div ref={rootRef} className="relative flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto w-full pt-[4vh] pb-8 space-y-5">
            <div className="text-center space-y-1.5">
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[var(--space-text-tertiary)]">Milestones</p>
              <p className="text-xs text-[var(--space-text-muted)]">
                Open a package to log the work its next payment will document.
              </p>
            </div>

            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors"
              style={{ background: 'var(--space-bg-card-hover)', borderColor: 'var(--space-accent-glow)' }}
            >
              <Search className="size-4 shrink-0" style={{ color: 'var(--space-accent)' }} />
              <input
                ref={pickerRef}
                value={pickQuery}
                onChange={(e) => setPickQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setPickIdx((i) => Math.min(filtered.length - 1, i + 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setPickIdx((i) => Math.max(0, i - 1))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    const row = filtered[highlightIdx]
                    if (row) selectPackage(row.packageId)
                  } else if (e.key === 'Escape' && pickQuery) {
                    // First Esc clears the query; an Esc on an empty box bubbles
                    // to the console and collapses the station to search.
                    e.stopPropagation()
                    setPickQuery('')
                  }
                }}
                placeholder="Search packages or clients…"
                className="flex-1 bg-transparent text-sm text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] outline-none"
              />
              <kbd className="hidden sm:inline text-[10px] text-[var(--space-text-muted)] bg-[var(--space-bg-base)] border border-[var(--space-border-hard)] rounded px-1.5 py-0.5 font-mono">↵</kbd>
            </div>

            {!portfolioLoaded ? (
              <div className="flex justify-center py-12"><Loader2 className="size-4 text-[var(--space-text-muted)] animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-xs text-[var(--space-text-muted)] py-12">
                {pq
                  ? `No packages match “${pickQuery}”.`
                  : 'No proposal packages with a pending scheduled payment.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[var(--space-text-muted)]">
                    Packages · {filtered.length}
                  </p>
                  {needsRecapCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                      <AlertTriangle className="size-3" /> {needsRecapCount} need a recap
                    </span>
                  )}
                </div>
                <div ref={pickListRef} className="space-y-1.5">
                  {filtered.map((row, i) => (
                    <BoardRow
                      key={row.packageId}
                      row={row}
                      idx={i}
                      isSel={i === highlightIdx}
                      onSelect={() => selectPackage(row.packageId)}
                      onHover={() => setPickIdx(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
          </div>
        </div>
      </div>
    )
  }

  // ── Stages 1–4 — package selected ───────────────────────────────────────────

  return (
    <div ref={rootRef} className="relative flex flex-col h-full min-h-0">
      {/* ── Persistent header: client · package · stage tabs ── */}
      <div className="shrink-0 border-b border-[var(--space-border-hard)] px-4 sm:px-6 pt-3">
        <div className="flex items-center gap-3 pb-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--space-text-primary)] truncate">
              {summary?.package.clientName ?? '…'}
              {summary?.package.clientCompany && (
                <span className="font-normal text-[var(--space-text-muted)]"> · {summary.package.clientCompany}</span>
              )}
            </p>
            {summary && (
              <p className="text-xs text-[var(--space-text-muted)] mt-0.5 truncate">
                <span className="font-semibold" style={{ color: 'var(--space-accent)' }}>{summary.package.name}</span>
                <span className="tabular-nums"> · {pending.length} unbilled · {plannedOpen.length} planned open</span>
              </p>
            )}
          </div>
          <button
            onClick={() => void openBuilder()}
            disabled={!packageId || openingBuilder}
            className={ghostBtn}
            title="Edit this package's line items, schedule and copy"
          >
            {openingBuilder ? <Loader2 className="size-3 animate-spin" /> : <Pencil className="size-3" />} Edit package
          </button>
          <button onClick={clearPackage} className={ghostBtn} title="Change package (esc)">
            <Search className="size-3" /> Change package
          </button>
        </div>

        {summary && !loading && (
          <div className="flex items-center gap-1 pb-2 -ml-1">
            {STAGES.map((s, i) => {
              const Icon = s.icon
              const isActive = stage === s.id
              const count = s.id === 'plan' ? planned.length : s.id === 'log' ? pending.length : null
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s.id)}
                  title={`${s.label} (${i + 1})`}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'text-[var(--space-accent)]'
                      : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)]',
                  )}
                  style={isActive ? { background: 'var(--space-accent-soft)' } : undefined}
                >
                  <Icon className="size-3.5" />
                  {s.label}
                  {count !== null && count > 0 && (
                    <span className={cn('text-[10px] tabular-nums', isActive ? 'opacity-70' : 'text-[var(--space-text-muted)]')}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Stage body ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto w-full space-y-5">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="size-5 text-[var(--space-text-muted)] animate-spin" /></div>
          ) : !summary ? (
            <p className="text-center text-xs text-[var(--space-text-muted)] py-16">This package could not be loaded.</p>
          ) : (
            <>
              {/* ── Overview ── */}
              {stage === 'overview' && (
                <>
                  {/* Payment schedule — where this package stands */}
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-4 sm:p-5 bg-[var(--space-bg-card-hover)] space-y-3">
                    <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[var(--space-text-tertiary)] flex items-center gap-1.5">
                      <Milestone className="size-3" /> Payment schedule
                    </p>
                    {schedule.length === 0 ? (
                      <p className="text-xs text-[var(--space-text-muted)]">No scheduled payments on this package yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {schedule.map((s) => {
                          const state = s.paid ? 'paid' : s.invoicedAt ? 'invoiced' : 'pending'
                          const sendable = isPendingEntry(s)
                          const body = (
                            <>
                              {state === 'paid' ? (
                                <CircleCheck className="size-3.5 shrink-0" style={{ color: 'var(--space-accent)' }} />
                              ) : state === 'invoiced' ? (
                                <CircleDot className="size-3.5 shrink-0 text-amber-500" />
                              ) : (
                                <Circle className="size-3.5 shrink-0 text-[var(--space-text-muted)]" />
                              )}
                              <span className={cn('text-xs flex-1 min-w-0 truncate', state === 'pending' ? 'text-[var(--space-text-tertiary)]' : 'text-[var(--space-text-secondary)]')}>
                                {s.label || 'Payment'}
                              </span>
                              <span className="text-[10px] uppercase tracking-wide text-[var(--space-text-muted)] shrink-0 w-16 text-right">{state}</span>
                              <span className="text-[11px] tabular-nums text-[var(--space-text-muted)] shrink-0 w-24 text-right">{fmtDay(s.dueDate) || '—'}</span>
                              <span className="text-xs font-semibold tabular-nums text-[var(--space-text-primary)] shrink-0 w-20 text-right">{fmt(s.amount)}</span>
                            </>
                          )
                          return sendable ? (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSendEntryId(s.id)}
                              title="Send this payment"
                              className="group w-full flex items-center gap-3 py-1.5 px-1.5 -mx-1.5 rounded-lg text-left transition-colors hover:bg-[var(--space-bg-card)]"
                            >
                              {body}
                              <Send className="size-3 shrink-0 text-[var(--space-text-muted)] opacity-0 group-hover:opacity-70 transition-opacity" />
                            </button>
                          ) : (
                            <div key={s.id} className="flex items-center gap-3 py-1.5 px-1.5 -mx-1.5">
                              {body}
                              <span className="size-3 shrink-0" />
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {pendingEntries.length > 0 && (
                      <p className="text-[10px] text-[var(--space-text-muted)]">
                        Pick a pending payment to send its invoice.
                      </p>
                    )}
                  </div>

                  {/* Quick log — the day-to-day action, without a stage switch */}
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-3 bg-[var(--space-bg-card-hover)] flex items-end gap-2 flex-wrap">
                    <label className="block">
                      <span className={fieldLabel}>Hrs</span>
                      <input
                        type="number" min={0} step="0.25" value={logHoursStr}
                        onChange={(e) => setLogHoursStr(e.target.value)}
                        placeholder="—" className={cn(numCls, 'w-16 mt-1 py-1.5 text-sm')}
                      />
                    </label>
                    <input
                      value={logDesc}
                      onChange={(e) => setLogDesc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !logging) void handleLog() }}
                      placeholder="Log work on this package — what did you do? ↵"
                      className={cn(inputCls, 'flex-1 min-w-[160px] py-1.5')}
                    />
                    <button onClick={handleLog} disabled={logging} className={accentBtn}>
                      {logging ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Log
                    </button>
                  </div>

                  {/* Unbilled work — what the next payment will document */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--space-accent)] flex items-center gap-1.5">
                      <ListChecks className="size-3" /> Unbilled work · {pending.length}
                      {pendingHours > 0 && <span className="text-[var(--space-text-muted)] tracking-normal normal-case font-medium">{fmtHrs(pendingHours)}h</span>}
                    </p>
                    {pending.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-8 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
                        <ListChecks className="size-5 text-[var(--space-text-muted)]" />
                        <p className="text-xs text-[var(--space-text-muted)]">No unbilled work logged yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">{pending.slice(0, 5).map(renderLoggedRow)}</div>
                    )}
                    {pending.length > 5 && (
                      <button onClick={() => setStage('log')} className="text-[11px] font-semibold text-[var(--space-accent)] hover:underline px-1">
                        See all {pending.length} entries
                      </button>
                    )}
                  </div>

                  {/* Jump cards — the full stages */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <JumpCard
                      icon={CalendarPlus}
                      title="Plan work"
                      hint={planned.length > 0 ? `${planned.length} planned · ${plannedOpen.length} open` : 'Nothing planned yet'}
                      onClick={() => setStage('plan')}
                    />
                    <JumpCard
                      icon={Plus}
                      title="Log work"
                      hint={pending.length > 0 ? `${pending.length} unbilled · ${billed.length} billed` : 'Nothing logged yet'}
                      onClick={() => setStage('log')}
                    />
                    <JumpCard
                      icon={FileText}
                      title="Documents"
                      hint={pendingEntries.length > 0 ? `Work log & recap · ${pendingEntries.length} payment${pendingEntries.length === 1 ? '' : 's'} open` : 'Work log & recap'}
                      onClick={() => setStage('documents')}
                    />
                  </div>
                </>
              )}

              {/* ── Plan ── */}
              {stage === 'plan' && (
                <>
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-4 space-y-3 bg-[var(--space-bg-card-hover)]">
                    <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[var(--space-text-tertiary)] flex items-center gap-1.5">
                      <CalendarPlus className="size-3" /> Plan work — what&apos;s left on this package
                    </p>
                    <input
                      ref={planRef}
                      value={planDesc}
                      onChange={(e) => setPlanDesc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !planning) void handlePlan() }}
                      placeholder="Describe a task, ↵ to add…"
                      className={inputCls}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} className={cn(numCls, 'text-xs py-1.5')} />
                      <select value={planCategory} onChange={(e) => setPlanCategory(e.target.value as WorkCategory)} className={selectCls}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{WORK_CATEGORY_LABEL[c]}</option>)}
                      </select>
                      <button onClick={handlePlan} disabled={planning} className={cn(accentBtn, 'ml-auto')}>
                        {planning ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Plan
                      </button>
                    </div>
                  </div>

                  {planned.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
                      <CalendarPlus className="size-5 text-[var(--space-text-muted)]" />
                      <p className="text-xs text-[var(--space-text-muted)]">Nothing planned on this package yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {planned.map((e) => editId === e.id ? (
                        <div key={e.id}>{renderEditor()}</div>
                      ) : (
                        <div key={e.id} className={cn(
                          'flex items-center gap-3 px-3.5 py-3 rounded-lg border border-dashed border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]',
                          e.completion === 'complete' && 'opacity-60',
                        )}>
                          <button
                            onClick={() => handleToggleComplete(e)}
                            className="shrink-0 size-5 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-accent)] transition-colors"
                            title={e.completion === 'complete' ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {e.completion === 'complete'
                              ? <CircleCheck className="size-4" style={{ color: 'var(--space-accent)' }} />
                              : <Circle className="size-4" />}
                          </button>
                          <span className="text-[11px] font-mono tabular-nums text-[var(--space-text-muted)] shrink-0 w-14">{String(e.date).slice(5, 10)}</span>
                          <span className="text-[10px] uppercase tracking-wide text-[var(--space-text-muted)] shrink-0 w-20">{WORK_CATEGORY_LABEL[e.category ?? 'work']}</span>
                          <span className={cn('text-sm flex-1 min-w-0 truncate', e.completion === 'complete' ? 'text-[var(--space-text-muted)] line-through' : 'text-[var(--space-text-secondary)]')}>
                            {e.description || '—'}
                          </span>
                          <button onClick={() => openEditor(e, false)} className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors" title="Edit planned item">
                            <Pencil className="size-3.5" />
                          </button>
                          <button onClick={() => openEditor(e, true)} className="shrink-0 flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-[var(--space-accent)] hover:bg-[var(--space-bg-card)] transition-colors" title="Log this planned work as done">
                            Log <ArrowRight className="size-3" />
                          </button>
                          <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id} className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 hover:bg-[var(--space-bg-card)] transition-colors disabled:opacity-50" title="Delete planned item">
                            {deletingId === e.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Log ── */}
              {stage === 'log' && (
                <>
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-4 space-y-3 bg-[var(--space-bg-card-hover)]">
                    <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[var(--space-text-tertiary)] flex items-center gap-1.5">
                      <Plus className="size-3" /> Log completed work
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <label className="block">
                        <span className={fieldLabel}>Date</span>
                        <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className={cn(numCls, 'w-full mt-1')} />
                      </label>
                      <label className="block">
                        <span className={fieldLabel}>Hours</span>
                        <input type="number" min={0} step="0.25" value={logHoursStr} onChange={(e) => setLogHoursStr(e.target.value)} placeholder="optional" className={cn(numCls, 'w-full mt-1')} />
                      </label>
                      <label className="block">
                        <span className={fieldLabel}>Category</span>
                        <select value={logCategory} onChange={(e) => setLogCategory(e.target.value as WorkCategory)} className={cn(selectCls, 'w-full mt-1 text-sm py-2')}>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{WORK_CATEGORY_LABEL[c]}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={logRef}
                        value={logDesc}
                        onChange={(e) => setLogDesc(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !logging) void handleLog() }}
                        placeholder="What did you do? ↵ to log"
                        className={cn(inputCls, 'flex-1')}
                      />
                      <button onClick={handleLog} disabled={logging} className={accentBtn}>
                        {logging ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Log
                      </button>
                    </div>
                    <p className="text-[10px] text-[var(--space-text-muted)]">
                      Hours are informational only — never billed. The next scheduled payment carries these as $0 lines.
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--space-accent)] mb-2.5">
                      Unbilled · {pending.length}
                    </p>
                    {pending.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-10 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
                        <ListChecks className="size-5 text-[var(--space-text-muted)]" />
                        <p className="text-xs text-[var(--space-text-muted)]">No unbilled work on this package.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">{pending.map(renderLoggedRow)}</div>
                    )}
                  </div>

                  {billed.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--space-text-muted)] mb-2.5">
                        Billed · {billed.length}
                      </p>
                      <div className="space-y-1.5">{billed.map(renderLoggedRow)}</div>
                    </div>
                  )}
                </>
              )}

              {/* ── Documents ── */}
              {stage === 'documents' && (
                <>
                  {/* A package recap is scoped to one scheduled payment — pick it first. */}
                  {pendingEntries.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
                      <Receipt className="size-5 text-[var(--space-text-muted)]" />
                      <p className="text-xs text-[var(--space-text-muted)]">Every scheduled payment on this package is invoiced.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--space-text-muted)]">
                        Pending payments · {pendingEntries.length}
                      </p>
                      {pendingEntries.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setDocEntryId(s.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors',
                            docEntryId === s.id
                              ? 'bg-[var(--space-bg-card-hover)] border-[var(--space-accent-glow)]'
                              : 'border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card-hover)]',
                          )}
                        >
                          {docEntryId === s.id
                            ? <CircleCheck className="size-3.5 shrink-0" style={{ color: 'var(--space-accent)' }} />
                            : <Circle className="size-3.5 shrink-0 text-[var(--space-text-muted)]" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--space-text-secondary)] truncate">{s.label || 'Payment'}</p>
                            <p className="text-[11px] text-[var(--space-text-muted)] tabular-nums truncate">
                              {fmtDay(s.dueDate) || 'No due date'} · {pending.length} unbilled item{pending.length === 1 ? '' : 's'}
                            </p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-[var(--space-text-primary)] shrink-0">{fmt(s.amount)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DocCard
                      icon={FileDown}
                      title="Work log sheet"
                      desc="A line-item PDF of every logged and planned entry on this package — billed/pending state and the payment schedule."
                      actionLabel="Export PDF"
                      onClick={handleExportWorkLog}
                    />
                    <DocCard
                      icon={FileText}
                      title="Payment recap"
                      desc="The client-facing recap for the selected payment — what it covers, what's left, and the notes that ride along on the invoice."
                      actionLabel="Compose recap"
                      disabled={!docEntry}
                      onClick={() => { if (docEntry) setRecapOpen(true) }}
                    />
                    {/* The pitch itself. Separate from the payment sends above: this is
                        the whole package as a document, not one scheduled payment, and
                        it is what a draft proposal needs before anything gets billed. */}
                    <DocCard
                      icon={Send}
                      title="Send the proposal"
                      desc="Email the whole package as a proposal, invoice copy, or SOW — line items, schedule, and a PDF. Creates no orders."
                      actionLabel="Compose email"
                      onClick={() => setEmailOpen(true)}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--space-text-muted)]">
                    The recap covers the selected payment — the work log sheet and the proposal cover the whole package.
                  </p>
                </>
              )}
            </>
          )}

          {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>

      {/* Editing the package itself. Reloads on close either way: the builder can change
          line items and the payment schedule, both of which this station renders. */}
      {builderDoc && (
        <PackageBuilderModal
          mode="edit"
          username={username}
          existing={builderDoc}
          onClose={() => { setBuilderDoc(null); void load() }}
        />
      )}

      {/* The one and only send path. */}
      {summary && sendEntry && (
        <SchedulePaymentInvoiceModal
          key={sendEntry.id}
          packageId={summary.package.id}
          packageName={summary.package.name}
          entry={{ id: sendEntry.id, label: sendEntry.label, amount: sendEntry.amount, dueDate: sendEntry.dueDate }}
          recapDraft={recapDrafts[sendEntry.id] ?? null}
          onRecapChange={(id, r) => setRecapDrafts((p) => ({ ...p, [id]: r }))}
          onClose={() => setSendEntryId(null)}
          onSent={() => { void load() }}
        />
      )}

      {/* The recap composer never sends anything itself — it hands the entry (and the
          narrative it just lifted into recapDrafts) to the send modal above. */}
      {summary && recapOpen && docEntry && (
        <PackageRecapModal
          key={docEntry.id}
          packageId={summary.package.id}
          packageName={summary.package.name}
          entryId={docEntry.id}
          entryLabel={docEntry.label || 'Payment'}
          draft={recapDrafts[docEntry.id] ?? null}
          onDraftChange={(m) => setRecapDrafts((p) => ({ ...p, [docEntry.id]: m }))}
          onSendInvoice={() => { setRecapOpen(false); setSendEntryId(docEntry.id) }}
          onClose={() => setRecapOpen(false)}
        />
      )}

      {/* The proposal send — the whole package as a document. Reloads on close so a
          status flip to 'sent' drops the draft marker off the board. */}
      {summary && emailOpen && (
        <EmailPackageModal
          packageId={summary.package.id}
          onClose={() => { setEmailOpen(false); void load() }}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// One package in the portfolio board — client, package, its next open payment,
// and how much unbilled work is waiting to document it.
function BoardRow({
  row, idx, isSel, onSelect, onHover,
}: { row: MilestonePortfolioRow; idx: number; isSel: boolean; onSelect: () => void; onHover: () => void }) {
  return (
    <button
      type="button"
      data-pick-idx={idx}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors relative',
        isSel ? 'bg-[var(--space-bg-card-hover)] border-[var(--space-accent-glow)]' : 'border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card-hover)]',
      )}
    >
      {isSel && <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full" style={{ background: 'var(--space-accent)', opacity: 0.7 }} />}
      <span
        className="size-2 rounded-full shrink-0"
        style={{
          background: row.needsRecap ? 'rgb(245 158 11)' : 'var(--space-accent)',
          // A draft is not yet a commitment — hollow it out so the board reads at a
          // glance as "billable work" vs "still being scoped".
          opacity: row.isDraft && !row.nextEntry ? 0.35 : 1,
        }}
        title={row.needsRecap ? 'Payment due soon with unbilled work' : row.isDraft ? 'Draft proposal — still being scoped' : 'On track'}
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', isSel ? 'text-[var(--space-text-primary)] font-medium' : 'text-[var(--space-text-secondary)]')}>
          {row.clientName}
          {row.clientCompany && <span className="font-normal text-[var(--space-text-muted)]"> · {row.clientCompany}</span>}
        </p>
        <p className="text-[11px] text-[var(--space-text-muted)] truncate">{row.packageName}</p>
      </div>

      {row.needsRecap && (
        <span className="hidden sm:flex shrink-0 items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded border border-amber-500/30 bg-amber-500/10 text-amber-500">
          <AlertTriangle className="size-2.5" /> recap
        </span>
      )}
      <span className="text-[11px] tabular-nums text-[var(--space-text-muted)] shrink-0 w-16 text-right">
        {row.pendingWorkCount} unbilled
      </span>
      <div className="shrink-0 w-[104px] text-right">
        <p className="text-xs font-semibold tabular-nums text-[var(--space-text-secondary)]">
          {row.nextEntry ? fmt(row.nextEntry.amount) : row.isDraft ? 'Draft' : '—'}
        </p>
        <p className="text-[10px] tabular-nums text-[var(--space-text-muted)] truncate">
          {row.nextEntry?.dueDate
            ? fmtDay(row.nextEntry.dueDate)
            : row.nextEntry?.label || (row.isDraft ? 'Not scheduled' : 'No due date')}
        </p>
      </div>
      {isSel && <CornerDownLeft className="size-3 shrink-0 opacity-60" style={{ color: 'var(--space-accent)' }} />}
    </button>
  )
}

function JumpCard({
  icon: Icon, title, hint, onClick,
}: { icon: typeof Milestone; title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-colors border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] hover:border-[var(--space-accent-glow)]"
    >
      <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--space-accent-soft)' }}>
        <Icon className="size-4" style={{ color: 'var(--space-accent)' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--space-text-primary)] leading-tight">{title}</p>
        <p className="text-[10px] text-[var(--space-text-muted)] mt-0.5 truncate">{hint}</p>
      </div>
      <ArrowRight className="size-3.5 shrink-0 text-[var(--space-text-muted)] opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" />
    </button>
  )
}

// One document on the Documents stage — mirrors RetainerTab's DocCard.
function DocCard({
  icon: Icon, title, desc, actionLabel, onClick, disabled,
}: { icon: typeof Milestone; title: string; desc: string; actionLabel: string; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] p-4">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--space-accent-soft)' }}>
          <Icon className="size-4" style={{ color: 'var(--space-accent)' }} />
        </div>
        <p className="text-sm font-semibold text-[var(--space-text-primary)]">{title}</p>
      </div>
      <p className="text-xs text-[var(--space-text-muted)] leading-relaxed flex-1">{desc}</p>
      <button onClick={onClick} disabled={disabled} className={cn(accentBtn, 'self-start')}>
        {actionLabel}
      </button>
    </div>
  )
}
