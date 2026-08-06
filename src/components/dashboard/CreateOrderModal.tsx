'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, X, Send, CircleCheck, Circle, ArrowRight, Check, Plus, Trash2,
  MailX, Receipt, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClientOrder } from '@/actions/orders'

// ── Shared styles (verbatim from SchedulePaymentInvoiceModal / RetainerInvoiceModal) ──
const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const areaCls = cn(inputCls, 'py-2 resize-none')
const numCls = cn(
  inputCls,
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none tabular-nums',
)
const accentBtn =
  'flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50'
const ghostBtn =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-all disabled:opacity-50'
const labelCls = 'text-[10px] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0)
}
function round2(n: number) {
  return Math.round((n || 0) * 100) / 100
}

const INVOICE_TYPES = [
  { value: 'full', label: 'Full invoice' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'installment', label: 'Installment' },
  { value: 'balance', label: 'Balance payment' },
] as const

type InvoiceType = (typeof INVOICE_TYPES)[number]['value']

interface LineRow {
  key: string
  title: string
  description: string
  quantity: string
  price: string
}

let rowSeq = 0
function newRow(): LineRow {
  rowSeq += 1
  return { key: `line-${rowSeq}`, title: '', description: '', quantity: '1', price: '' }
}

interface Outcome {
  orderNumber?: string
  url?: string | null
  total: number
  emailed: boolean
  stripeCreated: boolean
  /** The link on the order came from the form, not from Stripe's hosted page. */
  customLink: boolean
  notice?: string
}

const URL_HINT = 'Enter a full URL starting with http:// or https://'

