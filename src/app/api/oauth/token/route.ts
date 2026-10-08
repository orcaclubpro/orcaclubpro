/**
 * OAuth token endpoint — authorization_code (PKCE) and refresh_token grants.
 *
 * Public clients only (no client secret). Body is form-encoded per RFC 6749; JSON is
 * accepted too for hand testing. Error codes matter to Claude: `invalid_grant` makes it
 * re-authorize, `invalid_client` makes it re-register.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

import { resolveClient } from '@/lib/oauth/clients'
import { OAuthError, exchangeAuthorizationCode, refreshTokens } from '@/lib/oauth/grants'
import { corsPreflight, json } from '@/lib/oauth/metadata'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function readParams(req: Request): Promise<URLSearchParams> {
  const type = req.headers.get('content-type') || ''
  if (type.includes('application/json')) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    return new URLSearchParams(
      Object.entries(body).filter((e): e is [string, string] => typeof e[1] === 'string'),
    )
  }
  return new URLSearchParams(await req.text())
}

export async function POST(req: Request): Promise<Response> {
  const params = await readParams(req)
  const grantType = params.get('grant_type')
  const clientId = params.get('client_id') || ''

  try {
    // An unverifiable DCR client_id (e.g. after a secret rotation) → invalid_client, so
    // Claude re-registers instead of looping.
    if (!(await resolveClient(clientId))) throw new OAuthError('invalid_client', 'Unknown client_id')

    const payload = await getPayload({ config })

    if (grantType === 'authorization_code') {
      return json(
        await exchangeAuthorizationCode(payload, {
          code: params.get('code') || '',
          clientId,
          redirectUri: params.get('redirect_uri') || '',
          codeVerifier: params.get('code_verifier') || '',
          resource: params.get('resource'),
        }),
      )
    }
    if (grantType === 'refresh_token') {
      return json(
        await refreshTokens(payload, {
          refreshToken: params.get('refresh_token') || '',
          clientId,
          resource: params.get('resource'),
        }),
      )
    }
    throw new OAuthError('unsupported_grant_type', `Unsupported grant_type: ${grantType ?? '(none)'}`)
  } catch (error) {
    if (error instanceof OAuthError) {
      return json({ error: error.code, error_description: error.message }, error.code === 'invalid_client' ? 401 : 400)
    }
    console.error('[oauth] token endpoint failed:', error)
    return json({ error: 'server_error' }, 500)
  }
}

export const OPTIONS = corsPreflight
