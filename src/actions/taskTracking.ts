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
import { claimFilter, claimKind, claimRefusal, claimUpdate, isTaskId } from '@/lib/tasks/claim'
import { taskAdminUrl } from '@/lib/tasks/url'
import {
  ARRAY_OF,
  buildAddItems,
  buildItem,
  buildNote,
  buildScreen,
  countAdds,
  describeEdit,
  fromTemplate,
  intakeMissing,
  normItem,
  normalizeOwner,
  nowBlock,
  ownerSlice,
  patchUpdate,
  reorderRows,
  rowId,
  structureProgress,
  StructureError,
  type AddItemsInput,
  type ItemIn,
  type ItemPatch,
  type NoteIn,
  type Reorder,
  type ScreenIn,
} from '@/lib/tasks/structure'

type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
/** task_list sort orders. */
export type TaskListSort = '-updatedAt' | '-createdAt' | 'createdAt' | 'dueDate'
type QaInput = { status?: 'pending' | 'pass' | 'fail'; commit?: string; date?: string; reportLink?: string }

type Fail = { success: false; error: string }
type IntakeFail = { success: false; code: 'intake'; missing: string[]; error: string }
const fail = (error: string): Fail => ({ success: false, error })

const idOf = (v: unknown): string | null =>
  v == null ? null : typeof v === 'object' ? (((v as { id?: unknown }).id as string | undefined) ?? null) : String(v)

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Unexpected error')

async function staffCaller() {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'user')) return null
  return user
}

/**
 * Task row for MCP output. Never includes botContext (task_get adds it). task_list
 * rows are compact (summary + progress); `full` adds the structured lists.
 */
function taskRow(t: Record<string, any>, full = true) {
  const project = t.project && typeof t.project === 'object' ? t.project : null
  const base = {
    id: String(t.id),
    url: taskAdminUrl(String(t.id)),
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
    claimedBy: t.claimedBy ?? null,
    claimedAt: t.claimedAt ?? null,
    leaseExpiresAt: t.leaseExpiresAt ?? null,
    dueDate: t.dueDate ?? null,
    completedAt: t.completedAt ?? null,
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
    // Structured fields (board 6aea1fd4). Staff-only; empty on legacy text-only tasks.
    lead: t.lead ?? null,
    version: Number(t.version) || 0,
    summary: structureProgress(t).summary,
    progress: structureProgress(t),
  }
  if (!full) return base as typeof base & Partial<ReturnType<typeof structuredLists>>
  return { ...base, ...structuredLists(t) }
}

function structuredLists(t: Record<string, any>) {
  return {
    ask: t.ask ?? null,
    askUpdates: rows(t.askUpdates, ['id', 'at', 'words', 'source']),
    deliverables: (Array.isArray(t.deliverables) ? t.deliverables : []).map((r: any) => normItem(r, 'deliverable')),
    checklist: (Array.isArray(t.checklist) ? t.checklist : []).map((r: any) => normItem(r, 'checklist')),
    changes: rows(t.changes, ['id', 'at', 'words', 'source', 'by']),
    screens: rows(t.screens, ['id', 'path', 'caption', 'discordLink', 'sentToDrive']),
  }
}

function rows(value: unknown, keys: string[]) {
  if (!Array.isArray(value)) return []
  return value.map((r) => Object.fromEntries(keys.map((k) => [k, (r as Record<string, unknown>)?.[k] ?? null])))
}

type StructuredInput = {
  ask?: string
  lead?: string | null
  askUpdates?: NoteIn[]
  deliverables?: ItemIn[]
  checklist?: ItemIn[]
  changes?: NoteIn[]
  screens?: ScreenIn[]
}

