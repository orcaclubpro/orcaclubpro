'use server'

/**
 * Task tracking for bots and staff: tasks linked to a package and/or project,
 * with an owner bot, a ccq id and a QA record, plus package/project progress.
 * Wrapped by the MCP tools task_create, task_update, task_list, get_package and
 * get_project_progress (src/lib/mcp/tools.ts).
 *
 * Every Payload call passes the caller with `overrideAccess: false`, so
 * collection and field access apply as they would in the portal. Money stays
 * out: these actions never write a money field, and the package view returns no
 * prices.
 */
import { getPayload } from 'payload'
import type { Where } from 'payload'
import config from '@payload-config'

import { getCurrentUser } from '@/actions/auth'
import { computeProgress, type Progress } from '@/lib/tasks/progress'
import { lexicalToPlainText, plainTextToLexical } from '@/lib/tasks/richText'

type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
/** task_list sort orders. */
export type TaskListSort = '-updatedAt' | '-createdAt' | 'createdAt' | 'dueDate'
type QaInput = { status?: 'pending' | 'pass' | 'fail'; commit?: string; date?: string; reportLink?: string }

type Fail = { success: false; error: string }
const fail = (error: string): Fail => ({ success: false, error })

const idOf = (v: unknown): string | null =>
  v == null ? null : typeof v === 'object' ? (((v as { id?: unknown }).id as string | undefined) ?? null) : String(v)

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Unexpected error')

async function staffCaller() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'user')) return null
  return user
}

/** Compact task row for MCP output. Never includes botContext (task_get adds it). */
function taskRow(t: Record<string, any>) {
  const project = t.project && typeof t.project === 'object' ? t.project : null
  return {
    id: String(t.id),
    title: t.title,
    description: lexicalToPlainText(t.description) || null,
    status: t.status,
    priority: t.priority ?? null,
    projectId: idOf(t.project),
    projectName: project?.name ?? null,
    packageId: idOf(t.package),
    ownerBot: t.ownerBot ?? null,
    ccqTaskId: t.ccqTaskId ?? null,
    qa: t.qa
      ? {
          status: t.qa.status ?? 'pending',
          commit: t.qa.commit ?? null,
          date: t.qa.date ?? null,
          reportLink: t.qa.reportLink ?? null,
        }
      : null,
    lastActor: t.lastActor ?? null,
    dueDate: t.dueDate ?? null,
    completedAt: t.completedAt ?? null,
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
  }
}

export type TrackedTask = ReturnType<typeof taskRow>

/**
 * Loads a project as the caller sees it. Returns null when the id doesn't exist
 * or collection access hides it from this user, so a task is never created
 * against a project the caller can't see.
 */
async function visibleProject(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: NonNullable<Awaited<ReturnType<typeof staffCaller>>>,
  id: string,
) {
  try {
    const project = await payload.findByID({
      collection: 'projects',
      id,
      depth: 0,
      user,
      overrideAccess: false,
      disableErrors: true,
    })
    return project ?? null
  } catch {
    // A malformed id (not an ObjectId) throws a cast error instead of returning null.
    return null
  }
}

/**
 * The client check a task's project must pass. A package and its project must
 * belong to the same client: when either side names a client, the other must
 * name the same one (a client package on a client-less project, or the reverse,
 * is rejected). When the caller passes `clientAccountId`, the project must
 * belong to that client. Returns an error message, or null when allowed.
 */
