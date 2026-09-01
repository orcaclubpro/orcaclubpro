'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, FileText, Layers, Loader2, Pencil, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBuilderPackages, type BuilderPackageRow } from '@/actions/package-builder'

// ─── Open or clone an existing package ──────────────────────────────────────────
// The builder could only ever start from nothing, or from the one proposal the
// packages page handed it. This is the third door: pick any package and either keep
// working on it where it lives, or take a copy somewhere new.
//
// Edit is offered for PROPOSALS only. A proposal belongs to a client and saving it
// writes back to that assignment, which is exactly what "edit" should mean here. A
// template has no client, so there is nothing to save it back into from a builder
// whose save path is `createProposal`/`updateProposal` — templates clone instead.

export type PickerAction = 'edit' | 'clone'

export interface PackagePickerModalProps {
  /** Hidden from the list — you cannot open the package you already have open. */
  excludeId?: string | null
  onPick: (row: BuilderPackageRow, action: PickerAction) => void
  onClose: () => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}

function fmtWhen(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

const STATUS_TONE: Record<string, string> = {
  draft: 'text-[var(--space-text-muted)]',
  sent: 'text-[var(--space-accent)]',
  accepted: 'text-emerald-400',
  archived: 'text-[var(--space-text-muted)]',
}

export function PackagePickerModal({ excludeId, onPick, onClose }: PackagePickerModalProps) {
  const [rows, setRows] = useState<BuilderPackageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await getBuilderPackages()
      if (!alive) return
      if (res.success) setRows(res.packages)
      else setError(res.error ?? 'Could not load packages')
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 40)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const base = rows.filter((r) => r.id !== excludeId)
    if (!q) return base
    return base.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.clientLabel ?? '').toLowerCase().includes(q) ||
        r.type.includes(q),
    )
  }, [rows, query, excludeId])

  // Keep the cursor inside the list as it shrinks under the search.
  useEffect(() => { setIdx((i) => Math.min(i, Math.max(0, filtered.length - 1))) }, [filtered.length])

  // Captured so the console's Esc — which would collapse the whole station — never
  // sees the key while this is open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(filtered.length - 1, i + 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); return }
      if (e.key === 'Enter') {
        const row = filtered[idx]
        if (!row) return
        e.preventDefault(); e.stopPropagation()
        // Enter takes the primary action: continue a proposal, copy a template.
        onPick(row, row.type === 'proposal' ? 'edit' : 'clone')
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  })

  return (
    <div className="fixed inset-0 z-[90] print:hidden">
      <div
        className="absolute inset-0 animate-in fade-in duration-150"
        style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-4 bottom-4 -translate-x-1/2 w-full px-3 max-w-[38.75rem]">
        <div
          className="flex flex-col h-full overflow-hidden rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-150"
          style={{ background: 'var(--space-bg-card)', border: '1px solid var(--space-border-hard)' }}
        >
          {/* ── Header / search ── */}
          <div className="shrink-0 border-b border-[var(--space-border-hard)]">
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--space-accent-soft)' }}>
                <Layers className="size-3.5" style={{ color: 'var(--space-accent)' }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--space-text-primary)] leading-tight">Open or clone a package</p>
                <p className="text-[0.6875rem] text-[var(--space-text-muted)] truncate">
                  Continue a client&rsquo;s proposal, or start from a copy of any package.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="ml-auto size-8 rounded-lg border border-[var(--space-border-hard)] flex items-center justify-center text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] transition-colors shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 px-5 pb-3">
              <Search className="size-3.5 text-[var(--space-text-muted)] shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by package or client…"
                className="flex-1 bg-transparent text-sm text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none py-1"
              />
              <span className="text-[0.625rem] text-[var(--space-text-muted)] shrink-0">
                {filtered.length} of {rows.length}
              </span>
            </div>
          </div>

          {/* ── List ── */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="size-5 text-[var(--space-text-muted)] animate-spin" /></div>
            ) : error ? (
              <p className="py-20 text-center text-sm text-[var(--space-text-muted)]">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="py-20 text-center text-sm text-[var(--space-text-muted)]">
                {rows.length === 0 ? 'No packages yet.' : 'Nothing matches that search.'}
              </p>
            ) : (
              filtered.map((row, i) => {
                const isProposal = row.type === 'proposal'
                return (
                  <div
                    key={row.id}
                    onMouseEnter={() => setIdx(i)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                      i === idx
                        ? 'bg-[var(--space-bg-card-hover)]'
                        : 'border-[var(--space-border-hard)] bg-[var(--space-bg-card)]',
                    )}
                    style={i === idx ? { borderColor: 'var(--space-accent)' } : {}}
                  >
                    <div className="size-7 rounded-lg flex items-center justify-center shrink-0 border border-[var(--space-border-hard)]">
                      {isProposal
                        ? <FileText className="size-3.5 text-[var(--space-text-muted)]" />
                        : <Layers className="size-3.5 text-[var(--space-text-muted)]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--space-text-primary)] truncate">{row.name}</p>
                      <p className="text-[0.6875rem] text-[var(--space-text-muted)] truncate">
                        {isProposal ? (row.clientLabel ?? 'Unassigned') : 'Template'}
                        {row.status && (
                          <span className={cn('ml-1.5 capitalize', STATUS_TONE[row.status] ?? '')}>· {row.status}</span>
                        )}
                        <span className="ml-1.5">· {row.lineCount} line{row.lineCount === 1 ? '' : 's'}</span>
                        {row.total > 0 && <span className="ml-1.5 tabular-nums">· {fmt(row.total)}</span>}
                        {row.updatedAt && <span className="ml-1.5">· {fmtWhen(row.updatedAt)}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Templates have no client to save back into — clone only. */}
                      {isProposal && (
                        <button
                          type="button"
                          onClick={() => onPick(row, 'edit')}
                          title="Continue this proposal for its client"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[0.6875rem] font-semibold rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] transition-colors"
                        >
                          <Pencil className="size-3" /> Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onPick(row, 'clone')}
                        title="Start a new proposal from a copy of this one"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[0.6875rem] font-semibold rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] transition-colors"
                      >
                        <Copy className="size-3" /> Clone
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="shrink-0 px-5 py-2.5 border-t border-[var(--space-border-hard)] text-[0.625rem] text-[var(--space-text-muted)]">
            <kbd className="px-1 py-0.5 rounded border border-[var(--space-border-hard)] font-mono">&uarr;&darr;</kbd> move ·{' '}
            <kbd className="px-1 py-0.5 rounded border border-[var(--space-border-hard)] font-mono">&crarr;</kbd> edit a proposal / clone a template ·{' '}
            <kbd className="px-1 py-0.5 rounded border border-[var(--space-border-hard)] font-mono">esc</kbd> close
          </div>
        </div>
      </div>
    </div>
  )
}
