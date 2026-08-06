'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Receipt, CheckCircle2, ExternalLink, CalendarDays, Trash2 } from 'lucide-react'
import { removeScheduleEntry } from '@/actions/packages'
import { SchedulePaymentInvoiceModal } from '@/components/dashboard/SchedulePaymentInvoiceModal'
import type { PackageRecapData } from '@/lib/packages/recap'

interface ScheduledEntry {
  id: string
  label: string
  amount: number
  dueDate?: string | null
  orderId?: string | null
  invoicedAt?: string | null
}

interface PackageWithSchedule {
  id: string
  name: string
  paymentSchedule?: ScheduledEntry[]
}

interface ScheduledPaymentsSectionProps {
  packages: PackageWithSchedule[]
  username: string
  /** Per-package work-log counts, keyed by package id — drives the work chip on each row. */
  workCounts?: Record<string, { pending: number; plannedOpen: number }>
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtEntryDate(iso: string) {
  const parts = iso.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return isFinite(d.getTime())
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
    : null
}

type Timeframe = '30' | '60' | '90' | 'all'

function isWithinDays(dueDate: string | null | undefined, days: number): boolean {
  if (!dueDate) return true
  const parts = dueDate.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return true
  const due = new Date(parts[0], parts[1] - 1, parts[2])
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + days)
  return due <= cutoff
}

const TIMEFRAME_OPTS: { label: string; value: Timeframe }[] = [
  { label: '30d', value: '30' },
  { label: '60d', value: '60' },
  { label: '90d', value: '90' },
  { label: 'All', value: 'all' },
]

