/**
 * Structured task fields (board 6aea1fd4, Chance Nov 3 2026; handbook RULES "Tasks are
 * living", 6ce72d3): ask (locked), lead, askUpdates[], deliverables[], checklist[],
 * changes[], screens[] and version on the `tasks` collection.
 *
 * - `ask` is the request in the asker's words, locked once set. Direction changes
 *   go in askUpdates[] (append-only). Every edit adds a changes[] line (append-only)
 *   and bumps `version`.
 * - Deliverables and checklist items are open | done | dropped. Dropped items stay
 *   visible with a reason, never deleted. Each item has an owner (dev | cm | fin |
 *   <bot>; untagged = dev) and addedBy.
 * - Intake: a new task needs an Ask, at least 1 deliverable and at least 1 checklist
 *   item, NO upper cap (Chance 11:46 AM PT). Read-only work is exempt, as in the
 *   poller (orca-ops dispatch.py template_missing, 527f3d8).
 * - Close gate: a task completes only when every non-dropped item is done; a task
 *   that touches prices, terms, hours, invoices or tax needs a [fin] money check item.
 * - Now block: built (never hand-written) from the newest lane-tagged lines in the
 *   description: `next [lane]:`, `left off [lane] <time>:`, `result [lane]:`.
 * - Text format both ways: "- [ ] [dev] item — proof: ..." ([x] done, [~] dropped).
 *
 * Pure functions only (unit-tested in structure.test.ts, DB-tested in structure.int.test.ts).
 */
import { randomBytes } from 'node:crypto'

export const LIMITS = {
  ask: 4000,
  itemText: 1000,
  link: 2000,
  words: 2000,
  source: 300,
  caption: 300,
  owner: 64,
  /** Items per add call, to keep one bad loop from writing thousands of rows. */
  perCall: 50,
} as const

export const ITEM_STATUS = ['open', 'done', 'dropped'] as const
export type ItemStatus = (typeof ITEM_STATUS)[number]
export type ItemKind = 'deliverable' | 'checklist'

export type ItemIn = {
  text: string
  status?: ItemStatus
  /** Shorthand for status done/open (older callers). */
  done?: boolean
  dropReason?: string | null
  owner?: string | null
  link?: string | null
  proof?: string | null
}
export type NoteIn = { words: string; source: string; at?: string | null }
export type ScreenIn = { path: string; caption?: string | null; discordLink?: string | null; sentToDrive?: boolean }

export type Item = {
  id: string
  text: string
  status: ItemStatus
  dropReason: string | null
  owner: string
  addedBy: string | null
  link?: string | null
  proof?: string | null
}
export type AskUpdate = { id: string; at: Date; words: string; source: string }
export type Change = { id: string; at: Date; words: string; source: string; by: string | null }
export type Screen = { id: string; path: string; caption: string | null; discordLink: string | null; sentToDrive: boolean }

/** ObjectId-shaped row id (4-byte time + 8 random bytes), the form Payload gives array rows. */
export const rowId = () =>
  Math.floor(Date.now() / 1000).toString(16).padStart(8, '0') + randomBytes(8).toString('hex')
const clean = (s: unknown) => (typeof s === 'string' ? s.trim() : '')
const opt = (s: unknown) => clean(s) || null

export class StructureError extends Error {}

function need(value: unknown, what: string, max: number): string {
  const v = clean(value)
  if (!v) throw new StructureError(`${what} is required`)
  if (v.length > max) throw new StructureError(`${what} is longer than ${max} characters`)
  return v
}

function maybe(value: unknown, what: string, max: number): string | null {
  const v = clean(value)
  if (v.length > max) throw new StructureError(`${what} is longer than ${max} characters`)
  return v || null
}

/** Item owner: a lane (dev, cm, fin) or a bot name; blank = dev. */
export function normalizeOwner(owner: unknown): string {
  const v = clean(owner).toLowerCase().replace(/^\[|\]$/g, '')
  if (!v) return 'dev'
  if (v.length > LIMITS.owner || !/^[a-z0-9][\w.-]*$/.test(v)) throw new StructureError(`Bad item owner: ${String(owner)}`)
  return v
}

// ── Text format: "- [ ] [dev] item — proof: ..." ──────────────────────────────

