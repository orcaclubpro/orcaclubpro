'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Search, Plus, PlusCircle, X, Trash2, Loader2,
  ChevronDown, ChevronRight, ArrowUp, ArrowDown,
  Package, MoreHorizontal, Layers, CalendarClock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ServiceItem } from '@/types/payload-types'
import {
  getServiceCatalog,
  createServiceItem,
  createProposal,
  updateProposal,
  type BuilderLineItem,
} from '@/actions/package-builder'
import { getClientAccountsList } from '@/actions/packages'

// ── Types ──────────────────────────────────────────────────────────────────────

type BillingType = 'fixed' | 'hourly' | 'recurring'

type EditLine = BuilderLineItem & { _key: string }

interface SchedRow {
  _key: string
  label: string
  entryType: 'deposit' | 'installment' | 'balance'
  amount: number
  dueDate?: string
}

interface ClientOption {
  id: string
  name: string
  company: string | null
}

export interface ExistingProposal {
  id: string
  name: string
  description?: string | null
  coverMessage?: string | null
  notes?: string | null
  projectRef?: string | { id: string; name?: string } | null
  lineItems?: any[]
  paymentSchedule?: any[]
  clientAccount?: { id: string; name: string; company?: string | null } | string | null
}

export interface PackageBuilderModalProps {
  mode: 'create' | 'edit'
  username: string
  clientId?: string
  existing?: ExistingProposal
  onClose: (createdOrUpdatedId?: string) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}

let keyCounter = 0
function genKey() {
  keyCounter += 1
  return `l${Date.now().toString(36)}${keyCounter}`
}

/** Effective per-unit price for a builder line, resolving hourly rate×hours and adjustedPrice override. */
function lineUnit(item: EditLine): number {
  const base = item.price ?? 0
  const raw = item.billingType === 'hourly' ? base * (item.hours ?? 1) : base
  return item.adjustedPrice != null ? item.adjustedPrice : raw
}

/** Totals for the footer — excludes add-on rows, splits recurring by interval. */
function computeTotals(items: EditLine[]) {
  let oneTime = 0, monthly = 0, annual = 0
  for (const item of items) {
    if (item.isAddOn) continue
    const total = lineUnit(item) * (item.quantity ?? 1)
    if (item.billingType === 'recurring') {
      if (item.recurringInterval === 'year') annual += total
      else monthly += total
    } else {
      oneTime += total
    }
  }
  return { oneTime, monthly, annual }
}

function catalogPriceHint(item: ServiceItem): string {
  if (item.billingType === 'hourly') return `${fmt(item.defaultRate ?? 0)}/hr`
  if (item.billingType === 'recurring') return `${fmt(item.defaultPrice ?? 0)}/${item.defaultInterval === 'year' ? 'yr' : 'mo'}`
  return fmt(item.defaultPrice ?? 0)
}

function catalogToLine(item: ServiceItem): BuilderLineItem {
  if (item.billingType === 'hourly') {
    return {
      name: item.name,
      description: item.description ?? undefined,
      billingType: 'hourly',
      price: item.defaultRate ?? 0,
      hours: 1,
      quantity: 1,
      sourceServiceItem: item.id,
    }
  }
  if (item.billingType === 'recurring') {
    return {
      name: item.name,
      description: item.description ?? undefined,
      billingType: 'recurring',
      price: item.defaultPrice ?? 0,
      recurringInterval: item.defaultInterval ?? 'month',
      quantity: 1,
      sourceServiceItem: item.id,
    }
  }
  return {
    name: item.name,
    description: item.description ?? undefined,
    billingType: 'fixed',
    price: item.defaultPrice ?? 0,
    quantity: 1,
    sourceServiceItem: item.id,
  }
}

