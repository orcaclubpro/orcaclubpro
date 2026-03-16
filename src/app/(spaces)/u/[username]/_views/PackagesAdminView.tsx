'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, Package, FileText, X, ExternalLink,
  Layers, Loader2, CheckCircle2, ChevronRight,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssignPackageModal } from '@/components/dashboard/AssignPackageModal'
import { createOrderFromPackage } from '@/actions/packages'

// ── Types ──────────────────────────────────────────────────────────────────────

interface LineItem {
  name: string
  description?: string | null
  price: number
  adjustedPrice?: number | null
  quantity?: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

interface PackageDoc {
  id: string
  name: string
  description?: string | null
  type: 'template' | 'proposal'
  status?: string
  clientAccount?: { id: string; name: string; company?: string | null } | string | null
  lineItems?: LineItem[]
  createdAt: string
}

interface PackagesAdminViewProps {
  allPackages: PackageDoc[]
  username: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function computeTotals(lineItems: LineItem[] = []) {
  let oneTime = 0, monthly = 0, annual = 0
  for (const item of lineItems) {
    const total = (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1)
    if (item.isRecurring) {
      if (item.recurringInterval === 'year') annual += total
      else monthly += total
    } else {
      oneTime += total
    }
  }
  return { oneTime, monthly, annual }
}

function statusStyle(status?: string) {
  switch (status) {
    case 'accepted': return 'text-emerald-400 border-emerald-400/25 bg-emerald-400/10'
    case 'sent':     return 'text-[var(--space-accent)] border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.10)]'
    case 'archived': return 'text-[#4A4A4A] border-[#404040] bg-[rgba(255,255,255,0.02)]'
    default:         return 'text-amber-400/80 border-amber-400/20 bg-amber-400/[0.06]'
  }
}

function PricingSummary({ lineItems }: { lineItems: LineItem[] }) {
  const { oneTime, monthly, annual } = computeTotals(lineItems)
  if (!oneTime && !monthly && !annual) return <span className="text-[#6B6B6B] text-xs">No pricing</span>
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {oneTime > 0 && (
        <span className="text-xs font-bold text-[#F0F0F0] tabular-nums font-mono">{fmt(oneTime)}</span>
      )}
      {monthly > 0 && (
        <span className="text-xs font-bold tabular-nums font-mono" style={{ color: 'var(--space-accent)' }}>
          {fmt(monthly)}<span className="text-[#4A4A4A] font-sans font-normal">/mo</span>
        </span>
      )}
      {annual > 0 && (
        <span className="text-xs font-bold tabular-nums font-mono" style={{ color: 'var(--space-accent)' }}>
          {fmt(annual)}<span className="text-[#4A4A4A] font-sans font-normal">/yr</span>
        </span>
      )}
    </div>
  )
}

// ── Proposal Detail Modal ──────────────────────────────────────────────────────

function ProposalModal({
  pkg,
  username,
  onClose,
}: {
  pkg: PackageDoc
  username: string
  onClose: () => void
}) {
  const [invoiceState, setInvoiceState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  const lineItems = pkg.lineItems ?? []
  const { oneTime, monthly, annual } = computeTotals(lineItems)
  const clientName = typeof pkg.clientAccount === 'object' && pkg.clientAccount
    ? pkg.clientAccount.name
    : 'Unknown Client'
  const clientCompany = typeof pkg.clientAccount === 'object' && pkg.clientAccount
    ? pkg.clientAccount.company
    : null

  async function handleCreateInvoice() {
    setInvoiceState('loading')
    setInvoiceError(null)
    const result = await createOrderFromPackage(pkg.id)
    if (result.success && result.invoiceUrl) {
      setInvoiceState('done')
      setInvoiceUrl(result.invoiceUrl)
      window.open(result.invoiceUrl, '_blank')
    } else {
      setInvoiceState('error')
      setInvoiceError(result.error ?? 'Failed to create invoice')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-[#000000]/60" onClick={onClose} />
      <div
        className="relative z-10 w-full sm:max-w-[540px] max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-[#404040] overflow-hidden"
        style={{ background: '#1C1C1C' }}
      >
        {/* Top line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--space-accent)]/30 to-transparent shrink-0" />

        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-[#333333]" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ color: 'var(--space-accent)' }}>
                  Proposal
                </p>
                {pkg.status && (
                  <span className={cn(
                    'text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border',
                    statusStyle(pkg.status),
                  )}>
                    {pkg.status}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[#F0F0F0] leading-tight">{pkg.name}</h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-sm font-semibold text-[#A0A0A0]">{clientName}</span>
                {clientCompany && (
                  <span className="text-xs text-[#A0A0A0]">· {clientCompany}</span>
                )}
              </div>
              {pkg.description && (
                <p className="text-sm text-[#4A4A4A] mt-2 leading-relaxed">{pkg.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 size-8 rounded-lg border border-[#404040] flex items-center justify-center text-[#4A4A4A] hover:text-[#F0F0F0] hover:border-[#404040] transition-all mt-0.5"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Pricing */}
          {(oneTime > 0 || monthly > 0 || annual > 0) && (
            <div className="flex items-end gap-6 flex-wrap p-4 rounded-xl bg-[#252525] border border-[#404040]">
              {oneTime > 0 && (
                <div>
                  <p className="text-2xl font-bold text-[#F0F0F0] tabular-nums">{fmt(oneTime)}</p>
                  <p className="text-[9px] text-[#A0A0A0] mt-1 uppercase tracking-[0.18em]">one-time</p>
                </div>
              )}
              {monthly > 0 && (
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <p className="text-2xl font-bold text-[#F0F0F0] tabular-nums">{fmt(monthly)}</p>
                    <p className="text-sm text-[#4A4A4A]">/mo</p>
                  </div>
                  <p className="text-[9px] text-[#A0A0A0] mt-1 uppercase tracking-[0.18em]">monthly</p>
                </div>
              )}
              {annual > 0 && (
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <p className="text-2xl font-bold text-[#F0F0F0] tabular-nums">{fmt(annual)}</p>
                    <p className="text-sm text-[#4A4A4A]">/yr</p>
                  </div>
                  <p className="text-[9px] text-[#A0A0A0] mt-1 uppercase tracking-[0.18em]">annually</p>
                </div>
              )}
            </div>
          )}

          {/* Line items */}
          {lineItems.length > 0 ? (
            <div>
              <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#1E3A6E] mb-2.5">
                Included · {lineItems.length}
              </p>
              <div className="space-y-1.5">
                {lineItems.map((item, i) => {
                  const itemTotal = (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1)
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-[#2D2D2D] border border-[#404040]"
                    >
                      <div className="mt-0.5 size-4 rounded-full bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.15)] flex items-center justify-center shrink-0">
                        <Check className="size-2.5" style={{ color: 'var(--space-accent)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-[#F0F0F0]">{item.name}</p>
                          <span className="text-sm font-bold text-[#6B6B6B] tabular-nums font-mono shrink-0">
                            {fmt(itemTotal)}
                            {item.isRecurring && (
                              <span className="text-xs font-normal text-[#4A4A4A]">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
                            )}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-[#A0A0A0] mt-0.5 leading-relaxed">{item.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#6B6B6B] italic py-2">No line items configured.</p>
          )}

          {/* Invoice result */}
          {invoiceState === 'done' && invoiceUrl && (
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25 text-emerald-400 text-sm hover:bg-emerald-500/[0.10] transition-colors"
            >
              <CheckCircle2 className="size-4" />
              Invoice created successfully
              <ExternalLink className="size-3 ml-auto" />
            </a>
          )}
          {invoiceState === 'error' && invoiceError && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {invoiceError}
            </p>
          )}

        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center gap-2 px-6 py-4 border-t border-[#404040] bg-[#252525] flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#4A4A4A] hover:text-[#F0F0F0] transition-colors rounded-lg hover:bg-[#2D2D2D]"
          >
            Close
          </button>
          <div className="flex-1" />
          {lineItems.length > 0 && invoiceState !== 'done' && (
            <button
              onClick={handleCreateInvoice}
              disabled={invoiceState === 'loading'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-[#2D2D2D] border border-[#404040] text-[#A0A0A0] hover:text-[#F0F0F0] hover:bg-[#E5E1D9] transition-all disabled:opacity-50"
            >
              {invoiceState === 'loading'
                ? <><Loader2 className="size-3.5 animate-spin" />Creating…</>
                : <><FileText className="size-3.5" />Create Invoice</>
              }
            </button>
          )}
          <Link
            href={`/u/${username}/packages/${pkg.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-[rgba(139,156,182,0.10)] border border-[rgba(139,156,182,0.15)] hover:bg-[rgba(139,156,182,0.12)] hover:border-[rgba(139,156,182,0.20)] transition-all"
            style={{ color: 'var(--space-accent)' }}
          >
            <ExternalLink className="size-3.5" />
            View Proposal
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Proposal Card ──────────────────────────────────────────────────────────────

function ProposalCard({
  pkg,
  onClick,
}: {
  pkg: PackageDoc
  onClick: () => void
}) {
  const lineItems = pkg.lineItems ?? []
  const { oneTime, monthly, annual } = computeTotals(lineItems)

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 w-60 flex flex-col gap-3 p-4 rounded-xl border border-[#404040] hover:border-[rgba(139,156,182,0.15)] hover:bg-[rgba(255,255,255,0.01)] transition-all duration-200 text-left group bg-[#252525]"
    >
      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border',
          statusStyle(pkg.status),
        )}>
          {pkg.status ?? 'draft'}
        </span>
        <ChevronRight className="size-3.5 text-[#6B6B6B] group-hover:translate-x-0.5 transition-all" style={{ color: undefined }} />
      </div>

      {/* Name */}
      <div>
        <p className="text-sm font-semibold text-[#F0F0F0] leading-snug line-clamp-2 transition-colors">
          {pkg.name}
        </p>
        {pkg.description && (
          <p className="text-xs text-[#A0A0A0] mt-1 line-clamp-2 leading-relaxed">
            {pkg.description}
          </p>
        )}
      </div>

      {/* Pricing */}
      <div>
        <PricingSummary lineItems={lineItems} />
        {lineItems.length > 0 && (
          <p className="text-[10px] text-[#6B6B6B] mt-1">
            {lineItems.length} service{lineItems.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </button>
  )
}

// ── Template Row ───────────────────────────────────────────────────────────────

function TemplateRow({ pkg }: { pkg: PackageDoc }) {
  const [expanded, setExpanded] = useState(false)
  const lineItems = pkg.lineItems ?? []
  const { oneTime, monthly, annual } = computeTotals(lineItems)

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden transition-all duration-200',
        expanded ? 'border-[#404040]' : 'border-[#404040] hover:border-[#404040]',
      )}
      style={{ background: '#252525' }}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-sm font-medium text-[#A0A0A0]">{pkg.name}</p>
            <div className="flex items-center gap-2">
              {oneTime > 0 && <span className="text-xs font-semibold text-[#4A4A4A] tabular-nums font-mono">{fmt(oneTime)}</span>}
              {monthly > 0 && <span className="text-xs font-semibold text-[#4A4A4A] tabular-nums font-mono">{fmt(monthly)}<span className="font-normal">/mo</span></span>}
              {annual > 0 && <span className="text-xs font-semibold text-[#4A4A4A] tabular-nums font-mono">{fmt(annual)}<span className="font-normal">/yr</span></span>}
            </div>
          </div>
          {pkg.description && !expanded && (
            <p className="text-xs text-[#6B6B6B] mt-0.5 truncate">{pkg.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[10px] text-[#6B6B6B] tabular-nums">{lineItems.length} item{lineItems.length !== 1 ? 's' : ''}</span>
          <div className={cn('size-5 rounded-md border border-[#404040] flex items-center justify-center transition-all', expanded && 'bg-[#2D2D2D]')}>
            <ChevronRight className={cn('size-3 text-[#4A4A4A] transition-transform', expanded && 'rotate-90')} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#404040] px-4 pb-4">
          {lineItems.length > 0 ? (
            <div className="pt-3 space-y-2.5">
              {lineItems.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#6B6B6B] font-medium">{item.name}</span>
                      {item.isRecurring && (
                        <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--space-accent)', opacity: 0.6 }}>
                          {item.recurringInterval === 'year' ? 'annual' : 'monthly'}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[#6B6B6B] mt-0.5 leading-relaxed whitespace-pre-line">{item.description}</p>
                    )}
                  </div>
                  <span className="text-[#4A4A4A] tabular-nums shrink-0 font-mono">
                    {fmt((item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1))}
                    {item.isRecurring && <span className="text-[#6B6B6B]">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="pt-3 text-xs text-[#6B6B6B] italic">No line items</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PackagesAdminView({ allPackages, username }: PackagesAdminViewProps) {
  const [query, setQuery] = useState('')
  const [modalPkg, setModalPkg] = useState<PackageDoc | null>(null)

  const proposals = allPackages.filter(p => p.type === 'proposal')
  const templates  = allPackages.filter(p => p.type === 'template')

  const clientGroups = useMemo(() => {
    const groups: Record<string, {
      clientId: string
      clientName: string
      clientCompany: string | null
      proposals: PackageDoc[]
    }> = {}
    for (const p of proposals) {
      const ca = p.clientAccount
      const clientId   = typeof ca === 'string' ? ca : (ca as any)?.id ?? 'unknown'
      const clientName = typeof ca === 'object' && ca ? (ca as any).name ?? 'Unknown Client' : 'Unknown Client'
      const clientCompany = typeof ca === 'object' && ca ? (ca as any).company ?? null : null
      if (!groups[clientId]) groups[clientId] = { clientId, clientName, clientCompany, proposals: [] }
      groups[clientId].proposals.push(p)
    }
    return Object.values(groups).sort((a, b) => a.clientName.localeCompare(b.clientName))
  }, [proposals])

  const q = query.toLowerCase().trim()

  const filteredGroups = useMemo(() => {
    if (!q) return clientGroups
    return clientGroups
      .map(g => ({
        ...g,
        proposals: g.proposals.filter(
          p => p.name.toLowerCase().includes(q) || g.clientName.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.proposals.length > 0)
  }, [clientGroups, q])

  const filteredTemplates = useMemo(() => {
    if (!q) return templates
    return templates.filter(t => t.name.toLowerCase().includes(q))
  }, [templates, q])

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1">
            <p className="text-[9px] font-bold tracking-[0.32em] uppercase mb-1" style={{ color: 'var(--space-accent)' }}>
              Operations
            </p>
            <h2 className="text-xl font-bold text-[#F0F0F0] tracking-tight">Packages</h2>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            {[
              { label: 'Proposals', value: proposals.length },
              { label: 'Templates', value: templates.length },
              { label: 'Clients', value: clientGroups.length },
            ].map(s => (
              <div
                key={s.label}
                className="flex flex-col items-center px-3 py-2 rounded-lg bg-[#252525] border border-[#404040]"
              >
                <span className="text-lg font-bold text-[#F0F0F0] tabular-nums">{s.value}</span>
                <span className="text-[9px] text-[#A0A0A0] uppercase tracking-[0.15em] mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-[#4A4A4A] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search packages or clients…"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#2D2D2D] border border-[#404040] rounded-xl text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:outline-none focus:border-[rgba(139,156,182,0.20)] focus:bg-[#252525] transition-all"
          />
        </div>

        {/* ── Proposals by client ──────────────────────────────────────────── */}
        {filteredGroups.length > 0 ? (
          <div className="space-y-8">
            {filteredGroups.map(group => (
              <div key={group.clientId}>
                {/* Client header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="size-8 rounded-xl bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.15)] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold" style={{ color: 'var(--space-accent)' }}>
                        {group.clientName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F0F0F0] leading-none">{group.clientName}</p>
                      {group.clientCompany && (
                        <p className="text-[10px] text-[#4A4A4A] mt-0.5">{group.clientCompany}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B6B6B] ml-1 tabular-nums">
                      {group.proposals.length} package{group.proposals.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <AssignPackageModal clientId={group.clientId} />
                </div>

                {/* Horizontal proposal card scroll */}
                <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                  {group.proposals.map(pkg => (
                    <ProposalCard
                      key={pkg.id}
                      pkg={pkg}
                      onClick={() => setModalPkg(pkg)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : q ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#4A4A4A]">No proposals match &ldquo;{query}&rdquo;</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-[#2D2D2D] border border-[#404040] mb-5">
              <FileText className="size-7 text-[#4A4A4A]" />
            </div>
            <p className="text-sm text-[#6B6B6B] font-medium mb-1">No proposals yet</p>
            <p className="text-xs text-[#6B6B6B] max-w-xs mx-auto leading-relaxed">
              Assign packages to clients from their profile page to create proposals.
            </p>
          </div>
        ) : null}

        {/* ── Templates ────────────────────────────────────────────────────── */}
        {filteredTemplates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="size-3.5 text-[#4A4A4A]" />
              <p className="text-[10px] font-bold text-[#4A4A4A] uppercase tracking-[0.2em]">
                Templates
              </p>
              <span className="text-[10px] text-[#6B6B6B] tabular-nums ml-0.5">{filteredTemplates.length}</span>
            </div>
            <div className="space-y-1.5">
              {filteredTemplates.map(t => (
                <TemplateRow key={t.id} pkg={t} />
              ))}
            </div>
            <p className="text-[10px] text-[#6B6B6B] mt-4 text-center">
              Manage templates in the{' '}
              <a href="/admin/collections/packages" className="text-[#4A4A4A] hover:text-[#6B6B6B] underline transition-colors">
                admin panel
              </a>
            </p>
          </div>
        )}

        {/* Truly empty */}
        {filteredGroups.length === 0 && filteredTemplates.length === 0 && !q && proposals.length === 0 && templates.length === 0 && (
          <div className="py-20 text-center">
            <div className="inline-flex p-5 rounded-2xl bg-[#2D2D2D] border border-[#404040] mb-6">
              <Package className="size-8 text-[#4A4A4A]" />
            </div>
            <p className="text-sm text-[#6B6B6B] font-medium mb-1.5">No packages yet</p>
            <p className="text-xs text-[#6B6B6B] max-w-xs mx-auto leading-relaxed">
              Create package templates in the admin panel, then assign them to clients from their profile.
            </p>
          </div>
        )}

      </div>

      {/* Proposal modal */}
      {modalPkg && (
        <ProposalModal
          pkg={modalPkg}
          username={username}
          onClose={() => setModalPkg(null)}
        />
      )}
    </>
  )
}
