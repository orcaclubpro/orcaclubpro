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
 * - Waiting on Chance = status `waiting-chance`, OR (until that status exists)
 *   an open task whose QA is PASS with a #qa post (a Discord message link) in
 *   `qa.reportLink`: QA passed and the push ask is sitting in #qa.
 */

import { lexicalToPlainText } from './richText'

/** Task description is Lexical rich text (one paragraph per line); plain strings pass through. */
export const descriptionText = (v: unknown): string | null =>
  typeof v === 'string' ? v : v && typeof v === 'object' ? lexicalToPlainText(v) || null : null

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
  /** QA verdict, commit and report link (Drive / #qa post), when QA has run. */
  qa: { status: string; commit: string | null; reportLink: string | null } | null
  /** Why the task is in waitingOnChance; null when it isn't. */
  waitingReason: 'status' | 'qa-pass' | null
  /** `drive deliverable:` / `drive internal:` lines: task description (last wins), else botContext. */
  drive: DriveLinks
  /** Newest `next:` / `decision:` / `result:` / `left off` lines appended to the task description. */
  latest: LatestNotes
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
  qa?: { status?: string | null; commit?: string | null; reportLink?: string | null } | null
  /** Task description; the poller appends `drive deliverable:` / `drive internal:` lines here. */
  description?: string | null
  botContext?: RawBotContext
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

/** A Discord message link (`discord.com/channels/<guild>/<channel>/<message>`): how a #qa post is linked. */
const QA_POST_LINK = /^https:\/\/(?:www\.|ptb\.|canary\.)?discord(?:app)?\.com\/channels\/\d+\/\d+\/\d+/i

export const isQaPostLink = (v: unknown): boolean => typeof v === 'string' && QA_POST_LINK.test(v.trim())

/**
 * Why an open task is waiting on Chance, or null. The `waiting-chance` status
 * wins; otherwise QA PASS plus a #qa post link means the push ask is in #qa.
 */
export function waitingReasonOf(t: Pick<RawTask, 'status' | 'qa'>): DigestTask['waitingReason'] {
  if (!isOpenTaskStatus(t.status)) return null
  if (t.status === 'waiting-chance') return 'status'
  if (t.qa?.status === 'pass' && isQaPostLink(t.qa.reportLink)) return 'qa-pass'
  return null
}

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
      const waitingReason = waitingReasonOf(t)
      counts.open++
      // A QA-pass row is counted as waiting, not as its raw status, so the buckets still sum to `open`.
      counts[waitingReason === 'qa-pass' ? 'waitingChance' : (COUNT_KEY[status] ?? 'other')]++
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
        qa: t.qa
          ? { status: t.qa.status ?? 'pending', commit: t.qa.commit ?? null, reportLink: t.qa.reportLink ?? null }
          : null,
        waitingReason,
        drive: driveLinksOf(t.botContext ?? null, t.description),
        latest: latestNotesOf(t.description),
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
      waitingOnChance: rows.filter((t) => t.waitingReason !== null),
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


// ── Recent work: the N most recently updated tasks, any status, any client ──

export type RawBotContext = {
  brief?: string | null
  repo?: string | null
  branch?: string | null
  liveUrl?: string | null
  decisions?: string | null
  notes?: string | null
} | null

export type RawRecentTask = RawTask & {
  completedAt?: string | null
  botContext?: RawBotContext
}

export type RecentWorkRow = {
  id: string
  title: string
  status: string
  ownerBot: string | null
  ccqTaskId: string | null
  project: { id: string; name: string | null } | null
  client: { id: string; name: string | null } | null
  /** One line: botContext `Result:` line, else the first line of notes, else brief. */
  result: string | null
  /** QA commit, else a `Commit:` line in botContext. */
  commit: string | null
  /** Task botContext.liveUrl, else the project's. */
  liveUrl: string | null
  /** qa.reportLink (go-live recap / #qa post / Drive QA report), else a `Recap:` / `QA:` line. */
  recapOrQaLink: string | null
  qaStatus: string | null
  /** `drive deliverable:` / `drive internal:` lines: task description (last wins), else botContext. */
  drive: DriveLinks
  /** Newest `next:` / `decision:` / `result:` / `left off` lines appended to the task description. */
  latest: LatestNotes
  /** A `Key file:` / `File:` line in botContext. */
  keyFile: string | null
  repo: string | null
  branch: string | null
  updatedAt: string | null
  completedAt: string | null
}

const ONE_LINE_MAX = 200
const oneLine = (v: string): string => {
  const s = v.replace(/\s+/g, ' ').trim()
  return s.length > ONE_LINE_MAX ? `${s.slice(0, ONE_LINE_MAX - 1)}…` : s
}

/** botContext text blocks searched for `Label: value` lines, in order of trust. */
const bcText = (bc: RawBotContext): string[] =>
  bc ? [bc.notes, bc.decisions, bc.brief].filter((x): x is string => typeof x === 'string' && x.trim() !== '') : []

/** First `Label: value` line (case-insensitive, optional leading `-`/`*`) across the botContext texts. */
export function labeledLine(bc: RawBotContext, labels: string[]): string | null {
  const re = new RegExp(`^\\s*[-*]?\\s*(?:${labels.join('|')})\\s*[:=]\\s*(.+?)\\s*$`, 'im')
  for (const text of bcText(bc)) {
    const m = re.exec(text)
    if (m?.[1]) return oneLine(m[1].replace(/^`(.*)`$/, '$1'))
  }
  return null
}


