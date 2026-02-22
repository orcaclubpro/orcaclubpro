'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, Building2, Pencil, Check, Loader2,
  Shield, User, Users,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClientAccount } from '@/actions/clients'

export interface ClientSettingsCardProps {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  company?: string | null
  stripeCustomerId?: string | null
  teamMembers: Array<{ id: string; name: string }>
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

export function ClientSettingsCard({
  id,
  name,
  firstName,
  lastName,
  email,
  company,
  stripeCustomerId,
  teamMembers,
  clientUsers,
}: ClientSettingsCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({ name, firstName, lastName, company: company ?? '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = getInitials(name)
  const allUsers = [
    ...teamMembers.map((m) => ({ ...m, type: 'staff' as const })),
    ...clientUsers.map((u) => ({ ...u, type: 'client' as const })),
  ]

  function handleOpenEdit() {
    setForm({ name, firstName, lastName, company: company ?? '' })
    setError(null)
    setEditOpen(true)
  }

  function handleCloseEdit() {
    setForm({ name, firstName, lastName, company: company ?? '' })
    setError(null)
    setEditOpen(false)
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
    })
    setLoading(false)
    if (result.success) {
      setEditOpen(false)
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to update')
    }
  }

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
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
            {company && (
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-700">
                <Building2 className="size-3 shrink-0" />
                <span className="truncate">{company}</span>
              </div>
            )}
            <button
              onClick={handleOpenEdit}
              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-white/[0.08] rounded-lg hover:text-white hover:border-white/[0.18] hover:bg-white/[0.03] transition-all"
            >
              <Pencil className="size-3" />
              Edit
            </button>
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
                  {u.type === 'staff'
                    ? <Shield className="size-3 text-gray-600 shrink-0" />
                    : <User className="size-3 text-[#67e8f9]/50 shrink-0" />
                  }
                  <span className={u.type === 'staff' ? 'text-gray-500' : 'text-gray-400'}>
                    {u.name}
                  </span>
                  <span className={`text-[9px] uppercase tracking-wide font-semibold ml-0.5 ${
                    u.type === 'staff' ? 'text-gray-700' : 'text-[#67e8f9]/40'
                  }`}>
                    {u.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) handleCloseEdit(); else setEditOpen(true) }}>
        <DialogContent className="bg-[#111] border border-white/[0.10] text-white sm:max-w-[420px] rounded-2xl">
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
              <Label className="text-gray-500 text-xs uppercase tracking-wide">Company</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Optional"
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
