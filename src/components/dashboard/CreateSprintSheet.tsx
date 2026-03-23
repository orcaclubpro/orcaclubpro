'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Loader2, ArrowRight, Calendar } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { createSprint } from '@/actions/sprints'
import { cn } from '@/lib/utils'

interface CreateSprintSheetProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function durationDays(start: string, end: string): number | null {
  if (!start || !end) return null
  const diff = new Date(end).getTime() - new Date(start).getTime()
  if (diff <= 0) return null
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

function fmtShort(d: string) {
  if (!d) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d + 'T00:00:00'))
}

export function CreateSprintSheet({ projectId, open, onOpenChange }: CreateSprintSheetProps) {
  const router = useRouter()
  const [name, setName]                   = useState('')
  const [startDate, setStartDate]         = useState('')
  const [endDate, setEndDate]             = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [isLoading, setIsLoading]         = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [fieldErrors, setFieldErrors]     = useState<Record<string, string>>({})

  const days = useMemo(() => durationDays(startDate, endDate), [startDate, endDate])
  const showPreview = !!name.trim() && !!startDate && !!endDate && !!days

  const clearField = (key: string) =>
    setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next })

  const reset = () => {
    setName(''); setStartDate(''); setEndDate(''); setGoalDescription('')
    setError(null); setFieldErrors({})
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Sprint name is required'
    if (!startDate)   errs.startDate = 'Required'
    if (!endDate)     errs.endDate = 'Required'
    if (startDate && endDate && new Date(endDate) <= new Date(startDate))
      errs.endDate = 'Must be after start date'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setIsLoading(true)
    const result = await createSprint({
      projectId,
      name: name.trim(),
      startDate,
      endDate,
      goalDescription: goalDescription.trim() || undefined,
    })
    setIsLoading(false)
    if (!result.success) { setError(result.error || 'Failed to create sprint'); return }
    reset(); onOpenChange(false); router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <SheetContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] w-full sm:max-w-md p-0 flex flex-col gap-0 overflow-hidden">

        {/* Top accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(139,156,182,0.50)] to-transparent shrink-0" />

        {/* Corner SVG */}
        <div className="absolute top-0 right-0 pointer-events-none select-none" aria-hidden="true">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="opacity-[0.04]">
            <path d="M80 0 L80 80 L0 80" stroke="var(--space-divider)" strokeWidth="1" />
            <path d="M80 24 L80 80 L24 80" stroke="var(--space-divider)" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Header */}
        <div className="px-7 pt-7 pb-6 border-b border-[var(--space-border-hard)] shrink-0">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[var(--space-text-secondary)] font-light mb-4">New Sprint</p>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(139,156,182,0.10)] border border-[rgba(139,156,182,0.15)]">
              <Zap className="size-4 text-[var(--space-accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--space-text-primary)] leading-snug">Create a Sprint</h2>
              <p className="text-xs text-[var(--space-text-secondary)] mt-0.5">Group tasks over a focused time period</p>
            </div>
          </div>
          <div className="mt-5 w-6 h-px bg-[rgba(139,156,182,0.25)]" />
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

            {/* Sprint Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--space-text-secondary)] font-medium tracking-wide">Sprint Name</label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); clearField('name') }}
                placeholder="e.g., Sprint 1 — Foundation"
                disabled={isLoading}
                autoFocus
                className={cn(
                  'w-full bg-[rgba(255,255,255,0.06)] border rounded-lg px-4 py-2.5 text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] text-sm outline-none transition-all duration-200',
                  'focus:bg-[rgba(255,255,255,0.06)] focus:ring-1 focus:ring-[rgba(139,156,182,0.18)] focus:border-[rgba(139,156,182,0.25)]',
                  fieldErrors.name ? 'border-red-400/50' : 'border-[var(--space-border-hard)]',
                )}
              />
              {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--space-text-secondary)] font-medium tracking-wide">Duration</label>
              <div className="flex items-start gap-2">
                {/* Start */}
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] text-[var(--space-text-secondary)] uppercase tracking-widest">Start</p>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); clearField('startDate') }}
                    disabled={isLoading}
                    className={cn(
                      'w-full bg-[rgba(255,255,255,0.06)] border rounded-lg px-3 py-2.5 text-[var(--space-text-primary)] text-sm outline-none transition-all duration-200 [color-scheme:light]',
                      'focus:bg-[rgba(255,255,255,0.06)] focus:border-[rgba(139,156,182,0.25)]',
                      fieldErrors.startDate ? 'border-red-400/50' : 'border-[var(--space-border-hard)]',
                    )}
                  />
                </div>

                {/* Middle connector */}
                <div className="flex flex-col items-center pt-6 px-1 shrink-0">
                  {days ? (
                    <div className="px-2 py-1 rounded-md bg-[rgba(139,156,182,0.10)] border border-[rgba(139,156,182,0.15)] whitespace-nowrap">
                      <span className="text-[10px] font-semibold text-[var(--space-accent)]">{days}d</span>
                    </div>
                  ) : (
                    <ArrowRight className="size-3.5 text-[var(--space-text-secondary)] mt-1" />
                  )}
                </div>

                {/* End */}
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] text-[var(--space-text-secondary)] uppercase tracking-widest">End</p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); clearField('endDate') }}
                    disabled={isLoading}
                    className={cn(
                      'w-full bg-[rgba(255,255,255,0.06)] border rounded-lg px-3 py-2.5 text-[var(--space-text-primary)] text-sm outline-none transition-all duration-200 [color-scheme:light]',
                      'focus:bg-[rgba(255,255,255,0.06)] focus:border-[rgba(139,156,182,0.25)]',
                      fieldErrors.endDate ? 'border-red-400/50' : 'border-[var(--space-border-hard)]',
                    )}
                  />
                </div>
              </div>
              {(fieldErrors.endDate || fieldErrors.startDate) && (
                <p className="text-xs text-red-400">{fieldErrors.endDate || fieldErrors.startDate}</p>
              )}
            </div>

            {/* Goal */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[var(--space-text-secondary)] font-medium tracking-wide">Sprint Goal</label>
                <span className="text-[10px] text-[var(--space-text-secondary)]">Optional</span>
              </div>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder="What should this sprint accomplish?"
                rows={3}
                disabled={isLoading}
                className="w-full bg-[rgba(255,255,255,0.06)] border border-[var(--space-border-hard)] rounded-lg px-4 py-2.5 text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] text-sm outline-none transition-all duration-200 resize-none focus:bg-[rgba(255,255,255,0.06)] focus:ring-1 focus:ring-[rgba(139,156,182,0.18)] focus:border-[rgba(139,156,182,0.25)]"
              />
            </div>

            {/* Live preview */}
            {showPreview && (
              <div className="relative overflow-hidden rounded-xl border border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.06)] p-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[rgba(139,156,182,0.30)] via-[rgba(139,156,182,0.15)] to-transparent" />
                <p className="text-[10px] tracking-[0.25em] uppercase text-[rgba(139,156,182,0.30)] mb-3">Preview</p>
                <p className="text-sm font-semibold text-[var(--space-text-primary)] truncate">{name}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Calendar className="size-3 text-[var(--space-text-secondary)] shrink-0" />
                  <span className="text-xs text-[var(--space-text-secondary)]">{fmtShort(startDate)} → {fmtShort(endDate)}</span>
                  <span className="text-[var(--space-text-secondary)]">·</span>
                  <span className="text-xs font-medium text-[var(--space-accent)]">{days}-day sprint</span>
                </div>
                {goalDescription.trim() && (
                  <p className="text-xs text-[var(--space-text-secondary)] mt-2 leading-relaxed border-t border-[var(--space-border-hard)] pt-2">
                    {goalDescription}
                  </p>
                )}
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
              className="w-full bg-[var(--space-accent)] text-[var(--space-text-primary)] font-semibold py-3 rounded-xl hover:bg-[var(--space-accent)]/90 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-[rgba(139,156,182,0.10)] hover:shadow-[rgba(139,156,182,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <><Loader2 className="size-4 animate-spin" />Creating sprint...</>
              ) : (
                <><Zap className="size-4" />Create Sprint</>
              )}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