export function ScheduledPaymentsSection({ packages, username, workCounts }: ScheduledPaymentsSectionProps) {
  const router = useRouter()
  const [timeframe, setTimeframe] = useState<Timeframe>('all')
  const [removingEntryId, setRemovingEntryId] = useState<string | null>(null)
  const [entryResults, setEntryResults] = useState<Record<string, { url: string } | { error: string }>>({})
  /** The schedule entry whose invoice is being composed, or null. */
  const [modalTarget, setModalTarget] = useState<{ pkgId: string; pkgName: string; entry: ScheduledEntry } | null>(null)
  /** Recap drafts keyed by SCHEDULE-ENTRY id — a draft can never attach to a different payment. */
  const [recapDrafts, setRecapDrafts] = useState<Record<string, PackageRecapData>>({})

  const scheduledPackages = packages
    .map((pkg) => ({
      ...pkg,
      pendingEntries: (pkg.paymentSchedule ?? []).filter((e) => {
        if (e.orderId && e.invoicedAt) return false
        if (timeframe === 'all') return true
        return isWithinDays(e.dueDate, parseInt(timeframe))
      }),
    }))
    .filter((pkg) => pkg.pendingEntries.length > 0)

  const totalPending = scheduledPackages.reduce((s, p) => s + p.pendingEntries.length, 0)

  const totalUnvoiced = packages.reduce(
    (s, pkg) => s + (pkg.paymentSchedule ?? []).filter((e) => !(e.orderId && e.invoicedAt)).length,
    0,
  )

  if (totalUnvoiced === 0) return null

  /** Compose the invoice for one entry — work lines, recap, and delivery live in the modal. */
  const handleCompose = (pkgId: string, pkgName: string, entry: ScheduledEntry) => {
    setEntryResults((prev) => {
      if (!prev[entry.id]) return prev
      const next = { ...prev }
      delete next[entry.id]
      return next
    })
    setModalTarget({ pkgId, pkgName, entry })
  }

  const handleRemove = async (pkgId: string, entryId: string) => {
    setRemovingEntryId(entryId)
    await removeScheduleEntry(pkgId, entryId)
    setRemovingEntryId(null)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <h3 className="text-sm font-semibold text-[var(--space-text-primary)]">Scheduled Payments</h3>
          <span className="text-xs text-gray-600 tabular-nums">
            {totalPending} pending{timeframe !== 'all' && ` · next ${timeframe}d`}
          </span>
        </div>
        <div className="flex items-center rounded-lg border border-[var(--space-border-hard)] overflow-hidden">
          {TIMEFRAME_OPTS.map((opt, i, arr) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTimeframe(opt.value)}
              className={[
                'px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all',
                i < arr.length - 1 ? 'border-r border-[var(--space-border-hard)]' : '',
                timeframe === opt.value
                  ? 'bg-[rgba(139,156,182,0.10)] text-[var(--space-accent)]'
                  : 'text-gray-600 hover:text-gray-400',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {scheduledPackages.length === 0 ? (
        <div className="rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] px-5 py-4 text-xs text-[var(--space-text-secondary)]">
          No scheduled payments due within {timeframe} days.
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] overflow-hidden divide-y divide-[var(--space-divider)]">
          {scheduledPackages.map((pkg) => (
            <div key={pkg.id}>
              <div className="px-5 py-2.5 bg-[var(--space-bg-card)]">
                <span className="text-[10px] text-[var(--space-text-secondary)] uppercase tracking-widest font-semibold">
                  {pkg.name}
                </span>
              </div>

              {pkg.pendingEntries.map((entry) => {
                const entryResult = entryResults[entry.id]
                return (
                  <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0 flex items-center gap-4 flex-wrap">
                      <span className="text-sm text-[var(--space-text-tertiary)] font-medium">{entry.label}</span>
                      <span className="text-sm text-[var(--space-text-primary)] tabular-nums font-mono shrink-0">
                        {fmt(entry.amount)}
                      </span>
                      {entry.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                          <CalendarDays className="size-3" />
                          {fmtEntryDate(entry.dueDate)}
                        </span>
                      )}
                      {(() => {
                        const c = workCounts?.[pkg.id]
                        if (!c || (c.pending === 0 && c.plannedOpen === 0)) return null
                        return (
                          <span className="text-[10px] text-[var(--space-text-secondary)] tabular-nums shrink-0">
                            {c.pending} logged{c.plannedOpen > 0 ? ` · ${c.plannedOpen} planned open` : ''}
                          </span>
                        )
                      })()}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {entryResult && 'url' in entryResult ? (
                        <a
                          href={entryResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/[0.06] rounded-lg hover:bg-emerald-500/10 transition-all"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Invoice sent
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-2">
                          {entryResult && 'error' in entryResult && (
                            <span className="text-[10px] text-red-400 max-w-[140px] leading-snug">
                              {entryResult.error}
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={removingEntryId === entry.id}
                            onClick={() => handleCompose(pkg.id, pkg.name, entry)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--space-accent)] border border-[rgba(139,156,182,0.20)] bg-[rgba(139,156,182,0.06)] rounded-lg hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-50 transition-all"
                          >
                            <Receipt className="size-3.5" />
                            Send Invoice
                          </button>
                          <button
                            type="button"
                            disabled={removingEntryId === entry.id}
                            onClick={() => handleRemove(pkg.id, entry.id)}
                            className="flex items-center justify-center size-8 text-gray-600 hover:text-red-400 hover:bg-red-400/[0.08] rounded-lg transition-all disabled:opacity-40"
                            title="Remove scheduled payment"
                          >
                            {removingEntryId === entry.id
                              ? <Loader2 className="size-3.5 animate-spin" />
                              : <Trash2 className="size-3.5" />
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Invoice composer — work-line selection, recap narrative, and delivery options */}
      {modalTarget && (
        <SchedulePaymentInvoiceModal
          key={modalTarget.entry.id}
          packageId={modalTarget.pkgId}
          packageName={modalTarget.pkgName}
          entry={modalTarget.entry}
          recapDraft={recapDrafts[modalTarget.entry.id] ?? null}
          onRecapChange={(id, r) => setRecapDrafts((p) => ({ ...p, [id]: r }))}
          onClose={() => setModalTarget(null)}
          onSent={() => { setModalTarget(null); router.refresh() }}
        />
      )}
    </div>
  )
}
