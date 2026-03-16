'use client'

import { Fragment, useState, useEffect, useCallback } from 'react'
import {
  Plus,
  X,
  ChevronLeft,
  Loader2,
  Layers,
  Package,
  Trash2,
  RefreshCw,
  UserCheck,
  Check,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createPackage,
  updatePackage,
  getPackages,
  assignPackageToClient,
  getClientAccountsList,
} from '@/actions/packages'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

type PkgView = 'list' | 'create' | 'edit' | 'assign'
type CreateStep = 1 | 2 | 3 | 4

interface LocalLineItem {
  _key: string
  name: string
  description: string
  price: string
  adjustedPrice: string
  quantity: string
  isRecurring: boolean
  recurringInterval: 'month' | 'year'
}

interface PkgTemplate {
  id: string
  name: string
  description?: string | null
  coverMessage?: string | null
  notes?: string | null
  status: string
  lineItems?: Array<{
    name: string
    description?: string | null
    price: number
    adjustedPrice?: number | null
    quantity?: number
    isRecurring?: boolean
    recurringInterval?: 'month' | 'year'
  }>
}

interface ClientOption {
  id: string
  name: string
  company?: string | null
}

interface DashboardTaskManagerProps {
  username: string
  userRole?: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS: { label: string }[] = [
  { label: 'Basics' },
  { label: 'Services' },
  { label: 'Messaging' },
  { label: 'Review' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

const newLineItem = (): LocalLineItem => ({
  _key: Math.random().toString(36).slice(2, 10),
  name: '',
  description: '',
  price: '',
  adjustedPrice: '',
  quantity: '1',
  isRecurring: false,
  recurringInterval: 'month',
})

function fmtPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function pkgTotals(lineItems: PkgTemplate['lineItems'] = []) {
  let oneTime = 0, monthly = 0, annual = 0
  for (const item of lineItems) {
    const total = (item.price ?? 0) * (item.quantity ?? 1)
    if (item.isRecurring) {
      item.recurringInterval === 'year' ? (annual += total) : (monthly += total)
    } else {
      oneTime += total
    }
  }
  return { oneTime, monthly, annual }
}

function localItemTotals(items: LocalLineItem[]) {
  let oneTime = 0, monthly = 0, annual = 0
  for (const item of items) {
    const basePrice = Number(item.price) || 0
    const adj = item.adjustedPrice !== '' ? Number(item.adjustedPrice) : null
    const price = adj ?? basePrice
    const qty = Math.max(1, Number(item.quantity) || 1)
    const total = price * qty
    if (item.isRecurring) {
      item.recurringInterval === 'year' ? (annual += total) : (monthly += total)
    } else {
      oneTime += total
    }
  }
  return { oneTime, monthly, annual }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardTaskManager({ username, userRole }: DashboardTaskManagerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // ── Packages state ────────────────────────────────────────────────────────
  const [pkgView, setPkgView] = useState<PkgView>('list')
  const [pkgTemplates, setPkgTemplates] = useState<PkgTemplate[]>([])
  const [pkgListLoading, setPkgListLoading] = useState(false)
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null)
  const [pkgName, setPkgName] = useState('')
  const [pkgDescription, setPkgDescription] = useState('')
  const [pkgCoverMessage, setPkgCoverMessage] = useState('')
  const [pkgNotes, setPkgNotes] = useState('')
  const [pkgLineItems, setPkgLineItems] = useState<LocalLineItem[]>([newLineItem()])
  const [pkgSaving, setPkgSaving] = useState(false)
  const [pkgError, setPkgError] = useState<string | null>(null)
  const [pkgSearch, setPkgSearch] = useState('')
  const [createStep, setCreateStep] = useState<CreateStep>(1)
  // Assign state
  const [assigningPkgId, setAssigningPkgId] = useState<string | null>(null)
  const [clientList, setClientList] = useState<ClientOption[]>([])
  const [clientListLoading, setClientListLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState(false)

  // ── Access gate ───────────────────────────────────────────────────────────
  if (!userRole || userRole === 'client') return null

  // ── Package data fetch ─────────────────────────────────────────────────────

  const loadPackageTemplates = useCallback(async () => {
    setPkgListLoading(true)
    setPkgError(null)
    const result = await getPackages()
    setPkgTemplates(result.success ? (result.packages as PkgTemplate[]) : [])
    setPkgListLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen && pkgTemplates.length === 0) {
      loadPackageTemplates()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Package handlers ───────────────────────────────────────────────────────

  const resetPkgForm = () => {
    setEditingPkgId(null)
    setPkgName(''); setPkgDescription(''); setPkgCoverMessage(''); setPkgNotes('')
    setPkgLineItems([newLineItem()])
    setPkgError(null)
    setCreateStep(1)
  }

  const handleNewPackage = () => {
    resetPkgForm()
    setPkgView('create')
  }

  const handleEditPackage = (pkg: PkgTemplate) => {
    setEditingPkgId(pkg.id)
    setPkgName(pkg.name)
    setPkgDescription(pkg.description ?? '')
    setPkgCoverMessage(pkg.coverMessage ?? '')
    setPkgNotes(pkg.notes ?? '')
    setPkgLineItems(
      (pkg.lineItems ?? []).length > 0
        ? (pkg.lineItems!).map((item) => ({
            _key: Math.random().toString(36).slice(2, 10),
            name: item.name,
            description: item.description ?? '',
            price: String(item.price ?? ''),
            adjustedPrice: item.adjustedPrice != null ? String(item.adjustedPrice) : '',
            quantity: String(item.quantity ?? 1),
            isRecurring: item.isRecurring ?? false,
            recurringInterval: item.recurringInterval ?? 'month',
          }))
        : [newLineItem()]
    )
    setPkgError(null)
    setCreateStep(1)
    setPkgView('edit')
  }

  const handleNextStep = () => {
    setPkgError(null)
    if (createStep === 1) {
      if (!pkgName.trim()) { setPkgError('Package name is required'); return }
    }
    if (createStep === 2) {
      if (pkgLineItems.length === 0) { setPkgError('Add at least one service'); return }
      for (const item of pkgLineItems) {
        if (!item.name.trim()) { setPkgError('All services need a name'); return }
        if (item.price === '' || isNaN(Number(item.price)) || Number(item.price) < 0) {
          setPkgError('All services need a valid price')
          return
        }
      }
    }
    setCreateStep((s) => (s + 1) as CreateStep)
  }

  const handleSavePkg = async () => {
    if (!pkgName.trim()) { setPkgError('Package name is required'); return }
    if (pkgLineItems.length === 0) { setPkgError('Add at least one service'); return }
    for (const item of pkgLineItems) {
      if (!item.name.trim()) { setPkgError('All services need a name'); return }
      if (item.price === '' || isNaN(Number(item.price)) || Number(item.price) < 0) { setPkgError('All services need a valid price'); return }
    }

    const lineItemsPayload = pkgLineItems.map((item) => ({
      name: item.name.trim(),
      description: item.description.trim() || undefined,
      price: Number(item.price),
      adjustedPrice: item.adjustedPrice !== '' ? Number(item.adjustedPrice) : undefined,
      quantity: Math.max(1, Number(item.quantity) || 1),
      isRecurring: item.isRecurring,
      recurringInterval: item.isRecurring ? item.recurringInterval : undefined,
    }))

    setPkgSaving(true)
    setPkgError(null)

    const result = editingPkgId
      ? await updatePackage({ packageId: editingPkgId, name: pkgName.trim(), description: pkgDescription.trim() || undefined, coverMessage: pkgCoverMessage.trim() || undefined, notes: pkgNotes.trim() || undefined, lineItems: lineItemsPayload })
      : await createPackage({ name: pkgName.trim(), description: pkgDescription.trim() || undefined, coverMessage: pkgCoverMessage.trim() || undefined, notes: pkgNotes.trim() || undefined, lineItems: lineItemsPayload })

    setPkgSaving(false)

    if (!result.success) { setPkgError(result.error || 'Failed to save'); return }

    await loadPackageTemplates()
    resetPkgForm()
    setPkgView('list')
  }

  const handleOpenAssign = async (pkgId: string) => {
    setAssigningPkgId(pkgId)
    setSelectedClientId('')
    setAssignError(null)
    setAssignSuccess(false)
    setPkgView('assign')
    if (clientList.length === 0) {
      setClientListLoading(true)
      const result = await getClientAccountsList()
      setClientList(result.success ? result.clients : [])
      setClientListLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!assigningPkgId || !selectedClientId) return
    setAssigning(true)
    setAssignError(null)
    const result = await assignPackageToClient({ packageId: assigningPkgId, clientAccountId: selectedClientId })
    setAssigning(false)
    if (!result.success) { setAssignError(result.error || 'Failed to assign'); return }
    setAssignSuccess(true)
    setTimeout(() => {
      setAssignSuccess(false)
      setAssigningPkgId(null)
      setPkgView('list')
    }, 1800)
  }

  const updateLineItem = (key: string, field: keyof LocalLineItem, value: any) =>
    setPkgLineItems((items) => items.map((i) => (i._key === key ? { ...i, [field]: value } : i)))

  // ── Derived values ────────────────────────────────────────────────────────

  const assigningPkg = pkgTemplates.find((p) => p.id === assigningPkgId)

  const filteredPkgTemplates = pkgSearch.trim()
    ? pkgTemplates.filter((p) =>
        p.name.toLowerCase().includes(pkgSearch.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(pkgSearch.toLowerCase()))
      )
    : pkgTemplates

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-28 right-4 md:bottom-8 md:right-8 z-[53] size-14 md:size-16 rounded-full bg-[var(--space-accent)] text-black shadow-2xl shadow-[#000000]/[0.40]',
          'hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group',
          isOpen && 'rotate-45'
        )}
      >
        {isOpen ? (
          <X className="size-7" />
        ) : (
          <Package className="size-7 group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full md:w-[480px] bg-[#1C1C1C] border-l border-[#404040] z-[56]',
          'transform transition-transform duration-300 overflow-hidden flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Panel Header */}
        <div className="relative overflow-hidden border-b border-[#404040] p-5 shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[rgba(255,255,255,0.02)] rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-[#1E3A6E] tracking-widest">PACKAGE BUILDER</h2>
              {pkgTemplates.length > 0 && (
                <span className="text-[10px] bg-[#2D2D2D] text-[#6B6B6B] rounded px-1.5 py-0.5">{pkgTemplates.length}</span>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-[#2D2D2D] transition-colors">
              <X className="size-5 text-[#6B6B6B]" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* LIST view */}
          {pkgView === 'list' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6B6B6B] uppercase tracking-wider font-semibold">Templates</span>
                    {pkgTemplates.length > 0 && <span className="text-[10px] text-[#4A4A4A] bg-[#2D2D2D] border border-[#404040] rounded px-1.5 py-0.5">{pkgTemplates.length}</span>}
                  </div>
                  <button onClick={loadPackageTemplates} className="p-1.5 rounded text-[#4A4A4A] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-colors" title="Refresh">
                    <RefreshCw className={cn('size-3.5', pkgListLoading && 'animate-spin')} />
                  </button>
                </div>

                {pkgTemplates.length > 0 && (
                  <div className="flex items-center gap-2 bg-[#252525] border border-[#404040] rounded-lg px-3 py-2">
                    <Search className="size-3.5 text-[#4A4A4A] shrink-0" />
                    <input
                      value={pkgSearch}
                      onChange={(e) => setPkgSearch(e.target.value)}
                      placeholder="Search templates…"
                      className="flex-1 bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#4A4A4A] outline-none"
                    />
                    {pkgSearch && (
                      <button onClick={() => setPkgSearch('')} className="text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors">
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                )}

                {pkgListLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="size-6 text-[#4A4A4A] animate-spin" />
                  </div>
                ) : pkgTemplates.length === 0 ? (
                  <div className="rounded-xl border border-[#404040] bg-[#252525] py-10 px-6 text-center space-y-2">
                    <p className="text-sm font-semibold text-[#F0F0F0]">No templates yet</p>
                    <p className="text-xs text-[#4A4A4A] max-w-xs mx-auto">Build your first reusable service package below.</p>
                  </div>
                ) : filteredPkgTemplates.length === 0 ? (
                  <div className="rounded-xl border border-[#404040] bg-[#252525] py-8 px-6 text-center space-y-1">
                    <p className="text-sm text-[#4A4A4A]">No templates match</p>
                    <p className="text-xs text-[#4A4A4A]">&ldquo;{pkgSearch}&rdquo;</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPkgTemplates.map((pkg) => {
                      const { oneTime, monthly, annual } = pkgTotals(pkg.lineItems)
                      return (
                        <div key={pkg.id} className="group rounded-xl border border-[#404040] bg-[#252525] hover:bg-[#2D2D2D] transition-colors overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#F0F0F0] truncate">{pkg.name}</p>
                                {pkg.description && <p className="text-xs text-[#4A4A4A] truncate mt-0.5">{pkg.description}</p>}
                              </div>
                              <span className="shrink-0 text-[10px] text-[#4A4A4A] bg-[#2D2D2D] border border-[#404040] rounded px-1.5 py-0.5">
                                {pkg.lineItems?.length ?? 0} items
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#4A4A4A] flex-wrap mb-3">
                              {oneTime > 0 && <span className="font-mono">{fmtPrice(oneTime)}</span>}
                              {monthly > 0 && <span className="font-mono text-[var(--space-accent)] opacity-70">{fmtPrice(monthly)}/mo</span>}
                              {annual > 0 && <span className="font-mono text-[var(--space-accent)] opacity-70">{fmtPrice(annual)}/yr</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditPackage(pkg)}
                                className="flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-[#F0F0F0] bg-[#2D2D2D] hover:bg-[#E5E1D9] border border-[#404040] hover:border-[#404040] rounded-lg px-2.5 py-1.5 transition-all"
                              >
                                <Layers className="size-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleOpenAssign(pkg.id)}
                                className="flex items-center gap-1 text-xs text-[var(--space-accent)] opacity-80 hover:opacity-100 bg-[rgba(139,156,182,0.06)] hover:bg-[rgba(139,156,182,0.10)] border border-[rgba(139,156,182,0.15)] hover:border-[rgba(139,156,182,0.20)] rounded-lg px-2.5 py-1.5 transition-all"
                              >
                                <UserCheck className="size-3" />
                                Assign to Client
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Bottom CTA — Build a Package */}
              <div className="shrink-0 px-4 pb-6 pt-3 border-t border-[#404040]">
                <div className="relative group">
                  {/* Ambient glow — blooms on hover */}
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--space-accent)]/25 to-[#3b82f6]/25 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  {/* Soft pulse ring */}
                  <div className="absolute inset-0 rounded-xl opacity-30 animate-pulse bg-gradient-to-r from-[var(--space-accent)]/20 to-[#3b82f6]/20 pointer-events-none" />
                  <button
                    onClick={handleNewPackage}
                    className="relative w-full overflow-hidden rounded-xl py-4 font-semibold text-sm text-white flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#000000]/[0.30]"
                    style={{ background: 'linear-gradient(135deg, #1E3A6E 0%, #2B4A8A 50%, #1E3A6E 100%)' }}
                  >
                    {/* Shimmer sweep on hover */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                    <Plus className="size-4 relative z-10 shrink-0" />
                    <span className="relative z-10 tracking-wide uppercase text-xs font-bold">Build a Package</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CREATE / EDIT view — step wizard */}
          {(pkgView === 'create' || pkgView === 'edit') && (
            <>
              {/* Step indicator area */}
              <div className="px-5 py-4 border-b border-[#404040] shrink-0 space-y-4">
                {/* Back + title */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setPkgView('list'); resetPkgForm() }}
                    className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <h3 className="text-sm font-semibold text-[#F0F0F0]">
                    {pkgView === 'create' ? 'New Package Template' : 'Edit Package'}
                  </h3>
                </div>

                {/* Step indicator */}
                <div className="flex items-start">
                  {STEPS.map((s, i) => (
                    <Fragment key={s.label}>
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={cn(
                            'size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                            i + 1 < createStep
                              ? 'bg-[rgba(139,156,182,0.10)] text-[var(--space-accent)]'
                              : i + 1 === createStep
                              ? 'bg-[rgba(139,156,182,0.10)] text-[var(--space-accent)] ring-2 ring-[rgba(139,156,182,0.20)]'
                              : 'bg-[#2D2D2D] text-[#4A4A4A]'
                          )}
                        >
                          {i + 1 < createStep ? <Check className="size-3.5" /> : i + 1}
                        </div>
                        <span
                          className={cn(
                            'text-[9px] mt-1.5 font-medium tracking-wide',
                            i + 1 <= createStep ? 'text-[var(--space-accent)]' : 'text-[#4A4A4A]'
                          )}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={cn(
                            'flex-1 h-px mt-3.5 mx-1.5 transition-colors',
                            i + 1 < createStep ? 'bg-[rgba(139,156,182,0.20)]' : 'bg-[#333333]'
                          )}
                        />
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>

              {/* Step content — key causes re-mount + animation between steps */}
              <div
                key={createStep}
                className="flex-1 overflow-y-auto p-5 animate-in fade-in slide-in-from-right-3 duration-200"
              >
                {/* Step 1 — Basics */}
                {createStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">
                        Package Name <span className="text-red-400">*</span>
                      </p>
                      <input
                        autoFocus
                        value={pkgName}
                        onChange={(e) => setPkgName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                        placeholder="e.g. Launch Package"
                        className="w-full bg-transparent text-2xl font-light text-[#F0F0F0] placeholder:text-[#4A4A4A] outline-none leading-snug"
                      />
                      <div className="h-px bg-[#333333]" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">
                        Description <span className="normal-case text-[#4A4A4A]">(optional)</span>
                      </p>
                      <Textarea
                        value={pkgDescription}
                        onChange={(e) => setPkgDescription(e.target.value)}
                        placeholder="Brief overview of what this package includes..."
                        rows={4}
                        className="bg-[#252525] border-[#404040] text-[#F0F0F0] text-sm resize-none"
                      />
                    </div>

                    <div className="rounded-xl bg-[#252525] border border-[#404040] p-4">
                      <p className="text-xs text-[#4A4A4A] leading-relaxed">
                        Create a reusable template with services and pricing. You can assign it to any client as a proposal they&apos;ll see in their portal.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2 — Services */}
                {createStep === 2 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">
                        Services <span className="text-red-400">*</span>
                      </p>
                      <span className="text-[10px] text-[#4A4A4A] bg-[#2D2D2D] border border-[#404040] rounded px-1.5 py-0.5">
                        {pkgLineItems.length} item{pkgLineItems.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {pkgLineItems.map((item, idx) => (
                        <LineItemRow
                          key={item._key}
                          item={item}
                          index={idx}
                          onUpdate={(field, value) => updateLineItem(item._key, field, value)}
                          onRemove={() => setPkgLineItems((items) => items.filter((i) => i._key !== item._key))}
                          canRemove={pkgLineItems.length > 1}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setPkgLineItems((items) => [...items, newLineItem()])}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-[#404040] text-xs text-[#6B6B6B] hover:text-[#A0A0A0] hover:border-[#404040] hover:bg-[#252525] transition-all"
                    >
                      <Plus className="size-3.5" />
                      Add Service
                    </button>
                  </div>
                )}

                {/* Step 3 — Messaging */}
                {createStep === 3 && (
                  <div className="space-y-5">
                    <p className="text-xs text-[#4A4A4A] leading-relaxed">
                      These fields are optional — add context and polish to the proposal PDF. Skip ahead to review if not needed.
                    </p>

                    <div className="space-y-2">
                      <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">
                        Cover Message <span className="normal-case text-[#4A4A4A]">(shown in proposal PDF)</span>
                      </p>
                      <Textarea
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        value={pkgCoverMessage}
                        onChange={(e) => setPkgCoverMessage(e.target.value)}
                        placeholder="Introductory message to the client..."
                        rows={5}
                        className="bg-[#252525] border-[#404040] text-[#F0F0F0] text-sm resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">
                        Internal Notes <span className="normal-case text-[#4A4A4A]">(not visible to client)</span>
                      </p>
                      <Textarea
                        value={pkgNotes}
                        onChange={(e) => setPkgNotes(e.target.value)}
                        placeholder="Notes about this package for internal use..."
                        rows={3}
                        className="bg-[#252525] border-[#404040] text-[#F0F0F0] text-sm resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4 — Review */}
                {createStep === 4 && (
                  <div className="space-y-4">
                    {/* Package name + description */}
                    <div className="rounded-xl border border-[#404040] bg-[#252525] p-4 space-y-1">
                      <p className="text-base font-semibold text-[#F0F0F0]">{pkgName}</p>
                      {pkgDescription && (
                        <p className="text-xs text-[#6B6B6B] leading-relaxed">{pkgDescription}</p>
                      )}
                    </div>

                    {/* Services list + totals */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">
                        {pkgLineItems.length} service{pkgLineItems.length !== 1 ? 's' : ''}
                      </p>
                      <div className="rounded-xl border border-[#404040] bg-[#252525] divide-y divide-[#333333] overflow-hidden">
                        {pkgLineItems.map((item) => {
                          const basePrice = Number(item.price) || 0
                          const adj = item.adjustedPrice !== '' ? Number(item.adjustedPrice) : null
                          const displayPrice = adj ?? basePrice
                          const qty = Math.max(1, Number(item.quantity) || 1)
                          return (
                            <div key={item._key} className="flex items-center justify-between px-4 py-2.5">
                              <div className="min-w-0 mr-3">
                                <p className="text-sm text-[#F0F0F0] truncate">{item.name}</p>
                                {item.isRecurring && (
                                  <p className="text-[10px] text-[var(--space-accent)] opacity-70 mt-0.5">
                                    {item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <div className="flex items-baseline gap-1.5 justify-end">
                                  {adj !== null && adj !== basePrice && (
                                    <span className="text-[10px] font-mono text-[#4A4A4A] line-through">{fmtPrice(basePrice * qty)}</span>
                                  )}
                                  <p className={cn('text-sm font-mono', adj !== null ? 'text-[var(--space-accent)]' : 'text-[#F0F0F0]')}>{fmtPrice(displayPrice * qty)}</p>
                                </div>
                                {qty > 1 && (
                                  <p className="text-[10px] text-[#4A4A4A]">×{qty} @ {fmtPrice(displayPrice)}</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        {/* Totals row */}
                        {(() => {
                          const { oneTime, monthly, annual } = localItemTotals(pkgLineItems)
                          return (
                            <div className="px-4 py-3 bg-[#2D2D2D] flex items-center gap-4 flex-wrap">
                              {oneTime > 0 && (
                                <div className="text-xs">
                                  <span className="text-[#4A4A4A]">One-time </span>
                                  <span className="font-mono text-[#F0F0F0] font-medium">{fmtPrice(oneTime)}</span>
                                </div>
                              )}
                              {monthly > 0 && (
                                <div className="text-xs">
                                  <span className="text-[#4A4A4A]">Monthly </span>
                                  <span className="font-mono text-[var(--space-accent)] font-medium">{fmtPrice(monthly)}/mo</span>
                                </div>
                              )}
                              {annual > 0 && (
                                <div className="text-xs">
                                  <span className="text-[#4A4A4A]">Annual </span>
                                  <span className="font-mono text-[var(--space-accent)] font-medium">{fmtPrice(annual)}/yr</span>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Cover message snippet */}
                    {pkgCoverMessage && (
                      <div className="rounded-xl border border-[#404040] bg-[#252525] p-3 space-y-1">
                        <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">Cover Message</p>
                        <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-3">{pkgCoverMessage}</p>
                      </div>
                    )}

                    {/* Notes snippet */}
                    {pkgNotes && (
                      <div className="rounded-xl border border-[#404040] bg-[#252525] p-3 space-y-1">
                        <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">Notes</p>
                        <p className="text-xs text-[#6B6B6B] leading-relaxed line-clamp-2">{pkgNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation footer */}
              <div className="p-4 border-t border-[#404040] shrink-0 space-y-3">
                {pkgError && (
                  <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                    {pkgError}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={
                      createStep === 1
                        ? () => { setPkgView('list'); resetPkgForm() }
                        : () => { setCreateStep((s) => (s - 1) as CreateStep); setPkgError(null) }
                    }
                    disabled={pkgSaving}
                    className="flex-1 text-[#6B6B6B] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] border border-[#404040]"
                  >
                    {createStep === 1 ? 'Cancel' : '← Back'}
                  </Button>
                  <Button
                    onClick={createStep === 4 ? handleSavePkg : handleNextStep}
                    disabled={pkgSaving}
                    className="flex-1 bg-[var(--space-accent)] text-black hover:bg-[var(--space-accent)]/90 font-medium gap-1.5"
                  >
                    {createStep === 4 ? (
                      pkgSaving
                        ? <><Loader2 className="size-3.5 animate-spin" />Saving…</>
                        : pkgView === 'create' ? 'Create Template' : 'Save Changes'
                    ) : (
                      'Next →'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ASSIGN view */}
          {pkgView === 'assign' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Back + title */}
              <div className="flex items-center gap-3">
                <button onClick={() => { setPkgView('list'); setAssigningPkgId(null); setAssignSuccess(false) }} className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-colors">
                  <ChevronLeft className="size-4" />
                </button>
                <h3 className="text-sm font-semibold text-[#F0F0F0]">Assign to Client</h3>
              </div>

              {/* Package summary card */}
              {assigningPkg && (
                <div className="rounded-xl border border-[#404040] bg-[#252525] p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F0F0F0]">{assigningPkg.name}</p>
                      {assigningPkg.description && <p className="text-xs text-[#4A4A4A] truncate mt-0.5">{assigningPkg.description}</p>}
                    </div>
                    <div className="p-1.5 rounded-lg bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.10)]">
                      <Package className="size-4 text-[var(--space-accent)]" />
                    </div>
                  </div>
                  {(() => {
                    const { oneTime, monthly, annual } = pkgTotals(assigningPkg.lineItems)
                    return (
                      <div className="flex items-center gap-3 text-xs text-[#6B6B6B] flex-wrap pt-1 border-t border-[#404040]">
                        <span>{assigningPkg.lineItems?.length ?? 0} line items</span>
                        {oneTime > 0 && <span className="font-mono text-[#F0F0F0]">{fmtPrice(oneTime)} one-time</span>}
                        {monthly > 0 && <span className="font-mono text-[var(--space-accent)]">{fmtPrice(monthly)}/mo</span>}
                        {annual > 0 && <span className="font-mono text-[var(--space-accent)]">{fmtPrice(annual)}/yr</span>}
                      </div>
                    )
                  })()}
                </div>
              )}

              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                A frozen snapshot of this template will be created as a proposal and assigned to the selected client. They&apos;ll be able to view it in their portal.
              </p>

              {/* Client selector */}
              <div className="space-y-2">
                <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest font-semibold">
                  Select Client <span className="text-red-400">*</span>
                </p>
                {clientListLoading ? (
                  <div className="flex items-center gap-2 py-3 text-[#4A4A4A] text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Loading clients...
                  </div>
                ) : clientList.length === 0 ? (
                  <p className="text-xs text-[#4A4A4A] py-2">No client accounts found.</p>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {clientList.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setSelectedClientId(client.id)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all',
                          selectedClientId === client.id
                            ? 'border-[rgba(139,156,182,0.30)] bg-[rgba(139,156,182,0.06)] text-[#F0F0F0]'
                            : 'border-[#404040] bg-[#252525] text-[#A0A0A0] hover:bg-[#2D2D2D] hover:border-[#404040]'
                        )}
                      >
                        <span className="font-medium">{client.name}</span>
                        {client.company && <span className="text-xs text-[#6B6B6B] ml-1.5">{client.company}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {assignError && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">{assignError}</div>}

              {assignSuccess && (
                <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg p-3">
                  <Check className="size-4 shrink-0" />
                  Proposal created successfully!
                </div>
              )}

              <Button
                onClick={handleAssign}
                disabled={!selectedClientId || assigning || assignSuccess}
                className="w-full bg-[var(--space-accent)] text-black hover:bg-[var(--space-accent)]/90 font-medium gap-2"
              >
                {assigning ? (
                  <><Loader2 className="size-4 animate-spin" />Assigning...</>
                ) : (
                  <><UserCheck className="size-4" />Create Proposal for Client</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-[#000000]/60 z-[54] animate-in fade-in duration-200"
        />
      )}
    </>
  )
}

// ── LineItemRow ────────────────────────────────────────────────────────────────

function LineItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: LocalLineItem
  index: number
  onUpdate: (field: keyof LocalLineItem, value: any) => void
  onRemove: () => void
  canRemove: boolean
}) {
  return (
    <div className="rounded-lg border border-[#404040] bg-[#252525] p-3 space-y-2.5">
      {/* Name + delete */}
      <div className="flex items-center gap-2">
        <Input
          value={item.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder={`Service ${index + 1} name...`}
          className="flex-1 bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] text-sm h-8"
        />
        <button
          onClick={onRemove}
          disabled={!canRemove}
          className="p-1.5 rounded text-[#4A4A4A] hover:text-red-400 hover:bg-red-400/[0.08] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Description */}
      <textarea
        value={item.description}
        onChange={(e) => onUpdate('description', e.target.value)}
        placeholder="Description (optional)…"
        rows={2}
        className="w-full bg-[#2D2D2D] border border-[#404040] rounded-md px-2.5 py-1.5 text-xs text-[#F0F0F0] placeholder:text-[#4A4A4A] outline-none focus:border-[#404040] transition-colors resize-none"
      />

      {/* Price + Quantity */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1 bg-[#2D2D2D] border border-[#404040] rounded-md px-2 h-8">
          <span className="text-xs text-[#6B6B6B] shrink-0">$</span>
          <input
            type="number"
            value={item.price}
            onChange={(e) => onUpdate('price', e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="flex-1 bg-transparent text-[#F0F0F0] text-sm outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="flex items-center gap-1 bg-[#2D2D2D] border border-[#404040] rounded-md px-2 h-8">
          <span className="text-xs text-[#6B6B6B] shrink-0">Qty</span>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdate('quantity', e.target.value)}
            min="1"
            className="flex-1 bg-transparent text-[#F0F0F0] text-sm outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Adjusted Price — optional display override */}
      <div className="flex items-center gap-2">
        <div className={cn(
          'flex items-center gap-1 flex-1 border rounded-md px-2 h-7 transition-colors',
          item.adjustedPrice !== '' ? 'border-[rgba(139,156,182,0.20)] bg-[rgba(255,255,255,0.03)]' : 'border-[#404040] bg-[#2D2D2D]'
        )}>
          <span className={cn('text-[10px] shrink-0 font-medium', item.adjustedPrice !== '' ? 'text-[var(--space-accent)] opacity-70' : 'text-[#4A4A4A]')}>
            Adj $
          </span>
          <input
            type="number"
            value={item.adjustedPrice}
            onChange={(e) => onUpdate('adjustedPrice', e.target.value)}
            placeholder="price override (optional)"
            min="0"
            step="0.01"
            className="flex-1 bg-transparent text-[#F0F0F0] text-xs outline-none min-w-0 placeholder:text-[#4A4A4A] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        {item.adjustedPrice !== '' && (
          <button
            type="button"
            onClick={() => onUpdate('adjustedPrice', '')}
            className="text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors shrink-0"
            title="Clear adjusted price"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Recurring */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onUpdate('isRecurring', !item.isRecurring)}
          className={cn(
            'relative w-8 h-4 rounded-full transition-colors shrink-0',
            item.isRecurring ? 'bg-[var(--space-accent)]' : 'bg-[#555555]'
          )}
        >
          <span className={cn('absolute top-0.5 size-3 rounded-full bg-white shadow transition-transform', item.isRecurring ? 'translate-x-4' : 'translate-x-0.5')} />
        </button>
        <span className="text-xs text-[#6B6B6B]">Recurring</span>
        {item.isRecurring && (
          <Select value={item.recurringInterval} onValueChange={(v) => onUpdate('recurringInterval', v)}>
            <SelectTrigger className="h-6 text-xs bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] ml-auto w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1C1C1C] border-[#404040] z-[150]">
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
