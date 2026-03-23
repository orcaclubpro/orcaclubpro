'use client'

import { useState } from 'react'
import { Flag, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createMilestone } from '@/actions/projects'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Name', 'Date', 'Notes'] as const

function fmtFull(d: string) {
  if (!d) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(d + 'T00:00:00'))
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface CreateMilestoneModalProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateMilestoneModal({
  projectId,
  open,
  onOpenChange,
  onSuccess,
}: CreateMilestoneModalProps) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setStep(1)
    setTitle('')
    setDate('')
    setDescription('')
    setError(null)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm()
    onOpenChange(val)
  }

  const goNext = () => {
    setError(null)
    if (step === 1 && !title.trim()) { setError('Please give this milestone a name.'); return }
    if (step === 2 && !date) { setError('Please pick a target date.'); return }
    setStep((s) => Math.min(s + 1, 3))
  }

  const goBack = () => { setError(null); setStep((s) => Math.max(s - 1, 1)) }

  const handleSubmit = async () => {
    setError(null)
    setIsLoading(true)
    const result = await createMilestone({
      projectId,
      title: title.trim(),
      date,
      description: description.trim() || undefined,
    })
    setIsLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to create milestone.')
      return
    }
    resetForm()
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[var(--space-bg-card)] border-[var(--space-border-hard)] sm:max-w-[520px] p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">New Milestone</DialogTitle>
        <DialogDescription className="sr-only">Create a new milestone step by step</DialogDescription>

        {/* Step indicator */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center gap-0">
            {STEPS.map((_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div
                  className={cn(
                    'size-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-300',
                    step === i + 1
                      ? 'bg-green-400 text-[var(--space-text-primary)] ring-4 ring-green-400/[0.15]'
                      : i + 1 < step
                      ? 'bg-green-400/20 text-green-400'
                      : 'bg-[rgba(255,255,255,0.06)] text-[var(--space-text-secondary)]'
                  )}
                >
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-px mx-2 transition-all duration-500',
                      i + 1 < step ? 'bg-green-400/40' : 'bg-[var(--space-divider)]'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex mt-2 gap-0">
            {STEPS.map((label, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 last:flex-none text-[10px] font-medium transition-colors duration-300',
                  step === i + 1 ? 'text-[var(--space-text-secondary)]' : i + 1 < step ? 'text-[var(--space-text-secondary)]' : 'text-[var(--space-text-secondary)]'
                )}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div key={step} className="px-8 pt-8 pb-3 min-h-[220px]">

          {/* ── Step 1: Name ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[var(--space-text-primary)] mb-1.5">Name this milestone</h2>
                <p className="text-sm text-[var(--space-text-secondary)]">Give it a clear, meaningful name that marks a real deliverable.</p>
              </div>
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') goNext() }}
                placeholder="Beta Launch, Design Handoff, v1.0..."
                className="bg-transparent border-0 border-b border-[var(--space-border-hard)] rounded-none px-0 text-xl font-semibold text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus-visible:ring-0 focus-visible:border-green-400/60 h-auto py-3 transition-colors"
              />
            </div>
          )}

          {/* ── Step 2: Date ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[var(--space-text-primary)] mb-1.5">When is it due?</h2>
                <p className="text-sm text-[var(--space-text-secondary)]">
                  Target date for{' '}
                  <span className="text-[var(--space-text-tertiary)]">&ldquo;{title}&rdquo;</span>.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--space-text-secondary)] flex items-center gap-1.5">
                  <Calendar className="size-3" /> Target Date
                </label>
                <Input
                  autoFocus
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && date) goNext() }}
                  className="bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus:border-green-400/40 text-sm [color-scheme:light]"
                />
              </div>
              {date && (
                <p className="text-sm text-green-400/80 flex items-center gap-2">
                  <Flag className="size-3.5 shrink-0" />
                  {fmtFull(date)}
                </p>
              )}
            </div>
          )}

          {/* ── Step 3: Notes + Preview ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--space-text-primary)] mb-1.5">Any notes?</h2>
                <p className="text-sm text-[var(--space-text-secondary)]">
                  Describe what reaching{' '}
                  <span className="text-[var(--space-text-tertiary)]">&ldquo;{title}&rdquo;</span> means.{' '}
                  <span className="text-[var(--space-text-secondary)]">Optional.</span>
                </p>
              </div>
              <Textarea
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be delivered? What does success look like?"
                rows={3}
                className="bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus:border-green-400/30 resize-none text-sm leading-relaxed"
              />

              {/* Preview card */}
              <div className="relative overflow-hidden rounded-xl border border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.06)] p-4">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-green-400/50 via-green-400/20 to-transparent" />
                <p className="text-[10px] tracking-[0.25em] uppercase text-green-400/50 mb-3">Preview</p>
                <div className="flex items-start gap-3">
                  <div className="mt-1 size-3 rounded-full border-2 border-[var(--space-border-hard)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--space-text-primary)]">{title}</p>
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
            </div>
          )}

        </div>

        {/* Error */}
        {error && (
          <div className="mx-8 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between px-8 py-6 mt-2 border-t border-[var(--space-border-hard)]">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-sm text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="size-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              onClick={goNext}
              className="bg-[rgba(255,255,255,0.06)] border border-[var(--space-border-hard)] hover:bg-[rgba(255,255,255,0.06)] text-[var(--space-text-primary)] font-medium"
            >
              Next <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !title.trim() || !date}
              className="bg-green-400 text-[var(--space-text-primary)] hover:bg-green-400/90 font-semibold disabled:opacity-40"
            >
              {isLoading
                ? <><Loader2 className="size-4 mr-2 animate-spin" />Adding...</>
                : <><Flag className="size-4 mr-2" />Add Milestone</>
              }
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}
