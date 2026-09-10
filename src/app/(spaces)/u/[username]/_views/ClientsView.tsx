'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Layers, Wallet, Zap, Moon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import {
  Figure, figureEdges, SectionNav, SectionTitle, SearchField, Empty, ToneRule,
  useSectionCycle, type FigureSpec, type LedgerSection,
} from '@/components/dashboard/ledger'
import { NewClientModal } from '@/components/dashboard/NewClientModal'
import { toneColor, type StatusTone } from '@/lib/dashboard/status'
import { orderDate } from '@/lib/dashboard/utils'
import type { SerializedProject } from '@/lib/serialization'
import { tabVariants } from '@/lib/animations'

// ─── The client list ─────────────────────────────────────────────────────────
// Browsing clients, in the same language as the staff home and the client
// record it opens onto (`_views/AdminHomeView`, `clients/[client]`). It used to
// be a 264px list beside a detail pane that re-rendered, worse, what
// `clients/[client]` already shows — so the pane is gone and a row is a link.
//
// It follows the ledger's two rules:
//   1. Every colour is a --space-* token or a status-ramp tone. No raw hex, no
//      Tailwind palette classes — `sonar` (warm paper) is the default theme.
//   2. Type is authored in real px inside .space-true-scale, not in rem against
//      the portal's 1.5 root scale.

/** How far back an order still counts a client as active. Matches AdminHomeView. */
const ACTIVE_CLIENT_MONTHS = 3

const LANES = ['all', 'owing', 'active', 'dormant'] as const
type Lane = typeof LANES[number]

const SECTIONS: LedgerSection<Lane>[] = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'owing', label: 'Owing', icon: Wallet },
  { id: 'active', label: 'Active', icon: Zap },
  { id: 'dormant', label: 'Dormant', icon: Moon },
]

