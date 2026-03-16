'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Receipt, CheckCircle2, ExternalLink, CalendarDays, Trash2 } from 'lucide-react'
import { sendScheduledPayment, removeScheduleEntry } from '@/actions/packages'

interface ScheduledEntry {
  id: string
  label: string
  amount: number
  dueDate?: string | null
  orderId?: string | null
}

interface PackageWithSchedule {
  id: string
  name: string
  paymentSchedule?: ScheduledEntry[]
}

interface ScheduledPaymentsSectionProps {
  packages: PackageWithSchedule[]
  username: string
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
  if (!dueDate) return true // no due date → always show
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

export function ScheduledPaymentsSection({ packages, username }: ScheduledPaymentsSectionProps) {
  const router = useRouter()
  const [timeframe, setTimeframe] = useState<Timeframe>('all')
  const [sendingEntryId, setSendingEntryId] = useState<string | null>(null)
  const [removingEntryId, setRemovingEntryId] = useState<string | null>(null)
  const [entryResults, setEntryResults] = useState<Record<string, { url: string } | { error: string }>>({})

  // Filter packages that have uninvoiced schedule entries, with timeframe filter applied
  const scheduledPackages = packages
    .map((pkg) => ({
      ...pkg,
      pendingEntries: (pkg.paymentSchedule ?? []).filter((e) => {
        if (e.orderId) return false // already invoiced
        if (timeframe === 'all') return true
        return isWithinDays(e.dueDate, parseInt(timeframe))
      }),
    }))
    .filter((pkg) => pkg.pendingEntries.length > 0)

  const totalPending = scheduledPackages.reduce((s, p) => s + p.pendingEntries.length, 0)

  // Also compute raw count (all, ignoring timeframe filter) to decide if we show the section at all
  const totalUnvoiced = packages.reduce(
    (s, pkg) => s + (pkg.paymentSchedule ?? []).filter((e) => !e.orderId).length,
    0,
  )

  if (totalUnvoiced === 0) return null

  const handleSend = async (pkgId: string, entryId: string) => {
    setSendingEntryId(entryId)
    const result = await sendScheduledPayment(pkgId, entryId)
    setSendingEntryId(null)
    if (result.success && result.invoiceUrl) {
      setEntryResults((prev) => ({ ...prev, [entryId]: { url: result.invoiceUrl as string } }))
      router.refresh()
    } else {
      setEntryResults((prev) => ({ ...prev, [entryId]: { error: result.error ?? 'Failed to send invoice' } }))
    }
  }

  const handleRemove = async (pkgId: string, entryId: string) => {
    setRemovingEntryId(entryId)
    await removeScheduleEntry(pkgId, entryId)
    setRemovingEntryId(null)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {/* Header row with title + timeframe pills */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <h3 className="text-sm font-semibold text-[#F0F0F0]">Scheduled Payments</h3>
          <span className="text-xs text-gray-600 tabular-nums">
            {totalPending} pending{timeframe !== 'all' && ` · next ${timeframe}d`}
          </span>
        </div>
        {/* Timeframe filter pills */}
        <div className="flex items-center rounded-lg border border-[#404040] overflow-hidden">
          {TIMEFRAME_OPTS.map((opt, i, arr) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTimeframe(opt.value)}
              className={[
                'px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-all',
                i < arr.length - 1 ? 'border-r border-[#404040]' : '',
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
        <div className="rounded-xl border border-[#404040] bg-[#252525] px-5 py-4 text-xs text-[#6B6B6B]">
          No scheduled payments due within {timeframe} days.
        </div>
      ) : (
        <div className="rounded-xl border border-[#404040] bg-[#252525] overflow-hidden divide-y divide-[#333333]">
          {scheduledPackages.map((pkg) => (
            <div key={pkg.id}>
              {/* Package name row */}
              <div className="px-5 py-2.5 bg-[#252525]">
                <span className="text-[10px] text-[#6B6B6B] uppercase tracking-widest font-semibold">
                  {pkg.name}
                </span>
              </div>

              {/* Entry rows */}
              {pkg.pendingEntries.map((entry) => {
                const entryResult = entryResults[entry.id]
                return (
                  <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0 flex items-center gap-4 flex-wrap">
                      <span className="text-sm text-[#A0A0A0] font-medium">{entry.label}</span>
                      <span className="text-sm text-[#F0F0F0] tabular-nums font-mono shrink-0">
                        {fmt(entry.amount)}
                      </span>
                      {entry.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                          <CalendarDays className="size-3" />
                          {fmtEntryDate(entry.dueDate)}
                        </span>
                      )}
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
                            disabled={sendingEntryId === entry.id || removingEntryId === entry.id}
                            onClick={() => handleSend(pkg.id, entry.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--space-accent)] border border-[rgba(139,156,182,0.20)] bg-[rgba(139,156,182,0.06)] rounded-lg hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-50 transition-all"
                          >
                            {sendingEntryId === entry.id
                              ? <Loader2 className="size-3.5 animate-spin" />
                              : <Receipt className="size-3.5" />
                            }
                            {sendingEntryId === entry.id ? 'Sending…' : 'Send Invoice'}
                          </button>
                          <button
                            type="button"
                            disabled={sendingEntryId === entry.id || removingEntryId === entry.id}
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
    </div>
  )
}
