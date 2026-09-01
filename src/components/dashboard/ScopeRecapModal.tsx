'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, X, Plus, Trash2, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getScopeRecapModel } from '@/actions/retainers'
import type { ScopeRecapData } from '@/lib/retainers/scopeRecap'

// ── Shared styles (aligned with RetainerRecapModal) ───────────────────────────
const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const areaCls = cn(inputCls, 'py-2 resize-none')
const accentBtn =
  'flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--space-accent)] text-black hover:opacity-90 transition-all disabled:opacity-50'
const ghostBtn =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-all disabled:opacity-50'
const labelCls = 'text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]'
const sectionLabel = 'text-[0.5625rem] font-bold tracking-[0.25em] uppercase text-[var(--space-accent)]'

export interface ScopeRecapModalProps {
  retainerId: string
  onClose: () => void
  /** Previously composed state — resumes the draft instead of re-deriving. */
  draft?: ScopeRecapData | null
  /** Reports every edit up so the narrative survives the modal closing (and can ride
   *  along as an attachment on the proposal email). */
  onDraftChange?: (model: ScopeRecapData) => void
}

/**
 * Composer for the scope recap — the "here is what we have already done" document that
 * accompanies a proposal. The sibling of RetainerRecapModal, but anchored to the pitch
 * rather than a billing cycle, so it edits delivered work and planned work instead of
 * cycle hours. Only narrative fields are editable; hours, work items and the planned
 * list are re-derived server-side when the PDF is built.
 */
export function ScopeRecapModal({ retainerId, onClose, draft, onDraftChange }: ScopeRecapModalProps) {
  const [loading, setLoading] = useState(!draft)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<ScopeRecapData | null>(draft ?? null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (draft) return // resume the lifted draft — no re-derive
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      const r = await getScopeRecapModel(retainerId)
      if (!alive) return
      if (r.success) setModel(r.model)
      else setError(r.error ?? 'Failed to build recap')
      setLoading(false)
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retainerId])

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

  const patch = useCallback((p: Partial<ScopeRecapData>) => {
    setModel((m) => (m ? { ...m, ...p } : m))
  }, [])

  async function handleGenerate() {
    if (!model) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/retainers/${retainerId}/scope-recap/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recap: model }),
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
            <span className="text-sm font-semibold text-[var(--space-text-primary)]">Work Recap</span>
            {model && (
              <span className="text-xs text-[var(--space-text-muted)] truncate">
                {(model.clientCompany || model.clientName)} · {model.periodLabel}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
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
              <div className="py-20 text-center text-sm text-[var(--space-text-muted)]">{error ?? 'Nothing to recap yet.'}</div>
            ) : (
              <div className="max-w-xl mx-auto w-full space-y-7">
                {/* Cover */}
                <section className="space-y-3">
                  <p className={sectionLabel}>Cover</p>
                  <div>
                    <label className={labelCls}>Document title</label>
                    <input value={model.scopeTitle} onChange={(e) => patch({ scopeTitle: e.target.value })} placeholder="Work to date" className={cn(inputCls, 'mt-1.5')} />
                    <p className="text-[0.625rem] text-[var(--space-text-muted)] mt-1">
                      Seeded from the scope summary. Sits under &ldquo;Work recap&rdquo; on the cover slide.
                    </p>
                  </div>
                </section>

                {/* At a glance */}
                <section className="space-y-3">
                  <p className={sectionLabel}>At a glance</p>
                  <div>
                    <label className={labelCls}>Headline</label>
                    <input value={model.headline} onChange={(e) => patch({ headline: e.target.value })} className={cn(inputCls, 'mt-1.5')} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg border border-[var(--space-border-hard)] px-3 py-2 bg-[var(--space-bg-card-hover)]">
                      <span className={labelCls}>Delivered</span>
                      <p className="text-sm font-semibold tabular-nums text-[var(--space-text-primary)] mt-1">{model.hoursDelivered}h</p>
                      <p className="text-[0.625rem] text-[var(--space-text-muted)]">{model.itemsDelivered} item{model.itemsDelivered === 1 ? '' : 's'}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--space-border-hard)] px-3 py-2 bg-[var(--space-bg-card-hover)]">
                      <span className={labelCls}>Planned</span>
                      <p className="text-sm font-semibold tabular-nums text-[var(--space-text-primary)] mt-1">{model.hoursPlanned}h</p>
                      <p className="text-[0.625rem] text-[var(--space-text-muted)]">{model.itemsPlanned} item{model.itemsPlanned === 1 ? '' : 's'}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--space-border-hard)] px-3 py-2 bg-[var(--space-bg-card-hover)]">
                      <span className={labelCls}>Proposed</span>
                      <p className="text-sm font-semibold tabular-nums text-[var(--space-text-primary)] mt-1">{model.proposedAmountLabel ?? '—'}</p>
                      <p className="text-[0.625rem] text-[var(--space-text-muted)] truncate">{model.proposedTermsLabel ?? 'Price the proposal to show this'}</p>
                    </div>
                  </div>
                  <p className="text-[0.625rem] text-[var(--space-text-muted)] leading-relaxed">
                    These figures come from the work log and the saved proposal — they are re-derived when the PDF is built, so they always match.
                  </p>
                </section>

                {/* Delivered */}
                <section className="space-y-3">
                  <p className={sectionLabel}>What we delivered</p>
                  <div>
                    <label className={labelCls}>Section headline (optional)</label>
                    <input value={model.accomplishedHeadline} onChange={(e) => patch({ accomplishedHeadline: e.target.value })} placeholder="e.g. Discovery and the first round of fixes" className={cn(inputCls, 'mt-1.5')} />
                  </div>
                  {model.buckets.length === 0 ? (
                    <p className="text-xs text-[var(--space-text-muted)]">Nothing logged yet — the recap reads as a plan only.</p>
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
                        placeholder="What this covered, in a sentence…"
                        className={cn(areaCls, 'text-xs')}
                      />
                      <p className="text-[0.625rem] text-[var(--space-text-muted)]">
                        {b.items.length} item{b.items.length === 1 ? '' : 's'} listed on the slide.
                      </p>
                    </div>
                  ))}
                </section>

                {/* Planned next */}
                <section className="space-y-3">
                  <p className={sectionLabel}>What&rsquo;s next</p>
                  <div>
                    <label className={labelCls}>Section headline (optional)</label>
                    <input value={model.remainingHeadline} onChange={(e) => patch({ remainingHeadline: e.target.value })} placeholder="e.g. What we propose to do next" className={cn(inputCls, 'mt-1.5')} />
                  </div>
                  {model.remaining.length === 0 ? (
                    <p className="text-xs text-[var(--space-text-muted)]">No planned work pitched yet.</p>
                  ) : (
                    <ul className="rounded-lg border border-[var(--space-border-hard)] divide-y divide-[var(--space-border-hard)] overflow-hidden">
                      {model.remaining.map((r, i) => (
                        <li key={i} className="px-3 py-2 text-xs text-[var(--space-text-secondary)]">{r.label}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[0.625rem] text-[var(--space-text-muted)]">
                    Pulled from the planned work on the pitch — edit it there, not here.
                  </p>
                </section>

                {/* Notes */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StringList label="Notes" items={model.notes} onChange={(v) => patch({ notes: v })} placeholder="Context worth recording" />
                  <StringList label="Next steps" items={model.nextSteps} onChange={(v) => patch({ nextSteps: v })} placeholder="e.g. Approve the proposal" />
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