/** Seed the builder's editable line state from an existing proposal doc (edit mode). */
function seedLine(raw: any): EditLine {
  const billingType: BillingType = raw?.billingType
    ? raw.billingType
    : raw?.isRecurring ? 'recurring' : 'fixed'
  let price = raw?.price ?? 0
  const hours = raw?.hours ?? undefined
  // Stored hourly price is rate×hours (normalized). Recover the rate for editing.
  if (billingType === 'hourly' && hours != null && hours > 0) {
    price = Math.round((price / hours) * 100) / 100
  }
  return {
    _key: genKey(),
    name: raw?.name ?? '',
    description: raw?.description ?? undefined,
    billingType,
    price,
    adjustedPrice: raw?.adjustedPrice ?? undefined,
    quantity: raw?.quantity ?? 1,
    hours: billingType === 'hourly' ? hours ?? 1 : undefined,
    recurringInterval: billingType === 'recurring' ? raw?.recurringInterval ?? 'month' : undefined,
    contractTermMonths: raw?.contractTermMonths ?? undefined,
    isAddOn: raw?.isAddOn ?? undefined,
    sourceServiceItem: raw?.sourceServiceItem
      ? (typeof raw.sourceServiceItem === 'string' ? raw.sourceServiceItem : raw.sourceServiceItem.id)
      : undefined,
  }
}

// ── Shared input styles ─────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const selectCls =
  'px-2 py-1.5 text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-md text-[var(--space-text-secondary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const numCls =
  'text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-md text-[var(--space-text-primary)] px-2 py-1.5 focus:outline-none focus:border-[rgba(139,156,182,0.20)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

// ── Component ────────────────────────────────────────────────────────────────────

