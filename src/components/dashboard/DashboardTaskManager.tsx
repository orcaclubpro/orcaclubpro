'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Plus,
  ListTodo,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Calendar,
  Flag,
  CheckCircle,
  Circle,
  Layers,
  Package,
  Trash2,
  RefreshCw,
  UserCheck,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createTask, updateTaskStatus } from '@/actions/tasks'
import { createSprint } from '@/actions/sprints'
import {
  createPackage,
  updatePackage,
  getPackages,
  assignPackageToClient,
  getClientAccountsList,
} from '@/actions/packages'
import { getPriorityConfig, groupTasksByPriority } from '@/lib/utils/taskUtils'
import { formatDate, isOverdue } from '@/lib/utils/dateUtils'
import type { Task, Sprint } from '@/types/payload-types'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

type PanelMode = 'tasks' | 'packages'
type PkgView = 'list' | 'create' | 'edit' | 'assign'

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

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardTaskManager({ username, userRole }: DashboardTaskManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<PanelMode>('tasks')

  // ── Project context ────────────────────────────────────────────────────────
  const projectPageMatch = pathname?.match(/\/u\/[^/]+\/projects\/([^/]+)/)
  const currentProjectId = projectPageMatch?.[1] ?? null

  // ── Tasks state ───────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [selectedSprint, setSelectedSprint] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showSprintModal, setShowSprintModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [taskSprint, setTaskSprint] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sprintName, setSprintName] = useState('')
  const [sprintDescription, setSprintDescription] = useState('')
  const [sprintStartDate, setSprintStartDate] = useState('')
  const [sprintEndDate, setSprintEndDate] = useState('')
  const [sprintGoal, setSprintGoal] = useState('')
  const [isCreatingSprint, setIsCreatingSprint] = useState(false)
  const [sprintError, setSprintError] = useState<string | null>(null)

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

  // ── Task data fetch ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentProjectId) { setTasks([]); setSprints([]); return }
    async function fetchData() {
      try {
        const [tasksRes, sprintsRes] = await Promise.all([
          fetch(`/api/projects/${currentProjectId}/tasks`),
          fetch(`/api/projects/${currentProjectId}/sprints`),
        ])
        if (tasksRes.ok) { const d = await tasksRes.json(); setTasks(d.tasks || []) }
        if (sprintsRes.ok) { const d = await sprintsRes.json(); setSprints(d.sprints || []) }
      } catch {}
    }
    fetchData()
  }, [currentProjectId])

  useEffect(() => {
    setTaskSprint(selectedSprint)
  }, [selectedSprint])

  // Auto-switch to packages mode when opening outside a project
  useEffect(() => {
    if (isOpen && !currentProjectId && mode === 'tasks') {
      setMode('packages')
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Package data fetch ─────────────────────────────────────────────────────

  const loadPackageTemplates = useCallback(async () => {
    setPkgListLoading(true)
    setPkgError(null)
    const result = await getPackages()
    setPkgTemplates(result.success ? (result.packages as PkgTemplate[]) : [])
    setPkgListLoading(false)
  }, [])

  useEffect(() => {
    if (mode === 'packages' && isOpen && pkgTemplates.length === 0) {
      loadPackageTemplates()
    }
  }, [mode, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Task handlers ──────────────────────────────────────────────────────────

  const filteredTasks = selectedSprint
    ? tasks.filter((t) => {
        const sid = typeof t.sprint === 'object' ? t.sprint?.id : t.sprint
        return sid === selectedSprint
      })
    : tasks

  const groupedTasks = groupTasksByPriority(filteredTasks)

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !currentProjectId) { setError(!title.trim() ? 'Task title is required' : 'No project selected'); return }
    setIsLoading(true)
    const result = await createTask({ projectId: currentProjectId, title: title.trim(), description: description.trim() || undefined, priority, dueDate: dueDate || undefined, sprintId: taskSprint || undefined })
    setIsLoading(false)
    if (!result.success) { setError(result.error || 'Failed to create task'); return }
    setTitle(''); setDescription(''); setPriority('medium'); setDueDate('')
    if (!selectedSprint) setTaskSprint(null)
    setError(null); setShowCreateForm(false)
    router.refresh()
  }

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sprintName.trim()) { setSprintError('Sprint name is required'); return }
    if (!sprintStartDate || !sprintEndDate) { setSprintError('Start and end dates are required'); return }
    if (new Date(sprintEndDate) <= new Date(sprintStartDate)) { setSprintError('End date must be after start date'); return }
    if (!currentProjectId) { setSprintError('No project selected'); return }
    setIsCreatingSprint(true)
    const result = await createSprint({ projectId: currentProjectId, name: sprintName.trim(), description: sprintDescription.trim() || undefined, startDate: sprintStartDate, endDate: sprintEndDate, goalDescription: sprintGoal.trim() || undefined })
    setIsCreatingSprint(false)
    if (!result.success) { setSprintError(result.error || 'Failed to create sprint'); return }
    setSprintName(''); setSprintDescription(''); setSprintStartDate(''); setSprintEndDate(''); setSprintGoal('')
    setSprintError(null); setShowSprintModal(false)
    router.refresh()
  }

  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    await updateTaskStatus({ taskId, status: currentStatus === 'completed' ? 'pending' : 'completed' })
    router.refresh()
  }

  // ── Package handlers ───────────────────────────────────────────────────────

  const resetPkgForm = () => {
    setEditingPkgId(null)
    setPkgName(''); setPkgDescription(''); setPkgCoverMessage(''); setPkgNotes('')
    setPkgLineItems([newLineItem()])
    setPkgError(null)
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
    setPkgView('edit')
  }

  const handleSavePkg = async () => {
    if (!pkgName.trim()) { setPkgError('Package name is required'); return }
    if (pkgLineItems.length === 0) { setPkgError('Add at least one line item'); return }
    for (const item of pkgLineItems) {
      if (!item.name.trim()) { setPkgError('All line items need a name'); return }
      if (item.price === '' || isNaN(Number(item.price)) || Number(item.price) < 0) { setPkgError('All line items need a valid price'); return }
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

  // ── Derived values for packages mode ──────────────────────────────────────

  const assigningPkg = pkgTemplates.find((p) => p.id === assigningPkgId)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* FAB — sits above the floating nav (z-40) but below sidebars (z-55 mobile) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-28 right-4 md:bottom-8 md:right-8 z-[60] size-14 md:size-16 rounded-full bg-intelligence-cyan text-black shadow-2xl shadow-intelligence-cyan/30',
          'hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group',
          isOpen && 'rotate-45'
        )}
      >
        {isOpen ? (
          <X className="size-7" />
        ) : mode === 'packages' ? (
          <Package className="size-7 group-hover:scale-110 transition-transform" />
        ) : (
          <ListTodo className="size-7 group-hover:scale-110 transition-transform" />
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
        <div className="relative overflow-hidden border-b border-white/[0.08] p-5 pb-0 shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-intelligence-cyan/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-intelligence-cyan/10 border border-intelligence-cyan/20">
                  {mode === 'packages'
                    ? <Package className="size-5 text-intelligence-cyan" />
                    : <ListTodo className="size-5 text-intelligence-cyan" />
                  }
                </div>
                <h2 className="text-lg font-bold text-white">
                  {mode === 'packages' ? 'Packages' : 'Task Manager'}
                </h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
                <X className="size-5 text-gray-400" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode('tasks')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2',
                  mode === 'tasks'
                    ? 'text-white border-intelligence-cyan bg-white/[0.03]'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                )}
              >
                <ListTodo className="size-3.5" />
                Tasks
                {currentProjectId && tasks.length > 0 && (
                  <span className="text-[10px] bg-white/[0.08] text-gray-400 rounded px-1">{tasks.length}</span>
                )}
              </button>
              <button
                onClick={() => {
                  setMode('packages')
                  if (pkgTemplates.length === 0) loadPackageTemplates()
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2',
                  mode === 'packages'
                    ? 'text-white border-intelligence-cyan bg-white/[0.03]'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                )}
              >
                <Package className="size-3.5" />
                Packages
                {pkgTemplates.length > 0 && (
                  <span className="text-[10px] bg-white/[0.08] text-gray-400 rounded px-1">{pkgTemplates.length}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Tasks mode ── */}
        {mode === 'tasks' && (
          <>
            {!currentProjectId ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] mb-4">
                  <ListTodo className="size-8 text-gray-600" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">No project selected</p>
                <p className="text-xs text-gray-600 max-w-xs">Navigate to a project page to create and manage tasks and sprints.</p>
              </div>
            ) : (
              <>
                {/* Sprint selector + task creation header */}
                <div className="p-5 border-b border-white/[0.06] shrink-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-500 uppercase tracking-wider">Filter by Sprint</Label>
                    <Dialog open={showSprintModal} onOpenChange={setShowSprintModal}>
                      <DialogTrigger asChild>
                        <button className="text-xs text-intelligence-cyan hover:text-intelligence-cyan/80 transition-colors flex items-center gap-1">
                          <Plus className="size-3" />
                          New Sprint
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-black/95 border-white/[0.08] backdrop-blur-xl max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Layers className="size-5 text-intelligence-cyan" />
                            Create Sprint
                          </DialogTitle>
                          <DialogDescription className="text-gray-400">Create a new sprint to organize tasks</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSprint} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="sprintName" className="text-sm text-gray-300">Sprint Name <span className="text-red-400">*</span></Label>
                            <Input id="sprintName" value={sprintName} onChange={(e) => setSprintName(e.target.value)} placeholder="e.g., Sprint 1, Q1 2026" className="bg-white/[0.03] border-white/[0.08] text-white" disabled={isCreatingSprint} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sprintDesc" className="text-sm text-gray-300">Description</Label>
                            <Textarea id="sprintDesc" value={sprintDescription} onChange={(e) => setSprintDescription(e.target.value)} placeholder="Sprint objectives..." rows={2} className="bg-white/[0.03] border-white/[0.08] text-white resize-none" disabled={isCreatingSprint} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="sprintStart" className="text-sm text-gray-300">Start Date <span className="text-red-400">*</span></Label>
                              <Input id="sprintStart" type="date" value={sprintStartDate} onChange={(e) => setSprintStartDate(e.target.value)} className="bg-white/[0.03] border-white/[0.08] text-white" disabled={isCreatingSprint} required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sprintEnd" className="text-sm text-gray-300">End Date <span className="text-red-400">*</span></Label>
                              <Input id="sprintEnd" type="date" value={sprintEndDate} onChange={(e) => setSprintEndDate(e.target.value)} className="bg-white/[0.03] border-white/[0.08] text-white" disabled={isCreatingSprint} required />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sprintGoal" className="text-sm text-gray-300">Sprint Goal</Label>
                            <Textarea id="sprintGoal" value={sprintGoal} onChange={(e) => setSprintGoal(e.target.value)} placeholder="What should be accomplished..." rows={2} className="bg-white/[0.03] border-white/[0.08] text-white resize-none" disabled={isCreatingSprint} />
                          </div>
                          {sprintError && <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3">{sprintError}</div>}
                          <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowSprintModal(false)} disabled={isCreatingSprint} className="flex-1 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]">Cancel</Button>
                            <Button type="submit" disabled={isCreatingSprint} className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90">
                              {isCreatingSprint ? <><Loader2 className="size-4 mr-2 animate-spin" />Creating...</> : <><Plus className="size-4 mr-2" />Create Sprint</>}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Select value={selectedSprint || 'all'} onValueChange={(v) => setSelectedSprint(v === 'all' ? null : v)}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 border-white/[0.08] backdrop-blur-xl z-[150]">
                      <SelectItem value="all">All Tasks</SelectItem>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id}>{sprint.name} ({sprint.status})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!showCreateForm && (
                    <Button onClick={() => setShowCreateForm(true)} className="w-full bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90">
                      <Plus className="size-4 mr-2" />New Task
                    </Button>
                  )}
                </div>

                {/* Task scrollable area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {showCreateForm && (
                    <form onSubmit={handleCreateTask} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">New Task</h3>
                        <button type="button" onClick={() => { setShowCreateForm(false); setError(null) }} className="text-gray-400 hover:text-white"><X className="size-4" /></button>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="title" className="text-xs text-gray-400">Title *</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." className="bg-white/[0.03] border-white/[0.08] text-white text-sm" disabled={isLoading} required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="desc" className="text-xs text-gray-400">Description</Label>
                        <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Task details..." rows={3} className="bg-white/[0.03] border-white/[0.08] text-white text-sm resize-none" disabled={isLoading} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-400">Priority</Label>
                          <Select value={priority} onValueChange={(v) => setPriority(v as any)} disabled={isLoading}>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-black/95 border-white/[0.08] z-[150]">
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="due" className="text-xs text-gray-400">Due Date</Label>
                          <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-white/[0.03] border-white/[0.08] text-white text-sm" disabled={isLoading} />
                        </div>
                      </div>
                      {!selectedSprint && (
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-400">Sprint (optional)</Label>
                          <Select value={taskSprint || 'none'} onValueChange={(v) => setTaskSprint(v === 'none' ? null : v)} disabled={isLoading}>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-black/95 border-white/[0.08] z-[150]">
                              <SelectItem value="none">No Sprint</SelectItem>
                              {sprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {error && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded p-2">{error}</div>}
                      <Button type="submit" disabled={isLoading} className="w-full bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 text-sm">
                        {isLoading ? <><Loader2 className="size-4 mr-2 animate-spin" />Creating...</> : <><Plus className="size-4 mr-2" />Create Task</>}
                      </Button>
                    </form>
                  )}

                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ListTodo className="size-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">{selectedSprint ? 'No tasks in this sprint' : 'No tasks yet'}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupedTasks.urgent.length > 0 && <TaskGroup title="Urgent" tasks={groupedTasks.urgent} onToggleComplete={handleToggleComplete} />}
                      {groupedTasks.high.length > 0 && <TaskGroup title="High Priority" tasks={groupedTasks.high} onToggleComplete={handleToggleComplete} />}
                      {groupedTasks.medium.length > 0 && <TaskGroup title="Medium Priority" tasks={groupedTasks.medium} onToggleComplete={handleToggleComplete} />}
                      {groupedTasks.low.length > 0 && <TaskGroup title="Low Priority" tasks={groupedTasks.low} onToggleComplete={handleToggleComplete} />}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Packages mode ── */}
        {mode === 'packages' && (
          <div className="flex-1 overflow-y-auto">

            {/* LIST view */}
            {pkgView === 'list' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Templates</span>
                    {pkgTemplates.length > 0 && <span className="text-[10px] text-gray-600 bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">{pkgTemplates.length}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={loadPackageTemplates} className="p-1.5 rounded text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-colors" title="Refresh">
                      <RefreshCw className={cn('size-3.5', pkgListLoading && 'animate-spin')} />
                    </button>
                    <Button onClick={handleNewPackage} size="sm" className="h-8 text-xs bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 gap-1.5">
                      <Plus className="size-3.5" />New Package
                    </Button>
                  </div>
                </div>

                {pkgListLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="size-6 text-gray-600 animate-spin" />
                  </div>
                ) : pkgTemplates.length === 0 ? (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] py-10 px-6 text-center space-y-3">
                    <div className="inline-flex p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                      <Package className="size-6 text-gray-600" />
                    </div>
                    <p className="text-sm font-semibold text-white">No package templates</p>
                    <p className="text-xs text-gray-600 max-w-xs mx-auto">Create reusable service packages with line items that you can assign to clients as proposals.</p>
                    <Button onClick={handleNewPackage} size="sm" className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 gap-1.5 mt-2">
                      <Plus className="size-3.5" />Create First Package
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pkgTemplates.map((pkg) => {
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
            )}

            {/* CREATE / EDIT view */}
            {(pkgView === 'create' || pkgView === 'edit') && (
              <div className="p-5 space-y-4">
                {/* Back + title */}
                <div className="flex items-center gap-3">
                  <button onClick={() => { setPkgView('list'); resetPkgForm() }} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/[0.05] transition-colors">
                    <ChevronLeft className="size-4" />
                  </button>
                  <h3 className="text-sm font-semibold text-white">{pkgView === 'create' ? 'New Package Template' : 'Edit Package'}</h3>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Name <span className="text-red-400">*</span></Label>
                  <Input value={pkgName} onChange={(e) => setPkgName(e.target.value)} placeholder="e.g., Launch Package" className="bg-white/[0.03] border-white/[0.08] text-white text-sm" />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Description <span className="text-gray-600">(optional)</span></Label>
                  <Textarea value={pkgDescription} onChange={(e) => setPkgDescription(e.target.value)} placeholder="Brief overview of this package..." rows={2} className="bg-white/[0.03] border-white/[0.08] text-white text-sm resize-none" />
                </div>

                {/* Cover message */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Cover Message <span className="text-gray-600">(shown in proposal PDF)</span></Label>
                  <Textarea value={pkgCoverMessage} onChange={(e) => setPkgCoverMessage(e.target.value)} placeholder="Introductory message to the client..." rows={3} className="bg-white/[0.03] border-white/[0.08] text-white text-sm resize-none" />
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-400">Line Items <span className="text-red-400">*</span></Label>
                    <span className="text-[10px] text-gray-600">{pkgLineItems.length} item{pkgLineItems.length !== 1 ? 's' : ''}</span>
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
                    Add Line Item
                  </button>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-400">Internal Notes <span className="text-gray-600">(optional)</span></Label>
                  <Textarea value={pkgNotes} onChange={(e) => setPkgNotes(e.target.value)} placeholder="Internal notes about this package..." rows={2} className="bg-white/[0.03] border-white/[0.08] text-white text-sm resize-none" />
                </div>

                {pkgError && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">{pkgError}</div>}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" onClick={() => { setPkgView('list'); resetPkgForm() }} disabled={pkgSaving} className="flex-1 text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-white/[0.08]">
                    Cancel
                  </Button>
                  <Button onClick={handleSavePkg} disabled={pkgSaving} className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium gap-1.5">
                    {pkgSaving ? <><Loader2 className="size-3.5 animate-spin" />Saving...</> : pkgView === 'create' ? 'Create Template' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}

            {/* ASSIGN view */}
            {pkgView === 'assign' && (
              <div className="p-5 space-y-5">
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
                  <Label className="text-xs text-gray-400">Select Client <span className="text-red-400">*</span></Label>
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
        )}
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

// ── TaskGroup ──────────────────────────────────────────────────────────────────

function TaskGroup({ title, tasks, onToggleComplete }: { title: string; tasks: Task[]; onToggleComplete: (id: string, status: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(true)
  return (
    <div className="space-y-2">
      <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center justify-between w-full group">
        <div className="flex items-center gap-2">
          <ChevronRight className={cn('size-4 text-gray-400 transition-transform', isExpanded && 'rotate-90')} />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <Badge variant="outline" className="bg-white/[0.03] border-white/[0.08] text-gray-400 text-xs">{tasks.length}</Badge>
        </div>
      </button>
      {isExpanded && (
        <div className="space-y-2 ml-6">
          {tasks.map((task) => <TaskCard key={task.id} task={task} onToggleComplete={onToggleComplete} />)}
        </div>
      )}
    </div>
  )
}

// ── TaskCard ───────────────────────────────────────────────────────────────────

function TaskCard({ task, onToggleComplete }: { task: Task; onToggleComplete: (id: string, status: string) => void }) {
  const priorityConfig = getPriorityConfig(task.priority)
  const isTaskOverdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed'
  const isCompleted = task.status === 'completed'
  return (
    <div className={cn('relative overflow-hidden rounded-lg border p-3 hover:border-white/[0.12] transition-all duration-200 group', priorityConfig.border, priorityConfig.bg)}>
      <div className="flex items-start gap-3">
        <button onClick={() => onToggleComplete(task.id, task.status)} className="mt-0.5 shrink-0 hover:scale-110 transition-transform">
          {isCompleted ? <CheckCircle className="size-5 text-green-400" /> : <Circle className="size-5 text-gray-500 hover:text-intelligence-cyan" />}
        </button>
        <div className="flex-1 min-w-0 space-y-1">
          <h4 className={cn('text-sm font-medium', isCompleted ? 'text-gray-500 line-through' : 'text-white')}>{task.title}</h4>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Flag className={cn('size-3', priorityConfig.color)} />
              <span className={priorityConfig.color}>{priorityConfig.label}</span>
            </div>
            {task.dueDate && (
              <div className={cn('flex items-center gap-1', isTaskOverdue && 'text-red-400')}>
                <Calendar className="size-3" />
                {formatDate(task.dueDate)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
          placeholder={`Item ${index + 1} name...`}
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
