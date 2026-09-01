'use client'

import { useMemo, useState } from 'react'
import { Settings, Users } from 'lucide-react'
import {
  DetailShell,
  Eyebrow,
  FactDot,
  ListDetail,
  PrimaryAction,
  Section,
  StatusChip,
  type ListDetailItem,
} from '@/components/dashboard/list-detail/ListDetail'
import { Spine } from '@/components/dashboard/Spine'
import { clientSpineEvents } from '@/lib/dashboard/spine-events'
import { NewClientModal } from '@/components/dashboard/NewClientModal'
import { ClientEditModal } from '@/components/dashboard/ClientEditModal'
import { ViewAsClientButton } from '@/components/dashboard/ViewAsClientButton'
import type { SerializedProject } from '@/lib/serialization'

interface ClientsViewProps {
  clientAccounts: any[]
  username: string
  userRole: string
  serializedProjects?: SerializedProject[]
  allOrders?: any[]
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

interface ClientItem extends ListDetailItem {
  account: any
}

export function ClientsView({
  clientAccounts,
  username,
  userRole,
  serializedProjects = [],
  allOrders = [],
}: ClientsViewProps) {
  const isStaff = userRole !== 'client'

  const items: ClientItem[] = useMemo(
    () =>
      clientAccounts.map((account) => {
        const balance = account.accountBalance ?? 0
        const owing = balance > 0
        return {
          id: account.id,
          title: account.name,
          subtitle: account.company || account.email || null,
          tone: owing ? 'warn' : 'ok',
          trailing: owing ? money.format(balance) : null,
          trailingTone: 'warn',
          searchText: [account.company, account.email].filter(Boolean).join(' '),
          account,
        }
      }),
    [clientAccounts],
  )

  const owingCount = items.filter((i) => i.trailing).length

  return (
    <ListDetail<ClientItem>
      items={items}
      paramKey="c"
      title="Clients"
      searchPlaceholder="Search clients"
      summary={
        owingCount > 0
          ? `${owingCount} with an outstanding balance`
          : 'All balances clear'
      }
      action={userRole === 'admin' ? <NewClientModal username={username} /> : undefined}
      empty={<EmptyState canCreate={userRole === 'admin'} username={username} />}
      renderDetail={(item) => (
        <ClientDetail
          account={item.account}
          username={username}
          isStaff={isStaff}
          projects={serializedProjects.filter((p) => p.client?.id === item.id)}
          orders={allOrders.filter((o) => {
            const id = typeof o.clientAccount === 'object' ? o.clientAccount?.id : o.clientAccount
            return id === item.id
          })}
        />
      )}
    />
  )
}

// ─── Detail pane ─────────────────────────────────────────────────────────────

function ClientDetail({
  account,
  username,
  isStaff,
  projects,
  orders,
}: {
  account: any
  username: string
  isStaff: boolean
  projects: SerializedProject[]
  orders: any[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const balance = account.accountBalance ?? 0
  const owing = balance > 0

  const events = useMemo(
    () => clientSpineEvents(projects, orders, username),
    [projects, orders, username],
  )

  const teamMembers = Array.isArray(account.assignedTo)
    ? (account.assignedTo as any[])
        .filter((u) => typeof u !== 'string' && u?.id)
        .map((u) => ({
          id: u.id,
          name: u.name || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || '',
          title: u.title ?? null,
        }))
    : []

  const activeProjects = projects.filter(
    (p) => !['completed', 'cancelled'].includes(p.status),
  ).length

  return (
    <>
      {isStaff && (
        <ClientEditModal
          client={account}
          open={editOpen}
          onOpenChange={setEditOpen}
          onDeleted={() => setEditOpen(false)}
          teamMembers={teamMembers}
        />
      )}

      <DetailShell
        eyebrow={account.company ? <Eyebrow>{account.company}</Eyebrow> : undefined}
        name={account.name}
        facts={
          <>
            <StatusChip
              tone={owing ? 'warn' : 'ok'}
              label={owing ? `${money.format(balance)} outstanding` : 'Balance clear'}
            />
            <FactDot />
            <span>
              {activeProjects} active {activeProjects === 1 ? 'project' : 'projects'}
            </span>
            <FactDot />
            <span>{account.totalOrders ?? orders.length} orders</span>
            {account.email && (
              <>
                <FactDot />
                <a
                  href={`mailto:${account.email}`}
                  className="text-[var(--space-text-secondary)] underline decoration-[var(--space-border-hard)] underline-offset-2 transition-colors hover:text-[var(--space-text-primary)]"
                >
                  {account.email}
                </a>
              </>
            )}
          </>
        }
        actions={
          <>
            {isStaff && (
              <>
                <ViewAsClientButton accountId={account.id} />
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--space-border-hard)] px-3 py-2 text-[0.8125rem] font-medium text-[var(--space-text-secondary)] transition-colors hover:text-[var(--space-text-primary)]"
                >
                  <Settings className="size-3.5" />
                  Edit
                </button>
              </>
            )}
            <PrimaryAction href={`/u/${username}/clients/${account.id}`}>
              Open profile
            </PrimaryAction>
          </>
        }
      >
        <Section
          heading="Timeline"
          aside={
            <span className="text-[0.75rem] text-[var(--space-text-muted)]">
              Work and invoices, newest first
            </span>
          }
        >
          <Spine
            events={events}
            emptyMessage="No projects or invoices for this client yet."
          />
        </Section>
      </DetailShell>
    </>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ canCreate, username }: { canCreate: boolean; username: string }) {
  return (
    <div className="mx-auto max-w-sm text-center">
      <Users className="mx-auto mb-4 size-8 text-[var(--space-text-muted)]" />
      <p className="mb-1 text-[0.9375rem] font-semibold text-[var(--space-text-primary)]">
        No clients yet
      </p>
      <p className="mb-6 text-[0.8125rem] text-[var(--space-text-secondary)]">
        Add a client account to start tracking their projects and invoices.
      </p>
      {canCreate && (
        <div className="[&>button]:mx-auto">
          <NewClientModal username={username} />
        </div>
      )}
    </div>
  )
}
