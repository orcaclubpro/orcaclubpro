'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Loader2, Clock, Plus, Trash2, ChevronLeft, ChevronRight, Pencil,
  CalendarClock, PowerOff, FileDown, Check, X, ArrowRight, CalendarPlus, FileText,
  CircleCheck, Circle, Search, Building2, CornerDownLeft, AlertTriangle, Activity, Flame, Send,
  RotateCcw, ClipboardList, Rocket, DollarSign, Lightbulb, Mail, FileSignature,
  Repeat, Package, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RetainerRecapModal } from './RetainerRecapModal'
import { ScopeRecapModal } from './ScopeRecapModal'
import { RetainerInvoiceModal } from './RetainerInvoiceModal'
import { getClientAccountsList } from '@/actions/packages'
import type { RecapData } from '@/lib/retainers/recap'
import type { ScopeRecapData } from '@/lib/retainers/scopeRecap'
import {
  getRetainerSummary,
  getRetainerPortfolio,
  setRetainer,
  setRetainerActive,
  setRetainerAnchor,
  logHours,
  logPlannedHours,
  createDraft,
  updateTimeEntry,
  deleteTimeEntry,
  resetRetainerInvoice,
  setRetainerScope,
  activateRetainerPlan,
  setRetainerProposal,
  sendRetainerProposalEmail,
  convertScopeToPackage,
  type RetainerDoc,
  type TimeEntryDoc,
  type RetainerTotals,
  type RetainerTerms,
  type RetainerScheduled,
  type RetainerTier,
  type RetainerPortfolioRow,
  type RetainerHealth,
  type RetainerClientInfo,
  type RetainerNextCycle,
  type RetainerPitch,
  type RetainerProposalTerms,
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

/** The smallest playbook tier whose cap covers the pitched hours. */
function suggestTier(hours: number): RetainerTier {
  if (hours <= TIER_PRESETS.basic.hours) return 'basic'
  if (hours <= TIER_PRESETS.growth.hours) return 'growth'
  return 'enterprise'
}

/** A defensible opening fee for a pitch: the tier preset, or — past the playbook —
 *  the hours at the overage rate with a standing-commitment discount, to the nearest $50. */
function suggestFee(tier: RetainerTier, hours: number, overage: number): number {
  if (tier !== 'enterprise') return TIER_PRESETS[tier].fee
  return Math.max(0, Math.round((hours * overage * 0.8) / 50) * 50)
}
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
  const [portfolio, setPortfolio] = useState<RetainerPortfolioRow[]>([])
  const [portfolioLoaded, setPortfolioLoaded] = useState(false)
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
  const [clientInfo, setClientInfo] = useState<RetainerClientInfo | null>(null)
  const [nextCycle, setNextCycle] = useState<RetainerNextCycle | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Invoice flow + the lifted recap draft (keyed to a cycle so stale drafts never attach)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [recapDraft, setRecapDraft] = useState<{ cycleStart: string; data: RecapData } | null>(null)

  // Invoice reset — two-click confirm on the button itself (this voids a Stripe
  // invoice and deletes an order, so never a bare one-click).
  const [confirmResetInvoice, setConfirmResetInvoice] = useState(false)
  const [resettingInvoice, setResettingInvoice] = useState(false)
  const [resetInvoiceError, setResetInvoiceError] = useState<string | null>(null)

  // ── Scoping — pitch the work first, price it after ─────────────────────────
  // A scoping retainer has no cycle and no cap. Planned work (drafts carrying hour
  // estimates) and completed work (logged entries) accumulate against it; the pricing
  // panel then reads those totals back as the basis for the plan.
  const [pitch, setPitch] = useState<RetainerPitch | null>(null)
  const [setupMode, setSetupMode] = useState<'plan' | 'scope'>('plan')
  const [scopeSummary, setScopeSummary] = useState('')
  const [scopeSaving, setScopeSaving] = useState(false)
  const scopeSavedRef = useRef('')

  // Planned-work composer
  const [pDesc, setPDesc] = useState('')
  const [pHours, setPHours] = useState('')
  const [pCategory, setPCategory] = useState<TimeEntryCategory>('work')
  const [pPriority, setPPriority] = useState<TimeEntryPriority>('medium')
  const [addingPlanned, setAddingPlanned] = useState(false)
  const plannedRef = useRef<HTMLInputElement>(null)

  // Completed-work composer
  const [dDate, setDDate] = useState(todayInput())
  const [dHours, setDHours] = useState('')
  const [dDesc, setDDesc] = useState('')
  const [addingDone, setAddingDone] = useState(false)
  const doneRef = useRef<HTMLInputElement>(null)

  // Pricing panel — prefilled from the pitch, then staff-overridable
  const [pricingOpen, setPricingOpen] = useState(false)
  const [aTier, setATier] = useState<RetainerTier>('basic')
  const [aFee, setAFee] = useState('')
  const [aHours, setAHours] = useState('')
  const [aOverage, setAOverage] = useState('65')
  const [aStart, setAStart] = useState(todayInput())
  const [carryPlanned, setCarryPlanned] = useState(true)
  const [carryDone, setCarryDone] = useState(false)
  const [activating, setActivating] = useState(false)

  // The proposal document — saved terms, PDF preview, and the send-to-client form.
  const [proposal, setProposal] = useState<RetainerProposalTerms | null>(null)
  const [includeCompleted, setIncludeCompleted] = useState(false)
  const [proposalNote, setProposalNote] = useState('')
  const [savingProposal, setSavingProposal] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [sendTo, setSendTo] = useState('')
  const [sendMsg, setSendMsg] = useState('')
  const [sendingProposal, setSendingProposal] = useState(false)
  const [sendNotice, setSendNotice] = useState<string | null>(null)

  // The scope recap — the "what we have already done" companion to the proposal.
  // Composed here so its narrative survives the modal closing and can ride along as a
  // second attachment on the proposal email. Keyed to the retainer, not a cycle: a
  // scoping retainer has no cycle, which is the whole reason this document exists.
  const [scopeRecapOpen, setScopeRecapOpen] = useState(false)
  const [scopeRecapDraft, setScopeRecapDraft] = useState<{ retainerId: string; data: ScopeRecapData } | null>(null)
  const [attachRecap, setAttachRecap] = useState(false)

  // ── One-off scopes ─────────────────────────────────────────────────────────
  // Not every scope is recurring. A one-off is priced per deliverable and handed to
  // the packages system — which already owns itemized lines, payment schedules,
  // add-ons, and the proposal PDF — rather than growing a second one in here.
  const [engagement, setEngagement] = useState<'retainer' | 'oneoff'>('retainer')
  const [pkgName, setPkgName] = useState('')
  const [linePrices, setLinePrices] = useState<Record<string, string>>({})
  const [lineQtys, setLineQtys] = useState<Record<string, string>>({})
  const [deliveredPrice, setDeliveredPrice] = useState('')
  const [extraLines, setExtraLines] = useState<{ name: string; qty: string; price: string }[]>([])
  const [converting, setConverting] = useState(false)

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

  // The portfolio board — every active retainer's current-cycle burn. Refreshed
  // whenever the picker is showing so it reflects hours just logged elsewhere.
  const loadPortfolio = useCallback(async () => {
    const r = await getRetainerPortfolio()
    if (r.success) setPortfolio(r.rows)
    setPortfolioLoaded(true)
  }, [])

  useEffect(() => {
    if (!active || selectedClientId) return
    void loadPortfolio()
  }, [active, selectedClientId, loadPortfolio])

  const load = useCallback(async () => {
    if (!selectedClientId) {
      setRetainerDoc(null); setCycle(null); setTerms(null)
      setLogged([]); setDrafts([]); setTotals(null); setScheduled(null)
      setClientInfo(null); setNextCycle(null); setPitch(null); setProposal(null)
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
      setClientInfo(r.client)
      setNextCycle(r.nextCycle)
      setPitch(r.pitch)
      setProposal(r.proposal)
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
      setScopeSummary(retainer.scopeSummary ?? '')
      scopeSavedRef.current = retainer.scopeSummary ?? ''
      setSetupMode(retainer.status === 'scoping' ? 'scope' : 'plan')
    } else {
      applyPreset('basic')
      setScopeSummary('')
      scopeSavedRef.current = ''
      setSetupMode('plan')
      setPricingOpen(false)
    }
  }, [retainer])

  // Prefill the proposal panel: an already-saved proposal wins, otherwise suggest from
  // the pitch. Only while the panel is closed, so a staff edit is never overwritten.
  useEffect(() => {
    if (!pitch || pricingOpen) return
    if (proposal && (proposal.monthlyFee > 0 || proposal.hoursPerMonth > 0)) {
      setATier(proposal.tier)
      setAFee(String(proposal.monthlyFee))
      setAHours(String(proposal.hoursPerMonth))
      setAOverage(String(proposal.overageRate))
      if (proposal.startDate) setAStart(toDayInput(proposal.startDate))
      setIncludeCompleted(proposal.includesCompletedWork)
      setProposalNote(proposal.note ?? '')
      return
    }
    const suggestedHours = Math.max(1, Math.ceil(pitch.plannedHours || pitch.doneHours || 0))
    const t = suggestTier(suggestedHours)
    const over = TIER_PRESETS[t].overage
    setATier(t)
    setAHours(String(suggestedHours))
    setAOverage(String(over))
    setAFee(String(suggestFee(t, suggestedHours, over)))
  }, [pitch, proposal, pricingOpen])

  // Seed the proposal recipient from the client account, unless staff already typed.
  useEffect(() => {
    if (clientInfo?.email && !sendTo) setSendTo(clientInfo.email)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientInfo?.email])

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
  // Empty query rests on the portfolio board; typing switches to the client list.
  // Keyboard (↑↓↵) drives whichever is showing.
  const showingBoard = !pq && portfolio.length > 0
  const navIds = showingBoard ? portfolio.map((p) => p.clientAccountId) : filteredClients.map((c) => c.id)
  const highlightIdx = Math.min(pickIdx, Math.max(0, navIds.length - 1))

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
    setRecapDraft(null)
    setScopeRecapDraft(null)
    setAttachRecap(false)
    setConfirmResetInvoice(false)
    setResetInvoiceError(null)
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
    setInvoiceOpen(false)
    setRecapDraft(null)
    setScopeRecapOpen(false)
    setScopeRecapDraft(null)
    setAttachRecap(false)
    setConfirmResetInvoice(false)
    setResetInvoiceError(null)
  }, [])

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null

  // ── Focus management — the picker owns focus on entry; Plan/Log (and the scoping
  // console) focus their primary input so arriving lands ready to type.
  const retainerStatus = retainer?.status ?? null
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => {
      if (!selectedClientId) pickerRef.current?.focus()
      else if (loading) return
      else if (retainerStatus === 'scoping') plannedRef.current?.focus()
      else if (stage === 'plan') draftRef.current?.focus()
      else if (stage === 'log') logRef.current?.focus()
    }, 60)
    return () => clearTimeout(t)
  }, [active, selectedClientId, stage, loading, retainerStatus])

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
        if (scopeRecapOpen) { setScopeRecapOpen(false); return }
        if (recapOpen) { setRecapOpen(false); return }
        if (invoiceOpen) { setInvoiceOpen(false); return }
        if (editId) { setEditId(null); setELogMode(false); return }
        if (editing && retainer) { setEditing(false); return }
        if (pricingOpen) { setPricingOpen(false); return }
        clearClient()
        return
      }
      if (e.key >= '1' && e.key <= '4' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
        if (!selectedClientId || !retainer || editing || recapOpen || scopeRecapOpen || invoiceOpen || loading) return
        if (retainer.status === 'scoping') return // the pitch console has no stages
        setStage(STAGES[Number(e.key) - 1].id)
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [active, selectedClientId, recapOpen, scopeRecapOpen, invoiceOpen, editId, editing, retainer, loading, pricingOpen, clearClient])

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

  // ── Scoping handlers ───────────────────────────────────────────────────────

  /** Autosave the pitch headline on blur — only when it actually changed. */
  async function handleSaveScope() {
    if (!retainer) return
    const next = scopeSummary.trim()
    if (next === scopeSavedRef.current.trim()) return
    setScopeSaving(true)
    const r = await setRetainerScope({ retainerId: retainer.id, scopeSummary: next })
    if (r.success) scopeSavedRef.current = next
    else setError(r.error ?? 'Failed to save scope')
    setScopeSaving(false)
  }

  /** Add a pitched item — planned work with an hour estimate, no cycle needed. */
  async function handleAddPlanned() {
    setError(null)
    if (!retainer) return
    if (!pDesc.trim()) { setError('Describe the planned work'); return }
    setAddingPlanned(true)
    const r = await createDraft({
      retainerId: retainer.id,
      clientAccountId: selectedClientId,
      // Scoping has no cycle — date it today; activation re-dates it into cycle one.
      date: todayInput(),
      description: pDesc.trim(),
      category: pCategory,
      priority: pPriority,
      hours: pHours === '' ? undefined : parseFloat(pHours),
    })
    if (r.success) {
      setPDesc(''); setPHours(''); setPPriority('medium')
      await load()
      plannedRef.current?.focus()
    } else setError(r.error ?? 'Failed to add planned item')
    setAddingPlanned(false)
  }

  /** Record work already delivered during scoping — the evidence behind the price. */
  async function handleAddDone() {
    setError(null)
    if (!retainer) return
    const h = parseFloat(dHours)
    if (!(h > 0)) { setError('Enter hours greater than zero'); return }
    setAddingDone(true)
    const r = await logHours({
      retainerId: retainer.id,
      clientAccountId: selectedClientId,
      date: dDate,
      hours: h,
      category: 'work',
      description: dDesc.trim() || undefined,
    })
    if (r.success) {
      setDHours(''); setDDesc('')
      await load()
      doneRef.current?.focus()
    } else setError(r.error ?? 'Failed to log work')
    setAddingDone(false)
  }

  /**
   * Hand a one-off scope to the packages system: create the proposal, move the
   * pitched work into its milestone log, then jump the console to it. The retainer
   * side is retired by the action, so the station falls back to the picker.
   */
  async function handleConvertToPackage() {
    setError(null); setSendNotice(null)
    if (!retainer) return

    const lineItems = [
      ...drafts.map((d) => ({
        name: d.description?.trim() || 'Work item',
        description: d.hours ? `${fmtHrs(d.hours)}h estimated` : undefined,
        price: linePriceOf(d.id),
        quantity: lineQtyOf(d.id),
      })),
      ...(deliveredPriceNum > 0
        ? [{ name: `Work delivered to date (${fmtHrs(doneHours)}h)`, price: deliveredPriceNum, quantity: 1 }]
        : []),
      ...extraLines
        .filter((x) => x.name.trim())
        .map((x) => ({
          name: x.name.trim(),
          price: parseFloat(x.price) || 0,
          quantity: Math.max(1, parseInt(x.qty, 10) || 1),
        })),
    ]
    if (lineItems.length === 0) { setError('Add at least one line item'); return }

    setConverting(true)
    const r = await convertScopeToPackage({
      retainerId: retainer.id,
      name: pkgName.trim() || undefined,
      coverMessage: proposalNote.trim() || undefined,
      lineItems,
    })
    setConverting(false)
    if (!r.success) { setError(r.error ?? 'Failed to create the proposal'); return }

    // Hand off to the Milestones station, which owns packages from here.
    window.dispatchEvent(new CustomEvent('orcaclub:open-milestones', { detail: { packageId: r.packageId } }))
    clearClient()
  }

  /** Persist the priced offer without starting anything. Returns ok so the callers
   *  that follow it (preview, send) can bail if the save failed. */
  async function saveProposal(): Promise<boolean> {
    if (!retainer) return false
    const fee = parseFloat(aFee)
    const hrs = parseFloat(aHours)
    if (!(hrs > 0)) { setError('Monthly hours must be greater than zero'); return false }
    if (!(fee > 0)) { setError('Enter a monthly fee'); return false }
    setSavingProposal(true)
    const r = await setRetainerProposal({
      retainerId: retainer.id,
      tier: aTier,
      monthlyFee: fee,
      hoursPerMonth: hrs,
      overageRate: aOverage === '' ? 65 : parseFloat(aOverage),
      startDate: aStart || undefined,
      includesCompletedWork: includeCompleted,
      note: proposalNote.trim() || undefined,
    })
    setSavingProposal(false)
    if (!r.success) { setError(r.error ?? 'Failed to save proposal'); return false }
    await load()
    return true
  }

  /** Save, then open the very PDF the client would receive. */
  async function handlePreviewProposal() {
    setError(null); setSendNotice(null)
    if (!retainer) return
    if (!(await saveProposal())) return
    window.open(`/api/retainers/${retainer.id}/proposal/pdf`, '_blank')
  }

  /** Save, then email the proposal with the PDF attached. Does NOT start the retainer. */
  async function handleSendProposal() {
    setError(null); setSendNotice(null)
    if (!retainer) return
    if (!(await saveProposal())) return
    setSendingProposal(true)
    const r = await sendRetainerProposalEmail({
      retainerId: retainer.id,
      recipients: sendTo.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean),
      message: sendMsg.trim() || undefined,
      // The recap re-derives server-side either way — this only carries the narrative.
      attachScopeRecap: attachRecap,
      scopeRecap: attachRecap ? scopeRecap : null,
    })
    setSendingProposal(false)
    if (r.success) {
      setSendOpen(false)
      setSendNotice(
        `Proposal sent to ${r.recipients.join(', ')}.${attachRecap ? (r.recapAttached ? ' Work recap attached.' : ' The work recap could not be attached.') : ''}`,
      )
      await load()
    } else setError(r.error ?? 'Failed to send proposal')
  }

  /** Price the pitch and start the retainer — this is what creates the first cycle. */
  async function handleActivatePlan() {
    setError(null)
    if (!retainer) return
    const fee = parseFloat(aFee)
    const hrs = parseFloat(aHours)
    if (!(hrs > 0)) { setError('Monthly hours must be greater than zero'); return }
    if (!(fee >= 0)) { setError('Enter a monthly fee'); return }
    setActivating(true)
    const r = await activateRetainerPlan({
      retainerId: retainer.id,
      tier: aTier,
      monthlyFee: fee,
      hoursPerMonth: hrs,
      overageRate: aOverage === '' ? 65 : parseFloat(aOverage),
      startDate: aStart || undefined,
      carryWork: { planned: carryPlanned, done: carryDone },
    })
    if (r.success) {
      setPricingOpen(false)
      setStage('overview')
      setRefDate('') // land on the freshly-created first cycle
      await load()
    } else setError(r.error ?? 'Failed to start retainer')
    setActivating(false)
  }

  async function handleSaveRetainer() {
    setError(null)
    if (!selectedClientId) { setError('Select a client first'); return }
    setSavingRetainer(true)
    // Scope mode withholds fee/cap so the retainer starts unpriced, with no cycle.
    const scopeMode = !retainer && setupMode === 'scope'
    const r = await setRetainer({
      clientAccountId: selectedClientId,
      tier,
      monthlyFee: feeStr === '' ? undefined : parseFloat(feeStr),
      hoursPerMonth: hoursStr === '' ? undefined : parseFloat(hoursStr),
      overageRate: overageStr === '' ? 65 : parseFloat(overageStr),
      startDate: startDate || undefined,
      notes: notes || undefined,
      scopeSummary: scopeSummary.trim() || undefined,
      mode: scopeMode ? 'scope' : 'plan',
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

  // Reset the billed cycle's invoice — first click arms, second click runs.
  async function handleResetInvoice() {
    if (!retainer || !nextCycle?.invoice) return
    if (!confirmResetInvoice) {
      setConfirmResetInvoice(true)
      setResetInvoiceError(null)
      return
    }
    setConfirmResetInvoice(false)
    setResetInvoiceError(null)
    setResettingInvoice(true)
    const r = await resetRetainerInvoice({ retainerId: retainer.id, cycleStart: nextCycle.start })
    setResettingInvoice(false)
    if (r.success) await load()
    else setResetInvoiceError(r.error ?? 'Failed to reset invoice')
  }

  function handleExport() {
    if (!retainer || !cycle) return
    const url = `/api/retainers/${retainer.id}/pdf?ref=${encodeURIComponent(cycle.start)}`
    window.open(url, '_blank')
  }

  const showForm = !retainer || editing
  // Scoping: pitched but unpriced. No cycle exists, so the cycle stages and navigator
  // are meaningless here — the pitch console stands in for the whole body.
  const scoping = retainer?.status === 'scoping'
  // Keyed to the retainer so a draft composed for one client never attaches to another.
  const scopeRecap = scopeRecapDraft && scopeRecapDraft.retainerId === retainer?.id ? scopeRecapDraft.data : null
  const plannedHours = pitch?.plannedHours ?? 0
  const doneHours = pitch?.doneHours ?? 0
  // What the proposed plan implies per hour, and what the scoping work was worth at it.
  const aFeeNum = parseFloat(aFee) || 0
  const aHoursNum = parseFloat(aHours) || 0
  const effRate = aHoursNum > 0 ? aFeeNum / aHoursNum : 0
  const doneValue = doneHours * effRate
  const pitchedTotal = Math.round((plannedHours + doneHours) * 100) / 100
  const capShortfall = aHoursNum > 0 && plannedHours > aHoursNum

  // One-off pricing: every pitched item priced, plus optional extras and a line for
  // work already delivered. Quantities default to 1 until staff say otherwise.
  const lineQtyOf = (id: string) => Math.max(1, parseInt(lineQtys[id] ?? '1', 10) || 1)
  const linePriceOf = (id: string) => parseFloat(linePrices[id] ?? '') || 0
  const deliveredPriceNum = parseFloat(deliveredPrice) || 0
  const extrasTotal = extraLines.reduce(
    (t, x) => t + (parseFloat(x.price) || 0) * Math.max(1, parseInt(x.qty, 10) || 1),
    0,
  )
  const oneOffTotal =
    Math.round(
      (drafts.reduce((t, d) => t + linePriceOf(d.id) * lineQtyOf(d.id), 0) + deliveredPriceNum + extrasTotal) * 100,
    ) / 100
  const oneOffLineCount =
    drafts.length + (deliveredPriceNum > 0 ? 1 : 0) + extraLines.filter((x) => x.name.trim()).length
  const oneOffUnpriced = drafts.filter((d) => linePriceOf(d.id) <= 0).length

  const cap = totals?.cap ?? 0
  const used = totals?.used ?? 0
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0
  const over = (totals?.overageHours ?? 0) > 0
  const doneCount = drafts.filter((d) => d.completion === 'complete').length

  // ── Cycle timing + burn projection (overview) ──────────────────────────────────
  // Pace only makes sense for the cycle happening now; past/future cycles are settled.
  const nowMs = Date.now()
  const cStart = cycle ? Date.parse(cycle.start) : 0
  const cEnd = cycle ? Date.parse(cycle.end) : 0
  const isCurrentCycle = Boolean(cycle) && nowMs >= cStart && nowMs < cEnd
  const isPastCycle = Boolean(cycle) && cEnd <= nowMs
  const cycleDays = cycle ? Math.max(1, Math.round((cEnd - cStart) / 86_400_000)) : 0
  const daysLeft = isCurrentCycle ? Math.max(0, Math.ceil((cEnd - nowMs) / 86_400_000)) : 0
  const dayOfCycle = isCurrentCycle ? Math.min(cycleDays, Math.floor((nowMs - cStart) / 86_400_000) + 1) : isPastCycle ? cycleDays : 0
  const elapsedFrac = isCurrentCycle ? Math.min(1, Math.max(0, (nowMs - cStart) / (cEnd - cStart))) : isPastCycle ? 1 : 0
  // Linear projection, held back until a couple of days in so it isn't wild on day one.
  const projHours = isCurrentCycle && elapsedFrac > 0.06 ? used / elapsedFrac : null
  const projOverHrs = projHours != null && cap > 0 ? Math.max(0, projHours - cap) : 0
  const projOverAmt = projOverHrs * (totals?.overageRate ?? 0)
  const aheadOfPace = isCurrentCycle && cap > 0 && pct / 100 > elapsedFrac + 0.05

  // Overview surfacing: high-priority planned work still open, and the latest logged time.
  const attention = drafts.filter((d) => (d.priority ?? 'medium') === 'high' && d.completion !== 'complete').slice(0, 4)
  const recent = logged.slice(0, 4)

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
    const attentionCount = portfolio.filter((p) => p.health === 'over' || p.health === 'warning').length
    return (
      <div className="relative flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto w-full pt-[4vh] pb-8 space-y-5">
            <div className="text-center space-y-1.5">
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[var(--space-text-tertiary)]">Retainer</p>
              <p className="text-xs text-[var(--space-text-muted)]">
                {showingBoard ? 'Open a retainer to manage — or search any client to set one up.' : 'Type to search, ↵ to select.'}
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
                    setPickIdx((i) => Math.min(navIds.length - 1, i + 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setPickIdx((i) => Math.max(0, i - 1))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    const id = navIds[highlightIdx]
                    if (id) selectClient(id)
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

            {!pq ? (
              /* ── Resting state: the portfolio board ── */
              !portfolioLoaded ? (
                <div className="flex justify-center py-12"><Loader2 className="size-4 text-[var(--space-text-muted)] animate-spin" /></div>
              ) : portfolio.length === 0 ? (
                <p className="text-center text-xs text-[var(--space-text-muted)] py-12">
                  No active retainers yet. Search a client above to set one up.
                </p>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 px-1">
                    <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[var(--space-text-muted)]">
                      Active retainers · {portfolio.length}
                    </p>
                    {attentionCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                        <AlertTriangle className="size-3" /> {attentionCount} need attention
                      </span>
                    )}
                  </div>
                  <div ref={pickListRef} className="space-y-1.5">
                    {portfolio.map((row, i) => (
                      <BoardRow
                        key={row.retainerId}
                        row={row}
                        idx={i}
                        isSel={i === highlightIdx}
                        onSelect={() => selectClient(row.clientAccountId)}
                        onHover={() => setPickIdx(i)}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : (
              /* ── Search results ── */
              !clientsLoaded ? (
                <div className="flex justify-center py-10"><Loader2 className="size-4 text-[var(--space-text-muted)] animate-spin" /></div>
              ) : filteredClients.length === 0 ? (
                <p className="text-center text-xs text-[var(--space-text-muted)] py-10">No clients match “{pickQuery}”.</p>
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
              )
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
            {scoping && !editing && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--space-text-muted)] mt-0.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-amber-500/30 bg-amber-500/10 text-amber-500">
                  Scoping
                </span>
                <span className="tabular-nums">
                  {pitchedTotal > 0 ? `${fmtHrs(pitchedTotal)} hrs pitched · unpriced` : 'No plan yet'}
                </span>
              </p>
            )}
          </div>
          <button onClick={clearClient} className={ghostBtn} title="Change client (esc)">
            <Search className="size-3" /> Change client
          </button>
        </div>

        {retainer && !scoping && !editing && !loading && (
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

              {/* ── How to start: priced now, or scoped now and priced later ── */}
              {!retainer && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {([
                    { id: 'plan' as const, icon: DollarSign, title: 'Start on a plan', hint: 'Terms are agreed — bill from cycle one.' },
                    { id: 'scope' as const, icon: Lightbulb, title: 'Scope first, price later', hint: 'Pitch the work, set pricing once it is clear.' },
                  ]).map((opt) => {
                    const OptIcon = opt.icon
                    const on = setupMode === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSetupMode(opt.id)}
                        className={cn(
                          'flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors',
                          on
                            ? 'bg-[var(--space-bg-card)] text-[var(--space-text-primary)]'
                            : 'border-[var(--space-border-hard)] text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)]',
                        )}
                        style={on ? { borderColor: 'var(--space-accent)' } : {}}
                      >
                        <OptIcon className={cn('size-4 shrink-0 mt-0.5', on && 'text-[var(--space-accent)]')} />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold leading-tight">{opt.title}</span>
                          <span className="block text-[10px] text-[var(--space-text-muted)] mt-0.5 leading-snug">{opt.hint}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* The pitch headline — the one thing worth capturing before pricing. */}
              {setupMode === 'scope' && !retainer && (
                <label className="block">
                  <span className={fieldLabel}>What this retainer covers</span>
                  <textarea
                    value={scopeSummary}
                    onChange={(e) => setScopeSummary(e.target.value)}
                    rows={2}
                    placeholder="Ongoing Shopify support, monthly reporting, and ad-hoc dev…"
                    className={cn(inputCls, 'mt-1 resize-y')}
                  />
                </label>
              )}

              {(retainer ? !scoping : setupMode === 'plan') && (
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
              )}

              {(retainer ? !scoping : setupMode === 'plan') && (
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
              )}

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className={fieldLabel}>{setupMode === 'scope' && !retainer ? 'Scoping since' : 'Start date'}</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={cn(inputCls, 'mt-1')} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Notes</span>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal" className={cn(inputCls, 'mt-1')} />
                </label>
              </div>

              {retainer && !scoping && (
                <p className="text-[10px] text-[var(--space-text-muted)]">
                  Fee / hours / overage changes take effect next cycle. Notes and start date apply immediately.
                </p>
              )}
              {scoping && (
                <p className="text-[10px] text-[var(--space-text-muted)]">
                  Still scoping — pricing is set on the pitch console, which is what starts the first cycle.
                </p>
              )}

              {/* ── Cycle anchor — explicit re-anchor (rewrites activatedAt) ── */}
              {retainer && !scoping && (
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
                  {retainer ? 'Save changes' : setupMode === 'scope' ? 'Start scoping' : 'Set up retainer'}
                </button>
                {retainer && (
                  <button onClick={() => setEditing(false)} className="px-3 py-2 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] rounded-lg hover:bg-[var(--space-bg-card)] transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : scoping ? (
            /* ── Scoping console — pitch the work, then price it ────────────────
               No cycle exists yet, so this replaces the whole stage body. Planned
               and completed work accumulate here; the pricing panel below reads
               those totals back as the basis for the plan that starts the cycle. */
            <>
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3">
                <p className="text-xs text-[var(--space-text-secondary)] leading-relaxed">
                  <span className="font-semibold text-amber-500">Scoping.</span>{' '}
                  Pitch what you plan to do and record what you have already done. Nothing bills
                  until you price it — {engagement === 'retainer'
                    ? 'that is what starts the first cycle.'
                    : 'that is what creates the proposal.'}
                </p>
              </div>

              {/* ── Recurring, or a one-off job? Decides what the pricing step produces ── */}
              <div className="grid sm:grid-cols-2 gap-2">
                {([
                  { id: 'retainer' as const, icon: Repeat, title: 'Recurring retainer', hint: 'Monthly fee and hour cap, billed each cycle.' },
                  { id: 'oneoff' as const, icon: Package, title: 'One-off project', hint: 'Itemized deliverables, billed on a schedule.' },
                ]).map((opt) => {
                  const OptIcon = opt.icon
                  const on = engagement === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setEngagement(opt.id); setPricingOpen(false); setSendNotice(null) }}
                      className={cn(
                        'flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors',
                        on
                          ? 'bg-[var(--space-bg-card-hover)] text-[var(--space-text-primary)]'
                          : 'border-[var(--space-border-hard)] text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)]',
                      )}
                      style={on ? { borderColor: 'var(--space-accent)' } : {}}
                    >
                      <OptIcon className={cn('size-4 shrink-0 mt-0.5', on && 'text-[var(--space-accent)]')} />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold leading-tight">{opt.title}</span>
                        <span className="block text-[10px] text-[var(--space-text-muted)] mt-0.5 leading-snug">{opt.hint}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* ── The pitch headline ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={fieldLabel}>What this retainer covers</span>
                  {scopeSaving && <Loader2 className="size-3 animate-spin text-[var(--space-text-muted)]" />}
                </div>
                <textarea
                  value={scopeSummary}
                  onChange={(e) => setScopeSummary(e.target.value)}
                  onBlur={handleSaveScope}
                  rows={2}
                  placeholder="Ongoing Shopify support, monthly reporting, and ad-hoc dev…"
                  className={cn(inputCls, 'resize-y')}
                />
              </div>

              {/* ── The evidence, at a glance ── */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Planned', value: `${fmtHrs(plannedHours)}h`, sub: `${pitch?.plannedCount ?? 0} item${(pitch?.plannedCount ?? 0) === 1 ? '' : 's'}`, icon: ClipboardList },
                  { label: 'Done', value: `${fmtHrs(doneHours)}h`, sub: `${pitch?.doneCount ?? 0} entr${(pitch?.doneCount ?? 0) === 1 ? 'y' : 'ies'}`, icon: Check },
                  { label: 'Pitched', value: `${fmtHrs(pitchedTotal)}h`, sub: 'total so far', icon: Activity },
                ].map((c) => {
                  const CIcon = c.icon
                  return (
                    <div key={c.label} className="rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <CIcon className="size-3 text-[var(--space-text-muted)]" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--space-text-muted)]">{c.label}</span>
                      </div>
                      <p className="text-lg font-semibold tabular-nums text-[var(--space-text-primary)] mt-1 leading-none">{c.value}</p>
                      <p className="text-[10px] text-[var(--space-text-muted)] mt-1">{c.sub}</p>
                    </div>
                  )
                })}
              </div>

              {/* ── Planned work — the pitch ── */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="size-3.5" style={{ color: 'var(--space-accent)' }} />
                  <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[var(--space-text-tertiary)]">
                    Planned work
                  </p>
                  <span className="text-[10px] text-[var(--space-text-muted)] tabular-nums">
                    {fmtHrs(plannedHours)}h estimated
                  </span>
                </div>

                {drafts.length > 0 && (
                  <div className="rounded-xl border border-[var(--space-border-hard)] divide-y divide-[var(--space-border-hard)] overflow-hidden">
                    {drafts.map((d) =>
                      editId === d.id ? (
                        <div key={d.id} className="p-2">{renderEditor()}</div>
                      ) : (
                        <div key={d.id} className="flex items-center gap-2.5 px-3 py-2.5 group">
                          <span className="flex-1 min-w-0 text-xs text-[var(--space-text-secondary)] truncate">
                            {d.description || 'Planned work'}
                          </span>
                          <PriorityBadge priority={d.priority} />
                          <span className="text-xs tabular-nums text-[var(--space-text-muted)] shrink-0 w-12 text-right">
                            {d.hours ? `${fmtHrs(d.hours)}h` : '—'}
                          </span>
                          <button onClick={() => openEditor(d)} title="Edit" className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            <Pencil className="size-3" />
                          </button>
                          <button onClick={() => handleDelete(d.id)} disabled={deletingId === d.id} title="Remove" className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            {deletingId === d.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}

                <div className="flex items-end gap-2 flex-wrap">
                  <input
                    ref={plannedRef}
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddPlanned() }}
                    placeholder="Planned work — e.g. Monthly performance report"
                    className={cn(inputCls, 'flex-1 min-w-[180px] py-1.5 text-xs')}
                  />
                  <input
                    type="number" min={0} step="0.25" title="Estimated hours per month"
                    value={pHours}
                    onChange={(e) => setPHours(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddPlanned() }}
                    placeholder="Est h"
                    className={cn(numCls, 'w-20 text-xs py-1.5')}
                  />
                  <select value={pCategory} onChange={(e) => setPCategory(e.target.value as TimeEntryCategory)} className={cn(selectCls, 'py-1.5')}>
                    {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                  </select>
                  <select value={pPriority} onChange={(e) => setPPriority(e.target.value as TimeEntryPriority)} className={cn(selectCls, 'py-1.5')} title="Priority">
                    {(Object.keys(PRIORITY_LABEL) as TimeEntryPriority[]).map((pr) => <option key={pr} value={pr}>{PRIORITY_LABEL[pr]}</option>)}
                  </select>
                  <button onClick={handleAddPlanned} disabled={addingPlanned || !pDesc.trim()} className={accentBtn}>
                    {addingPlanned ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add
                  </button>
                </div>
              </div>

              {/* ── Work already delivered — what justifies the price ── */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="size-3.5" style={{ color: 'var(--space-accent)' }} />
                  <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[var(--space-text-tertiary)]">
                    Work done so far
                  </p>
                  <span className="text-[10px] text-[var(--space-text-muted)] tabular-nums">{fmtHrs(doneHours)}h logged</span>
                </div>

                {logged.length > 0 && (
                  <div className="rounded-xl border border-[var(--space-border-hard)] divide-y divide-[var(--space-border-hard)] overflow-hidden">
                    {logged.map((l) =>
                      editId === l.id ? (
                        <div key={l.id} className="p-2">{renderEditor()}</div>
                      ) : (
                        <div key={l.id} className="flex items-center gap-2.5 px-3 py-2.5 group">
                          <span className="text-[10px] tabular-nums text-[var(--space-text-muted)] shrink-0 w-14">{fmtDay(l.date).replace(/, \d{4}$/, '')}</span>
                          <span className="flex-1 min-w-0 text-xs text-[var(--space-text-secondary)] truncate">
                            {l.description || CATEGORY_LABEL[(l.category ?? 'work') as TimeEntryCategory]}
                          </span>
                          <span className="text-xs font-semibold tabular-nums text-[var(--space-text-primary)] shrink-0 w-12 text-right">{fmtHrs(l.hours)}h</span>
                          <button onClick={() => openEditor(l)} title="Edit" className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            <Pencil className="size-3" />
                          </button>
                          <button onClick={() => handleDelete(l.id)} disabled={deletingId === l.id} title="Remove" className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            {deletingId === l.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}

                <div className="flex items-end gap-2 flex-wrap">
                  <input type="date" value={dDate} onChange={(e) => setDDate(e.target.value)} className={cn(numCls, 'w-36 text-xs py-1.5')} />
                  <input
                    ref={doneRef}
                    type="number" min={0} step="0.25" title="Hours worked"
                    value={dHours}
                    onChange={(e) => setDHours(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddDone() }}
                    placeholder="Hrs"
                    className={cn(numCls, 'w-16 text-xs py-1.5')}
                  />
                  <input
                    value={dDesc}
                    onChange={(e) => setDDesc(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddDone() }}
                    placeholder="What was done"
                    className={cn(inputCls, 'flex-1 min-w-[160px] py-1.5 text-xs')}
                  />
                  <button onClick={handleAddDone} disabled={addingDone || !(parseFloat(dHours) > 0)} className={accentBtn}>
                    {addingDone ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Log
                  </button>
                </div>
              </div>

              {/* ── The work recap — the companion document that justifies the price ──
                  Sits above the pricing panel because it belongs to the pitch, not the
                  offer: both engagement modes send one, and it reads the same two piles
                  of work regardless of how they end up being billed. */}
              <button
                type="button"
                onClick={() => setScopeRecapOpen(true)}
                className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] text-left transition-colors hover:border-[var(--space-accent-glow)]"
              >
                <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--space-accent-soft)' }}>
                  <BookOpen className="size-4" style={{ color: 'var(--space-accent)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--space-text-primary)] leading-tight">
                    Work recap {scopeRecap && <span className="text-[10px] font-medium text-[var(--space-accent)]">· composed</span>}
                  </p>
                  <p className="text-[11px] text-[var(--space-text-muted)] mt-0.5">
                    {doneHours > 0
                      ? `A client-facing deck: ${fmtHrs(doneHours)}h already delivered${plannedHours > 0 ? `, and the ${fmtHrs(plannedHours)}h you propose next` : ''}.`
                      : 'A client-facing deck of the work you propose — pairs with the proposal.'}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-[var(--space-text-muted)] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* ── The proposal — price it, send it, then start on acceptance ── */}
              {engagement === 'oneoff' ? (
                /* One-off: price each deliverable, then hand the whole thing to the
                   packages system, which owns proposals, schedules, and add-ons. */
                <div className="rounded-xl border p-4 sm:p-5 space-y-4 bg-[var(--space-bg-card-hover)]" style={{ borderColor: 'var(--space-accent-glow)' }}>
                  <div className="flex items-center gap-2">
                    <Package className="size-3.5" style={{ color: 'var(--space-accent)' }} />
                    <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[var(--space-text-tertiary)]">Price the deliverables</p>
                  </div>

                  <label className="block">
                    <span className={fieldLabel}>Proposal name</span>
                    <input
                      value={pkgName}
                      onChange={(e) => setPkgName(e.target.value)}
                      placeholder={`${selectedClient?.company || selectedClient?.name || 'Client'} — ${scopeSummary.trim().slice(0, 40) || 'Project'}`}
                      className={cn(inputCls, 'mt-1')}
                    />
                  </label>

                  {drafts.length === 0 && extraLines.length === 0 && (
                    <p className="text-xs text-[var(--space-text-muted)]">
                      Pitch some planned work above and it becomes the line items here — or add lines directly.
                    </p>
                  )}

                  {/* Pitched work, now with a price against each item */}
                  {drafts.length > 0 && (
                    <div className="rounded-lg border border-[var(--space-border-hard)] divide-y divide-[var(--space-border-hard)] overflow-hidden">
                      {drafts.map((d) => (
                        <div key={d.id} className="flex items-center gap-2 px-3 py-2">
                          <span className="flex-1 min-w-0 text-xs text-[var(--space-text-secondary)] truncate">
                            {d.description || 'Work item'}
                            {d.hours ? <span className="text-[var(--space-text-muted)]"> · {fmtHrs(d.hours)}h est</span> : null}
                          </span>
                          <input
                            type="number" min={1} title="Quantity"
                            value={lineQtys[d.id] ?? '1'}
                            onChange={(e) => setLineQtys((m) => ({ ...m, [d.id]: e.target.value }))}
                            className={cn(numCls, 'w-14 text-xs py-1.5')}
                          />
                          <input
                            type="number" min={0} title="Price (USD)" placeholder="$"
                            value={linePrices[d.id] ?? ''}
                            onChange={(e) => setLinePrices((m) => ({ ...m, [d.id]: e.target.value }))}
                            className={cn(numCls, 'w-24 text-xs py-1.5')}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Work already delivered can be billed as its own line, or left off */}
                  {doneHours > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] px-3 py-2">
                      <span className="flex-1 min-w-0 text-xs text-[var(--space-text-secondary)]">
                        Work delivered to date · {fmtHrs(doneHours)}h
                        <span className="block text-[10px] text-[var(--space-text-muted)]">Leave blank to include it at no charge.</span>
                      </span>
                      <input
                        type="number" min={0} placeholder="$"
                        value={deliveredPrice}
                        onChange={(e) => setDeliveredPrice(e.target.value)}
                        className={cn(numCls, 'w-24 text-xs py-1.5')}
                      />
                    </div>
                  )}

                  {/* Extra lines that were never pitched as work */}
                  {extraLines.map((x, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={x.name}
                        onChange={(e) => setExtraLines((xs) => xs.map((v, j) => (j === i ? { ...v, name: e.target.value } : v)))}
                        placeholder="Line item — e.g. Stock photography licence"
                        className={cn(inputCls, 'flex-1 py-1.5 text-xs')}
                      />
                      <input
                        type="number" min={1} title="Quantity"
                        value={x.qty}
                        onChange={(e) => setExtraLines((xs) => xs.map((v, j) => (j === i ? { ...v, qty: e.target.value } : v)))}
                        className={cn(numCls, 'w-14 text-xs py-1.5')}
                      />
                      <input
                        type="number" min={0} placeholder="$"
                        value={x.price}
                        onChange={(e) => setExtraLines((xs) => xs.map((v, j) => (j === i ? { ...v, price: e.target.value } : v)))}
                        className={cn(numCls, 'w-24 text-xs py-1.5')}
                      />
                      <button
                        type="button"
                        onClick={() => setExtraLines((xs) => xs.filter((_, j) => j !== i))}
                        className="size-7 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setExtraLines((xs) => [...xs, { name: '', qty: '1', price: '' }])} className={ghostBtn}>
                    <Plus className="size-3.5" /> Add line item
                  </button>

                  <div className="flex items-center justify-between rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] px-3 py-2.5">
                    <span className="text-xs text-[var(--space-text-secondary)]">
                      Proposal total <span className="text-[var(--space-text-muted)]">· {oneOffLineCount} line{oneOffLineCount === 1 ? '' : 's'}</span>
                    </span>
                    <span className="text-base font-semibold tabular-nums text-[var(--space-text-primary)]">{fmt(oneOffTotal)}</span>
                  </div>

                  {oneOffUnpriced > 0 && (
                    <p className="flex items-start gap-1.5 text-[10px] text-amber-500 leading-snug">
                      <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                      {oneOffUnpriced} pitched item{oneOffUnpriced === 1 ? '' : 's'} ha{oneOffUnpriced === 1 ? 's' : 've'} no
                      price — {oneOffUnpriced === 1 ? 'it' : 'they'} will appear on the proposal at $0.
                    </p>
                  )}

                  <label className="block">
                    <span className={fieldLabel}>Cover message (on the proposal)</span>
                    <textarea
                      value={proposalNote}
                      onChange={(e) => setProposalNote(e.target.value)}
                      rows={2}
                      placeholder="Following our call — here's the scope and pricing…"
                      className={cn(inputCls, 'mt-1 resize-y text-xs')}
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <button onClick={handleConvertToPackage} disabled={converting || oneOffLineCount === 0} className={accentBtn}>
                      {converting ? <Loader2 className="size-3.5 animate-spin" /> : <Package className="size-3.5" />}
                      Create proposal
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--space-text-muted)] leading-relaxed">
                    This creates a client proposal and <span className="text-[var(--space-text-secondary)]">moves</span> the pitched work into its
                    milestone log, then opens it in Milestones — where you add the payment schedule, send the PDF, and invoice. The scope closes here.
                  </p>
                </div>
              ) : (
              <>
              {sendNotice && (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--space-accent-glow)] bg-[var(--space-accent-soft)] px-3 py-2">
                  <CircleCheck className="size-3.5 shrink-0" style={{ color: 'var(--space-accent)' }} />
                  <span className="text-xs text-[var(--space-text-secondary)]">{sendNotice}</span>
                </div>
              )}

              {!pricingOpen ? (
                <button
                  type="button"
                  onClick={() => setPricingOpen(true)}
                  className="w-full group flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors bg-[var(--space-bg-card-hover)] hover:border-[var(--space-accent-glow)]"
                  style={{ borderColor: 'var(--space-accent-glow)' }}
                >
                  <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--space-accent-soft)' }}>
                    <FileSignature className="size-4" style={{ color: 'var(--space-accent)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--space-text-primary)] leading-tight">
                      {proposal?.sentAt ? 'Proposal sent — review or start the retainer' : 'Build the proposal'}
                    </p>
                    <p className="text-[11px] text-[var(--space-text-muted)] mt-0.5">
                      {proposal?.sentAt
                        ? `${fmt(proposal.monthlyFee)}/mo · ${fmtHrs(proposal.hoursPerMonth)} hrs · sent ${fmtDay(proposal.sentAt)}${proposal.sentTo.length ? ` to ${proposal.sentTo.join(', ')}` : ''}`
                        : pitchedTotal > 0
                          ? `Priced off ${fmtHrs(plannedHours)}h planned${doneHours > 0 ? ` and ${fmtHrs(doneHours)}h already delivered` : ''}.`
                          : 'Pitch some work above first, or price it from scratch.'}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-[var(--space-text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div className="rounded-xl border p-4 sm:p-5 space-y-4 bg-[var(--space-bg-card-hover)]" style={{ borderColor: 'var(--space-accent-glow)' }}>
                  <div className="flex items-center gap-2">
                    <FileSignature className="size-3.5" style={{ color: 'var(--space-accent)' }} />
                    <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-[var(--space-text-tertiary)]">Proposal</p>
                    {proposal?.sentAt && (
                      <span className="text-[10px] text-[var(--space-text-muted)]">
                        Sent {fmtDay(proposal.sentAt)}{proposal.sentTo.length ? ` · ${proposal.sentTo.join(', ')}` : ''}
                      </span>
                    )}
                  </div>

                  {pitchedTotal > 0 && (
                    <p className="text-[11px] text-[var(--space-text-muted)] leading-relaxed">
                      Suggested from the pitch: <span className="text-[var(--space-text-secondary)] font-medium tabular-nums">{fmtHrs(plannedHours)}h/mo planned</span>
                      {doneHours > 0 && <> · <span className="text-[var(--space-text-secondary)] font-medium tabular-nums">{fmtHrs(doneHours)}h already delivered</span></>}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(TIER_PRESETS) as RetainerTier[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          const hrs = t === 'enterprise' ? (parseFloat(aHours) || Math.max(1, Math.ceil(plannedHours))) : TIER_PRESETS[t].hours
                          setATier(t)
                          setAHours(String(hrs))
                          setAOverage(String(TIER_PRESETS[t].overage))
                          setAFee(String(suggestFee(t, hrs, TIER_PRESETS[t].overage)))
                        }}
                        className={cn(
                          'flex flex-col items-center gap-0.5 py-3 rounded-lg border text-xs font-semibold transition-colors',
                          aTier === t
                            ? 'bg-[rgba(139,156,182,0.10)] text-[var(--space-text-primary)]'
                            : 'border-[var(--space-border-hard)] text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)]',
                        )}
                        style={aTier === t ? { borderColor: 'var(--space-accent)' } : {}}
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
                      <input type="number" min={0} value={aFee} onChange={(e) => setAFee(e.target.value)} className={cn(numFieldCls, 'w-full mt-1')} />
                    </label>
                    <label className="block">
                      <span className={fieldLabel}>Hours / mo</span>
                      <input type="number" min={0} value={aHours} onChange={(e) => setAHours(e.target.value)} className={cn(numFieldCls, 'w-full mt-1')} />
                    </label>
                    <label className="block">
                      <span className={fieldLabel}>Overage $/hr</span>
                      <input type="number" min={0} value={aOverage} onChange={(e) => setAOverage(e.target.value)} className={cn(numFieldCls, 'w-full mt-1')} />
                    </label>
                  </div>

                  {/* What the numbers actually mean, before anyone commits to them. */}
                  <div className="rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] divide-y divide-[var(--space-border-hard)] text-xs">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-[var(--space-text-secondary)]">Effective rate</span>
                      <span className="font-semibold tabular-nums text-[var(--space-text-primary)]">
                        {effRate > 0 ? `$${Math.round(effRate)}/hr` : '—'}
                      </span>
                    </div>
                    {doneHours > 0 && (
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-[var(--space-text-secondary)]">{fmtHrs(doneHours)}h already delivered, at that rate</span>
                        <span className="font-semibold tabular-nums text-[var(--space-text-primary)]">{fmt(doneValue)}</span>
                      </div>
                    )}
                    {capShortfall && (
                      <div className="flex items-start gap-2 px-3 py-2 text-amber-500">
                        <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          The pitch plans {fmtHrs(plannedHours)}h but the cap is {fmtHrs(aHoursNum)}h — the difference bills as overage.
                        </span>
                      </div>
                    )}
                  </div>

                  <label className="block">
                    <span className={fieldLabel}>First cycle starts</span>
                    <input type="date" value={aStart} onChange={(e) => setAStart(e.target.value)} className={cn(inputCls, 'mt-1')} />
                    <span className="block text-[10px] text-[var(--space-text-muted)] mt-1">
                      Quoted on the proposal, and the day of the month that anchors every future cycle.
                    </span>
                  </label>

                  {/* ── What the client's copy says ── */}
                  <div className="space-y-2.5 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] px-3 py-2.5">
                    <p className={fieldLabel}>On the document</p>
                    {doneHours > 0 && (
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={includeCompleted} onChange={(e) => setIncludeCompleted(e.target.checked)} className="mt-0.5 accent-[var(--space-accent)]" />
                        <span className="text-xs text-[var(--space-text-secondary)] leading-snug">
                          Present the {fmtHrs(doneHours)}h already delivered as included at no extra charge.
                        </span>
                      </label>
                    )}
                    <label className="block">
                      <span className="text-[10px] text-[var(--space-text-muted)]">Cover note (appears on the PDF and in the email)</span>
                      <textarea
                        value={proposalNote}
                        onChange={(e) => setProposalNote(e.target.value)}
                        rows={2}
                        placeholder="Following our call — here's the plan based on the work so far…"
                        className={cn(inputCls, 'mt-1 resize-y text-xs')}
                      />
                    </label>
                  </div>

                  {/* ── Send to the client ── */}
                  {sendOpen && (
                    <div className="space-y-2.5 rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--space-accent-glow)', background: 'var(--space-accent-soft)' }}>
                      <p className={fieldLabel}>Send proposal</p>
                      <label className="block">
                        <span className="text-[10px] text-[var(--space-text-muted)]">To (comma-separated)</span>
                        <input value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="client@example.com" className={cn(inputCls, 'mt-1 text-xs py-1.5')} />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-[var(--space-text-muted)]">Message (optional — defaults to the cover note)</span>
                        <textarea value={sendMsg} onChange={(e) => setSendMsg(e.target.value)} rows={2} className={cn(inputCls, 'mt-1 resize-y text-xs')} />
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={attachRecap} onChange={(e) => setAttachRecap(e.target.checked)} className="mt-0.5 accent-[var(--space-accent)]" />
                        <span className="text-xs text-[var(--space-text-secondary)] leading-snug">
                          Attach the work recap as a second PDF.
                          {!scopeRecap && <span className="text-[var(--space-text-muted)]"> Not composed yet — it will send with the auto-derived text.</span>}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button onClick={handleSendProposal} disabled={sendingProposal || !sendTo.trim()} className={accentBtn}>
                          {sendingProposal ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                          Send with PDF
                        </button>
                        <button onClick={() => setSendOpen(false)} className="px-3 py-2 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] rounded-lg transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scoping work predates the anchor, so carrying it is an explicit choice. */}
                  {(drafts.length > 0 || logged.length > 0) && (
                    <div className="space-y-2 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] px-3 py-2.5">
                      <p className={fieldLabel}>Carry into the first cycle</p>
                      {drafts.length > 0 && (
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={carryPlanned} onChange={(e) => setCarryPlanned(e.target.checked)} className="mt-0.5 accent-[var(--space-accent)]" />
                          <span className="text-xs text-[var(--space-text-secondary)] leading-snug">
                            {drafts.length} planned item{drafts.length === 1 ? '' : 's'} — starts cycle one with the plan already on the board.
                          </span>
                        </label>
                      )}
                      {logged.length > 0 && (
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input type="checkbox" checked={carryDone} onChange={(e) => setCarryDone(e.target.checked)} className="mt-0.5 accent-[var(--space-accent)]" />
                          <span className="text-xs text-[var(--space-text-secondary)] leading-snug">
                            {fmtHrs(doneHours)}h already delivered — counts against the first cycle&rsquo;s cap.
                            {!carryDone && <span className="text-[var(--space-text-muted)]"> Left off, it stays as pre-engagement history and is never billed.</span>}
                          </span>
                        </label>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={handlePreviewProposal} disabled={savingProposal} className={ghostBtn}>
                      {savingProposal ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
                      Save &amp; preview PDF
                    </button>
                    {!sendOpen && (
                      <button onClick={() => { setSendOpen(true); setSendNotice(null) }} className={ghostBtn}>
                        <Mail className="size-3.5" /> {proposal?.sentAt ? 'Send again' : 'Send to client'}
                      </button>
                    )}
                    <span className="flex-1" />
                    <button onClick={handleActivatePlan} disabled={activating || !(parseFloat(aHours) > 0)} className={accentBtn} title="Starts billing — do this once the client has accepted">
                      {activating ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
                      Start retainer
                    </button>
                    <button onClick={() => setPricingOpen(false)} className="px-3 py-2 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] rounded-lg hover:bg-[var(--space-bg-card)] transition-colors">
                      Close
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--space-text-muted)] leading-relaxed">
                    Previewing and sending never bill anything. <span className="text-[var(--space-text-secondary)]">Start retainer</span> is the step that opens the first cycle — do it once the client has accepted.
                  </p>
                </div>
              )}

              </>
              )}

              <button onClick={() => setEditing(true)} className={cn(ghostBtn, 'mx-auto')}>
                <Pencil className="size-3" /> Edit engagement details
              </button>
            </>
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

                  {/* Cycle summary — where the retainer stands, and where it's heading */}
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-5 bg-[var(--space-bg-card-hover)] space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-3xl font-bold tabular-nums text-[var(--space-text-primary)] leading-none">
                          {fmtHrs(used)}
                          <span className="text-base font-normal text-[var(--space-text-muted)]"> / {fmtHrs(cap)} hrs</span>
                        </p>
                        <p className="text-xs mt-2">
                          {over ? (
                            <span className="text-amber-500 font-semibold">{fmtHrs(totals?.overageHours ?? 0)} hrs over · {fmt(totals?.overageAmount ?? 0)}</span>
                          ) : projOverHrs > 0 ? (
                            <span className="text-amber-500 font-semibold">Projected ~{Math.round(projHours!)} hrs · ~{fmt(projOverAmt)} over at this pace</span>
                          ) : isCurrentCycle && projHours != null ? (
                            <span className="text-[var(--space-text-tertiary)]">{fmtHrs(totals?.remaining ?? 0)} hrs left · ~{Math.round(projHours)} hrs projected</span>
                          ) : (
                            <span className="text-[var(--space-text-tertiary)]">{fmtHrs(totals?.remaining ?? 0)} hrs remaining</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-[var(--space-text-muted)] tabular-nums">{cycle?.label ?? '—'}</p>
                        <p className="text-[11px] mt-0.5 tabular-nums text-[var(--space-text-tertiary)]">
                          {isCurrentCycle ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : isPastCycle ? 'Cycle ended' : 'Upcoming cycle'}
                        </p>
                      </div>
                    </div>

                    {/* Burn bar — fill is hours used; the tick marks where the cycle is today */}
                    <div className="relative">
                      <div className="h-2.5 rounded-full bg-[var(--space-bg-card)] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? 'rgb(245 158 11)' : 'var(--space-accent)' }} />
                      </div>
                      {isCurrentCycle && cap > 0 && (
                        <div
                          className="absolute -top-0.5 -bottom-0.5 w-px bg-[var(--space-text-secondary)]"
                          style={{ left: `${elapsedFrac * 100}%` }}
                          title={`Day ${dayOfCycle} of ${cycleDays}`}
                        />
                      )}
                    </div>
                    {isCurrentCycle && cap > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-[var(--space-text-muted)] -mt-1">
                        <span className="tabular-nums">Day {dayOfCycle} of {cycleDays}</span>
                        <span className={cn('font-medium', aheadOfPace && !over ? 'text-amber-500' : '')}>
                          {over ? 'over cap' : aheadOfPace ? 'ahead of pace' : 'on pace'}
                        </span>
                      </div>
                    )}

                    {(Object.keys(CATEGORY_LABEL) as TimeEntryCategory[]).some((c) => (totals?.byCategory?.[c] ?? 0) > 0) && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
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

                    {/* Billing — close this cycle: bill next month + send the recap */}
                    <div className="flex items-center justify-between gap-3 flex-wrap border-t border-[var(--space-border-hard)] pt-3">
                      {nextCycle?.invoice ? (
                        <>
                          <p className="text-xs text-[var(--space-text-tertiary)]">
                            {nextCycle.monthLabel} invoiced <span className="font-semibold text-[var(--space-text-primary)]">#{nextCycle.invoice.orderNumber}</span>
                            <span className="tabular-nums"> · {fmt(nextCycle.invoice.amount)} · </span>
                            <span className={nextCycle.invoice.status === 'paid' ? 'font-semibold text-[var(--space-accent)]' : 'font-semibold text-amber-500'}>
                              {nextCycle.invoice.status}
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            {resetInvoiceError && (
                              <span className="text-[10px] text-red-400 max-w-[220px] leading-snug">{resetInvoiceError}</span>
                            )}
                            {nextCycle.invoice.stripeInvoiceUrl && (
                              <a href={nextCycle.invoice.stripeInvoiceUrl} target="_blank" rel="noreferrer" className={ghostBtn}>
                                View invoice
                              </a>
                            )}
                            <button onClick={() => setInvoiceOpen(true)} className={ghostBtn} title="Send billing / recap">
                              Manage billing
                            </button>
                            {/* Paid invoices are never reset — the action refuses, so don't offer it. */}
                            {nextCycle.invoice.status !== 'paid' && (
                              <button
                                type="button"
                                disabled={resettingInvoice}
                                onClick={() => void handleResetInvoice()}
                                onBlur={() => setTimeout(() => setConfirmResetInvoice(false), 300)}
                                title={
                                  confirmResetInvoice
                                    ? 'Click again to confirm reset'
                                    : "Reset — void this cycle's invoice and remove the order"
                                }
                                aria-label={
                                  confirmResetInvoice
                                    ? 'Confirm reset invoice'
                                    : "Reset — void this cycle's invoice and remove the order"
                                }
                                className={cn(
                                  'flex items-center gap-1 justify-center rounded-lg transition-all disabled:opacity-40',
                                  confirmResetInvoice
                                    ? 'px-2.5 py-1.5 text-[10px] font-semibold text-amber-400 border border-amber-400/30 bg-amber-400/[0.08]'
                                    : 'size-8 text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] hover:bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)]',
                                )}
                              >
                                {resettingInvoice
                                  ? <Loader2 className="size-3.5 animate-spin" />
                                  : <RotateCcw className="size-3.5" />
                                }
                                {confirmResetInvoice && !resettingInvoice ? 'Confirm' : ''}
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-[var(--space-text-muted)]">
                            {nextCycle ? <>Bill {nextCycle.monthLabel} — {fmt(terms?.monthlyFee ?? 0)}{over ? <span className="text-amber-500"> + {fmt(totals?.overageAmount ?? 0)} overage</span> : ''}</> : 'Retainer billing'}
                          </p>
                          <button onClick={() => setInvoiceOpen(true)} className={accentBtn}>
                            <Send className="size-3.5" /> Send retainer billing
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick log — the day-to-day action, without a tab switch */}
                  <div className="rounded-xl border border-[var(--space-border-hard)] p-3 bg-[var(--space-bg-card-hover)] flex items-end gap-2 flex-wrap">
                    <label className="block">
                      <span className={fieldLabel}>Hrs</span>
                      <input
                        type="number" min={0} step="0.25" value={logHoursStr}
                        onChange={(e) => setLogHoursStr(e.target.value)}
                        placeholder="0" className={cn(numCls, 'w-16 mt-1 py-1.5 text-sm')}
                      />
                    </label>
                    <input
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !logging) void handleLog() }}
                      placeholder={`Log time to ${cycle?.label ?? 'this cycle'} — what did you do? ↵`}
                      className={cn(inputCls, 'flex-1 min-w-[160px] py-1.5')}
                    />
                    <button onClick={handleLog} disabled={logging} className={accentBtn}>
                      {logging ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Log
                    </button>
                  </div>

                  {/* Needs attention — high-priority planned work still open */}
                  {attention.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-amber-500 flex items-center gap-1.5">
                        <Flame className="size-3" /> Needs attention
                      </p>
                      {attention.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.06]">
                          <button onClick={() => handleToggleComplete(e)} disabled={togglingId === e.id} className="shrink-0 size-5 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-accent)] transition-colors disabled:opacity-50" title="Mark complete">
                            {togglingId === e.id ? <Loader2 className="size-3.5 animate-spin" /> : <Circle className="size-4" />}
                          </button>
                          <span className="text-[10px] uppercase tracking-wide text-[var(--space-text-muted)] shrink-0 w-16">
                            {CATEGORY_LABEL[(e.category ?? 'work') as TimeEntryCategory]}
                          </span>
                          <span className="text-sm flex-1 min-w-0 truncate text-[var(--space-text-secondary)]">{e.description || '—'}</span>
                          <button onClick={() => { setStage('plan'); openEditor(e, true) }} className="shrink-0 flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-[var(--space-accent)] hover:bg-[var(--space-bg-card)] transition-colors" title="Log hours for this item">
                            Log hours <ArrowRight className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent activity — the latest logged time this cycle */}
                  {recent.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--space-text-muted)] flex items-center gap-1.5">
                        <Activity className="size-3" /> Recent activity
                      </p>
                      {recent.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => { setStage('log'); openEditor(e) }}
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] text-left hover:border-[var(--space-accent-glow)] transition-colors"
                        >
                          <span className="text-[11px] font-mono tabular-nums text-[var(--space-text-muted)] shrink-0 w-12">{String(e.date).slice(5, 10)}</span>
                          <span className="text-sm font-bold tabular-nums text-[var(--space-text-primary)] shrink-0 w-12">{fmtHrs(e.hours)}h</span>
                          <span className="text-[10px] uppercase tracking-wide text-[var(--space-text-muted)] shrink-0 w-16">{CATEGORY_LABEL[(e.category ?? 'work') as TimeEntryCategory]}</span>
                          <span className="text-xs text-[var(--space-text-tertiary)] flex-1 min-w-0 truncate">{e.description || '—'}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Jump cards — the full tabs */}
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
                  </div>
                  <p className="text-[11px] text-[var(--space-text-muted)]">
                    Both documents cover the cycle shown in the header — use ‹ › up there to pick a different one.
                  </p>
                </>
              )}
            </>
          )}

          {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>

      {invoiceOpen && retainer && cycle && selectedClientId && (
        <RetainerInvoiceModal
          retainerId={retainer.id}
          clientId={selectedClientId}
          cycleRef={cycle.start}
          recapDraft={recapDraft?.cycleStart === cycle.start ? recapDraft.data : null}
          onComposeRecap={() => setRecapOpen(true)}
          onClose={() => setInvoiceOpen(false)}
          onSent={() => { void load() }}
        />
      )}

      {/* Rendered after the invoice modal so composing from the send flow stacks on top */}
      {recapOpen && retainer && cycle && selectedClientId && (
        <RetainerRecapModal
          retainerId={retainer.id}
          clientId={selectedClientId}
          cycleRef={cycle.start}
          onClose={() => setRecapOpen(false)}
          draft={recapDraft?.cycleStart === cycle.start ? recapDraft.data : null}
          onDraftChange={(m) => setRecapDraft({ cycleStart: cycle.start, data: m })}
        />
      )}

      {/* The scope recap composer — no cycle required, which is the point of it. */}
      {scopeRecapOpen && retainer && (
        <ScopeRecapModal
          retainerId={retainer.id}
          onClose={() => setScopeRecapOpen(false)}
          draft={scopeRecap}
          onDraftChange={(m) => setScopeRecapDraft({ retainerId: retainer.id, data: m })}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const HEALTH_META: Record<RetainerHealth, { label: string; color: string }> = {
  over:    { label: 'Over cap', color: 'rgb(245 158 11)' },
  warning: { label: 'Near cap', color: 'rgb(245 158 11)' },
  healthy: { label: 'On track', color: 'var(--space-accent)' },
  open:    { label: 'Open',     color: 'var(--space-text-muted)' },
  scoping: { label: 'Scoping — needs pricing', color: 'rgb(148 163 184)' },
}

// One retainer in the portfolio board — client, cycle burn, and how much cycle is left.
function BoardRow({
  row, idx, isSel, onSelect, onHover,
}: { row: RetainerPortfolioRow; idx: number; isSel: boolean; onSelect: () => void; onHover: () => void }) {
  const meta = HEALTH_META[row.health]
  const amber = row.health === 'over' || row.health === 'warning'
  const isScopingRow = row.health === 'scoping'
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
      <span className="size-2 rounded-full shrink-0" style={{ background: meta.color }} title={meta.label} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', isSel ? 'text-[var(--space-text-primary)] font-medium' : 'text-[var(--space-text-secondary)]')}>
          {row.clientName}
          {row.clientCompany && <span className="font-normal text-[var(--space-text-muted)]"> · {row.clientCompany}</span>}
        </p>
        <p className="text-[11px] text-[var(--space-text-muted)] truncate">
          {isScopingRow
            ? (row.proposalSentAt ? `Scoping · proposal sent ${fmtDay(row.proposalSentAt)}` : 'Scoping · no plan yet')
            : TIER_LABEL[row.tier]}
          {row.deactivateOn ? ' · ending soon' : ''}
        </p>
      </div>

      {isScopingRow ? (
        /* No cycle to burn against — show what has been pitched and the next step. */
        <>
          <span className="text-xs tabular-nums shrink-0 text-[var(--space-text-secondary)]">
            {fmtHrs((row.pitch?.plannedHours ?? 0) + (row.pitch?.doneHours ?? 0))}h pitched
          </span>
          <span className="text-[11px] font-semibold shrink-0 w-[86px] text-right" style={{ color: 'var(--space-accent)' }}>
            {row.proposalSentAt ? 'Awaiting reply' : 'Set pricing'}
          </span>
        </>
      ) : (
        <>
          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-[var(--space-bg-card)] overflow-hidden shrink-0">
            <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: amber ? 'rgb(245 158 11)' : 'var(--space-accent)' }} />
          </div>
          <span className={cn('text-xs tabular-nums shrink-0 w-[68px] text-right', amber ? 'text-amber-500 font-semibold' : 'text-[var(--space-text-secondary)]')}>
            {row.cap > 0 ? `${fmtHrs(row.used)}/${fmtHrs(row.cap)}h` : `${fmtHrs(row.used)}h`}
          </span>
          <span className="text-[11px] tabular-nums text-[var(--space-text-muted)] shrink-0 w-14 text-right">{row.daysLeft}d left</span>
        </>
      )}
    </button>
  )
}

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
  icon: Icon, title, desc, actionLabel, onClick,
}: { icon: typeof Clock; title: string; desc: string; actionLabel: string; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] p-4">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--space-accent-soft)' }}>
          <Icon className="size-4" style={{ color: 'var(--space-accent)' }} />
        </div>
        <p className="text-sm font-semibold text-[var(--space-text-primary)]">{title}</p>
      </div>
      <p className="text-xs text-[var(--space-text-muted)] leading-relaxed flex-1">{desc}</p>
      <button onClick={onClick} className={cn(accentBtn, 'self-start')}>
        {actionLabel}
      </button>
    </div>
  )
}
