/**
 * `packages.lineItems[].stripePriceId` is staff-only: clients must not see it
 * through the API or the portal pages.
 *
 * Same two-layer shape as botContext (see botContext.ts):
 * - field `access.read: staffOnlyField` binds REST/GraphQL and every
 *   `overrideAccess: false` read;
 * - `stripPackageStripeIds` (afterRead) removes it from every read without a staff
 *   user, which covers the portal loaders that read with no user at all.
 *
 * And the same trap: Payload builds an update on top of the afterRead'd original
 * doc, so a non-staff update would write the line items back without their Stripe
 * ids. `restorePackageStripeIds` (beforeChange) puts the stored ids back.
 */
import type { CollectionAfterReadHook, CollectionBeforeChangeHook } from 'payload'

import { isStaffUser } from '../access'

type Row = Record<string, unknown> & { id?: unknown }

export const stripPackageStripeIds: CollectionAfterReadHook = ({ doc, req }) => {
  if (!isStaffUser(req?.user) && Array.isArray(doc?.lineItems)) {
    for (const row of doc.lineItems as Row[]) {
      if (row && typeof row === 'object') delete row.stripePriceId
    }
  }
  return doc
}

export const restorePackageStripeIds: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (!data || operation !== 'update' || isStaffUser(req?.user)) return data
  const id = originalDoc?.id
  if (id == null) return data

  const raw = (await req.payload.db.findOne({
    collection: 'packages',
    where: { id: { equals: id } },
    select: { lineItems: true },
    req,
  })) as { lineItems?: Row[] } | null
  const stored = new Map<string, unknown>()
  for (const row of raw?.lineItems ?? []) {
    if (row?.id != null && row.stripePriceId != null && row.stripePriceId !== '') {
      stored.set(String(row.id), row.stripePriceId)
    }
  }
  if (stored.size === 0) return data

  // Rows the write carries (or, when it leaves lineItems out, the original rows,
  // which Payload will write back): fill in the stored id wherever it was stripped.
  const rows: Row[] | undefined = Array.isArray(data.lineItems)
    ? data.lineItems
    : Array.isArray(originalDoc?.lineItems)
      ? (originalDoc.lineItems as Row[]).map((r) => ({ ...r }))
      : undefined
  if (!rows) return data
  for (const row of rows) {
    const key = row?.id != null ? String(row.id) : null
    if (key && stored.has(key) && (row.stripePriceId === undefined || row.stripePriceId === null)) {
      row.stripePriceId = stored.get(key)
    }
  }
  data.lineItems = rows
  return data
}
