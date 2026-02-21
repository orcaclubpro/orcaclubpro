import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ChevronRight, Users } from 'lucide-react'
import Link from 'next/link'
import { NewClientModal } from '@/components/dashboard/NewClientModal'
import { ClientRowActions } from '@/components/dashboard/ClientRowActions'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Clients — ${username} — ORCACLUB`,
    description: 'View and manage your client accounts',
  }
}

// Deterministic avatar palette cycling by row index
const AVATAR_PALETTES = [
  { text: 'text-cyan-300',   bg: 'bg-cyan-400/10',   border: 'border-cyan-400/20'   },
  { text: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'   },
  { text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  { text: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/20'},
  { text: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await getCurrentUser()

  if (!user || user.username !== username) redirect('/login')
  if (!user.username) redirect('/login')

  const payload = await getPayload({ config })

  const { docs: clientAccounts } = await payload.find({
    collection: 'client-accounts',
    where:
      user.role === 'admin'
        ? {}
        : { assignedTo: { contains: user.id } },
    depth: 1,
    sort: '-createdAt',
  })

  // Aggregate metrics
  const totalOutstanding = clientAccounts.reduce((s, c) => s + (c.accountBalance ?? 0), 0)
  const totalOrders      = clientAccounts.reduce((s, c) => s + (c.totalOrders    ?? 0), 0)
  const outstandingCount = clientAccounts.filter((c) => (c.accountBalance ?? 0) > 0).length

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {user.role === 'admin' ? 'All Clients' : 'Your Clients'}
            </h1>
            {clientAccounts.length > 0 && (
              <span className="font-mono text-sm text-gray-600 tabular-nums">
                {clientAccounts.length}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mt-1">
            {user.role === 'admin'
              ? 'Every client account across the platform'
              : 'Client accounts you are assigned to'}
          </p>
        </div>
        <div className="shrink-0">
          <NewClientModal username={username} />
        </div>
      </div>

      {/* ── Metric Bar ── */}
      {clientAccounts.length > 0 && (
        <div className="grid grid-cols-3 divide-x divide-white/[0.08] rounded-xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden">
          {/* Clients */}
          <div className="px-6 py-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600 font-semibold mb-2">
              Clients
            </p>
            <p className="text-3xl font-bold text-white font-mono tabular-nums">
              {clientAccounts.length}
            </p>
          </div>

          {/* Outstanding */}
          <div className="px-6 py-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600 font-semibold mb-2">
              Outstanding
            </p>
            <p
              className={`text-3xl font-bold font-mono tabular-nums ${
                totalOutstanding > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {fmt(totalOutstanding)}
            </p>
            {outstandingCount > 0 && (
              <p className="text-[11px] text-gray-600 mt-1">
                across {outstandingCount} {outstandingCount === 1 ? 'client' : 'clients'}
              </p>
            )}
          </div>

          {/* Orders */}
          <div className="px-6 py-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600 font-semibold mb-2">
              Total Orders
            </p>
            <p className="text-3xl font-bold text-white font-mono tabular-nums">
              {totalOrders}
            </p>
          </div>
        </div>
      )}

      {/* ── Client List ── */}
      {clientAccounts.length > 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] overflow-hidden">

          {/* Column Headers */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.08] bg-white/[0.03]">
            <div className="flex-1 text-[10px] uppercase tracking-[0.18em] text-gray-600 font-semibold">
              Client
            </div>
            <div className="w-36 text-[10px] uppercase tracking-[0.18em] text-gray-600 font-semibold hidden lg:block">
              Company
            </div>
            <div className="w-32 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-semibold">
              Balance
            </div>
            <div className="w-20 text-center text-[10px] uppercase tracking-[0.18em] text-gray-600 font-semibold hidden sm:block">
              Orders
            </div>
            <div className="w-8" />
          </div>

          {/* Rows */}
          {clientAccounts.map((client, index) => {
            const balance     = client.accountBalance ?? 0
            const orders      = client.totalOrders    ?? 0
            const palette     = AVATAR_PALETTES[index % AVATAR_PALETTES.length]
            const initials    = getInitials(client.name || client.email || '??')
            const outstanding = balance > 0

            return (
              <div
                key={client.id}
                className="group relative flex items-center gap-4 px-5 py-[18px] border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors duration-150 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                style={{
                  animationDelay: `${index * 45}ms`,
                  animationFillMode: 'backwards',
                }}
              >
                {/* Full-row link (sits behind all content) */}
                <Link
                  href={`/u/${username}/clients/${client.id}`}
                  className="absolute inset-0 z-[1]"
                  aria-label={`View ${client.name}`}
                />

                {/* Left hover accent */}
                <div className="absolute left-0 top-0 h-full w-[2px] bg-[#67e8f9] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[1]" />

                {/* Avatar initials */}
                <div
                  className={`relative z-[2] size-9 rounded-lg ${palette.bg} border ${palette.border} flex items-center justify-center shrink-0`}
                >
                  <span className={`text-xs font-bold ${palette.text}`}>{initials}</span>
                </div>

                {/* Name + email */}
                <div className="relative z-[2] flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate leading-snug">
                    {client.name}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{client.email}</div>
                </div>

                {/* Company */}
                <div className="relative z-[2] w-36 hidden lg:block min-w-0">
                  <span className="text-sm text-gray-500 truncate block">
                    {client.company || <span className="text-gray-700">—</span>}
                  </span>
                </div>

                {/* Balance */}
                <div className="relative z-[2] w-32 text-right shrink-0">
                  {outstanding ? (
                    <>
                      <div className="text-sm font-mono font-semibold text-amber-400 tabular-nums">
                        {fmt(balance)}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span className="relative flex size-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                          <span className="relative inline-flex rounded-full size-1.5 bg-amber-400" />
                        </span>
                        <span className="text-[10px] text-amber-600 uppercase tracking-wider">
                          due
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-mono text-emerald-500/60 tabular-nums">
                      $0.00
                    </div>
                  )}
                </div>

                {/* Orders */}
                <div className="relative z-[2] w-20 text-center hidden sm:block shrink-0">
                  <div className="text-sm font-mono font-semibold text-white tabular-nums">
                    {orders}
                  </div>
                  <div className="text-[10px] text-gray-700">orders</div>
                </div>

                {/* Actions: chevron ↔ 3-dot menu (swap on hover) */}
                <div className="relative z-[2] w-8 flex items-center justify-end shrink-0">
                  {/* Chevron — fades out on hover */}
                  <ChevronRight className="size-4 text-gray-700 group-hover:text-[#67e8f9] group-hover:opacity-0 transition-all duration-150 absolute" />
                  {/* 3-dot — fades in on hover */}
                  <ClientRowActions
                    clientId={client.id}
                    clientName={client.name}
                    clientEmail={client.email}
                    firstName={client.firstName ?? ''}
                    lastName={client.lastName ?? ''}
                    company={client.company}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#1c1c1c]">
          {/* Ambient glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-80 rounded-full bg-[#67e8f9]/[0.03] blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center py-20 px-6">
            <div className="size-14 rounded-2xl bg-[#1c1c1c] border border-white/[0.08] flex items-center justify-center mb-5">
              <Users className="size-6 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No clients yet</h3>
            <p className="text-gray-600 text-sm max-w-xs leading-relaxed mb-7">
              {user.role === 'admin'
                ? 'Create your first client account. It will automatically sync with Stripe.'
                : 'You have not been assigned to any client accounts yet.'}
            </p>
            {user.role === 'admin' && <NewClientModal username={username} />}
          </div>
        </div>
      )}
    </div>
  )
}
