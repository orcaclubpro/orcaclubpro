'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Plus, Save, Star, X, Package as PackageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createServiceItem, updateServiceItem } from '@/actions/package-builder'
import type { ServiceItem } from '@/types/payload-types'

// ─── The service item editor ────────────────────────────────────────────────────
// One dialog for both jobs the builder needs: invent a service on the spot, and fix
// one that already exists. It replaced an inline mini-form that could only capture a
// name and a price — so every line placed from it reached the client's proposal with
// no description under it, and the only way to add one was the Payload admin.
//
// Everything here is a real field on the catalog item except `isAddOn`, which is a
// property of the PLACED LINE (a service is not inherently optional — it is optional
// on this particular proposal), and so is handed back to the caller rather than saved.

export type BillingType = 'fixed' | 'hourly' | 'recurring'

/** What the caller does with the result — place it, and know how it was placed. */
export interface ServiceItemDraft {
  name: string
  description?: string
  billingType: BillingType
  /** Per-unit price. Hourly: the rate. Recurring: the amount per interval. */
  price: number
  recurringInterval: 'month' | 'year'
  hours: number
  quantity: number
  /** Offered as an optional extra — excluded from the proposal total. */
  isAddOn: boolean
  /** Set when the draft was also written to the catalog. */
  catalogItem: ServiceItem | null
}

export interface ServiceItemModalProps {
  /** Editing an existing catalog item, or null to create a new one. */
  item?: ServiceItem | null
  /**
   * The package's hourly rate, when it has one. A new service then opens as hourly at
   * that rate, so only the hours need typing — which is the point of setting a package
   * rate at all. Still overridable per line; the override is local to the line unless
   * the item is saved to the catalog.
   */
  defaultHourlyRate?: number | null
  /** Fires after a successful save. In edit mode `draft.catalogItem` is the updated doc. */
  onDone: (draft: ServiceItemDraft) => void
  onClose: () => void
}

const BILLING: { value: BillingType; label: string; hint: string }[] = [
  { value: 'fixed',     label: 'Fixed',     hint: 'One flat price for the deliverable.' },
  { value: 'hourly',    label: 'Hourly',    hint: 'A rate — the line total is hours × rate.' },
  { value: 'recurring', label: 'Recurring', hint: 'Charged every interval for the contract term.' },
]

const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const numCls = cn(inputCls, '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none')
const labelCls = 'block text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)] mb-1.5'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0)
}

