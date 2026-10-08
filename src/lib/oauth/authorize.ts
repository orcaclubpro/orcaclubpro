/**
 * Validation of an /oauth/authorize request — shared by the consent page (GET) and the
 * approve/deny server actions (POST), which re-run it rather than trust hidden fields.
 *
 * RFC 6749 §4.1.2.1: if the client or redirect_uri is bad, NEVER redirect — show an
 * error. Only once the redirect is proven safe do other errors go back to the client.
 */
import { isAllowedRedirect, isValidCodeChallenge, oauthOrigin, redirectMatches, resourceMatches } from './core'
import { resolveClient, type ResolvedClient } from './clients'

export type AuthorizeParams = {
  response_type?: string
  client_id?: string
  redirect_uri?: string
  code_challenge?: string
  code_challenge_method?: string
  state?: string
  scope?: string
  resource?: string
}

export const AUTHORIZE_PARAM_KEYS = [
  'response_type',
  'client_id',
  'redirect_uri',
  'code_challenge',
  'code_challenge_method',
  'state',
  'scope',
  'resource',
] as const

export type AuthorizeCheck =
  | { kind: 'fatal'; message: string }
  | { kind: 'redirect'; url: string }
  | { kind: 'ok'; client: ResolvedClient; redirectUri: string; codeChallenge: string; state?: string }

/** Build the redirect back to the client, carrying state and the issuer (RFC 9207). */
export function clientRedirect(redirectUri: string, params: Record<string, string | undefined>): string {
  const url = new URL(redirectUri)
  for (const [k, v] of Object.entries({ ...params, iss: oauthOrigin() })) {
    if (v !== undefined) url.searchParams.set(k, v)
  }
  return url.toString()
}

export async function checkAuthorizeRequest(p: AuthorizeParams): Promise<AuthorizeCheck> {
  const client = await resolveClient(p.client_id)
  if (!client) return { kind: 'fatal', message: 'This application is not recognised.' }

  const redirectUri = p.redirect_uri
  if (
    !redirectUri ||
    !isAllowedRedirect(redirectUri) ||
    !client.redirectUris.some((registered) => redirectMatches(registered, redirectUri))
  ) {
    return { kind: 'fatal', message: 'This application asked to send you somewhere it is not allowed to.' }
  }

  const fail = (error: string, description: string): AuthorizeCheck => ({
    kind: 'redirect',
    url: clientRedirect(redirectUri, { error, error_description: description, state: p.state }),
  })
  if (p.response_type !== 'code') return fail('unsupported_response_type', 'Only response_type=code is supported')
  if (p.code_challenge_method !== 'S256' || !p.code_challenge || !isValidCodeChallenge(p.code_challenge)) {
    return fail('invalid_request', 'PKCE with code_challenge_method=S256 is required')
  }
  if (!resourceMatches(p.resource)) return fail('invalid_target', 'Unknown resource')

  return { kind: 'ok', client, redirectUri, codeChallenge: p.code_challenge, state: p.state }
}
