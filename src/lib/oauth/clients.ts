/**
 * Resolve an OAuth `client_id` to who it is and where it may redirect.
 *
 * Two kinds, matching what Claude tries (pre-registered → CIMD → DCR):
 *
 * - **Client ID Metadata Document** — the client_id is an HTTPS URL serving JSON that
 *   names the client and its redirect URIs. Claude Code's is
 *   https://claude.ai/oauth/claude-code-client-metadata. Fetching arbitrary URLs from a
 *   server is SSRF bait, so only allowlisted hosts are fetched (claude.ai / claude.com,
 *   plus `OAUTH_CIMD_HOSTS`).
 * - **Dynamic Client Registration** — a stateless signed client_id minted by
 *   /api/oauth/register (see `signClientId` in core.ts).
 *
 * Either way, every redirect must also pass `isAllowedRedirect` — a client's own claims
 * never widen where a code can go.
 */
import { DCR_PREFIX, verifyClientId } from './core'

export type ResolvedClient = {
  clientId: string
  /** What the consent screen names. For CIMD this is the URL host, not the self-asserted name. */
  displayName: string
  redirectUris: string[]
}

const CIMD_HOSTS = new Set(
  ['claude.ai', 'claude.com', ...(process.env.OAUTH_CIMD_HOSTS || '').split(',')]
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
)

const CIMD_MAX_BYTES = 64 * 1024
const CIMD_TIMEOUT_MS = 5_000
const CIMD_CACHE_MS = 5 * 60 * 1000
const cimdCache = new Map<string, { client: ResolvedClient; expires: number }>()

export function dcrSecret(): string {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is required to sign OAuth client registrations')
  return secret
}

async function fetchMetadataDocument(clientId: string): Promise<ResolvedClient | null> {
  let url: URL
  try {
    url = new URL(clientId)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || !CIMD_HOSTS.has(url.hostname) || url.hash) return null

  const cached = cimdCache.get(clientId)
  if (cached && cached.expires > Date.now()) return cached.client

  try {
    const res = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(CIMD_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const raw = await res.text()
    if (raw.length > CIMD_MAX_BYTES) return null
    const doc = JSON.parse(raw) as { client_id?: unknown; redirect_uris?: unknown }

    // The document must claim the very URL it was fetched from.
    if (doc.client_id !== clientId) return null
    if (!Array.isArray(doc.redirect_uris) || !doc.redirect_uris.every((u) => typeof u === 'string')) return null

    const client: ResolvedClient = {
      clientId,
      displayName: url.hostname,
      redirectUris: doc.redirect_uris as string[],
    }
    cimdCache.set(clientId, { client, expires: Date.now() + CIMD_CACHE_MS })
    return client
  } catch (error) {
    console.error('[oauth] client metadata document fetch failed:', clientId, error)
    return null
  }
}

export async function resolveClient(clientId: string | null | undefined): Promise<ResolvedClient | null> {
  if (!clientId) return null
  if (clientId.startsWith(DCR_PREFIX)) {
    const reg = verifyClientId(clientId, dcrSecret())
    return reg ? { clientId, displayName: reg.name, redirectUris: reg.redirectUris } : null
  }
  return fetchMetadataDocument(clientId)
}
