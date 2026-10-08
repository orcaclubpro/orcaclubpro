/** Path-suffixed variant (RFC 9728 §3.1) — the one the MCP route's 401 points at. */
import { corsPreflight, json, protectedResourceMetadata } from '@/lib/oauth/metadata'

export const dynamic = 'force-dynamic'

export function GET(): Response {
  return json(protectedResourceMetadata())
}

export const OPTIONS = corsPreflight