function clientLinkError(opts: {
  projectId: string
  projectClient: string | null
  packageId?: string | null
  pkgClient?: string | null
  clientAccountId?: string | null
}): string | null {
  const { projectId, projectClient, packageId, pkgClient, clientAccountId } = opts
  if (clientAccountId && projectClient !== clientAccountId) {
    return `Project ${projectId} belongs to client account ${projectClient ?? '(none)'}, not ${clientAccountId}; the task was not saved.`
  }
  if (packageId && (pkgClient || projectClient) && pkgClient !== projectClient) {
    return `Package ${packageId} belongs to client account ${pkgClient ?? '(none)'}, but project ${projectId} belongs to client account ${projectClient ?? '(none)'}; the task was not saved.`
  }
  return null
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createTrackedTask(input: {
  actor: string
  title: string
  description?: string
  projectId?: string
  packageId?: string
  /** When set, the project must belong to this client account. */
  clientAccountId?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
  ownerBot?: string
  ccqTaskId?: string
  qa?: QaInput
}): Promise<{ success: true; task: TrackedTask } | Fail> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    const payload = await getPayload({ config })

    let projectId = input.projectId ?? null
    let pkgClient: string | null = null
    if (input.packageId) {
      const pkg = await payload.findByID({
        collection: 'packages',
        id: input.packageId,
        depth: 0,
        user,
        overrideAccess: false,
      })
      const pkgProject = idOf(pkg.projectRef)
      if (projectId && pkgProject && projectId !== pkgProject) {
        return fail(`Package ${input.packageId} belongs to project ${pkgProject}, not ${projectId}`)
      }
      projectId = projectId ?? pkgProject
      pkgClient = idOf(pkg.clientAccount)
    }
    if (!projectId) return fail('Pass projectId, or a packageId whose package is linked to a project')

    const project = await visibleProject(payload, user, projectId)
    if (!project) return fail(`Project ${projectId} not found (it does not exist or you cannot access it)`)

    const clientError = clientLinkError({
      projectId,
      projectClient: idOf(project.client),
      packageId: input.packageId,
      pkgClient,
      clientAccountId: input.clientAccountId,
    })
    if (clientError) return fail(clientError)

    const task = await payload.create({
      collection: 'tasks',
      data: {
        title: input.title,
        ...(input.description ? { description: plainTextToLexical(input.description) as any } : {}),
        project: projectId,
        ...(input.packageId ? { package: input.packageId } : {}),
        assignedTo: user.id,
        status: input.status ?? 'pending',
        priority: input.priority ?? 'medium',
        ...(input.dueDate ? { dueDate: input.dueDate } : {}),
        ...(input.ownerBot ? { ownerBot: input.ownerBot } : {}),
        ...(input.ccqTaskId ? { ccqTaskId: input.ccqTaskId } : {}),
        ...(input.qa ? { qa: input.qa } : {}),
        lastActor: input.actor,
      },
      depth: 1,
      user,
      overrideAccess: false,
    })
    return { success: true, task: taskRow(task as Record<string, any>) }
  } catch (e) {
    return fail(errorMessage(e))
  }
}

/** findByID that returns null when the doc is missing, invisible to the caller, or the id is malformed. */
async function findVisible(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: NonNullable<Awaited<ReturnType<typeof staffCaller>>>,
  collection: 'projects' | 'packages',
  id: string,
): Promise<Record<string, unknown> | null> {
  try {
    const doc = await payload.findByID({ collection, id, depth: 0, user, overrideAccess: false, disableErrors: true })
    return (doc as Record<string, unknown> | null) ?? null
  } catch {
    return null
  }
}

/**
 * Checks that a task's resulting project/package pair is consistent: both exist
 * and are visible, the package's projectRef (if set) is that project, and the
 * package's client account matches the project's client. Returns an error
 * message, or null when the pair is valid.
 */
