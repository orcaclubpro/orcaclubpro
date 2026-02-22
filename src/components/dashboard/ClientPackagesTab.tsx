'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, ArrowRight, ChevronDown, ChevronUp,
  X, Check, Loader2, Trash2, Copy, CheckCheck, Sparkles,
  Receipt, ExternalLink, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssignPackageModal } from './AssignPackageModal'
import { getProposalWithTemplate, updatePackage, deleteProposal, createOrderFromPackage } from '@/actions/packages'

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
  coverMessage?: string | null
  notes?: string | null
  status: string
  lineItems?: LineItem[]
  createdAt: string
}

interface ClientPackagesTabProps {
  packages: PackageDoc[]
  clientId: string
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

function OptionCard({
  item,
  selected,
  onToggle,
  onDescriptionChange,
  onQuantityChange,
}: {
  item: LineItem
  selected: boolean
  onToggle: () => void
  onDescriptionChange?: (desc: string) => void
  onQuantityChange?: (qty: number) => void
}) {
  const qty = item.quantity ?? 1
  const unitPrice = item.price ?? 0
  const total = unitPrice * qty
  return (
    <div className={cn(
      'w-full flex flex-col rounded-xl border text-left transition-all duration-150',
      selected
        ? 'bg-[#67e8f9]/[0.04] border-[#67e8f9]/25'
        : 'border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.02]',
    )}>
      {/* Toggle row — clicking here selects/deselects */}
      <button
        type="button"
        onClick={onToggle}
        className="flex flex-col gap-2.5 p-4 text-left w-full"
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-0.5 size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
            selected ? 'bg-[#67e8f9]/20 border-[#67e8f9]/60' : 'border-white/[0.22]',
          )}>
            {selected && <Check className="size-3 text-[#67e8f9]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold leading-snug', selected ? 'text-white' : 'text-gray-400')}>
              {item.name}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between pl-8">
          {item.isRecurring && (
            <span className={cn(
              'text-[10px] rounded-full px-1.5 py-0.5 uppercase tracking-wide font-medium',
              selected
                ? 'text-[#67e8f9]/80 bg-[#67e8f9]/10 border border-[#67e8f9]/20'
                : 'text-gray-500 bg-white/[0.04] border border-white/[0.08]',
            )}>
              {item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
            </span>
          )}
          <span className={cn('ml-auto text-sm font-bold font-mono tabular-nums', selected ? 'text-white' : 'text-gray-500')}>
            {fmt(total)}
            {item.isRecurring && (
              <span className="text-xs font-normal text-gray-500 font-sans">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
            )}
          </span>
        </div>
      </button>

      {/* Quantity + description — only when selected, clicks don't bubble to toggle */}
      {selected && (onQuantityChange || onDescriptionChange) && (
        <div className="px-4 pb-4 pt-0" onClick={e => e.stopPropagation()}>
          <div className="h-px bg-white/[0.06] mb-3" />
          <div className="flex flex-col gap-2">
            {onQuantityChange && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">Quantity</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(Math.max(1, qty - 1))}
                    className="size-6 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors text-sm leading-none"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 1) onQuantityChange(v)
                    }}
                    className="w-10 text-center text-xs bg-white/[0.06] border border-white/[0.10] rounded-md text-white py-1 focus:outline-none focus:border-[#67e8f9]/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => onQuantityChange(qty + 1)}
                    className="size-6 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors text-sm leading-none"
                  >
                    +
                  </button>
                  {qty > 1 && (
                    <span className="text-[10px] text-gray-600 ml-1 tabular-nums">
                      × {fmt(unitPrice)} ea
                    </span>
                  )}
                </div>
              </div>
            )}
            {onDescriptionChange && (
              <textarea
                value={item.description ?? ''}
                onChange={e => onDescriptionChange(e.target.value)}
                placeholder="Add a description… (shown on invoice)"
                rows={2}
                className="w-full px-3 py-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-gray-300 placeholder:text-gray-700 focus:outline-none focus:border-[#67e8f9]/30 resize-none leading-relaxed transition-colors"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ClientPackagesTab({ packages, clientId, username }: ClientPackagesTabProps) {
  const router = useRouter()
  const [expandedId, setExpandedId]           = useState<string | null>(null)
  const [editItems, setEditItems]             = useState<LineItem[]>([])
  const [templateItems, setTemplateItems]     = useState<LineItem[]>([])
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [saving, setSaving]                   = useState(false)
  const [saveError, setSaveError]             = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId]           = useState<string | null>(null)
  const [copied, setCopied]                   = useState(false)
  const [invoicingId, setInvoicingId]         = useState<string | null>(null)
  const [invoiceConfirmId, setInvoiceConfirmId] = useState<string | null>(null)
  const [invoiceResults, setInvoiceResults]   = useState<Record<string, { url: string } | { error: string }>>({})
  const [daysUntilDue, setDaysUntilDue]       = useState<Record<string, number>>({})

  const getDays = (pkgId: string) => daysUntilDue[pkgId] ?? 30

  const handleCreateInvoice = async (pkg: PackageDoc) => {
    setInvoiceConfirmId(null)
    setInvoicingId(pkg.id)

    // Save current editItems to DB first so createOrderFromPackage reads correct data
    const saveResult = await updatePackage({
      packageId: pkg.id,
      name: pkg.name,
      description: pkg.description ?? undefined,
      coverMessage: pkg.coverMessage ?? undefined,
      notes: pkg.notes ?? undefined,
      lineItems: editItems.map(item => ({ ...item, description: item.description ?? undefined })),
    })

    if (!saveResult.success) {
      setInvoicingId(null)
      setInvoiceResults(prev => ({ ...prev, [pkg.id]: { error: saveResult.error ?? 'Failed to save package before invoicing' } }))
      return
    }

    const result = await createOrderFromPackage(pkg.id, getDays(pkg.id))
    setInvoicingId(null)
    if (result.success && result.invoiceUrl) {
      setInvoiceResults(prev => ({ ...prev, [pkg.id]: { url: result.invoiceUrl as string } }))
      window.open(result.invoiceUrl, '_blank')
    } else {
      setInvoiceResults(prev => ({ ...prev, [pkg.id]: { error: result.error ?? 'Failed to create invoice' } }))
    }
  }

  const handleRowClick = useCallback(async (pkg: PackageDoc) => {
    if (expandedId === pkg.id) { setExpandedId(null); return }
    setExpandedId(pkg.id)
    setEditItems([...(pkg.lineItems ?? [])])
    setTemplateItems([])
    setSaveError(null)
    setConfirmDeleteId(null)
    setLoadingTemplate(true)
    try {
      const result = await getProposalWithTemplate(pkg.id)
      if (result.success) setTemplateItems(result.templateLineItems)
    } catch {}
    setLoadingTemplate(false)
  }, [expandedId])

  const toggleItem = (templateItem: LineItem) => {
    setEditItems(prev => {
      const idx = prev.findIndex(ei => ei.name === templateItem.name)
      if (idx >= 0) return prev.filter((_, i) => i !== idx)
      return [...prev, { ...templateItem }]
    })
  }

  const removeExtra = (idx: number) => setEditItems(prev => prev.filter((_, i) => i !== idx))

  const updateItemDescription = (name: string, desc: string) => {
    setEditItems(prev => prev.map(ei => ei.name === name ? { ...ei, description: desc } : ei))
  }

  const updateItemQuantity = (name: string, qty: number) => {
    setEditItems(prev => prev.map(ei => ei.name === name ? { ...ei, quantity: qty } : ei))
  }

  const handleSave = async (pkg: PackageDoc) => {
    setSaving(true)
    setSaveError(null)
    const result = await updatePackage({
      packageId: pkg.id,
      name: pkg.name,
      description: pkg.description ?? undefined,
      coverMessage: pkg.coverMessage ?? undefined,
      notes: pkg.notes ?? undefined,
      lineItems: editItems.map(item => ({ ...item, description: item.description ?? undefined })),
    })
    setSaving(false)
    if (!result.success) { setSaveError(result.error ?? 'Failed to save'); return }
  }

  const handleDelete = async (pkgId: string) => {
    if (confirmDeleteId !== pkgId) { setConfirmDeleteId(pkgId); return }
    setDeletingId(pkgId)
    const result = await deleteProposal(pkgId)
    setDeletingId(null)
    if (!result.success) { setSaveError(result.error ?? 'Failed to delete'); return }
    setExpandedId(null)
    setConfirmDeleteId(null)
    router.refresh()
  }

  const handleCopy = (pkgId: string) => {
    const url = `${window.location.origin}/u/${username}/packages/${pkgId}/print`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-base font-semibold text-white">Packages</h2>
          <span className="text-xs text-gray-600 tabular-nums">{packages.length}</span>
        </div>
        <AssignPackageModal clientId={clientId} />
      </div>

      {packages.length > 0 ? (
        <div className="space-y-4">
          {packages.map((pkg) => {
            const { oneTime, monthly, annual } = computeTotals(pkg.lineItems ?? [])
            const lineItems = pkg.lineItems ?? []
            const isExpanded = expandedId === pkg.id
            const hasItems = lineItems.length > 0
            const extraItems = editItems.filter(ei => !templateItems.some(ti => ti.name === ei.name))

            return (
              <div
                key={pkg.id}
                className={cn(
                  'rounded-2xl border overflow-hidden transition-all duration-300',
                  isExpanded ? 'border-[#67e8f9]/20' : 'border-white/[0.07] hover:border-white/[0.12]',
                )}
                style={{ background: 'linear-gradient(145deg, #191919 0%, #121212 100%)' }}
              >
                {/* Glow bar */}
                <div className={cn(
                  'h-px transition-all duration-500',
                  isExpanded
                    ? 'bg-gradient-to-r from-transparent via-[#67e8f9]/60 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-white/[0.06] to-transparent',
                )} />

                {/* Card header — click to expand */}
                <div
                  onClick={() => handleRowClick(pkg)}
                  className="px-7 pt-7 pb-6 cursor-pointer select-none"
                >
                  <p className="text-[10px] font-bold text-[#67e8f9]/60 uppercase tracking-[0.3em] mb-4">
                    Service Package
                  </p>

                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white leading-tight">{pkg.name}</h3>
                    {isExpanded
                      ? <ChevronUp className="size-4 text-gray-500 shrink-0 mt-1" />
                      : <ChevronDown className="size-4 text-gray-500 shrink-0 mt-1" />
                    }
                  </div>

                  {pkg.description && (
                    <p className="text-sm text-gray-400 leading-relaxed mb-6">{pkg.description}</p>
                  )}

                  {/* Pricing numbers */}
                  {hasItems && (oneTime > 0 || monthly > 0 || annual > 0) ? (
                    <div className="flex items-end gap-8 flex-wrap">
                      {oneTime > 0 && (
                        <div>
                          <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{fmt(oneTime)}</p>
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">one-time</p>
                        </div>
                      )}
                      {monthly > 0 && (
                        <div>
                          <div className="flex items-baseline gap-0.5">
                            <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{fmt(monthly)}</p>
                            <p className="text-lg text-gray-500 font-normal">/mo</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">per month</p>
                        </div>
                      )}
                      {annual > 0 && (
                        <div>
                          <div className="flex items-baseline gap-0.5">
                            <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{fmt(annual)}</p>
                            <p className="text-lg text-gray-500 font-normal">/yr</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">per year</p>
                        </div>
                      )}
                      <div className="pb-0.5">
                        <p className="text-3xl font-bold text-white">{lineItems.length}</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
                          {lineItems.length === 1 ? 'service' : 'services'}
                        </p>
                      </div>
                    </div>
                  ) : !hasItems ? (
                    <p className="text-sm text-gray-600 italic">No options selected — configure below</p>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-white">{lineItems.length}</p>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">services</p>
                    </div>
                  )}
                </div>

                {/* Expansion — edit controls */}
                {isExpanded && (
                  <>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
                    <div className="px-7 py-6 space-y-6" style={{ background: 'rgba(0,0,0,0.25)' }}>

                      {/* Share row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleCopy(pkg.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-white/[0.08] rounded-lg hover:text-white hover:border-white/[0.18] transition-all"
                        >
                          {copied ? <CheckCheck className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                          {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                        <Link
                          href={`/u/${username}/packages/${pkg.id}/print`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-white/[0.08] rounded-lg hover:text-[#67e8f9] hover:border-[#67e8f9]/30 transition-all"
                        >
                          <FileText className="size-3.5" />
                          View Package
                          <ArrowRight className="size-3" />
                        </Link>

                        {/* Create Invoice */}
                        {(() => {
                          const result = invoiceResults[pkg.id]
                          if (result && 'url' in result) {
                            return (
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/[0.06] rounded-lg hover:bg-emerald-500/10 transition-all"
                              >
                                <CheckCircle2 className="size-3.5" />
                                Invoice created
                                <ExternalLink className="size-3" />
                              </a>
                            )
                          }
                          if (invoiceConfirmId === pkg.id) {
                            return (
                              <div className="flex items-center gap-2">
                                <select
                                  value={getDays(pkg.id)}
                                  onChange={e => setDaysUntilDue(prev => ({ ...prev, [pkg.id]: Number(e.target.value) }))}
                                  className="appearance-none pl-2 pr-6 py-1.5 text-xs bg-white/[0.05] border border-white/[0.12] rounded-lg text-white focus:outline-none focus:border-[#67e8f9]/40 cursor-pointer"
                                  style={{ backgroundImage: 'none' }}
                                >
                                  <option value={7}>Due in 7 days</option>
                                  <option value={14}>Due in 14 days</option>
                                  <option value={30}>Due in 30 days</option>
                                  <option value={60}>Due in 60 days</option>
                                  <option value={90}>Due in 90 days</option>
                                </select>
                                <button
                                  onClick={() => setInvoiceConfirmId(null)}
                                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-1"
                                >
                                  ✕
                                </button>
                                <button
                                  onClick={() => handleCreateInvoice(pkg)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-[#67e8f9]/[0.1] border border-[#67e8f9]/30 text-[#67e8f9] rounded-lg hover:bg-[#67e8f9]/[0.18] transition-all"
                                >
                                  Confirm
                                </button>
                              </div>
                            )
                          }
                          return (
                            <div className="flex flex-col items-start gap-1">
                              <button
                                onClick={() => setInvoiceConfirmId(pkg.id)}
                                disabled={invoicingId === pkg.id || !editItems.length}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#67e8f9] border border-[#67e8f9]/25 bg-[#67e8f9]/[0.04] rounded-lg hover:bg-[#67e8f9]/[0.1] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                {invoicingId === pkg.id
                                  ? <Loader2 className="size-3.5 animate-spin" />
                                  : <Receipt className="size-3.5" />
                                }
                                {invoicingId === pkg.id ? 'Creating…' : 'Create Invoice'}
                              </button>
                              {result && 'error' in result && (
                                <p className="text-[10px] text-red-400 max-w-[180px] leading-snug">{result.error}</p>
                              )}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Options checklist */}
                      {loadingTemplate ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="size-3.5 text-gray-500 animate-spin" />
                          <span className="text-xs text-gray-600">Loading options…</span>
                        </div>
                      ) : (
                        <>
                          {templateItems.length > 0 && (
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">
                                Select services to include
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {templateItems.map((item, i) => {
                                  const editItem = editItems.find(ei => ei.name === item.name)
                                  const isSelected = !!editItem
                                  // Show user-edited qty/description if selected, otherwise template's
                                  const displayItem = editItem
                                    ? { ...item, description: editItem.description, quantity: editItem.quantity }
                                    : item
                                  return (
                                    <OptionCard
                                      key={i}
                                      item={displayItem}
                                      selected={isSelected}
                                      onToggle={() => toggleItem(item)}
                                      onQuantityChange={isSelected ? (qty) => updateItemQuantity(item.name, qty) : undefined}
                                      onDescriptionChange={isSelected ? (desc) => updateItemDescription(item.name, desc) : undefined}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {extraItems.length > 0 && (
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">
                                Custom Items
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {extraItems.map((item, i) => {
                                  const globalIdx = editItems.findIndex(ei => ei.name === item.name)
                                  const total = (item.price ?? 0) * (item.quantity ?? 1)
                                  return (
                                    <div key={i} className="flex flex-col gap-2.5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-white">{item.name}</p>
                                          {item.description && (
                                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => removeExtra(globalIdx)}
                                          className="size-6 flex items-center justify-center rounded-md text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                                        >
                                          <X className="size-3.5" />
                                        </button>
                                      </div>
                                      <div className="flex items-center justify-end">
                                        <span className="text-sm font-bold text-white tabular-nums font-mono">
                                          {fmt(total)}
                                          {item.isRecurring && (
                                            <span className="text-xs font-normal text-gray-500 font-sans">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {templateItems.length === 0 && editItems.length === 0 && (
                            <p className="text-xs text-gray-600 py-1">No source package found. Add items via the task manager.</p>
                          )}
                        </>
                      )}

                      {saveError && (
                        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                          {saveError}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <button
                          onClick={() => handleDelete(pkg.id)}
                          onBlur={() => setTimeout(() => setConfirmDeleteId(null), 300)}
                          disabled={!!deletingId}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-50',
                            confirmDeleteId === pkg.id
                              ? 'text-red-400 border-red-500/40 bg-red-500/10'
                              : 'text-gray-600 border-white/[0.06] hover:text-red-400 hover:border-red-500/30',
                          )}
                        >
                          {deletingId === pkg.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
                          {confirmDeleteId === pkg.id ? 'Confirm delete' : 'Delete'}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedId(null)}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSave(pkg)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#67e8f9]/[0.1] border border-[#67e8f9]/30 text-[#67e8f9] rounded-lg hover:bg-[#67e8f9]/[0.18] disabled:opacity-50 transition-colors"
                          >
                            {saving && <Loader2 className="size-3 animate-spin" />}
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07]"
          style={{ background: 'linear-gradient(145deg, #191919 0%, #121212 100%)' }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-64 rounded-full bg-[#67e8f9]/[0.02] blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center py-14 px-6">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-5">
              <Sparkles className="size-7 text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">No packages assigned</h3>
            <p className="text-gray-500 text-sm max-w-xs mb-6 leading-relaxed">
              Assign a service package to start building a custom offering for this client.
            </p>
            <AssignPackageModal clientId={clientId} />
          </div>
        </div>
      )}
    </section>
  )
}
