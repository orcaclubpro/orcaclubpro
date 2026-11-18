/**
 * Carbonara read-view mirror (orcaclub-ops-mcp v3 stage 1a, board 6afce49c).
 *
 * Fedora computes four read views (CARBONARA `core/views`: my_queue, card_get, waiting_on_chance, machine_busy)
 * and pushes them OUTBOUND to `POST /api/ops-views` (CARBONARA `core/board/http.py` publish_views). They are
 * stored here verbatim in the optional cards database (CARDS_DATABASE_URI, collection `ops_views`; not the Payload
 * board schema) and served by the read-only MCP tools ops_my_queue / ops_card_get / ops_waiting_on_chance /
 * ops_machine_busy. The tools return the stored text unchanged, so a bot without Fedora access (Marin, Finn, Toji)
 * reads exactly what Fedora's MCP returns. No write tool exists; the only writer is the publish route, behind the
 * existing staff auth plus the `orca` actor. Views carry no finance data (Fedora strips it before publishing).
 * Retired when the Carbonara MCP moves to Coolify (stage 3).
 */
import { createHash } from 'node:crypto'

export const VIEW_NAMES = ['my_queue', 'card_get', 'waiting_on_chance', 'machine_busy'] as const
export type ViewName = (typeof VIEW_NAMES)[number]
export type Snapshot = { view: ViewName; key: string; text: string; sha256: string }

/** The only actor that may publish (Fedora's publisher runs as orca). */
export const PUBLISH_ACTORS = ['orca'] as const
export const MAX_SNAPSHOTS = 2000
export const MAX_TEXT = 256 * 1024

/**
 * Same aliases as CARBONARA bots.toml (the routing key is canonical). Unknown names pass through lowercased, so
 * a new bot works as soon as Fedora publishes its queue under its key.
 */
const ALIASES: Record<string, string> = {
  lucy: 'shaka', 'turbo granny': 'shaka', 'turbo-granny': 'shaka', turbogranny: 'shaka',
  senku: 'edison', marcy: 'kris', kaguya: 'kris', toji: 'gojo', marin: 'sia', mirin: 'sia',
}

export function canonBot(name: string): string {
  const n = name.trim().toLowerCase().replace(/^turbo[ \t-]*granny$/, 'turbo granny')
  return ALIASES[n] ?? n
}

const KEY_RE: Record<ViewName, RegExp> = {
  my_queue: /^[a-z][a-z0-9-]{0,31}$/,
  card_get: /^[0-9a-f]{24}$/,
  waiting_on_chance: /^$/,
  machine_busy: /^$/,
}

export type CheckResult = { ok: true; snapshots: Snapshot[] } | { ok: false; error: string }

/** Validates a publish body. Pure (unit-tested): shape, view names, keys, size, and sha256 of every text. */
export function checkPublish(body: unknown): CheckResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'body must be a JSON object' }
  const { actor, snapshots } = body as { actor?: unknown; snapshots?: unknown }
  if (typeof actor !== 'string' || !(PUBLISH_ACTORS as readonly string[]).includes(actor.trim().toLowerCase())) {
    return { ok: false, error: `actor must be one of ${PUBLISH_ACTORS.join('|')}` }
  }
  if (!Array.isArray(snapshots) || snapshots.length === 0 || snapshots.length > MAX_SNAPSHOTS) {
    return { ok: false, error: `snapshots must be 1-${MAX_SNAPSHOTS} items` }
  }
  const out: Snapshot[] = []
  for (const [i, s] of snapshots.entries()) {
    if (!s || typeof s !== 'object') return { ok: false, error: `snapshot ${i}: not an object` }
    const extra = Object.keys(s).filter((k) => !['view', 'key', 'text', 'sha256'].includes(k))
    if (extra.length) return { ok: false, error: `snapshot ${i}: unknown keys ${extra.join(',')}` }
    const { view, key, text, sha256 } = s as Record<string, unknown>
    if (typeof view !== 'string' || !(VIEW_NAMES as readonly string[]).includes(view)) {
      return { ok: false, error: `snapshot ${i}: unknown view` }
    }
    if (typeof key !== 'string' || !KEY_RE[view as ViewName].test(key)) {
      return { ok: false, error: `snapshot ${i}: bad key for ${view}` }
    }
    if (typeof text !== 'string' || text.length === 0 || text.length > MAX_TEXT) {
      return { ok: false, error: `snapshot ${i}: text must be 1-${MAX_TEXT} chars` }
    }
    if (typeof sha256 !== 'string' || createHash('sha256').update(text, 'utf8').digest('hex') !== sha256) {
      return { ok: false, error: `snapshot ${i}: sha256 does not match the text` }
    }
    out.push({ view: view as ViewName, key, text, sha256 })
  }
  return { ok: true, snapshots: out }
}

export type LookupResult = { ok: true; text: string } | { ok: false; error: string }

/** Picks the snapshot for one tool call from the stored keys of that view. Pure (unit-tested). */
export function pickSnapshot(view: ViewName, arg: string, stored: Array<{ key: string; text: string }>): LookupResult {
  if (view === 'my_queue') {
    const bot = canonBot(arg)
    const hit = stored.find((s) => s.key === bot)
    return hit ? { ok: true, text: hit.text } : { ok: false, error: `no published queue for ${bot}` }
  }
  if (view === 'card_get') {
    const key = arg.trim().toLowerCase()
    if (!/^[0-9a-f]{8,24}$/.test(key)) return { ok: false, error: 'card must be a 24-hex board id or an 8+ hex prefix' }
    const hits = stored.filter((s) => s.key.startsWith(key))
    if (hits.length > 1) return { ok: false, error: `ambiguous card prefix ${key}: ${hits.map((h) => h.key).join(', ')}` }
    return hits.length ? { ok: true, text: hits[0].text } : { ok: false, error: `no card ${key}` }
  }
  const hit = stored.find((s) => s.key === '')
  return hit ? { ok: true, text: hit.text } : { ok: false, error: `no published ${view} snapshot yet` }
}