export function ServiceItemModal({ item, defaultHourlyRate, onDone, onClose }: ServiceItemModalProps) {
  const editing = Boolean(item)
  // A package rate only steers a NEW service — an existing catalog item keeps its own.
  const packageRate = !editing && defaultHourlyRate != null && defaultHourlyRate > 0 ? defaultHourlyRate : null

  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [billingType, setBillingType] = useState<BillingType>(
    (item?.billingType as BillingType) ?? (packageRate ? 'hourly' : 'fixed'),
  )
  const [priceStr, setPriceStr] = useState(
    item ? String((item.billingType === 'hourly' ? item.defaultRate : item.defaultPrice) ?? '') : (packageRate ? String(packageRate) : ''),
  )
  const [interval, setInterval] = useState<'month' | 'year'>((item?.defaultInterval as 'month' | 'year') ?? 'month')
  const [hoursStr, setHoursStr] = useState('1')
  const [qtyStr, setQtyStr] = useState('1')
  const [isAddOn, setIsAddOn] = useState(false)
  const [starred, setStarred] = useState(Boolean(item?.starred))
  // Off by default: most services are invented for one proposal, and a catalog that
  // fills up with one-offs stops being worth scanning. Opt in when it will be reused.
  // (Irrelevant in edit mode — the item is already in the catalog.)
  const [saveToCatalog, setSaveToCatalog] = useState(false)

  const rateAppliedRef = useRef(Boolean(packageRate))
  function pickBilling(next: BillingType) {
    setBillingType(next)
    if (!packageRate) return
    if (next === 'hourly' && !rateAppliedRef.current) {
      setPriceStr(String(packageRate))
      rateAppliedRef.current = true
    } else if (next !== 'hourly' && rateAppliedRef.current && priceStr === String(packageRate)) {
      setPriceStr('')
      rateAppliedRef.current = false
    }
  }

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 40)
    return () => clearTimeout(t)
  }, [])

  // Esc closes; Enter adds it to the package. Captured so the console's own Esc
  // handling — which would collapse the whole station — never sees the key here.
  //
  // Enter is deliberately NOT a submit inside the description: that field is the reason
  // this dialog exists and its whole value is one thought per line, so a newline has to
  // stay a newline. ⌘/Ctrl+Enter submits from anywhere, including there.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation()
        if (!busy) onClose()
        return
      }
      if (e.key !== 'Enter') return
      const withModifier = e.metaKey || e.ctrlKey
      if (!withModifier) {
        if (e.shiftKey || e.altKey) return
        // Let the focused control have the key: a textarea takes a newline, and a
        // button or link takes its own activation — Enter on Cancel must cancel.
        const tag = (e.target as HTMLElement | null)?.tagName
        if (tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') return
      }
      e.preventDefault(); e.stopPropagation()
      void submit()
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  })

  const price = parseFloat(priceStr) || 0
  const hours = Math.max(0, parseFloat(hoursStr) || 0)
  const quantity = Math.max(1, parseInt(qtyStr, 10) || 1)
  const lineTotal =
    billingType === 'hourly' ? Math.round(price * hours * quantity * 100) / 100 : Math.round(price * quantity * 100) / 100
  const per = billingType === 'recurring' ? (interval === 'year' ? '/yr' : '/mo') : ''
  const canSave = name.trim().length > 0 && priceStr.trim() !== '' && !isNaN(parseFloat(priceStr))

  async function submit() {
    if (busy) return
    if (!name.trim()) { setError('Give the service a name'); return }
    if (priceStr.trim() === '' || isNaN(parseFloat(priceStr))) {
      setError(billingType === 'hourly' ? 'Set an hourly rate' : 'Set a price')
      return
    }
    setError(null)
    setBusy(true)
    try {
      let catalogItem: ServiceItem | null = null

      if (editing && item) {
        const res = await updateServiceItem(item.id, {
          name, description,
          billingType,
          defaultPrice: billingType === 'hourly' ? null : price,
          defaultRate: billingType === 'hourly' ? price : null,
          defaultInterval: interval,
          starred,
        })
        if (!res.success || !res.item) { setError(res.error ?? 'Could not save the change'); return }
        catalogItem = res.item
      } else if (saveToCatalog) {
        const res = await createServiceItem({
          name: name.trim(),
          description: description.trim() || undefined,
          billingType,
          defaultPrice: billingType === 'hourly' ? undefined : price,
          defaultRate: billingType === 'hourly' ? price : undefined,
          defaultInterval: billingType === 'recurring' ? interval : undefined,
          starred,
        })
        if (!res.success || !res.item) { setError(res.error ?? 'Could not save to the catalog'); return }
        catalogItem = res.item as ServiceItem
      }

      onDone({
        name: name.trim(),
        description: description.trim() || undefined,
        billingType,
        price,
        recurringInterval: interval,
        hours: billingType === 'hourly' ? Math.max(hours, 0) || 1 : 1,
        quantity,
        isAddOn,
        catalogItem,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] print:hidden">
      <div
        className="absolute inset-0 animate-in fade-in duration-150"
        style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)' }}
        onClick={() => !busy && onClose()}
      />
      <div className="absolute left-1/2 top-4 bottom-4 -translate-x-1/2 w-full px-3 max-w-[35rem]">
        <div
          className="flex flex-col h-full overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-150"
          style={{ background: 'var(--space-bg-card)', border: '1px solid var(--space-border-hard)' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--space-border-hard)] shrink-0">
            <div className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--space-accent-soft)' }}>
              <PackageIcon className="size-3.5" style={{ color: 'var(--space-accent)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--space-text-primary)] leading-tight">
                {editing ? 'Edit service' : 'New service'}
              </p>
              <p className="text-[0.6875rem] text-[var(--space-text-muted)] truncate">
                {editing
                  ? 'Changes apply to the catalog — proposals already sent keep their snapshot.'
                  : 'Add it to this package, and optionally to the catalog for reuse.'}
              </p>
            </div>
            <button
              onClick={() => !busy && onClose()}
              aria-label="Close"
              className="ml-auto size-8 rounded-lg border border-[var(--space-border-hard)] flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] transition-colors shrink-0"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <label className={labelCls} htmlFor="svc-name">Name</label>
              <input
                id="svc-name"
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Conversion-focused landing page"
                className={inputCls}
              />
            </div>

            {/* The headline of this dialog — a line item with no description reaches the
                client as a bare name and a number. */}
            <div>
              <label className={labelCls} htmlFor="svc-desc">
                Description <span className="normal-case tracking-normal font-normal text-[var(--space-text-muted)]">· shown under the line on the proposal, PDF and invoice</span>
              </label>
              <textarea
                id="svc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={'What the client actually gets.\nOne thought per line reads well on the document.'}
                className={cn(inputCls, 'resize-y leading-relaxed')}
              />
            </div>

            {/* Billing — buttons rather than a <select>, so the choice and its
                consequence are both visible without opening anything. */}
            <div>
              <span className={labelCls}>Billing</span>
              <div className="grid grid-cols-3 gap-2">
                {BILLING.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => pickBilling(b.value)}
                    className={cn(
                      'px-3 py-2 text-xs font-semibold rounded-lg border transition-all',
                      billingType === b.value
                        ? 'text-[var(--space-text-primary)] bg-[var(--space-accent-soft)]'
                        : 'text-[var(--space-text-muted)] border-[var(--space-border-hard)] hover:text-[var(--space-text-secondary)]',
                    )}
                    style={billingType === b.value ? { borderColor: 'var(--space-accent)' } : {}}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[0.6875rem] text-[var(--space-text-muted)] leading-relaxed">
                {BILLING.find((b) => b.value === billingType)!.hint}
              </p>
            </div>

            {/* Price row — what it asks for changes with the billing type.
                With a package rate the hours come FIRST: the rate is already settled, so
                hours are the field being set, and they should also be the next tab stop.
                Ordered in the markup rather than with `order-*`, which would leave the
                tab order following the old sequence. */}
            <div className="grid grid-cols-2 gap-3">
              {billingType === 'hourly' && packageRate != null && (
                <div>
                  <label className={labelCls} htmlFor="svc-hours">Hours</label>
                  <input id="svc-hours" type="number" min={0} step="0.25" value={hoursStr} onChange={(e) => setHoursStr(e.target.value)} className={numCls} />
                </div>
              )}
              <div>
                <label className={labelCls} htmlFor="svc-price">
                  {billingType === 'hourly' ? 'Rate (per hour)' : billingType === 'recurring' ? `Amount per ${interval}` : 'Price'}
                </label>
                <input
                  id="svc-price"
                  type="number" min={0} step="0.01"
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
                  placeholder="0.00"
                  className={numCls}
                />
                {packageRate != null && billingType === 'hourly' && (
                  parseFloat(priceStr) === packageRate ? (
                    <p className="mt-1 text-[0.6875rem] text-[var(--space-text-muted)]">Package rate — just set the hours.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPriceStr(String(packageRate))}
                      className="mt-1 text-[0.6875rem] text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] transition-colors underline underline-offset-2"
                    >
                      Reset to package rate ({fmt(packageRate)}/hr)
                    </button>
                  )
                )}
              </div>
              {billingType === 'hourly' && packageRate == null && (
                <div>
                  <label className={labelCls} htmlFor="svc-hours">Hours</label>
                  <input id="svc-hours" type="number" min={0} step="0.25" value={hoursStr} onChange={(e) => setHoursStr(e.target.value)} className={numCls} />
                </div>
              )}
              {billingType === 'recurring' && (
                <div>
                  <span className={labelCls}>Interval</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['month', 'year'] as const).map((iv) => (
                      <button
                        key={iv}
                        type="button"
                        onClick={() => setInterval(iv)}
                        className={cn(
                          'px-3 py-2 text-xs font-semibold rounded-lg border transition-all',
                          interval === iv
                            ? 'text-[var(--space-text-primary)] bg-[var(--space-accent-soft)]'
                            : 'text-[var(--space-text-muted)] border-[var(--space-border-hard)] hover:text-[var(--space-text-secondary)]',
                        )}
                        style={interval === iv ? { borderColor: 'var(--space-accent)' } : {}}
                      >
                        {iv === 'month' ? 'Monthly' : 'Yearly'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {billingType === 'fixed' && (
                <div>
                  <label className={labelCls} htmlFor="svc-qty">Quantity</label>
                  <input id="svc-qty" type="number" min={1} value={qtyStr} onChange={(e) => setQtyStr(e.target.value)} className={numCls} />
                </div>
              )}
            </div>

            {/* How it lands on THIS proposal — not a catalog property, so it is never saved. */}
            {!editing && (
              <button
                type="button"
                onClick={() => setIsAddOn((v) => !v)}
                className={cn(
                  'w-full flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  isAddOn
                    ? 'border-dashed bg-[rgba(139,156,182,0.05)]'
                    : 'border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]',
                )}
                style={isAddOn ? { borderColor: 'rgba(139,156,182,0.28)' } : {}}
              >
                <span
                  className={cn(
                    'mt-0.5 shrink-0 size-4 rounded border flex items-center justify-center',
                    isAddOn ? 'border-transparent' : 'border-[var(--space-border-hard)]',
                  )}
                  style={isAddOn ? { background: 'var(--space-accent)' } : {}}
                >
                  {isAddOn && <span className="block size-1.5 rounded-[1px] bg-black" />}
                </span>
                <span className="text-xs text-[var(--space-text-secondary)]">
                  Offer as an optional add-on
                  <span className="block text-[0.6875rem] text-[var(--space-text-muted)] mt-0.5">
                    Listed on the proposal for the client to request, and left out of the total.
                  </span>
                </span>
              </button>
            )}

            {/* Catalog options */}
            <div className="rounded-lg border border-[var(--space-border-hard)] divide-y divide-[var(--space-border-hard)]">
              {!editing && (
                <label className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={saveToCatalog} onChange={(e) => setSaveToCatalog(e.target.checked)} className="size-3.5 accent-[var(--space-accent)]" />
                  <span className="text-xs text-[var(--space-text-secondary)]">
                    Save to the catalog for reuse
                    <span className="block text-[0.6875rem] text-[var(--space-text-muted)]">Off adds it to this package only.</span>
                  </span>
                </label>
              )}
              <button
                type="button"
                onClick={() => setStarred((v) => !v)}
                disabled={!editing && !saveToCatalog}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left disabled:opacity-40 transition-opacity"
              >
                <Star className={cn('size-3.5 shrink-0', starred && 'fill-current')} style={starred ? { color: 'var(--space-accent)' } : { color: 'var(--space-text-muted)' }} />
                <span className="text-xs text-[var(--space-text-secondary)]">
                  Star it
                  <span className="block text-[0.6875rem] text-[var(--space-text-muted)]">Starred services sort to the top of the catalog rail.</span>
                </span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          {/* ── Footer — the running line total, so the price is confirmed before it lands ── */}
          <div className="shrink-0 flex items-center gap-3 px-5 py-3.5 border-t border-[var(--space-border-hard)]">
            <div className="min-w-0">
              <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">
                {isAddOn ? 'Add-on · excluded from total' : 'Line total'}
              </p>
              <p className="text-base font-semibold tabular-nums text-[var(--space-text-primary)] leading-tight">
                {fmt(lineTotal)}<span className="text-xs font-normal text-[var(--space-text-muted)]">{per}</span>
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => !busy && onClose()}
                className="px-3 py-2 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] rounded-lg hover:bg-[var(--space-bg-card-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void submit()}
                disabled={busy || !canSave}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-40"
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : editing ? <Save className="size-3.5" /> : <Plus className="size-3.5" />}
                {editing ? 'Save changes' : 'Add to package'}
                <kbd className="ml-0.5 px-1 py-0.5 rounded bg-black/15 text-[0.5625rem] font-mono leading-none">&crarr;</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
