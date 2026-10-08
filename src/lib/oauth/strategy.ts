/**
 * Payload auth strategy: `Authorization: Bearer oc_at_…` → the staff user who approved it.
 *
 * Registered on Users (`auth.strategies`). Payload runs custom strategies before its
 * API-key and JWT strategies (payload/dist/index.js), so `payload.auth({ headers })`
 * — and through it `getCurrentUser()` and every server action the MCP tools wrap —
 * resolves an OAuth caller with no code path of its own.
 *
 * Any other Authorization value returns `{ user: null }` untouched, falling through to
 * the API-key and JWT strategies (Payload's JWT strategy also reads `Bearer`, which is
 * why the `oc_at_` prefix gates this one).
 */
import type { AuthStrategy, AuthStrategyResult } from 'payload'

import { ACCESS_PREFIX } from './core'
import { userIdForAccessToken } from './grants'

export const oauthAccessTokenStrategy: AuthStrategy = {
  name: 'oauth-access-token',
  authenticate: async ({ headers, payload }) => {
    const header = headers.get('Authorization')
    if (!header?.startsWith(`Bearer ${ACCESS_PREFIX}`)) return { user: null }

    const userId = await userIdForAccessToken(payload, header.slice('Bearer '.length).trim())
    if (!userId) return { user: null }

    const user = await payload.findByID({ collection: 'users', id: userId, overrideAccess: true, depth: 0 }).catch(() => null)
    // Staff only — a client-role user can never hold a grant, but if a role changes after
    // approval the token dies with it.
    if (!user || user.role === 'client') return { user: null }

    // Same shape Payload's own API-key strategy returns (generated `sessions` is nullable,
    // BaseUser's is not — hence the cast).
    return {
      user: { ...user, collection: 'users', _strategy: 'oauth-access-token' } as AuthStrategyResult['user'],
    }
  },
}
