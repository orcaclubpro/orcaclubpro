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
    const price = Number(item.price) || 0
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
          'fixed bottom-28 right-4 md:bottom-8 md:right-8 z-[53] size-14 md:size-16 rounded-full bg-intelligence-cyan text-black shadow-2xl shadow-intelligence-cyan/30',
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
          'fixed top-0 right-0 h-full w-full md:w-[480px] bg-black/98 border-l border-white/[0.08] backdrop-blur-xl z-[56]',
          'transform transition-transform duration-300 overflow-hidden flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Panel Header */}
        <div className="relative overflow-hidden border-b border-white/[0.08] p-5 shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-intelligence-cyan/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold gradient-text tracking-widest">PACKAGE BUILDER</h2>
              {pkgTemplates.length > 0 && (
                <span className="text-[10px] bg-white/[0.08] text-gray-400 rounded px-1.5 py-0.5">{pkgTemplates.length}</span>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
              <X className="size-5 text-gray-400" />
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
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Templates</span>
                    {pkgTemplates.length > 0 && <span className="text-[10px] text-gray-600 bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">{pkgTemplates.length}</span>}
                  </div>
                  <button onClick={loadPackageTemplates} className="p-1.5 rounded text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-colors" title="Refresh">
                    <RefreshCw className={cn('size-3.5', pkgListLoading && 'animate-spin')} />
                  </button>
                </div>

                {pkgTemplates.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2">
                    <Search className="size-3.5 text-gray-600 shrink-0" />
                    <input
                      value={pkgSearch}
                      onChange={(e) => setPkgSearch(e.target.value)}
                      placeholder="Search templates…"
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
                    />
                    {pkgSearch && (
                      <button onClick={() => setPkgSearch('')} className="text-gray-600 hover:text-gray-300 transition-colors">
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                )}

                {pkgListLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="size-6 text-gray-600 animate-spin" />
                  </div>
                ) : pkgTemplates.length === 0 ? (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-10 px-6 text-center space-y-2">
                    <p className="text-sm font-semibold text-white">No templates yet</p>
                    <p className="text-xs text-gray-600 max-w-xs mx-auto">Build your first reusable service package below.</p>
                  </div>
                ) : filteredPkgTemplates.length === 0 ? (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] py-8 px-6 text-center space-y-1">
                    <p className="text-sm text-white/40">No templates match</p>
                    <p className="text-xs text-gray-600">&ldquo;{pkgSearch}&rdquo;</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPkgTemplates.map((pkg) => {
                      const { oneTime, monthly, annual } = pkgTotals(pkg.lineItems)
                      return (
                        <div key={pkg.id} className="group rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{pkg.name}</p>
                                {pkg.description && <p className="text-xs text-gray-600 truncate mt-0.5">{pkg.description}</p>}
                              </div>
                              <span className="shrink-0 text-[10px] text-gray-600 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">
                                {pkg.lineItems?.length ?? 0} items
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-600 flex-wrap mb-3">
                              {oneTime > 0 && <span className="font-mono">{fmtPrice(oneTime)}</span>}
                              {monthly > 0 && <span className="font-mono text-intelligence-cyan/70">{fmtPrice(monthly)}/mo</span>}
                              {annual > 0 && <span className="font-mono text-intelligence-cyan/70">{fmtPrice(annual)}/yr</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditPackage(pkg)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] rounded-lg px-2.5 py-1.5 transition-all"
                              >
                                <Layers className="size-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleOpenAssign(pkg.id)}
                                className="flex items-center gap-1 text-xs text-intelligence-cyan/80 hover:text-intelligence-cyan bg-intelligence-cyan/[0.06] hover:bg-intelligence-cyan/[0.1] border border-intelligence-cyan/20 hover:border-intelligence-cyan/40 rounded-lg px-2.5 py-1.5 transition-all"
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
              <div className="shrink-0 px-4 pb-6 pt-3 border-t border-white/[0.05]">
                <div className="relative group">
                  {/* Ambient glow — blooms on hover */}
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#67e8f9]/25 to-[#3b82f6]/25 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  {/* Soft pulse ring */}
                  <div className="absolute inset-0 rounded-xl opacity-30 animate-pulse bg-gradient-to-r from-[#67e8f9]/20 to-[#3b82f6]/20 pointer-events-none" />
                  <button
                    onClick={handleNewPackage}
                    className="relative w-full overflow-hidden rounded-xl py-4 font-semibold text-sm text-black flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#67e8f9]/20"
                    style={{ background: 'linear-gradient(135deg, #67e8f9 0%, #38bdf8 50%, #3b82f6 100%)' }}
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
              <div className="px-5 py-4 border-b border-white/[0.05] shrink-0 space-y-4">
                {/* Back + title */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setPkgView('list'); resetPkgForm() }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/[0.05] transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <h3 className="text-sm font-semibold text-white">
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
                              ? 'bg-[#67e8f9]/20 text-[#67e8f9]'
                              : i + 1 === createStep
                              ? 'bg-[#67e8f9]/20 text-[#67e8f9] ring-2 ring-[#67e8f9]/40'
                              : 'bg-white/[0.06] text-gray-600'
                          )}
                        >
                          {i + 1 < createStep ? <Check className="size-3.5" /> : i + 1}
                        </div>
                        <span
                          className={cn(
                            'text-[9px] mt-1.5 font-medium tracking-wide',
                            i + 1 <= createStep ? 'text-[#67e8f9]' : 'text-gray-600'
                          )}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={cn(
                            'flex-1 h-px mt-3.5 mx-1.5 transition-colors',
                            i + 1 < createStep ? 'bg-[#67e8f9]/40' : 'bg-white/[0.08]'
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
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                        Package Name <span className="text-red-400">*</span>
                      </p>
                      <input
                        autoFocus
                        value={pkgName}
                        onChange={(e) => setPkgName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                        placeholder="e.g. Launch Package"
                        className="w-full bg-transparent text-2xl font-light text-white placeholder:text-white/[0.15] outline-none leading-snug"
                      />
                      <div className="h-px bg-white/[0.08]" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                        Description <span className="normal-case text-gray-700">(optional)</span>
                      </p>
                      <Textarea
                        value={pkgDescription}
                        onChange={(e) => setPkgDescription(e.target.value)}
                        placeholder="Brief overview of what this package includes..."
                        rows={4}
                        className="bg-white/[0.03] border-white/[0.08] text-white text-sm resize-none"
                      />
                    </div>

                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Create a reusable template with services and pricing. You can assign it to any client as a proposal they&apos;ll see in their portal.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2 — Services */}
                {createStep === 2 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                        Services <span className="text-red-400">*</span>
                      </p>
                      <span className="text-[10px] text-gray-600 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">
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
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-white/[0.12] text-xs text-gray-500 hover:text-gray-300 hover:border-white/[0.25] hover:bg-white/[0.02] transition-all"
                    >
                      <Plus className="size-3.5" />
                      Add Service
                    </button>
                  </div>
                )}

                {/* Step 3 — Messaging */}
                {createStep === 3 && (
                  <div className="space-y-5">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      These fields are optional — add context and polish to the proposal PDF. Skip ahead to review if not needed.
                    </p>

                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                        Cover Message <span className="normal-case text-gray-700">(shown in proposal PDF)</span>
                      </p>
                      <Textarea
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        value={pkgCoverMessage}
                        onChange={(e) => setPkgCoverMessage(e.target.value)}
                        placeholder="Introductory message to the client..."
                        rows={5}
                        className="bg-white/[0.03] border-white/[0.08] text-white text-sm resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                        Internal Notes <span className="normal-case text-gray-700">(not visible to client)</span>
                      </p>
                      <Textarea
                        value={pkgNotes}
                        onChange={(e) => setPkgNotes(e.target.value)}
                        placeholder="Notes about this package for internal use..."
                        rows={3}
                        className="bg-white/[0.03] border-white/[0.08] text-white text-sm resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4 — Review */}
                {createStep === 4 && (
                  <div className="space-y-4">
                    {/* Package name + description */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-1">
                      <p className="text-base font-semibold text-white">{pkgName}</p>
                      {pkgDescription && (
                        <p className="text-xs text-gray-500 leading-relaxed">{pkgDescription}</p>
                      )}
                    </div>

                    {/* Services list + totals */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                        {pkgLineItems.length} service{pkgLineItems.length !== 1 ? 's' : ''}
                      </p>
                      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] divide-y divide-white/[0.05] overflow-hidden">
                        {pkgLineItems.map((item) => {
                          const price = Number(item.price) || 0
                          const qty = Math.max(1, Number(item.quantity) || 1)
                          return (
                            <div key={item._key} className="flex items-center justify-between px-4 py-2.5">
                              <div className="min-w-0 mr-3">
                                <p className="text-sm text-white truncate">{item.name}</p>
                                {item.isRecurring && (
                                  <p className="text-[10px] text-[#67e8f9]/70 mt-0.5">
                                    {item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-mono text-white">{fmtPrice(price * qty)}</p>
                                {qty > 1 && (
                                  <p className="text-[10px] text-gray-600">×{qty} @ {fmtPrice(price)}</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        {/* Totals row */}
                        {(() => {
                          const { oneTime, monthly, annual } = localItemTotals(pkgLineItems)
                          return (
                            <div className="px-4 py-3 bg-white/[0.02] flex items-center gap-4 flex-wrap">
                              {oneTime > 0 && (
                                <div className="text-xs">
                                  <span className="text-gray-600">One-time </span>
                                  <span className="font-mono text-white font-medium">{fmtPrice(oneTime)}</span>
                                </div>
                              )}
                              {monthly > 0 && (
                                <div className="text-xs">
                                  <span className="text-gray-600">Monthly </span>
                                  <span className="font-mono text-[#67e8f9] font-medium">{fmtPrice(monthly)}/mo</span>
                                </div>
                              )}
                              {annual > 0 && (
                                <div className="text-xs">
                                  <span className="text-gray-600">Annual </span>
                                  <span className="font-mono text-[#67e8f9] font-medium">{fmtPrice(annual)}/yr</span>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Cover message snippet */}
                    {pkgCoverMessage && (
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">Cover Message</p>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{pkgCoverMessage}</p>
                      </div>
                    )}

                    {/* Notes snippet */}
                    {pkgNotes && (
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">Notes</p>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{pkgNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation footer */}
              <div className="p-4 border-t border-white/[0.05] shrink-0 space-y-3">
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
                    className="flex-1 text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-white/[0.08]"
                  >
                    {createStep === 1 ? 'Cancel' : '← Back'}
                  </Button>
                  <Button
                    onClick={createStep === 4 ? handleSavePkg : handleNextStep}
                    disabled={pkgSaving}
                    className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium gap-1.5"
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
                <button onClick={() => { setPkgView('list'); setAssigningPkgId(null); setAssignSuccess(false) }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/[0.05] transition-colors">
                  <ChevronLeft className="size-4" />
                </button>
                <h3 className="text-sm font-semibold text-white">Assign to Client</h3>
              </div>

              {/* Package summary card */}
              {assigningPkg && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{assigningPkg.name}</p>
                      {assigningPkg.description && <p className="text-xs text-gray-600 truncate mt-0.5">{assigningPkg.description}</p>}
                    </div>
                    <div className="p-1.5 rounded-lg bg-intelligence-cyan/[0.08] border border-intelligence-cyan/[0.15]">
                      <Package className="size-4 text-intelligence-cyan" />
                    </div>
                  </div>
                  {(() => {
                    const { oneTime, monthly, annual } = pkgTotals(assigningPkg.lineItems)
                    return (
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap pt-1 border-t border-white/[0.06]">
                        <span>{assigningPkg.lineItems?.length ?? 0} line items</span>
                        {oneTime > 0 && <span className="font-mono text-white">{fmtPrice(oneTime)} one-time</span>}
                        {monthly > 0 && <span className="font-mono text-intelligence-cyan">{fmtPrice(monthly)}/mo</span>}
                        {annual > 0 && <span className="font-mono text-intelligence-cyan">{fmtPrice(annual)}/yr</span>}
                      </div>
                    )
                  })()}
                </div>
              )}

              <p className="text-xs text-gray-500 leading-relaxed">
                A frozen snapshot of this template will be created as a proposal and assigned to the selected client. They&apos;ll be able to view it in their portal.
              </p>

              {/* Client selector */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                  Select Client <span className="text-red-400">*</span>
                </p>
                {clientListLoading ? (
                  <div className="flex items-center gap-2 py-3 text-gray-600 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Loading clients...
                  </div>
                ) : clientList.length === 0 ? (
                  <p className="text-xs text-gray-600 py-2">No client accounts found.</p>
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
                            ? 'border-intelligence-cyan/50 bg-intelligence-cyan/[0.06] text-white'
                            : 'border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.05] hover:border-white/[0.15]'
                        )}
                      >
                        <span className="font-medium">{client.name}</span>
                        {client.company && <span className="text-xs text-gray-500 ml-1.5">{client.company}</span>}
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
                className="w-full bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium gap-2"
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[54] animate-in fade-in duration-200"
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
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5">
      {/* Name + delete */}
      <div className="flex items-center gap-2">
        <Input
          value={item.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder={`Service ${index + 1} name...`}
          className="flex-1 bg-white/[0.03] border-white/[0.08] text-white text-sm h-8"
        />
        <button
          onClick={onRemove}
          disabled={!canRemove}
          className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/[0.08] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-white/[0.18] transition-colors resize-none"
      />

      {/* Price + Quantity */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-md px-2 h-8">
          <span className="text-xs text-gray-500 shrink-0">$</span>
          <input
            type="number"
            value={item.price}
            onChange={(e) => onUpdate('price', e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="flex-1 bg-transparent text-white text-sm outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-md px-2 h-8">
          <span className="text-xs text-gray-500 shrink-0">Qty</span>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdate('quantity', e.target.value)}
            min="1"
            className="flex-1 bg-transparent text-white text-sm outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Recurring */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onUpdate('isRecurring', !item.isRecurring)}
          className={cn(
            'relative w-8 h-4 rounded-full transition-colors shrink-0',
            item.isRecurring ? 'bg-intelligence-cyan' : 'bg-white/[0.12]'
          )}
        >
          <span className={cn('absolute top-0.5 size-3 rounded-full bg-white shadow transition-transform', item.isRecurring ? 'translate-x-4' : 'translate-x-0.5')} />
        </button>
        <span className="text-xs text-gray-400">Recurring</span>
        {item.isRecurring && (
          <Select value={item.recurringInterval} onValueChange={(v) => onUpdate('recurringInterval', v)}>
            <SelectTrigger className="h-6 text-xs bg-white/[0.03] border-white/[0.08] text-white ml-auto w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/[0.08] z-[150]">
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
