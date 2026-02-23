'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mail,
  Building2,
  DollarSign,
  ShoppingCart,
  FolderKanban,
  Users,
  TrendingUp,
  AlertCircle,
  SlidersHorizontal,
  Loader2,
  Check,
  UserPlus,
  KeyRound,
  Shield,
  User,
  Pencil,
  X,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClientAccount, inviteClientUser, updateClientUserEmail } from '@/actions/clients'

export interface ClientSidebarProps {
  id: string
  name: string
  firstName: string
  lastName: string
  email?: string | null
  company?: string | null
  accountBalance: number
  totalRevenue: number
  ordersCount: number
  projectsCount: number
  stripeCustomerId?: string | null
  /** Developer (admin/user role) assigned to this account */
  teamMembers: Array<{ id: string; name: string; title?: string | null }>
  /** Client-role users linked to this account */
  clientUsers?: Array<{ id: string; name: string; email: string }>
  username: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ── Team Modify Modal ───────────────────────────────────────────────────────────

function TeamModal({
  open,
  onClose,
  clientAccountId,
  clientAccountName,
  teamMembers,
  clientUsers,
}: {
  open: boolean
  onClose: () => void
  clientAccountId: string
  clientAccountName: string
  teamMembers: Array<{ id: string; name: string; title?: string | null }>
  clientUsers: Array<{ id: string; name: string; email: string }>
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'admin' | 'clients'>('admin')

  // ── Add client form ──
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null) // name of added person

  // ── Per-client password reset ──
  const [resetStates, setResetStates] = useState<Record<string, 'idle' | 'loading' | 'sent' | 'error'>>({})

  // ── Per-client email editing ──
  const [emailEditing, setEmailEditing] = useState<{ id: string; value: string } | null>(null)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  async function handleSaveEmail() {
    if (!emailEditing) return
    if (!emailEditing.value.trim()) {
      setEmailError('Email is required')
      return
    }
    setEmailSaving(true)
    setEmailError(null)
    const result = await updateClientUserEmail({ userId: emailEditing.id, email: emailEditing.value.trim() })
    setEmailSaving(false)
    if (result.success) {
      setEmailEditing(null)
      router.refresh()
    } else {
      setEmailError(result.error ?? 'Failed to update email')
    }
  }

  function resetAddForm() {
    setAddForm({ firstName: '', lastName: '', email: '' })
    setAddError(null)
    setAddSuccess(null)
  }

  async function handleAddClient() {
    if (!addForm.firstName.trim() || !addForm.lastName.trim() || !addForm.email.trim()) {
      setAddError('All fields are required')
      return
    }
    setAddLoading(true)
    setAddError(null)
    const result = await inviteClientUser({
      clientAccountId,
      email: addForm.email.trim(),
      firstName: addForm.firstName.trim(),
      lastName: addForm.lastName.trim(),
    })
    setAddLoading(false)
    if (result.success) {
      setAddSuccess(addForm.firstName.trim())
      router.refresh()
    } else {
      setAddError(result.error ?? 'Failed to add client')
    }
  }

  async function handlePasswordReset(email: string) {
    setResetStates((s) => ({ ...s, [email]: 'loading' }))
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResetStates((s) => ({ ...s, [email]: res.ok ? 'sent' : 'error' }))
    } catch {
      setResetStates((s) => ({ ...s, [email]: 'error' }))
    }
    setTimeout(() => setResetStates((s) => ({ ...s, [email]: 'idle' })), 3000)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); resetAddForm() } }}>
      <DialogContent className="bg-[#111] border border-white/[0.10] text-white p-0 overflow-hidden sm:max-w-[520px] gap-0">
        <DialogTitle className="sr-only">Manage Team</DialogTitle>

        {/* Header */}
        <div className="px-7 pt-7 pb-0">
          <p className="text-xs uppercase tracking-widest text-gray-600 font-semibold mb-1">Team</p>
          <h3 className="text-lg font-bold text-white mb-5">
            {clientAccountName}
          </h3>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/[0.06]">
            {([
              { key: 'admin' as const,   label: 'Admin / Developer', Icon: Shield, count: teamMembers.length  },
              { key: 'clients' as const, label: 'Clients',       Icon: User,   count: clientUsers.length  },
            ]).map(({ key, label, Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                  tab === key
                    ? 'border-[#67e8f9] text-[#67e8f9]'
                    : 'border-transparent text-gray-600 hover:text-gray-400'
                }`}
              >
                <Icon className="size-3.5" />
                {label}
                <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full font-normal ${
                  tab === key ? 'bg-[#67e8f9]/10 text-[#67e8f9]' : 'bg-white/[0.04] text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-7 py-5 min-h-[200px] max-h-[420px] overflow-y-auto">

          {/* Admin / Staff tab */}
          {tab === 'admin' && (
            <div className="space-y-2">
              {teamMembers.length === 0 ? (
                <p className="text-sm text-gray-600 py-4 text-center">No developers assigned to this account.</p>
              ) : (
                teamMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.06] px-4 py-3">
                    <div className="size-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                      <Shield className="size-3.5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">{m.name}</p>
                      {m.title && (
                        <p className="text-[11px] text-gray-600 truncate">{m.title}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Clients tab */}
          {tab === 'clients' && (
            <div className="space-y-5">
              {/* Existing clients */}
              <div className="space-y-2">
                {clientUsers.length === 0 ? (
                  <p className="text-sm text-gray-600 py-2 text-center">No client users yet.</p>
                ) : (
                  clientUsers.map((u) => {
                    const rs = resetStates[u.email] ?? 'idle'
                    const isEditing = emailEditing?.id === u.id
                    return (
                      <div key={u.id} className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-7 rounded-lg bg-[#67e8f9]/[0.07] flex items-center justify-center shrink-0">
                            <User className="size-3.5 text-[#67e8f9]/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 truncate">{u.name}</p>
                            {!isEditing && (
                              <p className="text-[11px] text-gray-600 truncate">{u.email}</p>
                            )}
                          </div>
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => { setEmailEditing({ id: u.id, value: u.email }); setEmailError(null) }}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-white/[0.08] text-[10px] text-gray-500 hover:text-white hover:border-white/[0.14] hover:bg-white/[0.04] transition-all shrink-0"
                              >
                                <Pencil className="size-3" />
                                Email
                              </button>
                              <button
                                onClick={() => handlePasswordReset(u.email)}
                                disabled={rs === 'loading' || rs === 'sent'}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/[0.08] text-[10px] text-gray-500 hover:text-white hover:border-white/[0.14] hover:bg-white/[0.04] transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                              >
                                {rs === 'loading' ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : rs === 'sent' ? (
                                  <Check className="size-3 text-emerald-400" />
                                ) : (
                                  <KeyRound className="size-3" />
                                )}
                                <span className={rs === 'sent' ? 'text-emerald-400' : rs === 'error' ? 'text-red-400' : ''}>
                                  {rs === 'loading' ? 'Sending' : rs === 'sent' ? 'Sent' : rs === 'error' ? 'Failed' : 'Reset'}
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                        {isEditing && (
                          <div className="mt-2.5 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="email"
                                value={emailEditing.value}
                                onChange={(e) => setEmailEditing((prev) => prev ? { ...prev, value: e.target.value } : null)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEmail()
                                  if (e.key === 'Escape') { setEmailEditing(null); setEmailError(null) }
                                }}
                                className="flex-1 h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
                              />
                              <button
                                onClick={handleSaveEmail}
                                disabled={emailSaving}
                                className="flex items-center justify-center size-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0 disabled:opacity-50"
                              >
                                {emailSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                              </button>
                              <button
                                onClick={() => { setEmailEditing(null); setEmailError(null) }}
                                disabled={emailSaving}
                                className="flex items-center justify-center size-8 rounded-md border border-white/[0.08] text-gray-500 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                            {emailError && (
                              <p className="text-[10px] text-red-400">{emailError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.06]" />

              {/* Add client form */}
              {addSuccess ? (
                <div className="flex flex-col items-center text-center gap-3 py-4">
                  <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="size-5 text-emerald-400" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Invite sent</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="text-gray-300">{addSuccess}</span> will receive a setup email.
                    </p>
                  </div>
                  <button
                    onClick={resetAddForm}
                    className="text-xs text-[#67e8f9] hover:underline mt-1"
                  >
                    Add another
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Add Client</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <Label className="text-gray-500 text-xs">First name</Label>
                      <Input
                        value={addForm.firstName}
                        onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))}
                        placeholder="Jane"
                        className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 h-9 text-sm focus-visible:ring-[#67e8f9]/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-gray-500 text-xs">Last name</Label>
                      <Input
                        value={addForm.lastName}
                        onChange={(e) => setAddForm((f) => ({ ...f, lastName: e.target.value }))}
                        placeholder="Doe"
                        className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 h-9 text-sm focus-visible:ring-[#67e8f9]/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-gray-500 text-xs">Email</Label>
                    <Input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="jane@example.com"
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 h-9 text-sm focus-visible:ring-[#67e8f9]/30"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
                    />
                  </div>
                  {addError && (
                    <p className="text-xs text-red-400">{addError}</p>
                  )}
                  <Button
                    onClick={handleAddClient}
                    disabled={addLoading}
                    className="w-full bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black font-semibold gap-2 h-9"
                  >
                    {addLoading ? (
                      <><Loader2 className="size-3.5 animate-spin" /> Adding...</>
                    ) : (
                      <><UserPlus className="size-3.5" /> Add &amp; Send Setup Email</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-7 py-4 border-t border-white/[0.06]">
          <Button
            variant="ghost"
            onClick={() => { onClose(); resetAddForm() }}
            className="text-gray-500 hover:text-white hover:bg-white/[0.05] text-sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Shared sidebar content ─────────────────────────────────────────────────────

export function ClientSidebarContent(props: ClientSidebarProps) {
  const {
    id,
    name,
    firstName,
    lastName,
    email,
    company,
    accountBalance,
    totalRevenue,
    ordersCount,
    projectsCount,
    stripeCustomerId,
    teamMembers,
    clientUsers = [],
    username,
  } = props

  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [form, setForm] = useState({ name, firstName, lastName, company: company ?? '', email: email ?? '' })

  const initials = getInitials(name)
  const hasOutstanding = accountBalance > 0
  const allUsers = [
    ...teamMembers.map((m) => ({ ...m, type: 'developer' as const })),
    ...clientUsers.map((u) => ({ ...u, type: 'client' as const })),
  ]

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
    })
    setLoading(false)
    if (result.success) {
      setEditing(false)
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to update')
    }
  }

  function handleCancel() {
    setForm({ name, firstName, lastName, company: company ?? '', email: email ?? '' })
    setError(null)
    setEditing(false)
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Nav ── */}
      <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <Link
          href={`/u/${username}/clients`}
          className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← All clients
        </Link>
      </div>

      {/* ── Identity ── */}
      <div className="px-6 py-6 border-b border-white/[0.06]">
        <div className="flex items-start justify-between mb-5">
          <div className="relative">
            <div className="size-14 rounded-2xl bg-cyan-400/[0.08] border border-cyan-400/[0.15] flex items-center justify-center">
              <span className="text-xl font-bold text-cyan-300 tracking-tight">{initials}</span>
            </div>
            {stripeCustomerId && (
              <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center">
                <Check className="size-2.5 text-black" strokeWidth={3} />
              </div>
            )}
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] text-gray-600 hover:text-gray-300 transition-colors px-2.5 py-1 rounded-md border border-transparent hover:border-white/[0.08] hover:bg-white/[0.03]"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">First</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((f) => ({ ...f, firstName: val, name: `${val} ${f.lastName}`.trim() }))
                  }}
                  className="h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">Last</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((f) => ({ ...f, lastName: val, name: `${f.firstName} ${val}`.trim() }))
                  }}
                  className="h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">Display Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="client@example.com"
                className="h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">Company</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Optional"
                className="h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black font-semibold text-xs h-8"
              >
                {loading ? <Loader2 className="size-3 animate-spin" /> : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 text-gray-500 hover:text-white hover:bg-white/[0.05] text-xs h-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{name}</h2>
            {company && <p className="text-xs text-gray-500 mt-0.5">{company}</p>}
            {email && <p className="text-xs text-gray-700 mt-1 truncate">{email}</p>}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">

        {/* Outstanding alert */}
        {hasOutstanding && (
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-400/[0.18] bg-amber-400/[0.04] px-3 py-2.5">
            <AlertCircle className="size-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-400">{fmt(accountBalance)} due</p>
              <p className="text-[10px] text-amber-700">Outstanding balance</p>
            </div>
          </div>
        )}

        {/* Metrics 2×2 */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Revenue',  value: fmt(totalRevenue),    Icon: TrendingUp,   amber: false          },
            { label: 'Balance',  value: fmt(accountBalance),  Icon: DollarSign,   amber: hasOutstanding },
            { label: 'Orders',   value: String(ordersCount),  Icon: ShoppingCart, amber: false          },
            { label: 'Projects', value: String(projectsCount),Icon: FolderKanban, amber: false          },
          ].map(({ label, value, Icon, amber }) => (
            <div key={label} className="rounded-lg bg-[#1c1c1c] border border-white/[0.08] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="size-3 text-gray-700" />
                <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">{label}</span>
              </div>
              <p className={`text-sm font-bold font-mono tabular-nums truncate ${amber ? 'text-amber-400' : 'text-white'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="space-y-2.5">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Contact</p>
          <div className="space-y-2">
            {email && (
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {company && (
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Building2 className="size-3 shrink-0" />
                <span className="truncate">{company}</span>
              </div>
            )}
          </div>
        </div>

        {/* Team */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
              Team
              {allUsers.length > 0 && (
                <span className="ml-1.5 text-gray-700 font-normal">{allUsers.length}</span>
              )}
            </p>
            <button
              onClick={() => setTeamModalOpen(true)}
              className="text-[10px] text-gray-600 hover:text-[#67e8f9] transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#67e8f9]/[0.05]"
            >
              <Users className="size-3" />
              Modify
            </button>
          </div>

          {allUsers.length === 0 ? (
            <p className="text-[11px] text-gray-700">No users associated.</p>
          ) : (
            <div className="space-y-1.5">
              {allUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2 text-xs">
                  {u.type === 'developer' ? (
                    <Shield className="size-3 shrink-0 text-gray-600" />
                  ) : (
                    <User className="size-3 shrink-0 text-[#67e8f9]/50" />
                  )}
                  <span className={`truncate ${u.type === 'developer' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {u.name}
                  </span>
                  <span className={`ml-auto text-[9px] uppercase tracking-wider font-semibold shrink-0 ${
                    u.type === 'developer' ? 'text-gray-700' : 'text-[#67e8f9]/40'
                  }`}>
                    {u.type === 'developer' ? (u.title ?? 'developer') : 'client'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Modify Modal */}
      <TeamModal
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        clientAccountId={id}
        clientAccountName={name}
        teamMembers={teamMembers}
        clientUsers={clientUsers}
      />
    </div>
  )
}

// ── Mobile Sheet trigger ───────────────────────────────────────────────────────

export function ClientSidebar(props: ClientSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-white/[0.1] text-gray-400 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.15] gap-2 text-xs h-8"
        >
          <SlidersHorizontal className="size-3.5" />
          Details
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-[#111] border-l border-white/[0.08] w-80 p-0 overflow-hidden flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Client Details</SheetTitle>
        </SheetHeader>
        <ClientSidebarContent {...props} />
      </SheetContent>
    </Sheet>
  )
}