const LANE_EMPTY: Record<Lane, string> = {
  all: 'No clients yet. Add the first one.',
  owing: 'Every balance is clear. Nothing to chase.',
  active: `No client has ordered in the last ${ACTIVE_CLIENT_MONTHS} months.`,
  dormant: 'Every client has ordered recently.',
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
})

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`

const idOf = (ref: any): string | null =>
  ref ? (typeof ref === 'object' ? ref.id ?? null : String(ref)) : null

interface ClientRow {
  id: string
  name: string
  /** Company, or the email when there is no company. */
  detail: string | null
  balance: number
  projects: number
  orders: number
  /** Epoch ms of the most recent order, 0 when they have never ordered. */
  lastOrder: number
  active: boolean
  /** Everything the search field reads, lowercased once. */
  haystack: string
}

// ─── A client line ────────────────────────────────────────────────────────────
// The whole row is one link: unlike an invoice line there is only one place a
// client goes, so splitting the anchor would be a distinction without a reader.

function ClientLine({ client, username }: { client: ClientRow; username: string }) {
  const owing = client.balance > 0
  const tone: StatusTone = owing ? 'warn' : client.active ? 'ok' : 'idle'

  return (
    <Link
      href={`/u/${username}/clients/${client.id}`}
      className="group relative block border-b border-[var(--space-divider)] py-4 pl-5 pr-1 transition-colors duration-150 hover:bg-[var(--space-bg-card)] focus-visible:bg-[var(--space-bg-card)] focus-visible:outline-none"
    >
      <ToneRule tone={tone} />

      <div className="flex items-baseline gap-4">
        <span className="min-w-0 flex-1 truncate text-[15px] text-[var(--space-text-primary)]">
          {client.name}
        </span>
        <span
          className="shrink-0 text-[15px] font-medium tabular-nums"
          style={{ color: owing ? toneColor('warn') : 'var(--space-text-tertiary)' }}
        >
          {owing ? usd.format(client.balance) : '—'}
        </span>
      </div>

      <div className="mt-1 flex items-baseline gap-4">
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--space-text-tertiary)]">
          {client.detail ?? 'no company on file'}
        </span>
        <span className="shrink-0 text-[13px] tabular-nums text-[var(--space-text-tertiary)]">
          {client.projects > 0
            ? `${client.projects} ${plural(client.projects, 'project')}`
            : 'no projects'}
        </span>
      </div>

      {/* When they last spent money — the one fact that says whether this is a
          live account or an old one. Hidden on a phone, where the row is
          already carrying a name, a balance and a project count. */}
      <span className="mt-1 hidden text-[13px] tabular-nums text-[var(--space-text-tertiary)] sm:block">
        {client.lastOrder > 0
          ? `last ordered ${shortDate.format(new Date(client.lastOrder))}`
          : 'never ordered'}
      </span>
    </Link>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ClientsViewProps {
  clientAccounts: any[]
  username: string
  userRole: string
  serializedProjects?: SerializedProject[]
  allOrders?: any[]
}

export function ClientsView({
  clientAccounts,
  username,
  userRole,
  serializedProjects = [],
  allOrders = [],
}: ClientsViewProps) {
  const [lane, setLane] = useState<Lane>('all')
  const [query, setQuery] = useState('')
  const navRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  useSectionCycle(LANES, lane, setLane, navRef)

  const isStaff = userRole !== 'client'

  // One pass over orders and projects, so a row knows everything it shows
  // without each of them re-scanning the same arrays.
  const clients: ClientRow[] = useMemo(() => {
    const cutoff = (() => {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth() - ACTIVE_CLIENT_MONTHS, now.getDate()).getTime()
    })()

    const orderStats = new Map<string, { count: number; last: number }>()
    for (const o of allOrders) {
      const id = idOf(o.clientAccount)
      if (!id) continue
      const raised = new Date(orderDate(o)).getTime()
      const seen = orderStats.get(id) ?? { count: 0, last: 0 }
      seen.count += 1
      if (!Number.isNaN(raised)) seen.last = Math.max(seen.last, raised)
      orderStats.set(id, seen)
    }

    const projectCounts = new Map<string, number>()
    for (const p of serializedProjects) {
      const id = p.client?.id
      if (id) projectCounts.set(id, (projectCounts.get(id) ?? 0) + 1)
    }

    return clientAccounts.map(account => {
      const stats = orderStats.get(account.id) ?? { count: 0, last: 0 }
      const detail = account.company || account.email || null
      return {
        id: account.id,
        name: account.name,
        detail,
        balance: account.accountBalance ?? 0,
        projects: projectCounts.get(account.id) ?? 0,
        orders: stats.count,
        lastOrder: stats.last,
        active: stats.last > cutoff,
        haystack: [account.name, account.company, account.email]
          .filter(Boolean).join(' ').toLowerCase(),
      }
    })
  }, [clientAccounts, allOrders, serializedProjects])

  const owed = clients.reduce((sum, c) => sum + Math.max(0, c.balance), 0)
  const owingCount = clients.filter(c => c.balance > 0).length
  const activeCount = clients.filter(c => c.active).length
  const projectCount = clients.reduce((sum, c) => sum + c.projects, 0)

  const inLane = (c: ClientRow, l: Lane) =>
    l === 'all' ? true
    : l === 'owing' ? c.balance > 0
    : l === 'active' ? c.active
    : !c.active

  // Owing first and by size, then the rest by who spent most recently — the
  // order staff actually work the list in.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients
      .filter(c => inLane(c, lane))
      .filter(c => !q || c.haystack.includes(q))
      .sort((a, b) =>
        (b.balance > 0 ? 1 : 0) - (a.balance > 0 ? 1 : 0) ||
        b.balance - a.balance ||
        b.lastOrder - a.lastOrder ||
        a.name.localeCompare(b.name),
      )
  }, [clients, lane, query])

  const counts: Partial<Record<Lane, number>> = {
    all: clients.length,
    owing: owingCount,
    active: activeCount,
    dormant: clients.length - activeCount,
  }

  const figures: FigureSpec<Lane>[] = [
    {
      key: 'all',
      value: clients.length,
      format: String,
      label: plural(clients.length, 'Client'),
      note: `${projectCount} ${plural(projectCount, 'project')} between them`,
    },
    {
      key: 'owing',
      value: owed,
      format: n => usd.format(n),
      label: 'Owed',
      note: owed === 0
        ? 'every balance clear'
        : `across ${owingCount} ${plural(owingCount, 'account')}`,
    },
    {
      key: 'active',
      value: activeCount,
      format: String,
      label: 'Active',
      note: `ordered in the last ${ACTIVE_CLIENT_MONTHS} months`,
    },
    {
      key: 'dormant',
      value: clients.length - activeCount,
      format: String,
      label: 'Dormant',
      note: 'no order in that window',
    },
  ]

  return (
    <div className="space-true-scale mx-auto w-full px-4 pb-24 pt-6 sm:px-8 sm:pt-10 lg:px-10" style={{ maxWidth: '1180px' }}>

      {/* ── The title card ───────────────────────────────────────────────── */}
      {/* Scrolls away on its own. Nothing here may animate its own height —
          see the note where `useScrollCollapse` used to live in
          `dashboard/ledger`. */}
      <div>
        <header className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-2 sm:pb-10">
          <h1
            className="font-semibold leading-[0.95] tracking-[-0.03em] text-[var(--space-text-primary)]"
            style={{ fontSize: 'clamp(30px, 5vw, 68px)' }}
          >
            Clients
          </h1>
          {isStaff && <NewClientModal username={username} />}
        </header>

        <section aria-label="Standing">
          <div className="grid grid-cols-2 border-t border-[var(--space-border-hard)] md:grid-cols-4">
            {figures.map(({ key, ...figure }, i) => (
              <Figure
                key={key}
                {...figure}
                active={lane === key}
                onSelect={() => setLane(key)}
                className={figureEdges(i)}
              />
            ))}
          </div>

          {/* The strip's own rule doubles as the split: owing, then clear. */}
          <div
            className="flex h-[3px] w-full overflow-hidden bg-[var(--space-divider)]"
            role="img"
            aria-label={`${owingCount} of ${clients.length} clients owe money`}
          >
            <motion.span
              className="flex h-full w-full origin-left"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                style={{
                  width: `${clients.length ? (owingCount / clients.length) * 100 : 0}%`,
                  background: toneColor('warn'),
                }}
              />
              <span
                style={{
                  width: `${clients.length ? ((clients.length - owingCount) / clients.length) * 100 : 100}%`,
                  background: toneColor('ok'),
                }}
              />
            </motion.span>
          </div>
        </section>
      </div>

      {/* ── The workspace ────────────────────────────────────────────────── */}
      {/* 54px is `mt-12` spelled out: --spacing is 4.5px inside
          .space-true-scale, so the class this replaces was never the 48px its
          name suggests. */}
      <div
        className="flex flex-col gap-6 lg:flex-row lg:gap-12"
        style={{ marginTop: 54 }}
      >
        <SectionNav
          sections={SECTIONS}
          value={lane}
          onChange={setLane}
          counts={counts}
          navRef={navRef}
          layoutId="clients-lane-chip"
          ariaLabel="Client lanes"
          className="lg:order-2"
        />

        {/* Keyed on the lane, not wrapped in `AnimatePresence mode="wait"` —
            the exit gap would empty the column and throw the page to the top.
            `tabVariants` only touches opacity, transform and blur. */}
        <div className="min-w-0 flex-1 lg:order-1">
          <motion.div
            key={lane}
            variants={tabVariants}
            initial={reduce ? false : 'initial'}
            animate="animate"
          >
            <SectionTitle
              title={SECTIONS.find(s => s.id === lane)!.label === 'All'
                ? 'All clients'
                : `${SECTIONS.find(s => s.id === lane)!.label} clients`}
              aside={
                query.trim()
                  ? `${visible.length} of ${counts[lane]} ${visible.length === 1 ? 'match' : 'matches'}`
                  : `${counts[lane]} ${plural(counts[lane] ?? 0, 'account')}`
              }
            />

            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search by name, company or email"
              label="Search clients"
            />

            {visible.length === 0 ? (
              <Empty>
                {query.trim() ? `No client matches “${query.trim()}”.` : LANE_EMPTY[lane]}
              </Empty>
            ) : (
              visible.map(client => (
                <ClientLine key={client.id} client={client} username={username} />
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
