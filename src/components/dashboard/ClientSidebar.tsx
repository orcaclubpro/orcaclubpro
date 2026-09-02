'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Input } from '@/components/ui/input'
import { updateClientAccount } from '@/actions/clients'
import { TeamModal } from '@/components/dashboard/ClientTeamModal'
import { toneColor, type StatusTone } from '@/lib/dashboard/status'
import { fadeUp, stagger } from '@/lib/animations'
import { cn } from '@/lib/utils'

// ─── The client panel ────────────────────────────────────────────────────────
// Written to the same rules as the staff ledger (`_views/AdminHomeView`):
//
//   • Every colour is a --space-* token or a status-ramp tone. No raw hex, no
//     Tailwind palette classes — `sonar` (warm paper) is the default theme.
//   • Type is authored in real px inside .space-true-scale, not in rem against
//     the portal's 1.5 root scale.
//   • Hairlines, not cards. A row's status lives in its left rule, so the panel
//     needs no pills, badges or icon chips to say what state something is in.

export interface ClientSidebarProps {
  id: string
  name: string
  firstName: string
  lastName: string
  email?: string | null
  company?: string | null
  accountBalance: number
  totalRevenue: number
  ordersCount: number
  projectsCount: number
  stripeCustomerId?: string | null
  /** Developer (admin/user role) assigned to this account */
  teamMembers: Array<{ id: string; name: string; title?: string | null }>
  /** Client-role users linked to this account */
  clientUsers?: Array<{ id: string; name: string; email: string }>
  username: string
  /** All accessible client accounts for quick switching */
  allClients?: Array<{ id: string; name: string; company?: string | null }>
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
})

// ─── Panel furniture ─────────────────────────────────────────────────────────

function SectionLabel({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 pb-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--space-text-tertiary)]">
        {children}
      </span>
      {aside && <div className="ml-auto text-[12px] text-[var(--space-text-tertiary)]">{aside}</div>}
    </div>
  )
}

/** A quiet text control — the panel's only button shape. */
function QuietButton({
  children, onClick, disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded-md px-2 py-1 text-[12px] text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)] disabled:opacity-50"
    >
      {children}
    </button>
  )
}

/**
 * One of the four standing figures. Dividers sit *between* figures, so which
 * edges get a rule depends on the cell's place in the 2×2 — same rule the
 * ledger's `figureEdges` follows.
 */
function Figure({
  label, value, tone, index,
}: {
  label: string
  value: string
  tone?: StatusTone
  index: number
}) {
  return (
    <div
      className={cn(
        'py-4',
        index % 2 === 0 ? 'pr-4' : 'border-l border-[var(--space-divider)] pl-4',
        index >= 2 && 'border-t border-[var(--space-divider)]',
      )}
    >
      <span
        className="block truncate text-[21px] font-semibold leading-none tracking-[-0.02em] tabular-nums"
        style={{ color: tone ? toneColor(tone) : 'var(--space-text-primary)' }}
      >
        {value}
      </span>
      <span className="mt-2 block text-[12px] text-[var(--space-text-tertiary)]">{label}</span>
    </div>
  )
}

// `md:text-[14px]` is not redundant: shadcn's Input carries a `md:text-base`
// that tailwind-merge cannot drop against a base-size class, and 1rem is 24px
// under the portal's root scale.
const fieldClass =
  'h-[34px] rounded-md border-[var(--space-border-hard)] bg-[var(--space-bg-card)] px-2.5 text-[14px] md:text-[14px] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-tertiary)] shadow-none focus-visible:border-[var(--space-accent)] focus-visible:ring-0'

function Field({
  label, value, onChange, type, placeholder, autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[var(--space-text-tertiary)]">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    </label>
  )
}

// ─── The collapsed rail ──────────────────────────────────────────────────────
// What survives at 54px: who this is, and whether they owe anything.

