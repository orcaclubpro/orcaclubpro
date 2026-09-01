'use client'

import { useState, useEffect } from 'react'
import {
  Loader2, X, Send, CircleCheck, Circle, ExternalLink, FileDown, FileText,
  Pencil, AlertTriangle, Check, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRetainerBillingModel, sendRetainerInvoice, sendRetainerRecapEmail } from '@/actions/retainers'
import type { RecapData } from '@/lib/retainers/recap'

// ── Shared styles (aligned with RetainerTab / RetainerRecapModal) ─────────────
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
const labelCls = 'text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0)
}
function round2(n: number) {
  return Math.round((n || 0) * 100) / 100
}
function parseEmails(s: string): string[] {
  return [...new Set(s.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean))]
}

// Billing model shape (mirrors getRetainerBillingModel's success payload).
interface BillingSide {
  cycleStart: string; cycleLabel: string; monthLabel: string
  tier: string; tierLabel: string; hoursPerMonth: number; monthlyFee: number
  invoice: { orderId: string; orderNumber: string; status: string; amount: number; stripeInvoiceUrl: string | null; createdAt: string } | null
}
interface BillingModel {
  retainerId: string
  client: { name: string; company: string | null; email: string | null } | null
  current: BillingSide
  currentUsage: { hoursUsed: number; overageHours: number; overageRate: number; overageAmount: number; loggedCount: number }
  next: BillingSide
  nextPlanned: string[]
  /** Billing a closed cycle after the fact — current and next are the same cycle. */
  arrears?: boolean
}

export interface RetainerInvoiceModalProps {
  retainerId: string
  clientId: string
  /** The viewed cycle's start ISO — the month being closed. */
  cycleRef: string
  /** Staff-composed recap for the viewed cycle (parent filters by cycleStart), or null. */
  recapDraft: RecapData | null
  onComposeRecap: () => void
  onClose: () => void
  /** Called after any successful send so the parent reloads the summary. */
  onSent: () => void
}

interface SendOutcome {
  invoice?: { ok: boolean; msg: string; url?: string }
  recap?: { ok: boolean; msg: string }
}

