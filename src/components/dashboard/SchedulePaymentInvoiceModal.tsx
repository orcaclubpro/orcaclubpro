'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Loader2, X, Send, CircleCheck, Circle, ArrowRight, AlertTriangle, Check,
  CalendarDays, FileText, ListChecks, MailX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPackageRecapModel } from '@/actions/packageWork'
import { sendScheduledPayment } from '@/actions/packages'
import type { PackageRecapData } from '@/lib/packages/recap'

// ── Shared styles (verbatim from RetainerInvoiceModal) ────────────────────────
const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const areaCls = cn(inputCls, 'py-2 resize-none')
const accentBtn =
  'flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50'
const ghostBtn =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-all disabled:opacity-50'
const labelCls = 'text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]'

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
  packageId, packageName, entry, recapDraft, onRecapChange, onClose, onSent,
}: SchedulePaymentInvoiceModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<PackageRecapData | null>(null)
  const [workLines, setWorkLines] = useState<WorkLineRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [recap, setRecap] = useState<PackageRecapData | null>(null)

  const [attachRecapPdf, setAttachRecapPdf] = useState(true)
  const [includeWorkInEmail, setIncludeWorkInEmail] = useState(true)
  const [skipEmail, setSkipEmail] = useState(false)

  const [sending, setSending] = useState(false)
  const [outcome, setOutcome] = useState<SendOutcome | null>(null)

  // The draft is a seed, not a controlled value — re-seeding on every parent keystroke
  // would fight the local editor state.
  const draftSeed = useRef(recapDraft)

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

  async function handleSend() {
    setError(null)
    setSending(true)
    const result = await sendScheduledPayment(packageId, entry.id, undefined, {
      skipEmail,
      workLineIds: [...selected],
      recap: recap ?? undefined,
      attachRecapPdf: !skipEmail && attachRecapPdf,
      includeWorkInEmail: !skipEmail && includeWorkInEmail,
    })
    setSending(false)

    if (result.success) {
      const count = selected.size
      setOutcome({
        ok: true,
        url: result.invoiceUrl ?? null,
        msg: `Invoice ${result.orderNumber ? `#${result.orderNumber} ` : ''}— ${fmt(entry.amount)}${
          count > 0 ? ` · ${count} work line${count === 1 ? '' : 's'}` : ''
        }${skipEmail ? ' created, no email sent' : ' created and emailed'}`,
      })
      onSent()
    } else {
      setError(result.error ?? 'Failed to send this payment')
    }
  }

  const due = fmtDay(entry.dueDate)
  const dueDays = daysUntilDue(entry.dueDate)

  return (
    <div className="fixed inset-0 z-[80] print:hidden">
      <div
        className="absolute inset-0 animate-in fade-in duration-150"
        style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-3 bottom-3 -translate-x-1/2 w-full px-3 max-w-[37.5rem]">
        <div
          className="flex flex-col h-full overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
          style={{ background: 'var(--space-bg-card)', border: '1px solid var(--space-border-hard)' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--space-border-hard)] shrink-0">
            <span className="text-sm font-semibold text-[var(--space-text-primary)]">Send scheduled payment</span>
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
                      <p className="text-xs font-semibold text-[var(--space-text-primary)]">Work on this invoice</p>
                      <p className="text-[0.625rem] text-[var(--space-text-muted)] mt-0.5">
                        Attached as $0 lines — the payment above carries the price.
                      </p>
                    </div>
                    {workLines.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelected(allSelected ? new Set() : new Set(workLines.map((l) => l.entryId)))}
                        className={cn(ghostBtn, 'shrink-0')}
                      >
                        {allSelected ? 'Select none' : 'Select all'}
                      </button>
                    )}
                  </div>
                  {workLines.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-[var(--space-text-muted)]">
                      No unbilled work logged for this package.
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

                {/* ── ③ Recap narrative ── */}
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

                {/* ── ④ Delivery ── */}
                <div className="rounded-xl border border-[var(--space-border-hard)] divide-y divide-[var(--space-border-hard)]">
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

                {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
              </>
            )}
          </div>

          {/* ── Footer send bar ── */}
          {!loading && model && recap && !outcome && (
            <div className="shrink-0 border-t border-[var(--space-border-hard)] px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-[0.6875rem] text-[var(--space-text-muted)]">
                {[
                  `1 invoice · ${fmt(entry.amount)}`,
                  selected.size > 0 ? `${selected.size} work line${selected.size === 1 ? '' : 's'}` : null,
                  skipEmail ? 'no email' : null,
                ].filter(Boolean).join(' · ')}
              </p>
              <button onClick={handleSend} disabled={sending} className={accentBtn}>
                {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                {sending ? 'Sending…' : skipEmail ? 'Create invoice' : 'Send invoice'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
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
