/**
 * OAuth 2.1 authorization server for the MCP endpoint — pure primitives.
 *
 * ORCACLUB is its own authorization server so `/api/mcp` can be added once as a
 * claude.ai custom connector and follow the account to every device (web, desktop,
 * mobile, Claude Code). The flow is the MCP authorization spec (2025-11-25):
 *
 *   401 + WWW-Authenticate → /.well-known/oauth-protected-resource (RFC 9728)
 *   → /.well-known/oauth-authorization-server (RFC 8414)
 *   → client registration: Client ID Metadata Document, or /api/oauth/register (RFC 7591)
 *   → /oauth/authorize (PKCE S256, staff consent) → /api/oauth/token
 *
 * Tokens are opaque random strings; only their SHA-256 lives in `oauth-grants`. The
 * `oauthAccessToken` Payload auth strategy turns a `Bearer oc_at_…` header back into
 * the staff user, so `payload.auth()` — and every server action the MCP tools wrap —
 * resolves the caller with no OAuth-specific code path.
 *
 * Nothing in this file touches Payload or the network, so it is unit-testable.
 */
import crypto from 'node:crypto'

// ── Endpoints ───────────────────────────────────────────────────────────────────

/**
 * The issuer origin. `OAUTH_ISSUER` exists for local testing (http://localhost:3000)
 * because `.env.local` points NEXT_PUBLIC_SERVER_URL at production. It must be the
 * FINAL origin — a redirect to another host drops the Authorization header.
 */
export function oauthOrigin(): string {
  const raw = process.env.OAUTH_ISSUER || process.env.NEXT_PUBLIC_SERVER_URL || 'https://orcaclub.pro'
  return raw.replace(/\/+$/, '')
}

/** The protected resource — the exact URL a connector is added with. Tokens are bound to it. */
export function mcpResource(): string {
  return `${oauthOrigin()}/api/mcp`
}

export function protectedResourceMetadataUrl(): string {
  return `${oauthOrigin()}/.well-known/oauth-protected-resource/api/mcp`
}

export const SCOPE = 'mcp'

export const CODE_TTL_MS = 10 * 60 * 1000
export const ACCESS_TTL_MS = 60 * 60 * 1000
export const REFRESH_TTL_MS = 60 * 24 * 60 * 60 * 1000
/**
 * A refresh token stays redeemable this long after it was rotated out. A client whose
 * refresh response was lost in transit retries with the old token; without a grace
 * window that retry fails and the connector has to be re-authorized by hand.
 */
export const REFRESH_GRACE_MS = 2 * 60 * 1000

// ── Tokens ──────────────────────────────────────────────────────────────────────

export const ACCESS_PREFIX = 'oc_at_'
export const REFRESH_PREFIX = 'oc_rt_'
export const CODE_PREFIX = 'oc_ac_'

export function generateToken(prefix: string): string {
  return prefix + crypto.randomBytes(32).toString('base64url')
}

/** Tokens are 256-bit random, so an unsalted SHA-256 is a sound lookup key. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

// ── PKCE (RFC 7636) ─────────────────────────────────────────────────────────────

/** S256 only — `plain` is not accepted (OAuth 2.1). */
export function verifyPkce(verifier: string, challenge: string): boolean {
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false
  const computed = crypto.createHash('sha256').update(verifier).digest('base64url')
  return safeEqual(computed, challenge)
}

export function isValidCodeChallenge(challenge: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(challenge)
}

// ── Resource indicators (RFC 8707) ──────────────────────────────────────────────

/** Canonical form: lowercase scheme + host, no default port, no trailing slash/fragment. */
export function canonicalResource(value: string): string | null {
  try {
    const u = new URL(value)
    // WHATWG URL already lowercases scheme + host and drops a default port.
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, '')}${u.search}`
  } catch {
    return null
  }
}

/** An absent `resource` means "this server's only resource"; a present one must match. */
export function resourceMatches(requested: string | null | undefined): boolean {
  if (!requested) return true
  return canonicalResource(requested) === canonicalResource(mcpResource())
}

// ── Redirect URIs ───────────────────────────────────────────────────────────────

/** Where claude.ai web, Desktop, mobile and Cowork land after consent. */
const HOSTED_CALLBACKS = ['https://claude.ai/api/mcp/auth_callback', 'https://claude.com/api/mcp/auth_callback']

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function parse(uri: string): URL | null {
  try {
    return new URL(uri)
  } catch {
    return null
  }
}

export function isLoopbackRedirect(uri: string): boolean {
  const u = parse(uri)
  return Boolean(u && u.protocol === 'http:' && LOOPBACK_HOSTS.has(u.hostname))
}

/**
 * Does `actual` satisfy `registered`? Exact match, except loopback redirects ignore the
 * port (RFC 8252 §7.3) — Claude Code and MCP Inspector bind an ephemeral one per run.
 */
export function redirectMatches(registered: string, actual: string): boolean {
  if (registered === actual) return true
  const r = parse(registered)
  const a = parse(actual)
  if (!r || !a || !isLoopbackRedirect(registered) || !isLoopbackRedirect(actual)) return false
  return r.hostname === a.hostname && r.pathname === a.pathname && r.search === a.search
}

/**
 * The server-wide allowlist every redirect must ALSO pass, whatever a client claims.
 * Consent is staff-only, but a phishing link to an approve screen that hands a code to
 * an attacker's host is still the obvious attack on an AS like this one — so codes can
 * only ever travel to Claude's own callback or to the approving staff member's machine.
 * `OAUTH_EXTRA_REDIRECT_URIS` (comma-separated, exact) admits anything else deliberately.
 */
export function isAllowedRedirect(uri: string): boolean {
  if (isLoopbackRedirect(uri)) return true
  const extra = (process.env.OAUTH_EXTRA_REDIRECT_URIS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...HOSTED_CALLBACKS, ...extra].includes(uri)
}

// ── Dynamic Client Registration, stateless ──────────────────────────────────────

/**
 * Claude registers a fresh client on every new connection, so a client table would grow
 * forever. Instead the client_id IS the registration: a signed blob of the redirect URIs
 * and name. Nothing is stored; tampering breaks the HMAC.
 */
export const DCR_PREFIX = 'oc_client_'

export type ClientRegistration = { name: string; redirectUris: string[] }

function hmac(secret: string, data: string): string {
  return crypto.createHmac('sha256', secret).update(`oauth-dcr:${data}`).digest('base64url')
}

export function signClientId(reg: ClientRegistration, secret: string): string {
  const body = Buffer.from(JSON.stringify({ n: reg.name, r: reg.redirectUris })).toString('base64url')
  return `${DCR_PREFIX}${body}.${hmac(secret, body)}`
}

export function verifyClientId(clientId: string, secret: string): ClientRegistration | null {
  if (!clientId.startsWith(DCR_PREFIX)) return null
  const [body, sig] = clientId.slice(DCR_PREFIX.length).split('.')
  if (!body || !sig || !safeEqual(sig, hmac(secret, body))) return null
  try {
    const { n, r } = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (typeof n !== 'string' || !Array.isArray(r) || !r.every((x) => typeof x === 'string')) return null
    return { name: n, redirectUris: r }
  } catch {
    return null
  }
}
