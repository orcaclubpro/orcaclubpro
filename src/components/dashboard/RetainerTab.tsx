'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Loader2, Clock, Plus, Trash2, ChevronLeft, ChevronRight, Pencil,
  CalendarClock, PowerOff, FileDown, Check, X, ArrowRight, CalendarPlus, FileText,
  CircleCheck, Circle, Search, Building2, CornerDownLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RetainerRecapModal } from './RetainerRecapModal'
import { getClientAccountsList } from '@/actions/packages'
import {
  getRetainerSummary,
  setRetainer,
  setRetainerActive,
  setRetainerAnchor,
  sendRetainerBilling,
  logHours,
  logPlannedHours,
  createDraft,
  updateTimeEntry,
  deleteTimeEntry,
  type RetainerDoc,
  type TimeEntryDoc,
  type RetainerTotals,
  type RetainerTerms,
  type RetainerScheduled,
  type RetainerBilling,
  type RetainerTier,
  type TimeEntryCategory,
  type TimeEntryPriority,
} from '@/actions/retainers'
import type { Cycle } from '@/lib/retainers/cycle'

// ─── The Retainer station — a focus flow ─────────────────────────────────────
// One thing on screen at a time. Landing is an autofocused client search (type,
// ↑↓, ↵). Once a client is picked, a persistent header holds the client, the
// stage tabs, and the cycle navigator; the body shows exactly one stage:
// Overview · Plan · Log · Documents. Esc walks back one level at a time
// (editor → stage → picker → console). Keys 1–4 jump stages while not typing.

type Stage = 'overview' | 'plan' | 'log' | 'documents'

const STAGES: { id: Stage; label: string; icon: typeof Clock }[] = [
  { id: 'overview',  label: 'Overview',  icon: Clock },
  { id: 'plan',      label: 'Plan',      icon: CalendarPlus },
  { id: 'log',       label: 'Log',       icon: Plus },
  { id: 'documents', label: 'Documents', icon: FileText },
]

