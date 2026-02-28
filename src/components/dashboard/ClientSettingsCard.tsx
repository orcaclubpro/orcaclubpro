'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, Building2, Pencil, Check, Loader2,
  Shield, User, Users, Phone, MapPin, Send, CheckCircle2,
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

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
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

  // Resend welcome email state
  const [resending, setResending] = useState(false)
  const [resendResult, setResendResult] = useState<'sent' | 'error' | null>(null)

  const initials = getInitials(name)
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
    // Auto-clear result after 4s
    setTimeout(() => setResendResult(null), 4000)
  }

  const emailChanged = form.email && form.email !== (email ?? '')

  return (
    <div
      className="rounded-2xl border border-white/[0.08] overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #1a1a1a 0%, #111 100%)' }}
    >
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#67e8f9]/30 to-transparent" />

      <div className="p-6 space-y-5">

        {/* ── Identity ── */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="size-16 rounded-2xl bg-cyan-400/[0.08] border border-cyan-400/[0.15] flex items-center justify-center">
              <span className="text-2xl font-bold text-cyan-300 tracking-tight">{initials}</span>
            </div>
            {stripeCustomerId && (
              <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-2 border-[#111] flex items-center justify-center">
                <Check className="size-3 text-black" strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Name + contact */}
          <div className="flex-1 min-w-0">
            <div className="overflow-x-auto scrollbar-none">
              <h2 className="text-3xl font-bold gradient-text leading-tight whitespace-nowrap">{name}</h2>
            </div>
            {company && (
              <p className="text-sm text-gray-500 mt-0.5">{company}</p>
            )}
            {email && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-600">
                <Phone className="size-3 shrink-0" />
                <span className="truncate">{phone}</span>
              </div>
            )}
            {(address?.line1 || address?.city) && (
              <div className="flex items-start gap-1.5 mt-0.5 text-xs text-gray-600">
                <MapPin className="size-3 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {address.line1 && <span>{address.line1}{address.line2 ? `, ${address.line2}` : ''}<br /></span>}
                  {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {company && !email && !phone && !address?.line1 && (
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-700">
                <Building2 className="size-3 shrink-0" />
                <span className="truncate">{company}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-white/[0.08] rounded-lg hover:text-white hover:border-white/[0.18] hover:bg-white/[0.03] transition-all"
              >
                <Pencil className="size-3" />
                Edit
              </button>

              {email && (
                <button
                  onClick={handleResendWelcome}
                  disabled={resending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    resendResult === 'sent'
                      ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/[0.06]'
                      : resendResult === 'error'
                      ? 'text-red-400 border-red-400/20 bg-red-400/[0.06]'
                      : 'text-gray-400 border-white/[0.08] hover:text-[#67e8f9] hover:border-[#67e8f9]/20 hover:bg-[#67e8f9]/[0.04]'
                  }`}
                >
                  {resending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : resendResult === 'sent' ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <Send className="size-3" />
                  )}
                  {resendResult === 'sent'
                    ? 'Sent!'
                    : resendResult === 'error'
                    ? 'Failed'
                    : 'Resend Welcome'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Team ── */}
        {allUsers.length > 0 && (
          <div className="pt-4 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2">
              <Users className="size-3.5 text-gray-600" />
              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
                Team · {allUsers.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {allUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.07] bg-white/[0.02] text-xs"
                >
                  {u.type === 'developer'
                    ? <Shield className="size-3 text-gray-600 shrink-0" />
                    : <User className="size-3 text-[#67e8f9]/50 shrink-0" />
                  }
                  <span className={u.type === 'developer' ? 'text-gray-500' : 'text-gray-400'}>
                    {u.name}
                  </span>
                  <span className={`text-[9px] uppercase tracking-wide font-semibold ml-0.5 ${
                    u.type === 'developer' ? 'text-gray-700' : 'text-[#67e8f9]/40'
                  }`}>
                    {u.type === 'developer' ? (u.title ?? 'developer') : 'client'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) handleCloseEdit(); else setEditOpen(true) }}>
        <DialogContent className="bg-[#111] border border-white/[0.10] text-white sm:max-w-[480px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-base font-semibold text-white">Edit Client Info</DialogTitle>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-xs uppercase tracking-wide">First Name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((f) => ({ ...f, firstName: val, name: `${val} ${f.lastName}`.trim() }))
                  }}
                  className="h-9 bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-xs uppercase tracking-wide">Last Name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((f) => ({ ...f, lastName: val, name: `${f.firstName} ${val}`.trim() }))
                  }}
                  className="h-9 bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-xs uppercase tracking-wide">Display Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-9 bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-xs uppercase tracking-wide">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="client@example.com"
                className="h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 text-sm"
              />
            </div>

            {/* Welcome email toggle — visible whenever an email is set */}
            {form.email && (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.025] border border-white/[0.06]">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-gray-300">Send setup email</p>
                  <p className="text-[10px] text-gray-600 leading-snug">
                    {emailChanged
                      ? 'Sends a new setup link to the updated address'
                      : 'Resends a setup link on save (only if email changes)'}
                  </p>
                </div>
                <Switch
                  checked={sendWelcomeEmail}
                  onCheckedChange={setSendWelcomeEmail}
                  className="data-[state=checked]:bg-[#67e8f9] data-[state=unchecked]:bg-white/[0.12] shrink-0 ml-3"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-gray-500 text-xs uppercase tracking-wide">Company</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Optional"
                className="h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-xs uppercase tracking-wide">Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555-000-0000"
                className="h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 text-sm"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 pt-1">
              <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">Address</p>
              <Input
                value={form.address.line1 ?? ''}
                onChange={(e) => setAddr('line1', e.target.value)}
                placeholder="Street address"
                className="h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 text-sm"
              />
              <Input
                value={form.address.line2 ?? ''}
                onChange={(e) => setAddr('line2', e.target.value)}
                placeholder="Suite, unit, etc. (optional)"
                className="h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 text-sm"
              />
              <div className="grid grid-cols-5 gap-2">
                <Input
                  value={form.address.city ?? ''}
                  onChange={(e) => setAddr('city', e.target.value)}
                  placeholder="City"
                  className="col-span-2 h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 text-sm"
                />
                <Input
                  value={form.address.state ?? ''}
                  onChange={(e) => setAddr('state', e.target.value)}
                  placeholder="State"
                  className="col-span-1 h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 text-sm"
                />
                <Input
                  value={form.address.zip ?? ''}
                  onChange={(e) => setAddr('zip', e.target.value)}
                  placeholder="ZIP"
                  className="col-span-2 h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 text-sm"
                />
              </div>
              <Input
                value={form.address.country ?? ''}
                onChange={(e) => setAddr('country', e.target.value)}
                placeholder="Country"
                className="h-9 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 text-sm"
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
                className="flex-1 bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black font-semibold h-9 text-sm"
              >
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : 'Save Changes'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleCloseEdit}
                disabled={loading}
                className="text-gray-500 hover:text-white hover:bg-white/[0.05] h-9 text-sm"
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
