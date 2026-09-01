'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, X, Plus, Trash2, FileDown, Lock, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPackageRecapModel } from '@/actions/packageWork'
import type { PackageRecapData } from '@/lib/packages/recap'

// ── Shared styles (verbatim from RetainerRecapModal) ──────────────────────────
const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const areaCls = cn(inputCls, 'py-2 resize-none')
const accentBtn =
  'flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50'
const ghostBtn =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-all disabled:opacity-50'
const labelCls = 'text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]'
const sectionLabel =
  'text-[0.5625rem] font-bold tracking-[0.25em] uppercase text-[var(--space-accent)]'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0)
}

function fmtDay(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (!isFinite(d.getTime())) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(d)
}

export interface PackageRecapModalProps {
  packageId: string
  packageName: string
  /** The schedule entry this recap covers. */
  entryId: string
  entryLabel: string
  onClose: () => void
  /** Previously composed state for THIS entry — resumes the draft instead of re-deriving. */
  draft?: PackageRecapData | null
  /** Reports every edit up so the narrative survives closing and can ride along on the invoice email. */
  onDraftChange?: (model: PackageRecapData) => void
  /**
   * Hand off to the send flow. This composer never sends anything itself — the parent
   * closes it and opens SchedulePaymentInvoiceModal for the same entry, which picks the
   * lifted draft back up. Omit to render no send affordance.
   */
  onSendInvoice?: () => void
}

/**
 * Standalone recap composer for one scheduled package payment — the package analog of
 * RetainerRecapModal.
 *
 * Only narrative text is editable here. Amounts, hours, the work items in each bucket and
 * the remaining list are server-derived and shown read-only: the PDF route re-derives them
 * and `mergePackageRecap` discards anything a client sends for those fields.
 */