// ─── Cycle close: bill next month + recap this month, as two emails ───────────
export function RetainerInvoiceModal({
  retainerId, clientId, cycleRef, recapDraft, onComposeRecap, onClose, onSent,
}: RetainerInvoiceModalProps) {
  const [loading, setLoading] = useState(true)
  const [model, setModel] = useState<BillingModel | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Invoice (next month) ──────────────────────────────────────────────────────
  const [invoiceOn, setInvoiceOn] = useState(true)
  const [feeStr, setFeeStr] = useState('')
  const [oHrsStr, setOHrsStr] = useState('')
  const [oRateStr, setORateStr] = useState('')
  const [totalStr, setTotalStr] = useState('')
  const [dueDaysStr, setDueDaysStr] = useState('30')
  const [includePlanned, setIncludePlanned] = useState(true)
  // Itemize the closing cycle's hours on the billing package + order. On by default:
  // it is what lets a client match the month's fee to the work behind it.
  const [includeWorkLog, setIncludeWorkLog] = useState(true)
  const [invoiceTo, setInvoiceTo] = useState('')
  const [invoiceMsg, setInvoiceMsg] = useState('')
  const [forceInvoice, setForceInvoice] = useState(false)

  // ── Recap & hours (this month) ────────────────────────────────────────────────
  const [recapOn, setRecapOn] = useState(true)
  const [attachStatement, setAttachStatement] = useState(true)
  const [attachRecap, setAttachRecap] = useState(true)
  const [recapTo, setRecapTo] = useState('')
  const [recapMsg, setRecapMsg] = useState('')

  const [sending, setSending] = useState(false)
  const [outcome, setOutcome] = useState<SendOutcome | null>(null)

  // Load current + next cycle facts once.
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      const r = await getRetainerBillingModel(clientId, cycleRef)
      if (!alive) return
      if (r.success) {
        const m = r as unknown as BillingModel
        setModel(m)
        setFeeStr(String(m.next.monthlyFee ?? 0))
        setOHrsStr(String(m.currentUsage.overageHours ?? 0))
        setORateStr(String(m.currentUsage.overageRate ?? 65))
        const email = m.client?.email ?? ''
        setInvoiceTo(email)
        setRecapTo(email)
        setInvoiceOn(!m.next.invoice) // already billed → default off (recap still on)
      } else {
        setError(r.error ?? 'Failed to load billing model')
      }
      setLoading(false)
    })()
    return () => { alive = false }
  }, [clientId, cycleRef])

  const fee = round2(parseFloat(feeStr) || 0)
  const oHrs = round2(parseFloat(oHrsStr) || 0)
  const oRate = round2(parseFloat(oRateStr) || 0)
  const overageAmount = round2(oHrs * oRate)
  const computedTotal = round2(fee + overageAmount)
  const overridden = totalStr.trim() !== '' && round2(parseFloat(totalStr) || 0) !== computedTotal
  const total = totalStr.trim() === '' ? computedTotal : round2(parseFloat(totalStr) || 0)

  const nextInvoice = model?.next.invoice ?? null
  const invoiceBlocked = Boolean(nextInvoice) && !forceInvoice

  async function handleSend() {
    if (!model) return
    setError(null)
    const doInvoice = invoiceOn && !invoiceBlocked
    if (!doInvoice && !recapOn) { setError('Turn on at least one email to send'); return }
    if (doInvoice) {
      if (!(total > 0)) { setError('Invoice amount must be greater than zero'); return }
      if (parseEmails(invoiceTo).length === 0) { setError('Add at least one invoice recipient'); return }
    }
    if (recapOn && parseEmails(recapTo).length === 0) { setError('Add at least one recap recipient'); return }

    setSending(true)
    const result: SendOutcome = {}

    if (doInvoice) {
      const r = await sendRetainerInvoice({
        retainerId,
        clientAccountId: clientId,
        ref: model.next.cycleStart,
        baseFee: fee,
        overageHours: oHrs,
        overageRate: oRate,
        totalOverride: overridden ? total : undefined,
        daysUntilDue: Math.max(1, parseInt(dueDaysStr, 10) || 30),
        recipients: parseEmails(invoiceTo),
        message: invoiceMsg.trim() || undefined,
        plannedWork: includePlanned ? model.nextPlanned : [],
        includeWorkLog,
        force: forceInvoice || undefined,
      })
      result.invoice = r.success
        ? {
            ok: true,
            url: r.hostedInvoiceUrl,
            msg: `Invoice #${r.orderNumber} — ${fmt(r.total)}${r.emailSent ? ` emailed to ${r.recipients.join(', ')}` : ' created, but the email failed'}`,
          }
        : { ok: false, msg: r.error ?? 'Invoice failed' }
    }

    if (recapOn) {
      const r = await sendRetainerRecapEmail({
        clientAccountId: clientId,
        ref: model.current.cycleStart,
        recipients: parseEmails(recapTo),
        message: recapMsg.trim() || undefined,
        attachStatement,
        attachRecap,
        recap: attachRecap && recapDraft ? recapDraft : undefined,
      })
      result.recap = r.success
        ? { ok: true, msg: `Recap & hours emailed to ${r.recipients.join(', ')}${r.attachmentCount ? ` (${r.attachmentCount} attachment${r.attachmentCount === 1 ? '' : 's'})` : ''}` }
        : { ok: false, msg: r.error ?? 'Recap email failed' }
    }

    setSending(false)
    setOutcome(result)
    if (result.invoice?.ok || result.recap?.ok) onSent()
  }

  const anyOk = outcome && (outcome.invoice?.ok || outcome.recap?.ok)

  return (
    <div className="fixed inset-0 z-[80] print:hidden">
      <div className="absolute inset-0 animate-in fade-in duration-150" style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div className="absolute left-1/2 top-3 bottom-3 -translate-x-1/2 w-full px-3 max-w-[37.5rem]">
        <div
          className="flex flex-col h-full overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
          style={{ background: 'var(--space-bg-card)', border: '1px solid var(--space-border-hard)' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--space-border-hard)] shrink-0">
            <span className="text-sm font-semibold text-[var(--space-text-primary)]">Send retainer billing</span>
            {model && (
              <span className="text-xs text-[var(--space-text-muted)] truncate">
                {(model.client?.company || model.client?.name)} · {model.arrears ? `billing ${model.current.monthLabel} in arrears — the plan has ended` : `closing ${model.current.monthLabel} → billing ${model.next.monthLabel}`}
              </span>
            )}
            <button onClick={onClose} aria-label="Close" className="ml-auto size-8 rounded-lg border border-[var(--space-border-hard)] flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] transition-colors shrink-0">
              <X className="size-3.5" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="size-5 text-[var(--space-text-muted)] animate-spin" /></div>
            ) : !model ? (
              <div className="py-20 text-center text-sm text-[var(--space-text-muted)]">{error ?? 'No active retainer cycle to bill.'}</div>
            ) : outcome ? (
              /* ── Result ── */
              <div className="py-4 space-y-4">
                <div className="mx-auto size-11 rounded-full flex items-center justify-center" style={{ background: anyOk ? 'var(--space-accent-soft)' : 'rgba(245,158,11,0.12)' }}>
                  {anyOk ? <Check className="size-5" style={{ color: 'var(--space-accent)' }} /> : <AlertTriangle className="size-5 text-amber-500" />}
                </div>
                <div className="space-y-2">
                  {outcome.invoice && (
                    <ResultLine ok={outcome.invoice.ok} msg={outcome.invoice.msg} url={outcome.invoice.url} label="Invoice" />
                  )}
                  {outcome.recap && (
                    <ResultLine ok={outcome.recap.ok} msg={outcome.recap.msg} label="Recap & hours" />
                  )}
                </div>
                <div className="flex justify-center pt-2">
                  <button onClick={onClose} className={accentBtn}>Done</button>
                </div>
              </div>
            ) : (
              <>
                {/* ── ① Invoice — next month ── */}
                <SectionCard
                  on={invoiceOn}
                  onToggle={() => setInvoiceOn((v) => !v)}
                  title={`Invoice — ${model.next.monthLabel}`}
                  subtitle={`Next month's retainer, billed ahead${overageAmount > 0 ? ` + ${model.current.monthLabel} overage` : ''}`}
                >
                  {nextInvoice && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5">
                      <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.6875rem] text-[var(--space-text-tertiary)] leading-relaxed">
                          {model.next.monthLabel} is already invoiced — <span className="font-semibold text-[var(--space-text-primary)]">#{nextInvoice.orderNumber}</span> · {fmt(nextInvoice.amount)} · {nextInvoice.status}.
                          {!forceInvoice && ' Billing again creates a second invoice.'}
                        </p>
                        {nextInvoice.stripeInvoiceUrl && (
                          <a href={nextInvoice.stripeInvoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-[var(--space-accent)] hover:underline mt-1">
                            <ExternalLink className="size-3" /> View invoice
                          </a>
                        )}
                      </div>
                      {!forceInvoice && (
                        <button onClick={() => { setForceInvoice(true); setInvoiceOn(true) }} className="shrink-0 text-[0.6875rem] font-semibold text-amber-500 hover:underline">
                          Bill again
                        </button>
                      )}
                    </div>
                  )}

                  {invoiceOn && !invoiceBlocked && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="block">
                          <span className={labelCls}>Base fee</span>
                          <input type="number" min={0} value={feeStr} onChange={(e) => setFeeStr(e.target.value)} className={cn(numCls, 'mt-1')} />
                        </label>
                        <label className="block">
                          <span className={labelCls}>{model.current.monthLabel} overage hrs</span>
                          <input type="number" min={0} step="0.25" value={oHrsStr} onChange={(e) => setOHrsStr(e.target.value)} className={cn(numCls, 'mt-1')} />
                        </label>
                        <label className="block">
                          <span className={labelCls}>Overage $/hr</span>
                          <input type="number" min={0} value={oRateStr} onChange={(e) => setORateStr(e.target.value)} className={cn(numCls, 'mt-1')} />
                        </label>
                      </div>

                      {/* Line preview */}
                      <div className="rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] divide-y divide-[var(--space-border-hard)] text-xs">
                        {overridden ? (
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-[var(--space-text-secondary)] truncate">{model.next.monthLabel} Retainer — {model.next.tierLabel}</span>
                            <span className="font-semibold tabular-nums text-[var(--space-text-primary)] shrink-0">{fmt(total)}</span>
                          </div>
                        ) : (
                          <>
                            {fee > 0 && (
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--space-text-secondary)] truncate">{model.next.monthLabel} Retainer — {model.next.tierLabel} ({model.next.hoursPerMonth} hrs/mo)</span>
                                <span className="font-semibold tabular-nums text-[var(--space-text-primary)] shrink-0">{fmt(fee)}</span>
                              </div>
                            )}
                            {overageAmount > 0 && (
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--space-text-secondary)] truncate">{model.current.monthLabel} overage — {oHrs} hrs × ${oRate}/hr</span>
                                <span className="font-semibold tabular-nums text-[var(--space-text-primary)] shrink-0">{fmt(overageAmount)}</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex items-center justify-between gap-3 px-3 py-2">
                          <span className="font-semibold text-[var(--space-text-primary)]">Total</span>
                          <div className="flex items-center gap-2">
                            {overridden && <span className="text-[0.625rem] text-[var(--space-text-muted)] line-through tabular-nums">{fmt(computedTotal)}</span>}
                            <input type="number" min={0} value={totalStr} onChange={(e) => setTotalStr(e.target.value)} placeholder={String(computedTotal)} title="Override the total" className={cn(numCls, 'w-28 py-1.5 text-right font-semibold')} />
                          </div>
                        </div>
                      </div>

                      {/* The month that just closed, itemized on the invoice + package —
                          the client's record of what the fee bought. */}
                      {model.currentUsage.loggedCount > 0 && (
                        <button type="button" onClick={() => setIncludeWorkLog((v) => !v)} className="w-full flex items-center gap-2 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-3 py-2 text-left">
                          {includeWorkLog ? <CircleCheck className="size-4 shrink-0" style={{ color: 'var(--space-accent)' }} /> : <Circle className="size-4 shrink-0 text-[var(--space-text-muted)]" />}
                          <span className="text-xs text-[var(--space-text-secondary)]">
                            Itemize {model.currentUsage.loggedCount} logged {model.currentUsage.loggedCount === 1 ? 'entry' : 'entries'} from {model.current.monthLabel}
                            <span className="block text-[10px] text-[var(--space-text-muted)]">Dated work log on the invoice and the client&apos;s package. Doesn&apos;t change the total.</span>
                          </span>
                        </button>
                      )}

                      {/* Planned work — meaningless on a closed cycle, whose drafts are
                          unfinished work rather than a plan for the month ahead. */}
                      {model.nextPlanned.length > 0 && !model.arrears && (
                        <button type="button" onClick={() => setIncludePlanned((v) => !v)} className="w-full flex items-center gap-2 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-3 py-2 text-left">
                          {includePlanned ? <CircleCheck className="size-4 shrink-0" style={{ color: 'var(--space-accent)' }} /> : <Circle className="size-4 shrink-0 text-[var(--space-text-muted)]" />}
                          <span className="text-xs text-[var(--space-text-secondary)]">List {model.nextPlanned.length} planned item{model.nextPlanned.length === 1 ? '' : 's'} for {model.next.monthLabel} in the email</span>
                        </button>
                      )}

                      <RecipientsField label="Invoice to" value={invoiceTo} onChange={setInvoiceTo} />
                      <label className="block">
                        <span className={labelCls}>Message (optional)</span>
                        <textarea value={invoiceMsg} onChange={(e) => setInvoiceMsg(e.target.value)} rows={2} placeholder={`A note above the invoice — e.g. "Thanks for a great ${model.current.monthLabel}."`} className={cn(areaCls, 'mt-1 text-xs')} />
                      </label>
                      <label className="block w-28">
                        <span className={labelCls}>Due in (days)</span>
                        <input type="number" min={1} value={dueDaysStr} onChange={(e) => setDueDaysStr(e.target.value)} className={cn(numCls, 'mt-1')} />
                      </label>
                    </>
                  )}
                </SectionCard>

                {/* ── ② Recap & hours — this month ── */}
                <SectionCard
                  on={recapOn}
                  onToggle={() => setRecapOn((v) => !v)}
                  title={`Recap & hours — ${model.current.monthLabel}`}
                  subtitle={`${model.currentUsage.hoursUsed}/${model.current.hoursPerMonth} hrs · ${model.currentUsage.loggedCount} logged${model.currentUsage.overageHours > 0 ? ` · ${model.currentUsage.overageHours}h over` : ''}`}
                >
                  {recapOn && (
                    <>
                      <AttachRow icon={FileDown} checked={attachStatement} onToggle={() => setAttachStatement((v) => !v)} title="Hour log statement" hint={`Line-item PDF of ${model.current.cycleLabel}.`} />
                      <AttachRow
                        icon={FileText}
                        checked={attachRecap}
                        onToggle={() => setAttachRecap((v) => !v)}
                        title="Monthly recap"
                        hint={recapDraft ? 'Composed ✓ — your edited narrative will be attached.' : 'Not composed — attaches derived numbers with blank narrative.'}
                        action={<button type="button" onClick={onComposeRecap} className={cn(ghostBtn, 'shrink-0')}><Pencil className="size-3" /> {recapDraft ? 'Edit' : 'Compose'}</button>}
                      />
                      <RecipientsField label="Recap to" value={recapTo} onChange={setRecapTo} />
                      <label className="block">
                        <span className={labelCls}>Message (optional)</span>
                        <textarea value={recapMsg} onChange={(e) => setRecapMsg(e.target.value)} rows={2} placeholder="A note above the recap summary…" className={cn(areaCls, 'mt-1 text-xs')} />
                      </label>
                    </>
                  )}
                </SectionCard>

                {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
              </>
            )}
          </div>

          {/* ── Footer send bar ── */}
          {!loading && model && !outcome && (
            <div className="shrink-0 border-t border-[var(--space-border-hard)] px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-[0.6875rem] text-[var(--space-text-muted)]">
                {[invoiceOn && !invoiceBlocked ? '1 invoice' : null, recapOn ? '1 recap email' : null].filter(Boolean).join(' + ') || 'Nothing selected'}
              </p>
              <button onClick={handleSend} disabled={sending || (!(invoiceOn && !invoiceBlocked) && !recapOn)} className={accentBtn}>
                {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── A toggleable email section ──────────────────────────────────────────────────
function SectionCard({
  on, onToggle, title, subtitle, children,
}: { on: boolean; onToggle: () => void; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-xl border transition-colors', on ? 'border-[var(--space-border-hard)]' : 'border-[var(--space-border-hard)] opacity-70')}>
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {on ? <CircleCheck className="size-4 shrink-0" style={{ color: 'var(--space-accent)' }} /> : <Circle className="size-4 shrink-0 text-[var(--space-text-muted)]" />}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--space-text-primary)]">{title}</p>
          <p className="text-[0.625rem] text-[var(--space-text-muted)] mt-0.5 truncate">{subtitle}</p>
        </div>
      </button>
      {on && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

function RecipientsField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="name@company.com, cc@company.com" className={cn(inputCls, 'mt-1 text-xs')} />
      <span className="text-[0.625rem] text-[var(--space-text-muted)] mt-1 block">Comma-separated for multiple recipients.</span>
    </label>
  )
}

function AttachRow({
  icon: Icon, checked, onToggle, title, hint, action,
}: { icon: typeof FileText; checked: boolean; onToggle: () => void; title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-3 py-2.5">
      <button type="button" onClick={onToggle} className="shrink-0 size-5 flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-accent)] transition-colors">
        {checked ? <CircleCheck className="size-4" style={{ color: 'var(--space-accent)' }} /> : <Circle className="size-4" />}
      </button>
      <Icon className="size-3.5 shrink-0 text-[var(--space-text-muted)]" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--space-text-primary)]">{title}</p>
        <p className="text-[0.625rem] text-[var(--space-text-muted)] mt-0.5">{hint}</p>
      </div>
      {action}
    </div>
  )
}

function ResultLine({ ok, msg, url, label }: { ok: boolean; msg: string; url?: string; label: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-3 py-2.5">
      {ok ? <Check className="size-4 shrink-0 mt-0.5" style={{ color: 'var(--space-accent)' }} /> : <X className="size-4 shrink-0 mt-0.5 text-red-400" />}
      <div className="flex-1 min-w-0">
        <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">{label}</p>
        <p className="text-xs text-[var(--space-text-secondary)] mt-0.5">{msg}</p>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-[var(--space-accent)] hover:underline mt-1">
            View Stripe invoice <ArrowRight className="size-3" />
          </a>
        )}
      </div>
    </div>
  )
}
