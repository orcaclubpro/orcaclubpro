'use client'

import { useState, useEffect } from 'react'
import { Loader2, Clock, Plus, Trash2, ChevronLeft, ChevronRight, Pencil, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getClientAccountsList } from '@/actions/packages'
import {
  getRetainerSummary,
  setRetainer,
  logHours,
  deleteTimeEntry,
  type RetainerDoc,
  type TimeEntryDoc,
  type RetainerTotals,
  type RetainerTier,
  type TimeEntryCategory,
} from '@/actions/retainers'

// ── Playbook presets ─────────────────────────────────────────────────────────
// Basic 10h/$500 · Growth 20–25h/$1–2k (midpoints) · Enterprise custom. À la
// carte / overage rate is $65/hr. All values stay editable per client.
const TIER_PRESETS: Record<RetainerTier, { fee: number; hours: number; overage: number }> = {
  basic: { fee: 500, hours: 10, overage: 65 },
  growth: { fee: 1500, hours: 22, overage: 65 },
  enterprise: { fee: 0, hours: 0, overage: 65 },
}

const TIER_LABEL: Record<RetainerTier, string> = { basic: 'Basic', growth: 'Growth', enterprise: 'Enterprise' }

const CATEGORY_LABEL: Record<TimeEntryCategory, string> = {
  work: 'Work',
  meeting: 'Meeting',
  revision: 'Revision',
  reporting: 'Reporting',
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}
function fmtHrs(n: number) {
  return `${Math.round((n ?? 0) * 100) / 100}`
}
function monthLabel(m: string) {
  const [y, mm] = m.split('-').map(Number)
  return `${MONTHS[mm - 1]} ${y}`
}
function shiftMonth(m: string, delta: number) {
  const [y, mm] = m.split('-').map(Number)
  const dt = new Date(Date.UTC(y, mm - 1 + delta, 1))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`
}
function thisMonth() {
  const n = new Date()
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, '0')}`
}