async function checkTaskLinks(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: NonNullable<Awaited<ReturnType<typeof staffCaller>>>,
  projectId: string | null,
  packageId: string | null,
  clientAccountId?: string | null,
): Promise<string | null> {
  if (!projectId) return 'A task must belong to a project'
  const project = await findVisible(payload, user, 'projects', projectId)
  if (!project) return `Project ${projectId} not found`
  const projectClient = idOf(project.client)
  if (!packageId) return clientLinkError({ projectId, projectClient, clientAccountId })
  const pkg = await findVisible(payload, user, 'packages', packageId)
  if (!pkg) return `Package ${packageId} not found`
  const pkgProject = idOf(pkg.projectRef)
  if (pkgProject && pkgProject !== projectId) {
    return `Package ${packageId} belongs to project ${pkgProject}, not ${projectId}`
  }
  return clientLinkError({ projectId, projectClient, packageId, pkgClient: idOf(pkg.clientAccount), clientAccountId })
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateTrackedTask(input: {
  actor: string
  id: string
  title?: string
  description?: string
  projectId?: string
  packageId?: string | null
  /** When set, the task's resulting project must belong to this client account. */
  clientAccountId?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string | null
  ownerBot?: string | null
  ccqTaskId?: string | null
  qa?: QaInput
}): Promise<{ success: true; task: TrackedTask } | Fail> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    const payload = await getPayload({ config })

    const current = (await payload.findByID({
      collection: 'tasks',
      id: input.id,
      depth: 0,
      user,
      overrideAccess: false,
    })) as Record<string, any>

    // Moving a task re-runs the create-time match on the resulting pair, so it can
    // never end up on another client's project or package, or on a missing one.
    if (input.projectId !== undefined || input.packageId !== undefined || input.clientAccountId !== undefined) {
      const nextProject = input.projectId !== undefined ? input.projectId : idOf(current.project)
      const nextPackage = input.packageId !== undefined ? input.packageId : idOf(current.package)
      const linkError = await checkTaskLinks(payload, user, nextProject, nextPackage, input.clientAccountId)
      if (linkError) return fail(linkError)
    }

    const data: Record<string, unknown> = { lastActor: input.actor }
    if (input.title !== undefined) data.title = input.title
    if (input.description !== undefined) data.description = plainTextToLexical(input.description)
    if (input.projectId !== undefined) data.project = input.projectId
    if (input.packageId !== undefined) data.package = input.packageId
    if (input.status !== undefined) data.status = input.status
    if (input.priority !== undefined) data.priority = input.priority
    if (input.dueDate !== undefined) data.dueDate = input.dueDate
    if (input.ownerBot !== undefined) data.ownerBot = input.ownerBot
    if (input.ccqTaskId !== undefined) data.ccqTaskId = input.ccqTaskId
    // qa is merged, so a bot can record a verdict without restating the rest.
    if (input.qa !== undefined) data.qa = { ...(current.qa ?? {}), ...input.qa }

    const task = await payload.update({
      collection: 'tasks',
      id: input.id,
      data: data as any,
      depth: 1,
      user,
      overrideAccess: false,
    })
    return { success: true, task: taskRow(task as Record<string, any>) }
  } catch (e) {
    return fail(errorMessage(e))
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listTrackedTasks(input: {
  packageId?: string
  projectId?: string
  clientAccountId?: string
  status?: TaskStatus | TaskStatus[]
  ownerBot?: string
  ccqTaskId?: string
  /** Sort order; default newest-updated first. */
  sort?: TaskListSort
  /** ISO date-time: only tasks updated at or after it. */
  updatedSince?: string
  /** ISO date-time: only tasks created at or after it. */
  createdSince?: string
  limit?: number
  page?: number
}): Promise<
  | {
      success: true
      items: TrackedTask[]
      total: number
      page: number
      hasNextPage: boolean
      nextPage: number | null
    }
  | Fail
> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    const payload = await getPayload({ config })

    const and: Where[] = []
    if (input.packageId) and.push({ package: { equals: input.packageId } })
    if (input.projectId) and.push({ project: { equals: input.projectId } })
    if (input.clientAccountId) and.push({ 'project.client': { equals: input.clientAccountId } })
    if (input.status) {
      and.push(Array.isArray(input.status) ? { status: { in: input.status } } : { status: { equals: input.status } })
    }
    if (input.ownerBot) and.push({ ownerBot: { equals: input.ownerBot } })
    if (input.ccqTaskId) and.push({ ccqTaskId: { equals: input.ccqTaskId } })
    for (const [field, value] of [
      ['updatedAt', input.updatedSince],
      ['createdAt', input.createdSince],
    ] as const) {
      if (value === undefined) continue
      const at = new Date(value)
      if (Number.isNaN(at.getTime())) return fail(`${field === 'updatedAt' ? 'updatedSince' : 'createdSince'}: not an ISO date-time`)
      and.push({ [field]: { greater_than_equal: at.toISOString() } })
    }

    const res = await payload.find({
      collection: 'tasks',
      where: and.length ? { and } : {},
      sort: input.sort ?? '-updatedAt',
      limit: Math.min(Math.max(input.limit ?? 25, 1), 100),
      page: input.page ?? 1,
      depth: 1,
      user,
      overrideAccess: false,
    })
    return {
      success: true,
      items: res.docs.map((d) => taskRow(d as Record<string, any>)),
      total: res.totalDocs,
      page: res.page ?? 1,
      hasNextPage: res.hasNextPage,
      nextPage: res.nextPage ?? null,
    }
  } catch (e) {
    return fail(errorMessage(e))
  }
}

