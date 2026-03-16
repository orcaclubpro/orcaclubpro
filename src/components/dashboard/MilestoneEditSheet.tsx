'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Loader2, Calendar, Trash2, CheckCircle2 } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { updateMilestone, deleteMilestone } from '@/actions/projects'
import { cn } from '@/lib/utils'

interface MilestoneData {
  title: string
  date: string
  description?: string | null
  completed?: boolean | null
}

interface MilestoneEditSheetProps {
  projectId: string
  milestoneIndex: number | null
  milestone: MilestoneData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MilestoneEditSheet({
  projectId,
  milestoneIndex,
  milestone,
  open,
  onOpenChange,
}: MilestoneEditSheetProps) {
  const router = useRouter()
  const [title, setTitle]             = useState('')
  const [date, setDate]               = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [isDeleting, setIsDeleting]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title)
      setDate(milestone.date)
      setDescription(milestone.description || '')
      setError(null)
      setFieldErrors({})
      setConfirmDelete(false)
    }
  }, [milestone])

  const clearField = (key: string) =>
    setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next })

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!date)         errs.date  = 'Date is required'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate() || milestoneIndex === null) return
    setIsLoading(true)
    const result = await updateMilestone({
      projectId,
      milestoneIndex,
      title: title.trim(),
      date,
      description: description.trim() || undefined,
      completed: milestone?.completed ?? false,
    })
    setIsLoading(false)
    if (!result.success) { setError(result.error || 'Failed to save'); return }
    onOpenChange(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    if (milestoneIndex === null) return
    setIsDeleting(true)
    const result = await deleteMilestone({ projectId, milestoneIndex })
    setIsDeleting(false)
    if (!result.success) { setError(result.error || 'Failed to delete'); return }
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#1C1C1C] border-[#404040] w-full sm:max-w-md p-0 flex flex-col gap-0 overflow-hidden">

        <div className="h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent shrink-0" />

        <div className="absolute top-0 right-0 pointer-events-none select-none" aria-hidden="true">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="opacity-[0.04]">
            <path d="M80 0 L80 80 L0 80" stroke="#333333" strokeWidth="1" />
            <path d="M80 24 L80 80 L24 80" stroke="#333333" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="px-7 pt-7 pb-6 border-b border-[#404040] shrink-0">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#6B6B6B] font-light mb-4">Edit Milestone</p>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-400/10 border border-green-400/20">
              <Flag className="size-4 text-green-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#F0F0F0] leading-snug truncate">{title || 'Milestone'}</h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Modify or remove this milestone</p>
            </div>
          </div>
          <div className="mt-5 w-6 h-px bg-green-400/40" />
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

            <div className="space-y-1.5">
              <label className="text-xs text-[#6B6B6B] font-medium tracking-wide">Milestone Title</label>
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); clearField('title') }}
                placeholder="Milestone title"
                className={cn(
                  'w-full bg-[rgba(255,255,255,0.06)] border rounded-lg px-4 py-2.5 text-[#F0F0F0] placeholder:text-[#6B6B6B] text-sm outline-none transition-all duration-200',
                  'focus:bg-[rgba(255,255,255,0.06)] focus:ring-1 focus:ring-green-400/20 focus:border-green-400/35',
                  fieldErrors.title ? 'border-red-400/50' : 'border-[#404040]',
                )}
              />
              {fieldErrors.title && <p className="text-xs text-red-400">{fieldErrors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#6B6B6B] font-medium tracking-wide">Target Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#6B6B6B] pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); clearField('date') }}
                  className={cn(
                    'w-full bg-[rgba(255,255,255,0.06)] border rounded-lg pl-10 pr-4 py-2.5 text-[#F0F0F0] text-sm outline-none transition-all duration-200 [color-scheme:light]',
                    'focus:bg-[rgba(255,255,255,0.06)] focus:border-green-400/35',
                    fieldErrors.date ? 'border-red-400/50' : 'border-[#404040]',
                  )}
                />
              </div>
              {fieldErrors.date && <p className="text-xs text-red-400">{fieldErrors.date}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#6B6B6B] font-medium tracking-wide">Description</label>
                <span className="text-[10px] text-[#6B6B6B]">Optional</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes about this milestone..."
                rows={3}
                className="w-full bg-[rgba(255,255,255,0.06)] border border-[#404040] rounded-lg px-4 py-2.5 text-[#F0F0F0] placeholder:text-[#6B6B6B] text-sm outline-none transition-all duration-200 resize-none focus:bg-[rgba(255,255,255,0.06)] focus:ring-1 focus:ring-green-400/20 focus:border-green-400/35"
              />
            </div>

            {milestone?.completed && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-400/[0.06] border border-green-400/15">
                <CheckCircle2 className="size-4 text-green-400 shrink-0" />
                <p className="text-sm text-green-400">Marked as completed</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          <div className="shrink-0 px-7 pb-7 pt-4 border-t border-[#404040] bg-[#1C1C1C] space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[rgba(255,255,255,0.06)] border border-green-400/20 text-[#F0F0F0] font-semibold py-3 rounded-xl hover:bg-[rgba(255,255,255,0.06)] hover:border-green-400/35 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isLoading
                ? <><Loader2 className="size-4 animate-spin" />Saving...</>
                : <><Flag className="size-4 text-green-400" />Save Changes</>
              }
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              onBlur={() => setTimeout(() => setConfirmDelete(false), 300)}
              className={cn(
                'w-full border font-medium py-2.5 rounded-xl active:scale-[0.99] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm',
                confirmDelete
                  ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/15'
                  : 'bg-transparent border-[#404040] text-[#6B6B6B] hover:border-red-500/30 hover:text-red-400',
              )}
            >
              {isDeleting
                ? <><Loader2 className="size-4 animate-spin" />Deleting...</>
                : <><Trash2 className="size-4" />{confirmDelete ? 'Click again to confirm' : 'Delete Milestone'}</>
              }
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