/** Validated, id-stamped values for a create/update; only the keys passed are returned. */
function structuredData(input: StructuredInput, actor: string, now: Date) {
  const data: Record<string, unknown> = {}
  if (input.ask !== undefined) data.ask = input.ask.trim()
  if (input.lead !== undefined) data.lead = input.lead === null ? null : normalizeOwner(input.lead)
  if (input.askUpdates !== undefined) data.askUpdates = input.askUpdates.map((c) => buildNote('askUpdate', c, actor, now))
  if (input.deliverables !== undefined) data.deliverables = input.deliverables.map((d) => buildItem('deliverable', d, actor))
  if (input.checklist !== undefined) data.checklist = input.checklist.map((d) => buildItem('checklist', d, actor))
  if (input.changes !== undefined) data.changes = input.changes.map((c) => buildNote('change', c, actor, now))
  if (input.screens !== undefined) data.screens = input.screens.map(buildScreen)
  return data
}

const autoChange = (words: string, actor: string, now: Date) => ({
  id: rowId(),
  at: now,
  words: words.slice(0, 2000),
  source: 'auto',
  by: actor,
})

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
} & StructuredInput): Promise<{ success: true; task: TrackedTask } | Fail | IntakeFail> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')

    // Intake (board 6aea1fd4, Chance 11:34/11:46 AM PT): Ask + at least 1
    // deliverable + at least 1 checklist item, no maximum. Same rule as the poller
    // (orca-ops ops/poller/dispatch.py template_missing, 527f3d8).
    const missing = intakeMissing(input)
    if (missing.length) {
      return {
        success: false,
        code: 'intake',
        missing,
        error:
          `Task not created; missing: ${missing.join(', ')}. A new task needs an Ask, at least 1 deliverable ` +
          'and at least 1 checklist item (fields ask/deliverables/checklist, or Ask:/Deliverables:/Checklist: ' +
          'sections in the description). Read-only reviews are exempt.',
      }
    }
    // Text template → structured fields, unless the caller passed them.
    const tpl = fromTemplate(input.description)
    const structured = structuredData(
      {
        ask: input.ask ?? tpl.ask ?? undefined,
        lead: input.lead,
        askUpdates: input.askUpdates,
        deliverables: input.deliverables ?? (tpl.deliverables.length ? tpl.deliverables : undefined),
        checklist: input.checklist ?? (tpl.checklist.length ? tpl.checklist : undefined),
        changes: input.changes ?? (tpl.changes.length ? tpl.changes : undefined),
        screens: input.screens,
      },
      input.actor,
      new Date(),
    )
    structured.changes = [
      ...((structured.changes as unknown[]) ?? []),
      autoChange(`created by ${input.actor}`, input.actor, new Date()),
    ]
    structured.version = 1
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
        ...structured,
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

const FULL_ID = /^[0-9a-f]{24}$/i
const ID_PREFIX = /^[0-9a-f]{8,23}$/i

/**
 * Resolves a task id the way people type it in chat: a full 24-hex ObjectId, or
 * a unique prefix of 8+ hex chars (e.g. `6ae9184d`). A prefix becomes an
 * inclusive `_id` range (prefix padded with 0s / fs), looked up as the caller
 * with `overrideAccess: false`, so only tasks the caller can see resolve.
 * Read-only. Returns the full id, or an error message (not found / ambiguous).
 */
