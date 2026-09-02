// ─── Spine adapters ──────────────────────────────────────────────────────────
// Turn portal records into the flat event list <Spine> renders. Each adapter is
// pure and defensive: anything without a usable date is dropped rather than
// defaulted to "now", because a wrong tick on a time axis is worse than a
// missing one.

import type { SpineEvent } from '@/components/dashboard/Spine'
import type { SerializedProject } from '@/lib/serialization'
import { projectStatus, sprintStatus, orderStatus } from './status'
import { orderDate } from './utils'
import { RANGE_CFG, type Range } from './range'

function usable(d: unknown): d is string {
  return typeof d === 'string' && !Number.isNaN(new Date(d).getTime())
}

// ─── Project → its own sprints and milestones ────────────────────────────────

export function projectSpineEvents(
  project: SerializedProject,
  username: string,
): SpineEvent[] {
  const events: SpineEvent[] = []

  if (usable(project.startDate)) {
    events.push({
      id: `p-start-${project.id}`,
      date: project.startDate,
      kind: 'project',
      title: `${project.name} started`,
      tone: 'idle',
    })
  }

  if (usable(project.endDate)) {
    const overdue =
      new Date(project.endDate).getTime() < Date.now() &&
      !['completed', 'cancelled'].includes(project.status)
    events.push({
      id: `p-end-${project.id}`,
      date: project.endDate,
      kind: 'project',
      title: overdue ? `${project.name} overdue` : `${project.name} due`,
      tone: overdue ? 'warn' : projectStatus(project.status).tone,
    })
  }

  for (const sprint of project.sprints) {
    if (!usable(sprint.endDate)) continue
    const meta = sprintStatus(sprint.status).label
    const tasks =
      sprint.totalTasksCount > 0
        ? `${meta} · ${sprint.completedTasksCount}/${sprint.totalTasksCount} tasks`
        : meta
    events.push({
      id: `s-${sprint.id}`,
      date: sprint.endDate,
      kind: 'sprint',
      title: sprint.name,
      meta: tasks,
      tone: sprintStatus(sprint.status).tone,
      href: `/u/${username}/projects/${project.id}/sprints/${sprint.id}`,
    })
  }

  for (const milestone of project.milestones) {
    if (!usable(milestone.date)) continue
    events.push({
      id: `m-${project.id}-${milestone.id}`,
      date: milestone.date,
      kind: 'milestone',
      title: milestone.title,
      meta: milestone.description ?? null,
      tone: milestone.completed ? 'ok' : 'idle',
    })
  }

  return events
}

// ─── Client → work and money on one axis ─────────────────────────────────────
// The point of the client spine is that an invoice and a milestone sit on the
// same scale, so "we shipped, then they paid" is legible at a glance.

export function clientSpineEvents(
  projects: SerializedProject[],
  orders: any[],
  username: string,
): SpineEvent[] {
  const events: SpineEvent[] = []

  for (const project of projects) {
    if (usable(project.startDate)) {
      events.push({
        id: `p-start-${project.id}`,
        date: project.startDate,
        kind: 'project',
        title: project.name,
        meta: `Started · ${projectStatus(project.status).label}`,
        tone: projectStatus(project.status).tone,
        href: `/u/${username}/projects/${project.id}`,
      })
    }

    for (const milestone of project.milestones) {
      if (!usable(milestone.date)) continue
      events.push({
        id: `m-${project.id}-${milestone.id}`,
        date: milestone.date,
        kind: 'milestone',
        title: milestone.title,
        meta: project.name,
        tone: milestone.completed ? 'ok' : 'idle',
        href: `/u/${username}/projects/${project.id}`,
      })
    }
  }

  for (const order of orders) {
    const paidAt = order?.paidAt ?? order?.paymentDate
    const issuedAt = orderDate(order)
    const amount = typeof order?.amount === 'number' ? order.amount : null
    const label = order?.orderNumber ? `Invoice ${order.orderNumber}` : 'Invoice'

    if (order?.status === 'paid' && usable(paidAt)) {
      events.push({
        id: `pay-${order.id}`,
        date: paidAt,
        kind: 'payment',
        title: `${label} paid`,
        tone: 'ok',
        amount,
      })
    } else if (usable(issuedAt)) {
      const meta = orderStatus(order?.status)
      events.push({
        id: `inv-${order.id}`,
        date: issuedAt,
        kind: 'invoice',
        title: label,
        meta: meta.label,
        tone: meta.tone,
        amount,
      })
    }
  }

  return events
}

// ─── Invoices only ───────────────────────────────────────────────────────────
// For the client home page, where the reader wants money and nothing else.

export function invoiceSpineEvents(
  orders: Array<{
    id: string
    orderNumber: string | null
    title?: string | null
    amount: number
    status: string
    createdAt: string
    issuedAt?: string | null
    stripeInvoiceUrl?: string | null
  }>,
): SpineEvent[] {
  return orders.filter((o) => usable(orderDate(o))).map((o) => {
    const status = orderStatus(o.status)
    return {
      id: o.id,
      date: orderDate(o),
      kind: o.status === 'paid' ? 'payment' : 'invoice',
      title: o.orderNumber ? `Invoice ${o.orderNumber}` : 'Invoice',
      meta: [status.label, o.title].filter(Boolean).join(' · '),
      tone: status.tone,
      amount: o.amount,
      href: o.stripeInvoiceUrl ?? null,
    }
  })
}

// ─── Range windowing ─────────────────────────────────────────────────────────
// The home dashboard's Week/Month/Year picker narrows the axis rather than
// rescaling it: same rows, fewer of them.

export function withinRange(events: SpineEvent[], range: Range): SpineEvent[] {
  const { back, forward } = RANGE_CFG[range]
  const day = 86_400_000
  const now = Date.now()
  const from = now - back * day
  const to = now + forward * day
  return events.filter((e) => {
    const t = new Date(e.date).getTime()
    return t >= from && t <= to
  })
}
