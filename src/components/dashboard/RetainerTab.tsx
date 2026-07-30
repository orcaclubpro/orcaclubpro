'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Clock, Plus, Trash2, ChevronLeft, ChevronRight, Pencil,
  CalendarClock, PowerOff, FileDown, Check, X, ArrowRight, CalendarPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getClientAccountsList } from '@/actions/packages'
import {
  getRetainerSummary,
  setRetainer,
  setRetainerActive,
  logHours,
  createDraft,
  updateTimeEntry,
  deleteTimeEntry,
  type RetainerDoc,
  type TimeEntryDoc,
  type RetainerTotals,
  type RetainerTerms,
  type RetainerScheduled,
  type RetainerTier,
  type TimeEntryCategory,
} from '@/actions/retainers'
import type { Cycle } from '@/lib/retainers/cycle'

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
  'px-2 py-1.5 text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-md text-[var(--space-text-secondary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const numCls =
  'text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-md text-[var(--space-text-primary)] px-2 py-1.5 focus:outline-none focus:border-[rgba(139,156,182,0.20)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
const numFieldCls =
  'px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
const accentBtn =
  'flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50'
const ghostBtn =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-all disabled:opacity-50'

// ── Component ─────────────────────────────────────────────────────────────────

export interface RetainerTabProps { clientId?: string; active: boolean }

