'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users, FolderOpen, ArrowRight, Building2, AlertCircle, CheckCircle,
  Settings, Save, Loader2, Trash2, AlertTriangle, X, CheckCircle2, Shield,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NewClientModal } from '@/components/dashboard/NewClientModal'
import { PortfolioTimeline } from '@/components/dashboard/PortfolioTimeline'
import { deleteClientAccount, updateClientAccount, removeUserFromClientTeam } from '@/actions/clients'
import type { SerializedProject } from '@/components/dashboard/ProjectsCarousel'

interface ClientsViewProps {
  clientAccounts: any[]
  username: string
  userRole: string
  serializedProjects?: SerializedProject[]
  allOrders?: any[]
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTES = [
  { text: 'text-blue-500',    dot: 'bg-[#1E3A6E]'   },
  { text: 'text-blue-400',    dot: 'bg-blue-400'    },
  { text: 'text-violet-400',  dot: 'bg-violet-400'  },
  { text: 'text-emerald-400', dot: 'bg-emerald-400' },
  { text: 'text-amber-400',   dot: 'bg-amber-400'   },
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ─── Left panel: client nav row ────────────────────────────────────────────────

function ClientNavRow({
  client,
  index,
  isSelected,
  onSelect,
  animationDelay,
  username,
}: {
  client: any
  index: number
  isSelected: boolean
  onSelect: () => void
  animationDelay: number
  username: string
}) {
  const router = useRouter()
  const palette = PALETTES[index % PALETTES.length]
  const balance = client.accountBalance ?? 0
  const hasBalance = balance > 0

  return (
    <button
      type="button"
      data-client-id={client.id}
      onClick={onSelect}
      onDoubleClick={() => router.push(`/u/${username}/clients/${client.id}`)}
      className={cn(
        'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all duration-150 border-l-2 group',
        'animate-in fade-in slide-in-from-left-1 duration-300',
        isSelected
          ? 'border-l-[rgba(139,156,182,0.50)] bg-[#2D2D2D]'
          : 'border-l-transparent hover:bg-[rgba(255,255,255,0.02)] hover:border-l-[#404040]',
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Status dot */}
      <span
        className={cn(
          'size-2 rounded-full shrink-0',
          hasBalance ? 'bg-amber-400 animate-pulse' : palette.dot,
        )}
      />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold truncate transition-colors duration-150',
            isSelected ? 'text-[#F0F0F0]' : 'text-[#6B6B6B] group-hover:text-[#A0A0A0]',
          )}
        >
          {client.name}
        </p>
        <p className="text-[10px] text-[#4A4A4A] truncate mt-0.5">
          {client.company || client.email}
        </p>
      </div>

      {/* Balance badge */}
      {hasBalance && (
        <span className="text-[9px] font-mono text-amber-400 shrink-0 tabular-nums">
          {fmt(balance)}
        </span>
      )}
    </button>
  )
}

// ─── Client edit modal ─────────────────────────────────────────────────────────

function ClientEditModal({
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
      <DialogContent className="bg-[#1C1C1C] border-[#404040] max-w-lg p-0 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#404040]">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#1E3A6E] font-medium mb-2">
            Client Settings
          </p>
          <DialogTitle className="text-xl font-bold text-[#F0F0F0] leading-tight line-clamp-1">
            {client.name}
          </DialogTitle>
          <DialogDescription className="sr-only">Edit client account settings</DialogDescription>
          <div className="mt-3 w-6 h-px bg-[rgba(139,156,182,0.20)]" />
        </div>

        {/* Form */}
        <form id="client-edit-form" onSubmit={handleSave} className="px-8 py-7 space-y-5 max-h-[55vh] overflow-y-auto">

          {/* Identity */}
          <section className="space-y-4">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#1E3A6E] font-medium">Identity</p>
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#4A4A4A] tracking-wide">Display Name <span className="text-red-400/60">*</span></label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] focus:border-[rgba(139,156,182,0.20)] focus-visible:ring-0"
                disabled={isSaving}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#4A4A4A] tracking-wide">First Name</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] focus:border-[rgba(139,156,182,0.20)] focus-visible:ring-0"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#4A4A4A] tracking-wide">Last Name</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] focus:border-[rgba(139,156,182,0.20)] focus-visible:ring-0"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#4A4A4A] tracking-wide">Company</label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Optional"
                className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:border-[rgba(139,156,182,0.20)] focus-visible:ring-0"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#4A4A4A] tracking-wide">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="bg-[#2D2D2D] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:border-[rgba(139,156,182,0.20)] focus-visible:ring-0"
                disabled={isSaving}
              />
            </div>
          </section>

          {/* Team Members */}
          {members.length > 0 && (
            <section className="space-y-3 border-t border-[#404040] pt-5">
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#1E3A6E] font-medium">Team Members</p>
              <div className="space-y-1.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#2D2D2D] border border-[#404040]"
                  >
                    <Shield className="size-3.5 text-[#4A4A4A] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#A0A0A0] truncate">{m.name}</p>
                      {m.title && <p className="text-[10px] text-[#6B6B6B] truncate">{m.title}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={removingId === m.id || isSaving}
                      title="Remove from team"
                      className="size-6 rounded-full flex items-center justify-center text-[#4A4A4A] hover:text-red-400/70 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-30"
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
            <p className="text-[10px] tracking-[0.4em] uppercase text-red-400/70 font-medium flex items-center gap-2">
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
                  <p className="text-[11px] text-[#6B6B6B]">
                    Type <span className="font-mono text-[#A0A0A0]">{client.name}</span> to confirm.
                  </p>
                </div>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={client.name}
                  className="bg-[#2D2D2D] border-red-500/20 text-[#F0F0F0] placeholder:text-[#4A4A4A] focus:border-red-400/40 focus-visible:ring-0 font-mono text-sm"
                  disabled={isDeleting}
                />
                {deleteError && <p className="text-xs text-red-400/75">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowDelete(false); setDeleteInput(''); setDeleteError(null) }}
                    disabled={isDeleting}
                    className="flex-1 text-xs text-[#6B6B6B] hover:text-[#A0A0A0] bg-[#2D2D2D] hover:bg-[#E5E1D9] border border-[#404040] rounded-lg px-3 py-2 transition-all duration-150"
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
        <div className="px-8 pb-7 pt-5 border-t border-[#404040] space-y-3">
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
              className="flex-1 text-[#6B6B6B] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] border border-[#404040] transition-all duration-150"
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

// ─── Right panel: empty state ──────────────────────────────────────────────────

function EmptyState({ canCreate, username }: { canCreate: boolean; username: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-12 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-[rgba(139,156,182,0.04)] rounded-full blur-3xl scale-150" />
        <Users className="size-12 text-[#4A4A4A] relative z-10" />
      </div>
      <p className="text-[10px] tracking-[0.4em] uppercase text-[#1E3A6E] font-medium mb-3">No Clients</p>
      <p className="text-sm text-[#6B6B6B] mb-8 leading-relaxed">
        Client accounts will appear here once created.
      </p>
      {canCreate && (
        <div className="[&>button]:px-5 [&>button]:py-2.5">
          <NewClientModal username={username} />
        </div>
      )}
    </div>
  )
}

// ─── Right panel: client detail ────────────────────────────────────────────────

function ClientDetail({
  client,
  username,
  clientProjects,
  clientOrders,
  userRole,
  onDeleted,
}: {
  client: any
  username: string
  clientProjects: SerializedProject[]
  clientOrders: any[]
  userRole: string
  onDeleted: () => void
}) {
  const balance = client.accountBalance ?? 0
  const hasBalance = balance > 0
  const [editOpen, setEditOpen] = useState(false)

  const teamMembers: Array<{ id: string; name: string; title?: string | null }> = Array.isArray(client.assignedTo)
    ? (client.assignedTo as any[])
        .filter((u: any) => typeof u !== 'string' && u?.id)
        .map((u: any) => ({
          id: u.id,
          name: u.name || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || '',
          title: u.title ?? null,
        }))
    : []

  return (
    <div className="flex flex-col h-full">

      {/* ── Action buttons — in layout flow, above scroll area ─────────── */}
      <div className="shrink-0 flex items-center justify-end gap-3 px-8 pt-5 pb-3">
        {userRole !== 'client' && (
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2.5 bg-[#2D2D2D] hover:bg-[#E5E1D9] border border-[#404040] hover:border-[#404040] text-[#A0A0A0] hover:text-[#F0F0F0] font-semibold rounded-full px-7 py-3 text-sm transition-all duration-200"
          >
            <Settings className="size-4" />
            Edit
          </button>
        )}
        <Link
          href={`/u/${username}/clients/${client.id}`}
          className="flex items-center gap-2.5 bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 active:scale-[0.98] text-white font-bold rounded-full px-7 py-3 text-sm transition-all duration-200 group"
        >
          Open Profile
          <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 relative">

        {/* Orbital geometry */}
        <div
          className="sticky top-0 pointer-events-none select-none"
          aria-hidden="true"
          style={{ height: 0, overflow: 'visible' }}
        >
          <div className="absolute top-6 right-6 opacity-[0.04]">
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
              <circle cx="120" cy="120" r="119" stroke="#333333" strokeWidth="1" />
              <circle cx="120" cy="120" r="89" stroke="#333333" strokeWidth="0.5" />
              <circle cx="120" cy="120" r="52" stroke="#333333" strokeWidth="0.5" />
              <line x1="120" y1="0" x2="120" y2="240" stroke="#333333" strokeWidth="0.5" />
              <line x1="0" y1="120" x2="240" y2="120" stroke="#333333" strokeWidth="0.5" />
              <circle cx="120" cy="120" r="2.5" stroke="#333333" strokeWidth="0.5" fill="none" />
            </svg>
          </div>
        </div>

        <div className="px-12 py-10 space-y-10 relative z-10">

          {/* Edit modal */}
          {userRole !== 'client' && (
            <ClientEditModal
              client={client}
              open={editOpen}
              onOpenChange={setEditOpen}
              onDeleted={onDeleted}
              teamMembers={teamMembers}
            />
          )}

          {/* ── Header ── */}
          <div
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '0ms' }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between gap-4 mb-7">
              <div className="flex items-center gap-4">

                {/* Balance status pill */}
                {hasBalance ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-3.5 text-amber-400/80 shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-400/90">
                      Outstanding
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-3.5 text-emerald-400/70 shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400/70">
                      Clear
                    </span>
                  </div>
                )}

                {/* Company chip */}
                {client.company && (
                  <div className="flex items-center gap-2 text-xs bg-[#2D2D2D] border border-[#404040] rounded-full px-3.5 py-1.5">
                    <Building2 className="size-3.5 text-[rgba(139,156,182,0.30)] shrink-0" />
                    <span className="text-[#6B6B6B] font-medium">{client.company}</span>
                  </div>
                )}
              </div>

              <div />
            </div>

            {/* Large name */}
            <h2 className="text-6xl xl:text-7xl font-bold text-[#1E3A6E] leading-none mb-4">
              {client.name}
            </h2>
            <div className="w-10 h-px bg-[rgba(139,156,182,0.20)] mb-5" />

            {/* Email */}
            <p className="text-base text-[#6B6B6B] leading-relaxed">{client.email}</p>
          </div>

          {/* ── Stats grid ── */}
          <div
            className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '60ms' }}
          >
            {[
              {
                label: 'Balance',
                value: fmt(balance),
                accent: hasBalance,
                accentColor: 'amber',
              },
              { label: 'Projects', value: String(clientProjects.length) },
              { label: 'Orders', value: String(client.totalOrders ?? 0) },
            ].map((s) => (
              <div
                key={s.label}
                className={cn(
                  'rounded-2xl px-5 py-4 border',
                  s.accent && s.accentColor === 'amber'
                    ? 'bg-amber-400/5 border-amber-400/15'
                    : 'bg-[#2D2D2D] border-[#404040]',
                )}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1E3A6E] mb-2.5">
                  {s.label}
                </p>
                <p
                  className={cn(
                    'text-base font-semibold',
                    s.accent && s.accentColor === 'amber' ? 'text-amber-300/80' : 'text-[#A0A0A0]',
                  )}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Project timeline ── */}
          <div
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '120ms' }}
          >
            {clientProjects.length > 0 ? (
              <>
                <p className="text-[11px] tracking-[0.4em] uppercase text-[#1E3A6E] font-medium mb-5">
                  Project Timeline
                </p>
                <PortfolioTimeline projects={clientProjects} allOrders={clientOrders} username={username} />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#404040] px-6 py-8 text-center">
                <FolderOpen className="size-8 text-[#4A4A4A] mx-auto mb-3" />
                <p className="text-sm text-[#6B6B6B]">No projects assigned yet</p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}

// ─── Mobile card ───────────────────────────────────────────────────────────────

function MobileClientCard({
  client,
  index,
  username,
  animationDelay,
}: {
  client: any
  index: number
  username: string
  animationDelay: number
}) {
  const balance = client.accountBalance ?? 0
  const hasBalance = balance > 0

  return (
    <Link
      href={`/u/${username}/clients/${client.id}`}
      className="group block"
      style={{
        opacity: 0,
        animation: `cardFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) ${animationDelay}ms forwards`,
      }}
    >
      <style>{`
        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      <div
        className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl overflow-hidden
          border border-[#242424] bg-[#161616]
          transition-all duration-200
          group-hover:-translate-y-px group-hover:border-[rgba(103,232,249,0.18)] group-hover:bg-[#1A1A1A]
          group-hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
          active:scale-[0.99] active:transition-none"
      >
        {/* Cyan glow on hover — top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(90deg, transparent 10%, var(--space-accent) 50%, transparent 90%)' }}
        />

        {/* Left accent dot */}
        <div
          className="size-1.5 rounded-full shrink-0 transition-all duration-200"
          style={{
            background: hasBalance ? '#fbbf24' : 'var(--space-accent)',
            opacity: hasBalance ? 1 : 0.35,
            boxShadow: hasBalance
              ? '0 0 6px rgba(251,191,36,0.5)'
              : '0 0 0px var(--space-accent)',
          }}
        />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#E8E8E8] group-hover:text-white truncate transition-colors duration-200 leading-snug">
            {client.name}
          </p>
          <p className="text-[11px] text-[#666666] group-hover:text-[#777777] truncate mt-0.5 transition-colors duration-200">
            {[client.company, client.email].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Status badge */}
        {hasBalance ? (
          <span
            className="shrink-0 text-[11px] font-mono font-medium tabular-nums px-2 py-0.5 rounded"
            style={{
              color: '#fbbf24',
              background: 'rgba(251,191,36,0.07)',
              border: '1px solid rgba(251,191,36,0.14)',
            }}
          >
            {fmt(balance)}
          </span>
        ) : (
          <span
            className="shrink-0 text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              color: 'rgba(103,232,249,0.35)',
              background: 'rgba(103,232,249,0.04)',
              border: '1px solid rgba(103,232,249,0.08)',
            }}
          >
            Clear
          </span>
        )}

        {/* Arrow */}
        <ArrowRight
          className="size-3.5 shrink-0 transition-all duration-200"
          style={{ color: 'rgba(103,232,249,0.2)' }}
        />
      </div>
    </Link>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ClientsView({
  clientAccounts,
  username,
  userRole,
  serializedProjects = [],
  allOrders = [],
}: ClientsViewProps) {
  const [selectedId, setSelectedId] = useState<string>(clientAccounts[0]?.id ?? '')
  const listRef = useRef<HTMLDivElement>(null)

  const selectedClient = clientAccounts.find((c) => c.id === selectedId) ?? clientAccounts[0] ?? null

  // Projects and orders belonging to the selected client
  const clientProjects = serializedProjects.filter((p) => p.client?.id === selectedId)
  const clientOrders = allOrders.filter((o: any) => {
    const caId = typeof o.clientAccount === 'object' ? o.clientAccount?.id : o.clientAccount
    return caId === selectedId
  })

  const balanceCount = clientAccounts.filter((c) => (c.accountBalance ?? 0) > 0).length

  // Arrow-key navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [role="dialog"]')) return
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      setSelectedId((curr) => {
        const idx = clientAccounts.findIndex((c) => c.id === curr)
        const next =
          e.key === 'ArrowDown'
            ? Math.min(clientAccounts.length - 1, idx + 1)
            : Math.max(0, idx - 1)
        return clientAccounts[next]?.id ?? curr
      })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [clientAccounts])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-client-id="${selectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <>
      {/* ── DESKTOP: split panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex h-[calc(100vh-4rem)] overflow-hidden border-t border-[#404040]">

        {/* Left panel — navigator */}
        <div className="relative w-[272px] xl:w-[296px] bg-[#252525] flex flex-col overflow-hidden border-r border-[#404040] shrink-0">

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgba(139,156,182,0.10)] to-transparent shrink-0" />

          {/* Header */}
          <div className="px-6 pt-8 pb-5 shrink-0">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#1E3A6E] font-medium mb-3">
              Workspace
            </p>
            <h1 className="text-2xl font-bold text-[#F0F0F0] uppercase tracking-wide">Clients</h1>
            <div className="mt-3 w-5 h-px bg-[rgba(139,156,182,0.18)]" />
          </div>

          {/* Summary counts */}
          <div className="px-5 pb-3 shrink-0 flex items-center gap-3 text-[10px] text-[#4A4A4A]">
            {balanceCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-amber-400/60" />
                {balanceCount} outstanding
              </span>
            )}
            <span>{clientAccounts.length} total</span>
          </div>

          <div className="mx-5 mb-1 h-px bg-[#333333] shrink-0" />

          {/* Client list */}
          <div ref={listRef} className="flex-1 overflow-y-auto py-1">
            {clientAccounts.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] px-5 py-6 text-center">No clients yet.</p>
            ) : (
              clientAccounts.map((client, i) => (
                <ClientNavRow
                  key={client.id}
                  client={client}
                  index={i}
                  isSelected={client.id === selectedId}
                  onSelect={() => setSelectedId(client.id)}
                  animationDelay={Math.min(i * 50, 400)}
                  username={username}
                />
              ))
            )}
          </div>

          {userRole === 'admin' && (
            <div className="shrink-0 px-5 py-5 border-t border-[#404040] [&>button]:w-full">
              <NewClientModal username={username} />
            </div>
          )}

          {/* Corner geometry */}
          <div className="absolute bottom-0 right-0 pointer-events-none select-none" aria-hidden="true">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="opacity-[0.08]">
              <path d="M52 0 L52 52 L0 52" stroke="#333333" strokeWidth="1" />
              <path d="M52 16 L52 52 L16 52" stroke="#333333" strokeWidth="0.5" />
            </svg>
          </div>
        </div>

        {/* Right panel — detail */}
        <div className="flex-1 bg-[#1C1C1C] flex flex-col min-h-0 overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgba(139,156,182,0.06)] to-transparent shrink-0" />

          {selectedClient ? (
            <div
              key={selectedClient.id}
              className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-150"
            >
              <ClientDetail
                client={selectedClient}
                username={username}
                clientProjects={clientProjects}
                clientOrders={clientOrders}
                userRole={userRole}
                onDeleted={() => setSelectedId(clientAccounts.find(c => c.id !== selectedId)?.id ?? '')}
              />
            </div>
          ) : (
            <EmptyState canCreate={userRole === 'admin'} username={username} />
          )}
        </div>
      </div>

      {/* ── MOBILE: stacked list ───────────────────────────────────────────── */}
      <div className="lg:hidden px-4 pt-6 pb-28 space-y-4">
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#1E3A6E] font-medium mb-2">
            Workspace
          </p>
          <h1 className="text-2xl font-bold text-[#F0F0F0] uppercase tracking-wide">Clients</h1>
          <div className="mt-3 w-5 h-px bg-[rgba(139,156,182,0.18)]" />
        </div>

        {clientAccounts.length === 0 ? (
          <div className="rounded-xl border border-[#404040] bg-[#1C1C1C] p-10 text-center">
            <Users className="size-8 text-[#4A4A4A] mx-auto mb-3" />
            <p className="text-sm text-[#4A4A4A]">No clients yet.</p>
            {userRole === 'admin' && (
              <div className="mt-5">
                <NewClientModal username={username} />
              </div>
            )}
          </div>
        ) : (
          clientAccounts.map((client, i) => (
            <MobileClientCard
              key={client.id}
              client={client}
              index={i}
              username={username}
              animationDelay={Math.min(i * 60, 360)}
            />
          ))
        )}

        {userRole === 'admin' && clientAccounts.length > 0 && (
          <div className="pt-2 [&>button]:w-full">
            <NewClientModal username={username} />
          </div>
        )}
      </div>
    </>
  )
}