// ── Get one ───────────────────────────────────────────────────────────────────

type BotContextRow = {
  brief: string | null
  repo: string | null
  branch: string | null
  liveUrl: string | null
  decisions: string | null
  notes: string | null
  ownerBot: string | null
  updatedAt: string | null
}

/**
 * One task as the caller sees it: the task_list row plus its staff-only
 * botContext (brief, repo, branch, live URL, decisions, notes). Read-only.
 */
export async function getTrackedTask(
  id: string,
): Promise<{ success: true; task: TrackedTask & { botContext: BotContextRow | null } } | Fail> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    const payload = await getPayload({ config })
    let doc: Record<string, any> | null = null
    try {
      doc = (await payload.findByID({
        collection: 'tasks',
        id,
        depth: 1,
        user,
        overrideAccess: false,
        disableErrors: true,
      })) as Record<string, any> | null
    } catch {
      // A malformed id (not an ObjectId) throws a cast error instead of returning null.
      doc = null
    }
    if (!doc) return fail(`Task ${id} not found (it does not exist or you cannot access it)`)
    const bc = doc.botContext && typeof doc.botContext === 'object' ? (doc.botContext as Record<string, any>) : null
    return {
      success: true,
      task: {
        ...taskRow(doc),
        botContext: bc
          ? {
              brief: bc.brief ?? null,
              repo: bc.repo ?? null,
              branch: bc.branch ?? null,
              liveUrl: bc.liveUrl ?? null,
              decisions: bc.decisions ?? null,
              notes: bc.notes ?? null,
              ownerBot: bc.ownerBot ?? null,
              updatedAt: bc.updatedAt ?? null,
            }
          : null,
      },
    }
  } catch (e) {
    return fail(errorMessage(e))
  }
}

// ── Package + project progress ───────────────────────────────────────────────

type Milestone = { id: string | null; title: string; date: string | null; completed: boolean }

const milestonesOf = (project: Record<string, any> | null): Milestone[] =>
  (Array.isArray(project?.milestones) ? project!.milestones : []).map((m: Record<string, any>) => ({
    id: m.id ?? null,
    title: m.title,
    date: m.date ?? null,
    completed: Boolean(m.completed),
  }))

async function allTasks(payload: Awaited<ReturnType<typeof getPayload>>, user: any, where: Where) {
  const res = await payload.find({
    collection: 'tasks',
    where,
    sort: 'createdAt',
    limit: 500,
    depth: 0,
    user,
    overrideAccess: false,
  })
  return res.docs as Record<string, any>[]
}

/** A package with its tasks, its project's milestones, and progress. No prices. */
export async function getPackageOverview(packageId: string): Promise<
  | {
      success: true
      package: {
        id: string
        name: string
        type: string | null
        status: string | null
        clientAccountId: string | null
        projectId: string | null
        lineItems: Array<{ name: string; quantity: number | null }>
      }
      tasks: TrackedTask[]
      milestones: Milestone[]
      progress: Progress
    }
  | Fail
> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    const payload = await getPayload({ config })

    const pkg = (await payload.findByID({
      collection: 'packages',
      id: packageId,
      depth: 0,
      user,
      overrideAccess: false,
    })) as Record<string, any>
    const projectId = idOf(pkg.projectRef)
    const project = projectId
      ? ((await payload.findByID({ collection: 'projects', id: projectId, depth: 0, user, overrideAccess: false })) as Record<
          string,
          any
        >)
      : null
    const tasks = await allTasks(payload, user, { package: { equals: packageId } })
    const milestones = milestonesOf(project)

    return {
      success: true,
      package: {
        id: String(pkg.id),
        name: pkg.name,
        type: pkg.type ?? null,
        status: pkg.status ?? null,
        clientAccountId: idOf(pkg.clientAccount),
        projectId,
        lineItems: (Array.isArray(pkg.lineItems) ? pkg.lineItems : []).map((li: Record<string, any>) => ({
          name: li.name,
          quantity: li.quantity ?? null,
        })),
      },
      tasks: tasks.map(taskRow),
      milestones,
      progress: computeProgress({ tasks, milestones }),
    }
  } catch (e) {
    return fail(errorMessage(e))
  }
}

