'use client'

import { useState } from 'react'
import {
  Plus, Loader2, Zap, X, Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSprint } from '@/actions/sprints'
import { createTask } from '@/actions/tasks'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  low:    { label: 'Low',  activeClass: 'text-gray-300 border-gray-500/60 bg-gray-500/10'       },
  medium: { label: 'Med',  activeClass: 'text-blue-400 border-blue-500/50 bg-blue-500/10'       },
  high:   { label: 'High', activeClass: 'text-orange-400 border-orange-500/50 bg-orange-500/10' },
  urgent: { label: 'Urg',  activeClass: 'text-red-400 border-red-500/50 bg-red-500/10'          },
} as const

type Priority = keyof typeof PRIORITY_CONFIG

interface DraftTask { title: string; description: string; priority: Priority }

const STEPS = ['Name', 'Goal', 'Timeline', 'Tasks'] as const

// ─── Component ────────────────────────────────────────────────────────────────

export interface CreateSprintModalProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateSprintModal({ projectId, open, onOpenChange, onSuccess }: CreateSprintModalProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setStep(1)
    setName('')
    setGoal('')
    setStartDate('')
    setEndDate('')
    setDraftTasks([])
    setError(null)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm()
    onOpenChange(val)
  }

  const goNext = () => {
    setError(null)
    if (step === 1 && !name.trim()) { setError('Please give your sprint a name.'); return }
    if (step === 3 && startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date.'); return
    }
    setStep((s) => Math.min(s + 1, 4))
  }

  const goBack = () => { setError(null); setStep((s) => Math.max(s - 1, 1)) }

  const handleSubmit = async () => {
    setError(null)
    setIsLoading(true)

    const result = await createSprint({
      projectId,
      name: name.trim(),
      goalDescription: goal.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })

    if (!result.success) {
      setError(result.error ?? 'Failed to create sprint.')
      setIsLoading(false)
      return
    }

    const validTasks = draftTasks.filter((t) => t.title.trim())
    if (validTasks.length > 0) {
      const sprintId = (result as any).sprint?.id as string | undefined
      if (sprintId) {
        await Promise.all(
          validTasks.map((t) =>
            createTask({
              projectId,
              title: t.title.trim(),
              description: t.description.trim() || undefined,
              priority: t.priority,
              sprintId,
            })
          )
        )
      }
    }

    setIsLoading(false)
    resetForm()
    onSuccess()
  }

  const addDraftTask = () => {
    if (draftTasks.length < 10) setDraftTasks((p) => [...p, { title: '', description: '', priority: 'medium' }])
  }
  const removeDraftTask = (i: number) => setDraftTasks((p) => p.filter((_, idx) => idx !== i))
  const updateDraftTask = (i: number, f: 'title' | 'description' | 'priority', v: string) =>
    setDraftTasks((p) => p.map((t, idx) => (idx === i ? { ...t, [f]: v } : t)))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[var(--space-bg-card)] border-[var(--space-border-hard)] sm:max-w-[520px] p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">New Sprint</DialogTitle>
        <DialogDescription className="sr-only">Create a new sprint step by step</DialogDescription>

        {/* Step indicator */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center gap-0">
            {STEPS.map((_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div
                  className={cn(
                    'size-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-300',
                    step === i + 1
                      ? 'bg-[var(--space-accent)] text-[var(--space-text-primary)] ring-4 ring-[rgba(139,156,182,0.10)]'
                      : i + 1 < step
                      ? 'bg-[rgba(139,156,182,0.15)] text-[var(--space-accent)]'
                      : 'bg-[rgba(255,255,255,0.06)] text-[var(--space-text-secondary)]'
                  )}
                >
                  {i + 1 < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-px mx-2 transition-all duration-500',
                      i + 1 < step ? 'bg-[rgba(139,156,182,0.25)]' : 'bg-[var(--space-divider)]'
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
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[var(--space-text-primary)] mb-1.5">Name your sprint</h2>
                <p className="text-sm text-[var(--space-text-secondary)]">Give this sprint a clear, memorable name.</p>
              </div>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') goNext() }}
                placeholder="Sprint 1 — Foundation"
                className="bg-transparent border-0 border-b border-[var(--space-border-hard)] rounded-none px-0 text-xl font-semibold text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus-visible:ring-0 focus-visible:border-[rgba(139,156,182,0.50)] h-auto py-3 transition-colors"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[var(--space-text-primary)] mb-1.5">What&apos;s the goal?</h2>
                <p className="text-sm text-[var(--space-text-secondary)]">
                  What should be done by the end of{' '}
                  <span className="text-[var(--space-text-tertiary)]">&ldquo;{name}&rdquo;</span>?
                </p>
              </div>
              <Textarea
                autoFocus
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ship the initial foundation, set up CI/CD, get the first feature into staging..."
                rows={4}
                className="bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus:border-[var(--space-border-hard)] resize-none text-sm leading-relaxed"
              />
              <p className="text-xs text-[var(--space-text-secondary)]">Optional — skip to continue without a goal.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[var(--space-text-primary)] mb-1.5">When does it run?</h2>
                <p className="text-sm text-[var(--space-text-secondary)]">
                  Set a timeframe.{' '}
                  <span className="text-[var(--space-text-secondary)]">Optional — leave blank if not decided yet.</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="sprint-modal-start" className="text-xs text-[var(--space-text-secondary)] flex items-center gap-1.5">
                    <Calendar className="size-3" /> Start
                  </label>
                  <Input
                    id="sprint-modal-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus:border-[var(--space-border-hard)] text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sprint-modal-end" className="text-xs text-[var(--space-text-secondary)] flex items-center gap-1.5">
                    <Calendar className="size-3" /> End
                  </label>
                  <Input
                    id="sprint-modal-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus:border-[var(--space-border-hard)] text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--space-text-primary)] mb-1.5">Add some tasks</h2>
                <p className="text-sm text-[var(--space-text-secondary)]">
                  Kickoff tasks for{' '}
                  <span className="text-[var(--space-text-tertiary)]">&ldquo;{name}&rdquo;</span>.{' '}
                  <span className="text-[var(--space-text-secondary)]">Optional.</span>
                </p>
              </div>

              {draftTasks.length > 0 && (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 -mr-1">
                  {draftTasks.map((task, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.06)] p-3 space-y-2.5 group"
                    >
                      {/* Title row */}
                      <div className="flex items-start gap-2.5">
                        <div className="size-1.5 rounded-full bg-[#555555] shrink-0 mt-2" />
                        <Input
                          value={task.title}
                          onChange={(e) => updateDraftTask(i, 'title', e.target.value)}
                          placeholder="Task title..."
                          className="flex-1 bg-transparent border-0 border-b border-[var(--space-border-hard)] rounded-none px-0 text-sm font-medium text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus-visible:ring-0 focus-visible:border-[rgba(139,156,182,0.30)] h-auto py-1 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => removeDraftTask(i)}
                          className="shrink-0 p-0.5 text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] opacity-0 group-hover:opacity-100 transition-all mt-1"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>

                      {/* Description */}
                      <Textarea
                        value={task.description}
                        onChange={(e) => updateDraftTask(i, 'description', e.target.value)}
                        placeholder="Add a description... (optional)"
                        rows={2}
                        className="w-full bg-transparent border-0 text-[var(--space-text-secondary)] placeholder:text-[var(--space-text-secondary)] resize-none text-xs leading-relaxed focus-visible:ring-0 focus-visible:outline-none p-0 ml-[18px] min-h-0"
                      />

                      {/* Priority pills */}
                      <div className="flex items-center gap-1 ml-[18px]">
                        <span className="text-[10px] text-[var(--space-text-secondary)] mr-1">Priority:</span>
                        {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => updateDraftTask(i, 'priority', p)}
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all',
                              task.priority === p
                                ? PRIORITY_CONFIG[p].activeClass
                                : 'text-[var(--space-text-secondary)] border-transparent hover:border-[var(--space-border-hard)] hover:text-[var(--space-text-tertiary)]'
                            )}
                          >
                            {PRIORITY_CONFIG[p].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                {draftTasks.length < 10 && (
                  <button
                    type="button"
                    onClick={addDraftTask}
                    className="flex items-center gap-1.5 text-sm text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] transition-colors"
                  >
                    <Plus className="size-3.5" />
                    Add a task
                  </button>
                )}
                {draftTasks.length === 0 && (
                  <p className="text-xs text-[var(--space-text-secondary)]">Skip to create the sprint now.</p>
                )}
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

          {step < 4 ? (
            <Button
              onClick={goNext}
              className="bg-[rgba(255,255,255,0.06)] border border-[var(--space-border-hard)] hover:bg-[rgba(255,255,255,0.06)] text-[var(--space-text-primary)] font-medium"
            >
              Next <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !name.trim()}
              className="bg-[var(--space-accent)] text-[var(--space-text-primary)] hover:bg-[var(--space-accent)]/90 font-semibold disabled:opacity-40"
            >
              {isLoading
                ? <><Loader2 className="size-4 mr-2 animate-spin" />Creating...</>
                : <><Zap className="size-4 mr-2" />Create Sprint</>
              }
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