async function resolveTaskId(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: NonNullable<Awaited<ReturnType<typeof staffCaller>>>,
  raw: string,
): Promise<{ id: string } | { error: string }> {
  const id = raw.trim()
  if (FULL_ID.test(id) || !ID_PREFIX.test(id)) return { id }
  const prefix = id.toLowerCase()
  const res = await payload.find({
    collection: 'tasks',
    where: {
      id: {
        greater_than_equal: prefix.padEnd(24, '0'),
        less_than_equal: prefix.padEnd(24, 'f'),
      },
    },
    sort: 'createdAt',
    limit: 5,
    depth: 0,
    user,
    overrideAccess: false,
  })
  const ids = res.docs.map((d) => String((d as { id: unknown }).id))
  if (ids.length === 1) return { id: ids[0]! }
  if (ids.length === 0) return { error: `Task ${id} not found (it does not exist or you cannot access it)` }
  return {
    error: `Task id prefix ${id} is ambiguous: matches ${ids.join(', ')}${ids.length === 5 ? ', …' : ''}. Use more characters.`,
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
} & StructuredInput): Promise<{ success: true; task: TrackedTask } | Fail> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    if (input.askUpdates !== undefined || input.changes !== undefined) {
      return fail('askUpdates and changes are append-only: add them with task_add_items')
    }
    const now = new Date()
    const structured = structuredData(input, input.actor, now)
    const payload = await getPayload({ config })
    const resolved = await resolveTaskId(payload, user, input.id)
    if ('error' in resolved) return fail(resolved.error)
    const taskId = resolved.id

    const current = (await payload.findByID({
      collection: 'tasks',
      id: taskId,
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
    // Whole-array replace (ask stays locked by the collection hook). To append or edit rows, use task_add_items.
    Object.assign(data, structured)
    // Every edit bumps version and writes one changes[] line (board 6aea1fd4).
    const touched = Object.keys(input).filter(
      (k) => !['actor', 'id', 'clientAccountId'].includes(k) && (input as Record<string, unknown>)[k] !== undefined,
    )
    if (touched.length) {
      data.version = (Number(current.version) || 0) + 1
      const what = touched.map((k) => (k === 'status' ? `status → ${input.status}` : k)).join(', ')
      data.changes = [...(Array.isArray(current.changes) ? current.changes : []), autoChange(`updated ${what}`, input.actor, now)]
    }

    const task = await payload.update({
      collection: 'tasks',
      id: taskId,
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

// ── Claim ─────────────────────────────────────────────────────────────────────

/**
 * Atomically take a task: pending → in-progress with claimedBy + a lease, or
 * reclaim one whose lease expired, or renew your own live lease. The flip is one
 * conditional `findOneAndUpdate` (see src/lib/tasks/claim.ts), so two callers
 * can never both win. The visibility read before it only decides whether the
 * caller may see the task at all; it plays no part in the race.
 *
 * The raw update skips Payload hooks: none apply to this transition (no QA gate,
 * no completedAt, no botContext), and the MCP layer writes the audit row.
 */
export async function claimTrackedTask(input: {
  actor: string
  id: string
  leaseMinutes?: number
}): Promise<
  | { success: true; outcome: 'claimed' | 'renewed' | 'reclaimed'; previousClaimedBy: string | null; task: TrackedTask }
  | Fail
> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    if (!isTaskId(input.id)) return fail(`Task ${input.id} not found`)
    const payload = await getPayload({ config })

    const visible = await payload
      .findByID({ collection: 'tasks', id: input.id, depth: 0, user, overrideAccess: false, disableErrors: true })
      .catch(() => null)
    if (!visible) return fail(`Task ${input.id} not found (it does not exist or you cannot access it)`)

    const model = (payload.db as any).collections.tasks
    const now = new Date()
    const before = await model
      .findOneAndUpdate(claimFilter(input.id, input.actor, now), claimUpdate(input.actor, now, input.leaseMinutes), {
        returnDocument: 'before',
      })
      .lean()
    if (!before) {
      const current = await model.findOne({ _id: input.id }, { status: 1, claimedBy: 1, leaseExpiresAt: 1 }).lean()
      return fail(claimRefusal(current, input.id, now))
    }

    const task = await payload.findByID({ collection: 'tasks', id: input.id, depth: 1, user, overrideAccess: false })
    return {
      success: true,
      outcome: claimKind(before, input.actor, now),
      previousClaimedBy: before.status === 'pending' ? null : (before.claimedBy ?? null),
      task: taskRow(task as Record<string, any>),
    }
  } catch (e) {
    return fail(errorMessage(e))
  }
}

// ── Add items / edit items ────────────────────────────────────────────────────

/**
 * task_add_items: append askUpdates, deliverables, checklist items, changes and
 * screens; edit rows by id (`set`: text, status open|done|dropped + dropReason,
 * owner, link/proof, screen fields); reorder deliverables or checklist (`order`).
 * Never a whole-task rewrite:
 *  - reorder is one compare-and-set on `version` (refused if anyone edited since the read);
 *  - edits are one `$set` with arrayFilters; appends are one `$push`, so two bots
 *    adding at the same moment both land;
 *  - the final write pushes one auto changes[] line ("<actor>: added 2 checklist; …")
 *    and `$inc`s version.
 * Raw updates skip Payload hooks: rows are validated and stamped here (structure.ts);
 * the close gate and ask lock guard other paths, and nothing here changes status or ask.
 */
export async function addTaskItems(
  input: { actor: string; id: string; set?: ItemPatch[]; order?: Reorder[] } & AddItemsInput,
): Promise<
  | { success: true; added: Record<string, string[]>; skippedScreens: string[]; edited: number; reordered: string[]; task: TrackedTask }
  | Fail
> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    const payload = await getPayload({ config })
    const resolved = await resolveTaskId(payload, user, input.id)
    if ('error' in resolved) return fail(resolved.error)
    const id = resolved.id
    if (!isTaskId(id)) return fail(`Task ${input.id} not found`)

    const visible = (await payload
      .findByID({ collection: 'tasks', id, depth: 0, user, overrideAccess: false, disableErrors: true })
      .catch(() => null)) as Record<string, any> | null
    if (!visible) return fail(`Task ${input.id} not found (it does not exist or you cannot access it)`)

    const nAdds = countAdds(input)
    if (!nAdds && !input.set?.length && !input.order?.length) {
      return fail('Nothing to do: pass items to add, `set` to edit rows by id, or `order` to reorder')
    }
    const now = new Date()
    const model = (payload.db as any).collections.tasks

    // Validate everything before writing anything.
    const patch = input.set?.length ? patchUpdate(input.set) : null
    if (patch) {
      const unknown = input.set!.filter(
        (p) => !(visible[ARRAY_OF[p.kind]] ?? []).some((r: { id?: string }) => String(r?.id) === p.id),
      )
      if (unknown.length) {
        return fail(`Not on task ${id}: ${unknown.map((p) => `${p.kind} ${p.id}`).join(', ')}; nothing was written`)
      }
    }
    const reorders = (input.order ?? []).map((o) => {
      const arr = ARRAY_OF[o.kind]
      if (arr !== 'deliverables' && arr !== 'checklist') throw new StructureError(`Can't reorder ${o.kind}`)
      return { arr, rows: reorderRows(Array.isArray(visible[arr]) ? visible[arr] : [], o.ids) }
    })
    const existingPaths = (Array.isArray(visible.screens) ? visible.screens : []).map((s: { path?: string }) => s?.path ?? '')
    const toAdd = nAdds ? buildAddItems(input, input.actor, now, existingPaths) : null

    // 1. Reorder: compare-and-set on version (missing version = legacy 0).
    if (reorders.length) {
      const v = Number(visible.version) || 0
      const res = await model.updateOne(
        { _id: id, ...(v ? { version: v } : { $or: [{ version: { $exists: false } }, { version: null }, { version: 0 }] }) },
        { $set: Object.fromEntries(reorders.map((r) => [r.arr, r.rows])) },
      )
      if (!res.matchedCount) return fail(`Task ${id} changed since you read it (version ${v}); re-read and retry the reorder`)
    }
    // 2. Edits by row id.
    if (patch) {
      await model.updateOne({ _id: id }, { $set: patch.$set }, { arrayFilters: patch.arrayFilters })
    }
    // 3. Appends + the auto change line + version bump, one update.
    const auto = describeEdit(toAdd, patch?.said ?? [], reorders.map((r) => r.arr))
    const changes = [...(toAdd?.changes ?? []), ...(auto ? [autoChange(`${input.actor}: ${auto}`, input.actor, now)] : [])]
    const push: Record<string, { $each: unknown[] }> = {}
    for (const key of ['askUpdates', 'deliverables', 'checklist', 'screens'] as const) {
      if (toAdd?.[key].length) push[key] = { $each: toAdd[key] }
    }
    if (changes.length) push.changes = { $each: changes }
    const paths = toAdd?.screens.map((s) => s.path) ?? []
    // The filter keeps screens deduped under a race: another writer adding the same
    // path in between makes this match nothing (the caller retries).
    const res = await model.updateOne(paths.length ? { _id: id, 'screens.path': { $nin: paths } } : { _id: id }, {
      $push: push,
      $inc: { version: 1 },
      $set: { lastActor: input.actor, updatedAt: now },
    })
    if (!res.matchedCount) return fail(`A screen with the same path was just added to task ${id}; retry`)

    const added: Record<string, string[]> = {}
    for (const key of ['askUpdates', 'deliverables', 'checklist', 'changes', 'screens'] as const) {
      if (toAdd?.[key].length) added[key] = toAdd[key].map((r) => r.id)
    }
    const task = await payload.findByID({ collection: 'tasks', id, depth: 1, user, overrideAccess: false })
    return {
      success: true,
      added,
      skippedScreens: toAdd?.skippedScreens ?? [],
      edited: input.set?.length ?? 0,
      reordered: reorders.map((r) => r.arr),
      task: taskRow(task as Record<string, any>),
    }
  } catch (e) {
    return fail(e instanceof StructureError ? e.message : errorMessage(e))
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listTrackedTasks(input: {
  packageId?: string
  projectId?: string
  clientAccountId?: string
  status?: TaskStatus | TaskStatus[]
  /** One owner, or several (any-of). */
  ownerBot?: string | string[]
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
    if (Array.isArray(input.ownerBot)) {
      const owners = [...new Set(input.ownerBot.map((o) => o.trim()).filter(Boolean))]
      if (owners.length) and.push({ ownerBot: { in: owners } })
    } else if (input.ownerBot?.trim()) {
      and.push({ ownerBot: { equals: input.ownerBot.trim() } })
    }
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
      items: res.docs.map((d) => taskRow(d as Record<string, any>, false)),
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
  owner?: string,
): Promise<
  | { success: true; task: TrackedTask & { botContext: BotContextRow | null; now: ReturnType<typeof nowBlock> } }
  | { success: true; view: ReturnType<typeof ownerView> }
  | Fail
> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    const payload = await getPayload({ config })
    const resolved = await resolveTaskId(payload, user, id)
    if ('error' in resolved) return fail(resolved.error)
    let doc: Record<string, any> | null = null
    try {
      doc = (await payload.findByID({
        collection: 'tasks',
        id: resolved.id,
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
    if (owner?.trim()) return { success: true, view: ownerView(doc, owner, bc) }
    return {
      success: true,
      task: {
        ...taskRow(doc),
        now: nowBlock(lexicalToPlainText(doc.description), whereOf(bc)),
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

const whereOf = (bc: Record<string, any> | null) =>
  bc ? [bc.repo, bc.branch, bc.liveUrl].filter((x) => typeof x === 'string' && x.trim()).join(' · ') || null : null

/**
 * One owner's pickup view of a task (a lane: dev | cm | fin, or a bot): the Ask +
 * askUpdates, that owner's Now line(s), its open items, the last 5 changes and the
 * botContext links. Untagged items and untagged next: lines count as dev.
 */
function ownerView(doc: Record<string, any>, owner: string, bc: Record<string, any> | null) {
  const who = owner.trim().toLowerCase()
  const lists = structuredLists(doc)
  const { now, open } = ownerSlice(doc, lexicalToPlainText(doc.description), who, whereOf(bc))
  return {
    id: String(doc.id),
    url: taskAdminUrl(String(doc.id)),
    title: doc.title,
    status: doc.status,
    owner: who,
    summary: structureProgress(doc).summary,
    lead: doc.lead ?? null,
    ask: lists.ask,
    askUpdates: lists.askUpdates,
    now,
    openItems: open,
    lastChanges: lists.changes.slice(-5),
    links: bc
      ? { repo: bc.repo ?? null, branch: bc.branch ?? null, liveUrl: bc.liveUrl ?? null, brief: bc.brief ?? null }
      : null,
  }
}

// ── my_work ───────────────────────────────────────────────────────────────────

/**
 * my_work(owner): that owner's Now lines and open items across every open task
 * (pending + in-progress), oldest task first. Tasks where the owner has neither
 * are left out.
 */
export async function myWork(input: { owner: string; limit?: number }): Promise<
  | {
      success: true
      owner: string
      items: { id: string; url: string; title: string; status: string; summary: string; now: ReturnType<typeof nowBlock>; openItems: ReturnType<typeof normItem>[] }[]
      scanned: number
    }
  | Fail
> {
  try {
    const user = await staffCaller()
    if (!user) return fail('Unauthorized')
    const who = input.owner.trim().toLowerCase()
    if (!who) return fail('owner is required')
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'tasks',
      where: { status: { in: ['pending', 'in-progress'] } },
      sort: 'createdAt',
      limit: 500,
      depth: 0,
      user,
      overrideAccess: false,
    })
    const items = []
    for (const d of res.docs as Record<string, any>[]) {
      const bc = d.botContext && typeof d.botContext === 'object' ? d.botContext : null
      const { now, open } = ownerSlice(d, lexicalToPlainText(d.description), who, whereOf(bc))
      if (!now.length && !open.length) continue
      items.push({
        id: String(d.id),
        url: taskAdminUrl(String(d.id)),
        title: d.title,
        status: d.status,
        summary: structureProgress(d).summary,
        now,
        openItems: open,
      })
      if (items.length >= Math.min(Math.max(input.limit ?? 50, 1), 200)) break
    }
    return { success: true, owner: who, items, scanned: res.docs.length }
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
      tasks: tasks.map((t) => taskRow(t, false)),
      milestones,
      progress: computeProgress({ tasks, milestones }),
    }
  } catch (e) {
    return fail(errorMessage(e))
  }
}

/** What hangs off a project, for one-call discovery. Names and states only: no prices. */
type ProjectLinks = {
  packages: Array<{ id: string; name: string; type: string | null; status: string | null }>
  files: Array<{
    id: string
    name: string
    documentTemplate: string | null
    documentStatus: string | null
    packageId: string | null
    updatedAt: string | null
  }>
  retainer: { id: string; status: string | null; tier: string | null } | null
}

async function projectLinks(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: any,
  projectId: string,
  clientAccountId: string | null,
): Promise<ProjectLinks> {
  const scoped = { depth: 0, user, overrideAccess: false } as const
  const [packages, files, retainers] = await Promise.all([
    payload
      .find({
        collection: 'packages',
        where: { projectRef: { equals: projectId } },
        select: { name: true, type: true, status: true },
        sort: '-updatedAt',
        limit: 50,
        ...scoped,
      })
      .then((r) => r.docs as Record<string, any>[])
      .catch(() => []),
    payload
      .find({
        collection: 'files',
        where: { project: { equals: projectId } },
        select: { name: true, documentTemplate: true, documentStatus: true, packageRef: true, updatedAt: true },
        sort: '-updatedAt',
        limit: 50,
        ...scoped,
      })
      .then((r) => r.docs as Record<string, any>[])
      .catch(() => []),
    clientAccountId
      ? payload
          .find({
            collection: 'retainers',
            where: { clientAccount: { equals: clientAccountId } },
            select: { status: true, tier: true },
            sort: '-updatedAt',
            limit: 1,
            ...scoped,
          })
          .then((r) => r.docs as Record<string, any>[])
          .catch(() => [])
      : Promise.resolve([] as Record<string, any>[]),
  ])
  const r = retainers[0]
  return {
    packages: packages.map((p) => ({ id: String(p.id), name: p.name, type: p.type ?? null, status: p.status ?? null })),
    files: files.map((f) => ({
      id: String(f.id),
      name: f.name,
      documentTemplate: f.documentTemplate ?? null,
      documentStatus: f.documentStatus ?? null,
      packageId: idOf(f.packageRef),
      updatedAt: f.updatedAt ?? null,
    })),
    retainer: r ? { id: String(r.id), status: r.status ?? null, tier: r.tier ?? null } : null,
  }
}

/** A project's milestones, task counts by status, open tasks, progress, and what links to it. */
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
    } & ProjectLinks
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
    const links = await projectLinks(payload, user, projectId, idOf(project.client))

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
      ...links,
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
