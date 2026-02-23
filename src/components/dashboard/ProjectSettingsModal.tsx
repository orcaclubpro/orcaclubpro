'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Save, Loader2, CheckCircle, X, Building2, Trash2, AlertTriangle } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { updateProject, deleteProject } from '@/actions/projects'
import { getClientAccounts } from '@/actions/clients'
import type { Project, Task } from '@/types/payload-types'
import { cn } from '@/lib/utils'
import { Cinzel_Decorative } from 'next/font/google'
import { ClientAccountCombobox } from './ClientAccountCombobox'

const gothic = Cinzel_Decorative({ weight: '700', subsets: ['latin'] })

type StatusType = 'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled'
type CurrencyType = 'USD' | 'EUR' | 'GBP'

const STATUS_OPTIONS: {
  value: StatusType
  label: string
  color: string
  bg: string
  ring: string
  dotColor: string
}[] = [
  {
    value: 'pending',
    label: 'Pending',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    ring: 'ring-yellow-400/25',
    dotColor: 'bg-yellow-400',
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    ring: 'ring-blue-400/25',
    dotColor: 'bg-blue-400',
  },
  {
    value: 'on-hold',
    label: 'On Hold',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    ring: 'ring-orange-400/25',
    dotColor: 'bg-orange-400',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    ring: 'ring-green-400/25',
    dotColor: 'bg-green-400',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    ring: 'ring-red-400/25',
    dotColor: 'bg-red-400',
  },
]

const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
}

// Payload stores dates as ISO strings ("2024-01-15T00:00:00.000Z").
// <input type="date"> requires "YYYY-MM-DD" — strip the time portion.
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

