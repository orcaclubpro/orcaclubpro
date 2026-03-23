'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, ArrowRight, ChevronDown, ChevronUp,
  X, Check, Loader2, Trash2, Copy, CheckCheck, Sparkles,
  Receipt, ExternalLink, CheckCircle2, CalendarDays, ListOrdered,
  Mail, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssignPackageModal } from './AssignPackageModal'
import {
  getProposalWithTemplate,
  updatePackage,
  deleteProposal,
  createOrderFromPackage,
  savePaymentScheduleOnly,
  pushPackageSchedule,
  sendScheduledPayment,
  removeScheduleEntry,
  sendProposalEmail,
} from '@/actions/packages'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineItem {
  name: string
  description?: string | null
  price: number
  adjustedPrice?: number | null
  quantity?: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

interface ScheduledEntry {
  id: string
  label: string
  amount: number
  dueDate?: string | null
  orderId?: string | null
  invoicedAt?: string | null
}

interface PackageDoc {
  id: string
  name: string
  description?: string | null
  coverMessage?: string | null
  notes?: string | null
  status: string
  lineItems?: LineItem[]
  requestedItems?: Array<{ name: string; requestedAt?: string }>
  paymentSchedule?: ScheduledEntry[]
  projectRef?: string | { id: string; name: string } | null
  createdAt: string
}

interface PackageOrderSummary {
  id: string
  orderNumber?: string | null
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  invoiceType?: string | null
  invoiceNote?: string | null
  stripeInvoiceUrl?: string | null
  createdAt: string
}

interface ClientPackagesTabProps {
  packages: PackageDoc[]
  clientId: string
  username: string
  projects?: Array<{ id: string; name: string; status: string }>
  packageOrders?: Record<string, PackageOrderSummary[]>
}

type Frequency = 'monthly' | 'biweekly' | 'weekly' | 'custom'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtExact(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
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

/** Generate installment due dates from a start date and frequency.
 *  When `startAtDate` is true (deposit is set), installment 1 falls ON the
 *  start date (offset = i).  Without a deposit the start date is treated as
 *  the period anchor and installment 1 falls one period later (offset = i+1). */
function generateInstallmentDates(startDate: string, count: number, frequency: Frequency, startAtDate = false): string[] {
  if (!startDate || count === 0 || frequency === 'custom') return Array(count).fill('')
  const [y, m, d] = startDate.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const offset = startAtDate ? i : i + 1
    let date: Date
    if (frequency === 'monthly') {
      date = new Date(y, m - 1 + offset, d)
    } else if (frequency === 'biweekly') {
      date = new Date(y, m - 1, d + 14 * offset)
    } else {
      // weekly
      date = new Date(y, m - 1, d + 7 * offset)
    }
    const yy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
  })
}

/** Compute installment amounts — last one absorbs rounding. */
function computeInstallmentAmounts(remaining: number, count: number): number[] {
  if (count <= 0 || remaining <= 0) return Array(count).fill(0)
  const base = Math.floor((remaining / count) * 100) / 100
  const last = Math.round((remaining - base * (count - 1)) * 100) / 100
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? last : base))
}

