/**
 * OAuthGrants Collection
 *
 * One row per approved MCP connection (e.g. "Claude, connected by Chance"). Holds the
 * pending authorization code, then the current access + refresh token pair — as SHA-256
 * hashes only. Written exclusively by `src/lib/oauth/grants.ts` with overrideAccess;
 * nothing is created through the API.
 *
 * Revoke a connection by setting `revokedAt` (or deleting the row). The
 * `oauthAccessToken` auth strategy rejects revoked grants on the very next request.
 */
import type { CollectionConfig, FieldAccess } from 'payload'
import { adminOnly, adminOrOwnGrant } from '../access'

/** Secret material: never readable or writable through any API, even by admins. */
const hidden: { read: FieldAccess; create: FieldAccess; update: FieldAccess } = {
  read: () => false,
  create: () => false,
  update: () => false,
}

const readOnly = { readOnly: true }

export const OAuthGrants: CollectionConfig = {
  slug: 'oauth-grants',
  admin: {
    useAsTitle: 'clientName',
    defaultColumns: ['clientName', 'user', 'lastUsedAt', 'revokedAt', 'createdAt'],
    group: 'System',
    description: 'MCP connections approved via OAuth (claude.ai connectors, Claude Code). Set "Revoked at" to disconnect.',
  },
  access: {
    read: adminOrOwnGrant,
    create: () => false,
    update: adminOrOwnGrant,
    delete: adminOnly,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true, admin: readOnly },
    { name: 'clientId', type: 'text', required: true, admin: readOnly },
    { name: 'clientName', type: 'text', required: true, admin: readOnly },
    { name: 'redirectUri', type: 'text', required: true, admin: readOnly },
    { name: 'resource', type: 'text', required: true, admin: readOnly },
    { name: 'scope', type: 'text', admin: readOnly },

    { name: 'codeHash', type: 'text', index: true, access: hidden },
    { name: 'codeChallenge', type: 'text', access: hidden },
    { name: 'codeExpiresAt', type: 'date', access: hidden },

    { name: 'accessTokenHash', type: 'text', index: true, access: hidden },
    { name: 'accessExpiresAt', type: 'date', access: hidden },
    { name: 'refreshTokenHash', type: 'text', index: true, access: hidden },
    { name: 'previousRefreshTokenHash', type: 'text', index: true, access: hidden },
    { name: 'rotatedAt', type: 'date', access: hidden },
    { name: 'refreshExpiresAt', type: 'date', admin: readOnly },

    { name: 'lastUsedAt', type: 'date', admin: readOnly },
    {
      name: 'revokedAt',
      type: 'date',
      index: true,
      admin: { description: 'Set to disconnect this client. Takes effect on its next request.' },
    },
  ],
  timestamps: true,
}