const TAG = /^\[([A-Za-z][\w.-]*)\][ \t]+/
const SEP = String.raw`[ \t]+(?:—|--)[ \t]+(?:proof|link|dropped|added by)\b`
/** The LAST "— key: value" suffix on a line (the value may not contain another one). */
const SUFFIX = new RegExp(String.raw`[ \t]+(?:—|--)[ \t]+(proof|link|dropped|added by)[ \t]*:?[ \t]*((?:(?!${SEP}).)*)$`, 'i')

/** One list line → item fields. Untagged = dev; [x] = done; [~] or "— dropped: why" = dropped. */
export function parseItemLine(line: string): Omit<Item, 'id' | 'addedBy'> & { addedBy: string | null } {
  let s = line.replace(/^[ \t]*(?:[-*+][ \t]*)?(?:\d+[.)][ \t]*)?/, '')
  let status: ItemStatus = 'open'
  const box = /^\[([ xX~])\][ \t]*/.exec(s)
  if (box) {
    status = box[1] === '~' ? 'dropped' : box[1].trim() ? 'done' : 'open'
    s = s.slice(box[0].length)
  }
  let owner = 'dev'
  const tag = TAG.exec(s)
  if (tag) {
    owner = tag[1].toLowerCase()
    s = s.slice(tag[0].length)
  }
  let proof: string | null = null
  let dropReason: string | null = null
  let addedBy: string | null = null
  // Suffixes peel off right to left: "text — added by gojo: why — proof: sha".
  for (let m = SUFFIX.exec(s); m; m = SUFFIX.exec(s)) {
    const key = m[1].toLowerCase()
    const val = m[2].trim() || null
    if (key === 'proof' || key === 'link') proof = val
    else if (key === 'dropped') {
      status = 'dropped'
      dropReason = val
    } else addedBy = val ? val.split(/[ :]/)[0].toLowerCase() : null
    s = s.slice(0, m.index)
  }
  // Older form: "text. Proof: x" with no dash.
  const legacy = /^(.*?)[ \t]*\bProof:[ \t]*(.*)$/i.exec(s)
  if (legacy && !proof) {
    s = legacy[1]
    proof = legacy[2].trim() || null
  }
  return { text: s.trim(), status, dropReason, owner, addedBy, proof, link: proof }
}

/** Item → one handbook-format line. */
export function renderItem(item: Pick<Item, 'text' | 'status' | 'owner'> & Partial<Item>, kind: ItemKind = 'checklist') {
  const box = item.status === 'done' ? '[x]' : item.status === 'dropped' ? '[~]' : '[ ]'
  let line = `- ${box} [${item.owner || 'dev'}] ${item.text}`
  if (item.addedBy) line += ` — added by ${item.addedBy}`
  const ref = kind === 'deliverable' ? item.link : item.proof
  if (ref) line += ` — ${kind === 'deliverable' ? 'link' : 'proof'}: ${ref}`
  if (item.status === 'dropped') line += ` — dropped: ${item.dropReason ?? ''}`.trimEnd()
  return line
}

// ── Text template (ports of the poller's regexes) ─────────────────────────────

const SECTION_HEAD =
  /^[ \t]*(?:#+[ \t]*)?(?:\*\*)?(Ask|Deliverables|Checklist|Changes)\b(?:\*\*)?[ \t]*:?(?:\*\*)?[ \t]*(.*)$/i
const SECTION_END = /^[ \t>*-]*(?:next|result|left off)\b[^:\n]*:|^[ \t]*#+[ \t]|^[ \t]*\[[\w .:/-]+\][ \t]/i
const LIST_ITEM = /^[ \t]*(?:[-*+]|\d+[.)]|\[[ xX~]\])[ \t]*\S/
const READ_ONLY = /\bread[- ]?only\b|\breview\b|\bdiagnos(?:is|e|tic|ing)\b|no approval needed/i

export type SectionName = 'Ask' | 'Deliverables' | 'Checklist' | 'Changes'
const capitalize = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) as SectionName

/** {section: body} for the template sections present; the first occurrence of each wins (poller template_sections). */
export function templateSections(desc: string | null | undefined): Partial<Record<SectionName, string>> {
  const out: Partial<Record<SectionName, string>> = {}
  let cur: SectionName | null = null
  let buf: string[] = []
  const flush = () => {
    if (cur && !(cur in out)) out[cur] = buf.join('\n').trim()
  }
  for (const ln of (desc ?? '').split(/\r?\n/)) {
    const m = SECTION_HEAD.exec(ln)
    if (m) {
      flush()
      cur = capitalize(m[1])
      buf = m[2].trim() ? [m[2]] : []
    } else if (cur && SECTION_END.test(ln)) {
      flush()
      cur = null
      buf = []
    } else if (cur) {
      buf.push(ln)
    }
  }
  flush()
  return out
}

