'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Save, Loader2, CheckCircle } from 'lucide-react'
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
import { updateProject } from '@/actions/projects'
import type { Project } from '@/types/payload-types'

interface ProjectSettingsProps {
  project: Project
}

export function ProjectSettings({ project }: ProjectSettingsProps) {
  const router = useRouter()

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

  // Auto-dismiss success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
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
        actualEndDate:
          status === 'completed' && actualEndDate ? actualEndDate : null,
        budgetAmount: budgetAmount ? parseFloat(budgetAmount) : null,
        currency,
      },
    })

    setIsLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to update project')
      return
    }

    setSuccessMessage('Project settings updated successfully!')
    router.refresh()
  }

  const handleReset = () => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
          <Settings className="size-5 text-intelligence-cyan" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">Project Settings</h2>
          <p className="text-sm text-gray-400">Update project details and configuration</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-intelligence-cyan/[0.04] rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6">
            {/* Two-column grid on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Name */}
              <div className="space-y-2 md:col-span-2">
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-intelligence-cyan/50 resize-none"
                  disabled={isLoading}
                />
              </div>

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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-lg border border-green-400/20 bg-green-400/10 p-3 text-sm text-green-400 flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0" />
                {successMessage}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                className="bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/10"
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
          </div>
        </div>
      </form>
    </div>
  )
}
