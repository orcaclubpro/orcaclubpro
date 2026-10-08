/**
 * Dynamic Client Registration (RFC 7591), stateless.
 *
 * Claude registers on every new connection, so nothing is stored: the returned
 * client_id is a signed blob of the name + redirect URIs (`signClientId`). Every
 * redirect URI must pass the server allowlist (`isAllowedRedirect`) — Claude's hosted
 * callback or loopback — so a registration can never point codes at a third party.
 */
import { signClientId, isAllowedRedirect } from '@/lib/oauth/core'
import { dcrSecret } from '@/lib/oauth/clients'
import { corsPreflight, json } from '@/lib/oauth/metadata'

export const dynamic = 'force-dynamic'

function error(code: string, description: string): Response {
  return json({ error: code, error_description: description }, 400)
}

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return error('invalid_client_metadata', 'Body must be JSON')
  }

  const redirectUris = body.redirect_uris
  if (!Array.isArray(redirectUris) || redirectUris.length === 0 || redirectUris.length > 10) {
    return error('invalid_redirect_uri', 'redirect_uris must be a non-empty array')
  }
  for (const uri of redirectUris) {
    if (typeof uri !== 'string' || !isAllowedRedirect(uri)) {
      return error('invalid_redirect_uri', `redirect_uri not permitted: ${String(uri)}`)
    }
  }

  const method = body.token_endpoint_auth_method ?? 'none'
  if (method !== 'none') {
    return error('invalid_client_metadata', 'Only public clients (token_endpoint_auth_method "none") are supported')
  }

  const name = typeof body.client_name === 'string' && body.client_name.trim() ? body.client_name.trim().slice(0, 100) : 'MCP client'
  const clientId = signClientId({ name, redirectUris: redirectUris as string[] }, dcrSecret())

  return json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name,
      redirect_uris: redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    },
    201,
  )
}

export const OPTIONS = corsPreflight