const nonEmptyLines = (body: string | null | undefined) => (body ?? '').split(/\r?\n/).filter((ln) => ln.trim())

/** List items in a section body (poller checklist_count, 527f3d8): plain text with no list counts one item per line. */
export function listCount(body: string | null | undefined): number {
  const lines = nonEmptyLines(body)
  return lines.filter((ln) => LIST_ITEM.test(ln)).length || lines.length
}

export const isReadOnlyTask = (title: string | null | undefined, desc: string | null | undefined) =>
  READ_ONLY.test(`${title ?? ''}\n${desc ?? ''}`)

function listLines(body: string): string[] {
  const lines = nonEmptyLines(body)
  const listed = lines.filter((ln) => LIST_ITEM.test(ln))
  return listed.length ? listed : lines
}

/** Splits "(1) a; (2) b." into ["a", "b"]; a body with no markers is one item. */
function numberedParts(body: string): string[] {
  const parts = body.split(/\(\d+\)\s*/).map((p) => p.trim().replace(/[;,]\s*$/, '').trim())
  const hits = parts.slice(1).filter(Boolean)
  return hits.length ? hits : [body.trim()].filter(Boolean)
}

const toItemIn = (p: ReturnType<typeof parseItemLine>, kind: ItemKind): ItemIn => ({
  text: p.text,
  status: p.status,
  owner: p.owner,
  dropReason: p.dropReason,
  ...(kind === 'deliverable' ? { link: p.proof } : { proof: p.proof }),
})

/** Structured fields read from the text template (used on create and by the backfill). */
export function fromTemplate(desc: string | null | undefined): {
  ask: string | null
  deliverables: ItemIn[]
  checklist: ItemIn[]
  changes: NoteIn[]
} {
  const s = templateSections(desc)
  const deliverBody = s.Deliverables ?? ''
  const deliverables = nonEmptyLines(deliverBody).some((ln) => LIST_ITEM.test(ln))
    ? listLines(deliverBody).map((ln) => toItemIn(parseItemLine(ln), 'deliverable'))
    : numberedParts(deliverBody).map((text) => ({ text, owner: 'dev' }))
  const checklist = listLines(s.Checklist ?? '')
    .map((ln) => toItemIn(parseItemLine(ln), 'checklist'))
    .filter((i) => i.text)
  const changes = listLines(s.Changes ?? '')
    .map((ln) => ln.replace(/^[ \t]*[-*+][ \t]*/, '').trim())
    .filter(Boolean)
    .map((words) => ({ words, source: 'description' }))
  return { ask: opt(s.Ask), deliverables: deliverables.filter((d) => d.text), checklist, changes }
}

// ── Intake ────────────────────────────────────────────────────────────────────

/** What a new task is missing, in the poller's wording ([] = accepted). Structured input wins; text is the fallback. */
export function intakeMissing(input: {
  title?: string | null
  description?: string | null
  ask?: string | null
  deliverables?: unknown[] | null
  checklist?: unknown[] | null
}): string[] {
  if (isReadOnlyTask(input.title, input.description)) return []
  const s = templateSections(input.description)
  const miss: string[] = []
  if (!clean(input.ask) && !clean(s.Ask)) miss.push('Ask')
  if (!input.deliverables?.length && !clean(s.Deliverables)) miss.push('Deliverables')
  if (!input.checklist?.length && listCount(s.Checklist) < 1) miss.push('Checklist')
  return miss
}

// ── Close gate ────────────────────────────────────────────────────────────────

const MONEY = /\b(?:prices?|pricing|terms|hours|invoices?|invoicing|tax(?:es)?)\b/i

/** Does this task touch prices, terms, hours, invoices or tax (handbook 6ce72d3)? Checks title, ask and askUpdates. */
export function touchesMoney(t: Record<string, any>): boolean {
  const text = [t.title, t.ask, ...(Array.isArray(t.askUpdates) ? t.askUpdates.map((u: any) => u?.words) : [])]
    .filter((x) => typeof x === 'string')
    .join('\n')
  return MONEY.test(text)
}

