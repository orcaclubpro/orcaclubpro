'use server'

/**
 * Per-client status digest for bots and staff (MCP tool `client_status`, plan
 * step 3 / feature #8): open, blocked and waiting-on-Chance tasks, open projects
 * with progress and next milestone, retainer hours, and draft documents.
 *
 * Read-only. Every Payload call passes the caller with `overrideAccess: false`,
 * so a staff user sees only what collection access already shows them. The
 * retainer half reuses `getRetainerPortfolio` and keeps hours, cap, cycle and
 * health only; no prices or amounts leave this action.
 */
import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'

import { getCurrentUser } from '@/actions/auth'
import { getRetainerPortfolio } from '@/actions/retainers'
import { computeProgress } from '@/lib/tasks/progress'
import {
  buildClientDigest,
  buildRecentWork,
  CLOSED_PROJECT_STATUSES,
  CLOSED_TASK_STATUSES,
  type ClientDigest,
  type DigestCounts,
  type RawDraft,
  type RawProject,
  type RawRetainer,
  type RecentWorkRow,
} from '@/lib/tasks/clientDigest'

type Fail = { success: false; error: string }
const fail = (error: string): Fail => ({ success: false, error })

const idOf = (v: unknown): string | null =>
  v == null ? null : typeof v === 'object' ? (((v as { id?: unknown }).id as string | undefined) ?? null) : String(v)

const OBJECT_ID = /^[0-9a-f]{24}$/i

export type ClientStatusResult = {
  success: true
  generatedAt: string
  clients: ClientDigest[]
  totals: DigestCounts & { clients: number }
  omittedEmptyClients: number
  /** The most recently updated tasks (any status) across the clients in scope, newest first. */
  recentWork: RecentWorkRow[]
  /** Set when the retainer portfolio could not be loaded; the rest of the digest is still valid. */
  retainerError: string | null
}

