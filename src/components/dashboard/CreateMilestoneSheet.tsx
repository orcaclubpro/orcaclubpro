'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Loader2, Calendar } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { createMilestone } from '@/actions/projects'
import { cn } from '@/lib/utils'

interface CreateMilestoneSheetProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function fmtFull(d: string) {
  if (!d) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(d + 'T00:00:00'))
}

export function CreateMilestoneSheet({ projectId, open, onOpenChange }: CreateMilestoneSheetProps) {
  const router = useRouter()
  const [title, setTitle]             = useState('')
  const [date, setDate]               = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const showPreview = !!title.trim() && !!date

  const clearField = (key: string) =>
    setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next })

  const reset = () => {
    setTitle(''); setDate(''); setDescription('')
    setError(null); setFieldErrors({})
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Milestone title is required'
    if (!date)         errs.date  = 'Target date is required'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setIsLoading(true)
    const result = await createMilestone({
      projectId,
      title: title.trim(),
      date,
      description: description.trim() || undefined,
    })
    setIsLoading(false)
    if (!result.success) { setError(result.error || 'Failed to create milestone'); return }
    reset(); onOpenChange(false); router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <SheetContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] w-full sm:max-w-md p-0 flex flex-col gap-0 overflow-hidden">

        {/* Green top accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent shrink-0" />

        {/* Corner SVG */}
        <div className="absolute top-0 right-0 pointer-events-none select-none" aria-hidden="true">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="opacity-[0.04]">
            <path d="M80 0 L80 80 L0 80" stroke="var(--space-divider)" strokeWidth="1" />
            <path d="M80 24 L80 80 L24 80" stroke="var(--space-divider)" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Header */}
        <div className="px-7 pt-7 pb-6 border-b border-[var(--space-border-hard)] shrink-0">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[var(--space-text-secondary)] font-light mb-4">New Milestone</p>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-400/10 border border-green-400/20">
              <Flag className="size-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--space-text-primary)] leading-snug">Add a Milestone</h2>
              <p className="text-xs text-[var(--space-text-secondary)] mt-0.5">Mark an important project deliverable</p>
            </div>
          </div>
          <div className="mt-5 w-6 h-px bg-green-400/40" />
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--space-text-secondary)] font-medium tracking-wide">Milestone Title</label>
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); clearField('title') }}
                placeholder="e.g., Beta Launch, Design Handoff"
                disabled={isLoading}
                autoFocus
                className={cn(
                  'w-full bg-[rgba(255,255,255,0.06)] border rounded-lg px-4 py-2.5 text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] text-sm outline-none transition-all duration-200',
                  'focus:bg-[rgba(255,255,255,0.06)] focus:ring-1 focus:ring-green-400/20 focus:border-green-400/35',
                  fieldErrors.title ? 'border-red-400/50' : 'border-[var(--space-border-hard)]',
                )}
              />
              {fieldErrors.title && <p className="text-xs text-red-400">{fieldErrors.title}</p>}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--space-text-secondary)] font-medium tracking-wide">Target Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--space-text-secondary)] pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); clearField('date') }}
                  disabled={isLoading}
                  className={cn(
                    'w-full bg-[rgba(255,255,255,0.06)] border rounded-lg pl-10 pr-4 py-2.5 text-[var(--space-text-primary)] text-sm outline-none transition-all duration-200 [color-scheme:light]',
                    'focus:bg-[rgba(255,255,255,0.06)] focus:border-green-400/35',
                    fieldErrors.date ? 'border-red-400/50' : 'border-[var(--space-border-hard)]',
                  )}
                />
              </div>
              {fieldErrors.date && <p className="text-xs text-red-400">{fieldErrors.date}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[var(--space-text-secondary)] font-medium tracking-wide">Description</label>
                <span className="text-[10px] text-[var(--space-text-secondary)]">Optional</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does reaching this milestone mean for the project?"
                rows={3}
                disabled={isLoading}
                className="w-full bg-[rgba(255,255,255,0.06)] border border-[var(--space-border-hard)] rounded-lg px-4 py-2.5 text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] text-sm outline-none transition-all duration-200 resize-none focus:bg-[rgba(255,255,255,0.06)] focus:ring-1 focus:ring-green-400/20 focus:border-green-400/35"
              />
            </div>

            {/* Live preview */}
            {showPreview && (
              <div className="relative overflow-hidden rounded-xl border border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.06)] p-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-green-400/50 via-green-400/20 to-transparent" />
                <p className="text-[10px] tracking-[0.25em] uppercase text-green-400/50 mb-3">Preview</p>
                <div className="flex items-start gap-3">
                  <div className="mt-1 size-3 rounded-full border-2 border-[var(--space-border-hard)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--space-text-primary)] truncate">{title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar className="size-3 text-[var(--space-text-secondary)] shrink-0" />
                      <span className="text-xs text-[var(--space-text-secondary)]">{fmtFull(date)}</span>
                    </div>
                    {description.trim() && (
                      <p className="text-xs text-[var(--space-text-secondary)] mt-2 leading-relaxed border-t border-[var(--space-border-hard)] pt-2">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 px-7 pb-7 pt-4 border-t border-[var(--space-border-hard)] bg-[var(--space-bg-base)]">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[rgba(255,255,255,0.06)] border border-green-400/20 text-[var(--space-text-primary)] font-semibold py-3 rounded-xl hover:bg-[rgba(255,255,255,0.06)] hover:border-green-400/35 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <><Loader2 className="size-4 animate-spin" />Adding milestone...</>
              ) : (
                <><Flag className="size-4 text-green-400" />Add Milestone</>
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
