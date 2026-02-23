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
  { text: 'text-cyan-300',    dot: 'bg-cyan-400'    },
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
          ? 'border-l-cyan-400/60 bg-white/[0.04]'
          : 'border-l-transparent hover:bg-white/[0.02] hover:border-l-white/[0.08]',
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
            isSelected ? 'text-white' : 'text-white/60 group-hover:text-white/85',
          )}
        >
          {client.name}
        </p>
        <p className="text-[10px] text-white/35 truncate mt-0.5">
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
      <DialogContent className="bg-black border-white/[0.06] max-w-lg p-0 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-white/[0.05]">
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-light mb-2">
            Client Settings
          </p>
          <DialogTitle className="text-xl font-bold text-white leading-tight line-clamp-1">
            {client.name}
          </DialogTitle>
          <DialogDescription className="sr-only">Edit client account settings</DialogDescription>
          <div className="mt-3 w-6 h-px bg-cyan-400/40" />
        </div>

        {/* Form */}
        <form id="client-edit-form" onSubmit={handleSave} className="px-8 py-7 space-y-5 max-h-[55vh] overflow-y-auto">

          {/* Identity */}
          <section className="space-y-4">
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">Identity</p>
            <div className="space-y-1.5">
              <label className="text-[11px] text-white/35 tracking-wide">Display Name <span className="text-red-400/60">*</span></label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/[0.03] border-white/[0.06] text-white focus:border-cyan-400/30 focus-visible:ring-0"
                disabled={isSaving}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/35 tracking-wide">First Name</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-white/[0.03] border-white/[0.06] text-white focus:border-cyan-400/30 focus-visible:ring-0"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/35 tracking-wide">Last Name</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-white/[0.03] border-white/[0.06] text-white focus:border-cyan-400/30 focus-visible:ring-0"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-white/35 tracking-wide">Company</label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Optional"
                className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 focus:border-cyan-400/30 focus-visible:ring-0"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-white/35 tracking-wide">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 focus:border-cyan-400/30 focus-visible:ring-0"
                disabled={isSaving}
              />
            </div>
          </section>

          {/* Team Members */}
          {members.length > 0 && (
            <section className="space-y-3 border-t border-white/[0.05] pt-5">
              <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light">Team Members</p>
              <div className="space-y-1.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.025] border border-white/[0.04]"
                  >
                    <Shield className="size-3.5 text-gray-700 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60 truncate">{m.name}</p>
                      {m.title && <p className="text-[10px] text-white/25 truncate">{m.title}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={removingId === m.id || isSaving}
                      title="Remove from team"
                      className="size-6 rounded-full flex items-center justify-center text-white/20 hover:text-red-400/70 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-30"
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
            <p className="text-[10px] tracking-[0.4em] uppercase text-red-400/40 font-light flex items-center gap-2">
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
                  <p className="text-[11px] text-white/30">
                    Type <span className="font-mono text-white/50">{client.name}</span> to confirm.
                  </p>
                </div>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={client.name}
                  className="bg-white/[0.03] border-red-500/20 text-white placeholder:text-white/15 focus:border-red-400/40 focus-visible:ring-0 font-mono text-sm"
                  disabled={isDeleting}
                />
                {deleteError && <p className="text-xs text-red-400/75">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowDelete(false); setDeleteInput(''); setDeleteError(null) }}
                    disabled={isDeleting}
                    className="flex-1 text-xs text-white/30 hover:text-white/50 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg px-3 py-2 transition-all duration-150"
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
        <div className="px-8 pb-7 pt-5 border-t border-white/[0.05] space-y-3">
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
              className="flex-1 text-white/35 hover:text-white/55 hover:bg-white/[0.04] border border-white/[0.06] transition-all duration-150"
            >
              <X className="size-3.5 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              form="client-edit-form"
              disabled={isSaving}
              className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/10"
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
        <div className="absolute inset-0 bg-cyan-400/5 rounded-full blur-3xl scale-150" />
        <Users className="size-12 text-white/10 relative z-10" />
      </div>
      <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light mb-3">No Clients</p>
      <p className="text-sm text-white/25 mb-8 leading-relaxed">
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
            className="flex items-center gap-2.5 bg-[#1c1c1c] hover:bg-[#252525] border border-white/[0.14] hover:border-white/[0.24] text-white/75 hover:text-white font-semibold rounded-full px-7 py-3 text-sm transition-all duration-200"
          >
            <Settings className="size-4" />
            Edit
          </button>
        )}
        <Link
          href={`/u/${username}/clients/${client.id}`}
          className="flex items-center gap-2.5 bg-intelligence-cyan hover:bg-intelligence-cyan/90 active:scale-[0.98] text-black font-bold rounded-full px-7 py-3 text-sm transition-all duration-200 group shadow-[0_0_28px_rgba(103,232,249,0.35)] hover:shadow-[0_0_42px_rgba(103,232,249,0.5)]"
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
          <div className="absolute top-6 right-6 opacity-[0.03]">
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
              <circle cx="120" cy="120" r="119" stroke="white" strokeWidth="1" />
              <circle cx="120" cy="120" r="89" stroke="white" strokeWidth="0.5" />
              <circle cx="120" cy="120" r="52" stroke="white" strokeWidth="0.5" />
              <line x1="120" y1="0" x2="120" y2="240" stroke="white" strokeWidth="0.5" />
              <line x1="0" y1="120" x2="240" y2="120" stroke="white" strokeWidth="0.5" />
              <circle cx="120" cy="120" r="2.5" stroke="white" strokeWidth="0.5" fill="none" />
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
                  <div className="flex items-center gap-2 text-xs bg-white/[0.04] border border-white/[0.08] rounded-full px-3.5 py-1.5">
                    <Building2 className="size-3.5 text-cyan-400/50 shrink-0" />
                    <span className="text-white/55 font-medium">{client.company}</span>
                  </div>
                )}
              </div>

              <div />
            </div>

            {/* Large name */}
            <h2 className="text-6xl xl:text-7xl font-bold gradient-text leading-none mb-4">
              {client.name}
            </h2>
            <div className="w-10 h-px bg-cyan-400/40 mb-5" />

            {/* Email */}
            <p className="text-base text-white/40 leading-relaxed">{client.email}</p>
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
                    : 'bg-white/[0.025] border-white/[0.06]',
                )}
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2.5">
                  {s.label}
                </p>
                <p
                  className={cn(
                    'text-base font-semibold',
                    s.accent && s.accentColor === 'amber' ? 'text-amber-300/80' : 'text-white/75',
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
                <p className="text-[11px] tracking-[0.4em] uppercase text-white/25 font-light mb-5">
                  Project Timeline
                </p>
                <PortfolioTimeline projects={clientProjects} allOrders={clientOrders} username={username} />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/[0.07] px-6 py-8 text-center">
                <FolderOpen className="size-8 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/20">No projects assigned yet</p>
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
  const palette = PALETTES[index % PALETTES.length]
  const balance = client.accountBalance ?? 0
  const hasBalance = balance > 0

  return (
    <Link
      href={`/u/${username}/clients/${client.id}`}
      className={cn(
        'block rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-200 overflow-hidden',
        'animate-in fade-in slide-in-from-bottom-2 duration-300',
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={cn('h-px w-full', hasBalance ? 'bg-amber-400' : palette.dot)} />
      <div className="p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('size-1.5 rounded-full shrink-0', hasBalance ? 'bg-amber-400' : palette.dot)} />
            <p className="text-base font-semibold text-white truncate">{client.name}</p>
          </div>
          {client.company && (
            <p className="text-xs text-white/35 truncate">{client.company}</p>
          )}
          <p className="text-xs text-white/20 truncate">{client.email}</p>
        </div>
        {hasBalance ? (
          <span className="text-sm font-mono text-amber-400 shrink-0 tabular-nums">{fmt(balance)}</span>
        ) : (
          <span className="text-xs text-emerald-500/60 shrink-0">Clear</span>
        )}
        <ArrowRight className="size-4 text-white/20 shrink-0" />
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
      <div className="hidden lg:flex h-[calc(100vh-4rem)] overflow-hidden border-t border-white/[0.04]">

        {/* Left panel — navigator */}
        <div className="relative w-[272px] xl:w-[296px] bg-black flex flex-col overflow-hidden border-r border-white/[0.05] shrink-0">

          <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent shrink-0" />

          {/* Header */}
          <div className="px-6 pt-8 pb-5 shrink-0">
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light mb-3">
              Workspace
            </p>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wide">Clients</h1>
            <div className="mt-3 w-5 h-px bg-cyan-400/35" />
          </div>

          {/* Summary counts */}
          <div className="px-5 pb-3 shrink-0 flex items-center gap-3 text-[10px] text-white/30">
            {balanceCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-amber-400/60" />
                {balanceCount} outstanding
              </span>
            )}
            <span>{clientAccounts.length} total</span>
          </div>

          <div className="mx-5 mb-1 h-px bg-white/[0.04] shrink-0" />

          {/* Client list */}
          <div ref={listRef} className="flex-1 overflow-y-auto py-1">
            {clientAccounts.length === 0 ? (
              <p className="text-xs text-white/20 px-5 py-6 text-center">No clients yet.</p>
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
            <div className="shrink-0 px-5 py-5 border-t border-white/[0.05] [&>button]:w-full">
              <NewClientModal username={username} />
            </div>
          )}

          {/* Corner geometry */}
          <div className="absolute bottom-0 right-0 pointer-events-none select-none" aria-hidden="true">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="opacity-[0.05]">
              <path d="M52 0 L52 52 L0 52" stroke="white" strokeWidth="1" />
              <path d="M52 16 L52 52 L16 52" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
        </div>

        {/* Right panel — detail */}
        <div className="flex-1 bg-[#080808] flex flex-col min-h-0 overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/12 to-transparent shrink-0" />

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
          <p className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-light mb-2">
            Workspace
          </p>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wide">Clients</h1>
          <div className="mt-3 w-5 h-px bg-cyan-400/35" />
        </div>

        {clientAccounts.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
            <Users className="size-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/25">No clients yet.</p>
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
