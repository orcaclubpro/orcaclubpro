import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'

/**
 * Revalidates the homepage when a collection item is modified.
 *
 * This hook runs after a document is created or updated in a Payload collection.
 * It triggers Next.js revalidation to refresh cached content on the frontend.
 *
 * @example
 * ```typescript
 * const MyCollection: CollectionConfig = {
 *   slug: 'my-collection',
 *   hooks: {
 *     afterChange: [revalidateHomepage],
 *   },
 * }
 * ```
 */
export const revalidateHomepage: CollectionAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  // Skip revalidation if disabled via context flag
  // This prevents infinite loops when updating docs within hooks
  if (!context.disableRevalidate) {
    payload.logger.info(`[Revalidation] Homepage revalidated due to change in document: ${doc.id}`)
    revalidatePath('/', 'page')
  }
  return doc
}

/**
 * Revalidates the homepage when a collection item is deleted.
 *
 * This hook runs after a document is deleted from a Payload collection.
 * It triggers Next.js revalidation to refresh cached content on the frontend.
 *
 * @example
 * ```typescript
 * const MyCollection: CollectionConfig = {
 *   slug: 'my-collection',
 *   hooks: {
 *     afterDelete: [revalidateHomepageOnDelete],
 *   },
 * }
 * ```
 */
export const revalidateHomepageOnDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`[Revalidation] Homepage revalidated due to deletion of document: ${doc.id}`)
    revalidatePath('/', 'page')
  }
  return doc
}

/**
 * Creates a revalidation hook for multiple paths.
 *
 * Use this factory function when a collection update should revalidate
 * multiple pages across your site (e.g., homepage, services page, portfolio).
 *
 * @param paths - Array of paths to revalidate
 * @returns CollectionAfterChangeHook that revalidates all specified paths
 *
 * @example
 * ```typescript
 * const MyCollection: CollectionConfig = {
 *   slug: 'my-collection',
 *   hooks: {
 *     afterChange: [createMultiPathRevalidate(['/', '/services', '/portfolio'])],
 *   },
 * }
 * ```
 */
export const createMultiPathRevalidate = (paths: string[]): CollectionAfterChangeHook => {
  return ({ doc, req: { payload, context } }) => {
    if (!context.disableRevalidate) {
      paths.forEach(path => {
        payload.logger.info(`[Revalidation] Path ${path} revalidated due to change in document: ${doc.id}`)
        revalidatePath(path, 'page')
      })
    }
    return doc
  }
}

/**
 * Creates a delete hook for multiple paths.
 *
 * Use this factory function when a collection deletion should revalidate
 * multiple pages across your site.
 *
 * @param paths - Array of paths to revalidate
 * @returns CollectionAfterDeleteHook that revalidates all specified paths
 *
 * @example
 * ```typescript
 * const MyCollection: CollectionConfig = {
 *   slug: 'my-collection',
 *   hooks: {
 *     afterDelete: [createMultiPathRevalidateOnDelete(['/', '/services'])],
 *   },
 * }
 * ```
 */
export const createMultiPathRevalidateOnDelete = (paths: string[]): CollectionAfterDeleteHook => {
  return ({ doc, req: { payload, context } }) => {
    if (!context.disableRevalidate) {
      paths.forEach(path => {
        payload.logger.info(`[Revalidation] Path ${path} revalidated due to deletion of document: ${doc.id}`)
        revalidatePath(path, 'page')
      })
    }
    return doc
  }
}
