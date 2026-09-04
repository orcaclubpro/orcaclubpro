'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, ArrowRight, ArrowLeft, Check, Loader2, Trash2, Copy, CheckCheck,
  Receipt, ExternalLink, CheckCircle2, CalendarDays, ListOrdered, Files, SlidersHorizontal, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PackageDocumentsModal } from './PackageDocumentsModal'
import { OptionRow } from './package-detail/OptionRow'
import { ResetInvoicedEntry } from './package-detail/ResetInvoicedEntry'
import {
  fmt, fmtExact, computeTotals, generateInstallmentDates, computeInstallmentAmounts,
  formatDisplayDate, installmentLabel, statusStyle,
  type Frequency, type LineItem, type PackageDoc, type PackageOrderSummary,
} from './package-detail/utils'
import {
  updatePackage,
  deleteProposal,
  createOrderFromPackage,
  savePaymentScheduleOnly,
  pushPackageSchedule,
  sendScheduledPayment,
  removeScheduleEntry,
  resetScheduleEntry,
} from '@/actions/packages'

// Shared style for the share-row buttons (Copy Link / View Package / Documents) so all
// three get an identical hover: text brightens, border picks up the accent tint,
// and a subtle card background appears.
const PKG_ACTION_BTN =
  'flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--space-text-secondary)] ' +
  'border border-[var(--space-border-hard)] rounded-lg transition-all ' +
  'hover:text-[var(--space-text-primary)] hover:border-[rgba(139,156,182,0.25)] hover:bg-[var(--space-bg-card-hover)]'

interface PackageDetailViewProps {
  pkg: PackageDoc
  clientId: string
  clientName: string
  username: string
  projects: Array<{ id: string; name: string; status: string }>
  packageOrders: PackageOrderSummary[]
}

/** Section heading in the dashboard-home idiom: an accent tick beside the label. */
function SectionHeader({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-3">
        <div className="w-px h-4 bg-[var(--space-accent)]/40 rounded-full shrink-0" />
        <h2 className="text-sm font-semibold text-[var(--space-text-primary)]">{children}</h2>
      </div>
      {aside}
    </div>
  )
}

