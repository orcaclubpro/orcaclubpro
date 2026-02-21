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
  KeyRound,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClientAccount } from '@/actions/clients'

export interface ClientSidebarProps {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  company?: string | null
  accountBalance: number
  totalRevenue: number
  ordersCount: number
  projectsCount: number
  stripeCustomerId?: string | null
  teamMembers: Array<{ id: string; name: string }>
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

// ── Shared sidebar content ─────────────────────────────────────────────────────
// Rendered inline on desktop and inside a Sheet on mobile.

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
    username,
  } = props

  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetState, setResetState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [form, setForm] = useState({
    name,
    firstName,
    lastName,
    company: company ?? '',
  })

  const initials = getInitials(name)
  const hasOutstanding = accountBalance > 0

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
      setEditing(false)
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to update')
    }
  }

  function handleCancel() {
    setForm({ name, firstName, lastName, company: company ?? '' })
    setError(null)
    setEditing(false)
  }

  async function handleSendPasswordReset() {
    setResetState('loading')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResetState(res.ok ? 'sent' : 'error')
    } catch {
      setResetState('error')
    }
    setTimeout(() => setResetState('idle'), 3000)
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
                <Label className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">
                  First
                </Label>
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
                <Label className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">
                  Last
                </Label>
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
              <Label className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">
                Display Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">
                Company
              </Label>
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
            <p className="text-xs text-gray-700 mt-1 truncate">{email}</p>
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
            { label: 'Revenue',  value: fmt(totalRevenue),         Icon: TrendingUp,  amber: false          },
            { label: 'Balance',  value: fmt(accountBalance),        Icon: DollarSign,  amber: hasOutstanding },
            { label: 'Orders',   value: String(ordersCount),        Icon: ShoppingCart, amber: false         },
            { label: 'Projects', value: String(projectsCount),      Icon: FolderKanban, amber: false         },
          ].map(({ label, value, Icon, amber }) => (
            <div key={label} className="rounded-lg bg-[#1c1c1c] border border-white/[0.08] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="size-3 text-gray-700" />
                <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">
                  {label}
                </span>
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
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
            {company && (
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Building2 className="size-3 shrink-0" />
                <span className="truncate">{company}</span>
              </div>
            )}
          </div>
        </div>

        {/* Team */}
        {teamMembers.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Team</p>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2 text-gray-500 text-xs">
                  <Users className="size-3 shrink-0" />
                  <span className="truncate">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Actions</p>
          <button
            onClick={handleSendPasswordReset}
            disabled={resetState === 'loading' || resetState === 'sent'}
            className="w-full flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#1c1c1c] px-3 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-[#242424] hover:border-white/[0.14] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetState === 'loading' ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin" />
            ) : resetState === 'sent' ? (
              <Check className="size-3.5 shrink-0 text-emerald-400" />
            ) : (
              <KeyRound className="size-3.5 shrink-0" />
            )}
            <span className={resetState === 'sent' ? 'text-emerald-400' : resetState === 'error' ? 'text-red-400' : ''}>
              {resetState === 'loading' ? 'Sending...' : resetState === 'sent' ? 'Reset email sent' : resetState === 'error' ? 'Failed — try again' : 'Send password reset'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Mobile Sheet trigger ───────────────────────────────────────────────────────
// Renders a button that opens the sidebar content in a Sheet overlay.
// Only used on mobile; desktop renders ClientSidebarContent inline.

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
