'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Package, FileText, ChevronDown, ChevronUp, ExternalLink, Layers, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssignPackageModal } from '@/components/dashboard/AssignPackageModal'
import { createOrderFromPackage } from '@/actions/packages'

interface LineItem {
  name: string
  description?: string | null
  price: number
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

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function computeTotals(lineItems: LineItem[] = []) {
  let oneTime = 0, monthly = 0, annual = 0
  for (const item of lineItems) {
    const total = (item.price ?? 0) * (item.quantity ?? 1)
    if (item.isRecurring) {
      if (item.recurringInterval === 'year') annual += total
      else monthly += total
    } else {
      oneTime += total
    }
  }
  return { oneTime, monthly, annual }
}

function PricingBadges({ lineItems }: { lineItems: LineItem[] }) {
  const { oneTime, monthly, annual } = computeTotals(lineItems)
  if (!oneTime && !monthly && !annual) return null
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {oneTime > 0 && (
        <span className="text-xs font-semibold text-white tabular-nums">{fmt(oneTime)}</span>
      )}
      {monthly > 0 && (
        <span className="text-xs font-semibold text-[#67e8f9] tabular-nums">{fmt(monthly)}<span className="text-gray-500 font-normal">/mo</span></span>
      )}
      {annual > 0 && (
        <span className="text-xs font-semibold text-[#67e8f9] tabular-nums">{fmt(annual)}<span className="text-gray-500 font-normal">/yr</span></span>
      )}
    </div>
  )
}