export function PackageDetailView({
  pkg,
  clientId,
  clientName,
  username,
  projects,
  packageOrders,
}: PackageDetailViewProps) {
  const router = useRouter()
  const backHref = `/u/${username}/clients/${clientId}?tab=packages`

  // ── State ─────────────────────────────────────────────────────────────────
  // One package per page, so every per-package Record from the tab collapses
  // to a plain value here.

  const [editItems, setEditItems] = useState<LineItem[]>([...(pkg.lineItems ?? [])])
  const [requestedItemNames] = useState<Set<string>>(
    new Set((pkg.requestedItems ?? []).map(r => r.name)),
  )
  const [saving, setSaving]                 = useState(false)
  const [saveError, setSaveError]           = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete]   = useState(false)
  const [deleting, setDeleting]             = useState(false)
  const [copied, setCopied]                 = useState(false)
  const [invoicing, setInvoicing]           = useState(false)
  const [invoiceResult, setInvoiceResult]   = useState<{ url: string } | { error: string } | null>(null)
  const [daysUntilDue, setDaysUntilDue]     = useState(30)
  const [selectedProjectId, setSelectedProjectId] = useState(
    pkg.projectRef ? (typeof pkg.projectRef === 'string' ? pkg.projectRef : pkg.projectRef.id) : '',
  )

  // Mode: 'full' (Quick Invoice) | 'schedule' (Payment Schedule)
  const [mode, setMode] = useState<'full' | 'schedule'>('full')

  // Payment schedule builder state
  const [scheduleDeposit, setScheduleDeposit]         = useState('')
  const [scheduleDepositDate, setScheduleDepositDate] = useState('')
  const [numInstallments, setNumInstallments]         = useState(1)
  const [frequency, setFrequency]                     = useState<Frequency>('monthly')
  const [startDate, setStartDate]                     = useState('')
  const [customDates, setCustomDates]                 = useState<string[]>([])
  const [pushingSchedule, setPushingSchedule]         = useState(false)
  const [pushScheduleResult, setPushScheduleResult]   = useState<string | null>(null)
  const [scheduleError, setScheduleError]             = useState<string | null>(null)
  const [sendingEntryId, setSendingEntryId]           = useState<string | null>(null)
  const [removingEntryId, setRemovingEntryId]         = useState<string | null>(null)
  const [entryResults, setEntryResults]               = useState<Record<string, { url: string } | { error: string }>>({})
  // Reset (un-invoice) an already-invoiced schedule entry: two-click confirm, then the
  // outcome (or the refusal, e.g. the paid guard) shown inline next to the row.
  const [resettingEntryId, setResettingEntryId]       = useState<string | null>(null)
  const [confirmResetEntryId, setConfirmResetEntryId] = useState<string | null>(null)
  const [resetResults, setResetResults]               = useState<Record<string, { note: string } | { error: string }>>({})

  const [docsOpen, setDocsOpen] = useState(false)

  // Below lg the action rail is a right-edge drawer rather than a column. The
  // split is a real mount decision, not a CSS toggle, so the controls exist
  // exactly once; `isDesktop` starts true so SSR renders the column and the
  // effect corrects it on a narrow viewport.
  const [railOpen, setRailOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => {
      setIsDesktop(mq.matches)
      if (mq.matches) setRailOpen(false)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Escape closes the drawer, and an open drawer locks the page behind it.
  useEffect(() => {
    if (!railOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRailOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [railOpen])

  // ── Derived ───────────────────────────────────────────────────────────────

  const allLineItems = pkg.lineItems ?? []
  // Add-ons are optional extras excluded from the proposal total — included
  // items (isAddOn falsy) drive pricing, counts and totals.
  const savedIncluded = allLineItems.filter(li => !li.isAddOn)
  const { oneTime, monthly, annual } = computeTotals(savedIncluded)
  const includedItems = editItems.filter(ei => !ei.isAddOn)
  const addOnItems    = editItems.filter(ei => ei.isAddOn)

  const invoicedAmount = packageOrders.reduce((s, o) => s + (o.amount ?? 0), 0)
  const paidAmount = packageOrders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.amount ?? 0), 0)
  // The schedule builder prices off the live edits, so an unsaved price change
  // is reflected in the installments before you commit them.
  const { oneTime: packageTotal } = computeTotals(
    (editItems.length > 0 ? editItems : allLineItems).filter(i => !i.isAddOn),
  )
  const invoicedPct = packageTotal > 0 ? Math.min(100, (invoicedAmount / packageTotal) * 100) : 0
  const paidPct = packageTotal > 0 ? Math.min(100, (paidAmount / packageTotal) * 100) : 0

  const schDeposit = parseFloat(scheduleDeposit) || 0
  const schRemaining = packageTotal > 0 ? packageTotal - schDeposit : 0
  const schAmounts = computeInstallmentAmounts(schRemaining > 0 ? schRemaining : 0, numInstallments)
  const schComputedDates = frequency !== 'custom'
    ? generateInstallmentDates(startDate, numInstallments, frequency, schDeposit > 0)
    : customDates
  const schTotalScheduled = schDeposit + schAmounts.reduce((s, a) => s + a, 0)
  const schTotalMatches = packageTotal <= 0 || Math.abs(schTotalScheduled - packageTotal) < 0.02

  const schedule = pkg.paymentSchedule ?? []
  const hasPendingScheduleEntry = schedule.some(e => !(e.orderId && e.invoicedAt))

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Flip an item between "included" and "available add-on" — both live on the
  // proposal's own line items, distinguished by the isAddOn flag.
  const toggleItem = (item: LineItem) =>
    setEditItems(prev => prev.map(ei => ei.name === item.name ? { ...ei, isAddOn: !ei.isAddOn } : ei))

  const removeExtra = (idx: number) => setEditItems(prev => prev.filter((_, i) => i !== idx))

  const updateItemDescription = (name: string, desc: string) =>
    setEditItems(prev => prev.map(ei => ei.name === name ? { ...ei, description: desc } : ei))

  const updateItemQuantity = (name: string, qty: number) =>
    setEditItems(prev => prev.map(ei => ei.name === name ? { ...ei, quantity: qty } : ei))

  const updateItemAdjustedPrice = (name: string, price: number | null) =>
    setEditItems(prev => prev.map(ei => ei.name === name ? { ...ei, adjustedPrice: price } : ei))

  const handleCreateInvoice = async () => {
    setInvoicing(true)
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
      setInvoicing(false)
      setInvoiceResult({ error: saveResult.error ?? 'Failed to save package before invoicing' })
      return
    }
    const result = await createOrderFromPackage(pkg.id, daysUntilDue, selectedProjectId || undefined)
    setInvoicing(false)
    if (result.success && result.invoiceUrl) {
      setInvoiceResult({ url: result.invoiceUrl })
      router.refresh()
    } else {
      setInvoiceResult({ error: result.error ?? 'Failed to create invoice' })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    const result = await updatePackage({
      packageId: pkg.id,
      name: pkg.name,
      description: pkg.description ?? undefined,
      coverMessage: pkg.coverMessage ?? undefined,
      notes: pkg.notes ?? undefined,
      lineItems: editItems.map(item => ({ ...item, description: item.description ?? undefined })),
      projectRef: selectedProjectId || null,
    })
    if (!result.success) {
      setSaving(false)
      setSaveError(result.error ?? 'Failed to save')
      return
    }

    // In schedule mode, recompute and persist schedule entries from the builder UI
    if (mode === 'schedule') {
      const depositStr = scheduleDeposit
      const depositVal = depositStr !== '' ? parseFloat(depositStr) : 0
      const hasDeposit = depositStr !== '' && !isNaN(depositVal) && depositVal > 0
      const deposit = hasDeposit ? depositVal : 0
      // Add-ons are excluded from the proposal total, so the schedule is built
      // from included items only (isAddOn falsy).
      const scheduleSource = (editItems.length > 0 ? editItems : allLineItems).filter(i => !i.isAddOn)
      const { oneTime: scheduleTotal } = computeTotals(scheduleSource)
      const remaining = Math.max(0, scheduleTotal - deposit)
      const amounts = computeInstallmentAmounts(remaining, numInstallments)
      const dates = frequency !== 'custom'
        ? (startDate ? generateInstallmentDates(startDate, numInstallments, frequency, hasDeposit) : Array(numInstallments).fill(''))
        : customDates

      const entries: Array<{ label: string; amount: number; dueDate?: string }> = [
        ...(hasDeposit ? [{ label: 'Deposit', amount: deposit, dueDate: scheduleDepositDate || undefined }] : []),
        ...Array.from({ length: numInstallments }, (_, i) => ({
          label: installmentLabel(i, numInstallments),
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

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const result = await deleteProposal(pkg.id)
    if (!result.success) {
      setDeleting(false)
      setSaveError(result.error ?? 'Failed to delete')
      return
    }
    // The package this page is about is gone — go back to the client's list.
    router.push(backHref)
    router.refresh()
  }

  const handleCopy = () => {
    const url = `${window.location.origin}/u/${username}/packages/${pkg.id}/print`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleFrequencyChange = (freq: Frequency) => {
    setFrequency(freq)
    if (freq === 'custom') {
      // Pre-fill with monthly-computed dates if we have a start date
      setCustomDates(generateInstallmentDates(startDate, numInstallments, 'monthly', schDeposit > 0))
    }
  }

  const handleInstallmentCountChange = (count: number) => {
    setNumInstallments(count)
    // Resize custom dates array to match new count (preserve existing)
    setCustomDates(prev => Array.from({ length: count }, (_, i) => prev[i] ?? ''))
  }

  const handleCustomDateChange = (idx: number, date: string) => {
    setCustomDates(prev => {
      const next = [...prev]
      next[idx] = date
      return next
    })
  }

  const handlePushSchedule = async () => {
    setPushScheduleResult(null)
    setPushingSchedule(true)
    const result = await pushPackageSchedule(pkg.id)
    setPushingSchedule(false)
    if (result.success) {
      setPushScheduleResult(`${result.count} invoice${(result.count ?? 0) !== 1 ? 's' : ''} sent`)
      router.refresh()
    } else {
      setScheduleError(result.error ?? 'Failed to push schedule')
    }
  }

  const handleSendScheduledPayment = async (entryId: string) => {
    setSendingEntryId(entryId)
    const result = await sendScheduledPayment(pkg.id, entryId, selectedProjectId || undefined)
    setSendingEntryId(null)
    if (result.success && result.invoiceUrl) {
      setEntryResults(prev => ({ ...prev, [entryId]: { url: result.invoiceUrl as string } }))
      router.refresh()
    } else {
      setEntryResults(prev => ({ ...prev, [entryId]: { error: result.error ?? 'Failed to send invoice' } }))
    }
  }

  const handleRemoveScheduleEntry = async (entryId: string) => {
    setRemovingEntryId(entryId)
    const result = await removeScheduleEntry(pkg.id, entryId)
    setRemovingEntryId(null)
    if (result.success) router.refresh()
  }

  /** Put an invoiced payment back on the schedule as un-invoiced. First click arms the
   *  button, second click fires — this deletes an order and voids a Stripe invoice. */
  const handleResetScheduleEntry = async (entryId: string) => {
    if (confirmResetEntryId !== entryId) {
      setConfirmResetEntryId(entryId)
      setResetResults(prev => { const next = { ...prev }; delete next[entryId]; return next })
      return
    }
    setConfirmResetEntryId(null)
    setResettingEntryId(entryId)
    const result = await resetScheduleEntry(pkg.id, entryId)
    setResettingEntryId(null)
    if (result.success) {
      const parts: string[] = [
        result.orderWasMissing ? 'Order was already gone' : 'Invoice voided',
      ]
      if ((result.releasedWorkEntries ?? 0) > 0) {
        parts.push(`${result.releasedWorkEntries} work ${result.releasedWorkEntries === 1 ? 'entry' : 'entries'} released`)
      }
      setResetResults(prev => ({ ...prev, [entryId]: { note: `Reset — ${parts.join(', ')}` } }))
      router.refresh()
    } else {
      setResetResults(prev => ({ ...prev, [entryId]: { error: result.error ?? 'Failed to reset entry' } }))
    }
  }

  // ── Action rail contents ──────────────────────────────────────────────
  // Held in a variable so the same controls can be either the sticky desktop
  // column or the body of the mobile drawer, mounted once either way — two
  // copies would mean two sets of inputs bound to the same state.
  const railContent = (
    <>
          {/* Share */}
          <div>
            <SectionHeader>Share</SectionHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleCopy} className={PKG_ACTION_BTN}>
                {copied ? <CheckCheck className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <Link href={`/u/${username}/packages/${pkg.id}/print`} className={PKG_ACTION_BTN}>
                <FileText className="size-3.5" />
                View Package
                <ArrowRight className="size-3" />
              </Link>
              <button onClick={() => setDocsOpen(true)} className={PKG_ACTION_BTN}>
                <Files className="size-3.5" />
                Documents
              </button>
            </div>
          </div>

          {/* Project link */}
          <div>
            <SectionHeader>Link to project</SectionHeader>
            {projects.length > 0 ? (
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full appearance-none px-3 py-2 text-xs bg-[var(--space-bg-card)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)]"
              >
                <option value="">No project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-[0.625rem] text-[var(--space-text-muted)] italic">No projects yet</span>
            )}
          </div>

          {/* ── Invoice type ───────────────────────────────────────────── */}
          <div>
            <SectionHeader>Invoice Type</SectionHeader>
            <div className="flex items-center rounded-lg border border-[var(--space-border-hard)] overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => setMode('full')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-all border-r',
                  mode === 'full'
                    ? 'bg-[rgba(139,156,182,0.10)] border-[rgba(139,156,182,0.15)]'
                    : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] border-[var(--space-border-hard)]',
                )}
                style={mode === 'full' ? { color: 'var(--space-accent)' } : {}}
              >
                Quick Invoice
              </button>
              <button
                type="button"
                onClick={() => setMode('schedule')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-all',
                  mode === 'schedule'
                    ? 'bg-[rgba(139,156,182,0.10)]'
                    : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)]',
                )}
                style={mode === 'schedule' ? { color: 'var(--space-accent)' } : {}}
              >
                Payment Schedule
              </button>
            </div>

            {/* Quick Invoice — due-date window */}
            {mode === 'full' && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-[0.625rem] text-[var(--space-text-muted)] uppercase tracking-widest font-semibold">Due in</span>
                <select
                  value={daysUntilDue}
                  onChange={e => setDaysUntilDue(Number(e.target.value))}
                  className="appearance-none pl-2 pr-5 py-1.5 text-xs bg-[var(--space-bg-card)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-secondary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] cursor-pointer"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            )}

            {/* ── Payment Schedule builder ─────────────────────────────── */}
            {mode === 'schedule' && (
              <div className="space-y-5 mt-4">

                {/* Deposit */}
                <div className="space-y-2">
                  <p className="text-[0.625rem] text-[var(--space-text-muted)] uppercase tracking-widest font-semibold">Deposit</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center rounded-lg border border-[var(--space-border-hard)] overflow-hidden">
                      <span className="px-2.5 py-1.5 text-xs text-[var(--space-text-muted)] bg-[var(--space-bg-card-hover)] border-r border-[var(--space-border-hard)]">$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={scheduleDeposit}
                        onChange={e => setScheduleDeposit(e.target.value)}
                        placeholder="0.00"
                        className="w-24 px-2 py-1.5 text-xs bg-[var(--space-bg-card)] text-[var(--space-text-primary)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <input
                      type="date"
                      value={scheduleDepositDate}
                      onChange={e => setScheduleDepositDate(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-[var(--space-bg-card)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] [color-scheme:light]"
                    />
                  </div>
                  {packageTotal > 0 && schDeposit > 0 && (
                    <span className="text-[0.625rem] text-[var(--space-text-muted)] tabular-nums">
                      {fmt(schDeposit)} of {fmt(packageTotal)}
                    </span>
                  )}
                </div>

                {/* Installments */}
                <div className="space-y-2">
                  <p className="text-[0.625rem] text-[var(--space-text-muted)] uppercase tracking-widest font-semibold">
                    Installments
                    {packageTotal > 0 && (
                      <span className="ml-2 font-mono normal-case text-[var(--space-text-primary)]">
                        {schDeposit > 0 ? `${fmt(schRemaining)} remaining` : fmt(packageTotal)}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center rounded-lg border border-[var(--space-border-hard)] overflow-hidden">
                      <span className="px-2.5 py-1.5 text-[0.625rem] text-[var(--space-text-muted)] bg-[var(--space-bg-card-hover)] border-r border-[var(--space-border-hard)] uppercase tracking-wide">
                        Split into
                      </span>
                      <select
                        value={numInstallments}
                        onChange={e => handleInstallmentCountChange(Number(e.target.value))}
                        className="appearance-none px-2 py-1.5 text-xs bg-[var(--space-bg-card)] text-[var(--space-text-primary)] focus:outline-none pr-5"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'payment' : 'payments'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Frequency tabs */}
                  <div className="flex items-center rounded-lg border border-[var(--space-border-hard)] overflow-hidden w-fit">
                    {(['monthly', 'biweekly', 'weekly', 'custom'] as const).map((freq, fi, arr) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => handleFrequencyChange(freq)}
                        className={cn(
                          'px-2.5 py-1.5 text-xs font-medium transition-all',
                          fi < arr.length - 1 ? 'border-r' : '',
                          frequency === freq
                            ? 'bg-[var(--space-bg-card-hover)] text-[var(--space-text-primary)] border-[var(--space-border-hard)]'
                            : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] border-[var(--space-border-hard)]',
                        )}
                      >
                        {freq === 'biweekly' ? 'Bi-weekly'
                          : freq === 'monthly' ? 'Monthly'
                          : freq === 'weekly' ? 'Weekly'
                          : 'Custom'}
                      </button>
                    ))}
                  </div>

                  {/* Start date (non-custom) */}
                  {frequency !== 'custom' && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[0.625rem] text-[var(--space-text-muted)]">First payment due:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-[var(--space-bg-card)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] [color-scheme:light]"
                      />
                      {schAmounts[0] > 0 && (
                        <span className="text-[0.625rem] text-[var(--space-text-muted)] tabular-nums">
                          = {fmtExact(schAmounts[0])} each
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Schedule Preview */}
                <div className="space-y-1.5">
                  <p className="text-[0.625rem] text-[var(--space-text-muted)] uppercase tracking-widest font-semibold">Schedule Preview</p>

                  <div className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden divide-y divide-[var(--space-divider)]">
                    {/* Deposit row — only shown when a deposit amount is entered */}
                    {schDeposit > 0 && (
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-[var(--space-bg-card)]">
                        <span className="text-xs text-[var(--space-text-secondary)] flex-1 font-medium">Deposit</span>
                        <span className="text-xs text-[var(--space-text-primary)] tabular-nums font-mono shrink-0">{fmtExact(schDeposit)}</span>
                        <span className="text-[0.625rem] text-[var(--space-text-muted)] w-24 text-right shrink-0">
                          {scheduleDepositDate
                            ? formatDisplayDate(scheduleDepositDate)
                            : <em className="text-[var(--space-text-muted)]">no date set</em>}
                        </span>
                      </div>
                    )}

                    {/* Installment rows */}
                    {Array.from({ length: numInstallments }, (_, i) => {
                      const amount = schAmounts[i] ?? 0
                      const date = schComputedDates[i] ?? ''
                      return (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs text-[var(--space-text-secondary)] flex-1">{installmentLabel(i, numInstallments)}</span>
                          <span className="text-xs text-[var(--space-text-primary)] tabular-nums font-mono shrink-0">{fmtExact(amount)}</span>
                          <div className="w-24 flex justify-end shrink-0">
                            {frequency === 'custom' ? (
                              <input
                                type="date"
                                value={date}
                                onChange={e => handleCustomDateChange(i, e.target.value)}
                                className="w-full px-2 py-1 text-[0.625rem] bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] [color-scheme:light]"
                              />
                            ) : (
                              <span className="text-[0.625rem] text-[var(--space-text-muted)]">
                                {date ? formatDisplayDate(date) : <em className="text-[var(--space-text-muted)]">set start date</em>}
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

                {scheduleError && (
                  <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                    {scheduleError}
                  </p>
                )}
              </div>
            )}
          </div>

          {saveError && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}
    </>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 space-y-8">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          {clientName}
          <span className="text-[var(--space-divider)]">/</span>
          Packages
        </Link>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: 'var(--space-accent)' }}>
              Service Package
            </p>
            <span className={cn(
              'text-[0.5625rem] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border',
              statusStyle(pkg.status),
            )}>
              {pkg.status ?? 'draft'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--space-text-primary)] tracking-tight leading-tight">
            {pkg.name}
          </h1>

          {pkg.description && (
            <p className="text-sm text-[var(--space-text-secondary)] leading-relaxed mt-3 max-w-2xl">
              {pkg.description}
            </p>
          )}

          {/* Pricing stats */}
          <div className="flex items-end gap-8 flex-wrap mt-6">
            {oneTime > 0 && (
              <div>
                <p className="text-3xl font-bold text-[var(--space-text-primary)] tabular-nums tracking-tight">{fmt(oneTime)}</p>
                <p className="text-xs text-[var(--space-text-muted)] mt-1 uppercase tracking-widest">one-time</p>
              </div>
            )}
            {monthly > 0 && (
              <div>
                <div className="flex items-baseline gap-0.5">
                  <p className="text-3xl font-bold text-[var(--space-text-primary)] tabular-nums tracking-tight">{fmt(monthly)}</p>
                  <p className="text-lg text-[var(--space-text-muted)] font-normal">/mo</p>
                </div>
                <p className="text-xs text-[var(--space-text-muted)] mt-1 uppercase tracking-widest">per month</p>
              </div>
            )}
            {annual > 0 && (
              <div>
                <div className="flex items-baseline gap-0.5">
                  <p className="text-3xl font-bold text-[var(--space-text-primary)] tabular-nums tracking-tight">{fmt(annual)}</p>
                  <p className="text-lg text-[var(--space-text-muted)] font-normal">/yr</p>
                </div>
                <p className="text-xs text-[var(--space-text-muted)] mt-1 uppercase tracking-widest">per year</p>
              </div>
            )}
            <div className="pb-0.5">
              <p className="text-3xl font-bold text-[var(--space-text-primary)] tabular-nums">{savedIncluded.length}</p>
              <p className="text-xs text-[var(--space-text-muted)] mt-1 uppercase tracking-widest">
                {savedIncluded.length === 1 ? 'service' : 'services'}
              </p>
            </div>
          </div>

          {/* Invoiced / paid progress */}
          {packageOrders.length > 0 && packageTotal > 0 && (
            <div className="mt-6 space-y-1.5 max-w-md">
              <div className="h-1.5 w-full rounded-full bg-[var(--space-divider)] overflow-hidden">
                <div className="h-full rounded-full flex">
                  {paidPct > 0 && (
                    <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${paidPct}%` }} />
                  )}
                  {(invoicedPct - paidPct) > 0 && (
                    <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${invoicedPct - paidPct}%` }} />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[0.625rem] text-[var(--space-text-muted)] tabular-nums">
                <span>
                  <span className={paidAmount > 0 ? 'text-emerald-400' : ''}>{fmt(invoicedAmount)}</span>
                  {' '}invoiced
                </span>
                <span>{fmt(packageTotal - invoicedAmount)} remaining</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Body: items + schedule | action rail ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main column ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Included services */}
            {includedItems.length > 0 && (
              <div>
                <SectionHeader
                  aside={
                    <span className="text-xs text-[var(--space-text-muted)] tabular-nums">{includedItems.length}</span>
                  }
                >
                  Included services
                </SectionHeader>
                <div
                  className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden divide-y divide-[var(--space-divider)]"
                  style={{ background: 'var(--space-bg-card)' }}
                >
                  {includedItems.map((item) => {
                    const globalIdx = editItems.findIndex(ei => ei.name === item.name)
                    return (
                      <OptionRow
                        key={item.name}
                        item={item}
                        selected={true}
                        requested={requestedItemNames.has(item.name)}
                        onToggle={() => toggleItem(item)}
                        onRemove={() => removeExtra(globalIdx)}
                        onQuantityChange={(qty) => updateItemQuantity(item.name, qty)}
                        onDescriptionChange={(desc) => updateItemDescription(item.name, desc)}
                        onAdjustedPriceChange={(price) => updateItemAdjustedPrice(item.name, price)}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Available add-ons */}
            {addOnItems.length > 0 && (
              <div>
                <SectionHeader
                  aside={
                    <span className="text-xs text-[var(--space-text-muted)] tabular-nums">{addOnItems.length}</span>
                  }
                >
                  Available add-ons
                </SectionHeader>
                <div
                  className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden divide-y divide-[var(--space-divider)]"
                  style={{ background: 'var(--space-bg-card)' }}
                >
                  {addOnItems.map((item) => {
                    const globalIdx = editItems.findIndex(ei => ei.name === item.name)
                    return (
                      <OptionRow
                        key={item.name}
                        item={item}
                        selected={false}
                        requested={requestedItemNames.has(item.name)}
                        onToggle={() => toggleItem(item)}
                        onRemove={() => removeExtra(globalIdx)}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {editItems.length === 0 && (
              <p className="text-xs text-[var(--space-text-muted)] py-1">
                No line items yet. Add items via the task manager.
              </p>
            )}

            {/* ── Payment Schedule overview ──────────────────────────────── */}
            {schedule.length > 0 && (
              <div>
                <SectionHeader
                  aside={
                    <span className="text-xs text-[var(--space-text-muted)] tabular-nums">
                      {schedule.filter(e => e.orderId && e.invoicedAt).length}/{schedule.length} invoiced
                    </span>
                  }
                >
                  Payment Schedule
                </SectionHeader>
                <div className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden divide-y divide-[var(--space-divider)]"
                  style={{ background: 'var(--space-bg-card)' }}
                >
                  {schedule.map((entry) => {
                    const isInvoiced = !!(entry.orderId && entry.invoicedAt)
                    const invoicedOrder = isInvoiced
                      ? packageOrders.find(o => o.id === entry.orderId)
                      : null
                    const entryResult = entryResults[entry.id]
                    return (
                      <div key={entry.id} className="flex items-center gap-3 px-3.5 py-3">
                        <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-[var(--space-text-tertiary)] font-medium">{entry.label}</span>
                          <span className="text-xs text-[var(--space-text-primary)] tabular-nums font-mono shrink-0">{fmtExact(entry.amount)}</span>
                          {entry.dueDate && (
                            <span className="flex items-center gap-1 text-[0.625rem] text-[var(--space-text-muted)] shrink-0">
                              <CalendarDays className="size-3" />
                              {formatDisplayDate(entry.dueDate)}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {isInvoiced ? (
                            <>
                              <span className="text-[0.625rem] text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20 rounded px-1.5 py-0.5 font-semibold">
                                Invoiced
                              </span>
                              {invoicedOrder?.stripeInvoiceUrl && (
                                <a href={invoicedOrder.stripeInvoiceUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] transition-colors">
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                              <ResetInvoicedEntry
                                armed={confirmResetEntryId === entry.id}
                                running={resettingEntryId === entry.id}
                                disabled={removingEntryId === entry.id || sendingEntryId === entry.id}
                                result={resetResults[entry.id]}
                                onClick={() => handleResetScheduleEntry(entry.id)}
                                onBlur={() => setTimeout(() => setConfirmResetEntryId(prev => (prev === entry.id ? null : prev)), 300)}
                              />
                            </>
                          ) : entryResult && 'url' in entryResult ? (
                            <a href={entryResult.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[0.625rem] text-emerald-400 border border-emerald-400/30 bg-emerald-400/[0.06] rounded px-1.5 py-0.5 hover:bg-emerald-400/10">
                              <CheckCircle2 className="size-3" />
                              Sent
                              <ExternalLink className="size-3" />
                            </a>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {entryResult && 'error' in entryResult && (
                                <span className="text-[0.625rem] text-red-400 max-w-[6.25rem] leading-snug">{entryResult.error}</span>
                              )}
                              <span className="text-[0.625rem] text-amber-400 bg-amber-400/[0.06] border border-amber-400/20 rounded px-1.5 py-0.5 font-semibold">
                                Pending
                              </span>
                              <button
                                type="button"
                                disabled={sendingEntryId === entry.id || removingEntryId === entry.id || resettingEntryId === entry.id}
                                onClick={() => handleSendScheduledPayment(entry.id)}
                                className="flex items-center gap-1 px-2 py-1 text-[0.625rem] font-medium border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-50 transition-all"
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
                                disabled={sendingEntryId === entry.id || removingEntryId === entry.id || resettingEntryId === entry.id}
                                onClick={() => handleRemoveScheduleEntry(entry.id)}
                                className="flex items-center justify-center size-6 text-[var(--space-text-muted)] hover:text-red-400 hover:bg-red-400/[0.08] rounded transition-all disabled:opacity-40"
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
              </div>
            )}
          </div>

          {/* ── Action rail ───────────────────────────────────────────────
              At lg this is a sticky third column that tracks the scroll past a
              long item list. Below lg it leaves the grid and is portalled out
              as a right-edge drawer: `.page-enter` retains a transform, so a
              `fixed` drawer rendered inside this subtree would resolve against
              that box rather than the viewport. */}
          {isDesktop && (
            <aside
              aria-label="Package actions"
              className="sticky top-[var(--space-header)] self-start max-h-[calc(100vh-var(--space-header))] overflow-y-auto scrollbar-none space-y-6"
            >
              {railContent}
            </aside>
          )}
        </div>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────────────
          Portalled to <body>: every piece here is `fixed`, and this component
          renders inside `.page-enter`, whose retained transform would otherwise
          become their containing block and scope them to the content box
          instead of the viewport. */}
      {!isDesktop && createPortal(
        <>
          {/* Trigger — the right-edge tab, mirroring ProjectSideActions */}
          {!railOpen && (
            <button
              type="button"
              onClick={() => setRailOpen(true)}
              aria-label="Open package actions"
              aria-expanded={false}
              aria-controls="package-action-rail"
              className={cn(
                'fixed right-0 top-1/2 -translate-y-1/2 z-40 group',
                'flex flex-col items-center gap-2 pl-2.5 pr-2 py-4 rounded-l-xl',
                'bg-[var(--space-bg-card)] border border-r-0 border-[var(--space-border-hard)]',
                'hover:border-[rgba(139,156,182,0.20)] hover:bg-[var(--space-bg-card-hover)] active:scale-95 transition-all duration-300',
              )}
            >
              <SlidersHorizontal className="size-3.5" style={{ color: 'var(--space-accent)' }} />
              <span className="text-[0.5625rem] font-semibold text-[var(--space-text-secondary)] uppercase tracking-[0.18em] group-hover:text-[var(--space-text-tertiary)] transition-colors [writing-mode:vertical-rl] rotate-180">
                Actions
              </span>
            </button>
          )}

          {/* Backdrop */}
          {railOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setRailOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Panel */}
          <aside
            id="package-action-rail"
            aria-label="Package actions"
            className={cn(
              'fixed inset-y-0 right-0 z-50 w-[85vw] max-w-sm flex flex-col',
              'border-l border-[var(--space-border-hard)]',
              'transition-transform duration-300 ease-out',
              railOpen ? 'translate-x-0' : 'translate-x-full invisible',
            )}
            style={{ background: 'var(--space-bg-base)' }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--space-border-hard)] py-3 pl-5 pr-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--space-text-tertiary)]">
                Actions
              </span>
              <button
                type="button"
                onClick={() => setRailOpen(false)}
                aria-label="Close actions panel"
                className="rounded-md p-1.5 text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="scrollbar-none flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6">
              {railContent}
            </div>
          </aside>
        </>,
        document.body,
      )}

      {/* ── Action bar ────────────────────────────────────────────────────
          Deliberately not sticky: MobileBottomNav is `fixed bottom-0 z-40`
          across every breakpoint, so a bottom-pinned bar would sit under the
          nav pill. Nothing else in the app uses sticky-bottom for that reason. */}
      <div
        className="border-t border-[var(--space-border-hard)]"
        style={{ background: 'var(--space-bg-card)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={handleDelete}
            onBlur={() => setTimeout(() => setConfirmDelete(false), 300)}
            disabled={deleting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-50',
              confirmDelete
                ? 'text-red-400 border-red-500/40 bg-red-500/10'
                : 'text-[var(--space-text-muted)] border-[var(--space-border-hard)] hover:text-red-400 hover:border-red-500/30',
            )}
          >
            {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
            {confirmDelete ? 'Confirm delete' : 'Delete'}
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Quick Invoice result */}
            {mode === 'full' && invoiceResult && 'url' in invoiceResult && (
              <a href={invoiceResult.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/[0.06] rounded-lg hover:bg-emerald-500/10 transition-all">
                <CheckCircle2 className="size-3.5" />
                Invoice created
                <ExternalLink className="size-3" />
              </a>
            )}
            {mode === 'full' && invoiceResult && 'error' in invoiceResult && (
              <p className="text-[0.625rem] text-red-400 max-w-[10rem] leading-snug">{invoiceResult.error}</p>
            )}

            {/* Push Schedule result */}
            {mode === 'schedule' && pushScheduleResult && (
              <span className="text-[0.625rem] text-emerald-400 bg-emerald-400/[0.06] border border-emerald-400/20 rounded px-2 py-1">
                ✓ {pushScheduleResult}
              </span>
            )}

            <Link
              href={backHref}
              className="px-3 py-1.5 text-xs text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] transition-colors"
            >
              Back
            </Link>

            {/* Save — available in both modes */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] rounded-lg hover:bg-[var(--space-bg-card-hover)] disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="size-3 animate-spin" />}
              Save
            </button>

            {mode === 'full' && (
              <button
                onClick={handleCreateInvoice}
                disabled={invoicing || !editItems.length}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded-lg hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-40 transition-all"
                style={{ color: 'var(--space-accent)' }}
              >
                {invoicing ? <Loader2 className="size-3.5 animate-spin" /> : <Receipt className="size-3.5" />}
                {invoicing ? 'Pushing…' : 'Push Invoice'}
              </button>
            )}

            {mode === 'schedule' && (
              <button
                onClick={handlePushSchedule}
                disabled={pushingSchedule || !hasPendingScheduleEntry}
                title={!hasPendingScheduleEntry ? 'Save your schedule first to enable pushing' : undefined}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded-lg hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-40 transition-all"
                style={{ color: 'var(--space-accent)' }}
              >
                {pushingSchedule ? <Loader2 className="size-3.5 animate-spin" /> : <ListOrdered className="size-3.5" />}
                {pushingSchedule ? 'Pushing…' : 'Push Schedule'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Documents modal ───────────────────────────────────────────────── */}
      {docsOpen && (
        <PackageDocumentsModal packageId={pkg.id} username={username} onClose={() => setDocsOpen(false)} />
      )}
    </>
  )
}
