'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ArrowRight, ArrowLeft, Check, Loader2, Calendar, DollarSign, Layers, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { createProject } from '@/actions/projects'

export interface ClientOption {
  id: string
  name: string
}

type Step = 1 | 2 | 3

interface FormState {
  name: string
  description: string
  startDate: string
  projectedEndDate: string
  budget: string
  currency: 'USD' | 'EUR' | 'GBP'
}

const STEPS = [
  { num: 1 as Step, label: 'Basics',   icon: Layers   },
  { num: 2 as Step, label: 'Timeline', icon: Calendar  },
  { num: 3 as Step, label: 'Budget',   icon: DollarSign },
]

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' }

export function CreateProjectModal({
  clientId,
  clientName,
  clients,
}: {
  clientId?: string
  clientName?: string
  clients?: ClientOption[]
} = {}) {
  const router = useRouter()
  const [open, setOpen]                   = useState(false)
  const [step, setStep]                   = useState<Step>(1)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [created, setCreated]             = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId ?? '')

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    startDate: '',
    projectedEndDate: '',
    budget: '',
    currency: 'USD',
  })

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function resetAll() {
    setStep(1)
    setError(null)
    setCreated(null)
    setSelectedClientId(clientId ?? '')
    setForm({ name: '', description: '', startDate: '', projectedEndDate: '', budget: '', currency: 'USD' })
  }

  function handleOpenChange(val: boolean) {
    if (loading) return
    setOpen(val)
    if (!val) resetAll()
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const result = await createProject({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      clientId: selectedClientId || undefined,
      startDate: form.startDate || undefined,
      projectedEndDate: form.projectedEndDate || undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      currency: form.currency,
    })

    setLoading(false)

    if (result.success) {
      setCreated(form.name.trim())
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to create project')
    }
  }

  function canAdvance() {
    if (step === 1) return form.name.trim().length > 0
    return true
  }

  function advance() {
    if (step < 3) setStep((s) => (s + 1) as Step)
    else handleSubmit()
  }

  function back() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 text-black font-semibold gap-2"
      >
        <Plus className="size-4" />
        Create Project
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-[var(--space-bg-base)] border border-[var(--space-border-hard)] text-[var(--space-text-primary)] p-0 overflow-hidden sm:max-w-[560px] gap-0">
          <DialogTitle className="sr-only">Create Project</DialogTitle>

          {/* ── Success state ── */}
          {created ? (
            <div className="flex flex-col items-center justify-center text-center gap-5 py-16 px-8">
              <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Check className="size-8 text-emerald-400" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--space-text-primary)] mb-1">Project created</p>
                <p className="text-[var(--space-text-secondary)] text-sm">
                  <span className="text-[var(--space-text-tertiary)] font-medium">{created}</span> is ready to go.
                </p>
              </div>
              <Button
                onClick={() => handleOpenChange(false)}
                className="bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 text-black font-semibold mt-2"
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* ── Step indicator ── */}
              <div className="px-8 pt-8 pb-6 border-b border-[var(--space-border-hard)]">
                <div className="flex items-center gap-0">
                  {STEPS.map((s, i) => {
                    const done    = step > s.num
                    const current = step === s.num
                    const Icon    = s.icon
                    return (
                      <div key={s.num} className="flex items-center">
                        {/* Step circle */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div
                            className={`size-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                              done
                                ? 'bg-[rgba(139,156,182,0.06)] border-[rgba(139,156,182,0.15)]'
                                : current
                                  ? 'bg-[rgba(139,156,182,0.06)] border-[rgba(139,156,182,0.15)]'
                                  : 'bg-[rgba(255,255,255,0.02)] border-[var(--space-border-hard)]'
                            }`}
                          >
                            {done ? (
                              <Check className="size-4" style={{ color: 'var(--space-accent)' }} strokeWidth={2.5} />
                            ) : (
                              <Icon className={`size-4 ${current ? '' : 'text-[var(--space-text-muted)]'}`} style={current ? { color: 'var(--space-accent)' } : undefined} />
                            )}
                          </div>
                          <span
                            className={`text-[10px] uppercase tracking-wider font-semibold transition-colors duration-200 ${
                              done ? 'text-[var(--space-text-muted)]' : 'text-[var(--space-text-muted)]'
                            }`}
                            style={current ? { color: 'var(--space-accent)' } : undefined}
                          >
                            {s.label}
                          </span>
                        </div>
                        {/* Connector line */}
                        {i < STEPS.length - 1 && (
                          <div
                            className={`h-[1px] w-12 mx-3 mb-5 transition-all duration-300 ${
                              step > s.num ? 'bg-[rgba(139,156,182,0.20)]' : 'bg-[var(--space-divider)]'
                            }`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Step content ── */}
              <div className="px-8 py-7 min-h-[240px]">

                {/* Step 1: Basics */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[var(--space-text-muted)] font-semibold mb-1">Step 1</p>
                      <h3 className="text-xl font-bold text-[var(--space-text-primary)]">What are we building?</h3>
                    </div>
                    {clientId ? (
                      /* Pre-selected client (e.g. from client detail page) */
                      <div className="flex items-center gap-2 rounded-lg border border-[rgba(139,156,182,0.15)] bg-[rgba(139,156,182,0.06)] px-3 py-2">
                        <User className="size-3.5 shrink-0" style={{ color: 'var(--space-accent)', opacity: 0.7 }} />
                        <span className="text-xs text-[var(--space-text-secondary)]">Client:</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--space-accent)' }}>{clientName ?? 'Selected'}</span>
                      </div>
                    ) : clients && clients.length > 0 ? (
                      /* Client selector (e.g. from projects page) */
                      <div className="space-y-1.5">
                        <Label className="text-[var(--space-text-secondary)] text-sm">
                          Client <span className="text-[var(--space-text-muted)] text-xs font-normal">(optional)</span>
                        </Label>
                        <div className="relative">
                          <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="w-full appearance-none bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] text-[var(--space-text-primary)] rounded-md h-11 px-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(139,156,182,0.20)]"
                          >
                            <option value="" className="bg-[var(--space-bg-base)] text-[var(--space-text-secondary)]">No client</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id} className="bg-[var(--space-bg-base)] text-[var(--space-text-primary)]">{c.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-[var(--space-text-muted)] pointer-events-none" />
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[var(--space-text-secondary)] text-sm">Project name <span style={{ color: 'var(--space-accent)' }}>*</span></Label>
                        <Input
                          value={form.name}
                          onChange={(e) => set('name', e.target.value)}
                          placeholder="e.g. Brand Identity Redesign"
                          className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] text-base h-11 focus-visible:ring-[rgba(139,156,182,0.20)]"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && canAdvance() && advance()}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[var(--space-text-secondary)] text-sm">Description <span className="text-[var(--space-text-muted)] text-xs font-normal">(optional)</span></Label>
                        <Textarea
                          value={form.description}
                          onChange={(e) => set('description', e.target.value)}
                          placeholder="A brief overview of the project scope and goals..."
                          rows={3}
                          className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] resize-none focus-visible:ring-[rgba(139,156,182,0.20)]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Timeline */}
                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[var(--space-text-muted)] font-semibold mb-1">Step 2</p>
                      <h3 className="text-xl font-bold text-[var(--space-text-primary)]">When does it happen?</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[var(--space-text-secondary)] text-sm">Start date <span className="text-[var(--space-text-muted)] text-xs font-normal">(optional)</span></Label>
                        <Input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => set('startDate', e.target.value)}
                          className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] h-11 focus-visible:ring-[rgba(139,156,182,0.20)] [color-scheme:light]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[var(--space-text-secondary)] text-sm">Target end date <span className="text-[var(--space-text-muted)] text-xs font-normal">(optional)</span></Label>
                        <Input
                          type="date"
                          value={form.projectedEndDate}
                          onChange={(e) => set('projectedEndDate', e.target.value)}
                          min={form.startDate || undefined}
                          className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] h-11 focus-visible:ring-[rgba(139,156,182,0.20)] [color-scheme:light]"
                        />
                      </div>
                    </div>
                    {form.startDate && form.projectedEndDate && (
                      <div className="flex items-center gap-2 rounded-lg bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.15)] px-4 py-3 text-sm animate-in fade-in-0 duration-300" style={{ color: 'var(--space-accent)', opacity: 0.8 }}>
                        <Calendar className="size-4 shrink-0" style={{ color: 'var(--space-accent)', opacity: 0.6 }} />
                        <span>
                          {Math.ceil(
                            (new Date(form.projectedEndDate).getTime() - new Date(form.startDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          day project window
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Budget */}
                {step === 3 && (
                  <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[var(--space-text-muted)] font-semibold mb-1">Step 3</p>
                      <h3 className="text-xl font-bold text-[var(--space-text-primary)]">What's the budget?</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[var(--space-text-secondary)] text-sm">Budget amount <span className="text-[var(--space-text-muted)] text-xs font-normal">(optional)</span></Label>
                        <div className="flex gap-2">
                          {/* Currency picker */}
                          <div className="flex rounded-lg border border-[var(--space-border-hard)] overflow-hidden">
                            {(['USD', 'EUR', 'GBP'] as const).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => set('currency', c)}
                                className={`px-3 py-2 text-sm font-mono transition-colors ${
                                  form.currency === c
                                    ? 'bg-[rgba(139,156,182,0.06)] text-[var(--space-accent)]'
                                    : 'text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] bg-[rgba(255,255,255,0.02)]'
                                }`}
                              >
                                {CURRENCY_SYMBOLS[c]}
                              </button>
                            ))}
                          </div>
                          {/* Amount input */}
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              min="0"
                              step="100"
                              value={form.budget}
                              onChange={(e) => set('budget', e.target.value)}
                              placeholder="0"
                              className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] h-11 text-base font-mono focus-visible:ring-[rgba(139,156,182,0.20)] pl-4"
                            />
                          </div>
                        </div>
                      </div>
                      {form.budget && Number(form.budget) > 0 && (
                        <div className="flex items-center gap-2 rounded-lg bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.15)] px-4 py-3 text-sm animate-in fade-in-0 duration-300" style={{ color: 'var(--space-accent)', opacity: 0.8 }}>
                          <DollarSign className="size-4 shrink-0" style={{ color: 'var(--space-accent)', opacity: 0.6 }} />
                          <span className="font-mono font-semibold">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: form.currency,
                              minimumFractionDigits: 0,
                            }).format(Number(form.budget))}
                          </span>
                          <span className="text-[var(--space-text-muted)]">project budget</span>
                        </div>
                      )}
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="rounded-lg border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="flex items-center justify-between gap-4 px-8 py-5 border-t border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.02)]">
                <span className="text-[10px] uppercase tracking-widest text-[var(--space-text-muted)] font-semibold tabular-nums">
                  {String(step).padStart(2, '0')} / 03
                </span>
                <div className="flex items-center gap-2">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={back}
                      disabled={loading}
                      className="text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] gap-1.5"
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleOpenChange(false)}
                      className="text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)]"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={advance}
                    disabled={!canAdvance() || loading}
                    className="bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 text-black font-semibold gap-1.5 min-w-[120px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating...
                      </>
                    ) : step < 3 ? (
                      <>
                        Next
                        <ArrowRight className="size-4" />
                      </>
                    ) : (
                      <>
                        <Check className="size-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
