'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowUpRight, FolderKanban, KeyRound, Package, Plus, ReceiptText, ScrollText,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ClientAccount, Project } from '@/types/payload-types'
import {
  Figure, figureEdges, SectionNav, SectionTitle, Empty, ToneRule, Meter,
  useSectionCycle, useScrollCollapse, type FigureSpec, type LedgerSection,
} from '@/components/dashboard/ledger'
import { Spine } from '@/components/dashboard/Spine'
import { ClientCredentialsTab } from '@/components/dashboard/ClientCredentialsTab'
import { ClientOrdersTab } from '@/components/dashboard/ClientOrdersTab'
import { ScheduledPaymentsSection } from '@/components/dashboard/ScheduledPaymentsSection'
import { ClientSettingsCard } from '@/components/dashboard/ClientSettingsCard'
import { ProjectRowActions } from '@/components/dashboard/ProjectRowActions'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'
import { GenerateNdaModal } from '@/components/dashboard/GenerateNdaModal'
import { CreateOrderModal } from '@/components/dashboard/CreateOrderModal'
import { clientSpineEvents } from '@/lib/dashboard/spine-events'
import { projectStatus, toneColor } from '@/lib/dashboard/status'
import type { SerializedProject } from '@/lib/serialization'
import { tabVariants } from '@/lib/animations'

const ClientPackagesTab = dynamic(
  () => import('@/components/dashboard/ClientPackagesTab').then(m => ({ default: m.ClientPackagesTab }))
)

// ─── The client record ───────────────────────────────────────────────────────
// One client's books, opened to the same shape as the studio's own (see
// `_views/AdminHomeView`). Two bands:
//
//   • The standing — four figures always on screen, whichever section is open.
//     Collected, owed, work, proposals. Pressing one opens its workings.
//   • The workspace — a panel of sections, one at a time, so the record stays
//     one screen deep instead of a scroll.
//
// It follows the ledger's two rules, both of which the old five-tab version
// broke — it shipped `#2A2A2A` borders and `amber-400` chips that rendered as
// dark-on-light under `sonar`, the default theme:
//   1. Every colour is a --space-* token or a status-ramp tone. No raw hex, no
//      Tailwind palette classes.
//   2. Type is authored in real px inside .space-true-scale, not in rem against
//      the portal's 1.5 root scale.
//
// Section ids are the public `?tab=` contract — the page redirects legacy query
// URLs onto them and writes them back as sections change. Never rename one.

const TABS = ['overview', 'projects', 'orders', 'packages', 'accounts'] as const
type Tab = typeof TABS[number]

const SECTIONS: LedgerSection<Tab>[] = [
  { id: 'overview', label: 'Overview', icon: ScrollText },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'orders', label: 'Invoices', icon: ReceiptText },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'accounts', label: 'Accounts', icon: KeyRound },
]

const ACTIVE_PROJECT_STATUSES = new Set(['in-progress', 'pending', 'active'])