const itemsOf = (t: Record<string, any>) =>
  [
    ...(Array.isArray(t.deliverables) ? t.deliverables : []).map((i: any) => ({ ...i, kind: 'deliverable' })),
    ...(Array.isArray(t.checklist) ? t.checklist : []).map((i: any) => ({ ...i, kind: 'checklist' })),
  ] as (Item & { kind: ItemKind })[]

/** Reasons a task can't complete yet ([] = it may). Legacy tasks with no items pass (their text is not gated here). */
export function closeGateMissing(t: Record<string, any>): string[] {
  const items = itemsOf(t)
  if (!items.length) return []
  const miss = items
    .filter((i) => statusOf(i) === 'open')
    .map((i) => `${i.kind} [${i.owner || 'dev'}] ${i.text}`)
  if (touchesMoney(t) && !items.some((i) => (i.owner || 'dev') === 'fin' && statusOf(i) !== 'dropped')) {
    miss.push('a [fin] money check item (the task touches prices, terms, hours, invoices or tax)')
  }
  return miss
}

// ── Row builders ──────────────────────────────────────────────────────────────

const statusOf = (i: { status?: unknown; done?: unknown }): ItemStatus =>
  ITEM_STATUS.includes(i.status as ItemStatus) ? (i.status as ItemStatus) : i.done ? 'done' : 'open'

export function buildItem(kind: ItemKind, d: ItemIn, addedBy: string | null): Item {
  const status = d.status ?? (d.done ? 'done' : 'open')
  if (!ITEM_STATUS.includes(status)) throw new StructureError(`Bad item status: ${status}`)
  const dropReason = maybe(d.dropReason, 'dropReason', LIMITS.words)
  if (status === 'dropped' && !dropReason) throw new StructureError('A dropped item needs a dropReason')
  const ref = maybe(kind === 'deliverable' ? d.link : d.proof, kind === 'deliverable' ? 'link' : 'proof', LIMITS.link)
  return {
    id: rowId(),
    text: need(d.text, `${kind} text`, LIMITS.itemText),
    status,
    dropReason: status === 'dropped' ? dropReason : null,
    owner: normalizeOwner(d.owner),
    addedBy,
    ...(kind === 'deliverable' ? { link: ref } : { proof: ref }),
  }
}

export function buildNote<T extends 'askUpdate' | 'change'>(
  kind: T,
  c: NoteIn,
  by: string | null,
  now: Date,
): T extends 'change' ? Change : AskUpdate {
  const at = c.at ? new Date(c.at) : now
  if (Number.isNaN(at.getTime())) throw new StructureError(`Date is not a date: ${c.at}`)
  const row: any = {
    id: rowId(),
    at,
    words: need(c.words, `${kind} words`, LIMITS.words),
    source: need(c.source, `${kind} source`, LIMITS.source),
  }
  if (kind === 'change') row.by = by
  return row
}

const SHOTS_ROOT = /^(?:~|\/home\/[A-Za-z0-9._-]+)\/dev\/orca\/qa\/ccrecap-shots\//
const IMAGE = /\.(?:png|jpe?g|webp|gif)$/i
const DISCORD = /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/\d+\/\d+(?:\/\d+)?$/

export function screenPathError(path: string): string | null {
  if (!SHOTS_ROOT.test(path)) return `Screen path must be under ~/dev/orca/qa/ccrecap-shots/ (got ${path})`
  if (path.split('/').some((seg) => seg === '..' || seg === '.')) return `Screen path may not contain . or .. (${path})`
  if (/[\0\r\n]/.test(path)) return 'Screen path has a control character'
  if (!IMAGE.test(path)) return `Screen path must be an image (.png, .jpg, .webp, .gif): ${path}`
  return null
}

function discord(v: unknown): string | null {
  const link = maybe(v, 'discordLink', LIMITS.link)
  if (link && !DISCORD.test(link)) throw new StructureError(`discordLink must be a discord.com/channels/… link (got ${link})`)
  return link
}

export function buildScreen(s: ScreenIn): Screen {
  const path = need(s.path, 'Screen path', LIMITS.link)
  const err = screenPathError(path)
  if (err) throw new StructureError(err)
  return {
    id: rowId(),
    path,
    caption: maybe(s.caption, 'Screen caption', LIMITS.caption),
    discordLink: discord(s.discordLink),
    sentToDrive: Boolean(s.sentToDrive),
  }
}

