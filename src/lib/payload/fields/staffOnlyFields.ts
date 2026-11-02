/**
 * Strip + restore for top-level staff-only fields (the generic form of what
 * botContext.ts does for its group).
 *
 * - `stripStaffOnly(fields)` (afterRead) removes the fields from every read
 *   without a staff user, including `overrideAccess: true` reads with no user,
 *   which is how most portal loaders read.
 * - `restoreStaffOnly(slug, fields)` (beforeChange): Payload builds an update on
 *   top of the afterRead'd original doc, so without this a non-staff or no-user
 *   update would write the doc back with these fields missing and wipe them.
 *   It also drops any value a non-staff write tries to set.
 *
 * Pair them with field `access.read/create/update: staffOnlyField`, which binds
 * REST/GraphQL and `overrideAccess: false` calls.
 */
import type { CollectionAfterReadHook, CollectionBeforeChangeHook, CollectionSlug } from 'payload'

import { isStaffUser } from '../access'

export function stripStaffOnly(fields: readonly string[]): CollectionAfterReadHook {
  return ({ doc, req }) => {
    if (doc && typeof doc === 'object' && !isStaffUser(req?.user)) {
      for (const f of fields) delete (doc as Record<string, unknown>)[f]
    }
    return doc
  }
}

export function restoreStaffOnly(slug: CollectionSlug, fields: readonly string[]): CollectionBeforeChangeHook {
  return async ({ data, operation, originalDoc, req }) => {
    if (!data || isStaffUser(req?.user)) return data
    if (operation === 'create') {
      for (const f of fields) delete data[f]
      return data
    }
    const id = originalDoc?.id ?? data.id
    if (id == null) return data
    const select = Object.fromEntries(fields.map((f) => [f, true as const]))
    const stored = (await req.payload.db.findOne({
      collection: slug,
      where: { id: { equals: id } },
      select,
      req,
    })) as Record<string, unknown> | null
    for (const f of fields) {
      const v = stored?.[f]
      if (v === undefined || v === null) delete data[f]
      else data[f] = v
    }
    return data
  }
}