function formatDisplayDate(isoDate: string) {
  if (!isoDate) return ''
  // split('T')[0] strips time — Payload stores date fields as full ISO strings
  const parts = isoDate.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return ''
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d)
  if (!isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

// ── OptionCard ────────────────────────────────────────────────────────────────

function OptionCard({
  item,
  selected,
  requested,
  onToggle,
  onDescriptionChange,
  onQuantityChange,
  onAdjustedPriceChange,
}: {
  item: LineItem
  selected: boolean
  requested?: boolean
  onToggle: () => void
  onDescriptionChange?: (desc: string) => void
  onQuantityChange?: (qty: number) => void
  onAdjustedPriceChange?: (price: number | null) => void
}) {
  const qty = item.quantity ?? 1
  const basePrice = item.price ?? 0
  const unitPrice = item.adjustedPrice ?? basePrice
  const total = unitPrice * qty
  const baseTotal = basePrice * qty
  const hasDiscount = item.adjustedPrice != null && item.adjustedPrice !== basePrice
  return (
    <div className={cn(
      'w-full flex flex-col rounded-xl border text-left transition-all duration-150',
      selected
        ? 'bg-[rgba(255,255,255,0.03)] border-[rgba(139,156,182,0.15)]'
        : 'border-[#404040] hover:border-[#404040] hover:bg-[#2D2D2D]',
    )}>
      <button type="button" onClick={onToggle} className="flex flex-col gap-2.5 p-4 text-left w-full">
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-0.5 size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
            selected ? 'bg-[rgba(139,156,182,0.10)] border-[rgba(139,156,182,0.30)]' : 'border-[#404040]',
          )}>
            {selected && <Check className="size-3" style={{ color: 'var(--space-accent)' }} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold leading-snug', selected ? 'text-[#F0F0F0]' : 'text-[#6B6B6B]')}>
              {item.name}
            </p>
            {requested && !selected && (
              <span className="inline-flex items-center gap-1 mt-1 text-[9px] text-amber-400/80 bg-amber-400/[0.08] border border-amber-400/20 rounded px-1.5 py-0.5 font-semibold uppercase tracking-widest">
                Requested by client
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pl-8">
          {item.isRecurring && (
            <span className={cn(
              'text-[10px] rounded-full px-1.5 py-0.5 uppercase tracking-wide font-medium',
              selected
                ? 'border border-[rgba(139,156,182,0.15)] bg-[rgba(139,156,182,0.06)]'
                : 'text-[#4A4A4A] bg-[#2D2D2D] border border-[#404040]',
            )} style={selected ? { color: 'var(--space-accent)', opacity: 0.8 } : {}}>
              {item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
            </span>
          )}
          <div className="ml-auto flex flex-col items-end gap-0.5">
            {hasDiscount && (
              <span className="text-[11px] font-mono tabular-nums text-[#4A4A4A] line-through leading-none">
                {fmt(baseTotal)}
                {item.isRecurring && (
                  <span className="font-sans">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
                )}
              </span>
            )}
            <span className={cn(
              'text-sm font-bold font-mono tabular-nums leading-none',
              hasDiscount ? '' : selected ? 'text-[#F0F0F0]' : 'text-[#4A4A4A]'
            )} style={hasDiscount ? { color: 'var(--space-accent)' } : {}}>
              {fmt(total)}
              {item.isRecurring && (
                <span className="text-xs font-normal text-[#4A4A4A] font-sans">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
              )}
            </span>
          </div>
        </div>
      </button>

      {selected && (onQuantityChange || onDescriptionChange || onAdjustedPriceChange) && (
        <div className="px-4 pb-4 pt-0" onClick={e => e.stopPropagation()}>
          <div className="h-px bg-[#333333] mb-3" />
          <div className="flex flex-col gap-2">
            {onAdjustedPriceChange && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-medium">Adjusted Price</span>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    'flex items-center gap-1 border rounded-md px-2 h-7 transition-colors',
                    item.adjustedPrice != null ? 'border-[rgba(139,156,182,0.20)] bg-[rgba(139,156,182,0.04)]' : 'border-[#404040] bg-[#2D2D2D]'
                  )}>
                    <span className={cn('text-[10px] shrink-0', item.adjustedPrice != null ? '' : 'text-[#4A4A4A]')} style={item.adjustedPrice != null ? { color: 'var(--space-accent)', opacity: 0.7 } : {}}>$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.adjustedPrice ?? ''}
                      onChange={e => {
                        const v = e.target.value
                        onAdjustedPriceChange(v === '' ? null : parseFloat(v))
                      }}
                      placeholder={String(item.price ?? 0)}
                      className="w-20 text-xs bg-transparent text-[#F0F0F0] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  {item.adjustedPrice != null && (
                    <button
                      type="button"
                      onClick={() => onAdjustedPriceChange(null)}
                      className="size-5 flex items-center justify-center text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors"
                      title="Reset to base price"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
            {onQuantityChange && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-medium">Quantity</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(Math.max(1, qty - 1))}
                    className="size-6 flex items-center justify-center rounded-md text-[#4A4A4A] hover:text-[#F0F0F0] hover:bg-[#2D2D2D] transition-colors text-sm leading-none"
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 1) onQuantityChange(v)
                    }}
                    className="w-10 text-center text-xs bg-[#2D2D2D] border border-[#404040] rounded-md text-[#F0F0F0] py-1 focus:outline-none focus:border-[rgba(139,156,182,0.20)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => onQuantityChange(qty + 1)}
                    className="size-6 flex items-center justify-center rounded-md text-[#4A4A4A] hover:text-[#F0F0F0] hover:bg-[#2D2D2D] transition-colors text-sm leading-none"
                  >+</button>
                  {qty > 1 && (
                    <span className="text-[10px] text-[#4A4A4A] ml-1 tabular-nums">× {fmt(unitPrice)} ea</span>
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
                className="w-full px-3 py-2 text-xs bg-[#2D2D2D] border border-[#404040] rounded-lg text-[#A0A0A0] placeholder:text-[#4A4A4A] focus:outline-none focus:border-[rgba(139,156,182,0.20)] resize-none leading-relaxed transition-colors"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ClientPackagesTab({ packages, clientId, username, projects, packageOrders }: ClientPackagesTabProps) {
  const router = useRouter()

  // Core UI state
  const [expandedId, setExpandedId]           = useState<string | null>(null)
  const [editItems, setEditItems]             = useState<LineItem[]>([])
  const [templateItems, setTemplateItems]     = useState<LineItem[]>([])
  const [requestedItemNames, setRequestedItemNames] = useState<Set<string>>(new Set())
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [saving, setSaving]                   = useState(false)
  const [saveError, setSaveError]             = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId]           = useState<string | null>(null)
  const [copied, setCopied]                   = useState(false)
  const [invoicingId, setInvoicingId]         = useState<string | null>(null)
  const [invoiceResults, setInvoiceResults]   = useState<Record<string, { url: string } | { error: string }>>({})
  const [daysUntilDue, setDaysUntilDue]       = useState<Record<string, number>>({})
  const [selectedProjectId, setSelectedProjectId] = useState<Record<string, string>>({})

  // Mode: 'full' (Quick Invoice) | 'schedule' (Payment Schedule)
  const [invoiceMode, setInvoiceMode] = useState<Record<string, 'full' | 'schedule'>>({})

  // Payment schedule builder state
  const [scheduleDeposit, setScheduleDeposit]           = useState<Record<string, string>>({})
  const [scheduleDepositDate, setScheduleDepositDate]   = useState<Record<string, string>>({})
  const [scheduleInstallments, setScheduleInstallments] = useState<Record<string, number>>({})
  const [scheduleFrequency, setScheduleFrequency]       = useState<Record<string, Frequency>>({})
  const [scheduleStartDate, setScheduleStartDate]       = useState<Record<string, string>>({})
  const [installmentDates, setInstallmentDates]         = useState<Record<string, string[]>>({})
  const [savingSchedule, setSavingSchedule]             = useState(false)
  const [pushingScheduleId, setPushingScheduleId]       = useState<string | null>(null)
  const [pushScheduleResult, setPushScheduleResult]     = useState<Record<string, string | null>>({})
  const [scheduleError, setScheduleError]               = useState<Record<string, string | null>>({})
  const [sendingEntryId, setSendingEntryId]             = useState<string | null>(null)
  const [removingEntryId, setRemovingEntryId]           = useState<string | null>(null)
  const [entryResults, setEntryResults]                 = useState<Record<string, { url: string } | { error: string }>>({})

  // Email proposal modal state
  const [emailModalPkgId, setEmailModalPkgId]   = useState<string | null>(null)
  const [emailAddresses, setEmailAddresses]       = useState('')
  const [emailSending, setEmailSending]           = useState(false)
  const [emailResult, setEmailResult]             = useState<{ sent?: number; error?: string } | null>(null)

  const getDays = (pkgId: string) => daysUntilDue[pkgId] ?? 30
  const getMode = (pkgId: string) => invoiceMode[pkgId] ?? 'full'
  const getFrequency = (pkgId: string): Frequency => scheduleFrequency[pkgId] ?? 'monthly'
  const getNumInstallments = (pkgId: string) => scheduleInstallments[pkgId] ?? 1

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateInvoice = async (pkg: PackageDoc) => {
    setInvoicingId(pkg.id)
    // Save selected line items first so the action reads fresh data
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
    const projectId = selectedProjectId[pkg.id] || undefined
    const result = await createOrderFromPackage(pkg.id, getDays(pkg.id), projectId)
    setInvoicingId(null)
    if (result.success && result.invoiceUrl) {
      setInvoiceResults(prev => ({ ...prev, [pkg.id]: { url: result.invoiceUrl as string } }))
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
    // Pre-populate project selection from saved value
    const existingProjectId = pkg.projectRef
      ? (typeof pkg.projectRef === 'string' ? pkg.projectRef : pkg.projectRef.id)
      : ''
    setSelectedProjectId(prev => ({ ...prev, [pkg.id]: existingProjectId }))
    setLoadingTemplate(true)
    try {
      const result = await getProposalWithTemplate(pkg.id)
      if (result.success) {
        setTemplateItems(result.templateLineItems)
        setRequestedItemNames(new Set((result.requestedItems ?? []).map((r: any) => r.name)))
      }
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

  const updateItemDescription = (name: string, desc: string) =>
    setEditItems(prev => prev.map(ei => ei.name === name ? { ...ei, description: desc } : ei))

  const updateItemQuantity = (name: string, qty: number) =>
    setEditItems(prev => prev.map(ei => ei.name === name ? { ...ei, quantity: qty } : ei))

  const updateItemAdjustedPrice = (name: string, price: number | null) =>
    setEditItems(prev => prev.map(ei => ei.name === name ? { ...ei, adjustedPrice: price } : ei))

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
      projectRef: selectedProjectId[pkg.id] || null,
    })
    if (!result.success) {
      setSaving(false)
      setSaveError(result.error ?? 'Failed to save')
      return
    }

    // In schedule mode, recompute and persist schedule entries from the builder UI
    if (getMode(pkg.id) === 'schedule') {
      const frequency = getFrequency(pkg.id)
      const startDate = scheduleStartDate[pkg.id] ?? ''
      const depositStr = scheduleDeposit[pkg.id] ?? ''
      const depositVal = depositStr !== '' ? parseFloat(depositStr) : 0
      const hasDeposit = depositStr !== '' && !isNaN(depositVal) && depositVal > 0
      const deposit = hasDeposit ? depositVal : 0
      const { oneTime } = computeTotals(editItems.length > 0 ? editItems : (pkg.lineItems ?? []))
      const numInstallments = getNumInstallments(pkg.id)
      const remaining = Math.max(0, oneTime - deposit)
      const amounts = computeInstallmentAmounts(remaining, numInstallments)
      const dates = frequency !== 'custom'
        ? (startDate ? generateInstallmentDates(startDate, numInstallments, frequency, hasDeposit) : Array(numInstallments).fill(''))
        : (installmentDates[pkg.id] ?? [])

      const entries: Array<{ label: string; amount: number; dueDate?: string }> = [
        ...(hasDeposit ? [{ label: 'Deposit', amount: deposit, dueDate: scheduleDepositDate[pkg.id] || undefined }] : []),
        ...Array.from({ length: numInstallments }, (_, i) => ({
          label: numInstallments === 1 ? 'Balance' : i === numInstallments - 1 ? 'Final Payment' : `Installment ${i + 1}`,
          amount: amounts[i],
          dueDate: dates[i] || undefined,
        })),
      ]

      if (entries.length > 0) {
        await savePaymentScheduleOnly(pkg.id, entries)
      }
    }

    setSaving(false)
    router.refresh()
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

  const handleEmailProposal = async () => {
    if (!emailModalPkgId) return
    const emails = emailAddresses.split(',').map(e => e.trim()).filter(e => e.includes('@'))
    if (emails.length === 0) return
    setEmailSending(true)
    setEmailResult(null)
    const result = await sendProposalEmail(emailModalPkgId, emails)
    setEmailSending(false)
    if ('sent' in result && result.sent > 0) {
      setEmailResult({ sent: result.sent })
      setTimeout(() => {
        setEmailModalPkgId(null)
        setEmailAddresses('')
        setEmailResult(null)
      }, 2500)
    } else {
      setEmailResult({ error: ('error' in result ? result.error : undefined) ?? 'Failed to send' })
    }
  }

  const handleFrequencyChange = (pkgId: string, freq: Frequency) => {
    setScheduleFrequency(prev => ({ ...prev, [pkgId]: freq }))
    if (freq === 'custom') {
      // Pre-fill with monthly-computed dates if we have a start date
      const startDate = scheduleStartDate[pkgId] ?? ''
      const n = getNumInstallments(pkgId)
      const depositVal = parseFloat(scheduleDeposit[pkgId] ?? '') || 0
      const computed = generateInstallmentDates(startDate, n, 'monthly', depositVal > 0)
      setInstallmentDates(prev => ({ ...prev, [pkgId]: computed }))
    }
  }

  const handleInstallmentCountChange = (pkgId: string, count: number) => {
    setScheduleInstallments(prev => ({ ...prev, [pkgId]: count }))
    // Resize custom dates array to match new count (preserve existing)
    setInstallmentDates(prev => {
      const existing = prev[pkgId] ?? []
      return { ...prev, [pkgId]: Array.from({ length: count }, (_, i) => existing[i] ?? '') }
    })
  }

  const handleCustomDateChange = (pkgId: string, idx: number, date: string) => {
    setInstallmentDates(prev => {
      const existing = [...(prev[pkgId] ?? [])]
      existing[idx] = date
      return { ...prev, [pkgId]: existing }
    })
  }

  const handlePushSchedule = async (pkgId: string) => {
    setPushScheduleResult(prev => ({ ...prev, [pkgId]: null }))
    setPushingScheduleId(pkgId)
    const result = await pushPackageSchedule(pkgId)
    setPushingScheduleId(null)
    if (result.success) {
      setPushScheduleResult(prev => ({ ...prev, [pkgId]: `${result.count} invoice${(result.count ?? 0) !== 1 ? 's' : ''} sent` }))
      router.refresh()
    } else {
      setScheduleError(prev => ({ ...prev, [pkgId]: result.error ?? 'Failed to push schedule' }))
    }
  }

  const handleSendScheduledPayment = async (pkgId: string, entryId: string, projectId?: string) => {
    setSendingEntryId(entryId)
    const result = await sendScheduledPayment(pkgId, entryId, projectId)
    setSendingEntryId(null)
    if (result.success && result.invoiceUrl) {
      setEntryResults(prev => ({ ...prev, [entryId]: { url: result.invoiceUrl as string } }))
      router.refresh()
    } else {
      setEntryResults(prev => ({ ...prev, [entryId]: { error: result.error ?? 'Failed to send invoice' } }))
    }
  }

  const handleRemoveScheduleEntry = async (pkgId: string, entryId: string) => {
    setRemovingEntryId(entryId)
    const result = await removeScheduleEntry(pkgId, entryId)
    setRemovingEntryId(null)
    if (result.success) {
      router.refresh()
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-base font-semibold text-[#F0F0F0]">Packages</h2>
          <span className="text-xs text-[#4A4A4A] tabular-nums">{packages.length}</span>
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
            const pendingRequests = (pkg.requestedItems ?? []).filter(
              r => !lineItems.some(li => li.name === r.name)
            ).length

            // Invoice progress
            const pkgOrders = packageOrders?.[pkg.id] ?? []
            const invoicedAmount = pkgOrders.reduce((s, o) => s + (o.amount ?? 0), 0)
            const paidAmount = pkgOrders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.amount ?? 0), 0)
            // For the schedule builder use editItems when this card is expanded
            const { oneTime: editOneTime } = computeTotals(expandedId === pkg.id && editItems.length > 0 ? editItems : (pkg.lineItems ?? []))
            const packageTotal = editOneTime
            const invoicedPct = packageTotal > 0 ? Math.min(100, (invoicedAmount / packageTotal) * 100) : 0
            const paidPct = packageTotal > 0 ? Math.min(100, (paidAmount / packageTotal) * 100) : 0

            const mode = getMode(pkg.id)

            // Schedule builder computed values
            const schDeposit = parseFloat(scheduleDeposit[pkg.id] ?? '') || 0
            const schInstallments = getNumInstallments(pkg.id)
            const schFrequency = getFrequency(pkg.id)
            const schStartDate = scheduleStartDate[pkg.id] ?? ''
            const schRemaining = packageTotal > 0 ? packageTotal - schDeposit : 0
            const schAmounts = computeInstallmentAmounts(schRemaining > 0 ? schRemaining : 0, schInstallments)
            const schComputedDates = schFrequency !== 'custom'
              ? generateInstallmentDates(schStartDate, schInstallments, schFrequency, schDeposit > 0)
              : (installmentDates[pkg.id] ?? [])
            const schTotalScheduled = schDeposit + schAmounts.reduce((s, a) => s + a, 0)
            const schTotalMatches = packageTotal <= 0 || Math.abs(schTotalScheduled - packageTotal) < 0.02

            return (
              <div
                key={pkg.id}
                className={cn(
                  'rounded-2xl border overflow-hidden transition-all duration-300',
                  isExpanded ? 'border-[rgba(139,156,182,0.15)]' : 'border-[#404040] hover:border-[#404040]',
                )}
                style={{ background: '#252525' }}
              >
                {/* Glow bar */}
                <div className={cn(
                  'h-px transition-all duration-500',
                  isExpanded
                    ? 'bg-gradient-to-r from-transparent via-[var(--space-accent)]/30 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-[#333333] to-transparent',
                )} />

                {/* Card header */}
                <div onClick={() => handleRowClick(pkg)} className="px-7 pt-7 pb-6 cursor-pointer select-none">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--space-accent)', opacity: 0.6 }}>
                    Service Package
                  </p>

                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-xl font-bold text-[#F0F0F0] leading-tight">{pkg.name}</h3>
                    <div className="flex items-center gap-2 shrink-0 mt-1">
                      {pendingRequests > 0 && (
                        <span className="text-[10px] text-amber-400 bg-amber-400/[0.08] border border-amber-400/25 rounded px-1.5 py-0.5 font-medium">
                          {pendingRequests} request{pendingRequests !== 1 ? 's' : ''}
                        </span>
                      )}
                      {isExpanded
                        ? <ChevronUp className="size-4 text-[#4A4A4A]" />
                        : <ChevronDown className="size-4 text-[#4A4A4A]" />
                      }
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">{pkg.description}</p>
                  )}

                  {/* Pricing */}
                  {hasItems && (oneTime > 0 || monthly > 0 || annual > 0) ? (
                    <div className="flex items-end gap-8 flex-wrap">
                      {oneTime > 0 && (
                        <div>
                          <p className="text-3xl font-bold text-[#F0F0F0] tabular-nums tracking-tight">{fmt(oneTime)}</p>
                          <p className="text-xs text-[#4A4A4A] mt-1 uppercase tracking-widest">one-time</p>
                        </div>
                      )}
                      {monthly > 0 && (
                        <div>
                          <div className="flex items-baseline gap-0.5">
                            <p className="text-3xl font-bold text-[#F0F0F0] tabular-nums tracking-tight">{fmt(monthly)}</p>
                            <p className="text-lg text-[#4A4A4A] font-normal">/mo</p>
                          </div>
                          <p className="text-xs text-[#4A4A4A] mt-1 uppercase tracking-widest">per month</p>
                        </div>
                      )}
                      {annual > 0 && (
                        <div>
                          <div className="flex items-baseline gap-0.5">
                            <p className="text-3xl font-bold text-[#F0F0F0] tabular-nums tracking-tight">{fmt(annual)}</p>
                            <p className="text-lg text-[#4A4A4A] font-normal">/yr</p>
                          </div>
                          <p className="text-xs text-[#4A4A4A] mt-1 uppercase tracking-widest">per year</p>
                        </div>
                      )}
                      <div className="pb-0.5">
                        <p className="text-3xl font-bold text-[#F0F0F0]">{lineItems.length}</p>
                        <p className="text-xs text-[#4A4A4A] mt-1 uppercase tracking-widest">
                          {lineItems.length === 1 ? 'service' : 'services'}
                        </p>
                      </div>
                    </div>
                  ) : !hasItems ? (
                    <p className="text-sm text-[#4A4A4A] italic">No options selected — configure below</p>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-[#F0F0F0]">{lineItems.length}</p>
                      <p className="text-xs text-[#4A4A4A] mt-1 uppercase tracking-widest">services</p>
                    </div>
                  )}

                  {/* Progress bar */}
                  {pkgOrders.length > 0 && packageTotal > 0 && (
                    <div className="mt-5 space-y-1.5" onClick={e => e.stopPropagation()}>
                      <div className="h-1.5 w-full rounded-full bg-[#333333] overflow-hidden">
                        <div className="h-full rounded-full flex">
                          {paidPct > 0 && (
                            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${paidPct}%` }} />
                          )}
                          {(invoicedPct - paidPct) > 0 && (
                            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${invoicedPct - paidPct}%` }} />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#4A4A4A] tabular-nums">
                        <span>
                          <span className={paidAmount > 0 ? 'text-emerald-400' : ''}>{fmt(invoicedAmount)}</span>
                          {' '}invoiced
                        </span>
                        <span>{fmt(packageTotal - invoicedAmount)} remaining</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expansion panel */}
                {isExpanded && (
                  <>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#333333] to-transparent" />
                    <div className="px-7 py-6 space-y-6 bg-[#2D2D2D]">

                      {/* Share row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleCopy(pkg.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#404040] rounded-lg hover:text-[#F0F0F0] hover:border-[#404040] transition-all"
                        >
                          {copied ? <CheckCheck className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                          {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                        <Link
                          href={`/u/${username}/packages/${pkg.id}/print`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#404040] rounded-lg hover:border-[rgba(139,156,182,0.18)] transition-all"
                          style={{ color: undefined }}
                        >
                          <FileText className="size-3.5" />
                          View Package
                          <ArrowRight className="size-3" />
                        </Link>
                        <button
                          onClick={() => { setEmailModalPkgId(pkg.id); setEmailAddresses(''); setEmailResult(null) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6B6B6B] border border-[#404040] rounded-lg hover:border-[rgba(139,156,182,0.18)] transition-all"
                        >
                          <Mail className="size-3.5" />
                          Email Proposal
                        </button>
                      </div>

                      {/* Project link */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold shrink-0">
                          Link to project
                        </span>
                        {projects && projects.length > 0 ? (
                          <select
                            value={selectedProjectId[pkg.id] ?? ''}
                            onChange={e => setSelectedProjectId(prev => ({ ...prev, [pkg.id]: e.target.value }))}
                            className="flex-1 max-w-[220px] appearance-none px-3 py-1.5 text-xs bg-[#252525] border border-[#404040] rounded-lg text-[#F0F0F0] focus:outline-none focus:border-[rgba(139,156,182,0.20)]"
                          >
                            <option value="">No project</option>
                            {projects.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] text-[#4A4A4A] italic">No projects yet</span>
                        )}
                      </div>

                      {/* Line item checklist */}
                      {loadingTemplate ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="size-3.5 text-[#4A4A4A] animate-spin" />
                          <span className="text-xs text-[#4A4A4A]">Loading options…</span>
                        </div>
                      ) : (
                        <>
                          {templateItems.length > 0 && (
                            <div>
                              <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold mb-3">
                                Select services to include
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {templateItems.map((item, i) => {
                                  const editItem = editItems.find(ei => ei.name === item.name)
                                  const isSelected = !!editItem
                                  const displayItem = editItem
                                    ? { ...item, description: editItem.description, quantity: editItem.quantity, adjustedPrice: editItem.adjustedPrice }
                                    : item
                                  return (
                                    <OptionCard
                                      key={i}
                                      item={displayItem}
                                      selected={isSelected}
                                      requested={requestedItemNames.has(item.name)}
                                      onToggle={() => toggleItem(item)}
                                      onQuantityChange={isSelected ? (qty) => updateItemQuantity(item.name, qty) : undefined}
                                      onDescriptionChange={isSelected ? (desc) => updateItemDescription(item.name, desc) : undefined}
                                      onAdjustedPriceChange={isSelected ? (price) => updateItemAdjustedPrice(item.name, price) : undefined}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {extraItems.length > 0 && (
                            <div>
                              <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold mb-3">
                                Custom Items
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {extraItems.map((item, i) => {
                                  const globalIdx = editItems.findIndex(ei => ei.name === item.name)
                                  const total = (item.price ?? 0) * (item.quantity ?? 1)
                                  return (
                                    <div key={i} className="flex flex-col gap-2.5 p-4 rounded-xl bg-[#252525] border border-[#404040]">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-[#F0F0F0]">{item.name}</p>
                                          {item.description && (
                                            <p className="text-[11px] text-[#4A4A4A] mt-0.5 line-clamp-2">{item.description}</p>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => removeExtra(globalIdx)}
                                          className="size-6 flex items-center justify-center rounded-md text-[#4A4A4A] hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                                        >
                                          <X className="size-3.5" />
                                        </button>
                                      </div>
                                      <div className="flex items-center justify-end">
                                        <span className="text-sm font-bold text-[#F0F0F0] tabular-nums font-mono">
                                          {fmt(total)}
                                          {item.isRecurring && (
                                            <span className="text-xs font-normal text-[#4A4A4A] font-sans">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
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
                            <p className="text-xs text-[#4A4A4A] py-1">No source package found. Add items via the task manager.</p>
                          )}
                        </>
                      )}

                      {/* ── Payment Schedule Overview ────────────────────── */}
                      {pkg.paymentSchedule && pkg.paymentSchedule.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-[#404040]">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">
                              Payment Schedule
                            </p>
                            <span className="text-[10px] text-[#4A4A4A] tabular-nums">
                              {pkg.paymentSchedule.filter(e => e.orderId && e.invoicedAt).length}/{pkg.paymentSchedule.length} invoiced
                            </span>
                          </div>
                          <div className="rounded-xl border border-[#404040] overflow-hidden divide-y divide-[#333333]">
                            {pkg.paymentSchedule.map((entry) => {
                              const isInvoiced = !!(entry.orderId && entry.invoicedAt)
                              return (
                                <div key={entry.id} className="flex items-center gap-3 px-3.5 py-2.5">
                                  <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                                    <span className="text-xs text-[#A0A0A0] font-medium">{entry.label}</span>
                                    <span className="text-xs text-[#F0F0F0] tabular-nums font-mono shrink-0">{fmtExact(entry.amount)}</span>
                                    {entry.dueDate && (
                                      <span className="flex items-center gap-1 text-[10px] text-[#4A4A4A] shrink-0">
                                        <CalendarDays className="size-3" />
                                        {formatDisplayDate(entry.dueDate)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="shrink-0 flex items-center gap-2">
                                    {isInvoiced ? (
                                      <span className="text-[10px] text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20 rounded px-1.5 py-0.5 font-semibold">
                                        Invoiced
                                      </span>
                                    ) : (
                                      <>
                                        <span className="text-[10px] text-amber-400 bg-amber-400/[0.06] border border-amber-400/20 rounded px-1.5 py-0.5 font-semibold">
                                          Pending
                                        </span>
                                        <button
                                          type="button"
                                          disabled={removingEntryId === entry.id}
                                          onClick={() => handleRemoveScheduleEntry(pkg.id, entry.id)}
                                          className="flex items-center justify-center size-6 text-[#4A4A4A] hover:text-red-400 hover:bg-red-400/[0.08] rounded transition-all disabled:opacity-40"
                                          title="Remove entry"
                                        >
                                          {removingEntryId === entry.id
                                            ? <Loader2 className="size-3 animate-spin" />
                                            : <Trash2 className="size-3" />
                                          }
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── Invoice type selector ───────────────────────────── */}
                      <div className="space-y-4 pt-1 border-t border-[#404040]">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold shrink-0">
                            Invoice Type
                          </span>
                          <div className="flex items-center rounded-lg border border-[#404040] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setInvoiceMode(prev => ({ ...prev, [pkg.id]: 'full' }))}
                              className={cn(
                                'px-3 py-1.5 text-xs font-medium transition-all border-r',
                                mode === 'full'
                                  ? 'bg-[rgba(139,156,182,0.10)] border-[rgba(139,156,182,0.15)]'
                                  : 'text-[#4A4A4A] hover:text-[#A0A0A0] border-[#404040]',
                              )}
                              style={mode === 'full' ? { color: 'var(--space-accent)' } : {}}
                            >
                              Quick Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() => setInvoiceMode(prev => ({ ...prev, [pkg.id]: 'schedule' }))}
                              className={cn(
                                'px-3 py-1.5 text-xs font-medium transition-all',
                                mode === 'schedule'
                                  ? 'bg-[rgba(139,156,182,0.10)]'
                                  : 'text-[#4A4A4A] hover:text-[#A0A0A0]',
                              )}
                              style={mode === 'schedule' ? { color: 'var(--space-accent)' } : {}}
                            >
                              Payment Schedule
                            </button>
                          </div>
                        </div>

                        {/* ── Payment Schedule Builder ────────────────────── */}
                        {mode === 'schedule' && (
                          <div className="space-y-5">

                            {/* Row 1: Deposit amount + due date */}
                            <div className="space-y-2">
                              <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">Deposit</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center rounded-lg border border-[#404040] overflow-hidden">
                                  <span className="px-2.5 py-1.5 text-xs text-[#4A4A4A] bg-[#2D2D2D] border-r border-[#404040]">$</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={scheduleDeposit[pkg.id] ?? ''}
                                    onChange={e => setScheduleDeposit(prev => ({ ...prev, [pkg.id]: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-28 px-2 py-1.5 text-xs bg-[#252525] text-[#F0F0F0] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </div>
                                <input
                                  type="date"
                                  value={scheduleDepositDate[pkg.id] ?? ''}
                                  onChange={e => setScheduleDepositDate(prev => ({ ...prev, [pkg.id]: e.target.value }))}
                                  className="px-3 py-1.5 text-xs bg-[#252525] border border-[#404040] rounded-lg text-[#F0F0F0] focus:outline-none focus:border-[rgba(139,156,182,0.20)] [color-scheme:light]"
                                />
                                {packageTotal > 0 && schDeposit > 0 && (
                                  <span className="text-[10px] text-[#4A4A4A] tabular-nums">
                                    {fmt(schDeposit)} of {fmt(packageTotal)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Row 2: Installments count + frequency (always visible) */}
                            <div className="space-y-2">
                              <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">
                                Installments
                                {packageTotal > 0 && (
                                  <span className="ml-2 font-mono normal-case text-[#F0F0F0]">
                                    {schDeposit > 0 ? `${fmt(schRemaining)} remaining` : fmt(packageTotal)}
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center rounded-lg border border-[#404040] overflow-hidden">
                                  <span className="px-2.5 py-1.5 text-[10px] text-[#4A4A4A] bg-[#2D2D2D] border-r border-[#404040] uppercase tracking-wide">
                                    Split into
                                  </span>
                                  <select
                                    value={schInstallments}
                                    onChange={e => handleInstallmentCountChange(pkg.id, Number(e.target.value))}
                                    className="appearance-none px-2 py-1.5 text-xs bg-[#252525] text-[#F0F0F0] focus:outline-none pr-5"
                                  >
                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                                      <option key={n} value={n}>{n} {n === 1 ? 'payment' : 'payments'}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Frequency tabs */}
                                <div className="flex items-center rounded-lg border border-[#404040] overflow-hidden">
                                  {(['monthly', 'biweekly', 'weekly', 'custom'] as const).map((freq, fi, arr) => (
                                    <button
                                      key={freq}
                                      type="button"
                                      onClick={() => handleFrequencyChange(pkg.id, freq)}
                                      className={cn(
                                        'px-2.5 py-1.5 text-xs font-medium transition-all',
                                        fi < arr.length - 1 ? 'border-r' : '',
                                        schFrequency === freq
                                          ? 'bg-[#2D2D2D] text-[#F0F0F0] border-[#404040]'
                                          : 'text-[#4A4A4A] hover:text-[#A0A0A0] border-[#404040]',
                                      )}
                                    >
                                      {freq === 'biweekly' ? 'Bi-weekly'
                                        : freq === 'monthly' ? 'Monthly'
                                        : freq === 'weekly' ? 'Weekly'
                                        : 'Custom'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Start date (non-custom) */}
                              {schFrequency !== 'custom' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] text-[#4A4A4A]">First payment due:</span>
                                  <input
                                    type="date"
                                    value={schStartDate}
                                    onChange={e => setScheduleStartDate(prev => ({ ...prev, [pkg.id]: e.target.value }))}
                                    className="px-3 py-1.5 text-xs bg-[#252525] border border-[#404040] rounded-lg text-[#F0F0F0] focus:outline-none focus:border-[rgba(139,156,182,0.20)] [color-scheme:light]"
                                  />
                                  {schAmounts[0] > 0 && (
                                    <span className="text-[10px] text-[#4A4A4A] tabular-nums">
                                      = {fmtExact(schAmounts[0])} each
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Schedule Preview */}
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">Schedule Preview</p>

                              <div className="rounded-xl border border-[#404040] overflow-hidden divide-y divide-[#333333]">
                                {/* Deposit row — only shown when a deposit amount is entered */}
                                {schDeposit > 0 && (
                                  <div className="flex items-center gap-3 px-4 py-2.5 bg-[#252525]">
                                    <span className="text-xs text-[#6B6B6B] flex-1 font-medium">Deposit</span>
                                    <span className="text-xs text-[#F0F0F0] tabular-nums font-mono shrink-0">{fmtExact(schDeposit)}</span>
                                    <span className="text-[10px] text-[#4A4A4A] w-24 text-right shrink-0">
                                      {scheduleDepositDate[pkg.id]
                                        ? formatDisplayDate(scheduleDepositDate[pkg.id])
                                        : <em className="text-[#4A4A4A]">no date set</em>}
                                    </span>
                                  </div>
                                )}

                                {/* Installment rows */}
                                {Array.from({ length: schInstallments }, (_, i) => {
                                  const label = schInstallments === 1
                                    ? 'Balance'
                                    : i === schInstallments - 1
                                      ? 'Final Payment'
                                      : `Installment ${i + 1}`
                                  const amount = schAmounts[i] ?? 0
                                  const date = schComputedDates[i] ?? ''
                                  return (
                                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                                      <span className="text-xs text-[#6B6B6B] flex-1">{label}</span>
                                      <span className="text-xs text-[#F0F0F0] tabular-nums font-mono shrink-0">{fmtExact(amount)}</span>
                                      <div className="w-24 flex justify-end shrink-0">
                                        {schFrequency === 'custom' ? (
                                          <input
                                            type="date"
                                            value={date}
                                            onChange={e => handleCustomDateChange(pkg.id, i, e.target.value)}
                                            className="w-full px-2 py-1 text-[10px] bg-[#2D2D2D] border border-[#404040] rounded-lg text-[#F0F0F0] focus:outline-none focus:border-[rgba(139,156,182,0.20)] [color-scheme:light]"
                                          />
                                        ) : (
                                          <span className="text-[10px] text-[#4A4A4A]">
                                            {date ? formatDisplayDate(date) : <em className="text-[#4A4A4A]">set start date</em>}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Total summary */}
                              <div className={cn(
                                'flex items-center gap-2 text-xs rounded-lg px-3 py-2 mt-1',
                                schTotalMatches
                                  ? 'text-emerald-400 bg-emerald-400/[0.06] border border-emerald-400/20'
                                  : 'text-amber-400 bg-amber-400/[0.06] border border-amber-400/20',
                              )}>
                                {schTotalMatches
                                  ? <Check className="size-3.5 shrink-0" />
                                  : <span className="shrink-0 font-bold">⚠</span>
                                }
                                <span>
                                  Total scheduled:{' '}
                                  <span className="font-mono tabular-nums font-semibold">{fmtExact(schTotalScheduled)}</span>
                                  {packageTotal > 0 && (
                                    <> of <span className="font-mono tabular-nums">{fmtExact(packageTotal)}</span></>
                                  )}
                                </span>
                              </div>
                            </div>

                            {scheduleError[pkg.id] && (
                              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                                {scheduleError[pkg.id]}
                              </p>
                            )}

                            {/* Saved schedule entries */}
                            {pkg.paymentSchedule && pkg.paymentSchedule.length > 0 && (
                              <div className="space-y-2 pt-4 border-t border-[#404040]">
                                <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">
                                  Saved Schedule
                                </p>
                                {pkg.paymentSchedule.map((entry) => {
                                  const isInvoiced = !!(entry.orderId && entry.invoicedAt)
                                  const invoicedOrder = isInvoiced
                                    ? (packageOrders?.[pkg.id] ?? []).find(o => o.id === entry.orderId)
                                    : null
                                  const entryResult = entryResults[entry.id]
                                  return (
                                    <div key={entry.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-[#252525] border border-[#404040]">
                                      <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                                        <span className="text-xs text-[#A0A0A0] font-medium">{entry.label}</span>
                                        <span className="text-xs text-[#F0F0F0] tabular-nums font-mono shrink-0">{fmtExact(entry.amount)}</span>
                                        {entry.dueDate && (
                                          <span className="flex items-center gap-1 text-[10px] text-[#4A4A4A] shrink-0">
                                            <CalendarDays className="size-3" />
                                            {formatDisplayDate(entry.dueDate)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="shrink-0 flex items-center gap-2">
                                        {isInvoiced ? (
                                          <>
                                            <span className="text-[10px] text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20 rounded px-1.5 py-0.5 font-semibold">
                                              Invoiced
                                            </span>
                                            {invoicedOrder?.stripeInvoiceUrl && (
                                              <a href={invoicedOrder.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer"
                                                className="text-[#4A4A4A] hover:text-[#6B6B6B] transition-colors">
                                                <ExternalLink className="size-3" />
                                              </a>
                                            )}
                                          </>
                                        ) : entryResult && 'url' in entryResult ? (
                                          <a href={entryResult.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] text-emerald-400 border border-emerald-400/30 bg-emerald-400/[0.06] rounded px-1.5 py-0.5 hover:bg-emerald-400/10">
                                            <CheckCircle2 className="size-3" />
                                            Sent
                                            <ExternalLink className="size-3" />
                                          </a>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            {entryResult && 'error' in entryResult && (
                                              <span className="text-[10px] text-red-400 max-w-[100px] leading-snug">{entryResult.error}</span>
                                            )}
                                            <button
                                              type="button"
                                              disabled={sendingEntryId === entry.id || removingEntryId === entry.id}
                                              onClick={() => handleSendScheduledPayment(pkg.id, entry.id, selectedProjectId[pkg.id] || undefined)}
                                              className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-50 transition-all"
                                              style={{ color: 'var(--space-accent)' }}
                                            >
                                              {sendingEntryId === entry.id
                                                ? <Loader2 className="size-3 animate-spin" />
                                                : <Receipt className="size-3" />
                                              }
                                              {sendingEntryId === entry.id ? 'Sending…' : 'Send Invoice'}
                                            </button>
                                            <button
                                              type="button"
                                              disabled={sendingEntryId === entry.id || removingEntryId === entry.id}
                                              onClick={() => handleRemoveScheduleEntry(pkg.id, entry.id)}
                                              className="flex items-center justify-center size-6 text-[#4A4A4A] hover:text-red-400 hover:bg-red-400/[0.08] rounded transition-all disabled:opacity-40"
                                              title="Remove entry"
                                            >
                                              {removingEntryId === entry.id
                                                ? <Loader2 className="size-3 animate-spin" />
                                                : <Trash2 className="size-3" />
                                              }
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {saveError && (
                        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                          {saveError}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#404040]">
                        <button
                          onClick={() => handleDelete(pkg.id)}
                          onBlur={() => setTimeout(() => setConfirmDeleteId(null), 300)}
                          disabled={!!deletingId}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-50',
                            confirmDeleteId === pkg.id
                              ? 'text-red-400 border-red-500/40 bg-red-500/10'
                              : 'text-[#4A4A4A] border-[#404040] hover:text-red-400 hover:border-red-500/30',
                          )}
                        >
                          {deletingId === pkg.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
                          {confirmDeleteId === pkg.id ? 'Confirm delete' : 'Delete'}
                        </button>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {/* Quick Invoice result */}
                          {mode === 'full' && (() => {
                            const result = invoiceResults[pkg.id]
                            if (result && 'url' in result) {
                              return (
                                <a href={result.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/[0.06] rounded-lg hover:bg-emerald-500/10 transition-all">
                                  <CheckCircle2 className="size-3.5" />
                                  Invoice created
                                  <ExternalLink className="size-3" />
                                </a>
                              )
                            }
                            if (result && 'error' in result) {
                              return <p className="text-[10px] text-red-400 max-w-[160px] leading-snug">{result.error}</p>
                            }
                            return null
                          })()}

                          {/* Push Schedule result */}
                          {mode === 'schedule' && pushScheduleResult[pkg.id] && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-400/[0.06] border border-emerald-400/20 rounded px-2 py-1">
                              ✓ {pushScheduleResult[pkg.id]}
                            </span>
                          )}

                          <button
                            onClick={() => setExpandedId(null)}
                            className="px-3 py-1.5 text-xs text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors"
                          >
                            Cancel
                          </button>

                          {/* Save — visible in both modes */}
                          <button
                            onClick={() => handleSave(pkg)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#2D2D2D] border border-[#404040] text-[#A0A0A0] rounded-lg hover:bg-[#E5E1D9] disabled:opacity-50 transition-colors"
                          >
                            {saving && <Loader2 className="size-3 animate-spin" />}
                            Save
                          </button>

                          {mode === 'full' && (
                            <>
                              <select
                                value={getDays(pkg.id)}
                                onChange={e => setDaysUntilDue(prev => ({ ...prev, [pkg.id]: Number(e.target.value) }))}
                                className="appearance-none pl-2 pr-5 py-1.5 text-xs bg-[#252525] border border-[#404040] rounded-lg text-[#6B6B6B] focus:outline-none focus:border-[rgba(139,156,182,0.20)] cursor-pointer"
                              >
                                <option value={7}>7 days</option>
                                <option value={14}>14 days</option>
                                <option value={30}>30 days</option>
                                <option value={60}>60 days</option>
                                <option value={90}>90 days</option>
                              </select>

                              <button
                                onClick={() => handleCreateInvoice(pkg)}
                                disabled={invoicingId === pkg.id || !editItems.length}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded-lg hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-40 transition-all"
                                style={{ color: 'var(--space-accent)' }}
                              >
                                {invoicingId === pkg.id ? <Loader2 className="size-3.5 animate-spin" /> : <Receipt className="size-3.5" />}
                                {invoicingId === pkg.id ? 'Pushing…' : 'Push Invoice'}
                              </button>
                            </>
                          )}

                          {mode === 'schedule' && (() => {
                            const hasPending = (pkg.paymentSchedule ?? []).some(e => !(e.orderId && e.invoicedAt))
                            return (
                              <button
                                onClick={() => handlePushSchedule(pkg.id)}
                                disabled={pushingScheduleId === pkg.id || !hasPending}
                                title={!hasPending ? 'Save your schedule first to enable pushing' : undefined}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded-lg hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-40 transition-all"
                                style={{ color: 'var(--space-accent)' }}
                              >
                                {pushingScheduleId === pkg.id ? <Loader2 className="size-3.5 animate-spin" /> : <ListOrdered className="size-3.5" />}
                                {pushingScheduleId === pkg.id ? 'Pushing…' : 'Push Schedule'}
                              </button>
                            )
                          })()}
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
        <div className="relative overflow-hidden rounded-2xl border border-[#404040]"
          style={{ background: '#252525' }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-64 rounded-full bg-[rgba(255,255,255,0.01)] blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center py-14 px-6">
            <div className="p-4 rounded-2xl bg-[#2D2D2D] border border-[#404040] mb-5">
              <Sparkles className="size-7 text-[#4A4A4A]" />
            </div>
            <h3 className="text-base font-semibold text-[#F0F0F0] mb-2">No packages assigned</h3>
            <p className="text-[#4A4A4A] text-sm max-w-xs mb-6 leading-relaxed">
              Assign a service package to start building a custom offering for this client.
            </p>
            <AssignPackageModal clientId={clientId} />
          </div>
        </div>
      )}

      {/* ── Email Proposal Modal ──────────────────────────────────────────── */}
      {emailModalPkgId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#000000]/60"
            onClick={() => { setEmailModalPkgId(null); setEmailAddresses(''); setEmailResult(null) }}
          />
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#404040] bg-[#1C1C1C] p-6 space-y-4 shadow-[0_8px_40px_rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="size-4" style={{ color: 'var(--space-accent)' }} />
                <h3 className="text-sm font-semibold text-[#F0F0F0]">Email Proposal</h3>
              </div>
              <button
                onClick={() => { setEmailModalPkgId(null); setEmailAddresses(''); setEmailResult(null) }}
                className="p-1 text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors rounded-lg hover:bg-[#2D2D2D]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#4A4A4A]">
                Email addresses
              </label>
              <textarea
                value={emailAddresses}
                onChange={e => setEmailAddresses(e.target.value)}
                placeholder="client@example.com, another@example.com"
                rows={3}
                className="w-full px-3 py-2.5 text-sm bg-[#2D2D2D] border border-[#404040] rounded-xl text-[#F0F0F0] placeholder-[#555555] focus:outline-none focus:border-[rgba(139,156,182,0.20)] resize-none"
              />
              <p className="text-[10px] text-[#4A4A4A]">Separate multiple addresses with commas</p>
            </div>

            {emailResult && (
              <div className={`rounded-xl px-3 py-2.5 text-xs font-medium ${
                emailResult.sent
                  ? 'bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/[0.08] border border-red-500/20 text-red-400'
              }`}>
                {'sent' in emailResult && emailResult.sent
                  ? `✓ Proposal sent to ${emailResult.sent} recipient${emailResult.sent !== 1 ? 's' : ''}`
                  : `✗ ${emailResult.error ?? 'Failed to send'}`
                }
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => { setEmailModalPkgId(null); setEmailAddresses(''); setEmailResult(null) }}
                className="flex-1 px-4 py-2 text-xs font-medium text-[#4A4A4A] border border-[#404040] rounded-xl hover:text-[#A0A0A0] hover:border-[#404040] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailProposal}
                disabled={emailSending || !emailAddresses.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded-xl hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-40 transition-all"
                style={{ color: 'var(--space-accent)' }}
              >
                {emailSending
                  ? <><Loader2 className="size-3.5 animate-spin" /> Sending…</>
                  : <><Mail className="size-3.5" /> Send Proposal</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