interface ClientOption {
  id: string
  name: string
  company: string | null
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const selectCls =
  'px-2 py-1.5 text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-md text-[var(--space-text-secondary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const numCls =
  'text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-md text-[var(--space-text-primary)] px-2 py-1.5 focus:outline-none focus:border-[rgba(139,156,182,0.20)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
const numFieldCls =
  'px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

// ── Component ─────────────────────────────────────────────────────────────────

export interface RetainerTabProps {
  clientId?: string
  active: boolean
}

export function RetainerTab({ clientId, active }: RetainerTabProps) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientsLoaded, setClientsLoaded] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId ?? '')

  const [month, setMonth] = useState<string>(() => thisMonth())
  const [loading, setLoading] = useState(false)
  const [retainer, setRetainerDoc] = useState<RetainerDoc | null>(null)
  const [entries, setEntries] = useState<TimeEntryDoc[]>([])
  const [totals, setTotals] = useState<RetainerTotals | null>(null)
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
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [logHoursStr, setLogHoursStr] = useState('')
  const [logCategory, setLogCategory] = useState<TimeEntryCategory>('work')
  const [logNote, setLogNote] = useState('')
  const [logging, setLogging] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load the client list once the tab is first opened.
  useEffect(() => {
    if (!active || clientsLoaded) return
    ;(async () => {
      const r = await getClientAccountsList()
      if (r.success) setClients(r.clients)
      setClientsLoaded(true)
    })()
  }, [active, clientsLoaded])

  // Load the retainer + this month's entries whenever the client or month changes.
  useEffect(() => {
    if (!active) return
    if (!selectedClientId) {
      setRetainerDoc(null)
      setEntries([])
      setTotals(null)
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    ;(async () => {
      const r = await getRetainerSummary(selectedClientId, month)
      if (!alive) return
      if (r.success) {
        setRetainerDoc(r.retainer)
        setEntries(r.entries)
        setTotals(r.totals)
      } else {
        setError(r.error ?? 'Failed to load retainer')
      }
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [active, selectedClientId, month])

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

  function applyPreset(t: RetainerTier) {
    setTier(t)
    setFeeStr(String(TIER_PRESETS[t].fee))
    setHoursStr(String(TIER_PRESETS[t].hours))
    setOverageStr(String(TIER_PRESETS[t].overage))
  }

  async function reload() {
    if (!selectedClientId) return
    const r = await getRetainerSummary(selectedClientId, month)
    if (r.success) {
      setRetainerDoc(r.retainer)
      setEntries(r.entries)
      setTotals(r.totals)
    }
  }

  async function handleSaveRetainer() {
    setError(null)
    if (!selectedClientId) {
      setError('Select a client first')
      return
    }
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
    if (r.success) {
      setEditing(false)
      await reload()
    } else {
      setError(r.error ?? 'Failed to save retainer')
    }
    setSavingRetainer(false)
  }

  async function handleLog() {
    setError(null)
    if (!retainer) return
    const h = parseFloat(logHoursStr)
    if (!(h > 0)) {
      setError('Enter hours greater than zero')
      return
    }
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
      setLogHoursStr('')
      setLogNote('')
      // Jump the view to the logged entry's month so it's visible.
      const loggedMonth = logDate.slice(0, 7)
      if (loggedMonth !== month) setMonth(loggedMonth)
      else await reload()
    } else {
      setError(r.error ?? 'Failed to log hours')
    }
    setLogging(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const r = await deleteTimeEntry(id)
    if (r.success) await reload()
    else setError(r.error ?? 'Failed to delete entry')
    setDeletingId(null)
  }

  const showForm = !retainer || editing
  const cap = totals?.cap ?? 0
  const used = totals?.used ?? 0
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0
  const over = (totals?.overageHours ?? 0) > 0

  return (
    <div className="relative flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto w-full space-y-5">
          {/* Client selector */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">Client *</label>
            <select
              value={selectedClientId}
              onChange={(e) => { setSelectedClientId(e.target.value); setError(null) }}
              className={cn(inputCls, 'mt-1.5')}
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` · ${c.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          {!selectedClientId ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
              <Clock className="size-6 text-[var(--space-text-muted)]" />
              <p className="text-xs text-[var(--space-text-muted)]">Pick a client to set up their retainer and log hours.</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-14">
              <Loader2 className="size-5 text-[var(--space-text-muted)] animate-spin" />
            </div>
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

                  {/* Tier picker */}
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

                  {/* Fee / hours / overage */}
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveRetainer}
                      disabled={savingRetainer}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {savingRetainer ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      {retainer ? 'Save changes' : 'Set up retainer'}
                    </button>
                    {retainer && (
                      <button
                        onClick={() => setEditing(false)}
                        className="px-3 py-2 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] rounded-lg hover:bg-[var(--space-bg-card)] transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Active retainer: summary + logging ── */}
              {retainer && !editing && (
                <>
                  {/* Retainer header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--space-accent)' }}>
                        {TIER_LABEL[retainer.tier]}
                      </span>
                      <span className="text-sm text-[var(--space-text-secondary)] tabular-nums">
                        {fmt(retainer.monthlyFee ?? 0)}/mo · {fmtHrs(retainer.hoursPerMonth ?? 0)} hrs/mo
                      </span>
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-all"
                    >
                      <Pencil className="size-3" />
                      Edit
                    </button>
                  </div>

                  {/* Month summary card */}
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-4 bg-[var(--space-bg-card-hover)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setMonth((m) => shiftMonth(m, -1))} className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors">
                          <ChevronLeft className="size-4" />
                        </button>
                        <span className="text-sm font-semibold text-[var(--space-text-primary)] tabular-nums min-w-[110px] text-center">{monthLabel(month)}</span>
                        <button onClick={() => setMonth((m) => shiftMonth(m, 1))} className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors">
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold tabular-nums text-[var(--space-text-primary)]">{fmtHrs(used)}</span>
                        <span className="text-sm text-[var(--space-text-muted)]"> / {fmtHrs(cap)} hrs</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 rounded-full bg-[var(--space-bg-card)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: over ? 'var(--space-accent)' : 'var(--space-accent)' }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--space-text-tertiary)]">
                        {over
                          ? <span className="text-amber-500 font-semibold">{fmtHrs(totals?.overageHours ?? 0)} hrs over · {fmt(totals?.overageAmount ?? 0)}</span>
                          : <span>{fmtHrs(totals?.remaining ?? 0)} hrs remaining</span>}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap text-[var(--space-text-muted)]">
                        {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) =>
                          (totals?.byCategory?.[c] ?? 0) > 0 ? (
                            <span key={c} className="tabular-nums">{CATEGORY_LABEL[c]} {fmtHrs(totals!.byCategory[c])}</span>
                          ) : null,
                        )}
                      </div>
                    </div>
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
                        {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) => (
                          <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                        ))}
                      </select>
                      <input value={logNote} onChange={(e) => setLogNote(e.target.value)} placeholder="What did you do?" className={cn(inputCls, 'flex-1 min-w-[140px] py-1.5 text-xs')} />
                      <button
                        onClick={handleLog}
                        disabled={logging}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {logging ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                        Log
                      </button>
                    </div>
                  </div>

                  {/* Entries */}
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--space-accent)] mb-2.5">
                      Entries · {entries.length}
                    </p>
                    {entries.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-8 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
                        <CalendarClock className="size-5 text-[var(--space-text-muted)]" />
                        <p className="text-xs text-[var(--space-text-muted)]">No hours logged for {monthLabel(month)} yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {entries.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]"
                          >
                            <span className="text-[11px] font-mono tabular-nums text-[var(--space-text-muted)] shrink-0 w-14">
                              {String(e.date).slice(5, 10)}
                            </span>
                            <span className="text-sm font-bold tabular-nums text-[var(--space-text-primary)] shrink-0 w-12">{fmtHrs(e.hours)}h</span>
                            <span className="text-[10px] uppercase tracking-wide text-[var(--space-text-muted)] shrink-0 w-16">
                              {CATEGORY_LABEL[(e.category ?? 'work') as TimeEntryCategory]}
                            </span>
                            <span className="text-xs text-[var(--space-text-tertiary)] flex-1 min-w-0 truncate">{e.description || '—'}</span>
                            <button
                              onClick={() => handleDelete(e.id)}
                              disabled={deletingId === e.id}
                              className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 hover:bg-[var(--space-bg-card)] transition-colors disabled:opacity-50"
                            >
                              {deletingId === e.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
