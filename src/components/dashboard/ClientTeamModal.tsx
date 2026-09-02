'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Check,
  UserPlus,
  KeyRound,
  Shield,
  User,
  Pencil,
  X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteClientUser, updateClientUserEmail, removeClientUser } from '@/actions/clients'

// ── Team Modify Modal ───────────────────────────────────────────────────────────

export function TeamModal({
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
      <DialogContent className="bg-[var(--space-bg-base)] border border-[var(--space-border-hard)] text-[var(--space-text-primary)] p-0 overflow-hidden sm:max-w-[32.5rem] gap-0">
        <DialogTitle className="sr-only">Manage Team</DialogTitle>

        {/* Header */}
        <div className="px-7 pt-7 pb-0">
          <p className="text-xs uppercase tracking-widest text-[var(--space-text-muted)] font-semibold mb-1">Team</p>
          <h3 className="text-lg font-bold text-[var(--space-text-primary)] mb-5">
            {clientAccountName}
          </h3>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[var(--space-border-hard)]">
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
                    : 'border-transparent text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)]'
                }`}
              >
                <Icon className="size-3.5" />
                {label}
                <span className={`text-[0.625rem] tabular-nums px-1.5 py-0.5 rounded-full font-normal ${
                  tab === key ? 'bg-[var(--space-accent-soft)] text-[var(--space-accent)]' : 'bg-[var(--space-bg-card-hover)] text-[var(--space-text-muted)]'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-7 py-5 min-h-[12.5rem] max-h-[26.25rem] overflow-y-auto">

          {/* Admin / Staff tab */}
          {tab === 'admin' && (
            <div className="space-y-2">
              {teamMembers.length === 0 ? (
                <p className="text-sm text-[var(--space-text-muted)] py-4 text-center">No developers assigned to this account.</p>
              ) : (
                teamMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg bg-[var(--space-bg-card)] border border-[var(--space-border-hard)] px-4 py-3">
                    <div className="size-7 rounded-lg bg-[var(--space-bg-card-hover)] flex items-center justify-center shrink-0">
                      <Shield className="size-3.5 text-[var(--space-text-muted)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--space-text-tertiary)] truncate">{m.name}</p>
                      {m.title && (
                        <p className="text-[0.6875rem] text-[var(--space-text-muted)] truncate">{m.title}</p>
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
                  <p className="text-sm text-[var(--space-text-muted)] py-2 text-center">No client users yet.</p>
                ) : (
                  clientList.map((u) => {
                    const rs = resetStates[u.email] ?? 'idle'
                    const isEditing = emailEditing?.id === u.id
                    return (
                      <div key={u.id} className="rounded-lg bg-[var(--space-bg-card)] border border-[var(--space-border-hard)] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-7 rounded-lg bg-[var(--space-accent-soft)] flex items-center justify-center shrink-0">
                            <User className="size-3.5" style={{ color: 'var(--space-accent)', opacity: 0.6 }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--space-text-tertiary)] truncate">{u.name}</p>
                            {!isEditing && (
                              <p className="text-[0.6875rem] text-[var(--space-text-muted)] truncate">{u.email}</p>
                            )}
                          </div>
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => { setEmailEditing({ id: u.id, value: u.email }); setEmailError(null) }}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-[var(--space-border-hard)] text-[0.625rem] text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card-hover)] transition-all shrink-0"
                              >
                                <Pencil className="size-3" />
                                Email
                              </button>
                              <button
                                onClick={() => handlePasswordReset(u.email)}
                                disabled={rs === 'loading' || rs === 'sent'}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[var(--space-border-hard)] text-[0.625rem] text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                              >
                                {rs === 'loading' ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : rs === 'sent' ? (
                                  <Check className="size-3 text-[var(--space-status-ok)]" />
                                ) : (
                                  <KeyRound className="size-3" />
                                )}
                                <span className={rs === 'sent' ? 'text-[var(--space-status-ok)]' : rs === 'error' ? 'text-[var(--space-status-danger)]' : ''}>
                                  {rs === 'loading' ? 'Sending' : rs === 'sent' ? 'Sent' : rs === 'error' ? 'Failed' : 'Reset'}
                                </span>
                              </button>
                              <button
                                onClick={() => handleRemoveClient(u.id)}
                                disabled={removingClientId === u.id}
                                title="Remove client access"
                                className="flex items-center justify-center size-7 rounded-md border border-[var(--space-border-hard)] text-[var(--space-text-muted)] hover:text-[var(--space-status-danger)] hover:border-[var(--space-status-danger-line)] hover:bg-[var(--space-status-danger-soft)] transition-all shrink-0 disabled:opacity-40"
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
                                className="flex-1 h-8 text-xs bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus-visible:ring-[var(--space-accent)] focus-visible:ring-1"
                              />
                              <button
                                onClick={handleSaveEmail}
                                disabled={emailSaving}
                                className="flex items-center justify-center size-8 rounded-md bg-[var(--space-status-ok-soft)] border border-[var(--space-status-ok-line)] text-[var(--space-status-ok)] hover:bg-[var(--space-status-ok-soft)] transition-colors shrink-0 disabled:opacity-50"
                              >
                                {emailSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                              </button>
                              <button
                                onClick={() => { setEmailEditing(null); setEmailError(null) }}
                                disabled={emailSaving}
                                className="flex items-center justify-center size-8 rounded-md border border-[var(--space-border-hard)] text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-colors shrink-0"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                            {emailError && (
                              <p className="text-[0.625rem] text-[var(--space-status-danger)]">{emailError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--space-border-hard)]" />

              {/* Add client form */}
              {addSuccess ? (
                <div className="flex flex-col items-center text-center gap-3 py-4">
                  <div className="size-10 rounded-xl bg-[var(--space-status-ok-soft)] border border-[var(--space-status-ok-line)] flex items-center justify-center">
                    <Check className="size-5 text-[var(--space-status-ok)]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--space-text-primary)]">Invite sent</p>
                    <p className="text-xs text-[var(--space-text-muted)] mt-0.5">
                      <span className="text-[var(--space-text-tertiary)]">{addSuccess}</span> will receive a setup email.
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
                  <p className="text-[0.625rem] uppercase tracking-widest text-[var(--space-text-muted)] font-semibold">Add Client</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <Label className="text-[var(--space-text-muted)] text-xs">First name</Label>
                      <Input
                        value={addForm.firstName}
                        onChange={(e) => setAddForm((f) => ({ ...f, firstName: e.target.value }))}
                        placeholder="Jane"
                        className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] h-9 text-sm focus-visible:ring-[var(--space-accent)]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[var(--space-text-muted)] text-xs">Last name</Label>
                      <Input
                        value={addForm.lastName}
                        onChange={(e) => setAddForm((f) => ({ ...f, lastName: e.target.value }))}
                        placeholder="Doe"
                        className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] h-9 text-sm focus-visible:ring-[var(--space-accent)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[var(--space-text-muted)] text-xs">Email</Label>
                    <Input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="jane@example.com"
                      className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] h-9 text-sm focus-visible:ring-[var(--space-accent)]"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
                    />
                  </div>
                  {addError && (
                    <p className="text-xs text-[var(--space-status-danger)]">{addError}</p>
                  )}
                  <Button
                    onClick={handleAddClient}
                    disabled={addLoading}
                    className="w-full bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 text-white font-semibold gap-2 h-9"
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
        <div className="flex justify-end px-7 py-4 border-t border-[var(--space-border-hard)]">
          <Button
            variant="ghost"
            onClick={() => { onClose(); resetAddForm() }}
            className="text-[var(--space-text-muted)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] text-sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