// ── Playbook presets ─────────────────────────────────────────────────────────
const TIER_PRESETS: Record<RetainerTier, { fee: number; hours: number; overage: number }> = {
  basic: { fee: 500, hours: 10, overage: 65 },
  growth: { fee: 1500, hours: 22, overage: 65 },
  enterprise: { fee: 0, hours: 0, overage: 65 },
}
const TIER_LABEL: Record<RetainerTier, string> = { basic: 'Basic', growth: 'Growth', enterprise: 'Enterprise' }
const CATEGORY_LABEL: Record<TimeEntryCategory, string> = {
  work: 'Work', meeting: 'Meeting', revision: 'Revision', reporting: 'Reporting',
}
const PRIORITY_LABEL: Record<TimeEntryPriority, string> = { low: 'Low', medium: 'Medium', high: 'High' }
// Badge classes per priority. Medium is the neutral default (no badge rendered).
const PRIORITY_BADGE: Record<TimeEntryPriority, string> = {
  high: 'text-red-400 border-red-500/30 bg-red-500/10',
  medium: 'text-[var(--space-text-muted)] border-[var(--space-border-hard)]',
  low: 'text-[var(--space-text-muted)] border-[var(--space-border-hard)]',
}
function PriorityBadge({ priority }: { priority?: TimeEntryPriority | null }) {
  const p = (priority ?? 'medium') as TimeEntryPriority
  if (p === 'medium') return null // default — keep rows quiet
  return (
    <span className={cn('shrink-0 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded border', PRIORITY_BADGE[p])}>
      {PRIORITY_LABEL[p]}
    </span>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}
function fmtHrs(n: number) {
  return `${Math.round((n ?? 0) * 100) / 100}`
}
function fmtDay(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
function toDayInput(iso: string | null | undefined) {
  return iso ? String(iso).slice(0, 10) : ''
}
function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

interface ClientOption { id: string; name: string; company: string | null }

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const selectCls =
  'px-2.5 py-2 text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-secondary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const numCls =
  'text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] px-3 py-2 focus:outline-none focus:border-[rgba(139,156,182,0.20)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
const numFieldCls =
  'px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
const accentBtn =
  'flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50'
const ghostBtn =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-all disabled:opacity-50'
const fieldLabel = 'text-[10px] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]'

// ── Component ─────────────────────────────────────────────────────────────────

export interface RetainerTabProps { clientId?: string; active: boolean }

export function RetainerTab({ clientId, active }: RetainerTabProps) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientsLoaded, setClientsLoaded] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId ?? '')
  const [stage, setStage] = useState<Stage>('overview')

  // Client picker
  const [pickQuery, setPickQuery] = useState('')
  const [pickIdx, setPickIdx] = useState(0)
  const pickerRef = useRef<HTMLInputElement>(null)
  const pickListRef = useRef<HTMLDivElement>(null)

  // Per-stage autofocus targets
  const draftRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLInputElement>(null)

  const [refDate, setRefDate] = useState<string>('') // '' = current cycle
  const [loading, setLoading] = useState(false)
  const [retainer, setRetainerDoc] = useState<RetainerDoc | null>(null)
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [terms, setTerms] = useState<RetainerTerms | null>(null)
  const [logged, setLogged] = useState<TimeEntryDoc[]>([])
  const [drafts, setDrafts] = useState<TimeEntryDoc[]>([])
  const [totals, setTotals] = useState<RetainerTotals | null>(null)
  const [scheduled, setScheduled] = useState<RetainerScheduled | null>(null)
  const [billing, setBilling] = useState<RetainerBilling | null>(null)
  const [sendingBilling, setSendingBilling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Setup form
  const [editing, setEditing] = useState(false)
  const [tier, setTier] = useState<RetainerTier>('basic')
  const [feeStr, setFeeStr] = useState(String(TIER_PRESETS.basic.fee))
  const [hoursStr, setHoursStr] = useState(String(TIER_PRESETS.basic.hours))
  const [overageStr, setOverageStr] = useState(String(TIER_PRESETS.basic.overage))
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')
  const [savingRetainer, setSavingRetainer] = useState(false)

  // Re-anchor cycle control (explicit — rewrites the read-only activatedAt anchor)
  const [anchorOpen, setAnchorOpen] = useState(false)
  const [anchorDate, setAnchorDate] = useState('')
  const [reanchoring, setReanchoring] = useState(false)

  // Log-hours form
  const [logDate, setLogDate] = useState(todayInput())
  const [logHoursStr, setLogHoursStr] = useState('')
  const [logCategory, setLogCategory] = useState<TimeEntryCategory>('work')
  const [logPriority, setLogPriority] = useState<TimeEntryPriority>('medium')
  const [logNote, setLogNote] = useState('')
  const [logging, setLogging] = useState(false)

  // Draft (planned) form
  const [draftDesc, setDraftDesc] = useState('')
  const [draftCategory, setDraftCategory] = useState<TimeEntryCategory>('work')
  const [draftPriority, setDraftPriority] = useState<TimeEntryPriority>('medium')
  const [addingDraft, setAddingDraft] = useState(false)

  // Row actions
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)

  // Inline entry editor (shared by drafts + logged)
  const [editId, setEditId] = useState<string | null>(null)
  const [eLogMode, setELogMode] = useState(false) // true = logging hours against a planned item
  const [eShowHours, setEShowHours] = useState(false) // hours field shown only for logged edits + log mode
  const [eDate, setEDate] = useState('')
  const [eHours, setEHours] = useState('')
  const [eCategory, setECategory] = useState<TimeEntryCategory>('work')
  const [ePriority, setEPriority] = useState<TimeEntryPriority>('medium')
  const [eDesc, setEDesc] = useState('')
  const [eSaving, setESaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Load the client list once the tab is first opened.
  useEffect(() => {
    if (!active || clientsLoaded) return
    ;(async () => {
      const r = await getClientAccountsList()
      if (r.success) setClients([...r.clients].sort((a, b) => a.name.localeCompare(b.name)))
      setClientsLoaded(true)
    })()
  }, [active, clientsLoaded])

  const load = useCallback(async () => {
    if (!selectedClientId) {
      setRetainerDoc(null); setCycle(null); setTerms(null)
      setLogged([]); setDrafts([]); setTotals(null); setScheduled(null); setBilling(null)
      return
    }
    const r = await getRetainerSummary(selectedClientId, refDate || undefined)
    if (r.success) {
      setRetainerDoc(r.retainer)
      setCycle(r.cycle)
      setTerms(r.terms)
      setLogged(r.logged)
      setDrafts(r.drafts)
      setTotals(r.totals)
      setScheduled(r.scheduled)
      setBilling(r.billing)
    } else {
      setError(r.error ?? 'Failed to load retainer')
    }
  }, [selectedClientId, refDate])

  // Reload the retainer + cycle whenever client or viewed cycle changes.
  useEffect(() => {
    if (!active) return
    if (!selectedClientId) { void load(); return }
    let alive = true
    setLoading(true); setError(null)
    ;(async () => { await load(); if (alive) setLoading(false) })()
    return () => { alive = false }
  }, [active, selectedClientId, refDate, load])

  // Keep the setup form in sync with the loaded retainer (or reset to a preset).
  useEffect(() => {
    if (retainer) {
      setTier(retainer.tier)
      setFeeStr(String(retainer.monthlyFee ?? ''))
      setHoursStr(String(retainer.hoursPerMonth ?? ''))
      setOverageStr(String(retainer.overageRate ?? 65))
      setStartDate(retainer.startDate ? String(retainer.startDate).slice(0, 10) : '')
      setNotes(retainer.notes ?? '')
      setAnchorDate((retainer.activatedAt ?? retainer.startDate) ? String(retainer.activatedAt ?? retainer.startDate).slice(0, 10) : '')
      setAnchorOpen(false)
      setEditing(false)
    } else {
      applyPreset('basic')
    }
  }, [retainer])

  // Default the log date sensibly for the viewed cycle.
  useEffect(() => {
    if (!cycle) return
    const now = new Date().toISOString()
    const inCycle = now >= cycle.start && now < cycle.end
    setLogDate(inCycle ? todayInput() : toDayInput(cycle.start))
  }, [cycle])

  // ── Picker: filtering + selection ───────────────────────────────────────────

  const pq = pickQuery.trim().toLowerCase()
  const filteredClients = pq
    ? clients.filter((c) => c.name.toLowerCase().includes(pq) || (c.company ?? '').toLowerCase().includes(pq))
    : clients
  const highlightIdx = Math.min(pickIdx, Math.max(0, filteredClients.length - 1))

  useEffect(() => { setPickIdx(0) }, [pickQuery])

  useEffect(() => {
    const el = pickListRef.current?.querySelector(`[data-pick-idx="${highlightIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlightIdx])

  function selectClient(id: string) {
    setSelectedClientId(id)
    setStage('overview')
    setRefDate('')
    setError(null)
    setPickQuery('')
    setPickIdx(0)
  }

  const clearClient = useCallback(() => {
    setSelectedClientId('')
    setStage('overview')
    setRefDate('')
    setError(null)
    setEditId(null)
    setELogMode(false)
    setPickQuery('')
    setPickIdx(0)
  }, [])

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null

  // ── Focus management — the picker owns focus on entry; Plan/Log focus their
  // primary input so a stage switch lands ready to type.
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => {
      if (!selectedClientId) pickerRef.current?.focus()
      else if (!loading && stage === 'plan') draftRef.current?.focus()
      else if (!loading && stage === 'log') logRef.current?.focus()
    }, 60)
    return () => clearTimeout(t)
  }, [active, selectedClientId, stage, loading])

  // ── Esc walks back one level (recap → editor → edit form → picker); the final
  // Esc from the picker bubbles to the console, which collapses to search.
  // 1–4 jump stages while not typing. Capture phase so we run before the console.
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!selectedClientId) return // picker level — let the console handle it
        e.preventDefault()
        e.stopPropagation()
        if (recapOpen) { setRecapOpen(false); return }
        if (editId) { setEditId(null); setELogMode(false); return }
        if (editing && retainer) { setEditing(false); return }
        clearClient()
        return
      }
      if (e.key >= '1' && e.key <= '4' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
        if (!selectedClientId || !retainer || editing || recapOpen || loading) return
        setStage(STAGES[Number(e.key) - 1].id)
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [active, selectedClientId, recapOpen, editId, editing, retainer, loading, clearClient])

  // ── Actions ─────────────────────────────────────────────────────────────────

  function applyPreset(t: RetainerTier) {
    setTier(t)
    setFeeStr(String(TIER_PRESETS[t].fee))
    setHoursStr(String(TIER_PRESETS[t].hours))
    setOverageStr(String(TIER_PRESETS[t].overage))
  }

  function goCycle(delta: -1 | 1) {
    if (!cycle) return
    if (delta === 1) setRefDate(cycle.end) // start of next cycle
    else setRefDate(new Date(new Date(cycle.start).getTime() - 86_400_000).toISOString())
  }

  async function handleSaveRetainer() {
    setError(null)
    if (!selectedClientId) { setError('Select a client first'); return }
    setSavingRetainer(true)
    const r = await setRetainer({
      clientAccountId: selectedClientId,
      tier,
      monthlyFee: feeStr === '' ? undefined : parseFloat(feeStr),
      hoursPerMonth: hoursStr === '' ? undefined : parseFloat(hoursStr),
      overageRate: overageStr === '' ? 65 : parseFloat(overageStr),
      startDate: startDate || undefined,
      notes: notes || undefined,
      retainerId: retainer?.id,
    })
    if (r.success) { setEditing(false); await load() }
    else setError(r.error ?? 'Failed to save retainer')
    setSavingRetainer(false)
  }

  async function handleReanchor() {
    setError(null)
    if (!retainer) return
    if (!anchorDate) { setError('Pick a cycle start date'); return }
    setReanchoring(true)
    const r = await setRetainerAnchor(retainer.id, anchorDate)
    if (r.success) {
      setAnchorOpen(false)
      setRefDate('') // jump back to the current cycle under the new anchor
      await load()
    } else setError(r.error ?? 'Failed to re-anchor cycle')
    setReanchoring(false)
  }

  async function handleLog() {
    setError(null)
    if (!retainer) return
    const h = parseFloat(logHoursStr)
    if (!(h > 0)) { setError('Enter hours greater than zero'); return }
    setLogging(true)
    const r = await logHours({
      retainerId: retainer.id,
      clientAccountId: selectedClientId,
      date: logDate,
      hours: h,
      category: logCategory,
      priority: logPriority,
      description: logNote || undefined,
    })
    if (r.success) {
      setLogHoursStr(''); setLogNote(''); setLogPriority('medium')
      // Jump to the logged entry's cycle if it landed outside the viewed one.
      if (cycle && (logDate < toDayInput(cycle.start) || `${logDate}T00:00:00.000Z` >= cycle.end)) {
        setRefDate(new Date(`${logDate}T12:00:00.000Z`).toISOString())
      } else await load()
      logRef.current?.focus()
    } else setError(r.error ?? 'Failed to log hours')
    setLogging(false)
  }

  async function handleAddDraft() {
    setError(null)
    if (!retainer || !cycle) return
    if (!draftDesc.trim()) { setError('Describe the planned work'); return }
    setAddingDraft(true)
    // Place the draft inside the currently-viewed cycle.
    const r = await createDraft({
      retainerId: retainer.id,
      clientAccountId: selectedClientId,
      date: toDayInput(cycle.start),
      description: draftDesc.trim(),
      category: draftCategory,
      priority: draftPriority,
    })
    if (r.success) { setDraftDesc(''); setDraftPriority('medium'); await load(); draftRef.current?.focus() }
    else setError(r.error ?? 'Failed to add planned item')
    setAddingDraft(false)
  }

  // logHours=true on a planned item opens the editor in "log" mode: saving creates a
  // separate logged entry and marks the plan complete, leaving it in the planned list.
  function openEditor(entry: TimeEntryDoc, logHoursMode = false) {
    const isLog = logHoursMode && entry.status === 'draft'
    setEditId(entry.id)
    setELogMode(isLog)
    setEShowHours(isLog || entry.status === 'logged')
    setEDate(toDayInput(entry.date))
    setEHours(isLog || entry.status === 'logged' ? (entry.hours ? String(entry.hours) : '') : '')
    setECategory((entry.category ?? 'work') as TimeEntryCategory)
    setEPriority((entry.priority ?? 'medium') as TimeEntryPriority)
    setEDesc(entry.description ?? '')
  }

  async function handleEditorSave() {
    if (!editId) return
    setError(null)

    // Log mode — create a logged entry from the plan and mark it complete.
    if (eLogMode) {
      const h = parseFloat(eHours)
      if (!(h > 0)) { setError('Enter hours greater than zero'); return }
      setESaving(true)
      const r = await logPlannedHours({
        draftId: editId,
        hours: h,
        date: eDate || undefined,
        category: eCategory,
        priority: ePriority,
        description: eDesc,
      })
      if (r.success) { setEditId(null); setELogMode(false); await load() }
      else setError(r.error ?? 'Failed to log hours')
      setESaving(false)
      return
    }

    setESaving(true)
    const r = await updateTimeEntry({
      id: editId,
      date: eDate || undefined,
      hours: eHours === '' ? undefined : parseFloat(eHours),
      category: eCategory,
      priority: ePriority,
      description: eDesc,
    })
    if (r.success) { setEditId(null); await load() }
    else setError(r.error ?? 'Failed to update entry')
    setESaving(false)
  }

  // Toggle a planned item's completion status (independent of logging hours).
  async function handleToggleComplete(entry: TimeEntryDoc) {
    setTogglingId(entry.id)
    setError(null)
    const next = entry.completion === 'complete' ? 'incomplete' : 'complete'
    const r = await updateTimeEntry({ id: entry.id, completion: next })
    if (r.success) await load()
    else setError(r.error ?? 'Failed to update status')
    setTogglingId(null)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const r = await deleteTimeEntry(id)
    if (r.success) await load()
    else setError(r.error ?? 'Failed to delete entry')
    setDeletingId(null)
  }

  async function handleDeactivate() {
    if (!retainer) return
    if (!confirm('Schedule deactivation? The retainer stays active through the end of the current cycle, then turns off. Logged hours are kept.')) return
    setError(null); setDeactivating(true)
    const r = await setRetainerActive(retainer.id, false)
    if (r.success) await load()
    else setError(r.error ?? 'Failed to deactivate retainer')
    setDeactivating(false)
  }

  async function handleReactivate() {
    if (!retainer) return
    setError(null); setReactivating(true)
    const r = await setRetainerActive(retainer.id, true)
    if (r.success) await load()
    else setError(r.error ?? 'Failed to reactivate retainer')
    setReactivating(false)
  }

  function handleExport() {
    if (!retainer || !cycle) return
    const url = `/api/retainers/${retainer.id}/pdf?ref=${encodeURIComponent(cycle.start)}`
    window.open(url, '_blank')
  }

  async function handleSendBilling() {
    if (!retainer || !cycle || !terms || !totals) return
    const total = (terms.monthlyFee ?? 0) + (totals.overageAmount ?? 0)
    const parts = [
      `Send retainer billing for ${cycle.label}?`,
      `Invoice total: ${fmt(total)} (${fmt(terms.monthlyFee)} fee${totals.overageAmount > 0 ? ` + ${fmt(totals.overageAmount)} overage` : ''}).`,
      'This creates a package + Stripe invoice and emails the client.',
    ]
    if (!confirm(parts.join('\n'))) return
    setError(null); setSendingBilling(true)
    const r = await sendRetainerBilling(selectedClientId, cycle.start)
    if (r.success) await load()
    else setError(r.error ?? 'Failed to send retainer billing')
    setSendingBilling(false)
  }

  const showForm = !retainer || editing
  const cap = totals?.cap ?? 0
  const used = totals?.used ?? 0
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0
  const over = (totals?.overageHours ?? 0) > 0
  const doneCount = drafts.filter((d) => d.completion === 'complete').length

  // Inline editor row (shared by drafts + logged). In log mode the hours field is required
  // and saving creates a separate logged entry against the plan (see handleEditorSave).
  const renderEditor = () => (
    <div className="space-y-1.5">
      {eLogMode && (
        <p className="text-[10px] text-[var(--space-text-muted)] px-1">
          Logging hours keeps this item in Planned Work and marks it complete.
        </p>
      )}
      <div className="flex items-end gap-2 flex-wrap px-3 py-2.5 rounded-lg border border-[var(--space-accent)] bg-[var(--space-bg-card-hover)]">
        <input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} className={cn(numCls, 'w-36 text-xs py-1.5')} />
        {eShowHours && (
          <input type="number" min={0} step="0.25" value={eHours} onChange={(e) => setEHours(e.target.value)} placeholder="Hrs" autoFocus={eLogMode} className={cn(numCls, 'w-16 text-xs py-1.5')} />
        )}
        <select value={eCategory} onChange={(e) => setECategory(e.target.value as TimeEntryCategory)} className={cn(selectCls, 'py-1.5')}>
          {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
        <select value={ePriority} onChange={(e) => setEPriority(e.target.value as TimeEntryPriority)} className={cn(selectCls, 'py-1.5')} title="Priority">
          {(Object.keys(PRIORITY_LABEL) as TimeEntryPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
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

  // ── Stage 0 — client picker ──────────────────────────────────────────────────

  if (!selectedClientId) {
    return (
      <div className="relative flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-md mx-auto w-full pt-[5vh] pb-8 space-y-4">
            <div className="text-center space-y-1.5">
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[var(--space-text-tertiary)]">Retainer</p>
              <p className="text-xs text-[var(--space-text-muted)]">Pick a client — type to search, ↵ to select.</p>
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
                    setPickIdx((i) => Math.min(filteredClients.length - 1, i + 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setPickIdx((i) => Math.max(0, i - 1))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    const c = filteredClients[highlightIdx]
                    if (c) selectClient(c.id)
                  } else if (e.key === 'Escape' && pickQuery) {
                    // First Esc clears the query; an Esc on an empty box bubbles
                    // to the console and collapses the station to search.
                    e.stopPropagation()
                    setPickQuery('')
                  }
                }}
                placeholder="Search clients…"
                className="flex-1 bg-transparent text-sm text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] outline-none"
              />
              <kbd className="hidden sm:inline text-[10px] text-[var(--space-text-muted)] bg-[var(--space-bg-base)] border border-[var(--space-border-hard)] rounded px-1.5 py-0.5 font-mono">↵</kbd>
            </div>

            {!clientsLoaded ? (
              <div className="flex justify-center py-10"><Loader2 className="size-4 text-[var(--space-text-muted)] animate-spin" /></div>
            ) : filteredClients.length === 0 ? (
              <p className="text-center text-xs text-[var(--space-text-muted)] py-10">
                {clients.length === 0 ? 'No client accounts yet.' : `No clients match “${pickQuery}”.`}
              </p>
            ) : (
              <div ref={pickListRef} className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden divide-y divide-[var(--space-border-hard)]">
                {filteredClients.map((c, i) => {
                  const isSel = i === highlightIdx
                  return (
                    <button
                      key={c.id}
                      type="button"
                      data-pick-idx={i}
                      onClick={() => selectClient(c.id)}
                      onMouseEnter={() => setPickIdx(i)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors relative',
                        isSel ? 'bg-[var(--space-bg-card-hover)]' : 'hover:bg-[var(--space-bg-card-hover)]',
                      )}
                    >
                      {isSel && (
                        <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full" style={{ background: 'var(--space-accent)', opacity: 0.7 }} />
                      )}
                      <Building2 className={cn('size-3.5 shrink-0', isSel ? 'text-[var(--space-accent)]' : 'text-[var(--space-text-muted)]')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm truncate', isSel ? 'text-[var(--space-text-primary)] font-medium' : 'text-[var(--space-text-secondary)]')}>{c.name}</p>
                        {c.company && <p className="text-[11px] text-[var(--space-text-muted)] truncate">{c.company}</p>}
                      </div>
                      {isSel && <CornerDownLeft className="size-3 shrink-0 opacity-60" style={{ color: 'var(--space-accent)' }} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Stages 1–4 — client selected ─────────────────────────────────────────────

  return (
    <div className="relative flex flex-col h-full min-h-0">
      {/* ── Persistent header: client · stage tabs · cycle ── */}
      <div className="shrink-0 border-b border-[var(--space-border-hard)] px-4 sm:px-6 pt-3">
        <div className="flex items-center gap-3 pb-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--space-text-primary)] truncate">
              {selectedClient?.name ?? '…'}
              {selectedClient?.company && <span className="font-normal text-[var(--space-text-muted)]"> · {selectedClient.company}</span>}
            </p>
            {retainer && terms && !editing && (
              <p className="text-xs text-[var(--space-text-muted)] mt-0.5">
                <span className="font-semibold uppercase tracking-wide" style={{ color: 'var(--space-accent)' }}>{TIER_LABEL[terms.tier]}</span>
                <span className="tabular-nums"> · {fmt(terms.monthlyFee)}/mo · {fmtHrs(terms.hoursPerMonth)} hrs/mo</span>
              </p>
            )}
          </div>
          <button onClick={clearClient} className={ghostBtn} title="Change client (esc)">
            <Search className="size-3" /> Change client
          </button>
        </div>

        {retainer && !editing && !loading && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1 pb-2 -ml-1">
              {STAGES.map((s, i) => {
                const Icon = s.icon
                const isActive = stage === s.id
                const count = s.id === 'plan' ? drafts.length : s.id === 'log' ? logged.length : null
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
            {cycle && (
              <div className="flex items-center gap-1.5 pb-2">
                <button onClick={() => goCycle(-1)} className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-colors">
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-xs font-medium text-[var(--space-text-secondary)] tabular-nums min-w-[132px] text-center">{cycle.label}</span>
                <button onClick={() => goCycle(1)} className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-colors">
                  <ChevronRight className="size-4" />
                </button>
                <span className="ml-1 text-xs tabular-nums text-[var(--space-text-tertiary)]">
                  <span className={cn('font-semibold', over ? 'text-amber-500' : 'text-[var(--space-text-primary)]')}>{fmtHrs(used)}</span>/{fmtHrs(cap)}h
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Stage body ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto w-full space-y-5">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="size-5 text-[var(--space-text-muted)] animate-spin" /></div>
          ) : showForm ? (
            /* ── Setup / edit form (whole pane while visible) ── */
            <div className="rounded-xl border border-[var(--space-border-hard)] p-4 sm:p-5 space-y-4 bg-[var(--space-bg-card-hover)]">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5" style={{ color: 'var(--space-accent)' }} />
                <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[var(--space-text-tertiary)]">
                  {retainer ? 'Edit retainer' : 'Set up retainer'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TIER_PRESETS) as RetainerTier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => applyPreset(t)}
                    className={cn(
                      'flex flex-col items-center gap-0.5 py-3 rounded-lg border text-xs font-semibold transition-colors',
                      tier === t
                        ? 'border-[rgba(139,156,182,0.35)] bg-[rgba(139,156,182,0.10)] text-[var(--space-text-primary)]'
                        : 'border-[var(--space-border-hard)] text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)]',
                    )}
                    style={tier === t ? { borderColor: 'var(--space-accent)' } : {}}
                  >
                    {TIER_LABEL[t]}
                    <span className="text-[9px] font-normal text-[var(--space-text-muted)]">
                      {t === 'enterprise' ? 'custom' : `${TIER_PRESETS[t].hours}h · ${fmt(TIER_PRESETS[t].fee)}`}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className={fieldLabel}>Fee / mo</span>
                  <input type="number" min={0} value={feeStr} onChange={(e) => setFeeStr(e.target.value)} className={cn(numFieldCls, 'w-full mt-1')} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Hours / mo</span>
                  <input type="number" min={0} value={hoursStr} onChange={(e) => setHoursStr(e.target.value)} className={cn(numFieldCls, 'w-full mt-1')} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Overage $/hr</span>
                  <input type="number" min={0} value={overageStr} onChange={(e) => setOverageStr(e.target.value)} className={cn(numFieldCls, 'w-full mt-1')} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className={fieldLabel}>Start date</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={cn(inputCls, 'mt-1')} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Notes</span>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal" className={cn(inputCls, 'mt-1')} />
                </label>
              </div>

              {retainer && (
                <p className="text-[10px] text-[var(--space-text-muted)]">
                  Fee / hours / overage changes take effect next cycle. Notes and start date apply immediately.
                </p>
              )}

              {/* ── Cycle anchor — explicit re-anchor (rewrites activatedAt) ── */}
              {retainer && (
                <div className="rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <CalendarClock className="size-3.5 shrink-0 text-[var(--space-text-muted)]" />
                      <span className="text-xs text-[var(--space-text-secondary)] truncate">
                        Cycles anchored to <span className="font-semibold text-[var(--space-text-primary)]">{fmtDay(retainer.activatedAt ?? retainer.startDate) || '—'}</span>
                      </span>
                    </div>
                    {!anchorOpen && (
                      <button type="button" onClick={() => setAnchorOpen(true)} className={ghostBtn}>
                        Adjust cycle start
                      </button>
                    )}
                  </div>

                  {anchorOpen && (
                    <div className="mt-3 space-y-2.5">
                      <label className="block">
                        <span className={fieldLabel}>Cycle start date</span>
                        <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} className={cn(inputCls, 'mt-1')} />
                      </label>
                      <p className="text-[10px] leading-relaxed text-amber-500">
                        Only the day of the month sets when cycles begin. This re-dates history — existing logged hours may shift into a different cycle. Applies immediately.
                      </p>
                      <div className="flex items-center gap-2">
                        <button onClick={handleReanchor} disabled={reanchoring} className={accentBtn}>
                          {reanchoring ? <Loader2 className="size-3.5 animate-spin" /> : null}
                          Re-anchor cycle
                        </button>
                        <button
                          onClick={() => { setAnchorOpen(false); setAnchorDate((retainer.activatedAt ?? retainer.startDate) ? String(retainer.activatedAt ?? retainer.startDate).slice(0, 10) : '') }}
                          className="px-3 py-2 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] rounded-lg hover:bg-[var(--space-bg-card)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button onClick={handleSaveRetainer} disabled={savingRetainer} className={accentBtn}>
                  {savingRetainer ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  {retainer ? 'Save changes' : 'Set up retainer'}
                </button>
                {retainer && (
                  <button onClick={() => setEditing(false)} className="px-3 py-2 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] rounded-lg hover:bg-[var(--space-bg-card)] transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* ── Overview ── */}
              {stage === 'overview' && (
                <>
                  {scheduled?.deactivateOn && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                      <span className="text-xs text-amber-500">Deactivating on {fmtDay(scheduled.deactivateOn)} — active until then.</span>
                      <button onClick={handleReactivate} disabled={reactivating} className="text-xs font-semibold text-[var(--space-text-primary)] hover:underline disabled:opacity-50">
                        {reactivating ? 'Keeping…' : 'Keep active'}
                      </button>
                    </div>
                  )}
                  {scheduled?.pendingEffectiveFrom && (
                    <div className="rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-3 py-2">
                      <span className="text-xs text-[var(--space-text-tertiary)]">
                        Plan change scheduled for {fmtDay(scheduled.pendingEffectiveFrom)}:{' '}
                        {scheduled.pending?.tier ? `${TIER_LABEL[scheduled.pending.tier]} · ` : ''}
                        {scheduled.pending?.monthlyFee != null ? `${fmt(scheduled.pending.monthlyFee)}/mo · ` : ''}
                        {scheduled.pending?.hoursPerMonth != null ? `${fmtHrs(scheduled.pending.hoursPerMonth)} hrs/mo` : ''}
                      </span>
                    </div>
                  )}

                  {/* Cycle summary — the one big thing on this screen */}
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-5 bg-[var(--space-bg-card-hover)] space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-3xl font-bold tabular-nums text-[var(--space-text-primary)] leading-none">
                          {fmtHrs(used)}
                          <span className="text-base font-normal text-[var(--space-text-muted)]"> / {fmtHrs(cap)} hrs</span>
                        </p>
                        <p className="text-xs mt-2">
                          {over
                            ? <span className="text-amber-500 font-semibold">{fmtHrs(totals?.overageHours ?? 0)} hrs over · {fmt(totals?.overageAmount ?? 0)}</span>
                            : <span className="text-[var(--space-text-tertiary)]">{fmtHrs(totals?.remaining ?? 0)} hrs remaining</span>}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--space-text-muted)] tabular-nums">{cycle?.label ?? '—'}</p>
                    </div>

                    <div className="h-2.5 rounded-full bg-[var(--space-bg-card)] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--space-accent)' }} />
                    </div>

                    {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).some((c) => (totals?.byCategory?.[c] ?? 0) > 0) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) =>
                          (totals?.byCategory?.[c] ?? 0) > 0
                            ? (
                              <span key={c} className="px-2.5 py-1 rounded-md border border-[var(--space-border-hard)] text-xs tabular-nums text-[var(--space-text-tertiary)]">
                                {CATEGORY_LABEL[c]} <span className="font-semibold text-[var(--space-text-secondary)]">{fmtHrs(totals!.byCategory[c])}h</span>
                              </span>
                            )
                            : null,
                        )}
                      </div>
                    )}
                  </div>

                  {/* Jump cards — where to go next */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <JumpCard
                      icon={CalendarPlus}
                      title="Plan work"
                      hint={drafts.length > 0 ? `${drafts.length} planned · ${doneCount} done` : 'Nothing planned yet'}
                      onClick={() => setStage('plan')}
                    />
                    <JumpCard
                      icon={Plus}
                      title="Log hours"
                      hint={logged.length > 0 ? `${logged.length} entr${logged.length === 1 ? 'y' : 'ies'} this cycle` : 'No hours logged yet'}
                      onClick={() => setStage('log')}
                    />
                    <JumpCard
                      icon={FileText}
                      title="Documents"
                      hint="Statement & recap"
                      onClick={() => setStage('documents')}
                    />
                  </div>

                  {/* Lifecycle */}
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => setEditing(true)} className={ghostBtn}>
                      <Pencil className="size-3" /> Edit terms
                    </button>
                    <button onClick={handleDeactivate} disabled={deactivating} className={cn(ghostBtn, 'hover:text-red-400 hover:border-red-400/30')} title="Schedule deactivation at end of cycle">
                      {deactivating ? <Loader2 className="size-3 animate-spin" /> : <PowerOff className="size-3" />} Deactivate
                    </button>
                  </div>
                </>
              )}

              {/* ── Plan ── */}
              {stage === 'plan' && (
                <>
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-4 space-y-3 bg-[var(--space-bg-card-hover)]">
                    <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[var(--space-text-tertiary)] flex items-center gap-1.5">
                      <CalendarPlus className="size-3" /> Plan work for {cycle?.label ?? 'this cycle'}
                    </p>
                    <input
                      ref={draftRef}
                      value={draftDesc}
                      onChange={(e) => setDraftDesc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !addingDraft) void handleAddDraft() }}
                      placeholder="Describe a task, ↵ to add…"
                      className={inputCls}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value as TimeEntryCategory)} className={selectCls}>
                        {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                      </select>
                      <select value={draftPriority} onChange={(e) => setDraftPriority(e.target.value as TimeEntryPriority)} className={selectCls} title="Priority">
                        {(Object.keys(PRIORITY_LABEL) as TimeEntryPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                      </select>
                      <button onClick={handleAddDraft} disabled={addingDraft} className={cn(accentBtn, 'ml-auto')}>
                        {addingDraft ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Plan
                      </button>
                    </div>
                  </div>

                  {drafts.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
                      <CalendarPlus className="size-5 text-[var(--space-text-muted)]" />
                      <p className="text-xs text-[var(--space-text-muted)]">Nothing planned for {cycle?.label ?? 'this cycle'} yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {drafts.map((e) => editId === e.id ? (
                        <div key={e.id}>{renderEditor()}</div>
                      ) : (
                        <div key={e.id} className={cn(
                          'flex items-center gap-3 px-3.5 py-3 rounded-lg border border-dashed border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]',
                          e.completion === 'complete' && 'opacity-60',
                        )}>
                          <button onClick={() => handleToggleComplete(e)} disabled={togglingId === e.id} className="shrink-0 size-5 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-accent)] transition-colors disabled:opacity-50" title={e.completion === 'complete' ? 'Mark incomplete' : 'Mark complete'}>
                            {togglingId === e.id
                              ? <Loader2 className="size-3.5 animate-spin" />
                              : e.completion === 'complete'
                                ? <CircleCheck className="size-4" style={{ color: 'var(--space-accent)' }} />
                                : <Circle className="size-4" />}
                          </button>
                          <span className="text-[10px] uppercase tracking-wide text-[var(--space-text-muted)] shrink-0 w-16">
                            {CATEGORY_LABEL[(e.category ?? 'work') as TimeEntryCategory]}
                          </span>
                          <span className={cn('text-sm flex-1 min-w-0 truncate', e.completion === 'complete' ? 'text-[var(--space-text-muted)] line-through' : 'text-[var(--space-text-secondary)]')}>{e.description || '—'}</span>
                          <PriorityBadge priority={e.priority} />
                          <button onClick={() => openEditor(e, false)} className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors" title="Edit planned item">
                            <Pencil className="size-3.5" />
                          </button>
                          <button onClick={() => openEditor(e, true)} className="shrink-0 flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-[var(--space-accent)] hover:bg-[var(--space-bg-card)] transition-colors" title="Log hours for this item">
                            Log hours <ArrowRight className="size-3" />
                          </button>
                          <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id} className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 hover:bg-[var(--space-bg-card)] transition-colors disabled:opacity-50">
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
                      <Plus className="size-3" /> Log hours
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="block">
                        <span className={fieldLabel}>Date</span>
                        <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className={cn(numCls, 'w-full mt-1')} />
                      </label>
                      <label className="block">
                        <span className={fieldLabel}>Hours</span>
                        <input ref={logRef} type="number" min={0} step="0.25" value={logHoursStr} onChange={(e) => setLogHoursStr(e.target.value)} placeholder="0" className={cn(numCls, 'w-full mt-1')} />
                      </label>
                      <label className="block">
                        <span className={fieldLabel}>Category</span>
                        <select value={logCategory} onChange={(e) => setLogCategory(e.target.value as TimeEntryCategory)} className={cn(selectCls, 'w-full mt-1 text-sm py-2')}>
                          {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className={fieldLabel}>Priority</span>
                        <select value={logPriority} onChange={(e) => setLogPriority(e.target.value as TimeEntryPriority)} className={cn(selectCls, 'w-full mt-1 text-sm py-2')}>
                          {(Object.keys(PRIORITY_LABEL) as TimeEntryPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !logging) void handleLog() }}
                        placeholder="What did you do? ↵ to log"
                        className={cn(inputCls, 'flex-1')}
                      />
                      <button onClick={handleLog} disabled={logging} className={accentBtn}>
                        {logging ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Log
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--space-accent)] mb-2.5">
                      Entries · {logged.length}
                    </p>
                    {logged.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-10 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
                        <CalendarClock className="size-5 text-[var(--space-text-muted)]" />
                        <p className="text-xs text-[var(--space-text-muted)]">No hours logged for {cycle?.label ?? 'this cycle'} yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {logged.map((e) => editId === e.id ? (
                          <div key={e.id}>{renderEditor()}</div>
                        ) : (
                          <div key={e.id} className="flex items-center gap-3 px-3.5 py-3 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]">
                            <span className="text-[11px] font-mono tabular-nums text-[var(--space-text-muted)] shrink-0 w-14">{String(e.date).slice(5, 10)}</span>
                            <span className="text-sm font-bold tabular-nums text-[var(--space-text-primary)] shrink-0 w-12">{fmtHrs(e.hours)}h</span>
                            <span className="text-[10px] uppercase tracking-wide text-[var(--space-text-muted)] shrink-0 w-16">{CATEGORY_LABEL[(e.category ?? 'work') as TimeEntryCategory]}</span>
                            <span className="text-xs text-[var(--space-text-tertiary)] flex-1 min-w-0 truncate">{e.description || '—'}</span>
                            <PriorityBadge priority={e.priority} />
                            <button onClick={() => openEditor(e)} className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors" title="Edit entry">
                              <Pencil className="size-3.5" />
                            </button>
                            <button onClick={() => handleDelete(e.id)} disabled={deletingId === e.id} className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 hover:bg-[var(--space-bg-card)] transition-colors disabled:opacity-50">
                              {deletingId === e.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Documents ── */}
              {stage === 'documents' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DocCard
                      icon={FileDown}
                      title="Cycle statement"
                      desc={`A line-item PDF statement of ${cycle?.label ?? 'this cycle'} — logged entries, hours against the cap, and any overage.`}
                      actionLabel="Export PDF"
                      onClick={handleExport}
                    />
                    <DocCard
                      icon={FileText}
                      title="Monthly recap"
                      desc="The client-facing recap deck — hours, highlights, recommendations, and next month's priorities, seeded from this cycle."
                      actionLabel="Compose recap"
                      onClick={() => setRecapOpen(true)}
                    />
                    {billing ? (
                      <div className="flex flex-col gap-3 rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--space-accent-soft)' }}>
                            <CircleCheck className="size-4" style={{ color: 'var(--space-accent)' }} />
                          </div>
                          <p className="text-sm font-semibold text-[var(--space-text-primary)]">Retainer billing</p>
                          <span className={cn(
                            'ml-auto px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded border',
                            billing.status === 'paid'
                              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                              : billing.status === 'cancelled'
                                ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                : 'text-amber-500 border-amber-500/30 bg-amber-500/10',
                          )}>
                            {billing.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--space-text-muted)] leading-relaxed flex-1">
                          This cycle is billed — <span className="tabular-nums text-[var(--space-text-secondary)]">{billing.orderNumber}</span>. The invoice and package are live for the client.
                        </p>
                        {billing.invoiceUrl && (
                          <a href={billing.invoiceUrl} target="_blank" rel="noreferrer" className={cn(ghostBtn, 'self-start')}>
                            View Stripe invoice
                          </a>
                        )}
                      </div>
                    ) : (
                      <DocCard
                        icon={CalendarClock}
                        title="Retainer billing"
                        desc={`Bill ${cycle?.label ?? 'this cycle'} — creates a package + Stripe invoice for the ${fmt(terms?.monthlyFee ?? 0)} fee${(totals?.overageAmount ?? 0) > 0 ? ` plus ${fmt(totals?.overageAmount ?? 0)} overage` : ''}, listing next cycle's planned items, and emails the client.`}
                        actionLabel={sendingBilling ? 'Sending…' : 'Send retainer billing'}
                        onClick={handleSendBilling}
                        disabled={sendingBilling}
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--space-text-muted)]">
                    Documents and billing cover the cycle shown in the header — use ‹ › up there to pick a different one.
                  </p>
                </>
              )}
            </>
          )}

          {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>

      {recapOpen && retainer && cycle && selectedClientId && (
        <RetainerRecapModal
          retainerId={retainer.id}
          clientId={selectedClientId}
          cycleRef={cycle.start}
          onClose={() => setRecapOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function JumpCard({
  icon: Icon, title, hint, onClick,
}: { icon: typeof Clock; title: string; hint: string; onClick: () => void }) {
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

function DocCard({
  icon: Icon, title, desc, actionLabel, onClick, disabled,
}: { icon: typeof Clock; title: string; desc: string; actionLabel: string; onClick: () => void; disabled?: boolean }) {
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
