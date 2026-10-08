/**
 * MCP endpoint — Model Context Protocol over streamable HTTP.
 *
 * Lets an MCP client (Claude Code, or Claude desktop as a custom connector) drive
 * ORCACLUB staff operations: drafting cycle recaps, logging work, building packages
 * and SOWs, managing milestones. The tool surface is in `src/lib/mcp/tools.ts`.
 *
 * ── Auth ────────────────────────────────────────────────────────────────────────
 * Two ways in, both resolved by `payload.auth({ headers })`:
 *
 *   Authorization: Bearer oc_at_<token>     OAuth — claude.ai connectors, Claude Code
 *   Authorization: users API-Key <key>      per-user API key (scripts/mcp-api-key.mjs)
 *
 * OAuth is the account-wide path: add this URL once as a claude.ai custom connector and
 * it follows you to every device. An unauthenticated request gets a 401 whose
 * `WWW-Authenticate` header points at the protected-resource metadata — that header is
 * what starts the OAuth flow, so it must survive any proxy in front of this route. The
 * authorization server lives in src/lib/oauth/.
 *
 * `payload.auth({ headers })` resolves that to the owning user, which is why the
 * existing cookie-auth server actions work unchanged here — the request carries a real
 * staff identity, so every access check inside them evaluates normally. Keys are
 * per-user (enable "API Key" on your own user in the admin panel), so a key is exactly
 * as privileged as the person holding it, and revoking it is one checkbox.
 *
 * Clients are rejected outright below. A client-role key must never reach these tools
 * even though the actions would also refuse — defence at the door as well as the safe.
 *
 * ── Stateless ───────────────────────────────────────────────────────────────────
 * A fresh server + transport per request (`sessionIdGenerator: undefined`). This runs
 * on Vercel, where nothing in memory survives between invocations, so session-based
 * MCP would break the moment a second request landed on a different instance.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

import { getCurrentUser } from '@/actions/auth'
import { registerOrcaclubTools } from '@/lib/mcp/tools'
import { SCOPE, protectedResourceMetadataUrl } from '@/lib/oauth/core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
/** Recap drafting reads a whole cycle and writes prose — give it room. */
export const maxDuration = 300

/** A JSON-RPC-shaped error, so MCP clients surface the reason instead of a bare status. */
function rpcError(status: number, message: string, headers: Record<string, string> = {}): Response {
  return Response.json(
    { jsonrpc: '2.0', error: { code: -32_000, message }, id: null },
    { status, headers: { 'Content-Type': 'application/json', ...headers } },
  )
}

async function handle(req: Request): Promise<Response> {
  // Staff only. `getCurrentUser()` reads the inbound Authorization header via
  // payload.auth, so this resolves the API key's owner.
  const user = await getCurrentUser()
  if (!user) {
    return rpcError(401, 'Unauthorized — connect via OAuth, or send an Authorization: users API-Key <key> header.', {
      'WWW-Authenticate': `Bearer resource_metadata="${protectedResourceMetadataUrl()}", scope="${SCOPE}"`,
    })
  }
  if (user.role === 'client') {
    return rpcError(403, 'Forbidden — the MCP tool surface is staff only.')
  }

  const server = new McpServer({ name: 'orcaclub', version: '1.0.0' })
  registerOrcaclubTools(server)

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  try {
    await server.connect(transport)
    return await transport.handleRequest(req)
  } finally {
    // Per-request lifecycle: nothing is reused, so tear both down either way.
    await transport.close().catch(() => {})
    await server.close().catch(() => {})
  }
}

export async function POST(req: Request): Promise<Response> {
  return handle(req)
}

export async function GET(): Promise<Response> {
  // Stateless mode has no server-initiated stream to attach to.
  return rpcError(405, 'Method not allowed — this endpoint is stateless; POST JSON-RPC requests.')
}

export async function DELETE(): Promise<Response> {
  return rpcError(405, 'Method not allowed — there is no session to terminate in stateless mode.')
}