/** A project's milestones, task counts by status, open tasks and progress. */
export async function getProjectProgress(projectId: string): Promise<
  | {
      success: true
      project: {
        id: string
        name: string
        status: string | null
        clientAccountId: string | null
        startDate: string | null
        projectedEndDate: string | null
      }
      milestones: Milestone[]
      openTasks: TrackedTask[]
      progress: Progress
    }
  | Fail
> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    const payload = await getPayload({ config })

    const project = (await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0,
      user,
      overrideAccess: false,
    })) as Record<string, any>
    const tasks = await allTasks(payload, user, { project: { equals: projectId } })
    const milestones = milestonesOf(project)

    return {
      success: true,
      project: {
        id: String(project.id),
        name: project.name,
        status: project.status ?? null,
        clientAccountId: idOf(project.client),
        startDate: project.startDate ?? null,
        projectedEndDate: project.projectedEndDate ?? null,
      },
      milestones,
      // Tasks load at depth 0, so name them from the project already in hand.
      openTasks: tasks
        .filter((t) => t.status === 'pending' || t.status === 'in-progress')
        .map((t) => taskRow({ ...t, project: { id: String(project.id), name: project.name } })),
      progress: computeProgress({ tasks, milestones }),
    }
  } catch (e) {
    return fail(errorMessage(e))
  }
}

// ── Project list ─────────────────────────────────────────────────────────────

type ProjectStatus = 'pending' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled'

export type ProjectRow = {
  id: string
  name: string
  status: string | null
  clientAccountId: string | null
  startDate: string | null
  projectedEndDate: string | null
  progress: Progress
}

/**
 * Projects the caller can see (collection access applies), newest-updated first,
 * optionally filtered by client account and status, each with its progress.
 */
export async function listProjects(input: {
  clientId?: string
  status?: ProjectStatus | ProjectStatus[]
  limit?: number
  page?: number
}): Promise<{ success: true; items: ProjectRow[]; total: number; page: number; hasNextPage: boolean } | Fail> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    const payload = await getPayload({ config })

    const and: Where[] = []
    if (input.clientId) and.push({ client: { equals: input.clientId } })
    if (input.status) {
      and.push(Array.isArray(input.status) ? { status: { in: input.status } } : { status: { equals: input.status } })
    }
    const res = await payload.find({
      collection: 'projects',
      where: and.length ? { and } : {},
      sort: '-updatedAt',
      limit: Math.min(Math.max(input.limit ?? 25, 1), 100),
      page: input.page ?? 1,
      depth: 0,
      select: { name: true, status: true, client: true, startDate: true, projectedEndDate: true, milestones: true },
      user,
      overrideAccess: false,
    })
    const projects = res.docs as Record<string, any>[]
    const ids = projects.map((p) => String(p.id))
    const taskDocs = ids.length
      ? ((
          await payload.find({
            collection: 'tasks',
            where: { project: { in: ids } },
            limit: 5000,
            depth: 0,
            select: { project: true, status: true },
            user,
            overrideAccess: false,
          })
        ).docs as Record<string, any>[])
      : []
    const tasksBy = new Map<string, Record<string, any>[]>()
    for (const t of taskDocs) {
      const pid = idOf(t.project)
      if (!pid) continue
      const list = tasksBy.get(pid) ?? []
      list.push(t)
      tasksBy.set(pid, list)
    }
    return {
      success: true,
      items: projects.map((p) => ({
        id: String(p.id),
        name: p.name,
        status: p.status ?? null,
        clientAccountId: idOf(p.client),
        startDate: p.startDate ?? null,
        projectedEndDate: p.projectedEndDate ?? null,
        progress: computeProgress({ tasks: tasksBy.get(String(p.id)) ?? [], milestones: milestonesOf(p) }),
      })),
      total: res.totalDocs,
      page: res.page ?? 1,
      hasNextPage: res.hasNextPage,
    }
  } catch (e) {
    return fail(errorMessage(e))
  }
}