interface ProjectSettingsModalProps {
  project: Project
  tasks: Task[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  username?: string
}

export function ProjectSettingsModal({ project, tasks, open: controlledOpen, onOpenChange, username }: ProjectSettingsModalProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen! : internalOpen
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v)
    onOpenChange?.(v)
  }

  // Form state
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [status, setStatus] = useState<StatusType>(project.status)
  const [startDate, setStartDate] = useState(toDateInput(project.startDate))
  const [projectedEndDate, setProjectedEndDate] = useState(toDateInput(project.projectedEndDate))
  const [actualEndDate, setActualEndDate] = useState(toDateInput(project.actualEndDate))
  const [budgetAmount, setBudgetAmount] = useState(project.budgetAmount?.toString() || '')
  const [currency, setCurrency] = useState<CurrencyType>(project.currency || 'USD')

  // Client account state
  const initialClientId = typeof project.client === 'string'
    ? project.client
    : (project.client as any)?.id ?? ''
  const [clientId, setClientId] = useState(initialClientId)
  const [clientAccounts, setClientAccounts] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [clientsLoading, setClientsLoading] = useState(false)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Delete zone state
  const [showDeleteZone, setShowDeleteZone] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Reset form when modal opens + fetch client accounts
  useEffect(() => {
    if (open) {
      setName(project.name)
      setDescription(project.description || '')
      setStatus(project.status)
      setStartDate(toDateInput(project.startDate))
      setProjectedEndDate(toDateInput(project.projectedEndDate))
      setActualEndDate(toDateInput(project.actualEndDate))
      setBudgetAmount(project.budgetAmount?.toString() || '')
      setCurrency(project.currency || 'USD')
      setClientId(
        typeof project.client === 'string'
          ? project.client
          : (project.client as any)?.id ?? ''
      )
      setError(null)
      setSuccessMessage(null)
      setShowDeleteZone(false)
      setDeleteInput('')
      setDeleteError(null)

      // Fetch client accounts for selector
      setClientsLoading(true)
      getClientAccounts().then((result) => {
        if (result.success) setClientAccounts(result.accounts)
        setClientsLoading(false)
      })
    }
  }, [open, project])

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
        setOpen(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    if (startDate && projectedEndDate) {
      const start = new Date(startDate)
      const end = new Date(projectedEndDate)
      if (end < start) {
        setError('Projected end date must be after start date')
        return
      }
    }

    if (budgetAmount && parseFloat(budgetAmount) < 0) {
      setError('Budget must be a positive number')
      return
    }

    setIsLoading(true)

    const result = await updateProject({
      projectId: project.id,
      data: {
        name: name.trim(),
        description: description.trim() || null,
        status,
        startDate: startDate || null,
        projectedEndDate: projectedEndDate || null,
        actualEndDate: status === 'completed' && actualEndDate ? actualEndDate : null,
        budgetAmount: budgetAmount ? parseFloat(budgetAmount) : null,
        currency,
        ...(clientId ? { client: clientId } : {}),
      } as any,
    })

    setIsLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to update project')
      return
    }

    setSuccessMessage('Project updated successfully!')
    router.refresh()
  }

  const handleDelete = async () => {
    if (deleteInput !== project.name) return
    setIsDeleting(true)
    setDeleteError(null)
    const result = await deleteProject({ projectId: project.id })
    setIsDeleting(false)
    if (!result.success) {
      setDeleteError(result.error ?? 'Failed to delete project')
      return
    }
    setOpen(false)
    router.push(username ? `/u/${username}/projects` : '/')
    router.refresh()
  }

  const selectedClientAccount = clientAccounts.find((a) => a.id === clientId)
  const clientAccount = selectedClientAccount
    ?? (typeof project.client === 'object' ? project.client as { name: string; email?: string | null } : null)
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length
  const totalTasks = tasks.length
  const currencySymbol = CURRENCY_SYMBOLS[currency]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="group bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-intelligence-cyan/30 transition-all duration-300"
          >
            <Settings className="size-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Project Settings
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="bg-black border-white/[0.06] max-w-5xl p-0 overflow-hidden h-[85vh]">
        <div className="flex h-full min-h-0">

          {/* ── LEFT PANEL ── atmospheric, informational */}
          <div className="relative hidden lg:flex w-[38%] flex-col bg-black overflow-hidden border-r border-white/[0.05]">

            {/* Orbital geometry */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <svg
                width="420"
                height="420"
                viewBox="0 0 420 420"
                fill="none"
                aria-hidden="true"
                className="opacity-[0.035]"
              >
                <circle cx="210" cy="210" r="209" stroke="white" strokeWidth="1" />
                <circle cx="210" cy="210" r="158" stroke="white" strokeWidth="0.5" />
                <circle cx="210" cy="210" r="95" stroke="white" strokeWidth="0.5" />
                <line x1="210" y1="0" x2="210" y2="420" stroke="white" strokeWidth="0.5" />
                <line x1="0" y1="210" x2="420" y2="210" stroke="white" strokeWidth="0.5" />
                <circle cx="210" cy="210" r="3" stroke="white" strokeWidth="0.5" fill="none" />
                <line x1="210" y1="1" x2="210" y2="18" stroke="white" strokeWidth="1" />
                <line x1="210" y1="402" x2="210" y2="419" stroke="white" strokeWidth="1" />
                <line x1="1" y1="210" x2="18" y2="210" stroke="white" strokeWidth="1" />
                <line x1="402" y1="210" x2="419" y2="210" stroke="white" strokeWidth="1" />
              </svg>
            </div>

            {/* Cyan top accent line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent flex-shrink-0" />

            {/* Project identity */}
            <div className="relative z-10 flex-1 flex flex-col justify-center px-10">
              <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light mb-4">
                Project
              </p>
              <h3 className="text-2xl font-bold gradient-text leading-tight mb-2 line-clamp-2">
                {project.name}
              </h3>
              <div className="mt-3 w-6 h-px bg-cyan-400/30 mb-10" />

              {/* Task distribution */}
              {totalTasks > 0 ? (
                <div className="space-y-6">
                  {/* Stacked progress bar */}
                  <div className="h-px w-full bg-white/[0.05] rounded-full overflow-hidden flex">
                    {completedTasks > 0 && (
                      <div
                        className="h-full bg-green-400/50 transition-all duration-700"
                        style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                      />
                    )}
                    {inProgressTasks > 0 && (
                      <div
                        className="h-full bg-blue-400/50 transition-all duration-700"
                        style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }}
                      />
                    )}
                    {pendingTasks > 0 && (
                      <div
                        className="h-full bg-yellow-400/35 transition-all duration-700"
                        style={{ width: `${(pendingTasks / totalTasks) * 100}%` }}
                      />
                    )}
                  </div>

                  {/* Stat rows */}
                  <div className="space-y-3.5">
                    {[
                      { label: 'Total Tasks', value: totalTasks, color: 'text-white/50' },
                      { label: 'Completed', value: completedTasks, color: 'text-green-400/60' },
                      { label: 'In Progress', value: inProgressTasks, color: 'text-blue-400/60' },
                      { label: 'Pending', value: pendingTasks, color: 'text-yellow-400/60' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[10px] tracking-[0.25em] uppercase text-white/20 font-light">
                          {label}
                        </span>
                        <span className={cn('text-sm font-semibold tabular-nums', color)}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-white/15 tracking-wide">No tasks assigned yet</p>
              )}
            </div>

            {/* Client info — pinned to bottom */}
            {clientAccount && (
              <div className="relative z-10 px-10 pb-10 pt-6 border-t border-white/[0.04]">
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light mb-3">
                  Client
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-intelligence-cyan/8 border border-intelligence-cyan/15 flex items-center justify-center flex-shrink-0">
                    <Building2 className="size-3 text-intelligence-cyan/50" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/60 truncate">{clientAccount.name}</p>
                    <p className="text-[11px] text-white/25 truncate">{clientAccount.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Corner geometry */}
            <div
              className="absolute bottom-0 right-0 pointer-events-none select-none"
              aria-hidden="true"
            >
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="opacity-[0.06]">
                <path d="M72 0 L72 72 L0 72" stroke="white" strokeWidth="1" />
                <path d="M72 22 L72 72 L22 72" stroke="white" strokeWidth="0.5" />
              </svg>
            </div>
          </div>

          {/* ── RIGHT PANEL ── form, functional, monastic */}
          <div className="flex-1 bg-[#080808] flex flex-col min-h-0 overflow-hidden">

            {/* Header */}
            <div className="px-10 pt-10 pb-6 border-b border-white/[0.05] flex-shrink-0">
              <p className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-light mb-4">
                Configuration
              </p>
              <DialogTitle className={`${gothic.className} text-2xl text-white`}>
                Settings
              </DialogTitle>
              <DialogDescription className="sr-only">
                Update project details, timeline, and budget configuration
              </DialogDescription>
              <div className="mt-4 w-6 h-px bg-cyan-400/40" />
            </div>

            {/* Scrollable form body */}
            <form
              id="project-settings-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-10 py-8 space-y-9"
            >
              {/* ── Identity ── */}
              <section className="space-y-5">
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">
                  Identity
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="proj-name" className="text-[11px] text-white/35 tracking-wide">
                    Project Name <span className="text-red-400/60">*</span>
                  </label>
                  <Input
                    id="proj-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white focus:border-cyan-400/30 focus-visible:ring-0 placeholder:text-white/20"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="proj-description" className="text-[11px] text-white/35 tracking-wide">
                    Description
                  </label>
                  <Textarea
                    id="proj-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Brief project description…"
                    className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 focus:border-cyan-400/30 focus-visible:ring-0 resize-none"
                    disabled={isLoading}
                  />
                </div>
              </section>

              {/* ── Client Account ── */}
              <section className="space-y-4">
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">
                  Client Account
                </p>
                <ClientAccountCombobox
                  accounts={clientAccounts}
                  value={clientId}
                  onValueChange={setClientId}
                  loading={clientsLoading}
                  disabled={isLoading}
                />
              </section>

              {/* ── Status ── */}
              <section className="space-y-4">
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      disabled={isLoading}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer',
                        status === option.value
                          ? cn(option.bg, option.color, 'ring-1', option.ring)
                          : 'bg-white/[0.03] text-white/30 hover:bg-white/[0.06] hover:text-white/55 border border-white/[0.06]'
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full transition-colors duration-200',
                          status === option.value ? option.dotColor : 'bg-white/20'
                        )}
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Timeline ── */}
              <section className="space-y-4">
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">
                  Timeline
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="proj-start" className="text-[11px] text-white/35 tracking-wide">
                      Start Date
                    </label>
                    <Input
                      id="proj-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-white/[0.03] border-white/[0.06] text-white focus:border-cyan-400/30 focus-visible:ring-0 [color-scheme:dark]"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="proj-end" className="text-[11px] text-white/35 tracking-wide">
                      Target End
                    </label>
                    <Input
                      id="proj-end"
                      type="date"
                      value={projectedEndDate}
                      onChange={(e) => setProjectedEndDate(e.target.value)}
                      className="bg-white/[0.03] border-white/[0.06] text-white focus:border-cyan-400/30 focus-visible:ring-0 [color-scheme:dark]"
                      disabled={isLoading}
                    />
                  </div>
                  {status === 'completed' && (
                    <div className="space-y-1.5 col-span-2">
                      <label
                        htmlFor="proj-actual-end"
                        className="text-[11px] text-white/35 tracking-wide"
                      >
                        Actual End Date
                      </label>
                      <Input
                        id="proj-actual-end"
                        type="date"
                        value={actualEndDate}
                        onChange={(e) => setActualEndDate(e.target.value)}
                        className="bg-white/[0.03] border-white/[0.06] text-white focus:border-cyan-400/30 focus-visible:ring-0 [color-scheme:dark]"
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* ── Budget ── */}
              <section className="space-y-4">
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">
                  Budget
                </p>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium pointer-events-none select-none">
                      {currencySymbol}
                    </span>
                    <Input
                      id="proj-budget"
                      type="number"
                      step="0.01"
                      min="0"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-white/[0.03] border-white/[0.06] text-white pl-7 placeholder:text-white/15 focus:border-cyan-400/30 focus-visible:ring-0"
                      disabled={isLoading}
                    />
                  </div>
                  <Select
                    value={currency}
                    onValueChange={(value) => setCurrency(value as CurrencyType)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-24 bg-white/[0.03] border-white/[0.06] text-white/60 focus:border-cyan-400/30 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c0c0c] border-white/[0.08]">
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>

              {/* ── Danger Zone ── */}
              <section className="space-y-3 border-t border-red-500/10 pt-6">
                <p className="text-[10px] tracking-[0.4em] uppercase text-red-400/40 font-light flex items-center gap-2">
                  <AlertTriangle className="size-3" />
                  Danger Zone
                </p>

                {!showDeleteZone ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteZone(true)}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-xs text-red-400/50 hover:text-red-400/80 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/25 rounded-lg px-4 py-2.5 transition-all duration-150"
                  >
                    <Trash2 className="size-3.5" />
                    Delete Project
                  </button>
                ) : (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div className="space-y-1">
                      <p className="text-xs text-red-400/80 font-medium">This action is irreversible.</p>
                      <p className="text-[11px] text-white/30">
                        Type <span className="font-mono text-white/50">{project.name}</span> to confirm.
                      </p>
                    </div>
                    <Input
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder={project.name}
                      className="bg-white/[0.03] border-red-500/20 text-white placeholder:text-white/15 focus:border-red-400/40 focus-visible:ring-0 font-mono text-sm"
                      disabled={isDeleting}
                    />
                    {deleteError && (
                      <p className="text-xs text-red-400/75">{deleteError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowDeleteZone(false); setDeleteInput(''); setDeleteError(null) }}
                        disabled={isDeleting}
                        className="flex-1 text-xs text-white/30 hover:text-white/50 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg px-3 py-2 transition-all duration-150"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteInput !== project.name || isDeleting}
                        className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-lg px-3 py-2 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <><Loader2 className="size-3.5 animate-spin" />Deleting…</>
                        ) : (
                          <><Trash2 className="size-3.5" />Confirm Delete</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </form>

            {/* ── Footer ── fixed, non-scrolling */}
            <div className="px-10 pb-8 pt-5 border-t border-white/[0.05] flex-shrink-0 space-y-4">

              {/* Feedback messages */}
              {successMessage && (
                <div className="flex items-center gap-2 text-xs text-green-400/80 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <CheckCircle className="size-3.5 shrink-0" />
                  {successMessage}
                </div>
              )}
              {error && (
                <p className="text-xs text-red-400/75 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className="flex-1 text-white/35 hover:text-white/55 hover:bg-white/[0.04] border border-white/[0.06] transition-all duration-200"
                >
                  <X className="size-3.5 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="project-settings-form"
                  disabled={isLoading}
                  className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/10 transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-3.5 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