// ── task_add_items: appends ───────────────────────────────────────────────────

export type AddItemsInput = {
  askUpdates?: NoteIn[]
  deliverables?: ItemIn[]
  checklist?: ItemIn[]
  changes?: NoteIn[]
  screens?: ScreenIn[]
}
export type AddedRows = {
  askUpdates: AskUpdate[]
  deliverables: Item[]
  checklist: Item[]
  changes: Change[]
  screens: Screen[]
  skippedScreens: string[]
}
const ADD_KEYS = ['askUpdates', 'deliverables', 'checklist', 'changes', 'screens'] as const

export function countAdds(input: AddItemsInput) {
  return ADD_KEYS.reduce((n, k) => n + (input[k]?.length ?? 0), 0)
}

/** Validated, stamped rows for one call. Screens whose path is already on the task (or repeated) are skipped. */
export function buildAddItems(
  input: AddItemsInput,
  actor: string | null,
  now: Date,
  existingScreenPaths: Iterable<string> = [],
): AddedRows {
  if (countAdds(input) > LIMITS.perCall) throw new StructureError(`At most ${LIMITS.perCall} items per call`)
  const seen = new Set(existingScreenPaths)
  const screens: Screen[] = []
  const skippedScreens: string[] = []
  for (const s of input.screens ?? []) {
    const row = buildScreen(s)
    if (seen.has(row.path)) {
      skippedScreens.push(row.path)
      continue
    }
    seen.add(row.path)
    screens.push(row)
  }
  return {
    askUpdates: (input.askUpdates ?? []).map((c) => buildNote('askUpdate', c, actor, now)),
    deliverables: (input.deliverables ?? []).map((d) => buildItem('deliverable', d, actor)),
    checklist: (input.checklist ?? []).map((d) => buildItem('checklist', d, actor)),
    changes: (input.changes ?? []).map((c) => buildNote('change', c, actor, now)),
    screens,
    skippedScreens,
  }
}

// ── task_add_items: edits by row id ───────────────────────────────────────────

export type ItemPatch = {
  kind: 'deliverable' | 'checklist' | 'screen'
  id: string
  text?: string
  status?: ItemStatus
  done?: boolean
  dropReason?: string | null
  owner?: string
  link?: string | null
  proof?: string | null
  caption?: string | null
  discordLink?: string | null
  sentToDrive?: boolean
}

export const ARRAY_OF = { deliverable: 'deliverables', checklist: 'checklist', screen: 'screens' } as const
const ALLOWED: Record<ItemPatch['kind'], (keyof ItemPatch)[]> = {
  deliverable: ['text', 'status', 'done', 'dropReason', 'owner', 'link'],
  checklist: ['text', 'status', 'done', 'dropReason', 'owner', 'proof'],
  screen: ['caption', 'discordLink', 'sentToDrive'],
}

