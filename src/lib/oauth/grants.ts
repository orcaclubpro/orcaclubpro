/**
 * OAuth grant lifecycle against the `oauth-grants` collection.
 *
 * Single-use and rotation are enforced with atomic `findOneAndUpdate` on the Mongoose
 * model (same precedent as `sendPaymentReceiptOnce`): a read-then-write through the
 * Local API would let two concurrent exchanges both redeem one authorization code.
 * The collection has no hooks, so going under Payload here skips nothing.
 */
import type { Payload } from 'payload'

import {
  ACCESS_PREFIX,
  ACCESS_TTL_MS,
  CODE_PREFIX,
  CODE_TTL_MS,
  REFRESH_GRACE_MS,
  REFRESH_PREFIX,
  REFRESH_TTL_MS,
  SCOPE,
  generateToken,
  hashToken,
  mcpResource,
  redirectMatches,
  resourceMatches,
  verifyPkce,
} from './core'

const SLUG = 'oauth-grants'

/** RFC 6749 §5.2 error codes this server emits from the token endpoint. */
export type OAuthErrorCode = 'invalid_request' | 'invalid_client' | 'invalid_grant' | 'unsupported_grant_type'

export class OAuthError extends Error {
  constructor(
    public code: OAuthErrorCode,
    description: string,
  ) {
    super(description)
  }
}

export type TokenResponse = {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  scope: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function model(payload: Payload): any {
  return payload.db.collections[SLUG]
}

/** A fresh access/refresh pair and the `$set` that stores their hashes. */
function mintTokens(now: number) {
  const accessToken = generateToken(ACCESS_PREFIX)
  const refreshToken = generateToken(REFRESH_PREFIX)
  return {
    response: {
      access_token: accessToken,
      token_type: 'Bearer' as const,
      expires_in: Math.floor(ACCESS_TTL_MS / 1000),
      refresh_token: refreshToken,
      scope: SCOPE,
    },
    set: {
      accessTokenHash: hashToken(accessToken),
      accessExpiresAt: new Date(now + ACCESS_TTL_MS),
      refreshTokenHash: hashToken(refreshToken),
      refreshExpiresAt: new Date(now + REFRESH_TTL_MS),
      updatedAt: new Date(now),
    },
  }
}

// ── Authorize ───────────────────────────────────────────────────────────────────

export async function createAuthorizationCode(
  payload: Payload,
  args: {
    userId: string
    clientId: string
    clientName: string
    redirectUri: string
    codeChallenge: string
  },
): Promise<string> {
  const code = generateToken(CODE_PREFIX)
  await payload.create({
    collection: SLUG,
    overrideAccess: true,
    data: {
      user: args.userId,
      clientId: args.clientId,
      clientName: args.clientName,
      redirectUri: args.redirectUri,
      resource: mcpResource(),
      scope: SCOPE,
      codeHash: hashToken(code),
      codeChallenge: args.codeChallenge,
      codeExpiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    },
  })
  return code
}

// ── Token: authorization_code ───────────────────────────────────────────────────

export async function exchangeAuthorizationCode(
  payload: Payload,
  args: { code: string; clientId: string; redirectUri: string; codeVerifier: string; resource?: string | null },
): Promise<TokenResponse> {
  if (!args.code || !args.clientId || !args.redirectUri || !args.codeVerifier) {
    throw new OAuthError('invalid_request', 'code, client_id, redirect_uri and code_verifier are required')
  }
  if (!resourceMatches(args.resource)) throw new OAuthError('invalid_grant', 'resource does not match this server')

  const now = Date.now()
  const codeHash = hashToken(args.code)

  // Claim the code atomically: whoever clears codeHash first wins, the rest see null.
  const claimed = await model(payload).findOneAndUpdate(
    { codeHash, codeExpiresAt: { $gt: new Date(now) }, revokedAt: null },
    { $set: { codeHash: null, codeChallenge: null, codeExpiresAt: null } },
    { returnDocument: 'before' },
  )
  if (!claimed) throw new OAuthError('invalid_grant', 'authorization code is invalid, expired, or already used')

  // Any binding mismatch burns the grant — the code was presented by the wrong party.
  const fail = async (reason: string): Promise<never> => {
    await model(payload).updateOne({ _id: claimed._id }, { $set: { revokedAt: new Date(now) } })
    throw new OAuthError('invalid_grant', reason)
  }
  if (claimed.clientId !== args.clientId) await fail('client_id does not match the authorization request')
  if (!redirectMatches(claimed.redirectUri, args.redirectUri)) await fail('redirect_uri does not match')
  if (!verifyPkce(args.codeVerifier, claimed.codeChallenge)) await fail('PKCE verification failed')

  const { response, set } = mintTokens(now)
  await model(payload).updateOne({ _id: claimed._id }, { $set: set })
  return response
}

// ── Token: refresh_token ────────────────────────────────────────────────────────

export async function refreshTokens(
  payload: Payload,
  args: { refreshToken: string; clientId: string; resource?: string | null },
): Promise<TokenResponse> {
  if (!args.refreshToken || !args.clientId) {
    throw new OAuthError('invalid_request', 'refresh_token and client_id are required')
  }
  if (!resourceMatches(args.resource)) throw new OAuthError('invalid_grant', 'resource does not match this server')

  const now = Date.now()
  const hash = hashToken(args.refreshToken)
  const { response, set } = mintTokens(now)
  const live = { revokedAt: null, clientId: args.clientId, refreshExpiresAt: { $gt: new Date(now) } }

  // Normal rotation: the presented token is current → it becomes "previous".
  let rotated = await model(payload).findOneAndUpdate(
    { ...live, refreshTokenHash: hash },
    { $set: { ...set, previousRefreshTokenHash: hash, rotatedAt: new Date(now) } },
  )
  // Retry of a rotation whose response was lost: the previous token, within the grace window.
  if (!rotated) {
    rotated = await model(payload).findOneAndUpdate(
      { ...live, previousRefreshTokenHash: hash, rotatedAt: { $gt: new Date(now - REFRESH_GRACE_MS) } },
      { $set: set },
    )
  }
  if (!rotated) throw new OAuthError('invalid_grant', 'refresh token is invalid, expired, or revoked')
  return response
}

// ── Resource server: Bearer → user ──────────────────────────────────────────────

const LAST_USED_RESOLUTION_MS = 5 * 60 * 1000

/** The user id an access token belongs to, or null if it is unknown/expired/revoked. */
export async function userIdForAccessToken(payload: Payload, token: string): Promise<string | null> {
  const now = Date.now()
  const grant = await model(payload)
    .findOne(
      { accessTokenHash: hashToken(token), accessExpiresAt: { $gt: new Date(now) }, revokedAt: null },
      { user: 1, resource: 1, lastUsedAt: 1 },
    )
    .lean()
  if (!grant) return null

  // Audience check (RFC 8707): a token minted for another resource is not ours to honour.
  if (!resourceMatches(grant.resource)) return null

  // Coarse "last used" for the admin list — one write per 5 minutes, not per request.
  if (!grant.lastUsedAt || now - new Date(grant.lastUsedAt).getTime() > LAST_USED_RESOLUTION_MS) {
    await model(payload)
      .updateOne({ _id: grant._id }, { $set: { lastUsedAt: new Date(now) } })
      .catch(() => {})
  }
  return String(grant.user)
}
