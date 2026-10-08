/**
 * Discovery documents. Served from /.well-known/* — see src/app/.well-known/.
 *
 * Claude caches these for ~5 minutes, so a change here takes that long to reach it.
 */
import { SCOPE, mcpResource, oauthOrigin } from './core'

/** RFC 9728 — `resource` must equal the connector URL exactly. */
export function protectedResourceMetadata() {
  return {
    resource: mcpResource(),
    authorization_servers: [oauthOrigin()],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'ORCACLUB',
  }
}

/**
 * RFC 8414. Claude prefers a Client ID Metadata Document, but only when BOTH
 * `client_id_metadata_document_supported` and `none` in the auth methods are present;
 * otherwise it falls back to `registration_endpoint`.
 */
export function authorizationServerMetadata() {
  const origin = oauthOrigin()
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
    scopes_supported: [SCOPE],
  }
}

/** CORS is not needed by Claude (server-side / Node), but lets MCP Inspector run in a browser. */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version',
}

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store', ...extra },
  })
}