/** Mirrors the server-side check so the error lands next to the field, not after a round trip. */
function urlProblem(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  let parsed: URL | null = null
  try {
    parsed = new URL(v)
  } catch {
    return URL_HINT
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return URL_HINT
  return null
}

export interface CreateOrderModalProps {
  clientId: string
  clientName: string
  projectId?: string
  onClose: () => void
}

/**
 * Create a standalone invoice for one client — line items, a note, terms, and
 * whether the client hears about it. Every number is recomputed server-side;
 * this form only composes the request.
 */
export function CreateOrderModal({ clientId, clientName, projectId, onClose }: CreateOrderModalProps) {
  const router = useRouter()
  const [rows, setRows] = useState<LineRow[]>([newRow()])
  const [invoiceNote, setInvoiceNote] = useState('')
  const [dueDaysStr, setDueDaysStr] = useState('30')
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('full')
  const [skipEmail, setSkipEmail] = useState(false)
  const [createStripe, setCreateStripe] = useState(true)
  const [invoiceLink, setInvoiceLink] = useState('')
  const [linkTouched, setLinkTouched] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  // Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function patchRow(key: string, patch: Partial<LineRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }
  function addRow() {
    setRows((prev) => [...prev, newRow()])
  }
  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)))
  }

  const lineTotal = (r: LineRow) => round2((Number(r.price) || 0) * (Number(r.quantity) || 0))
  const total = round2(rows.reduce((sum, r) => sum + lineTotal(r), 0))

  const titledRows = rows.filter((r) => r.title.trim().length > 0)
  const dueDays = Math.max(1, Math.round(Number(dueDaysStr) || 0))
  const linkError = urlProblem(invoiceLink)
  const hasLink = invoiceLink.trim().length > 0 && !linkError
  const valid =
    titledRows.length > 0 && titledRows.length === rows.length && total > 0 && !linkError

  // With no Stripe invoice and no link there is nothing payable to email about —
  // the server skips the send in that case, so the UI says so up front.
  const willEmail = !skipEmail && (createStripe || hasLink)

  async function handleSubmit() {
    if (linkError) {
      setLinkTouched(true)
      return
    }
    setError(null)
    setSubmitting(true)
    const result = await createClientOrder({
      clientAccountId: clientId,
      lines: rows.map((r) => ({
        title: r.title.trim(),
        description: r.description.trim() || undefined,
        quantity: Number(r.quantity) || 1,
        price: Number(r.price) || 0,
      })),
      invoiceNote: invoiceNote.trim() || undefined,
      daysUntilDue: dueDays,
      invoiceType,
      projectId,
      skipEmail,
      createStripeInvoice: createStripe,
      invoiceUrl: invoiceLink.trim() || undefined,
    })
    setSubmitting(false)

    if (result.success) {
      setOutcome({
        orderNumber: result.orderNumber,
        url: result.invoiceUrl ?? null,
        total: result.total ?? total,
        emailed: result.emailed ?? false,
        stripeCreated: result.stripeInvoiceCreated ?? false,
        customLink: hasLink,
        notice: result.notice,
      })
      router.refresh()
    } else {
      // Keep the modal open on failure so nothing typed is lost.
      setError(result.error ?? 'Failed to create this order')
    }
  }

  return (
    <div className="fixed inset-0 z-[80] print:hidden">
      <div
        className="absolute inset-0 animate-in fade-in duration-150"
        style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-3 bottom-3 -translate-x-1/2 w-full px-3 max-w-[600px]">
        <div
          className="flex flex-col h-full overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
          style={{ background: 'var(--space-bg-card)', border: '1px solid var(--space-border-hard)' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--space-border-hard)] shrink-0">
            <span className="text-sm font-semibold text-[var(--space-text-primary)]">New order</span>
            <span className="text-xs text-[var(--space-text-muted)] truncate">{clientName}</span>
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
            {outcome ? (
              /* ── Result ── */
              <div className="py-4 space-y-4">
                <div
                  className="mx-auto size-11 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--space-accent-soft)' }}
                >
                  <Check className="size-5" style={{ color: 'var(--space-accent)' }} />
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-3 py-2.5">
                  <Check className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--space-accent)' }} />
                  <div className="flex-1 min-w-0">
                    <p className={labelCls}>{clientName}</p>
                    <p className="text-xs text-[var(--space-text-secondary)] mt-0.5">
                      {outcome.stripeCreated ? 'Invoice' : 'Order'}{' '}
                      {outcome.orderNumber ? `#${outcome.orderNumber} ` : ''}— {fmt(outcome.total)}
                      {outcome.stripeCreated ? ' created' : ' recorded'}
                      {outcome.emailed ? ' and emailed' : ', no email sent'}
                    </p>
                    {outcome.notice && (
                      <p className="text-[11px] text-[var(--space-text-muted)] mt-1">{outcome.notice}</p>
                    )}
                    {outcome.url && (
                      <a
                        href={outcome.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--space-accent)] hover:underline mt-1"
                      >
                        {outcome.customLink ? 'View invoice link' : 'View Stripe invoice'}{' '}
                        <ArrowRight className="size-3" />
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
                {/* ── ① Line items ── */}
                <div className="rounded-xl border border-[var(--space-border-hard)]">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--space-border-hard)]">
                    <Receipt className="size-3.5 shrink-0 text-[var(--space-text-muted)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--space-text-primary)]">Line items</p>
                      <p className="text-[10px] text-[var(--space-text-muted)] mt-0.5">
                        {createStripe
                          ? 'Each line appears on the Stripe invoice at price × quantity.'
                          : 'Each line is recorded on the order at price × quantity.'}
                      </p>
                    </div>
                    <button type="button" onClick={addRow} className={cn(ghostBtn, 'shrink-0')}>
                      <Plus className="size-3" /> Add line
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--space-border-hard)]">
                    {rows.map((row, idx) => (
                      <div key={row.key} className="px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(labelCls, 'shrink-0 tabular-nums')}>{idx + 1}</span>
                          <input
                            value={row.title}
                            onChange={(e) => patchRow(row.key, { title: e.target.value })}
                            placeholder="Line title (e.g. Discovery sprint)"
                            className={cn(inputCls, 'text-xs')}
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            disabled={rows.length <= 1}
                            aria-label="Remove line"
                            className="size-8 shrink-0 rounded-lg border border-[var(--space-border-hard)] flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <textarea
                          value={row.description}
                          onChange={(e) => patchRow(row.key, { description: e.target.value })}
                          rows={1}
                          placeholder="Description (optional)"
                          className={cn(areaCls, 'text-xs')}
                        />

                        <div className="flex items-end gap-2">
                          <label className="block w-20 shrink-0">
                            <span className={labelCls}>Qty</span>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={row.quantity}
                              onChange={(e) => patchRow(row.key, { quantity: e.target.value })}
                              className={cn(numCls, 'mt-1 text-xs py-1.5')}
                            />
                          </label>
                          <label className="block flex-1 min-w-0">
                            <span className={labelCls}>Unit price</span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.price}
                              onChange={(e) => patchRow(row.key, { price: e.target.value })}
                              placeholder="0.00"
                              className={cn(numCls, 'mt-1 text-xs py-1.5')}
                            />
                          </label>
                          <span className="text-xs tabular-nums text-[var(--space-text-secondary)] shrink-0 pb-2">
                            {fmt(lineTotal(row))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--space-border-hard)]">
                    <span className={labelCls}>Total</span>
                    <span className="text-lg font-semibold tabular-nums text-[var(--space-text-primary)]">
                      {fmt(total)}
                    </span>
                  </div>
                </div>

                {/* ── ② Invoice details ── */}
                <div className="rounded-xl border border-[var(--space-border-hard)] px-4 py-3 space-y-3">
                  <label className="block">
                    <span className={labelCls}>Invoice note</span>
                    <textarea
                      value={invoiceNote}
                      onChange={(e) => setInvoiceNote(e.target.value)}
                      rows={2}
                      placeholder="Shown on the invoice (e.g. “50% Deposit — Phase 1”)"
                      className={cn(areaCls, 'mt-1 text-xs')}
                    />
                  </label>

                  <div className="flex gap-3">
                    <label className="block w-28 shrink-0">
                      <span className={labelCls}>Due in (days)</span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={dueDaysStr}
                        onChange={(e) => setDueDaysStr(e.target.value)}
                        className={cn(numCls, 'mt-1 text-xs py-1.5')}
                      />
                    </label>
                    <label className="block flex-1 min-w-0">
                      <span className={labelCls}>Invoice type</span>
                      <select
                        value={invoiceType}
                        onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
                        className={cn(inputCls, 'mt-1 text-xs py-1.5')}
                      >
                        {INVOICE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* ── ③ Billing ── */}
                <div className="rounded-xl border border-[var(--space-border-hard)] divide-y divide-[var(--space-border-hard)]">
                  <ToggleRow
                    icon={CreditCard}
                    checked={createStripe}
                    onToggle={() => setCreateStripe((v) => !v)}
                    title="Create Stripe invoice"
                    hint={
                      createStripe
                        ? 'Bills through Stripe — the client gets a hosted payment page.'
                        : 'Off — the order is only recorded here (it still counts toward the balance). Nothing is charged through Stripe.'
                    }
                  />

                  <div className="px-4 py-3">
                    <label className="block">
                      <span className={labelCls}>
                        {createStripe ? 'Invoice link (optional override)' : 'Invoice link (optional)'}
                      </span>
                      <input
                        type="url"
                        inputMode="url"
                        value={invoiceLink}
                        onChange={(e) => setInvoiceLink(e.target.value)}
                        onBlur={() => setLinkTouched(true)}
                        placeholder="https://…"
                        className={cn(inputCls, 'mt-1 text-xs py-1.5')}
                      />
                    </label>
                    {linkTouched && linkError ? (
                      <p className="text-[10px] text-red-400 mt-1">{linkError}</p>
                    ) : (
                      <p className="text-[10px] text-[var(--space-text-muted)] mt-1">
                        {createStripe
                          ? 'Replaces the Stripe hosted payment link on this order — leave blank to use Stripe’s.'
                          : 'Where the client can pay or view the invoice you already sent. Leave blank to record the order with no link.'}
                      </p>
                    )}
                  </div>

                  <ToggleRow
                    icon={MailX}
                    checked={skipEmail}
                    onToggle={() => setSkipEmail((v) => !v)}
                    title="Skip email"
                    hint={
                      !skipEmail && !createStripe && !hasLink
                        ? 'No email will be sent anyway — there is no invoice link for the client to pay from.'
                        : createStripe
                          ? 'Creates the order and Stripe invoice without notifying the client.'
                          : 'Records the order without notifying the client.'
                    }
                  />
                </div>

                {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
              </>
            )}
          </div>

          {/* ── Footer send bar ── */}
          {!outcome && (
            <div className="shrink-0 border-t border-[var(--space-border-hard)] px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-[var(--space-text-muted)]">
                {[
                  `${rows.length} line${rows.length === 1 ? '' : 's'} · ${fmt(total)}`,
                  `net ${dueDays} day${dueDays === 1 ? '' : 's'}`,
                  createStripe ? null : 'no Stripe invoice',
                  willEmail ? null : 'no email',
                ].filter(Boolean).join(' · ')}
              </p>
              <button onClick={handleSubmit} disabled={submitting || !valid} className={accentBtn}>
                {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                {submitting
                  ? createStripe ? 'Creating…' : 'Recording…'
                  : createStripe
                    ? willEmail ? 'Create & send' : 'Create invoice'
                    : willEmail ? 'Record & send' : 'Record order'}
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
  icon: typeof MailX
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
        <p className="text-[10px] text-[var(--space-text-muted)] mt-0.5">{hint}</p>
      </div>
    </button>
  )
}