export async function getClientStatus(input: {
  clientAccountId?: string
  includeDrafts?: boolean
  includeRetainer?: boolean
  includeEmpty?: boolean
  taskLimit?: number
  recentLimit?: number
}): Promise<ClientStatusResult | Fail> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'user')) return fail('Unauthorized')
    const payload = await getPayload({ config })
    const oneClient = input.clientAccountId?.trim() || null
    if (oneClient && !OBJECT_ID.test(oneClient)) return fail(`clientAccountId ${oneClient} is not a valid id`)

    // ── Clients ──────────────────────────────────────────────────────────────
    let clients: Array<{ id: string; name: string | null; company: string | null }>
    if (oneClient) {
      const acct = (await payload.findByID({
        collection: 'client-accounts',
        id: oneClient,
        depth: 0,
        select: { name: true, company: true },
        user,
        overrideAccess: false,
        disableErrors: true,
      })) as Record<string, any> | null
      if (!acct) return fail(`Client account ${oneClient} not found (it does not exist or you cannot access it)`)
      clients = [{ id: String(acct.id), name: acct.name ?? null, company: acct.company ?? null }]
    } else {
      const res = await payload.find({
        collection: 'client-accounts',
        limit: 1000,
        depth: 0,
        sort: 'name',
        select: { name: true, company: true },
        user,
        overrideAccess: false,
      })
      clients = (res.docs as Record<string, any>[]).map((a) => ({
        id: String(a.id),
        name: a.name ?? null,
        company: a.company ?? null,
      }))
    }

    // ── Open tasks ───────────────────────────────────────────────────────────
    // "Open" = anything but completed/cancelled, so new statuses are picked up as they land.
    const taskWhere: Where[] = [{ status: { not_in: [...CLOSED_TASK_STATUSES] } }]
    if (oneClient) taskWhere.push({ 'project.client': { equals: oneClient } })
    const openTaskDocs = (
      await payload.find({
        collection: 'tasks',
        where: { and: taskWhere },
        sort: 'createdAt',
        limit: 2000,
        depth: 0,
        select: {
          title: true,
          status: true,
          priority: true,
          ownerBot: true,
          ccqTaskId: true,
          project: true,
          dueDate: true,
          qa: true,
          botContext: true,
          createdAt: true,
          updatedAt: true,
        },
        user,
        overrideAccess: false,
      })
    ).docs as Record<string, any>[]

    // ── Projects: every open one, plus any closed one that still has open tasks ─
    const taskProjectIds = [...new Set(openTaskDocs.map((t) => idOf(t.project)).filter(Boolean) as string[])]
    const projectOr: Where[] = [{ status: { not_in: [...CLOSED_PROJECT_STATUSES] } }]
    if (taskProjectIds.length) projectOr.push({ id: { in: taskProjectIds } })
    const projectWhere: Where = oneClient
      ? { and: [{ client: { equals: oneClient } }, { or: projectOr }] }
      : { or: projectOr }
    const projectDocs = (
      await payload.find({
        collection: 'projects',
        where: projectWhere,
        limit: 1000,
        depth: 0,
        select: { name: true, status: true, client: true, milestones: true },
        user,
        overrideAccess: false,
      })
    ).docs as Record<string, any>[]

    // Progress needs every task on those projects, closed ones included.
    const projectIds = projectDocs.map((p) => String(p.id))
    const allProjectTasks = projectIds.length
      ? ((
          await payload.find({
            collection: 'tasks',
            where: { project: { in: projectIds } },
            limit: 5000,
            depth: 0,
            select: { project: true, status: true },
            user,
            overrideAccess: false,
          })
        ).docs as Record<string, any>[])
      : []
    const statusesBy = new Map<string, Array<{ status?: string | null }>>()
    for (const t of allProjectTasks) {
      const pid = idOf(t.project)
      if (!pid) continue
      const list = statusesBy.get(pid) ?? []
      list.push({ status: t.status })
      statusesBy.set(pid, list)
    }
    const projects: RawProject[] = projectDocs.map((p) => {
      const milestones = (Array.isArray(p.milestones) ? p.milestones : []).map((m: Record<string, any>) => ({
        id: m.id ?? null,
        title: m.title ?? null,
        date: m.date ?? null,
        completed: Boolean(m.completed),
      }))
      const progress = computeProgress({ tasks: statusesBy.get(String(p.id)) ?? [], milestones })
      return {
        id: String(p.id),
        name: p.name ?? null,
        status: p.status ?? null,
        clientAccountId: idOf(p.client),
        percent: progress.percent,
        tasksDone: progress.tasks.done,
        tasksTotal: progress.tasks.total,
        milestonesDone: progress.milestones.done,
        milestonesTotal: progress.milestones.total,
        milestones,
      }
    })

    // ── Retainers (hours only) ───────────────────────────────────────────────
    let retainers: RawRetainer[] = []
    let retainerError: string | null = null
    if (input.includeRetainer !== false) {
      const portfolio = await getRetainerPortfolio()
      if (portfolio.success) {
        const wanted = new Set(clients.map((c) => c.id))
        retainers = portfolio.rows
          .filter((r) => wanted.has(String(r.clientAccountId)))
          .map((r) => ({
            clientAccountId: String(r.clientAccountId),
            tier: r.tier ?? null,
            used: r.used,
            cap: r.cap,
            cycleLabel: r.cycleLabel,
            health: r.health,
          }))
      } else {
        retainerError = portfolio.error ?? 'Retainer portfolio unavailable'
      }
    }

    // ── Draft documents ──────────────────────────────────────────────────────
    let drafts: RawDraft[] = []
    if (input.includeDrafts !== false) {
      const draftWhere: Where[] = [{ documentStatus: { equals: 'draft' } }, { documentTemplate: { exists: true } }]
      if (oneClient) draftWhere.push({ clientAccount: { equals: oneClient } })
      drafts = (
        (
          await payload.find({
            collection: 'files',
            where: { and: draftWhere },
            sort: 'createdAt',
            limit: 500,
            depth: 0,
            select: { name: true, documentTemplate: true, clientAccount: true, project: true, createdAt: true },
            user,
            overrideAccess: false,
          })
        ).docs as Record<string, any>[]
      ).map((f) => ({
        id: String(f.id),
        name: f.name ?? null,
        documentTemplate: f.documentTemplate ?? null,
        clientAccountId: idOf(f.clientAccount),
        projectId: idOf(f.project),
        createdAt: f.createdAt ?? null,
      }))
    }

    // ── Recent work: newest-updated tasks, any status ────────────────────────
    // botContext needs a staff `user` on the request (stripBotContext); this caller is staff.
    const recentLimit = Math.min(100, Math.max(0, input.recentLimit ?? 20))
    let recentWork: RecentWorkRow[] = []
    if (recentLimit > 0) {
      const recentDocs = (
        await payload.find({
          collection: 'tasks',
          where: oneClient ? { 'project.client': { equals: oneClient } } : {},
          sort: '-updatedAt',
          limit: recentLimit,
          depth: 0,
          select: {
            title: true,
            status: true,
            ownerBot: true,
            ccqTaskId: true,
            project: true,
            qa: true,
            botContext: true,
            completedAt: true,
            updatedAt: true,
          },
          user,
          overrideAccess: false,
        })
      ).docs as Record<string, any>[]
      const recentProjectIds = [...new Set(recentDocs.map((t) => idOf(t.project)).filter(Boolean) as string[])]
      const recentProjects = recentProjectIds.length
        ? ((
            await payload.find({
              collection: 'projects',
              where: { id: { in: recentProjectIds } },
              limit: recentProjectIds.length,
              depth: 0,
              select: { name: true, client: true, botContext: true },
              user,
              overrideAccess: false,
            })
          ).docs as Record<string, any>[])
        : []
      recentWork = buildRecentWork({
        tasks: recentDocs.map((t) => ({
          id: String(t.id),
          title: t.title ?? null,
          status: t.status ?? null,
          ownerBot: t.ownerBot ?? null,
          ccqTaskId: t.ccqTaskId ?? null,
          projectId: idOf(t.project),
          qa: t.qa ?? null,
          botContext: t.botContext && typeof t.botContext === 'object' ? t.botContext : null,
          completedAt: t.completedAt ?? null,
          updatedAt: t.updatedAt ?? null,
        })),
        projects: recentProjects.map((p) => ({
          id: String(p.id),
          name: p.name ?? null,
          clientAccountId: idOf(p.client),
          liveUrl: p.botContext && typeof p.botContext === 'object' ? (p.botContext.liveUrl ?? null) : null,
        })),
        clients,
        limit: recentLimit,
      })
    }

    const generatedAt = new Date().toISOString()
    const digest = buildClientDigest({
      clients,
      tasks: openTaskDocs.map((t) => ({
        id: String(t.id),
        title: t.title ?? null,
        status: t.status ?? null,
        priority: t.priority ?? null,
        ownerBot: t.ownerBot ?? null,
        ccqTaskId: t.ccqTaskId ?? null,
        projectId: idOf(t.project),
        createdAt: t.createdAt ?? null,
        updatedAt: t.updatedAt ?? null,
        dueDate: t.dueDate ?? null,
        qa: t.qa ?? null,
        botContext: t.botContext && typeof t.botContext === 'object' ? t.botContext : null,
      })),
      projects,
      retainers,
      drafts,
      now: generatedAt,
      taskLimit: input.taskLimit,
      // Asking for one client always returns it, even when it has nothing open.
      includeEmpty: Boolean(oneClient) || Boolean(input.includeEmpty),
    })
    // With one client asked for, drop the "(no client)" bucket: it isn't that client.
    const rows = oneClient ? digest.clients.filter((c) => c.clientAccountId === oneClient) : digest.clients

    return { success: true, generatedAt, ...digest, clients: rows, recentWork, retainerError }
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Unexpected error')
  }
}