/** `$set` + arrayFilters for row edits; each patch touches only the fields it names. Also a one-line summary per patch. */
export function patchUpdate(patches: ItemPatch[]) {
  if (patches.length > LIMITS.perCall) throw new StructureError(`At most ${LIMITS.perCall} item edits per call`)
  const $set: Record<string, unknown> = {}
  const arrayFilters: Record<string, string>[] = []
  const said: string[] = []
  patches.forEach((p, i) => {
    if (!/^[a-f0-9]{24}$/i.test(p.id)) throw new StructureError(`Item id ${p.id} is not a row id`)
    const arr = ARRAY_OF[p.kind]
    if (!arr) throw new StructureError(`Unknown item kind ${String(p.kind)}`)
    const extra = (Object.keys(p) as (keyof ItemPatch)[]).filter(
      (k) => k !== 'kind' && k !== 'id' && p[k] !== undefined && !ALLOWED[p.kind].includes(k),
    )
    if (extra.length) throw new StructureError(`${p.kind} items don't take ${extra.join(', ')}`)
    const at = `${arr}.$[i${i}]`
    const set = (k: string, v: unknown) => ($set[`${at}.${k}`] = v)
    const bits: string[] = []
    let status = p.status ?? (p.done === undefined ? undefined : p.done ? 'done' : 'open')
    if (status !== undefined) {
      if (!ITEM_STATUS.includes(status)) throw new StructureError(`Bad item status: ${status}`)
      const reason = maybe(p.dropReason, 'dropReason', LIMITS.words)
      if (status === 'dropped' && !reason) throw new StructureError(`Dropping ${p.kind} ${p.id} needs a dropReason`)
      set('status', status)
      set('dropReason', status === 'dropped' ? reason : null)
      bits.push(status === 'dropped' ? `dropped (${reason})` : status)
    } else if (p.dropReason !== undefined) throw new StructureError('dropReason goes with status: "dropped"')
    if (p.text !== undefined) {
      set('text', need(p.text, `${p.kind} text`, LIMITS.itemText))
      bits.push('reworded')
    }
    if (p.owner !== undefined) {
      const o = normalizeOwner(p.owner)
      set('owner', o)
      bits.push(`owner ${o}`)
    }
    for (const k of ['link', 'proof', 'caption'] as const) {
      if (p[k] === undefined) continue
      set(k, maybe(p[k], k, k === 'caption' ? LIMITS.caption : LIMITS.link))
      bits.push(k)
    }
    if (p.discordLink !== undefined) {
      set('discordLink', discord(p.discordLink))
      bits.push('discordLink')
    }
    if (p.sentToDrive !== undefined) {
      set('sentToDrive', Boolean(p.sentToDrive))
      bits.push(p.sentToDrive ? 'sent to Drive' : 'not sent to Drive')
    }
    if (!bits.length) throw new StructureError(`Edit for ${p.kind} ${p.id} changes nothing`)
    arrayFilters.push({ [`i${i}.id`]: p.id })
    said.push(`${p.kind} ${p.id.slice(-6)} ${bits.join(', ')}`)
  })
  return { $set, arrayFilters, said }
}

export type Reorder = { kind: ItemKind; ids: string[] }

/** The array in the new order; `ids` must be exactly the current row ids, each once. */
export function reorderRows<T extends { id?: string }>(rows: T[], ids: string[]): T[] {
  const have = rows.map((r) => String(r.id))
  if (ids.length !== have.length || new Set(ids).size !== ids.length || !ids.every((id) => have.includes(id))) {
    throw new StructureError('order must list every current row id exactly once')
  }
  return ids.map((id) => rows.find((r) => String(r.id) === id)!)
}

/** The auto changes[] line words for one add-items call. */
export function describeEdit(added: AddedRows | null, said: string[], reordered: string[]): string {
  const parts: string[] = []
  if (added) {
    for (const k of ['askUpdates', 'deliverables', 'checklist', 'screens'] as const) {
      if (added[k].length) parts.push(`added ${added[k].length} ${k}`)
    }
  }
  parts.push(...said, ...reordered.map((k) => `reordered ${k}`))
  return parts.join('; ')
}

// ── Read side ─────────────────────────────────────────────────────────────────

const LANES = ['dev', 'cm', 'fin'] as const

/** {owner: [done, total]} over non-dropped deliverables + checklist items; dev, cm, fin always present. */
export function laneCounts(t: Record<string, any>): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = Object.fromEntries(LANES.map((l) => [l, [0, 0]]))
  for (const i of itemsOf(t)) {
    const s = statusOf(i)
    if (s === 'dropped') continue
    const o = (i.owner as string) || 'dev'
    out[o] ??= [0, 0]
    out[o][1]++
    if (s === 'done') out[o][0]++
  }
  return out
}

/** "v3, dev 4/6, cm 1/3, fin 0/1" (+ any bot owners). */
export function summaryLine(t: Record<string, any>): string {
  const counts = laneCounts(t)
  return [`v${Number(t.version) || 0}`, ...Object.entries(counts).map(([o, [d, n]]) => `${o} ${d}/${n}`)].join(', ')
}

export function structureProgress(t: Record<string, any>) {
  const items = itemsOf(t)
  const frac = (rows: unknown[]) => {
    const live = (rows as any[]).filter((r) => statusOf(r) !== 'dropped')
    return `${live.filter((r) => statusOf(r) === 'done').length}/${live.length}`
  }
  return {
    structured: Boolean(clean(t.ask) || items.length),
    summary: summaryLine(t),
    deliverables: frac(Array.isArray(t.deliverables) ? t.deliverables : []),
    checklist: frac(Array.isArray(t.checklist) ? t.checklist : []),
    changes: Array.isArray(t.changes) ? t.changes.length : 0,
    screens: Array.isArray(t.screens) ? t.screens.length : 0,
  }
}

