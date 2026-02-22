'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Users, FolderOpen, ArrowRight, Building2, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NewClientModal } from '@/components/dashboard/NewClientModal'
import { PortfolioTimeline } from '@/components/dashboard/PortfolioTimeline'
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
}: {
  client: any
  index: number
  isSelected: boolean
  onSelect: () => void
  animationDelay: number
}) {
  const palette = PALETTES[index % PALETTES.length]
  const balance = client.accountBalance ?? 0
  const hasBalance = balance > 0

  return (
    <button
      type="button"
      data-client-id={client.id}
      onClick={onSelect}
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
}: {
  client: any
  username: string
  clientProjects: SerializedProject[]
  clientOrders: any[]
}) {
  const balance = client.accountBalance ?? 0
  const hasBalance = balance > 0

  return (
    <div className="flex flex-col h-full">
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

              {/* Open profile */}
              <Link
                href={`/u/${username}/clients/${client.id}`}
                className="flex items-center gap-2 text-xs font-bold bg-intelligence-cyan hover:bg-intelligence-cyan/90 active:scale-[0.98] text-black rounded-lg px-4 py-2.5 transition-all duration-150 group shadow-[0_0_20px_rgba(103,232,249,0.2)]"
              >
                Open Profile
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
              </Link>
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
