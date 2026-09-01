'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2, Save, Shield, Trash2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { deleteClientAccount, removeUserFromClientTeam, updateClientAccount } from '@/actions/clients'

// Edit identity, manage the account's team, and delete the account. Lifted out
// of ClientsView when that view collapsed onto the shared list-detail shell —
// the detail pane and the client profile route both open this same modal.

export function ClientEditModal({
  client,
  open,
  onOpenChange,
  onDeleted,
  teamMembers: initialTeamMembers = [],
}: {
  client: any
  open: boolean
  onOpenChange: (v: boolean) => void
  onDeleted: () => void
  teamMembers?: Array<{ id: string; name: string; title?: string | null }>
}) {
  const router = useRouter()

  // Edit form state
  const [name, setName]           = useState(client.name ?? '')
  const [firstName, setFirstName] = useState(client.firstName ?? '')
  const [lastName, setLastName]   = useState(client.lastName ?? '')
  const [company, setCompany]     = useState(client.company ?? '')
  const [email, setEmail]         = useState(client.email ?? '')
  const [isSaving, setIsSaving]   = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved]         = useState(false)

  // Team state
  const [members, setMembers]       = useState(initialTeamMembers)
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Delete zone state
  const [showDelete, setShowDelete]     = useState(false)
  const [deleteInput, setDeleteInput]   = useState('')
  const [isDeleting, setIsDeleting]     = useState(false)
  const [deleteError, setDeleteError]   = useState<string | null>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setName(client.name ?? '')
      setFirstName(client.firstName ?? '')
      setLastName(client.lastName ?? '')
      setCompany(client.company ?? '')
      setEmail(client.email ?? '')
      setSaveError(null)
      setSaved(false)
      setShowDelete(false)
      setDeleteInput('')
      setDeleteError(null)
      setMembers(initialTeamMembers)
    }
  }, [open, client]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemoveMember = async (userId: string) => {
    setRemovingId(userId)
    const result = await removeUserFromClientTeam({ clientAccountId: client.id, userId })
    setRemovingId(null)
    if (result.success) {
      setMembers((m) => m.filter((u) => u.id !== userId))
      router.refresh()
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setSaveError('Name is required'); return }
    setIsSaving(true)
    setSaveError(null)
    const result = await updateClientAccount({
      id: client.id,
      name: name.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim() || undefined,
      email: email.trim() || undefined,
    })
    setIsSaving(false)
    if (!result.success) { setSaveError(result.error ?? 'Failed to save'); return }
    setSaved(true)
    setTimeout(() => { onOpenChange(false); router.refresh() }, 1000)
  }

  const handleDelete = async () => {
    if (deleteInput !== client.name) return
    setIsDeleting(true)
    setDeleteError(null)
    const result = await deleteClientAccount({ id: client.id })
    setIsDeleting(false)
    if (!result.success) { setDeleteError(result.error ?? 'Failed to delete'); return }
    onOpenChange(false)
    onDeleted()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--space-bg-base)] border-[var(--space-border-hard)] max-w-lg p-0 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[var(--space-border-hard)]">
          <p className="text-[0.625rem] tracking-[0.4em] uppercase text-[var(--space-accent)] font-medium mb-2">
            Client Settings
          </p>
          <DialogTitle className="text-xl font-bold text-[var(--space-text-primary)] leading-tight line-clamp-1">
            {client.name}
          </DialogTitle>
          <DialogDescription className="sr-only">Edit client account settings</DialogDescription>
          <div className="mt-3 w-6 h-px bg-[rgba(139,156,182,0.20)]" />
        </div>

        {/* Form */}
        <form id="client-edit-form" onSubmit={handleSave} className="px-8 py-7 space-y-5 max-h-[55vh] overflow-y-auto">

          {/* Identity */}
          <section className="space-y-4">
            <p className="text-[0.625rem] tracking-[0.4em] uppercase text-[var(--space-accent)] font-medium">Identity</p>
            <div className="space-y-1.5">
              <label className="text-[0.6875rem] text-[var(--space-text-muted)] tracking-wide">Display Name <span className="text-red-400/60">*</span></label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus:border-[rgba(139,156,182,0.20)] focus-visible:ring-0"
                disabled={isSaving}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[0.6875rem] text-[var(--space-text-muted)] tracking-wide">First Name</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus:border-[rgba(139,156,182,0.20)] focus-visible:ring-0"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.6875rem] text-[var(--space-text-muted)] tracking-wide">Last Name</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] focus:border-[rgba(139,156,182,0.20)] focus-visible:ring-0"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.6875rem] text-[var(--space-text-muted)] tracking-wide">Company</label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Optional"
                className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:border-[rgba(139,156,182,0.20)] focus-visible:ring-0"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[0.6875rem] text-[var(--space-text-muted)] tracking-wide">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:border-[rgba(139,156,182,0.20)] focus-visible:ring-0"
                disabled={isSaving}
              />
            </div>
          </section>

          {/* Team Members */}
          {members.length > 0 && (
            <section className="space-y-3 border-t border-[var(--space-border-hard)] pt-5">
              <p className="text-[0.625rem] tracking-[0.4em] uppercase text-[var(--space-accent)] font-medium">Team Members</p>
              <div className="space-y-1.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)]"
                  >
                    <Shield className="size-3.5 text-[var(--space-text-muted)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--space-text-tertiary)] truncate">{m.name}</p>
                      {m.title && <p className="text-[0.625rem] text-[var(--space-text-secondary)] truncate">{m.title}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={removingId === m.id || isSaving}
                      title="Remove from team"
                      className="size-6 rounded-full flex items-center justify-center text-[var(--space-text-muted)] hover:text-red-400/70 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-30"
                    >
                      {removingId === m.id
                        ? <Loader2 className="size-3 animate-spin" />
                        : <X className="size-3" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Danger Zone */}
          <section className="space-y-3 border-t border-red-500/10 pt-5">
            <p className="text-[0.625rem] tracking-[0.4em] uppercase text-red-400/70 font-medium flex items-center gap-2">
              <AlertTriangle className="size-3" />
              Danger Zone
            </p>
            {!showDelete ? (
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                disabled={isSaving}
                className="flex items-center gap-2 text-xs text-red-400/50 hover:text-red-400/80 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/25 rounded-lg px-4 py-2.5 transition-all duration-150"
              >
                <Trash2 className="size-3.5" />
                Delete Client Account
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="space-y-1">
                  <p className="text-xs text-red-400/80 font-medium">This is permanent and cannot be undone.</p>
                  <p className="text-[0.6875rem] text-[var(--space-text-secondary)]">
                    Type <span className="font-mono text-[var(--space-text-tertiary)]">{client.name}</span> to confirm.
                  </p>
                </div>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={client.name}
                  className="bg-[var(--space-bg-card-hover)] border-red-500/20 text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:border-red-400/40 focus-visible:ring-0 font-mono text-sm"
                  disabled={isDeleting}
                />
                {deleteError && <p className="text-xs text-red-400/75">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowDelete(false); setDeleteInput(''); setDeleteError(null) }}
                    disabled={isDeleting}
                    className="flex-1 text-xs text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] bg-[var(--space-bg-card-hover)] hover:bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg px-3 py-2 transition-all duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteInput !== client.name || isDeleting}
                    className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-lg px-3 py-2 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isDeleting
                      ? <><Loader2 className="size-3.5 animate-spin" />Deleting…</>
                      : <><Trash2 className="size-3.5" />Confirm Delete</>
                    }
                  </button>
                </div>
              </div>
            )}
          </section>
        </form>

        {/* Footer */}
        <div className="px-8 pb-7 pt-5 border-t border-[var(--space-border-hard)] space-y-3">
          {saveError && (
            <p className="text-xs text-red-400/75 animate-in fade-in duration-200">{saveError}</p>
          )}
          {saved && (
            <div className="flex items-center gap-2 text-xs text-green-400/80 animate-in fade-in duration-200">
              <CheckCircle2 className="size-3.5 shrink-0" />
              Saved successfully
            </div>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="flex-1 text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] hover:bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] transition-all duration-150"
            >
              <X className="size-3.5 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              form="client-edit-form"
              disabled={isSaving}
              className="flex-1 bg-[var(--space-accent)] text-white hover:bg-[var(--space-accent)]/90 font-medium"
            >
              {isSaving
                ? <><Loader2 className="size-3.5 mr-2 animate-spin" />Saving…</>
                : <><Save className="size-3.5 mr-2" />Save Changes</>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

