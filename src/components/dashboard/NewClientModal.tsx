'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOrUpdateClientAccount } from '@/actions/clients'

interface FormState {
  firstName: string
  lastName: string
  name: string
  email: string
  company: string
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  name: '',
  email: '',
  company: '',
}

type Result =
  | { type: 'success'; message: string; action: 'created' | 'updated'; id: string; emailSent?: boolean }
  | { type: 'error'; message: string }

export function NewClientModal({ username }: { username: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target

    setForm((prev) => {
      const next = { ...prev, [name]: value }

      // Auto-compose the "name" field from first + last
      if (name === 'firstName' || name === 'lastName') {
        const first = name === 'firstName' ? value : prev.firstName
        const last = name === 'lastName' ? value : prev.lastName
        next.name = `${first} ${last}`.trim()
      }

      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const response = await createOrUpdateClientAccount({
      name: form.name,
      email: form.email || undefined,
      firstName: form.firstName,
      lastName: form.lastName,
      company: form.company || undefined,
    })

    setLoading(false)

    if (response.success) {
      setResult({
        type: 'success',
        message: response.message ?? 'Done.',
        action: response.action!,
        id: response.id!,
        emailSent: response.emailSent,
      })
      router.refresh()
    } else {
      setResult({ type: 'error', message: response.error ?? 'Something went wrong.' })
    }
  }

  function handleOpenChange(val: boolean) {
    if (loading) return
    setOpen(val)
    if (!val) {
      setForm(emptyForm)
      setResult(null)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 text-white font-semibold gap-2"
      >
        <Plus className="size-4" />
        New Client Account
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-[var(--space-bg-base)] border border-[var(--space-border-hard)] text-[var(--space-text-primary)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[var(--space-text-primary)]">New Client Account</DialogTitle>
            <DialogDescription className="text-[var(--space-text-secondary)] text-sm">
              Creates a Stripe customer and a linked client account.
            </DialogDescription>
          </DialogHeader>

          {result?.type === 'success' ? (
            <div className="py-4 flex flex-col items-center gap-4 text-center">
              <CheckCircle className="size-12 text-green-500" />
              <div>
                <p className="font-semibold text-[var(--space-text-primary)] text-lg">
                  {result.action === 'updated' ? 'Account Updated' : 'Account Created'}
                </p>
                <p className="text-[var(--space-text-secondary)] text-sm mt-1">{result.message}</p>
                {result.emailSent && form.email && (
                  <p className="text-xs text-[var(--space-text-secondary)] mt-1">
                    A setup email was sent to {form.email}
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-1">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="border-[var(--space-border-hard)] text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)]"
                >
                  Close
                </Button>
                <Button
                  className="bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 text-white font-semibold"
                  onClick={() => {
                    setOpen(false)
                    router.push(`/u/${username}/clients/${result.id}`)
                  }}
                >
                  View Account
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[var(--space-text-tertiary)] text-sm">
                    First Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Jane"
                    className="bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus-visible:ring-[rgba(139,156,182,0.30)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[var(--space-text-tertiary)] text-sm">
                    Last Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Doe"
                    className="bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus-visible:ring-[rgba(139,156,182,0.30)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[var(--space-text-tertiary)] text-sm">
                  Display Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Jane Doe"
                  className="bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus-visible:ring-[rgba(139,156,182,0.30)]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[var(--space-text-tertiary)] text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className="bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus-visible:ring-[rgba(139,156,182,0.30)]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-[var(--space-text-tertiary)] text-sm">
                  Company
                </Label>
                <Input
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  className="bg-[rgba(255,255,255,0.06)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-secondary)] focus-visible:ring-[rgba(139,156,182,0.30)]"
                />
              </div>

              {result?.type === 'error' && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{result.message}</span>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={loading}
                  className="border-[var(--space-border-hard)] text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 text-white font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Client'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
