/**
 * Output sanitizer for every MCP tool result.
 *
 * MCP tools wrap server actions, and an action that returns a Payload doc at the
 * default depth (2) hands back populated relationships. A `users` doc populated
 * that way carries the encrypted API key, its lookup index, login sessions,
 * passkey credentials and 2FA codes (`log_work` leaked exactly this through
 * `loggedBy` and `retainer.clientAccount.assignedTo`).
 *
 * The actions are fixed at the source (depth 0), and this is the second layer,
 * applied to every result in `text()` (tools.ts) so a future tool cannot
 * reintroduce the leak:
 *
 * 1. Any object that looks like a user doc collapses to `{ id, name }`.
 * 2. Any secret-bearing key is dropped at any depth, whatever object holds it.
 */

/** Auth/secret fields a Payload `users` doc can carry. Dropped wherever they appear. */
export const SECRET_KEYS: ReadonlySet<string> = new Set([
  'apiKey',
  'apiKeyIndex',
  'enableAPIKey',
  'sessions',
  'passkeyCredentials',
  'hash',
  'salt',
  'password',
  'resetPasswordToken',
  'resetPasswordExpiration',
  '_verificationToken',
  '_verified',
  'loginAttempts',
  'lockUntil',
  'twoFactorCode',
  'twoFactorExpiry',
  'loginTwoFactorCode',
  'loginTwoFactorExpiry',
])

/** Pattern backstop for secret keys not in the list (e.g. a renamed or new auth field). */
const SECRET_KEY_PATTERN = /apikey|passkey|twofactor|resetpassword|^sessions?$/i

export const isSecretKey = (key: string): boolean => SECRET_KEYS.has(key) || SECRET_KEY_PATTERN.test(key)

const USER_ROLES = new Set(['admin', 'user', 'client'])

type Obj = Record<string, unknown>

/** True for an object that is (or was) a populated `users` document. */
function looksLikeUser(o: Obj): boolean {
  if (o.collection === 'users') return true
  for (const k of Object.keys(o)) if (isSecretKey(k)) return true
  return typeof o.email === 'string' && typeof o.role === 'string' && USER_ROLES.has(o.role)
}

/** A user reduced to what a tool caller may see. */
export function userRef(o: Obj): { id: string | null; name: string | null } {
  const id = o.id ?? o._id
  const name = o.name ?? o.username ?? null
  return { id: id == null ? null : String(id), name: typeof name === 'string' ? name : null }
}

function walk(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(walk)
  if (value === null || typeof value !== 'object') return value
  const o = value as Obj
  if (looksLikeUser(o)) return userRef(o)
  const out: Obj = {}
  for (const [k, v] of Object.entries(o)) {
    if (isSecretKey(k)) continue
    out[k] = walk(v)
  }
  return out
}

/**
 * Sanitize a tool result. JSON round-trips first so Dates, ObjectIds and
 * mongoose docs become the plain values the client would receive anyway.
 */
export function sanitizeToolOutput<T>(value: T): unknown {
  if (value === undefined) return value
  return walk(JSON.parse(JSON.stringify(value)))
}
