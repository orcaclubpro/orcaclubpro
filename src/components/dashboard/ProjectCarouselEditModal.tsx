'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Save, Loader2, CheckCircle, X } from 'lucide-react'
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
import { updateProject } from '@/actions/projects'
import type { SerializedProject } from './ProjectsCarousel'
import { cn } from '@/lib/utils'

type StatusType = 'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled'
type CurrencyType = 'USD' | 'EUR' | 'GBP'

const STATUS_OPTIONS: {
  value: StatusType
  label: string
  color: string
  bg: string
  ring: string
  dot: string
}[] = [
  { value: 'pending',     label: 'Pending',     color: 'text-yellow-400', bg: 'bg-yellow-400/10', ring: 'ring-yellow-400/25', dot: 'bg-yellow-400' },
  { value: 'in-progress', label: 'In Progress', color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   ring: 'ring-cyan-400/25',   dot: 'bg-cyan-400'   },
  { value: 'on-hold',     label: 'On Hold',     color: 'text-orange-400', bg: 'bg-orange-400/10', ring: 'ring-orange-400/25', dot: 'bg-orange-400' },
  { value: 'completed',   label: 'Completed',   color: 'text-green-400',  bg: 'bg-green-400/10',  ring: 'ring-green-400/25',  dot: 'bg-green-400'  },
  { value: 'cancelled',   label: 'Cancelled',   color: 'text-red-400',    bg: 'bg-red-400/10',    ring: 'ring-red-400/25',    dot: 'bg-red-400'    },
]

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

export function ProjectCarouselEditModal({ project }: { project: SerializedProject }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [status, setStatus] = useState<StatusType>(project.status as StatusType)
  const [startDate, setStartDate] = useState(toDateInput(project.startDate))
  const [projectedEndDate, setProjectedEndDate] = useState(toDateInput(project.endDate))
  const [budgetAmount, setBudgetAmount] = useState(project.budget?.toString() ?? '')
  const [currency, setCurrency] = useState<CurrencyType>((project.currency as CurrencyType) ?? 'USD')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setName(project.name)
      setDescription(project.description ?? '')
      setStatus(project.status as StatusType)
      setStartDate(toDateInput(project.startDate))
      setProjectedEndDate(toDateInput(project.endDate))
      setBudgetAmount(project.budget?.toString() ?? '')
      setCurrency((project.currency as CurrencyType) ?? 'USD')
      setError(null)
      setSuccessMessage(null)
    }
  }, [open, project])

  // Auto-close after success + refresh
  useEffect(() => {
    if (!successMessage) return
    const t = setTimeout(() => {
      setOpen(false)
      router.refresh()
    }, 1200)
    return () => clearTimeout(t)
  }, [successMessage, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Project name is required'); return }
    if (startDate && projectedEndDate && new Date(projectedEndDate) < new Date(startDate)) {
      setError('End date must be after start date')
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
        budgetAmount: budgetAmount ? parseFloat(budgetAmount) : null,
        currency,
      },
    })
    setIsLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Failed to update project')
      return
    }
    setSuccessMessage('Saved successfully')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-white/45 hover:text-white/75 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.18] rounded-lg px-3.5 py-2.5 transition-all duration-150"
        >
          <Settings className="size-3.5" />
          Edit
        </button>
      </DialogTrigger>

      <DialogContent className="bg-black border-white/[0.06] max-w-2xl p-0 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/[0.05]">
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-light mb-2">
            Project Settings
          </p>
          <DialogTitle className="text-xl font-bold text-white leading-tight line-clamp-1">
            {project.name}
          </DialogTitle>
          <DialogDescription className="sr-only">Edit project settings</DialogDescription>
          <div className="mt-3 w-6 h-px bg-cyan-400/40" />
        </div>

        {/* Form */}
        <form
          id="carousel-edit-form"
          onSubmit={handleSubmit}
          className="px-8 py-7 space-y-8 max-h-[58vh] overflow-y-auto"
        >
          {/* Identity */}
          <section className="space-y-4">
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">Identity</p>
            <div className="space-y-1.5">
              <label htmlFor="ce-name" className="text-[11px] text-white/35 tracking-wide">
                Project Name <span className="text-red-400/60">*</span>
              </label>
              <Input
                id="ce-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/[0.03] border-white/[0.06] text-white focus:border-cyan-400/30 focus-visible:ring-0"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ce-desc" className="text-[11px] text-white/35 tracking-wide">Description</label>
              <Textarea
                id="ce-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description…"
                className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 focus:border-cyan-400/30 focus-visible:ring-0 resize-none"
                disabled={isLoading}
              />
            </div>
          </section>

          {/* Status */}
          <section className="space-y-3">
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
                    status === opt.value
                      ? cn(opt.bg, opt.color, 'ring-1', opt.ring)
                      : 'bg-white/[0.03] text-white/30 hover:bg-white/[0.06] hover:text-white/55 border border-white/[0.06]',
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', status === opt.value ? opt.dot : 'bg-white/20')} />
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section className="space-y-3">
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">Timeline</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="ce-start" className="text-[11px] text-white/35 tracking-wide">Start Date</label>
                <Input
                  id="ce-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/[0.03] border-white/[0.06] text-white focus:border-cyan-400/30 focus-visible:ring-0 [color-scheme:dark]"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ce-end" className="text-[11px] text-white/35 tracking-wide">Target End</label>
                <Input
                  id="ce-end"
                  type="date"
                  value={projectedEndDate}
                  onChange={(e) => setProjectedEndDate(e.target.value)}
                  className="bg-white/[0.03] border-white/[0.06] text-white focus:border-cyan-400/30 focus-visible:ring-0 [color-scheme:dark]"
                  disabled={isLoading}
                />
              </div>
            </div>
          </section>

          {/* Budget */}
          <section className="space-y-3">
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">Budget</p>
            <div className="flex gap-3">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 focus:border-cyan-400/30 focus-visible:ring-0"
                disabled={isLoading}
              />
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as CurrencyType)}
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
        </form>

        {/* Footer */}
        <div className="px-8 pb-7 pt-5 border-t border-white/[0.05] space-y-3">
          {error && (
            <p className="text-xs text-red-400/75 animate-in fade-in slide-in-from-bottom-1 duration-200">
              {error}
            </p>
          )}
          {successMessage && (
            <div className="flex items-center gap-2 text-xs text-green-400/80 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <CheckCircle className="size-3.5 shrink-0" />
              {successMessage}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1 text-white/35 hover:text-white/55 hover:bg-white/[0.04] border border-white/[0.06] transition-all duration-150"
            >
              <X className="size-3.5 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              form="carousel-edit-form"
              disabled={isLoading}
              className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/10"
            >
              {isLoading ? (
                <><Loader2 className="size-3.5 mr-2 animate-spin" />Saving…</>
              ) : (
                <><Save className="size-3.5 mr-2" />Save Changes</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
