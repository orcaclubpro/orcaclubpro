/**
 * Per-client digest: open, blocked and waiting-on-Chance work, rolled up by
 * client account. Pure functions only; `src/actions/clientStatus.ts` loads the
 * rows and the MCP tool `client_status` returns the result.
 *
 * Rules:
 * - "Open" is any task status except `completed` and `cancelled`, so statuses
 *   added later (`blocked`, `waiting-chance`) are counted without a code change
 *   here. Unknown open statuses land in `counts.other`.
 * - No prices. Retainer rows carry hours, cap, cycle and health only; the
 *   portfolio's overage amount is dropped on purpose.
 * - Tasks are listed oldest first (createdAt), so the longest-waiting item leads.
 */

export const CLOSED_TASK_STATUSES = ['completed', 'cancelled'] as const
export const CLOSED_PROJECT_STATUSES = ['completed', 'cancelled'] as const

export const isOpenTaskStatus = (s: unknown): boolean =>
  !(CLOSED_TASK_STATUSES as readonly string[]).includes(String(s ?? 'pending'))

export type DigestCounts = {
  open: number
  pending: number
  inProgress: number
  blocked: number
  waitingChance: number
  other: number
  overdue: number
}

export type DigestTask = {
  id: string
  title: string
  status: string
  priority: string | null
  ownerBot: string | null
  ccqTaskId: string | null
  projectId: string | null
  projectName: string | null
  createdAt: string | null
  updatedAt: string | null
  dueDate: string | null
  overdue: boolean
}

export type DigestProject = {
  id: string
  name: string
  status: string | null
  percent: number
  tasksDone: number
  tasksTotal: number
  milestonesDone: number
  milestonesTotal: number
  nextMilestone: { id: string | null; title: string; date: string | null } | null
}

export type DigestRetainer = {
  tier: string | null
  used: number
  cap: number
  cycleLabel: string
  health: string
}

export type DigestDraft = {
  fileId: string
  name: string | null
  type: string | null
  projectId: string | null
  createdAt: string | null
}

export type ClientDigest = {
  clientAccountId: string | null
  name: string
  company: string | null
  counts: DigestCounts
  waitingOnChance: DigestTask[]
  blocked: DigestTask[]
  tasks: DigestTask[]
  tasksTruncated: boolean
  projects: DigestProject[]
  retainer: DigestRetainer | null
  drafts: DigestDraft[]
  /** Approved vs used hours per project: arrives with plan step 4 (approvedHours). */
  hours: null
}

// ── Inputs (loose shapes, as the Local API returns them) ─────────────────────

export type RawClient = { id: string; name?: string | null; company?: string | null }
export type RawTask = {
  id: string
  title?: string | null
  status?: string | null
  priority?: string | null
  ownerBot?: string | null
  ccqTaskId?: string | null
  projectId: string | null
  createdAt?: string | null
  updatedAt?: string | null
  dueDate?: string | null
}
export type RawProject = {
  id: string
  name?: string | null
  status?: string | null
  clientAccountId: string | null
  percent: number
  tasksDone: number
  tasksTotal: number
  milestonesDone: number
  milestonesTotal: number
  milestones: Array<{ id?: string | null; title?: string | null; date?: string | null; completed?: boolean | null }>
}
export type RawRetainer = {
  clientAccountId: string
  tier?: string | null
  used?: number | null
  cap?: number | null
  cycleLabel?: string | null
  health?: string | null
  [extra: string]: unknown
}
export type RawDraft = {
  id: string
  name?: string | null
  documentTemplate?: string | null
  clientAccountId: string | null
  projectId: string | null
  createdAt?: string | null
}

export type DigestInput = {
  clients: RawClient[]
  /** Open tasks only (the loader filters on status). */
  tasks: RawTask[]
  /** Every project the loader looked at, open or closed, with its client. */
  projects: RawProject[]
  retainers: RawRetainer[]
  drafts: RawDraft[]
  /** ISO time used for `overdue`. */
  now: string
  /** Max task rows per client (counts are always complete). */
  taskLimit?: number
  /** Keep clients with nothing open, no open project, no retainer and no draft. */
  includeEmpty?: boolean
}

const COUNT_KEY: Record<string, keyof DigestCounts> = {
  pending: 'pending',
  'in-progress': 'inProgress',
  blocked: 'blocked',
  'waiting-chance': 'waitingChance',
}

const emptyCounts = (): DigestCounts => ({
  open: 0,
  pending: 0,
  inProgress: 0,
  blocked: 0,
  waitingChance: 0,
  other: 0,
  overdue: 0,
})

const byCreatedAsc = (a: { createdAt?: string | null; id: string }, b: { createdAt?: string | null; id: string }) =>
  (a.createdAt ?? '').localeCompare(b.createdAt ?? '') || a.id.localeCompare(b.id)

/** The first incomplete milestone: earliest dated first, undated after, in list order. */
export function nextMilestoneOf(milestones: RawProject['milestones']): DigestProject['nextMilestone'] {
  const open = milestones
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => !m.completed)
    .sort((a, b) => {
      const da = a.m.date ?? null
      const db = b.m.date ?? null
      if (da && db) return da.localeCompare(db) || a.i - b.i
      if (da) return -1
      if (db) return 1
      return a.i - b.i
    })
  const first = open[0]?.m
  return first ? { id: first.id ?? null, title: first.title ?? '(untitled)', date: first.date ?? null } : null
}

