'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Loader2, X, Send, CircleCheck, Circle, ArrowRight, AlertTriangle, Check,
  CalendarDays, FileText, ListChecks, MailX, PackageCheck, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPackageRecapModel, logPackageWork } from '@/actions/packageWork'
import { sendScheduledPayment } from '@/actions/packages'
import type { PackageRecapData } from '@/lib/packages/recap'
import { buildWorkLines, WORK_CATEGORY_LABEL, type WorkCategory } from '@/lib/packages/workLines'

// ── Shared styles (verbatim from RetainerInvoiceModal) ────────────────────────
const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const areaCls = cn(inputCls, 'py-2 resize-none')
const accentBtn =
  'flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50'
const ghostBtn =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-all disabled:opacity-50'
const labelCls = 'text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]'
const selectCls =
  'px-2 py-1.5 text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-secondary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const numCls =
  'text-xs bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] px-2.5 py-1.5 focus:outline-none focus:border-[rgba(139,156,182,0.20)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

const CATEGORIES = Object.keys(WORK_CATEGORY_LABEL) as WorkCategory[]

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0)
}

function fmtDay(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (!isFinite(d.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(d)
}

/** Days Stripe will give the client to pay — mirrors the server's default of 30. */
function daysUntilDue(dueDate: string | null | undefined): number {
  if (!dueDate) return 30
  const due = new Date(dueDate).getTime()
  if (!isFinite(due)) return 30
  return Math.max(1, Math.round((due - Date.now()) / 86_400_000))
}

interface WorkLineRow {
  entryId: string
  title: string
  description: string
}

export interface SchedulePaymentInvoiceModalProps {
  packageId: string
  packageName: string
  entry: { id: string; label: string; amount: number; dueDate?: string | null }
  /** Project the resulting order is filed under. Omit to leave it unfiled. */
  projectId?: string
  /** Staff-composed recap for THIS entry, or null. Keyed by entry id in the parent. */
  recapDraft: PackageRecapData | null
  onRecapChange: (entryId: string, recap: PackageRecapData) => void
  onClose: () => void
  onSent: () => void
}

interface SendOutcome {
  ok: boolean
  msg: string
  url?: string | null
}

/**
 * Send one scheduled payment: pick which logged work rides along as $0 lines, write the
 * recap narrative that documents it, and choose how it reaches the client.
 *
 * The server owns every number — this composer only ever contributes narrative text and
 * a selection of entry ids (see mergePackageRecap in src/lib/packages/recap.ts).
 */
export function SchedulePaymentInvoiceModal({
  packageId, packageName, entry, projectId, recapDraft, onRecapChange, onClose, onSent,
}: SchedulePaymentInvoiceModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<PackageRecapData | null>(null)
  const [workLines, setWorkLines] = useState<WorkLineRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [recap, setRecap] = useState<PackageRecapData | null>(null)

  /** 'invoice' bills through Stripe and emails; 'fulfill' records it settled, off-Stripe. */
  const [mode, setMode] = useState<'invoice' | 'fulfill'>('invoice')
  const [fulfillmentNote, setFulfillmentNote] = useState('')

  const [attachRecapPdf, setAttachRecapPdf] = useState(true)
  const [includeWorkInEmail, setIncludeWorkInEmail] = useState(true)
  const [skipEmail, setSkipEmail] = useState(false)

  const fulfilling = mode === 'fulfill'

  const [sending, setSending] = useState(false)
  const [outcome, setOutcome] = useState<SendOutcome | null>(null)

  // ── Inline work logging ──
  // Work has to exist before it can ride along, and the only other place to create it
  // is the command console's Milestones station. Logging it here keeps the send in one
  // screen: the new entry is appended to the list and pre-selected.
  const [logOpen, setLogOpen] = useState(false)
  const [logDate, setLogDate] = useState(todayInput())
  const [logHours, setLogHours] = useState('')
  const [logCategory, setLogCategory] = useState<WorkCategory>('work')
  const [logDesc, setLogDesc] = useState('')
  const [logging, setLogging] = useState(false)
  const logRef = useRef<HTMLInputElement>(null)

  // The draft is a seed, not a controlled value — re-seeding on every parent keystroke
  // would fight the local editor state.
  const draftSeed = useRef(recapDraft)

  const panelRef = useRef<HTMLDivElement>(null)

  // Escape closes, and the page behind is locked so a scroll gesture over the backdrop
  // doesn't move the document out from under the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  // Keep Tab inside the dialog — without this, tabbing walks the page behind it.
  const onKeyDownTrap = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const root = panelRef.current
    if (!root) return
    const focusables = root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }, [])

  // Load the recap model + the work lines this payment would carry, once.
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      const r = await getPackageRecapModel(packageId, entry.id)
      if (!alive) return
      if (r.success) {
        setModel(r.model)
        setWorkLines(r.workLines)
        setSelected(new Set(r.workLines.map((l) => l.entryId)))
        setRecap(draftSeed.current ?? r.model)
      } else {
        setError(r.error ?? 'Failed to load this payment')
      }
      setLoading(false)
    })()
    return () => { alive = false }
  }, [packageId, entry.id])

  /** Patch narrative text and hand the whole recap back to the parent, entry-keyed. */
  function patchRecap(patch: Partial<PackageRecapData>) {
    setRecap((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      onRecapChange(entry.id, next)
      return next
    })
  }

  function patchBucketNote(idx: number, note: string) {
    setRecap((prev) => {
      if (!prev) return prev
      const next = { ...prev, buckets: prev.buckets.map((b, i) => (i === idx ? { ...b, note } : b)) }
      onRecapChange(entry.id, next)
      return next
    })
  }

  function toggleLine(entryId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  const allSelected = workLines.length > 0 && selected.size === workLines.length

  /** Log a new work entry against this package and put it straight on this payment. */
  async function handleLogWork() {
    if (!logDesc.trim()) { setError('Describe the work'); return }
    setError(null)
    setLogging(true)
    const r = await logPackageWork({
      packageId,
      date: logDate || todayInput(),
      hours: logHours === '' ? undefined : parseFloat(logHours),
      category: logCategory,
      description: logDesc.trim(),
    })
    setLogging(false)
    if (!r.success) { setError(r.error ?? 'Failed to log work'); return }

    // buildWorkLines is the same formatter the server uses, so the row reads exactly
    // as it will on the invoice — no round-trip needed to show it.
    const [line] = buildWorkLines([{
      id: r.id,
      date: logDate || todayInput(),
      description: logDesc.trim(),
      hours: logHours === '' ? null : parseFloat(logHours),
      category: logCategory,
    }])
    setWorkLines((prev) => [...prev, line])
    setSelected((prev) => new Set(prev).add(r.id))
    setLogDesc('')
    setLogHours('')
    logRef.current?.focus()

    // Re-derive the recap: the new entry changes the item/hour counts and can add a
    // whole bucket. mergePackageRecap pairs client buckets to server buckets BY INDEX,
    // so a shifted bucket list would land staff notes on the wrong section — carry the
    // notes across by label instead of trusting position.
    const fresh = await getPackageRecapModel(packageId, entry.id)
    if (!fresh.success) return
    setWorkLines(fresh.workLines)
    setModel(fresh.model)
    setRecap((prev) => {
      if (!prev) return fresh.model
      const notesByLabel = new Map(prev.buckets.map((b) => [b.label, b.note]))
      const next: PackageRecapData = {
        ...fresh.model,
        headline: prev.headline,
        accomplishedHeadline: prev.accomplishedHeadline,
        remainingHeadline: prev.remainingHeadline,
        buckets: fresh.model.buckets.map((b) => ({ ...b, note: notesByLabel.get(b.label) ?? b.note })),
      }
      onRecapChange(entry.id, next)
      return next
    })
  }

  async function handleSend() {
    setError(null)
    setSending(true)
    const result = await sendScheduledPayment(packageId, entry.id, projectId || undefined, {
      mode,
      fulfillmentNote: fulfilling ? fulfillmentNote : undefined,
      skipEmail,
      workLineIds: [...selected],
      recap: fulfilling ? undefined : recap ?? undefined,
      attachRecapPdf: !fulfilling && !skipEmail && attachRecapPdf,
      includeWorkInEmail: !fulfilling && !skipEmail && includeWorkInEmail,
    })
    setSending(false)

    if (result.success) {
      const count = selected.size
      const work = count > 0 ? ` · ${count} work line${count === 1 ? '' : 's'}` : ''
      const ref = result.orderNumber ? `#${result.orderNumber} ` : ''
      setOutcome({
        ok: true,
        url: result.invoiceUrl ?? null,
        msg: fulfilling
          ? `Fulfilled ${ref}— ${fmt(entry.amount)}${work} · recorded as paid, no invoice or email`
          : `Invoice ${ref}— ${fmt(entry.amount)}${work}${skipEmail ? ' created, no email sent' : ' created and emailed'}`,
      })
      onSent()
    } else {
      setError(result.error ?? (fulfilling ? 'Failed to fulfill this payment' : 'Failed to send this payment'))
    }
  }

  const due = fmtDay(entry.dueDate)
  const dueDays = daysUntilDue(entry.dueDate)

  if (typeof document === 'undefined') return null

  // Portalled to <body>: this dialog is opened from routes wrapped in `.page-enter`,
  // whose retained animation transform would otherwise become the containing block for
  // every `fixed` child — anchoring the overlay to the page's full content height
  // instead of the viewport (send bar off-screen, no internal scroll, no scroll-follow).
  return createPortal(
    <div
      className="fixed inset-0 z-[80] print:hidden flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-label={fulfilling ? 'Fulfill scheduled payment' : 'Send scheduled payment'}
      onKeyDown={onKeyDownTrap}
    >
      <div
        className="absolute inset-0 animate-in fade-in duration-150"
        style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[37.5rem] max-h-full">
        <div
          ref={panelRef}
          className="flex flex-col max-h-[calc(100vh-1.5rem)] overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
          style={{ background: 'var(--space-bg-card)', border: '1px solid var(--space-border-hard)' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--space-border-hard)] shrink-0">
            <span className="text-sm font-semibold text-[var(--space-text-primary)]">
              {fulfilling ? 'Fulfill scheduled payment' : 'Send scheduled payment'}
            </span>
            <span className="text-xs text-[var(--space-text-muted)] truncate">
              {packageName} · {entry.label}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="ml-auto size-8 rounded-lg border border-[var(--space-border-hard)] flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] transition-colors shrink-0"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="size-5 text-[var(--space-text-muted)] animate-spin" /></div>
            ) : !model || !recap ? (
              <div className="py-20 text-center text-sm text-[var(--space-text-muted)]">{error ?? 'This payment could not be loaded.'}</div>
            ) : outcome ? (
              /* ── Result ── */
              <div className="py-4 space-y-4">
                <div
                  className="mx-auto size-11 rounded-full flex items-center justify-center"
                  style={{ background: outcome.ok ? 'var(--space-accent-soft)' : 'rgba(245,158,11,0.12)' }}
                >
                  {outcome.ok
                    ? <Check className="size-5" style={{ color: 'var(--space-accent)' }} />
                    : <AlertTriangle className="size-5 text-amber-500" />}
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-3 py-2.5">
                  {outcome.ok
                    ? <Check className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--space-accent)' }} />
                    : <X className="size-4 shrink-0 mt-0.5 text-red-400" />}
                  <div className="flex-1 min-w-0">
                    <p className={labelCls}>{entry.label}</p>
                    <p className="text-xs text-[var(--space-text-secondary)] mt-0.5">{outcome.msg}</p>
                    {outcome.url && (
                      <a
                        href={outcome.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-[var(--space-accent)] hover:underline mt-1"
                      >
                        View Stripe invoice <ArrowRight className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex justify-center pt-2">
                  <button onClick={onClose} className={accentBtn}>Done</button>
                </div>
              </div>
            ) : (
              <>
                {/* ── ① Payment summary (read-only) ── */}
                <div className="rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--space-text-primary)] truncate">{entry.label}</p>
                      <p className="text-[0.625rem] text-[var(--space-text-muted)] mt-0.5">{model.paymentPosition}</p>
                    </div>
                    <span className="text-lg font-semibold tabular-nums text-[var(--space-text-primary)] shrink-0">
                      {fmt(entry.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[0.625rem] text-[var(--space-text-muted)]">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {due ? `Due ${due}` : 'No due date'}
                    </span>
                    <span className="tabular-nums">Net {dueDays} day{dueDays === 1 ? '' : 's'}</span>
                    <span className="tabular-nums">
                      {fmt(model.amountPaid)} paid of {fmt(model.packageTotal)}
                    </span>
                  </div>
                </div>

                {/* ── ② Work lines ── */}
                <div className="rounded-xl border border-[var(--space-border-hard)]">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--space-border-hard)]">
                    <ListChecks className="size-3.5 shrink-0 text-[var(--space-text-muted)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--space-text-primary)]">
                        Work on this {fulfilling ? 'payment' : 'invoice'}
                      </p>
                      <p className="text-[0.625rem] text-[var(--space-text-muted)] mt-0.5">
                        Attached as $0 lines — the payment above carries the price.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {workLines.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelected(allSelected ? new Set() : new Set(workLines.map((l) => l.entryId)))}
                          className={ghostBtn}
                        >
                          {allSelected ? 'Select none' : 'Select all'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setLogOpen((v) => !v)}
                        className={cn(ghostBtn, logOpen && 'text-[var(--space-text-primary)] bg-[var(--space-bg-card-hover)]')}
                      >
                        <Plus className="size-3" />
                        Add work
                      </button>
                    </div>
                  </div>

                  {/* Inline logger — creates a real package work entry, then drops it
                      into the list above already selected. */}
                  {logOpen && (
                    <div className="flex items-end gap-2 flex-wrap px-4 py-3 border-b border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)]">
                      <input
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className={cn(numCls, 'w-[8.5rem]')}
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.25"
                        value={logHours}
                        onChange={(e) => setLogHours(e.target.value)}
                        placeholder="Hrs"
                        className={cn(numCls, 'w-16')}
                      />
                      <select
                        value={logCategory}
                        onChange={(e) => setLogCategory(e.target.value as WorkCategory)}
                        className={selectCls}
                      >
                        {CATEGORIES.map((c) => <option key={c} value={c}>{WORK_CATEGORY_LABEL[c]}</option>)}
                      </select>
                      <input
                        ref={logRef}
                        value={logDesc}
                        onChange={(e) => setLogDesc(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !logging) { e.preventDefault(); handleLogWork() } }}
                        placeholder="What was done"
                        autoFocus
                        className={cn(inputCls, 'flex-1 min-w-[9rem] py-1.5 text-xs')}
                      />
                      <button type="button" onClick={handleLogWork} disabled={logging} className={accentBtn}>
                        {logging ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        Log
                      </button>
                    </div>
                  )}

                  {workLines.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-[var(--space-text-muted)]">
                      No unbilled work logged for this package — use <span className="text-[var(--space-text-secondary)]">Add work</span> to log some onto this {fulfilling ? 'payment' : 'invoice'}.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--space-border-hard)]">
                      {workLines.map((line) => {
                        const on = selected.has(line.entryId)
                        return (
                          <button
                            key={line.entryId}
                            type="button"
                            onClick={() => toggleLine(line.entryId)}
                            className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-[var(--space-bg-card-hover)] transition-colors"
                          >
                            {on
                              ? <CircleCheck className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--space-accent)' }} />
                              : <Circle className="size-4 shrink-0 mt-0.5 text-[var(--space-text-muted)]" />}
                            <div className={cn('flex-1 min-w-0', !on && 'opacity-50')}>
                              <p className="text-xs text-[var(--space-text-secondary)] truncate">{line.title}</p>
                              <p className="text-[0.625rem] text-[var(--space-text-muted)] mt-0.5 truncate">{line.description}</p>
                            </div>
                            <span className="text-[0.625rem] tabular-nums text-[var(--space-text-muted)] shrink-0 mt-0.5">$0</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── ③ Recap narrative ── (invoice only: the recap exists to ride the email) ── */}
                {!fulfilling && (
                <div className="rounded-xl border border-[var(--space-border-hard)] px-4 py-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="size-3.5 shrink-0 text-[var(--space-text-muted)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--space-text-primary)]">Recap</p>
                      <p className="text-[0.625rem] text-[var(--space-text-muted)] mt-0.5">
                        {model.itemsShipped} item{model.itemsShipped === 1 ? '' : 's'} · {model.totalHours} hour{model.totalHours === 1 ? '' : 's'} logged · {fmt(model.amountRemaining)} remaining
                      </p>
                    </div>
                  </div>

                  <label className="block">
                    <span className={labelCls}>Headline</span>
                    <textarea
                      value={recap.headline}
                      onChange={(e) => patchRecap({ headline: e.target.value })}
                      rows={2}
                      placeholder={model.headline}
                      className={cn(areaCls, 'mt-1 text-xs')}
                    />
                  </label>

                  <label className="block">
                    <span className={labelCls}>What this payment covers</span>
                    <textarea
                      value={recap.accomplishedHeadline}
                      onChange={(e) => patchRecap({ accomplishedHeadline: e.target.value })}
                      rows={2}
                      placeholder="A sentence framing the work delivered…"
                      className={cn(areaCls, 'mt-1 text-xs')}
                    />
                  </label>

                  <label className="block">
                    <span className={labelCls}>What&apos;s left</span>
                    <textarea
                      value={recap.remainingHeadline}
                      onChange={(e) => patchRecap({ remainingHeadline: e.target.value })}
                      rows={2}
                      placeholder="A sentence framing the remaining scope…"
                      className={cn(areaCls, 'mt-1 text-xs')}
                    />
                  </label>

                  {recap.buckets.map((bucket, idx) => (
                    <label key={`${bucket.label}-${idx}`} className="block">
                      <span className={labelCls}>
                        {bucket.label} — {bucket.items.length} item{bucket.items.length === 1 ? '' : 's'}
                        {bucket.hours > 0 ? ` · ${bucket.hours}h` : ''}
                      </span>
                      <textarea
                        value={bucket.note}
                        onChange={(e) => patchBucketNote(idx, e.target.value)}
                        rows={2}
                        placeholder={`A note about the ${bucket.label.toLowerCase()} in this payment…`}
                        className={cn(areaCls, 'mt-1 text-xs')}
                      />
                    </label>
                  ))}
                </div>
                )}

                {/* ── ④ Delivery ── */}
                <div className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden">
                  {/* How this payment reaches the client — or doesn't. */}
                  <div className="flex items-center gap-1 m-3 p-1 rounded-lg bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)]">
                    <ModeTab
                      icon={Send}
                      active={!fulfilling}
                      onClick={() => setMode('invoice')}
                      label="Send invoice"
                      hint="Stripe invoice + email"
                    />
                    <ModeTab
                      icon={PackageCheck}
                      active={fulfilling}
                      onClick={() => setMode('fulfill')}
                      label="Fulfill"
                      hint="No invoice, no email"
                    />
                  </div>

                  {fulfilling ? (
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-[0.625rem] leading-relaxed text-[var(--space-text-muted)]">
                        Records this payment as already settled. No Stripe invoice is created and the client
                        is not emailed — the order is saved{' '}
                        <span className="text-[var(--space-text-secondary)]">paid</span>, so it never lands on
                        their outstanding balance. Work selected above is still attached and marked billed.
                      </p>
                      <label className="block">
                        <span className={labelCls}>Fulfillment note</span>
                        <textarea
                          value={fulfillmentNote}
                          onChange={(e) => setFulfillmentNote(e.target.value)}
                          rows={3}
                          placeholder="Why this payment was fulfilled off-Stripe — covered by the November retainer, paid by check #1041, comped…"
                          className={cn(areaCls, 'mt-1 text-xs')}
                        />
                        <span className="block text-[0.625rem] text-[var(--space-text-muted)] mt-1">
                          Internal only — stored on the order, never shown to the client.
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="border-t border-[var(--space-border-hard)] divide-y divide-[var(--space-border-hard)]">
                      <ToggleRow
                        icon={FileText}
                        checked={attachRecapPdf}
                        disabled={skipEmail}
                        onToggle={() => setAttachRecapPdf((v) => !v)}
                        title="Attach recap PDF"
                        hint="A one-page summary of the work this payment covers."
                      />
                      <ToggleRow
                        icon={ListChecks}
                        checked={includeWorkInEmail}
                        disabled={skipEmail}
                        onToggle={() => setIncludeWorkInEmail((v) => !v)}
                        title="Include work log in email"
                        hint="Itemizes the selected work inside the invoice email."
                      />
                      <ToggleRow
                        icon={MailX}
                        checked={skipEmail}
                        onToggle={() => setSkipEmail((v) => !v)}
                        title="Skip email"
                        hint="Creates the order and Stripe invoice without notifying the client."
                      />
                    </div>
                  )}
                </div>

                {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
              </>
            )}
          </div>

          {/* ── Footer send bar ── */}
          {!loading && model && recap && !outcome && (
            <div className="shrink-0 border-t border-[var(--space-border-hard)] px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-[0.6875rem] text-[var(--space-text-muted)]">
                {[
                  `1 ${fulfilling ? 'fulfillment' : 'invoice'} · ${fmt(entry.amount)}`,
                  selected.size > 0 ? `${selected.size} work line${selected.size === 1 ? '' : 's'}` : null,
                  fulfilling ? 'no invoice · no email' : skipEmail ? 'no email' : null,
                ].filter(Boolean).join(' · ')}
              </p>
              <button onClick={handleSend} disabled={sending} className={accentBtn}>
                {sending
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : fulfilling
                  ? <PackageCheck className="size-3.5" />
                  : <Send className="size-3.5" />}
                {sending
                  ? fulfilling ? 'Fulfilling…' : 'Sending…'
                  : fulfilling ? 'Fulfill payment' : skipEmail ? 'Create invoice' : 'Send invoice'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** One half of the delivery mode switch — invoice vs fulfill. */
function ModeTab({
  icon: Icon, active, onClick, label, hint,
}: {
  icon: typeof Send
  active: boolean
  onClick: () => void
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all',
        active
          ? 'bg-[var(--space-bg-base)] text-[var(--space-text-primary)]'
          : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)]',
      )}
    >
      <Icon className="size-3.5 shrink-0" style={active ? { color: 'var(--space-accent)' } : undefined} />
      <span className="min-w-0">
        <span className="block text-xs font-semibold truncate">{label}</span>
        <span className="block text-[0.625rem] text-[var(--space-text-muted)] truncate">{hint}</span>
      </span>
    </button>
  )
}

function ToggleRow({
  icon: Icon, checked, onToggle, title, hint, disabled,
}: {
  icon: typeof FileText
  checked: boolean
  onToggle: () => void
  title: string
  hint: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--space-bg-card-hover)]',
      )}
    >
      {checked
        ? <CircleCheck className="size-4 shrink-0" style={{ color: 'var(--space-accent)' }} />
        : <Circle className="size-4 shrink-0 text-[var(--space-text-muted)]" />}
      <Icon className="size-3.5 shrink-0 text-[var(--space-text-muted)]" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--space-text-primary)]">{title}</p>
        <p className="text-[0.625rem] text-[var(--space-text-muted)] mt-0.5">{hint}</p>
      </div>
    </button>
  )
}
