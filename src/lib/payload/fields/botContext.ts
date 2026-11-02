/**
 * `botContext` — internal working context for bots and staff on a Package,
 * Project, or Task (brief, repo, branch, live URL, decisions, notes, owner bot).
 *
 * It must NEVER reach a client. Two layers enforce that:
 *
 * 1. Field access (`staffOnlyField`): with `overrideAccess: false` + a client
 *    user, Payload drops the field on read and ignores it on create/update. This
 *    also covers REST/GraphQL.
 * 2. `stripBotContext` (collection afterRead): Local API calls default to
 *    `overrideAccess: true`, which skips field access. Many portal, timeline,
 *    PDF, and recap loaders read that way with no user at all. So the hook
 *    removes the group from every read whose request has no staff user, whatever
 *    the access mode. It also runs for documents populated through
 *    relationships. Server code that genuinely needs botContext has to pass a
 *    staff `user`.
 *
 * Plus a write guard (`guardBotContextWrite`, beforeChange): a write without a
 * staff user on the request can neither set, change, nor clear botContext, even
 * with `overrideAccess: true`, and it never wipes the stored value (see below).
 */
import type {
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionSlug,
  Field,
  PayloadRequest,
} from 'payload'

import { isStaffUser, staffOnlyField } from '../access'
import { isValidActor } from '@/lib/mcp/actor'

export const BOT_CONTEXT_FIELD = 'botContext'

export const botContextField: Field = {
  name: BOT_CONTEXT_FIELD,
  type: 'group',
  label: 'Bot context (internal)',
  access: {
    read: staffOnlyField,
    create: staffOnlyField,
    update: staffOnlyField,
  },
  admin: {
    description: 'Internal working context for bots and staff. Never shown to clients.',
  },
  fields: [
    { name: 'brief', type: 'textarea', admin: { description: 'What this is and what done looks like.' } },
    {
      type: 'row',
      fields: [
        { name: 'repo', type: 'text', admin: { width: '33%' } },
        { name: 'branch', type: 'text', admin: { width: '33%' } },
        { name: 'liveUrl', type: 'text', admin: { width: '34%' } },
      ],
    },
    { name: 'decisions', type: 'textarea', admin: { description: 'Decisions in force, one per line.' } },
    { name: 'notes', type: 'textarea' },
    {
      type: 'row',
      fields: [
        {
          name: 'ownerBot',
          type: 'text',
          admin: { width: '50%', description: 'gojo | vegapunk | edison | shaka | finn | … or a ccq task id' },
          validate: (value: unknown) =>
            value == null || value === '' || isValidActor(value) || 'Unknown bot or ccq task id',
        },
        {
          name: 'updatedAt',
          type: 'date',
          admin: { width: '50%', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
  ],
}

/** Remove botContext from a document unless the request carries a staff user. */
export const stripBotContext: CollectionAfterReadHook = ({ doc, req }) => {
  if (doc && typeof doc === 'object' && !isStaffUser(req?.user) && BOT_CONTEXT_FIELD in doc) {
    delete (doc as Record<string, unknown>)[BOT_CONTEXT_FIELD]
  }
  return doc
}

/**
 * The stored botContext, read through the DB adapter (no hooks, no access), or
 * `undefined` when the document has none.
 */
async function storedBotContext(req: PayloadRequest, slug: string, id: unknown): Promise<unknown> {
  if (id == null) return undefined
  const raw = (await req.payload.db.findOne({
    collection: slug as CollectionSlug,
    where: { id: { equals: id } },
    select: { [BOT_CONTEXT_FIELD]: true },
    req,
  })) as Record<string, unknown> | null
  return raw?.[BOT_CONTEXT_FIELD] ?? undefined
}

/**
 * Keep non-staff writes from setting, changing, or clearing botContext, and stamp
 * `botContext.updatedAt` when staff change it.
 *
 * Why the raw re-read on update: Payload passes the stored doc through afterRead
 * before merging the incoming data over it, and `stripBotContext` removes the group
 * there for any non-staff request. Without restoring it here, every non-staff or
 * no-user update (many server actions run that way) would write the doc back with
 * botContext missing, wiping it.
 */
export const guardBotContextWrite: CollectionBeforeChangeHook = async ({
  collection,
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data

  if (!isStaffUser(req?.user)) {
    if (operation === 'create') {
      delete data[BOT_CONTEXT_FIELD]
      return data
    }
    const stored = await storedBotContext(req, collection.slug, originalDoc?.id ?? data.id)
    if (stored === undefined) delete data[BOT_CONTEXT_FIELD]
    else data[BOT_CONTEXT_FIELD] = stored
    return data
  }

  if (!(BOT_CONTEXT_FIELD in data)) return data
  const next = { ...(data[BOT_CONTEXT_FIELD] ?? {}) } as Record<string, unknown>
  const prev = ((originalDoc as Record<string, any> | undefined)?.[BOT_CONTEXT_FIELD] ?? {}) as Record<
    string,
    unknown
  >
  const changed = ['brief', 'repo', 'branch', 'liveUrl', 'decisions', 'notes', 'ownerBot'].some(
    (k) => k in next && (next[k] ?? null) !== (prev[k] ?? null),
  )
  if (changed) next.updatedAt = new Date().toISOString()
  data[BOT_CONTEXT_FIELD] = next
  return data
}
