'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings,
  Save,
  Loader2,
  CheckCircle,
  X,
  Calendar,
  DollarSign,
  Users,
  Building2,
  ListTodo,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { updateProject } from '@/actions/projects'
import { formatDate } from '@/lib/utils/dateUtils'
import type { Project, Task } from '@/types/payload-types'

interface ProjectSettingsModalProps {
  project: Project
  tasks: Task[]
}

export function ProjectSettingsModal({ project, tasks }: ProjectSettingsModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Form state
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [status, setStatus] = useState<
    'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled'
  >(project.status)
  const [startDate, setStartDate] = useState(project.startDate || '')
  const [projectedEndDate, setProjectedEndDate] = useState(project.projectedEndDate || '')
  const [actualEndDate, setActualEndDate] = useState(project.actualEndDate || '')
  const [budgetAmount, setBudgetAmount] = useState(project.budgetAmount?.toString() || '')
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>(project.currency || 'USD')

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName(project.name)
      setDescription(project.description || '')
      setStatus(project.status)
      setStartDate(project.startDate || '')
      setProjectedEndDate(project.projectedEndDate || '')
      setActualEndDate(project.actualEndDate || '')
      setBudgetAmount(project.budgetAmount?.toString() || '')
      setCurrency(project.currency || 'USD')
      setError(null)
      setSuccessMessage(null)
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

    // Validation
    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    // Date validation
    if (startDate && projectedEndDate) {
      const start = new Date(startDate)
      const end = new Date(projectedEndDate)
      if (end < start) {
        setError('Projected end date must be after start date')
        return
      }
    }

    // Budget validation
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
      },
    })

    setIsLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to update project')
      return
    }

    setSuccessMessage('Project updated successfully!')
    router.refresh()
  }

  const getStatusConfig = (s: string) => {
    const configs = {
      pending: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending' },
      'in-progress': { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'In Progress' },
      'on-hold': { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'On Hold' },
      completed: { color: 'text-green-400', bg: 'bg-green-400/10', label: 'Completed' },
      cancelled: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Cancelled' },
    }
    return configs[s as keyof typeof configs] || configs.pending
  }

  const statusConfig = getStatusConfig(status)
  const clientAccount = typeof project.client === 'object' ? project.client : null

  // Task stats
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

      <DialogContent className="bg-black/95 border-white/[0.08] backdrop-blur-xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="size-6 text-intelligence-cyan" />
            Project Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Update project details, timeline, and configuration
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 mb-1">
                <ListTodo className="size-3.5 text-intelligence-cyan" />
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Total Tasks
                </p>
              </div>
              <p className="text-2xl font-bold text-white">{tasks.length}</p>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="size-3.5 text-green-400" />
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Completed
                </p>
              </div>
              <p className="text-2xl font-bold text-green-400">{completedTasks}</p>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="size-3.5 text-blue-400" />
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  In Progress
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-400">{inProgressTasks}</p>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="size-3.5 text-yellow-400" />
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Pending
                </p>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{pendingTasks}</p>
            </div>
          </div>

          {/* Client Info (Read-only) */}
          {clientAccount && (
            <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-intelligence-cyan/10 border border-intelligence-cyan/20">
                  <Building2 className="size-4 text-intelligence-cyan" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                    Client Account
                  </p>
                  <p className="text-sm font-semibold text-white">{clientAccount.name}</p>
                  <p className="text-xs text-gray-400">{clientAccount.email}</p>
                </div>
                <Badge variant="outline" className="bg-white/[0.03] border-white/[0.08] text-gray-300">
                  Read Only
                </Badge>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                Project Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/50"
                disabled={isLoading}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-intelligence-cyan/50 resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Two-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-300">
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(
                      value as 'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled'
                    )
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/[0.08] backdrop-blur-xl">
                    <SelectItem value="pending">
                      <span className="text-yellow-400">● Pending</span>
                    </SelectItem>
                    <SelectItem value="in-progress">
                      <span className="text-blue-400">● In Progress</span>
                    </SelectItem>
                    <SelectItem value="on-hold">
                      <span className="text-orange-400">● On Hold</span>
                    </SelectItem>
                    <SelectItem value="completed">
                      <span className="text-green-400">● Completed</span>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <span className="text-red-400">● Cancelled</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium text-gray-300">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/50"
                  disabled={isLoading}
                />
              </div>

              {/* Projected End Date */}
              <div className="space-y-2">
                <Label htmlFor="projectedEndDate" className="text-sm font-medium text-gray-300">
                  Projected End Date
                </Label>
                <Input
                  id="projectedEndDate"
                  type="date"
                  value={projectedEndDate}
                  onChange={(e) => setProjectedEndDate(e.target.value)}
                  className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/50"
                  disabled={isLoading}
                />
              </div>

              {/* Actual End Date (conditional) */}
              {status === 'completed' && (
                <div className="space-y-2">
                  <Label htmlFor="actualEndDate" className="text-sm font-medium text-gray-300">
                    Actual End Date
                  </Label>
                  <Input
                    id="actualEndDate"
                    type="date"
                    value={actualEndDate}
                    onChange={(e) => setActualEndDate(e.target.value)}
                    className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/50"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Budget Amount */}
              <div className="space-y-2">
                <Label htmlFor="budgetAmount" className="text-sm font-medium text-gray-300">
                  Budget Amount
                </Label>
                <Input
                  id="budgetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-intelligence-cyan/50"
                  disabled={isLoading}
                />
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium text-gray-300">
                  Currency
                </Label>
                <Select
                  value={currency}
                  onValueChange={(value) => setCurrency(value as 'USD' | 'EUR' | 'GBP')}
                  disabled={isLoading}
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/[0.08] backdrop-blur-xl">
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-lg border border-green-400/20 bg-green-400/10 p-3 text-sm text-green-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="size-4 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
            >
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