export function PackageRecapModal({
  packageId, packageName, entryId, entryLabel, onClose, draft, onDraftChange, onSendInvoice,
}: PackageRecapModalProps) {
  const [loading, setLoading] = useState(!draft)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<PackageRecapData | null>(draft ?? null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (draft) return // resume the lifted draft — no re-derive
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      const r = await getPackageRecapModel(packageId, entryId)
      if (!alive) return
      if (r.success) setModel(r.model)
      else setError(r.error ?? 'Failed to build recap')
      setLoading(false)
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, entryId])

  // Lift every edit (and the initial derived model) to the parent.
  useEffect(() => {
    if (model) onDraftChange?.(model)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model])

  // Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const patch = useCallback((p: Partial<PackageRecapData>) => {
    setModel((m) => (m ? { ...m, ...p } : m))
  }, [])

  async function handleGenerate() {
    if (!model) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/packages/${packageId}/recap/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, recap: model }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'PDF generation failed')
      }
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const due = model ? fmtDay(model.paymentDueDate) : null

  return (
    <div className="fixed inset-0 z-[80] print:hidden">
      <div className="absolute inset-0 animate-in fade-in duration-150" style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div className="absolute left-1/2 -translate-x-1/2 top-3 bottom-3 w-full px-3 max-w-[47.5rem]">
        <div
          className="flex flex-col h-full overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
          style={{ background: 'var(--space-bg-card)', border: '1px solid var(--space-border-hard)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--space-border-hard)] shrink-0">
            <span className="text-sm font-semibold text-[var(--space-text-primary)]">Payment Recap</span>
            <span className="text-xs text-[var(--space-text-muted)] truncate">
              {packageName} · {entryLabel}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {onSendInvoice && (
                <button
                  onClick={onSendInvoice}
                  disabled={!model}
                  className={ghostBtn}
                  title="Carry this narrative into the invoice send flow"
                >
                  <Send className="size-3.5" /> Send invoice
                </button>
              )}
              <button onClick={handleGenerate} disabled={generating || !model} className={accentBtn}>
                {generating ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
                Generate PDF
              </button>
              <button onClick={onClose} aria-label="Close" className="size-8 rounded-lg border border-[var(--space-border-hard)] flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] transition-colors">
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="size-5 text-[var(--space-text-muted)] animate-spin" /></div>
            ) : !model ? (
              <div className="py-20 text-center text-sm text-[var(--space-text-muted)]">{error ?? 'This payment could not be recapped.'}</div>
            ) : (
              <div className="max-w-xl mx-auto w-full space-y-7">
                {/* This payment — server-derived */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className={sectionLabel}>This payment</p>
                    <DerivedTag />
                  </div>
                  <div className="rounded-lg border border-[var(--space-border-hard)] px-3 py-2.5 bg-[var(--space-bg-card-hover)] space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--space-text-primary)] truncate">{model.paymentLabel || entryLabel}</p>
                        <p className="text-[0.625rem] text-[var(--space-text-muted)] mt-0.5">{model.paymentPosition}</p>
                      </div>
                      <span className="text-lg font-semibold tabular-nums text-[var(--space-text-primary)] shrink-0">{fmt(model.paymentAmount)}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-[0.625rem] text-[var(--space-text-muted)]">
                      <span>{due ? `Due ${due}` : 'No due date'}</span>
                      <span className="tabular-nums">{fmt(model.amountPaid)} paid of {fmt(model.packageTotal)}</span>
                      <span className="tabular-nums">{fmt(model.amountRemaining)} remaining</span>
                    </div>
                  </div>
                </section>

                {/* At a glance */}
                <section className="space-y-3">
                  <p className={sectionLabel}>At a glance</p>
                  <div>
                    <label className={labelCls}>Headline</label>
                    <input value={model.headline} onChange={(e) => patch({ headline: e.target.value })} className={cn(inputCls, 'mt-1.5')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-[var(--space-text-tertiary)]">
                    <div className="rounded-lg border border-[var(--space-border-hard)] px-3 py-2 bg-[var(--space-bg-card-hover)]">
                      <span className={labelCls}>Items shipped</span>
                      <p className="text-sm font-semibold tabular-nums text-[var(--space-text-primary)] mt-1">{model.itemsShipped}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--space-border-hard)] px-3 py-2 bg-[var(--space-bg-card-hover)]">
                      <span className={labelCls}>Hours logged</span>
                      <p className="text-sm font-semibold tabular-nums text-[var(--space-text-primary)] mt-1">{model.totalHours}</p>
                    </div>
                  </div>
                </section>

                {/* What this payment covers */}
                <section className="space-y-3">
                  <p className={sectionLabel}>What this payment covers</p>
                  <div>
                    <label className={labelCls}>Section headline (optional)</label>
                    <textarea
                      value={model.accomplishedHeadline} rows={2}
                      onChange={(e) => patch({ accomplishedHeadline: e.target.value })}
                      placeholder="A sentence framing the work delivered…"
                      className={cn(areaCls, 'mt-1.5 text-xs')}
                    />
                  </div>
                  {model.buckets.length === 0 ? (
                    <p className="text-xs text-[var(--space-text-muted)]">No unbilled work logged for this package.</p>
                  ) : model.buckets.map((b, i) => (
                    <div key={i} className="rounded-lg border border-[var(--space-border-hard)] p-3 space-y-2 bg-[var(--space-bg-card-hover)]">
                      <div className="flex items-center gap-2">
                        <input
                          value={b.label}
                          onChange={(e) => patch({ buckets: model.buckets.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })}
                          className={cn(inputCls, 'flex-1 py-1.5 text-xs font-semibold')}
                        />
                        <span className="text-xs font-bold tabular-nums text-[var(--space-text-primary)] shrink-0 w-14 text-right">{b.hours}h</span>
                      </div>
                      <textarea
                        value={b.note} rows={2}
                        onChange={(e) => patch({ buckets: model.buckets.map((x, j) => j === i ? { ...x, note: e.target.value } : x) })}
                        placeholder={`A note about the ${(b.label || 'work').toLowerCase()} in this payment…`}
                        className={cn(areaCls, 'text-xs')}
                      />
                      {/* Work items — server-derived, read-only */}
                      <div className="pt-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={labelCls}>
                            {b.items.length} item{b.items.length === 1 ? '' : 's'}
                          </span>
                          <DerivedTag />
                        </div>
                        <ul className="space-y-0.5">
                          {b.items.map((it, k) => (
                            <li key={k} className="flex items-start gap-2 text-[0.625rem] text-[var(--space-text-muted)]">
                              <span className="tabular-nums shrink-0 w-[5.375rem]">{fmtDay(it.date) ?? '—'}</span>
                              <span className="flex-1 min-w-0 text-[var(--space-text-tertiary)]">{it.description}</span>
                              <span className="tabular-nums shrink-0">{it.hours != null ? `${it.hours}h` : '—'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </section>

                {/* What's left */}
                <section className="space-y-3">
                  <p className={sectionLabel}>What&apos;s left</p>
                  <div>
                    <label className={labelCls}>Section headline (optional)</label>
                    <textarea
                      value={model.remainingHeadline} rows={2}
                      onChange={(e) => patch({ remainingHeadline: e.target.value })}
                      placeholder="A sentence framing the remaining scope…"
                      className={cn(areaCls, 'mt-1.5 text-xs')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={labelCls}>Remaining scope &amp; payments</span>
                    <DerivedTag />
                  </div>
                  {model.remaining.length === 0 ? (
                    <p className="text-xs text-[var(--space-text-muted)]">Nothing outstanding — this is the last payment and no planned work is open.</p>
                  ) : (
                    <ul className="rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] divide-y divide-[var(--space-border-hard)]">
                      {model.remaining.map((r, i) => (
                        <li key={i} className="flex items-center gap-3 px-3 py-2">
                          <span className="text-[0.5625rem] font-bold tracking-widest uppercase text-[var(--space-text-muted)] shrink-0 w-14">
                            {r.kind === 'payment' ? 'Payment' : 'Planned'}
                          </span>
                          <span className="flex-1 min-w-0 text-xs text-[var(--space-text-tertiary)] truncate">{r.label}</span>
                          {r.dueDate && (
                            <span className="text-[0.625rem] tabular-nums text-[var(--space-text-muted)] shrink-0">{fmtDay(r.dueDate)}</span>
                          )}
                          {r.amount != null && (
                            <span className="text-xs font-semibold tabular-nums text-[var(--space-text-primary)] shrink-0">{fmt(r.amount)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Notes */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StringList label="Notes" items={model.notes} onChange={(v) => patch({ notes: v })} placeholder="A note for the client" />
                  <StringList label="Next steps" items={model.nextSteps} onChange={(v) => patch({ nextSteps: v })} placeholder="A next step" />
                </section>

                {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Marks a block as server-derived, not editable ───────────────────────────────
function DerivedTag() {
  return (
    <span className="inline-flex items-center gap-1 text-[0.5625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)] border border-[var(--space-border-hard)] rounded px-1.5 py-0.5">
      <Lock className="size-2.5" /> Derived
    </span>
  )
}

// ── Editable list of plain strings ──────────────────────────────────────────────
function StringList({
  label, items, onChange, placeholder,
}: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      {items.map((x, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={x} onChange={(e) => onChange(items.map((v, j) => j === i ? e.target.value : v))} placeholder={placeholder} className={cn(inputCls, 'flex-1 py-1.5 text-xs')} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="size-7 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 transition-colors shrink-0"><Trash2 className="size-3.5" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])} className={ghostBtn}><Plus className="size-3.5" /> Add</button>
    </div>
  )
}
