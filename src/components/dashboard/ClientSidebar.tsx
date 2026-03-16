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
  ChevronDown,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClientAccount, inviteClientUser, updateClientUserEmail, removeClientUser } from '@/actions/clients'

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
  /** All accessible client accounts for quick switching */
  allClients?: Array<{ id: string; name: string; company?: string | null }>
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

  // ── Client user local state (for optimistic removal) ──
  const [clientList, setClientList] = useState(clientUsers)
  const [removingClientId, setRemovingClientId] = useState<string | null>(null)

  async function handleRemoveClient(userId: string) {
    setRemovingClientId(userId)
    const result = await removeClientUser({ userId })
    setRemovingClientId(null)
    if (result.success) {
      setClientList((c) => c.filter((u) => u.id !== userId))
      router.refresh()
    }
  }

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
      <DialogContent className="bg-[#1C1C1C] border border-[#404040] text-[#F0F0F0] p-0 overflow-hidden sm:max-w-[520px] gap-0">
        <DialogTitle className="sr-only">Manage Team</DialogTitle>

        {/* Header */}
        <div className="px-7 pt-7 pb-0">
          <p className="text-xs uppercase tracking-widest text-[#4A4A4A] font-semibold mb-1">Team</p>
          <h3 className="text-lg font-bold text-[#F0F0F0] mb-5">
            {clientAccountName}
          </h3>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[#404040]">
            {([
              { key: 'admin' as const,   label: 'Admin / Developer', Icon: Shield, count: teamMembers.length  },
              { key: 'clients' as const, label: 'Clients',       Icon: User,   count: clientList.length  },
            ]).map(({ key, label, Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                  tab === key
                    ? 'border-[var(--space-accent)] text-[var(--space-accent)]'
                    : 'border-transparent text-[#4A4A4A] hover:text-[#6B6B6B]'
                }`}
              >
                <Icon className="size-3.5" />
                {label}
                <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full font-normal ${
                  tab === key ? 'bg-[rgba(139,156,182,0.06)] text-[var(--space-accent)]' : 'bg-[#2D2D2D] text-[#4A4A4A]'
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
                <p className="text-sm text-[#4A4A4A] py-4 text-center">No developers assigned to this account.</p>
              ) : (
                teamMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg bg-[#252525] border border-[#404040] px-4 py-3">
                    <div className="size-7 rounded-lg bg-[#2D2D2D] flex items-center justify-center shrink-0">
                      <Shield className="size-3.5 text-[#4A4A4A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#A0A0A0] truncate">{m.name}</p>
                      {m.title && (
                        <p className="text-[11px] text-[#4A4A4A] truncate">{m.title}</p>
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
                {clientList.length === 0 ? (
                  <p className="text-sm text-[#4A4A4A] py-2 text-center">No client users yet.</p>
                ) : (
                  clientList.map((u) => {
                    const rs = resetStates[u.email] ?? 'idle'
                    const isEditing = emailEditing?.id === u.id
                    return (
                      <div key={u.id} className="rounded-lg bg-[#252525] border border-[#404040] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-7 rounded-lg bg-[rgba(139,156,182,0.06)] flex items-center justify-center shrink-0">
                            <User className="size-3.5" style={{ color: 'var(--space-accent)', opacity: 0.6 }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#A0A0A0] truncate">{u.name}</p>
                            {!isEditing && (
                              <p className="text-[11px] text-[#4A4A4A] truncate">{u.email}</p>
                            )}
                          </div>
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => { setEmailEditing({ id: u.id, value: u.email }); setEmailError(null) }}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-[#404040] text-[10px] text-[#4A4A4A] hover:text-[#F0F0F0] hover:border-[#404040] hover:bg-[#2D2D2D] transition-all shrink-0"
                              >
                                <Pencil className="size-3" />
                                Email
                              </button>
                              <button
                                onClick={() => handlePasswordReset(u.email)}
                                disabled={rs === 'loading' || rs === 'sent'}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#404040] text-[10px] text-[#4A4A4A] hover:text-[#F0F0F0] hover:border-[#404040] hover:bg-[#2D2D2D] transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
                              <button
                                onClick={() => handleRemoveClient(u.id)}
                                disabled={removingClientId === u.id}
                                title="Remove client access"
                                className="flex items-center justify-center size-7 rounded-md border border-[#404040] text-[#4A4A4A] hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/[0.05] transition-all shrink-0 disabled:opacity-40"
                              >
                                {removingClientId === u.id
                                  ? <Loader2 className="size-3 animate-spin" />
                                  : <X className="size-3" />
                                }
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
                                className="flex-1 h-8 text-xs bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] focus-visible:ring-[rgba(139,156,182,0.20)] focus-visible:ring-1"
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
                                className="flex items-center justify-center size-8 rounded-md border border-[#404040] text-[#4A4A4A] hover:text-[#F0F0F0] hover:bg-[#2D2D2D] transition-colors shrink-0"
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
              <div className="border-t border-[#404040]" />

              {/* Add client form */}
              {addSuccess ? (
                <div className="flex flex-col items-center text-center gap-3 py-4">
                  <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="size-5 text-emerald-400" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F0F0F0]">Invite sent</p>
                    <p className="text-xs text-[#4A4A4A] mt-0.5">
                      <span className="text-[#A0A0A0]">{addSuccess}</span> will receive a setup email.
                    </p>
                  </div>
                  <button
                    onClick={resetAddForm}
                    className="text-xs hover:underline mt-1"
                    style={{ color: 'var(--space-accent)' }}
                  >
                    Add another
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#4A4A4A] font-semibold">Add Client</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <Label className="text-[#4A4A4A] text-xs">First name</Label>
                      <Input
                        value={addForm.firstName}
                        onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))}
                        placeholder="Jane"
                        className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] h-9 text-sm focus-visible:ring-[rgba(139,156,182,0.20)]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#4A4A4A] text-xs">Last name</Label>
                      <Input
                        value={addForm.lastName}
                        onChange={(e) => setAddForm((f) => ({ ...f, lastName: e.target.value }))}
                        placeholder="Doe"
                        className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] h-9 text-sm focus-visible:ring-[rgba(139,156,182,0.20)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#4A4A4A] text-xs">Email</Label>
                    <Input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="jane@example.com"
                      className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] h-9 text-sm focus-visible:ring-[rgba(139,156,182,0.20)]"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
                    />
                  </div>
                  {addError && (
                    <p className="text-xs text-red-400">{addError}</p>
                  )}
                  <Button
                    onClick={handleAddClient}
                    disabled={addLoading}
                    className="w-full bg-[var(--space-accent)] hover:bg-[#1E3A6E]/90 text-white font-semibold gap-2 h-9"
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
        <div className="flex justify-end px-7 py-4 border-t border-[#404040]">
          <Button
            variant="ghost"
            onClick={() => { onClose(); resetAddForm() }}
            className="text-[#4A4A4A] hover:text-[#F0F0F0] hover:bg-[#2D2D2D] text-sm"
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
    allClients,
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
      <div className="px-5 pt-4 pb-3 border-b border-[#404040] shrink-0">
        <Link
          href={`/u/${username}/clients`}
          className="text-[11px] text-[#4A4A4A] hover:text-[#6B6B6B] transition-colors"
        >
          ← All clients
        </Link>
      </div>

      {/* ── All clients hover-expand accordion ── */}
      {allClients && allClients.length > 0 && (
        <div className="group border-b border-[#404040] shrink-0">
          {/* Compact header — always visible */}
          <div className="px-4 py-2.5 flex items-center gap-2 cursor-default select-none">
            <p className="text-[10px] font-semibold text-[#4A4A4A] uppercase tracking-widest flex-1">Clients</p>
            <span className="text-[10px] tabular-nums text-[#4A4A4A] bg-[#2D2D2D] border border-[#404040] px-1.5 py-0.5 rounded-md">
              {allClients.length}
            </span>
            <ChevronDown className="size-3 text-[#4A4A4A] transition-transform duration-200 group-hover:rotate-180" />
          </div>
          {/* Expandable list */}
          <div className="max-h-0 overflow-hidden group-hover:max-h-[320px] transition-[max-height] duration-300 ease-in-out">
            <div className="px-3 pb-3 space-y-0.5">
              {allClients.map((c) => {
                const isCurrent = c.id === id
                const cInitials = getInitials(c.name)
                return (
                  <Link
                    key={c.id}
                    href={`/u/${username}/clients/${c.id}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isCurrent
                        ? 'bg-[#2D2D2D] text-[#F0F0F0]'
                        : 'text-[#6B6B6B] hover:text-[#F0F0F0] hover:bg-[#2D2D2D]'
                    }`}
                  >
                    <div className="size-6 rounded-md bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.10)] flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold" style={{ color: 'var(--space-accent)' }}>{cInitials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate leading-tight">{c.name}</p>
                      {c.company && (
                        <p className="text-[10px] text-[#4A4A4A] truncate leading-tight">{c.company}</p>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="size-1.5 rounded-full shrink-0" style={{ background: 'var(--space-accent)' }} />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Single unified scroll area ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Identity / Edit ── */}
        <div className="px-5 py-4 border-b border-[#404040]">
          <div className="flex items-start justify-between mb-3">
            <div className="relative">
              <div className="size-10 rounded-xl bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.10)] flex items-center justify-center">
                <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--space-accent)' }}>{initials}</span>
              </div>
              {stripeCustomerId && (
                <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-[#252525] flex items-center justify-center">
                  <Check className="size-2.5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] text-[#4A4A4A] hover:text-[#A0A0A0] transition-colors px-2.5 py-1 rounded-md border border-transparent hover:border-[#404040] hover:bg-[#2D2D2D]"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[#4A4A4A] text-[10px] uppercase tracking-wider font-semibold">First</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm((f) => ({ ...f, firstName: val, name: `${val} ${f.lastName}`.trim() }))
                    }}
                    className="h-8 text-sm bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] focus-visible:ring-[rgba(139,156,182,0.20)] focus-visible:ring-1"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[#4A4A4A] text-[10px] uppercase tracking-wider font-semibold">Last</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm((f) => ({ ...f, lastName: val, name: `${f.firstName} ${val}`.trim() }))
                    }}
                    className="h-8 text-sm bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] focus-visible:ring-[rgba(139,156,182,0.20)] focus-visible:ring-1"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[#4A4A4A] text-[10px] uppercase tracking-wider font-semibold">Display Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-8 text-sm bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] focus-visible:ring-[rgba(139,156,182,0.20)] focus-visible:ring-1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#4A4A4A] text-[10px] uppercase tracking-wider font-semibold">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="client@example.com"
                  className="h-8 text-sm bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] focus-visible:ring-[rgba(139,156,182,0.20)] focus-visible:ring-1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#4A4A4A] text-[10px] uppercase tracking-wider font-semibold">Company</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Optional"
                  className="h-8 text-sm bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] focus-visible:ring-[rgba(139,156,182,0.20)] focus-visible:ring-1"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-[var(--space-accent)] hover:bg-[#1E3A6E]/90 text-white font-semibold text-xs h-8"
                >
                  {loading ? <Loader2 className="size-3 animate-spin" /> : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 text-[#4A4A4A] hover:text-[#F0F0F0] hover:bg-[#2D2D2D] text-xs h-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-base font-bold text-[#F0F0F0] leading-tight">{name}</h2>
              {company && <p className="text-xs text-[#4A4A4A] mt-0.5">{company}</p>}
              {email && <p className="text-xs text-[#4A4A4A] mt-1 truncate">{email}</p>}
            </div>
          )}
        </div>

        {/* ── Overview ── */}
        <div className="px-5 py-4 space-y-5 border-b border-[#404040]">

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
              <div key={label} className="rounded-lg bg-[#252525] border border-[#404040] p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="size-3 text-[#4A4A4A]" />
                  <span className="text-[10px] uppercase tracking-widest text-[#4A4A4A] font-semibold">{label}</span>
                </div>
                <p className={`text-sm font-bold font-mono tabular-nums truncate ${amber ? 'text-amber-400' : 'text-[#F0F0F0]'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="space-y-2.5">
            <p className="text-[10px] uppercase tracking-widest text-[#4A4A4A] font-semibold">Contact</p>
            <div className="space-y-2">
              {email && (
                <div className="flex items-center gap-2 text-[#4A4A4A] text-xs">
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {company && (
                <div className="flex items-center gap-2 text-[#4A4A4A] text-xs">
                  <Building2 className="size-3 shrink-0" />
                  <span className="truncate">{company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Team */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-[#4A4A4A] font-semibold">
                Team
                {allUsers.length > 0 && (
                  <span className="ml-1.5 text-[#4A4A4A] font-normal">{allUsers.length}</span>
                )}
              </p>
              <button
                onClick={() => setTeamModalOpen(true)}
                className="text-[10px] text-[#4A4A4A] hover:text-[var(--space-accent)] transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[rgba(139,156,182,0.04)]"
              >
                <Users className="size-3" />
                Modify
              </button>
            </div>

            {allUsers.length === 0 ? (
              <p className="text-[11px] text-[#4A4A4A]">No users associated.</p>
            ) : (
              <div className="space-y-1.5">
                {allUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 text-xs">
                    {u.type === 'developer' ? (
                      <Shield className="size-3 shrink-0 text-[#4A4A4A]" />
                    ) : (
                      <User className="size-3 shrink-0" style={{ color: 'var(--space-accent)', opacity: 0.5 }} />
                    )}
                    <span className={`truncate ${u.type === 'developer' ? 'text-[#4A4A4A]' : 'text-[#6B6B6B]'}`}>
                      {u.name}
                    </span>
                    <span className={`ml-auto text-[9px] uppercase tracking-wider font-semibold shrink-0 ${
                      u.type === 'developer' ? 'text-[#4A4A4A]' : 'text-[#6B6B6B]'
                    }`}>
                      {u.type === 'developer' ? (u.title ?? 'developer') : 'client'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
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

// ── Mobile side-tab + bottom sheet ────────────────────────────────────────────

export function ClientSidebar(props: ClientSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Fixed right-edge vertical tab (mobile only) */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40
                   flex flex-col items-center gap-2
                   pl-2.5 pr-2 py-4
                   bg-[#1C1C1C]/90 border border-r-0 border-[#404040]
                   rounded-l-xl
                   hover:border-[rgba(139,156,182,0.20)] hover:bg-[#1C1C1C]
                   transition-all duration-300 active:scale-95"
        aria-label="Open client details"
      >
        <SlidersHorizontal className="size-3.5" style={{ color: 'var(--space-accent)' }} />
        <span className="text-[8px] font-semibold text-[#4A4A4A] uppercase tracking-[0.15em] [writing-mode:vertical-rl] rotate-180">
          Details
        </span>
      </button>

      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-[45] bg-[#000000]/50 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-up bottom sheet */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-[55] flex flex-col
                    bg-[#1C1C1C] border-t border-[#404040] rounded-t-2xl
                    transition-transform duration-300 ease-in-out
                    ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '82vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[#333333]" />
        </div>
        {/* Sheet header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#404040] shrink-0">
          <h3 className="text-sm font-semibold text-[#F0F0F0]">{props.name}</h3>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#2D2D2D] text-[#4A4A4A] hover:text-[#A0A0A0] transition-all"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: 'contain' }}>
          <ClientSidebarContent {...props} />
        </div>
      </div>
    </>
  )
}