// ─── Formatting ───────────────────────────────────────────────────────────────

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
})

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`

// ─── A project line ───────────────────────────────────────────────────────────
// Not a link itself: the name opens the project and the trailing control opens
// its settings, so both anchors stay valid. Milestone progress rides the
// hairline under the row rather than a badge.

function ProjectLine({ project, username }: { project: Project; username: string }) {
  const meta = projectStatus(project.status)
  const milestones = project.milestones ?? []
  const done = milestones.filter((m) => m.completed).length
  const pct = milestones.length > 0 ? (done / milestones.length) * 100 : undefined

  return (
    <div className="group relative border-b border-[var(--space-divider)] py-4 pl-5 pr-1 transition-colors duration-150 hover:bg-[var(--space-bg-card)] focus-within:bg-[var(--space-bg-card)]">
      <ToneRule tone={meta.tone} />

      <div className="flex items-baseline gap-4">
        <Link
          href={`/u/${username}/projects/${project.id}`}
          className="min-w-0 flex-1 truncate text-[15px] text-[var(--space-text-primary)] underline decoration-transparent underline-offset-4 transition-colors hover:decoration-[var(--space-accent)] focus-visible:decoration-[var(--space-accent)] focus-visible:outline-none"
        >
          {project.name}
        </Link>

        <span className="shrink-0 text-[15px] font-medium tabular-nums text-[var(--space-text-primary)]">
          {project.budgetAmount ? usd.format(project.budgetAmount) : ''}
        </span>

        <span className="shrink-0 self-center">
          <ProjectRowActions project={project} username={username} />
        </span>
      </div>

      <div className="mt-1 flex items-baseline gap-4">
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--space-text-tertiary)]">
          {project.description || meta.label}
        </span>
        <span className="shrink-0 text-[13px] tabular-nums" style={{ color: toneColor(meta.tone) }}>
          {milestones.length > 0
            ? `${done}/${milestones.length} ${plural(milestones.length, 'milestone')}`
            : meta.label}
        </span>
      </div>

      {/* The end date is the first thing to go on a phone — the status is
          already carried by the left rule. */}
      {project.projectedEndDate && (
        <span className="mt-1 hidden text-[13px] tabular-nums text-[var(--space-text-tertiary)] sm:block">
          due {shortDate.format(new Date(project.projectedEndDate))}
        </span>
      )}

      {pct !== undefined && <Meter pct={pct} tone={meta.tone} />}
    </div>
  )
}

// ─── The outstanding notice ───────────────────────────────────────────────────

function OutstandingNotice({
  amount, pendingCount, onOpen,
}: {
  amount: number
  pendingCount: number
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full border-y border-[var(--space-divider)] py-4 pl-5 pr-4 text-left transition-colors duration-150 hover:bg-[var(--space-bg-card)] focus-visible:bg-[var(--space-bg-card)] focus-visible:outline-none"
    >
      <ToneRule tone="warn" />
      <div className="flex items-baseline gap-4">
        <span className="min-w-0 flex-1 truncate text-[15px] text-[var(--space-text-primary)]">
          {usd.format(amount)} outstanding
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[13px] text-[var(--space-text-tertiary)] transition-colors group-hover:text-[var(--space-text-primary)]">
          Invoices
          <ArrowUpRight className="size-[13px]" aria-hidden="true" />
        </span>
      </div>
      <span className="mt-1 block text-[13px] tabular-nums" style={{ color: toneColor('warn') }}>
        {pendingCount} pending {plural(pendingCount, 'invoice')}
      </span>
    </button>
  )
}

/**
 * Where this client's NDA stands.
 *
 * It reads next to the Generate NDA control because that is the moment the
 * answer matters: before credentials are accepted, "sent" and "signed" are not
 * the same fact. No NDA on file says so plainly rather than staying silent —
 * an absent agreement is the case worth seeing.
 */
function NdaStanding({
  nda,
}: {
  nda?: { status: 'draft' | 'sent' | 'executed'; sentAt: string | null; executedDate: string | null } | null
}) {
  if (!nda) {
    return <span style={{ color: toneColor('warn') }}>no NDA on file</span>
  }
  if (nda.status === 'executed') {
    return (
      <span style={{ color: toneColor('ok') }}>
        NDA signed
        {nda.executedDate ? ` ${shortDate.format(new Date(nda.executedDate))}` : ''}
      </span>
    )
  }
  if (nda.status === 'sent') {
    return (
      <span style={{ color: toneColor('warn') }}>
        NDA sent{nda.sentAt ? ` ${shortDate.format(new Date(nda.sentAt))}` : ''}, unsigned
      </span>
    )
  }
  return <span style={{ color: toneColor('warn') }}>NDA drafted, not sent</span>
}

/** The ledger's quiet control shape — the only button style outside the nav. */
function QuietAction({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Inline size: `.space-true-scale :is(button)` is unlayered CSS and so
      // outranks any Tailwind text-* utility on a button inside the subtree.
      style={{ fontSize: 13 }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--space-border-hard)] px-3 py-1.5 text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]"
    >
      {children}
    </button>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientDetailTabViewProps {
  initialTab: Tab
  username: string
  clientId: string
  clientAccount: ClientAccount
  orders: any[]
  projects: Project[]
  clientUsers: Array<{ id: string; name: string; email: string }>
  /** The standing NDA on this client, newest first. Null when none exists. */
  nda?: {
    status: 'draft' | 'sent' | 'executed'
    sentAt: string | null
    executedDate: string | null
  } | null
  packages: any[]
  /** Per-package work-log counts, keyed by package id — surfaced on scheduled-payment rows. */
  workCounts?: Record<string, { pending: number; plannedOpen: number }>
  credentials: any[]
  packageOrderMap: Record<string, any[]>
  serializedProjects: SerializedProject[]
  pendingOrders: any[]
  paidOrders: any[]
  totalRevenue: number
  teamMembers: Array<{ id: string; name: string; title: string | null }>
  userRole: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientDetailTabView({
  initialTab,
  username,
  clientId,
  clientAccount,
  orders,
  projects,
  clientUsers,
  nda,
  packages,
  workCounts,
  credentials,
  packageOrderMap,
  serializedProjects,
  pendingOrders,
  paidOrders,
  totalRevenue,
  teamMembers,
  userRole,
}: ClientDetailTabViewProps) {
  const [section, setSection] = useState<Tab>(initialTab)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const standingRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  const standingCollapsed = useScrollCollapse(standingRef)

  // Sections are real state, not routes — but the `?tab=` URL stays truthful so
  // a link into a section still lands there. The URL *follows* the open section
  // rather than driving it, and it follows on a delay: holding Tab down cycles
  // faster than browsers allow history writes (Safari throttles replaceState to
  // ~100 calls per 30s), so the write waits for the cycling to settle.
  // replaceState, not push — cycling sections must not bury the back button
  // under a history entry per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = section === 'overview'
        ? `/u/${username}/clients/${clientId}`
        : `/u/${username}/clients/${clientId}?tab=${section}`
      if (window.location.pathname + window.location.search !== url) {
        window.history.replaceState(null, '', url)
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [section, username, clientId])

  useSectionCycle(TABS, section, setSection, navRef)

  const balance = clientAccount.accountBalance ?? 0

  // The strip's own rule doubles as the pipeline: collected, owed, written off.
  const shares = useMemo(() => {
    let paid = 0, pending = 0, cancelled = 0
    for (const o of orders) {
      const amount = o.amount || 0
      if (o.status === 'paid') paid += amount
      else if (o.status === 'pending') pending += amount
      else if (o.status === 'cancelled') cancelled += amount
    }
    const total = paid + pending + cancelled || 1
    return {
      paid: (paid / total) * 100,
      pending: (pending / total) * 100,
      cancelled: (cancelled / total) * 100,
    }
  }, [orders])

  const activeProjects = useMemo(
    () => projects.filter((p) => ACTIVE_PROJECT_STATUSES.has(p.status ?? '')),
    [projects],
  )

  const spineEvents = useMemo(
    () => clientSpineEvents(serializedProjects, orders, username),
    [serializedProjects, orders, username],
  )

  // Both money figures open the invoices section, and both light up when it is
  // open — the shared highlight is the point: these two numbers are the same
  // ledger read from either end.
  const figures: FigureSpec<Tab>[] = [
    {
      key: 'orders',
      value: totalRevenue,
      format: (n) => usd.format(n),
      label: 'Collected',
      note: `${paidOrders.length} paid ${plural(paidOrders.length, 'invoice')}`,
    },
    {
      key: 'orders',
      value: balance,
      format: (n) => usd.format(n),
      label: 'Outstanding',
      note: balance === 0
        ? 'nothing owed'
        : `${pendingOrders.length} pending ${plural(pendingOrders.length, 'invoice')}`,
    },
    {
      key: 'projects',
      value: projects.length,
      format: String,
      label: plural(projects.length, 'Project'),
      note: `${activeProjects.length} active`,
    },
    {
      key: 'packages',
      value: packages.length,
      format: String,
      label: plural(packages.length, 'Proposal'),
      note: packages.length === 0 ? 'none assigned' : 'all time',
    },
  ]

  const counts: Partial<Record<Tab, number>> = {
    projects: projects.length,
    orders: orders.length,
    packages: packages.length,
    accounts: credentials.length,
  }

  return (
    <div className="space-true-scale mx-auto w-full px-6 pb-24 pt-10 sm:px-10" style={{ maxWidth: '1180px' }}>

      {/* ── The title card ───────────────────────────────────────────────── */}
      {/* Masthead and figures together: the page's opening statement, shut away
          on the way down so a section gets the full screen, and opened again at
          the top. Nothing is lost while it is shut — the portal's fixed header
          carries the client's name the whole time (`SetHeaderTitle` in the
          route layout), and the section nav is sticky from `lg` up.

          The measured child is inside the animating wrapper, so it keeps its
          natural height for `useScrollCollapse` to read while the wrapper's own
          height is mid-flight. `inert` keeps the shut band's figures out of the
          tab order and the accessibility tree. */}
      <motion.div
        initial={false}
        animate={{ height: standingCollapsed ? 0 : 'auto', opacity: standingCollapsed ? 0 : 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        inert={standingCollapsed}
        className="overflow-hidden"
      >
        <div ref={standingRef}>

          {/* ── Masthead ─────────────────────────────────────────────────────── */}
          <header className="pb-10 pt-2">
            <h1
              className="font-semibold leading-[0.95] tracking-[-0.03em] text-[var(--space-text-primary)]"
              style={{ fontSize: 'clamp(30px, 5vw, 68px)' }}
            >
              {clientAccount.name}
            </h1>
            <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px] text-[var(--space-text-tertiary)]">
              {clientAccount.company && <span>{clientAccount.company}</span>}
              {clientAccount.company && clientAccount.email && <span aria-hidden="true">·</span>}
              {clientAccount.email && <span className="truncate">{clientAccount.email}</span>}
              {clientAccount.stripeCustomerId && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={`https://dashboard.stripe.com/customers/${clientAccount.stripeCustomerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-[var(--space-accent)] focus-visible:text-[var(--space-accent)] focus-visible:outline-none"
                  >
                    Stripe
                    <ArrowUpRight className="size-[13px]" aria-hidden="true" />
                  </a>
                </>
              )}
            </p>
          </header>

          {/* ── The standing ─────────────────────────────────────────────────── */}
          <section aria-label="Standing">
            <div className="grid grid-cols-2 border-t border-[var(--space-border-hard)] md:grid-cols-4">
              {figures.map(({ key, ...figure }, i) => (
                <Figure
                  key={figure.label}
                  {...figure}
                  active={section === key}
                  onSelect={() => setSection(key)}
                  className={figureEdges(i)}
                />
              ))}
            </div>

            <div
              className="flex h-[3px] w-full overflow-hidden bg-[var(--space-divider)]"
              role="img"
              aria-label={`Invoiced to date: ${Math.round(shares.paid)}% collected, ${Math.round(shares.pending)}% outstanding, ${Math.round(shares.cancelled)}% cancelled`}
            >
              <motion.span
                className="flex h-full w-full origin-left"
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                <span style={{ width: `${shares.paid}%`, background: toneColor('ok') }} />
                <span style={{ width: `${shares.pending}%`, background: toneColor('warn') }} />
                <span style={{ width: `${shares.cancelled}%`, background: toneColor('danger'), opacity: 0.5 }} />
              </motion.span>
            </div>

            <p className="pt-3 text-right text-[13px] tabular-nums text-[var(--space-text-tertiary)]">
              {orders.length} {plural(orders.length, 'invoice')} on record
            </p>
          </section>

        </div>
      </motion.div>

      {/* ── The workspace ────────────────────────────────────────────────── */}
      {/* The top margin closes with the band, so the workspace rises to meet
          the header instead of leaving a gap where the figures were. 54px is
          `mt-12` spelled out: --spacing is 4.5px inside .space-true-scale, so
          the class this replaced was never the 48px its name suggests. */}
      <motion.div
        initial={false}
        animate={{ marginTop: standingCollapsed ? 0 : 54 }}
        transition={reduce ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-8 lg:flex-row lg:gap-12"
      >
        {/* Nav is first in the DOM so phones meet it before the content, and
            ordered last on desktop so it sits down the right-hand side. */}
        <div className="lg:order-2">
          <SectionNav
            sections={SECTIONS}
            value={section}
            onChange={setSection}
            counts={counts}
            navRef={navRef}
            layoutId="client-section-chip"
            ariaLabel="Client sections"
          />
        </div>

        <div className="min-w-0 flex-1 lg:order-1">
          <AnimatePresence mode="wait">

            {/* ─── Overview ───────────────────────────────────────────── */}
            {section === 'overview' && (
              <motion.section
                key="overview"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-12"
              >
                {balance > 0 && (
                  <OutstandingNotice
                    amount={balance}
                    pendingCount={pendingOrders.length}
                    onOpen={() => setSection('orders')}
                  />
                )}

                <div>
                  <SectionTitle title="Timeline" aside="newest first" />
                  <div className="pt-2">
                    <Spine
                      events={spineEvents}
                      emptyMessage="No projects or invoices for this client yet."
                    />
                  </div>
                </div>

                <div>
                  <SectionTitle
                    title="Account details"
                    aside={
                      <span className="flex items-center justify-end gap-4">
                        <NdaStanding nda={nda} />
                        <span>
                          {teamMembers.length > 0
                            ? `${teamMembers.length} assigned`
                            : 'nobody assigned'}
                        </span>
                        {userRole !== 'client' && (
                          <GenerateNdaModal
                            clientId={clientId}
                            clientName={clientAccount.name}
                            clientCompany={clientAccount.company}
                            clientEmail={clientAccount.email}
                            clientAddress={(clientAccount as any).address ?? null}
                            recipients={clientUsers}
                          />
                        )}
                      </span>
                    }
                  />
                  <div className="pt-5">
                    <ClientSettingsCard
                      id={clientId}
                      name={clientAccount.name}
                      firstName={clientAccount.firstName ?? ''}
                      lastName={clientAccount.lastName ?? ''}
                      email={clientAccount.email}
                      company={clientAccount.company}
                      phone={(clientAccount as any).phone ?? null}
                      address={(clientAccount as any).address ?? null}
                      stripeCustomerId={clientAccount.stripeCustomerId}
                      teamMembers={teamMembers}
                      clientUsers={clientUsers}
                    />
                  </div>
                </div>
              </motion.section>
            )}

            {/* ─── Projects ───────────────────────────────────────────── */}
            {section === 'projects' && (
              <motion.section key="projects" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <SectionTitle
                  title="Projects"
                  aside={
                    <span className="flex items-center justify-end gap-4">
                      {projects.length > 0 && (
                        <span className="tabular-nums">{activeProjects.length} active</span>
                      )}
                      <CreateProjectModal
                        clientId={clientId}
                        clientName={clientAccount.name}
                        variant="quiet"
                      />
                    </span>
                  }
                />
                {projects.length > 0 ? (
                  <div className="pt-1">
                    {projects.map((project) => (
                      <ProjectLine key={project.id} project={project} username={username} />
                    ))}
                  </div>
                ) : (
                  <Empty>
                    No projects yet. Create one to start tracking work for {clientAccount.name}.
                  </Empty>
                )}
              </motion.section>
            )}

            {/* ─── Invoices ───────────────────────────────────────────── */}
            {section === 'orders' && (
              <motion.section
                key="orders"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-8"
              >
                <SectionTitle
                  title="Invoices"
                  aside={
                    <span className="flex items-center justify-end gap-4">
                      {orders.length > 0 && (
                        <span className="tabular-nums" style={{ color: toneColor('ok') }}>
                          {usd.format(totalRevenue)} collected
                        </span>
                      )}
                      {balance > 0 && (
                        <span className="tabular-nums" style={{ color: toneColor('warn') }}>
                          {usd.format(balance)} due
                        </span>
                      )}
                      {userRole !== 'client' && (
                        <QuietAction onClick={() => setCreatingOrder(true)}>
                          <Plus className="size-[13px]" aria-hidden="true" />
                          New invoice
                        </QuietAction>
                      )}
                    </span>
                  }
                />

                {creatingOrder && userRole !== 'client' && (
                  <CreateOrderModal
                    clientId={clientId}
                    clientName={clientAccount.name}
                    onClose={() => setCreatingOrder(false)}
                  />
                )}

                <ScheduledPaymentsSection
                  packages={packages as any}
                  username={username}
                  workCounts={workCounts}
                />

                <ClientOrdersTab
                  orders={orders as any}
                  role={userRole as 'admin' | 'user' | 'client'}
                />
              </motion.section>
            )}

            {/* ─── Packages ───────────────────────────────────────────── */}
            {/* ClientPackagesTab and ClientCredentialsTab carry their own
                headings, so neither gets a SectionTitle above it. */}
            {section === 'packages' && (
              <motion.section key="packages" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <ClientPackagesTab
                  packages={packages as any}
                  clientId={clientId}
                  username={username}
                  packageOrders={packageOrderMap}
                />
              </motion.section>
            )}

            {/* ─── Accounts ───────────────────────────────────────────── */}
            {section === 'accounts' && (
              <motion.section key="accounts" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <ClientCredentialsTab credentials={credentials as any[]} />
              </motion.section>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