export function RetainerTab({ clientId, active }: RetainerTabProps) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientsLoaded, setClientsLoaded] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId ?? '')

  const [refDate, setRefDate] = useState<string>('') // '' = current cycle
  const [loading, setLoading] = useState(false)
  const [retainer, setRetainerDoc] = useState<RetainerDoc | null>(null)
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [terms, setTerms] = useState<RetainerTerms | null>(null)
  const [logged, setLogged] = useState<TimeEntryDoc[]>([])
  const [drafts, setDrafts] = useState<TimeEntryDoc[]>([])
  const [totals, setTotals] = useState<RetainerTotals | null>(null)
  const [scheduled, setScheduled] = useState<RetainerScheduled | null>(null)
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

  // Log-hours form
  const [logDate, setLogDate] = useState(todayInput())
  const [logHoursStr, setLogHoursStr] = useState('')
  const [logCategory, setLogCategory] = useState<TimeEntryCategory>('work')
  const [logNote, setLogNote] = useState('')
  const [logging, setLogging] = useState(false)

  // Draft (planned) form
  const [draftDesc, setDraftDesc] = useState('')
  const [draftCategory, setDraftCategory] = useState<TimeEntryCategory>('work')
  const [addingDraft, setAddingDraft] = useState(false)

  // Row actions
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deactivating, setDeactivating] = useState(false)
  const [reactivating, setReactivating] = useState(false)

  // Inline entry editor (shared by drafts + logged)
  const [editId, setEditId] = useState<string | null>(null)
  const [eDate, setEDate] = useState('')
  const [eHours, setEHours] = useState('')
  const [eCategory, setECategory] = useState<TimeEntryCategory>('work')
  const [eDesc, setEDesc] = useState('')
  const [eSaving, setESaving] = useState(false)

  // Load the client list once the tab is first opened.
  useEffect(() => {
    if (!active || clientsLoaded) return
    ;(async () => {
      const r = await getClientAccountsList()
      if (r.success) setClients(r.clients)
      setClientsLoaded(true)
    })()
  }, [active, clientsLoaded])

  const load = useCallback(async () => {
    if (!selectedClientId) {
      setRetainerDoc(null); setCycle(null); setTerms(null)
      setLogged([]); setDrafts([]); setTotals(null); setScheduled(null)
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
      description: logNote || undefined,
    })
    if (r.success) {
      setLogHoursStr(''); setLogNote('')
      // Jump to the logged entry's cycle if it landed outside the viewed one.
      if (cycle && (logDate < toDayInput(cycle.start) || `${logDate}T00:00:00.000Z` >= cycle.end)) {
        setRefDate(new Date(`${logDate}T12:00:00.000Z`).toISOString())
      } else await load()
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
    })
    if (r.success) { setDraftDesc(''); await load() }
    else setError(r.error ?? 'Failed to add planned item')
    setAddingDraft(false)
  }

  function openEditor(entry: TimeEntryDoc, focusHours = false) {
    setEditId(entry.id)
    setEDate(toDayInput(entry.date))
    setEHours(focusHours || entry.status === 'logged' ? (entry.hours ? String(entry.hours) : '') : '')
    setECategory((entry.category ?? 'work') as TimeEntryCategory)
    setEDesc(entry.description ?? '')
  }

  async function handleEditorSave() {
    if (!editId) return
    setError(null)
    setESaving(true)
    const r = await updateTimeEntry({
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

  const showForm = !retainer || editing
  const cap = totals?.cap ?? 0
  const used = totals?.used ?? 0
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0
  const over = (totals?.overageHours ?? 0) > 0

  // Inline editor row (shared).
  const renderEditor = () => (
    <div className="flex items-end gap-2 flex-wrap px-3 py-2.5 rounded-lg border border-[var(--space-accent)] bg-[var(--space-bg-card-hover)]">
      <input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} className={cn(numCls, 'w-36')} />
      <input type="number" min={0} step="0.25" value={eHours} onChange={(e) => setEHours(e.target.value)} placeholder="Hrs" className={cn(numCls, 'w-16')} />
      <select value={eCategory} onChange={(e) => setECategory(e.target.value as TimeEntryCategory)} className={selectCls}>
        {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
      </select>
      <input value={eDesc} onChange={(e) => setEDesc(e.target.value)} placeholder="Description" className={cn(inputCls, 'flex-1 min-w-[140px] py-1.5 text-xs')} />
      <button onClick={handleEditorSave} disabled={eSaving} className={accentBtn}>
        {eSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save
      </button>
      <button onClick={() => setEditId(null)} className="size-8 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors">
        <X className="size-4" />
      </button>
    </div>
  )

  return (
    <div className="relative flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto w-full space-y-5">
          {/* Client selector */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">Client *</label>
            <select
              value={selectedClientId}
              onChange={(e) => { setSelectedClientId(e.target.value); setRefDate(''); setError(null) }}
              className={cn(inputCls, 'mt-1.5')}
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>
              ))}
            </select>
          </div>

          {!selectedClientId ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
              <Clock className="size-6 text-[var(--space-text-muted)]" />
              <p className="text-xs text-[var(--space-text-muted)]">Pick a client to set up their retainer, plan work, and log hours.</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-14"><Loader2 className="size-5 text-[var(--space-text-muted)] animate-spin" /></div>
          ) : (
            <>
              {/* ── Setup / edit form ── */}
              {showForm && (
                <div className="rounded-xl border border-[var(--space-border-hard)] p-4 space-y-4 bg-[var(--space-bg-card-hover)]">
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
                          'flex flex-col items-center gap-0.5 py-2.5 rounded-lg border text-xs font-semibold transition-colors',
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
                      <span className="text-[10px] uppercase tracking-widest text-[var(--space-text-muted)]">Fee / mo</span>
                      <input type="number" min={0} value={feeStr} onChange={(e) => setFeeStr(e.target.value)} className={cn(numFieldCls, 'w-full mt-1')} />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-widest text-[var(--space-text-muted)]">Hours / mo</span>
                      <input type="number" min={0} value={hoursStr} onChange={(e) => setHoursStr(e.target.value)} className={cn(numFieldCls, 'w-full mt-1')} />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-widest text-[var(--space-text-muted)]">Overage $/hr</span>
                      <input type="number" min={0} value={overageStr} onChange={(e) => setOverageStr(e.target.value)} className={cn(numFieldCls, 'w-full mt-1')} />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-widest text-[var(--space-text-muted)]">Start date</span>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={cn(inputCls, 'mt-1')} />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-widest text-[var(--space-text-muted)]">Notes</span>
                      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal" className={cn(inputCls, 'mt-1')} />
                    </label>
                  </div>

                  {retainer && (
                    <p className="text-[10px] text-[var(--space-text-muted)]">
                      Fee / hours / overage changes take effect next cycle. Notes and start date apply immediately.
                    </p>
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
              )}

              {/* ── Active retainer ── */}
              {retainer && !editing && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--space-accent)' }}>
                        {TIER_LABEL[terms?.tier ?? retainer.tier]}
                      </span>
                      <span className="text-sm text-[var(--space-text-secondary)] tabular-nums">
                        {fmt(terms?.monthlyFee ?? 0)}/mo · {fmtHrs(terms?.hoursPerMonth ?? 0)} hrs/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleExport} className={ghostBtn} title="Export this cycle as a PDF statement">
                        <FileDown className="size-3" /> PDF
                      </button>
                      <button onClick={() => setEditing(true)} className={ghostBtn}>
                        <Pencil className="size-3" /> Edit
                      </button>
                      <button onClick={handleDeactivate} disabled={deactivating} className={cn(ghostBtn, 'hover:text-red-400 hover:border-red-400/30')} title="Schedule deactivation at end of cycle">
                        {deactivating ? <Loader2 className="size-3 animate-spin" /> : <PowerOff className="size-3" />} Deactivate
                      </button>
                    </div>
                  </div>

                  {/* Scheduling banners */}
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

                  {/* Cycle summary */}
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-4 bg-[var(--space-bg-card-hover)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => goCycle(-1)} className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors">
                          <ChevronLeft className="size-4" />
                        </button>
                        <span className="text-sm font-semibold text-[var(--space-text-primary)] tabular-nums min-w-[150px] text-center">{cycle?.label ?? '—'}</span>
                        <button onClick={() => goCycle(1)} className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors">
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold tabular-nums text-[var(--space-text-primary)]">{fmtHrs(used)}</span>
                        <span className="text-sm text-[var(--space-text-muted)]"> / {fmtHrs(cap)} hrs</span>
                      </div>
                    </div>

                    <div className="h-2 rounded-full bg-[var(--space-bg-card)] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--space-accent)' }} />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--space-text-tertiary)]">
                        {over
                          ? <span className="text-amber-500 font-semibold">{fmtHrs(totals?.overageHours ?? 0)} hrs over · {fmt(totals?.overageAmount ?? 0)}</span>
                          : <span>{fmtHrs(totals?.remaining ?? 0)} hrs remaining</span>}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap text-[var(--space-text-muted)]">
                        {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) =>
                          (totals?.byCategory?.[c] ?? 0) > 0
                            ? <span key={c} className="tabular-nums">{CATEGORY_LABEL[c]} {fmtHrs(totals!.byCategory[c])}</span>
                            : null,
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Planned (drafts) */}
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--space-text-tertiary)] mb-2.5 flex items-center gap-1.5">
                      <CalendarPlus className="size-3" /> Planned · {drafts.length}
                    </p>
                    <div className="rounded-xl border border-[var(--space-border-hard)] p-3 space-y-2 mb-2">
                      <div className="flex items-end gap-2 flex-wrap">
                        <input value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} placeholder="Plan a task for this cycle…" className={cn(inputCls, 'flex-1 min-w-[160px] py-1.5 text-xs')} />
                        <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value as TimeEntryCategory)} className={selectCls}>
                          {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                        </select>
                        <button onClick={handleAddDraft} disabled={addingDraft} className={accentBtn}>
                          {addingDraft ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Plan
                        </button>
                      </div>
                    </div>
                    {drafts.length > 0 && (
                      <div className="space-y-1.5">
                        {drafts.map((e) => editId === e.id ? (
                          <div key={e.id}>{renderEditor()}</div>
                        ) : (
                          <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]">
                            <span className="text-[10px] uppercase tracking-wide text-[var(--space-text-muted)] shrink-0 w-16">
                              {CATEGORY_LABEL[(e.category ?? 'work') as TimeEntryCategory]}
                            </span>
                            <span className="text-xs text-[var(--space-text-secondary)] flex-1 min-w-0 truncate">{e.description || '—'}</span>
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
                  </div>

                  {/* Log hours */}
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-3 space-y-2">
                    <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[var(--space-text-tertiary)] flex items-center gap-1.5">
                      <Plus className="size-3" /> Log hours
                    </p>
                    <div className="flex items-end gap-2 flex-wrap">
                      <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className={cn(numCls, 'w-36')} />
                      <input type="number" min={0} step="0.25" value={logHoursStr} onChange={(e) => setLogHoursStr(e.target.value)} placeholder="Hrs" className={cn(numCls, 'w-16')} />
                      <select value={logCategory} onChange={(e) => setLogCategory(e.target.value as TimeEntryCategory)} className={selectCls}>
                        {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                      </select>
                      <input value={logNote} onChange={(e) => setLogNote(e.target.value)} placeholder="What did you do?" className={cn(inputCls, 'flex-1 min-w-[140px] py-1.5 text-xs')} />
                      <button onClick={handleLog} disabled={logging} className={accentBtn}>
                        {logging ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Log
                      </button>
                    </div>
                  </div>

                  {/* Logged entries */}
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--space-accent)] mb-2.5">
                      Entries · {logged.length}
                    </p>
                    {logged.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-8 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
                        <CalendarClock className="size-5 text-[var(--space-text-muted)]" />
                        <p className="text-xs text-[var(--space-text-muted)]">No hours logged for {cycle?.label ?? 'this cycle'} yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {logged.map((e) => editId === e.id ? (
                          <div key={e.id}>{renderEditor()}</div>
                        ) : (
                          <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]">
                            <span className="text-[11px] font-mono tabular-nums text-[var(--space-text-muted)] shrink-0 w-14">{String(e.date).slice(5, 10)}</span>
                            <span className="text-sm font-bold tabular-nums text-[var(--space-text-primary)] shrink-0 w-12">{fmtHrs(e.hours)}h</span>
                            <span className="text-[10px] uppercase tracking-wide text-[var(--space-text-muted)] shrink-0 w-16">{CATEGORY_LABEL[(e.category ?? 'work') as TimeEntryCategory]}</span>
                            <span className="text-xs text-[var(--space-text-tertiary)] flex-1 min-w-0 truncate">{e.description || '—'}</span>
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

              {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
