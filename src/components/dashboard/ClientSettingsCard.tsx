'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, Building2, Pencil, Loader2,
  Shield, User, Users, Phone, MapPin, Send, CheckCircle2, Check,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { updateClientAccount, resendClientWelcomeEmail } from '@/actions/clients'

interface Address {
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
}

export interface ClientSettingsCardProps {
  id: string
  name: string
  firstName: string
  lastName: string
  email?: string | null
  company?: string | null
  phone?: string | null
  address?: Address | null
  stripeCustomerId?: string | null
  teamMembers: Array<{ id: string; name: string; title?: string | null }>
  clientUsers: Array<{ id: string; name: string; email: string }>
}

function blankAddress(): Address {
  return { line1: '', line2: '', city: '', state: '', zip: '', country: '' }
}

export function ClientSettingsCard({
  id,
  name,
  firstName,
  lastName,
  email,
  company,
  phone,
  address,
  stripeCustomerId,
  teamMembers,
  clientUsers,
}: ClientSettingsCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    name,
    firstName,
    lastName,
    company: company ?? '',
    email: email ?? '',
    phone: phone ?? '',
    address: address ? { ...blankAddress(), ...address } : blankAddress(),
  })
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendResult, setResendResult] = useState<'sent' | 'error' | null>(null)

  const allUsers = [
    ...teamMembers.map((m) => ({ ...m, type: 'developer' as const })),
    ...clientUsers.map((u) => ({ ...u, type: 'client' as const })),
  ]

  function handleOpenEdit() {
    setForm({
      name,
      firstName,
      lastName,
      company: company ?? '',
      email: email ?? '',
      phone: phone ?? '',
      address: address ? { ...blankAddress(), ...address } : blankAddress(),
    })
    setError(null)
    setSendWelcomeEmail(true)
    setEditOpen(true)
  }

  function handleCloseEdit() {
    setForm({
      name,
      firstName,
      lastName,
      company: company ?? '',
      email: email ?? '',
      phone: phone ?? '',
      address: address ? { ...blankAddress(), ...address } : blankAddress(),
    })
    setError(null)
    setEditOpen(false)
  }

  function setAddr(field: keyof Address, value: string) {
    setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }))
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    const result = await updateClientAccount({
      id,
      name: form.name,
      firstName: form.firstName,
      lastName: form.lastName,
      company: form.company || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: {
        line1:   form.address.line1   || undefined,
        line2:   form.address.line2   || undefined,
        city:    form.address.city    || undefined,
        state:   form.address.state   || undefined,
        zip:     form.address.zip     || undefined,
        country: form.address.country || undefined,
      },
      skipWelcomeEmail: !sendWelcomeEmail,
    })
    setLoading(false)
    if (result.success) {
      setEditOpen(false)
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to update')
    }
  }

  async function handleResendWelcome() {
    setResending(true)
    setResendResult(null)
    const result = await resendClientWelcomeEmail({ id })
    setResending(false)
    setResendResult(result.success ? 'sent' : 'error')
    setTimeout(() => setResendResult(null), 4000)
  }

  const emailChanged = form.email && form.email !== (email ?? '')

  return (
    <div className="rounded-xl border border-[var(--space-divider)] bg-[var(--space-bg-base)] overflow-hidden transition-all duration-300">

      {/* ── Header strip ── */}
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div className="min-w-0 flex-1">
          {/* Name */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-semibold text-[var(--space-text-primary)] leading-tight truncate">{name}</h2>
            {stripeCustomerId && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
              >
                <Check className="size-2.5" strokeWidth={3} />
                Stripe
              </span>
            )}
          </div>

          {/* Company */}
          {company && (
            <p className="text-sm text-[var(--space-text-secondary)] mt-0.5 flex items-center gap-1.5">
              <Building2 className="size-3 shrink-0" />
              {company}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleOpenEdit}
            className="group flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--space-text-secondary)] border border-[var(--space-divider)] rounded-lg
              hover:text-[var(--space-text-primary)] hover:border-[var(--space-border-hard)] hover:bg-[var(--space-divider)]
              transition-all duration-200"
          >
            <Pencil className="size-3 transition-transform duration-200 group-hover:rotate-12" />
            Edit
          </button>

          {email && (
            <button
              onClick={handleResendWelcome}
              disabled={resending}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
                resendResult === 'sent'
                  ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/[0.06]'
                  : resendResult === 'error'
                  ? 'text-red-400 border-red-400/20 bg-red-400/[0.06]'
                  : 'text-[var(--space-text-secondary)] border-[var(--space-divider)] hover:text-[var(--space-text-primary)] hover:border-[var(--space-border-hard)] hover:bg-[var(--space-divider)]',
              ].join(' ')}
            >
              {resending
                ? <Loader2 className="size-3 animate-spin" />
                : resendResult === 'sent'
                ? <CheckCircle2 className="size-3" />
                : <Send className="size-3" />
              }
              {resendResult === 'sent' ? 'Sent!' : resendResult === 'error' ? 'Failed' : 'Welcome'}
            </button>
          )}
        </div>
      </div>

      {/* ── Contact info row ── */}
      {(email || phone || address?.line1 || address?.city) && (
        <div className="px-5 pb-4 flex flex-wrap gap-x-5 gap-y-1.5">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 text-xs text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] transition-colors duration-150"
            >
              <Mail className="size-3 shrink-0" />
              <span>{email}</span>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1.5 text-xs text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] transition-colors duration-150"
            >
              <Phone className="size-3 shrink-0" />
              <span>{phone}</span>
            </a>
          )}
          {(address?.line1 || address?.city) && (
            <span className="flex items-start gap-1.5 text-xs text-[var(--space-text-secondary)]">
              <MapPin className="size-3 shrink-0 mt-0.5" />
              <span>
                {address?.line1 && `${address.line1}${address.line2 ? `, ${address.line2}` : ''}, `}
                {[address?.city, address?.state, address?.zip].filter(Boolean).join(', ')}
              </span>
            </span>
          )}
        </div>
      )}

      {/* ── Team ── */}
      {allUsers.length > 0 && (
        <div className="px-5 py-3.5 border-t border-[var(--space-border-hard)] flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--space-text-tertiary)] font-semibold shrink-0">
            <Users className="size-3" />
            Team
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] text-xs
                  hover:border-[#3A3A3A] hover:bg-[var(--space-bg-card-hover)] transition-all duration-150"
              >
                {u.type === 'developer'
                  ? <Shield className="size-2.5 text-[var(--space-text-muted)] shrink-0" />
                  : <User className="size-2.5 shrink-0" style={{ color: 'var(--space-accent)' }} />
                }
                <span className={u.type === 'developer' ? 'text-[var(--space-text-secondary)]' : 'text-[var(--space-text-tertiary)]'}>
                  {u.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) handleCloseEdit(); else setEditOpen(true) }}>
        <DialogContent className="bg-[var(--space-bg-base)] border border-[var(--space-border-hard)] text-[var(--space-text-primary)] sm:max-w-[480px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-base font-semibold text-[var(--space-text-primary)]">Edit Client Info</DialogTitle>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-[var(--space-text-secondary)] text-xs uppercase tracking-wide">First Name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((f) => ({ ...f, firstName: val, name: `${val} ${f.lastName}`.trim() }))
                  }}
                  className="h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[var(--space-text-secondary)] text-xs uppercase tracking-wide">Last Name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((f) => ({ ...f, lastName: val, name: `${f.firstName} ${val}`.trim() }))
                  }}
                  className="h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[var(--space-text-secondary)] text-xs uppercase tracking-wide">Display Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[var(--space-text-secondary)] text-xs uppercase tracking-wide">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="client@example.com"
                className="h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
              />
            </div>

            {form.email && (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)]">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-[var(--space-text-tertiary)]">Send setup email</p>
                  <p className="text-[10px] text-[var(--space-text-muted)] leading-snug">
                    {emailChanged
                      ? 'Sends a new setup link to the updated address'
                      : 'Resends a setup link on save (only if email changes)'}
                  </p>
                </div>
                <Switch
                  checked={sendWelcomeEmail}
                  onCheckedChange={setSendWelcomeEmail}
                  className="data-[state=checked]:bg-[var(--space-accent)] data-[state=unchecked]:bg-[#555555] shrink-0 ml-3"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[var(--space-text-secondary)] text-xs uppercase tracking-wide">Company</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Optional"
                className="h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[var(--space-text-secondary)] text-xs uppercase tracking-wide">Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555-000-0000"
                className="h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
              />
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-[var(--space-text-secondary)] text-xs uppercase tracking-wide font-medium">Address</p>
              <Input
                value={form.address.line1 ?? ''}
                onChange={(e) => setAddr('line1', e.target.value)}
                placeholder="Street address"
                className="h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
              />
              <Input
                value={form.address.line2 ?? ''}
                onChange={(e) => setAddr('line2', e.target.value)}
                placeholder="Suite, unit, etc. (optional)"
                className="h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
              />
              <div className="grid grid-cols-5 gap-2">
                <Input
                  value={form.address.city ?? ''}
                  onChange={(e) => setAddr('city', e.target.value)}
                  placeholder="City"
                  className="col-span-2 h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
                />
                <Input
                  value={form.address.state ?? ''}
                  onChange={(e) => setAddr('state', e.target.value)}
                  placeholder="State"
                  className="col-span-1 h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
                />
                <Input
                  value={form.address.zip ?? ''}
                  onChange={(e) => setAddr('zip', e.target.value)}
                  placeholder="ZIP"
                  className="col-span-2 h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
                />
              </div>
              <Input
                value={form.address.country ?? ''}
                onChange={(e) => setAddr('country', e.target.value)}
                placeholder="Country"
                className="h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus-visible:ring-[var(--space-accent)]/30 text-sm"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 text-white font-semibold h-9 text-sm"
              >
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : 'Save Changes'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleCloseEdit}
                disabled={loading}
                className="text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card-hover)] h-9 text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