export function buildClientDigest(input: DigestInput): {
  clients: ClientDigest[]
  totals: DigestCounts & { clients: number }
  omittedEmptyClients: number
} {
  const nowMs = Date.parse(input.now)
  const limit = Math.max(1, input.taskLimit ?? 50)
  const projectById = new Map(input.projects.map((p) => [p.id, p]))

  // One bucket per known client, plus `null` for tasks on a project with no client.
  type Bucket = { tasks: RawTask[]; projects: RawProject[]; drafts: RawDraft[]; retainer: RawRetainer | null }
  const buckets = new Map<string | null, Bucket>()
  const bucket = (id: string | null): Bucket => {
    let b = buckets.get(id)
    if (!b) {
      b = { tasks: [], projects: [], drafts: [], retainer: null }
      buckets.set(id, b)
    }
    return b
  }
  for (const c of input.clients) bucket(c.id)

  for (const t of input.tasks) {
    if (!isOpenTaskStatus(t.status)) continue
    const p = t.projectId ? projectById.get(t.projectId) : undefined
    bucket(p?.clientAccountId ?? null).tasks.push(t)
  }
  for (const p of input.projects) {
    if ((CLOSED_PROJECT_STATUSES as readonly string[]).includes(String(p.status ?? ''))) continue
    bucket(p.clientAccountId).projects.push(p)
  }
  for (const d of input.drafts) bucket(d.clientAccountId).drafts.push(d)
  for (const r of input.retainers) bucket(r.clientAccountId).retainer = r

  const clientById = new Map(input.clients.map((c) => [c.id, c]))
  const totals = { ...emptyCounts(), clients: 0 }
  let omitted = 0
  const out: ClientDigest[] = []

  for (const [id, b] of buckets) {
    const empty = b.tasks.length === 0 && b.projects.length === 0 && b.drafts.length === 0 && !b.retainer
    if (empty && !input.includeEmpty) {
      omitted++
      continue
    }
    // A task-less "no client" bucket never shows: it has no account to report on.
    if (id === null && empty) continue

    const counts = emptyCounts()
    const rows: DigestTask[] = b.tasks.sort(byCreatedAsc).map((t) => {
      const status = t.status ?? 'pending'
      const overdue = Boolean(t.dueDate) && Number.isFinite(nowMs) && Date.parse(t.dueDate as string) < nowMs
      counts.open++
      counts[COUNT_KEY[status] ?? 'other']++
      if (overdue) counts.overdue++
      const project = t.projectId ? projectById.get(t.projectId) : undefined
      return {
        id: t.id,
        title: t.title ?? '(untitled)',
        status,
        priority: t.priority ?? null,
        ownerBot: t.ownerBot ?? null,
        ccqTaskId: t.ccqTaskId ?? null,
        projectId: t.projectId,
        projectName: project?.name ?? null,
        createdAt: t.createdAt ?? null,
        updatedAt: t.updatedAt ?? null,
        dueDate: t.dueDate ?? null,
        overdue,
      }
    })
    for (const k of Object.keys(counts) as Array<keyof DigestCounts>) totals[k] += counts[k]
    totals.clients++

    const client = id ? clientById.get(id) : undefined
    const r = b.retainer
    out.push({
      clientAccountId: id,
      name: id === null ? '(no client)' : (client?.name ?? 'Client'),
      company: client?.company ?? null,
      counts,
      waitingOnChance: rows.filter((t) => t.status === 'waiting-chance'),
      blocked: rows.filter((t) => t.status === 'blocked'),
      tasks: rows.slice(0, limit),
      tasksTruncated: rows.length > limit,
      projects: b.projects
        .map((p) => ({
          id: p.id,
          name: p.name ?? '(untitled)',
          status: p.status ?? null,
          percent: p.percent,
          tasksDone: p.tasksDone,
          tasksTotal: p.tasksTotal,
          milestonesDone: p.milestonesDone,
          milestonesTotal: p.milestonesTotal,
          nextMilestone: nextMilestoneOf(p.milestones),
        }))
        .sort((a, b2) => a.name.localeCompare(b2.name)),
      // Hours only: no overage amount, no rates.
      retainer: r
        ? {
            tier: r.tier ?? null,
            used: Number(r.used ?? 0),
            cap: Number(r.cap ?? 0),
            cycleLabel: r.cycleLabel ?? '',
            health: r.health ?? 'unknown',
          }
        : null,
      drafts: b.drafts.sort(byCreatedAsc).map((d) => ({
        fileId: d.id,
        name: d.name ?? null,
        type: d.documentTemplate ?? null,
        projectId: d.projectId,
        createdAt: d.createdAt ?? null,
      })),
      hours: null,
    })
  }

  // Most urgent first: waiting on Chance, then blocked, then overdue, then open count, then name.
  out.sort(
    (a, b) =>
      b.counts.waitingChance - a.counts.waitingChance ||
      b.counts.blocked - a.counts.blocked ||
      b.counts.overdue - a.counts.overdue ||
      b.counts.open - a.counts.open ||
      a.name.localeCompare(b.name),
  )
  return { clients: out, totals, omittedEmptyClients: omitted }
}