export function resultOf(bc: RawBotContext): string | null {
  const labeled = labeledLine(bc, ['result', 'outcome'])
  if (labeled) return labeled
  const firstNote = bc?.notes?.split('\n').map((l) => l.trim()).find(Boolean)
  if (firstNote) return oneLine(firstNote)
  const brief = bc?.brief?.trim()
  return brief ? oneLine(brief.split('\n')[0] ?? brief) : null
}

/**
 * Typed Drive links. The poller appends `drive deliverable: <link>` (client-facing
 * deliverable) and `drive internal: <link>` (team-only) lines to the task
 * description, so the LAST such description line wins (newest upload). botContext
 * note lines are the fallback for tasks that recorded links there.
 */
export type DriveLinks = { deliverable: string | null; internal: string | null }

/** Last `label: value` line in free text (case-insensitive, optional `-`/`*` bullet); skips `<link>` placeholders. */
export function lastLabeledLine(text: string | null | undefined, label: string): string | null {
  if (!text) return null
  const re = new RegExp(`^\\s*[-*]?\\s*${label}\\s*[:=]\\s*(.+?)\\s*$`, 'gim')
  let found: string | null = null
  for (const m of text.matchAll(re)) {
    const v = (m[1] ?? '').replace(/^`(.*)`$/, '$1').trim()
    if (v && !/^<[^>]*>$/.test(v)) found = oneLine(v)
  }
  return found
}

export function driveLinksOf(bc: RawBotContext, description?: string | null): DriveLinks {
  return {
    deliverable: lastLabeledLine(description, 'drive deliverable') ?? labeledLine(bc, ['drive deliverable']),
    internal: lastLabeledLine(description, 'drive internal') ?? labeledLine(bc, ['drive internal']),
  }
}

/**
 * The newest note lines agents append to a task description (append-only; readers take the LAST one):
 *   `next: <who>: <step>`, `decision: ...`, `result: ...`, and the Stop hook's
 *   `left off <YYYY-MM-DD HH:MM PT>: <state> | next: ... | commit: ... | result: ...`.
 * A `left off` line's `next:` / `result:` segments count as next/result lines at that position; `-` means none.
 */
export type LatestNotes = {
  next: string | null
  decision: string | null
  result: string | null
  /** The newest `left off` line, without the `left off` prefix. */
  leftOff: string | null
}

const NOTE_LINE = /^\s*[-*>]?\s*(next|decision|result)\s*:\s*(.+?)\s*$/i
const LEFT_OFF_LINE = /^\s*[-*>]?\s*left off\s+(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?:\s*[A-Z]{2,4})?)\s*:\s*(.*?)\s*$/i

const noteValue = (v: string | undefined): string | null => {
  const s = (v ?? '').replace(/^`(.*)`$/, '$1').trim()
  return !s || s === '-' || /^<[^>]*>$/.test(s) ? null : oneLine(s)
}

export function latestNotesOf(description: string | null | undefined): LatestNotes {
  const out: LatestNotes = { next: null, decision: null, result: null, leftOff: null }
  if (!description) return out
  for (const line of description.split('\n')) {
    const lo = LEFT_OFF_LINE.exec(line)
    if (lo) {
      out.leftOff = oneLine(`${lo[1]}: ${lo[2] ?? ''}`)
      for (const seg of (lo[2] ?? '').split('|').slice(1)) {
        const m = /^\s*(next|result)\s*:\s*(.*)$/i.exec(seg)
        const v = m ? noteValue(m[2]) : null
        if (m && v) out[m[1]!.toLowerCase() as 'next' | 'result'] = v
      }
      continue
    }
    const m = NOTE_LINE.exec(line)
    const v = m ? noteValue(m[2]) : null
    if (m && v) out[m[1]!.toLowerCase() as 'next' | 'decision' | 'result'] = v
  }
  return out
}

export function buildRecentWork(input: {
  tasks: RawRecentTask[]
  projects: Array<{ id: string; name?: string | null; clientAccountId: string | null; liveUrl?: string | null }>
  clients: RawClient[]
  limit?: number
}): RecentWorkRow[] {
  const limit = Math.max(1, input.limit ?? 20)
  const projectById = new Map(input.projects.map((p) => [p.id, p]))
  const clientById = new Map(input.clients.map((c) => [c.id, c]))
  return [...input.tasks]
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || b.id.localeCompare(a.id))
    .slice(0, limit)
    .map((t) => {
      const bc = t.botContext ?? null
      const p = t.projectId ? projectById.get(t.projectId) : undefined
      const clientId = p?.clientAccountId ?? null
      const c = clientId ? clientById.get(clientId) : undefined
      return {
        id: t.id,
        title: t.title ?? '(untitled)',
        status: t.status ?? 'pending',
        ownerBot: t.ownerBot ?? null,
        ccqTaskId: t.ccqTaskId ?? null,
        project: t.projectId ? { id: t.projectId, name: p?.name ?? null } : null,
        client: clientId ? { id: clientId, name: c?.name ?? null } : null,
        result: resultOf(bc),
        commit: t.qa?.commit || labeledLine(bc, ['commit', 'sha']),
        liveUrl: bc?.liveUrl || labeledLine(bc, ['live url', 'live link']) || p?.liveUrl || null,
        recapOrQaLink: t.qa?.reportLink || labeledLine(bc, ['recap', 'go-live', '#qa', 'qa post', 'qa link']),
        qaStatus: t.qa?.status ?? null,
        drive: driveLinksOf(bc, t.description),
        latest: latestNotesOf(t.description),
        keyFile: labeledLine(bc, ['key file', 'file', 'path']),
        repo: bc?.repo || null,
        branch: bc?.branch || null,
        updatedAt: t.updatedAt ?? null,
        completedAt: t.completedAt ?? null,
      }
    })
}