function CreateInvoiceButton({ packageId }: { packageId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handle() {
    setState('loading')
    setErrorMsg(null)
    const result = await createOrderFromPackage(packageId)
    if (result.success && result.invoiceUrl) {
      setState('done')
      setInvoiceUrl(result.invoiceUrl)
      window.open(result.invoiceUrl, '_blank')
    } else {
      setState('error')
      setErrorMsg(result.error ?? 'Failed')
    }
  }

  if (state === 'done' && invoiceUrl) {
    return (
      <a
        href={invoiceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <CheckCircle2 className="size-3.5" />
        Invoice created
        <ExternalLink className="size-3" />
      </a>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handle}
        disabled={state === 'loading'}
        className="flex items-center gap-1.5 text-xs text-[#67e8f9] hover:text-[#a5f3fc] transition-colors disabled:opacity-50"
      >
        {state === 'loading'
          ? <Loader2 className="size-3.5 animate-spin" />
          : <FileText className="size-3.5" />
        }
        {state === 'loading' ? 'Creating…' : 'Create Invoice'}
      </button>
      {state === 'error' && errorMsg && (
        <p className="text-[10px] text-red-400 max-w-[180px] leading-snug">{errorMsg}</p>
      )}
    </div>
  )
}

function PackageRow({ pkg, username }: { pkg: PackageDoc; username: string }) {
  const [expanded, setExpanded] = useState(false)
  const lineItems = pkg.lineItems ?? []

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      expanded ? 'border-white/[0.12]' : 'border-white/[0.06] hover:border-white/[0.1]',
    )} style={{ background: 'rgba(255,255,255,0.02)' }}>
      {/* Row header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-white truncate">{pkg.name}</p>
            <PricingBadges lineItems={lineItems} />
          </div>
          {pkg.description && (
            <p className="text-xs text-gray-600 mt-0.5 truncate">{pkg.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-gray-600 tabular-nums">{lineItems.length} item{lineItems.length !== 1 ? 's' : ''}</span>
          {expanded
            ? <ChevronUp className="size-3.5 text-gray-500" />
            : <ChevronDown className="size-3.5 text-gray-500" />
          }
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.06]">
          {lineItems.length > 0 ? (
            <div className="pt-3 space-y-3">
              {lineItems.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-300 font-medium">{item.name}</span>
                      {item.isRecurring && (
                        <span className="text-[10px] text-[#67e8f9]/70 uppercase tracking-wide">
                          {item.recurringInterval === 'year' ? 'annual' : 'monthly'}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-gray-600 mt-0.5 leading-relaxed whitespace-pre-line">{item.description}</p>
                    )}
                  </div>
                  <span className="text-gray-500 tabular-nums shrink-0 mt-0.5">
                    {fmt((item.price ?? 0) * (item.quantity ?? 1))}
                    {item.isRecurring && <span className="text-gray-600">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="pt-3 text-xs text-gray-700 italic">No line items</p>
          )}

          <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/[0.05]">
            <Link
              href={`/u/${username}/packages/${pkg.id}/print`}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <ExternalLink className="size-3" />
              View proposal
            </Link>
            {lineItems.length > 0 && (
              <CreateInvoiceButton packageId={pkg.id} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TemplateRow({ pkg }: { pkg: PackageDoc }) {
  const [expanded, setExpanded] = useState(false)
  const lineItems = pkg.lineItems ?? []

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      expanded ? 'border-white/[0.1]' : 'border-white/[0.05] hover:border-white/[0.08]',
    )} style={{ background: 'rgba(255,255,255,0.015)' }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-300 truncate">{pkg.name}</p>
            <PricingBadges lineItems={lineItems} />
          </div>
          {pkg.description && (
            <p className="text-xs text-gray-700 mt-0.5 truncate">{pkg.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-gray-700 tabular-nums">{lineItems.length} item{lineItems.length !== 1 ? 's' : ''}</span>
          {expanded
            ? <ChevronUp className="size-3.5 text-gray-600" />
            : <ChevronDown className="size-3.5 text-gray-600" />
          }
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.05]">
          {lineItems.length > 0 ? (
            <div className="pt-3 space-y-3">
              {lineItems.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500 font-medium">{item.name}</span>
                      {item.isRecurring && (
                        <span className="text-[10px] text-[#67e8f9]/50 uppercase tracking-wide">
                          {item.recurringInterval === 'year' ? 'annual' : 'monthly'}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-gray-700 mt-0.5 leading-relaxed whitespace-pre-line">{item.description}</p>
                    )}
                  </div>
                  <span className="text-gray-600 tabular-nums shrink-0 mt-0.5">
                    {fmt((item.price ?? 0) * (item.quantity ?? 1))}
                    {item.isRecurring && <span className="text-gray-700">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="pt-3 text-xs text-gray-700 italic">No line items</p>
          )}
        </div>
      )}
    </div>
  )
}

export function PackagesAdminView({ allPackages, username }: PackagesAdminViewProps) {
  const [query, setQuery] = useState('')

  const proposals = allPackages.filter(p => p.type === 'proposal')
  const templates = allPackages.filter(p => p.type === 'template')

  const clientGroups = useMemo(() => {
    const groups: Record<string, { clientId: string; clientName: string; clientCompany: string | null; proposals: PackageDoc[] }> = {}
    for (const p of proposals) {
      const ca = p.clientAccount
      const clientId = typeof ca === 'string' ? ca : (ca as any)?.id ?? 'unknown'
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">

      {/* Header + search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white tracking-tight">Packages</h2>
          <p className="text-[11px] text-gray-600 mt-0.5">
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} · {templates.length} template{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-600 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[#67e8f9]/30 focus:bg-white/[0.06] transition-all"
          />
        </div>
      </div>

      {/* Proposals grouped by client */}
      {filteredGroups.length > 0 ? (
        <div className="space-y-6">
          {filteredGroups.map(group => (
            <div key={group.clientId}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#67e8f9]/50 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white leading-none">{group.clientName}</p>
                    {group.clientCompany && (
                      <p className="text-[10px] text-gray-600 mt-0.5">{group.clientCompany}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-700 ml-1">
                    {group.proposals.length} package{group.proposals.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <AssignPackageModal clientId={group.clientId} />
              </div>
              <div className="space-y-2 pl-4 border-l border-white/[0.05]">
                {group.proposals.map(pkg => (
                  <PackageRow key={pkg.id} pkg={pkg} username={username} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : q ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-600">No proposals match &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="inline-flex p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] mb-4">
            <FileText className="size-6 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500">No proposals yet</p>
          <p className="text-xs text-gray-700 mt-1">Assign packages to clients from their profile page.</p>
        </div>
      )}

      {/* Templates */}
      {filteredTemplates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="size-3.5 text-gray-600" />
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-[0.18em]">Templates</p>
            <span className="text-[10px] text-gray-700">{filteredTemplates.length}</span>
          </div>
          <div className="space-y-2">
            {filteredTemplates.map(t => (
              <TemplateRow key={t.id} pkg={t} />
            ))}
          </div>
          <p className="text-[10px] text-gray-700 mt-3 text-center">
            Manage templates in the{' '}
            <a href="/admin/collections/packages" className="text-gray-500 hover:text-gray-400 underline">admin panel</a>
          </p>
        </div>
      )}

      {/* All empty */}
      {filteredGroups.length === 0 && filteredTemplates.length === 0 && !q && proposals.length === 0 && templates.length === 0 && (
        <div className="py-16 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-5">
            <Package className="size-8 text-gray-600" />
          </div>
          <p className="text-sm text-gray-500 font-medium">No packages yet</p>
          <p className="text-xs text-gray-700 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Create package templates in the admin panel, then assign them to clients from their profile.
          </p>
        </div>
      )}

    </div>
  )
}
