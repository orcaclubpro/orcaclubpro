'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, X, Plus, Trash2, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRecapModel } from '@/actions/retainers'
import type { RecapData } from '@/lib/retainers/recap'

// ── Shared styles (aligned with RetainerTab) ──────────────────────────────────
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

export interface RetainerRecapModalProps {
  retainerId: string
  clientId: string
  /** The viewed cycle's start ISO — used as the recap's reference date. */
  cycleRef: string
  onClose: () => void
  /** Previously composed state for THIS cycle — resumes the draft instead of re-deriving. */
  draft?: RecapData | null
  /** Reports every edit up so the composed narrative survives the modal closing
   *  (and can ride along on the retainer invoice email). */
  onDraftChange?: (model: RecapData) => void
}

export function RetainerRecapModal({ retainerId, clientId, cycleRef, onClose, draft, onDraftChange }: RetainerRecapModalProps) {
  const [loading, setLoading] = useState(!draft)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<RecapData | null>(draft ?? null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (draft) return // resume the lifted draft — no re-derive
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      const r = await getRecapModel(clientId, cycleRef)
      if (!alive) return
      if (r.success) setModel(r.model)
      else setError(r.error ?? 'Failed to build recap')
      setLoading(false)
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, cycleRef])

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

  const patch = useCallback((p: Partial<RecapData>) => {
    setModel((m) => (m ? { ...m, ...p } : m))
  }, [])

  async function handleGenerate() {
    if (!model) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/retainers/${retainerId}/recap/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: cycleRef, recap: model }),
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
    <div className="fixed inset-0 z-[80] print:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-in fade-in duration-150" style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div className="absolute left-1/2 -translate-x-1/2 top-3 bottom-3 w-full px-3 max-w-[47.5rem]">
        <div
          className="flex flex-col h-full overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
          style={{ background: 'var(--space-bg-card)', border: '1px solid var(--space-border-hard)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--space-border-hard)] shrink-0">
            <span className="text-sm font-semibold text-[var(--space-text-primary)]">Monthly Recap</span>
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
              <div className="py-20 text-center text-sm text-[var(--space-text-muted)]">{error ?? 'No active retainer cycle to recap.'}</div>
            ) : (
              <div className="max-w-xl mx-auto w-full space-y-7">
                {/* At a glance */}
                <section className="space-y-3">
                  <p className={sectionLabel}>At a glance</p>
                  <div>
                    <label className={labelCls}>Headline</label>
                    <input value={model.headline} onChange={(e) => patch({ headline: e.target.value })} className={cn(inputCls, 'mt-1.5')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-[var(--space-text-tertiary)]">
                    <div className="rounded-lg border border-[var(--space-border-hard)] px-3 py-2 bg-[var(--space-bg-card-hover)]">
                      <span className={labelCls}>Hours used</span>
                      <p className="text-sm font-semibold tabular-nums text-[var(--space-text-primary)] mt-1">{model.hoursUsed} / {model.hoursPerMonth}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--space-border-hard)] px-3 py-2 bg-[var(--space-bg-card-hover)]">
                      <span className={labelCls}>Items shipped</span>
                      <p className="text-sm font-semibold tabular-nums text-[var(--space-text-primary)] mt-1">{model.itemsShipped}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Site health</label>
                      <input value={model.siteHealth.label} onChange={(e) => patch({ siteHealth: { ...model.siteHealth, label: e.target.value } })} className={cn(inputCls, 'mt-1.5')} />
                      <input value={model.siteHealth.note} onChange={(e) => patch({ siteHealth: { ...model.siteHealth, note: e.target.value } })} placeholder="Note" className={cn(inputCls, 'mt-1.5 text-xs py-1.5')} />
                    </div>
                    <div>
                      <label className={labelCls}>Open requests</label>
                      <input type="number" min={0} value={model.openRequests.count} onChange={(e) => patch({ openRequests: { ...model.openRequests, count: parseInt(e.target.value || '0', 10) } })} className={cn(inputCls, 'mt-1.5')} />
                      <input value={model.openRequests.note} onChange={(e) => patch({ openRequests: { ...model.openRequests, note: e.target.value } })} placeholder="Note" className={cn(inputCls, 'mt-1.5 text-xs py-1.5')} />
                    </div>
                  </div>
                </section>

                {/* Where the hours went */}
                <section className="space-y-3">
                  <p className={sectionLabel}>Where the hours went</p>
                  <div>
                    <label className={labelCls}>Section headline (optional)</label>
                    <input value={model.bucketsHeadline} onChange={(e) => patch({ bucketsHeadline: e.target.value })} placeholder="e.g. Content updates took most of the month" className={cn(inputCls, 'mt-1.5')} />
                  </div>
                  {model.buckets.length === 0 ? (
                    <p className="text-xs text-[var(--space-text-muted)]">No hours logged this cycle.</p>
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
                        placeholder="What we did in this bucket…"
                        className={cn(areaCls, 'text-xs')}
                      />
                    </div>
                  ))}
                </section>

                {/* Campaigns (Growth / Enterprise) */}
                {model.showCampaigns && (
                  <section className="space-y-3">
                    <p className={sectionLabel}>Campaigns</p>
                    {model.campaigns.map((c, i) => (
                      <div key={i} className="rounded-lg border border-[var(--space-border-hard)] p-3 space-y-2 bg-[var(--space-bg-card-hover)]">
                        <div className="flex items-center gap-2">
                          <input value={c.channel} onChange={(e) => patch({ campaigns: model.campaigns.map((x, j) => j === i ? { ...x, channel: e.target.value } : x) })} placeholder="Channel (Email, Social…)" className={cn(inputCls, 'py-1.5 text-xs w-40')} />
                          <input value={c.title} onChange={(e) => patch({ campaigns: model.campaigns.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} placeholder="Title" className={cn(inputCls, 'flex-1 py-1.5 text-xs')} />
                          <button onClick={() => patch({ campaigns: model.campaigns.filter((_, j) => j !== i) })} className="size-7 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 transition-colors shrink-0"><Trash2 className="size-3.5" /></button>
                        </div>
                        <textarea value={c.note} rows={2} onChange={(e) => patch({ campaigns: model.campaigns.map((x, j) => j === i ? { ...x, note: e.target.value } : x) })} placeholder="Result / metrics" className={cn(areaCls, 'text-xs')} />
                      </div>
                    ))}
                    <button onClick={() => patch({ campaigns: [...model.campaigns, { channel: '', title: '', note: '' }] })} className={ghostBtn}><Plus className="size-3.5" /> Add campaign</button>
                  </section>
                )}

                {/* Recommendations */}
                <section className="space-y-3">
                  <p className={sectionLabel}>Recommendations</p>
                  {model.recommendations.map((r, i) => (
                    <div key={i} className="rounded-lg border border-[var(--space-border-hard)] p-3 space-y-2 bg-[var(--space-bg-card-hover)]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--space-accent)] shrink-0 w-6">{String(i + 1).padStart(2, '0')}</span>
                        <input value={r.title} onChange={(e) => patch({ recommendations: model.recommendations.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} placeholder="Recommendation" className={cn(inputCls, 'flex-1 py-1.5 text-xs font-semibold')} />
                        <button onClick={() => patch({ recommendations: model.recommendations.filter((_, j) => j !== i) })} className="size-7 flex items-center justify-center rounded-md text-[var(--space-text-muted)] hover:text-red-400 transition-colors shrink-0"><Trash2 className="size-3.5" /></button>
                      </div>
                      <textarea value={r.note} rows={2} onChange={(e) => patch({ recommendations: model.recommendations.map((x, j) => j === i ? { ...x, note: e.target.value } : x) })} placeholder="One sentence of why" className={cn(areaCls, 'text-xs')} />
                    </div>
                  ))}
                  <button onClick={() => patch({ recommendations: [...model.recommendations, { title: '', note: '' }] })} className={ghostBtn}><Plus className="size-3.5" /> Add recommendation</button>
                </section>

                {/* Notes */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StringList label="Decided" items={model.notesDecided} onChange={(v) => patch({ notesDecided: v })} placeholder="A decision from the call" />
                  <StringList label="Open questions" items={model.notesOpen} onChange={(v) => patch({ notesOpen: v })} placeholder="An open question" />
                </section>

                {/* Next month */}
                <section className="space-y-4">
                  <p className={sectionLabel}>Next month</p>
                  <StringList label="Priorities" items={model.nextMonthPriorities} onChange={(v) => patch({ nextMonthPriorities: v })} placeholder="A priority for next cycle" />
                  <StringList label="We need from you" items={model.asksFromClient} onChange={(v) => patch({ asksFromClient: v })} placeholder="Something needed from the client" />
                  <div>
                    <label className={labelCls}>Next call</label>
                    <input value={model.nextCallLabel} onChange={(e) => patch({ nextCallLabel: e.target.value })} placeholder="e.g. Tue 4 Aug, 10:00" className={cn(inputCls, 'mt-1.5')} />
                  </div>
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