export const normItem = (r: any, kind: ItemKind) => ({
  id: String(r?.id ?? ''),
  text: r?.text ?? '',
  status: statusOf(r ?? {}),
  dropReason: r?.dropReason ?? null,
  owner: r?.owner || 'dev',
  addedBy: r?.addedBy ?? null,
  ...(kind === 'deliverable' ? { link: r?.link ?? null } : { proof: r?.proof ?? null }),
  line: renderItem({ ...r, status: statusOf(r ?? {}), owner: r?.owner || 'dev' }, kind),
})

// ── Now block ─────────────────────────────────────────────────────────────────

export type NowLine = {
  lane: string
  /** Who the next step waits on (owner named in `next [lane]: <owner>: …`). */
  waitingOn: string | null
  next: string | null
  leftOff: string | null
  leftOffAt: string | null
  last: string | null
  where: string | null
  line: string
}

const NOW_KINDS = /^[ \t>*-]*(next|left off|result)[ \t]*(?:\[([\w.-]+)\])?[ \t]*((?:\d{1,2}:\d{2}(?::\d{2})?|[^:\n])*?):[ \t]*(.*)$/i

/** Wider than NOW_KINDS on purpose: a left-off line quoted in backticks still counts as one. */
const LEFT_OFF_SEGMENT = /^[ \t>*`-]*left off\b/i

/**
 * One line per lane from the newest lane-tagged lines (description is append-only,
 * so the last occurrence wins). Lines and ' | ' segments both count; untagged = dev.
 * A left-off line is context only: a `next:` segment after `left off` on the same
 * line is ignored, so next / waitingOn come only from real `next:` lines.
 */
export function nowBlock(description: string | null | undefined, where: string | null = null): NowLine[] {
  const lanes = new Map<string, Omit<NowLine, 'line'>>()
  for (const raw of (description ?? '').split(/\r?\n/)) {
    let onLeftOffLine = false
    for (const seg of raw.split(/[ \t]+\|[ \t]+/)) {
      onLeftOffLine ||= LEFT_OFF_SEGMENT.test(seg)
      const m = NOW_KINDS.exec(seg)
      if (!m) continue
      const kind = m[1].toLowerCase()
      if (kind === 'next' && onLeftOffLine) continue
      const lane = (m[2] || 'dev').toLowerCase()
      const between = m[3].trim()
      const body = m[4].trim()
      const cur = lanes.get(lane) ?? { lane, waitingOn: null, next: null, leftOff: null, leftOffAt: null, last: null, where }
      if (kind === 'next') {
        const who = /^([\w.-]+):[ \t]*(.*)$/.exec(body)
        cur.waitingOn = who ? who[1].toLowerCase() : null
        cur.next = who ? who[2] : body
      } else if (kind === 'left off') {
        cur.leftOff = body
        cur.leftOffAt = between || null
      } else cur.last = body
      lanes.set(lane, cur)
    }
  }
  return [...lanes.values()].map((n) => ({
    ...n,
    line: [
      `${n.lane}`,
      n.next ? `next: ${n.waitingOn ? `${n.waitingOn}: ` : ''}${n.next}` : null,
      n.where ? `where: ${n.where}` : null,
      n.waitingOn ? `waiting on: ${n.waitingOn}` : null,
      n.leftOff ? `left off${n.leftOffAt ? ` ${n.leftOffAt}` : ''}: ${n.leftOff}` : null,
      n.last ? `last: ${n.last}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  }))
}

/** Does an item / Now line belong to `who` (a lane or a bot)? Untagged = dev. */
export const ownedBy = (owner: string | null | undefined, who: string) => (owner || 'dev').toLowerCase() === who

/** The owner's slice of one task: its Now lines and its open items. */
export function ownerSlice(t: Record<string, any>, description: string | null, who: string, where: string | null = null) {
  const w = who.toLowerCase()
  const now = nowBlock(description, where).filter((n) => n.lane === w || n.waitingOn === w)
  const open = [
    ...(Array.isArray(t.deliverables) ? t.deliverables : []).map((r: any) => normItem(r, 'deliverable')),
    ...(Array.isArray(t.checklist) ? t.checklist : []).map((r: any) => normItem(r, 'checklist')),
  ].filter((i) => i.status === 'open' && ownedBy(i.owner, w))
  return { now, open }
}