export function ClientSidebarRail({ name, accountBalance }: { name: string; accountBalance: number }) {
  return (
    <>
      <span className="flex flex-col items-center gap-2">
        <span className="text-[13px] font-semibold tracking-[0.04em] text-[var(--space-text-primary)]">
          {getInitials(name)}
        </span>
        {accountBalance > 0 && (
          <span
            className="size-[5px] rounded-full"
            style={{ background: toneColor('warn') }}
            aria-hidden="true"
          />
        )}
      </span>
      <span className="min-h-0 flex-1 overflow-hidden text-[11px] uppercase tracking-[0.18em] [writing-mode:vertical-rl]">
        {name}
      </span>
    </>
  )
}

// ─── Shared panel content ────────────────────────────────────────────────────

export function ClientSidebarContent(props: ClientSidebarProps) {
  const {
    id, name, firstName, lastName, email, company,
    accountBalance, totalRevenue, ordersCount, projectsCount,
    stripeCustomerId, teamMembers, clientUsers = [], username, allClients,
  } = props

  const router = useRouter()
  const reduce = useReducedMotion()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [form, setForm] = useState({ name, firstName, lastName, company: company ?? '', email: email ?? '' })

  const hasOutstanding = accountBalance > 0
  const people = [
    ...teamMembers.map((m) => ({ id: m.id, name: m.name, role: m.title ?? 'developer', staff: true })),
    ...clientUsers.map((u) => ({ id: u.id, name: u.name, role: 'client', staff: false })),
  ]

  // The pipeline hairline: what has been collected against what is still owed.
  const booked = totalRevenue + accountBalance
  const paidShare = booked > 0 ? (totalRevenue / booked) * 100 : 0

  async function handleSave() {
    setLoading(true)
    setError(null)
    const result = await updateClientAccount({
      id,
      name: form.name,
      firstName: form.firstName,
      lastName: form.lastName,
      company: form.company || undefined,
      email: form.email || undefined,
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
    setForm({ name, firstName, lastName, company: company ?? '', email: email ?? '' })
    setError(null)
    setEditing(false)
  }

  return (
    <motion.div
      variants={reduce ? undefined : stagger}
      initial="initial"
      animate="animate"
      className="flex flex-col"
    >
      {/* ── Back ─────────────────────────────────────────────────────────── */}
      <motion.div variants={reduce ? undefined : fadeUp} className="border-b border-[var(--space-divider)]">
        <Link
          href={`/u/${username}/clients`}
          className="block px-5 py-3 text-[13px] text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]"
        >
          ← All clients
        </Link>
      </motion.div>

      {/* ── Switch client ────────────────────────────────────────────────── */}
      {allClients && allClients.length > 0 && (
        <motion.div variants={reduce ? undefined : fadeUp} className="border-b border-[var(--space-divider)]">
          <button
            type="button"
            onClick={() => setSwitcherOpen((o) => !o)}
            aria-expanded={switcherOpen}
            className="flex w-full items-center gap-2 px-5 py-3 text-left transition-colors duration-150 hover:bg-[var(--space-bg-card)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--space-accent)]"
          >
            <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--space-text-tertiary)]">
              Switch client
            </span>
            <span className="text-[12px] tabular-nums text-[var(--space-text-tertiary)]">{allClients.length}</span>
            <ChevronDown
              className={cn(
                'size-[13px] shrink-0 text-[var(--space-text-tertiary)] transition-transform duration-200',
                switcherOpen && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence initial={false}>
            {switcherOpen && (
              <motion.div
                key="switcher"
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={reduce ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="scrollbar-none max-h-[280px] overflow-y-auto pb-2">
                  {allClients.map((c) => {
                    const isCurrent = c.id === id
                    return (
                      <Link
                        key={c.id}
                        href={`/u/${username}/clients/${c.id}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                          'group relative block py-2.5 pl-5 pr-4 transition-colors duration-150 focus-visible:outline-none',
                          isCurrent
                            ? 'bg-[var(--space-bg-card)]'
                            : 'hover:bg-[var(--space-bg-card)] focus-visible:bg-[var(--space-bg-card)]',
                        )}
                      >
                        {isCurrent && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-0 h-full w-[2px]"
                            style={{ background: 'var(--space-accent)' }}
                          />
                        )}
                        <span
                          className={cn(
                            'block truncate text-[14px]',
                            isCurrent
                              ? 'text-[var(--space-text-primary)]'
                              : 'text-[var(--space-text-secondary)] group-hover:text-[var(--space-text-primary)]',
                          )}
                        >
                          {c.name}
                        </span>
                        {c.company && (
                          <span className="mt-0.5 block truncate text-[12px] text-[var(--space-text-tertiary)]">
                            {c.company}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Identity ─────────────────────────────────────────────────────── */}
      <motion.div variants={reduce ? undefined : fadeUp} className="border-b border-[var(--space-divider)] px-5 py-5">
        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.div
              key="edit"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="First"
                  autoFocus
                  value={form.firstName}
                  onChange={(v) => setForm((f) => ({ ...f, firstName: v, name: `${v} ${f.lastName}`.trim() }))}
                />
                <Field
                  label="Last"
                  value={form.lastName}
                  onChange={(v) => setForm((f) => ({ ...f, lastName: v, name: `${f.firstName} ${v}`.trim() }))}
                />
              </div>
              <Field label="Display name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
              <Field
                label="Email"
                type="email"
                placeholder="client@example.com"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <Field
                label="Company"
                placeholder="Optional"
                value={form.company}
                onChange={(v) => setForm((f) => ({ ...f, company: v }))}
              />
              {error && (
                <p className="text-[12px]" style={{ color: toneColor('danger') }}>{error}</p>
              )}
              <div className="flex items-center gap-1 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex h-[32px] flex-1 items-center justify-center gap-2 rounded-md text-[13px] font-medium transition-opacity duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)] disabled:opacity-50"
                  style={{ background: 'var(--space-text-primary)', color: 'var(--space-bg-base)' }}
                >
                  {loading ? <Loader2 className="size-[13px] animate-spin" /> : 'Save'}
                </button>
                <QuietButton onClick={handleCancel} disabled={loading}>Cancel</QuietButton>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="read"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.14 }}
            >
              <div className="flex items-start gap-3">
                <h2 className="min-w-0 flex-1 text-[20px] font-semibold leading-tight tracking-[-0.01em] text-[var(--space-text-primary)]">
                  {name}
                </h2>
                <QuietButton onClick={() => setEditing(true)}>Edit</QuietButton>
              </div>

              <div className="mt-2 space-y-1">
                {company && <p className="truncate text-[13px] text-[var(--space-text-tertiary)]">{company}</p>}
                {email && <p className="truncate text-[13px] text-[var(--space-text-tertiary)]">{email}</p>}
              </div>

              {/* Billing linkage, stated rather than badged. */}
              <p className="mt-3 flex items-center gap-2 text-[12px] text-[var(--space-text-tertiary)]">
                <span
                  aria-hidden="true"
                  className="size-[5px] shrink-0 rounded-full"
                  style={{ background: toneColor(stripeCustomerId ? 'ok' : 'idle') }}
                />
                {stripeCustomerId ? 'Stripe customer linked' : 'No Stripe customer'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── The standing ─────────────────────────────────────────────────── */}
      <motion.div variants={reduce ? undefined : fadeUp} className="border-b border-[var(--space-divider)] px-5 py-4">
        <div className="grid grid-cols-2">
          <Figure index={0} label="Collected" value={usd.format(totalRevenue)} />
          <Figure
            index={1}
            label="Outstanding"
            value={usd.format(accountBalance)}
            tone={hasOutstanding ? 'warn' : undefined}
          />
          <Figure index={2} label={ordersCount === 1 ? 'Order' : 'Orders'} value={String(ordersCount)} />
          <Figure index={3} label={projectsCount === 1 ? 'Project' : 'Projects'} value={String(projectsCount)} />
        </div>

        {/* The section's own rule doubles as the pipeline: collected vs owed. */}
        {booked > 0 && (
          <div
            className="mt-4 flex h-[2px] w-full overflow-hidden bg-[var(--space-divider)]"
            role="img"
            aria-label={`${Math.round(paidShare)}% of ${usd.format(booked)} booked has been collected`}
          >
            <motion.span
              className="flex h-full w-full origin-left"
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span style={{ width: `${paidShare}%`, background: toneColor('ok') }} />
              <span style={{ width: `${100 - paidShare}%`, background: toneColor('warn') }} />
            </motion.span>
          </div>
        )}
      </motion.div>

      {/* ── Team ─────────────────────────────────────────────────────────── */}
      <motion.div variants={reduce ? undefined : fadeUp} className="px-5 py-4">
        <SectionLabel
          aside={<QuietButton onClick={() => setTeamModalOpen(true)}>Modify</QuietButton>}
        >
          Team {people.length > 0 && <span className="tabular-nums">{people.length}</span>}
        </SectionLabel>

        {people.length === 0 ? (
          <p className="py-2 text-[13px] text-[var(--space-text-tertiary)]">No one is on this account yet.</p>
        ) : (
          <div>
            {people.map((p) => (
              <div
                key={p.id}
                className="flex items-baseline gap-3 border-t border-[var(--space-divider)] py-2.5 first:border-t-0"
              >
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-[14px]',
                    p.staff ? 'text-[var(--space-text-tertiary)]' : 'text-[var(--space-text-primary)]',
                  )}
                >
                  {p.name}
                </span>
                <span className="shrink-0 text-[12px] text-[var(--space-text-tertiary)]">{p.role}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <TeamModal
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        clientAccountId={id}
        clientAccountName={name}
        teamMembers={teamMembers}
        clientUsers={clientUsers}
      />
    </motion.div>
  )
}

// ─── Mobile: edge tab + bottom sheet ─────────────────────────────────────────

export function ClientSidebar(props: ClientSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-true-scale lg:hidden">
      {/* Right-edge tab — the phone's stand-in for the rail. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open client details"
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-2.5 rounded-l-lg border border-r-0 border-[var(--space-border-hard)] bg-[var(--space-bg-base)] py-4 pl-2.5 pr-2 transition-colors duration-150 hover:bg-[var(--space-bg-card)] active:scale-[0.97]"
      >
        <span className="text-[12px] font-semibold text-[var(--space-text-primary)]">
          {getInitials(props.name)}
        </span>
        {props.accountBalance > 0 && (
          <span
            className="size-[5px] rounded-full"
            style={{ background: toneColor('warn') }}
            aria-hidden="true"
          />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--space-text-tertiary)] [writing-mode:vertical-rl]">
          Client
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-[45] bg-[var(--space-bg-base)]/70 backdrop-blur-[2px]"
            />

            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-[55] flex flex-col rounded-t-2xl border-t border-[var(--space-border-hard)] bg-[var(--space-bg-base)]"
              style={{ maxHeight: '82vh' }}
            >
              <div className="flex shrink-0 justify-center pb-1 pt-3">
                <span className="h-1 w-9 rounded-full bg-[var(--space-divider)]" />
              </div>
              <div className="flex shrink-0 items-center gap-3 border-b border-[var(--space-border-hard)] py-3 pl-5 pr-3">
                <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--space-text-tertiary)]">
                  Client
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-md p-1.5 text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)]"
                >
                  <X className="size-[15px]" aria-hidden="true" />
                </button>
              </div>
              <div className="scrollbar-none flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                <ClientSidebarContent {...props} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