export function PackageBuilderModal({ mode, username, clientId, existing, onClose }: PackageBuilderModalProps) {
  // Data
  const [catalog, setCatalog] = useState<ServiceItem[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)

  // Package fields
  const existingClientId =
    typeof existing?.clientAccount === 'object' && existing?.clientAccount
      ? existing.clientAccount.id
      : typeof existing?.clientAccount === 'string'
        ? existing.clientAccount
        : ''
  const [selectedClientId, setSelectedClientId] = useState<string>(
    mode === 'edit' ? existingClientId : (clientId ?? ''),
  )
  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [coverMessage, setCoverMessage] = useState(existing?.coverMessage ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const projectRef = useMemo(() => {
    const p = existing?.projectRef
    if (!p) return null
    return typeof p === 'string' ? p : p.id
  }, [existing])

  const [lines, setLines] = useState<EditLine[]>(
    mode === 'edit' ? (existing?.lineItems ?? []).map(seedLine) : [],
  )
  const [schedule, setSchedule] = useState<SchedRow[]>(
    mode === 'edit'
      ? (existing?.paymentSchedule ?? []).map((e: any) => ({
          _key: genKey(),
          label: e?.label ?? '',
          entryType: (e?.entryType ?? 'installment') as SchedRow['entryType'],
          amount: e?.amount ?? 0,
          dueDate: e?.dueDate ? String(e.dueDate).split('T')[0] : undefined,
        }))
      : [],
  )

  // UI state
  const [search, setSearch] = useState('')
  const [showMeta, setShowMeta] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [mobilePane, setMobilePane] = useState<'catalog' | 'package'>('package')
  const [overflowKey, setOverflowKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New service item mini-form
  const [showNewForm, setShowNewForm] = useState(false)
  const [nsName, setNsName] = useState('')
  const [nsPrice, setNsPrice] = useState('')
  const [nsBilling, setNsBilling] = useState<BillingType>('fixed')
  const [nsInterval, setNsInterval] = useState<'month' | 'year'>('month')
  const [nsSave, setNsSave] = useState(true)
  const [nsBusy, setNsBusy] = useState(false)

  // ── Load catalog + clients ─────────────────────────────────────────────────
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const [cat, cl] = await Promise.all([getServiceCatalog(), getClientAccountsList()])
      if (!alive) return
      if (cat.success) setCatalog(cat.items)
      if (cl.success) setClients(cl.clients)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [])

  async function refreshCatalog() {
    const cat = await getServiceCatalog()
    if (cat.success) setCatalog(cat.items)
  }

  // ── Line mutations ─────────────────────────────────────────────────────────
  function addLine(line: BuilderLineItem) {
    setLines((prev) => [...prev, { ...line, _key: genKey() }])
  }
  function patchLine(key: string, patch: Partial<EditLine>) {
    setLines((prev) => prev.map((l) => (l._key === key ? { ...l, ...patch } : l)))
  }
  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l._key !== key))
  }
  function moveLine(key: string, dir: -1 | 1) {
    setLines((prev) => {
      const i = prev.findIndex((l) => l._key === key)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  // ── New service item ───────────────────────────────────────────────────────
  async function handleAddNewService() {
    const priceNum = parseFloat(nsPrice)
    if (!nsName.trim() || isNaN(priceNum)) {
      setError('New service needs a name and price')
      return
    }
    setError(null)
    setNsBusy(true)
    try {
      if (nsSave) {
        const res = await createServiceItem({
          name: nsName.trim(),
          billingType: nsBilling,
          defaultPrice: nsBilling === 'hourly' ? undefined : priceNum,
          defaultRate: nsBilling === 'hourly' ? priceNum : undefined,
          defaultInterval: nsBilling === 'recurring' ? nsInterval : undefined,
        })
        if (!res.success || !res.item) {
          setError(res.error ?? 'Failed to save service item')
          setNsBusy(false)
          return
        }
        addLine({ ...catalogToLine(res.item) })
        await refreshCatalog()
      } else {
        const oneOff: BuilderLineItem =
          nsBilling === 'hourly'
            ? { name: nsName.trim(), billingType: 'hourly', price: priceNum, hours: 1, quantity: 1 }
            : nsBilling === 'recurring'
              ? { name: nsName.trim(), billingType: 'recurring', price: priceNum, recurringInterval: nsInterval, quantity: 1 }
              : { name: nsName.trim(), billingType: 'fixed', price: priceNum, quantity: 1 }
        addLine(oneOff)
      }
      // reset
      setNsName('')
      setNsPrice('')
      setNsBilling('fixed')
      setNsInterval('month')
      setShowNewForm(false)
    } finally {
      setNsBusy(false)
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setError(null)
    if (!name.trim()) {
      setError('A package name is required')
      return
    }
    if (mode === 'create' && !selectedClientId) {
      setError('A client is required')
      return
    }
    setSaving(true)

    const payloadLines: BuilderLineItem[] = lines.map(({ _key, ...rest }) => rest)
    const payloadSchedule = schedule
      .filter((s) => s.label.trim() || s.amount)
      .map((s) => ({ label: s.label.trim(), entryType: s.entryType, amount: s.amount, dueDate: s.dueDate || undefined }))

    try {
      if (mode === 'edit' && existing) {
        const res = await updateProposal({
          packageId: existing.id,
          name: name.trim(),
          description: description || undefined,
          coverMessage: coverMessage || undefined,
          notes: notes || undefined,
          projectRef,
          lineItems: payloadLines,
          paymentSchedule: payloadSchedule,
        })
        if (res.success) onClose(res.id)
        else setError(res.error ?? 'Failed to update proposal')
      } else {
        const res = await createProposal({
          clientAccountId: selectedClientId,
          name: name.trim(),
          description: description || undefined,
          coverMessage: coverMessage || undefined,
          notes: notes || undefined,
          projectRef,
          lineItems: payloadLines,
          paymentSchedule: payloadSchedule,
        })
        if (res.success) onClose(res.id)
        else setError(res.error ?? 'Failed to create proposal')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const q = search.toLowerCase().trim()
  const filteredCatalog = useMemo(
    () => (q ? catalog.filter((c) => c.name.toLowerCase().includes(q)) : catalog),
    [catalog, q],
  )
  const { oneTime, monthly, annual } = computeTotals(lines)

  const editClientLabel = useMemo(() => {
    if (typeof existing?.clientAccount === 'object' && existing?.clientAccount) {
      return existing.clientAccount.name + (existing.clientAccount.company ? ` · ${existing.clientAccount.company}` : '')
    }
    const found = clients.find((c) => c.id === existingClientId)
    return found ? found.name + (found.company ? ` · ${found.company}` : '') : 'Client'
  }, [existing, clients, existingClientId])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-[#000000]/75 backdrop-blur-sm" onClick={() => onClose()} />

      <div
        className="relative z-10 w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[88vh] sm:min-h-[520px] flex flex-col sm:rounded-2xl border border-[var(--space-border-hard)] overflow-hidden shadow-2xl shadow-[#000000]/50"
        style={{ background: 'var(--space-bg-card)' }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.015)]">
          <div className="size-9 shrink-0 rounded-xl bg-[rgba(139,156,182,0.08)] border border-[rgba(139,156,182,0.15)] flex items-center justify-center">
            <Package className="size-4" style={{ color: 'var(--space-accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: 'var(--space-accent)' }}>
              {mode === 'edit' ? 'Edit Package' : 'Package Builder'}
            </p>
            <p className="text-sm font-semibold text-[var(--space-text-primary)] truncate">
              {name.trim() || 'Untitled package'}
            </p>
          </div>
          <button
            onClick={() => onClose()}
            aria-label="Close"
            className="shrink-0 size-8 rounded-lg border border-[var(--space-border-hard)] flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:border-[rgba(139,156,182,0.20)] transition-all"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Mobile pane tabs */}
        <div className="shrink-0 flex sm:hidden border-b border-[var(--space-border-hard)]">
          {(['catalog', 'package'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setMobilePane(p)}
              className={cn(
                'flex-1 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] transition-colors',
                mobilePane === p ? 'text-[var(--space-text-primary)] border-b-2' : 'text-[var(--space-text-muted)]',
              )}
              style={mobilePane === p ? { borderColor: 'var(--space-accent)' } : {}}
            >
              {p === 'catalog' ? 'Catalog' : `Package · ${lines.length}`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex">
          {/* LEFT — catalog rail */}
          <div
            className={cn(
              'flex-col w-full sm:w-[300px] sm:shrink-0 border-r border-[var(--space-border-hard)] min-h-0 bg-[rgba(0,0,0,0.13)]',
              mobilePane === 'catalog' ? 'flex' : 'hidden sm:flex',
            )}
          >
            {/* Rail header + search */}
            <div className="shrink-0 p-3 border-b border-[var(--space-border-hard)] space-y-2.5">
              <div className="flex items-center gap-2 px-0.5">
                <Layers className="size-3 text-[var(--space-text-muted)]" />
                <p className="text-[9px] font-bold tracking-[0.24em] uppercase text-[var(--space-text-muted)]">
                  Catalog{catalog.length > 0 ? ` · ${catalog.length}` : ''}
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--space-text-muted)] pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services…"
                  className={cn(inputCls, 'pl-9')}
                />
              </div>
            </div>

            {/* Catalog list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 text-[var(--space-text-muted)] animate-spin" />
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                  <div className="p-3 rounded-xl bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)]">
                    <Layers className="size-5 text-[var(--space-text-muted)]" />
                  </div>
                  <p className="text-xs font-medium text-[var(--space-text-tertiary)]">
                    {q ? 'No matching services' : 'No saved services yet'}
                  </p>
                  {!q && (
                    <p className="text-[11px] text-[var(--space-text-muted)] leading-relaxed max-w-[200px]">
                      Add a service below and check “Save to catalog” to reuse it on future packages.
                    </p>
                  )}
                </div>
              ) : (
                filteredCatalog.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addLine(catalogToLine(item))}
                    className="w-full group flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] hover:bg-[var(--space-bg-card-hover)] hover:border-[rgba(139,156,182,0.15)] transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--space-text-secondary)] truncate">{item.name}</p>
                      <p className="text-[10px] text-[var(--space-text-muted)] tabular-nums font-mono mt-0.5">
                        {catalogPriceHint(item)}
                      </p>
                    </div>
                    <PlusCircle
                      className="size-4 shrink-0 text-[var(--space-text-muted)] group-hover:text-[var(--space-accent)] transition-colors"
                      style={{ color: undefined }}
                    />
                  </button>
                ))
              )}
            </div>

            {/* New service item */}
            <div className="shrink-0 border-t border-[var(--space-border-hard)] p-3">
              {!showNewForm ? (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-dashed border-[var(--space-border-hard)] text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:border-[rgba(139,156,182,0.20)] transition-all"
                >
                  <Plus className="size-3.5" />
                  New service item
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    value={nsName}
                    onChange={(e) => setNsName(e.target.value)}
                    placeholder="Service name"
                    className={inputCls}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={nsPrice}
                      onChange={(e) => setNsPrice(e.target.value)}
                      placeholder={nsBilling === 'hourly' ? 'Rate/hr' : 'Price'}
                      className={cn(numCls, 'flex-1')}
                    />
                    <select value={nsBilling} onChange={(e) => setNsBilling(e.target.value as BillingType)} className={selectCls}>
                      <option value="fixed">Fixed</option>
                      <option value="hourly">Hourly</option>
                      <option value="recurring">Recurring</option>
                    </select>
                    {nsBilling === 'recurring' && (
                      <select value={nsInterval} onChange={(e) => setNsInterval(e.target.value as 'month' | 'year')} className={selectCls}>
                        <option value="month">/mo</option>
                        <option value="year">/yr</option>
                      </select>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-[11px] text-[var(--space-text-muted)] cursor-pointer select-none">
                    <input type="checkbox" checked={nsSave} onChange={(e) => setNsSave(e.target.checked)} className="accent-[var(--space-accent)]" />
                    Save to catalog for reuse
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddNewService}
                      disabled={nsBusy}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[rgba(139,156,182,0.10)] border border-[rgba(139,156,182,0.15)] hover:bg-[rgba(139,156,182,0.14)] transition-all disabled:opacity-50"
                      style={{ color: 'var(--space-accent)' }}
                    >
                      {nsBusy ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                      Add
                    </button>
                    <button
                      onClick={() => { setShowNewForm(false); setError(null) }}
                      className="px-3 py-1.5 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] rounded-lg hover:bg-[var(--space-bg-card-hover)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — the package */}
          <div
            className={cn(
              'flex-col flex-1 min-w-0 min-h-0',
              mobilePane === 'package' ? 'flex' : 'hidden sm:flex',
            )}
          >
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Name + client */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">Package name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Website Launch Proposal"
                    className={cn(inputCls, 'mt-1.5')}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">Client *</label>
                  {mode === 'edit' ? (
                    <div className="mt-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)]">
                      {editClientLabel}
                    </div>
                  ) : (
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className={cn(inputCls, 'mt-1.5')}
                    >
                      <option value="">Select a client…</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.company ? ` · ${c.company}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Cover / notes disclosure */}
              <div className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden">
                <button
                  onClick={() => setShowMeta((v) => !v)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left"
                >
                  <ChevronRight className={cn('size-3.5 text-[var(--space-text-muted)] transition-transform', showMeta && 'rotate-90')} />
                  <span className="text-xs font-semibold text-[var(--space-text-tertiary)]">Cover message · notes</span>
                </button>
                {showMeta && (
                  <div className="px-4 pb-4 space-y-3 border-t border-[var(--space-border-hard)] pt-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[var(--space-text-muted)]">Description</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={cn(inputCls, 'mt-1 resize-none')} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[var(--space-text-muted)]">Cover message</label>
                      <textarea value={coverMessage} onChange={(e) => setCoverMessage(e.target.value)} rows={2} className={cn(inputCls, 'mt-1 resize-none')} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[var(--space-text-muted)]">Internal notes</label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={cn(inputCls, 'mt-1 resize-none')} />
                    </div>
                  </div>
                )}
              </div>

              {/* Line items */}
              <div>
                <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--space-accent)] mb-2.5">
                  Line items · {lines.length}
                </p>
                {lines.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center rounded-xl border border-dashed border-[var(--space-border-hard)]">
                    <Package className="size-6 text-[var(--space-text-muted)]" />
                    <p className="text-xs text-[var(--space-text-muted)]">Add services from the catalog to build this package.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lines.map((item, idx) => {
                      const hasDiscount = item.adjustedPrice != null && item.adjustedPrice < (item.price ?? 0)
                      const lineTotal = lineUnit(item) * (item.quantity ?? 1)
                      return (
                        <div
                          key={item._key}
                          className={cn(
                            'rounded-xl border p-3 transition-colors',
                            item.isAddOn
                              ? 'border-dashed border-[rgba(139,156,182,0.20)] bg-[rgba(139,156,182,0.03)]'
                              : 'border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]',
                          )}
                        >
                          {/* Row 1: name + total + controls */}
                          <div className="flex items-start gap-2">
                            <div className="flex flex-col gap-0.5 pt-1">
                              <button onClick={() => moveLine(item._key, -1)} disabled={idx === 0} className="text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] disabled:opacity-25 transition-colors">
                                <ArrowUp className="size-3" />
                              </button>
                              <button onClick={() => moveLine(item._key, 1)} disabled={idx === lines.length - 1} className="text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] disabled:opacity-25 transition-colors">
                                <ArrowDown className="size-3" />
                              </button>
                            </div>
                            <input
                              value={item.name}
                              onChange={(e) => patchLine(item._key, { name: e.target.value })}
                              placeholder="Item name"
                              className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-[var(--space-text-primary)] focus:outline-none border-b border-transparent focus:border-[var(--space-border-hard)] py-0.5"
                            />
                            <div className="text-right shrink-0">
                              {hasDiscount ? (
                                <p className="text-xs font-mono tabular-nums leading-tight">
                                  <s className="text-[var(--space-text-muted)]">{fmt((item.price ?? 0) * (item.quantity ?? 1))}</s>{' '}
                                  <span style={{ color: 'var(--space-accent)' }}>{fmt(lineTotal)}</span>
                                </p>
                              ) : (
                                <p className="text-sm font-bold font-mono tabular-nums text-[var(--space-text-secondary)]">
                                  {fmt(lineTotal)}
                                  {item.billingType === 'recurring' && (
                                    <span className="text-xs font-normal text-[var(--space-text-muted)]">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
                                  )}
                                </p>
                              )}
                              {item.isAddOn && <span className="text-[9px] uppercase tracking-widest text-[var(--space-text-muted)]">add-on · excluded</span>}
                            </div>
                            <button onClick={() => setOverflowKey(overflowKey === item._key ? null : item._key)} className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card)] transition-colors">
                              <MoreHorizontal className="size-3.5" />
                            </button>
                            <button onClick={() => removeLine(item._key)} className="shrink-0 size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 hover:bg-[var(--space-bg-card)] transition-colors">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          {/* Row 2: controls */}
                          <div className="flex items-center gap-2 flex-wrap mt-2 pl-6">
                            <select
                              value={item.billingType ?? 'fixed'}
                              onChange={(e) => {
                                const bt = e.target.value as BillingType
                                patchLine(item._key, {
                                  billingType: bt,
                                  hours: bt === 'hourly' ? item.hours ?? 1 : undefined,
                                  recurringInterval: bt === 'recurring' ? item.recurringInterval ?? 'month' : undefined,
                                })
                              }}
                              className={selectCls}
                            >
                              <option value="fixed">Fixed</option>
                              <option value="hourly">Hourly</option>
                              <option value="recurring">Recurring</option>
                            </select>

                            <label className="flex items-center gap-1 text-[10px] text-[var(--space-text-muted)]">
                              <span>{item.billingType === 'hourly' ? 'Rate' : 'Price'}</span>
                              <input
                                type="number"
                                value={item.price ?? 0}
                                onChange={(e) => patchLine(item._key, { price: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                className={cn(numCls, 'w-20')}
                              />
                            </label>

                            {item.billingType === 'hourly' && (
                              <label className="flex items-center gap-1 text-[10px] text-[var(--space-text-muted)]">
                                <span>Hours</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.hours ?? 1}
                                  onChange={(e) => patchLine(item._key, { hours: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                                  className={cn(numCls, 'w-14')}
                                />
                                <span className="tabular-nums text-[var(--space-text-tertiary)]">= {fmt((item.hours ?? 1) * (item.price ?? 0))}</span>
                              </label>
                            )}

                            {item.billingType === 'recurring' && (
                              <>
                                <select
                                  value={item.recurringInterval ?? 'month'}
                                  onChange={(e) => patchLine(item._key, { recurringInterval: e.target.value as 'month' | 'year' })}
                                  className={selectCls}
                                >
                                  <option value="month">/mo</option>
                                  <option value="year">/yr</option>
                                </select>
                                <label className="flex items-center gap-1 text-[10px] text-[var(--space-text-muted)]">
                                  <span>Term (mo)</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.contractTermMonths ?? ''}
                                    onChange={(e) => patchLine(item._key, { contractTermMonths: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                                    className={cn(numCls, 'w-14')}
                                  />
                                </label>
                              </>
                            )}

                            <label className="flex items-center gap-1 text-[10px] text-[var(--space-text-muted)]">
                              <span>Qty</span>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity ?? 1}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10)
                                  patchLine(item._key, { quantity: isNaN(v) || v < 1 ? 1 : v })
                                }}
                                className={cn(numCls, 'w-12')}
                              />
                            </label>

                            <button
                              onClick={() => patchLine(item._key, { isAddOn: !item.isAddOn })}
                              className={cn(
                                'text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md border transition-colors',
                                item.isAddOn
                                  ? 'text-[var(--space-text-tertiary)] border-[rgba(139,156,182,0.20)] bg-[rgba(139,156,182,0.06)]'
                                  : 'text-[var(--space-text-muted)] border-[var(--space-border-hard)]',
                              )}
                            >
                              {item.isAddOn ? 'Add-on' : 'Included'}
                            </button>
                          </div>

                          {/* Overflow: discount / description */}
                          {overflowKey === item._key && (
                            <div className="mt-2 pl-6 pt-2 border-t border-[var(--space-border-hard)] space-y-2">
                              <label className="flex items-center gap-2 text-[10px] text-[var(--space-text-muted)]">
                                <span className="uppercase tracking-widest">Discount / override</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.adjustedPrice ?? ''}
                                  placeholder={String(item.price ?? 0)}
                                  onChange={(e) => patchLine(item._key, { adjustedPrice: e.target.value === '' ? null : parseFloat(e.target.value) })}
                                  className={cn(numCls, 'w-24')}
                                />
                                {item.adjustedPrice != null && (
                                  <button onClick={() => patchLine(item._key, { adjustedPrice: null })} className="text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)]">
                                    <X className="size-3" />
                                  </button>
                                )}
                              </label>
                              <textarea
                                value={item.description ?? ''}
                                onChange={(e) => patchLine(item._key, { description: e.target.value })}
                                placeholder="Line description (shown on proposal)"
                                rows={2}
                                className={cn(inputCls, 'resize-none text-xs')}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Payment schedule disclosure */}
              <div className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden">
                <button onClick={() => setShowSchedule((v) => !v)} className="w-full flex items-center gap-2 px-4 py-3 text-left">
                  <ChevronRight className={cn('size-3.5 text-[var(--space-text-muted)] transition-transform', showSchedule && 'rotate-90')} />
                  <CalendarClock className="size-3.5 text-[var(--space-text-muted)]" />
                  <span className="text-xs font-semibold text-[var(--space-text-tertiary)]">Payment schedule (optional)</span>
                  {schedule.length > 0 && <span className="text-[10px] text-[var(--space-text-muted)] tabular-nums">{schedule.length}</span>}
                </button>
                {showSchedule && (
                  <div className="px-4 pb-4 space-y-2 border-t border-[var(--space-border-hard)] pt-3">
                    {schedule.map((row, i) => (
                      <div key={row._key} className="flex items-center gap-2 flex-wrap">
                        <input
                          value={row.label}
                          onChange={(e) => setSchedule((prev) => prev.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
                          placeholder="Label"
                          className={cn(inputCls, 'flex-1 min-w-[120px] py-1.5 text-xs')}
                        />
                        <select
                          value={row.entryType}
                          onChange={(e) => setSchedule((prev) => prev.map((r, j) => (j === i ? { ...r, entryType: e.target.value as SchedRow['entryType'] } : r)))}
                          className={selectCls}
                        >
                          <option value="deposit">Deposit</option>
                          <option value="installment">Installment</option>
                          <option value="balance">Balance</option>
                        </select>
                        <input
                          type="number"
                          value={row.amount || ''}
                          placeholder="Amount"
                          onChange={(e) => setSchedule((prev) => prev.map((r, j) => (j === i ? { ...r, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) } : r)))}
                          className={cn(numCls, 'w-24')}
                        />
                        <input
                          type="date"
                          value={row.dueDate ?? ''}
                          onChange={(e) => setSchedule((prev) => prev.map((r, j) => (j === i ? { ...r, dueDate: e.target.value || undefined } : r)))}
                          className={cn(numCls, 'w-36')}
                        />
                        <button onClick={() => setSchedule((prev) => prev.filter((_, j) => j !== i))} className="size-6 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setSchedule((prev) => [...prev, { _key: genKey(), label: '', entryType: 'installment', amount: 0 }])}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] transition-colors pt-1"
                    >
                      <Plus className="size-3.5" />
                      Add entry
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer — action bar */}
        <div className="shrink-0 flex items-center gap-4 px-4 sm:px-6 py-3 border-t border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.02)] flex-wrap">
          <div className="flex items-end gap-5 flex-wrap flex-1 min-w-0">
            {oneTime > 0 && (
              <div>
                <p className="text-lg font-bold text-[var(--space-text-primary)] tabular-nums leading-none">{fmt(oneTime)}</p>
                <p className="text-[9px] text-[var(--space-text-tertiary)] uppercase tracking-[0.18em] mt-1">one-time</p>
              </div>
            )}
            {monthly > 0 && (
              <div>
                <p className="text-lg font-bold tabular-nums leading-none" style={{ color: 'var(--space-accent)' }}>{fmt(monthly)}<span className="text-sm text-[var(--space-text-muted)]">/mo</span></p>
                <p className="text-[9px] text-[var(--space-text-tertiary)] uppercase tracking-[0.18em] mt-1">monthly</p>
              </div>
            )}
            {annual > 0 && (
              <div>
                <p className="text-lg font-bold tabular-nums leading-none" style={{ color: 'var(--space-accent)' }}>{fmt(annual)}<span className="text-sm text-[var(--space-text-muted)]">/yr</span></p>
                <p className="text-[9px] text-[var(--space-text-tertiary)] uppercase tracking-[0.18em] mt-1">annually</p>
              </div>
            )}
            {oneTime === 0 && monthly === 0 && annual === 0 && (
              <span className="text-xs text-[var(--space-text-muted)]">
                {lines.length === 0 ? 'Add line items to set pricing' : 'No billable pricing yet'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onClose()}
              className="hidden sm:block px-4 py-2.5 text-sm text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] rounded-xl hover:bg-[var(--space-bg-card-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {mode === 'edit' ? 'Save changes' : 'Save draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
