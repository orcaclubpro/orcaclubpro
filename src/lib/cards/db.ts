/**
 * Optional second Mongo database (CARDS_DATABASE_URI) holding request cards and
 * an append-only progress log. A plain MongoClient, not a Payload adapter; ids
 * into the portal DB are plain strings.
 *
 * Unset env: nothing connects, logs or throws. Set: connects on first use.
 * Writes are best-effort and awaited (a serverless function can freeze before a
 * detached promise runs): they never throw and give up after WRITE_BUDGET_MS,
 * so a cards-DB failure can't fail or stall the task write that triggered it.
 */
import { MongoClient, type Db } from 'mongodb'

import { eventsAdded, parseCard, parseEventLine, type ParsedEvent } from '@/lib/cards/parse'

const SERVER_TIMEOUT_MS = 2_000
const WRITE_BUDGET_MS = 4_000

export type TaskRefs = { taskId: string; projectId: string | null; clientAccountId: string | null }

export const cardsEnabled = (): boolean => Boolean(process.env.CARDS_DATABASE_URI?.trim())

let cached: { uri: string; client: MongoClient; db: Promise<Db> } | null = null

function openDb(uri: string): Promise<Db> {
  // Without a database name the driver silently writes to `test`.
  if (!/^mongodb(\+srv)?:\/\/[^/?]+\/[^/?]+/.test(uri)) {
    return Promise.reject(new Error('CARDS_DATABASE_URI must name a database'))
  }
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: SERVER_TIMEOUT_MS,
    connectTimeoutMS: SERVER_TIMEOUT_MS,
    maxPoolSize: 5,
  })
  const entry = {
    uri,
    client,
    db: (async () => {
      await client.connect()
      const db = client.db()
      await Promise.all([
        db.collection('cards').createIndex({ slug: 1, version: 1 }, { unique: true }),
        db.collection('cards').createIndex({ taskId: 1 }),
        db.collection('task_events').createIndex({ taskId: 1, at: -1 }),
      ])
      return db
    })(),
  }
  cached = entry
  // A failed connect isn't kept, so the next write tries again.
  entry.db.catch(() => {
    if (cached === entry) cached = null
    void client.close().catch(() => undefined)
  })
  return entry.db
}

function getDb(): Promise<Db> {
  const uri = process.env.CARDS_DATABASE_URI!.trim()
  return cached?.uri === uri ? cached.db : openDb(uri)
}

/** Closes the connection; the next use reconnects. */
export async function closeCardsDb(): Promise<void> {
  const entry = cached
  cached = null
  await entry?.client.close().catch(() => undefined)
}

function withBudget<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${WRITE_BUDGET_MS}ms`)), WRITE_BUDGET_MS)
  })
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer))
}

/** Driver errors can quote the connection string. */
const safeMessage = (e: unknown) =>
  (e instanceof Error ? e.message : String(e)).replace(/mongodb(\+srv)?:\/\/\S+/g, '[uri]')

async function bestEffort(label: string, write: (db: Db) => Promise<unknown>): Promise<void> {
  if (!cardsEnabled()) return
  try {
    await withBudget(getDb().then(write))
  } catch (e) {
    console.error(`[cards-db] ${label} failed: ${safeMessage(e)}`)
  }
}

// ── Writes (never throw) ──────────────────────────────────────────────────────

/** Saves the card when a new task's description is a request card. slug+version is the key. */
export async function recordCard(refs: TaskRefs & { description: string | undefined }): Promise<void> {
  await bestEffort('card write', async (db) => {
    const card = parseCard(refs.description)
    if (!card) return
    const { slug, version, ...fields } = card
    const now = new Date()
    await db.collection('cards').updateOne(
      { slug, version },
      {
        $set: {
          ...fields,
          taskId: refs.taskId,
          projectId: refs.projectId,
          clientAccountId: refs.clientAccountId,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    )
  })
}

async function insertEvents(db: Db, refs: TaskRefs, actor: string, events: Array<ParsedEvent & { at: Date }>) {
  if (!events.length) return
  await db.collection('task_events').insertMany(
    events.map((e) => ({
      taskId: refs.taskId,
      projectId: refs.projectId,
      clientAccountId: refs.clientAccountId,
      kind: e.kind,
      text: e.text,
      actor,
      at: e.at,
    })),
  )
}

/** One event per next / left-off / result / decision line a description update added. */
export async function recordDescriptionEvents(
  refs: TaskRefs & { before: unknown; after: string; actor: string },
): Promise<void> {
  await bestEffort('event write', (db) => {
    const at = new Date()
    return insertEvents(db, refs, refs.actor, eventsAdded(refs.before, refs.after).map((e) => ({ ...e, at })))
  })
}

/** One event per next / left-off / result / decision line in rows added by task_add_items. */
export async function recordNoteEvents(
  refs: TaskRefs & { rows: Array<{ words: string; at: Date }>; actor: string },
): Promise<void> {
  await bestEffort('event write', (db) =>
    insertEvents(
      db,
      refs,
      refs.actor,
      refs.rows.flatMap((row) =>
        row.words.split(/\r?\n/).flatMap((line) => {
          const event = parseEventLine(line)
          return event ? [{ ...event, at: row.at }] : []
        }),
      ),
    ),
  )
}

// ── Reads (throw on failure; callers check cardsEnabled first) ────────────────

const NO_ID = { projection: { _id: 0 } }

/** One card by slug; the newest version when `version` is omitted. */
export function findCard(slug: string, version?: number) {
  return withBudget(
    getDb().then((db) =>
      db
        .collection('cards')
        .findOne(version === undefined ? { slug } : { slug, version }, { ...NO_ID, sort: { version: -1 } }),
    ),
  )
}

export function findCardsByTask(taskId: string) {
  return withBudget(
    getDb().then((db) => db.collection('cards').find({ taskId }, NO_ID).sort({ version: -1 }).limit(100).toArray()),
  )
}

/** A task's events, newest first. */
export function findTaskEvents(taskId: string, limit: number) {
  return withBudget(
    getDb().then((db) => db.collection('task_events').find({ taskId }, NO_ID).sort({ at: -1 }).limit(limit).toArray()),
  )
}
