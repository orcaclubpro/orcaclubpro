/**
 * task_claim: the atomic pending → in-progress flip with a claimant and a lease.
 *
 * Two pollers or agents must never start the same task. The claim is therefore
 * ONE conditional Mongo update (`findOneAndUpdate`, the OAuth grants pattern in
 * src/lib/oauth/grants.ts), never read-then-write: the filter only matches a
 * task that is still claimable, so of N concurrent claims exactly one matches
 * and the rest see null.
 *
 * A task is claimable by `actor` when it is:
 * - `pending`, or
 * - `in-progress` with an expired lease (the holder died or stalled), or
 * - `in-progress`, held by `actor` itself with a live lease (renewal).
 *
 * An `in-progress` task with no lease (moved there by task_update or the portal)
 * never matches: `leaseExpiresAt <= now` is false for a missing date, so a
 * human-started task can't be taken over by a poller.
 *
 * Pure functions only, so the filter, update and refusal message are unit-tested
 * without a database (claim.test.ts) and race-tested against one (claim.int.test.ts).
 */

export const LEASE_DEFAULT_MINUTES = 30
export const LEASE_MIN_MINUTES = 1
export const LEASE_MAX_MINUTES = 24 * 60

const OBJECT_ID = /^[a-f0-9]{24}$/i

export const isTaskId = (id: unknown): id is string => typeof id === 'string' && OBJECT_ID.test(id)

/** Lease length in minutes, defaulted and clamped to [1, 1440]. */
export function leaseMinutes(minutes?: number | null): number {
  if (minutes == null || !Number.isFinite(minutes)) return LEASE_DEFAULT_MINUTES
  return Math.min(LEASE_MAX_MINUTES, Math.max(LEASE_MIN_MINUTES, Math.round(minutes)))
}

/** Mongo filter that matches the task only while `actor` may claim it. */
export function claimFilter(id: string, actor: string, now: Date) {
  return {
    _id: id,
    $or: [
      { status: 'pending' },
      { status: 'in-progress', leaseExpiresAt: { $lte: now } },
      { status: 'in-progress', claimedBy: actor, leaseExpiresAt: { $gt: now } },
    ],
  }
}

/** The single `$set` a successful claim applies. */
export function claimUpdate(actor: string, now: Date, minutes?: number | null) {
  return {
    $set: {
      status: 'in-progress',
      claimedBy: actor,
      claimedAt: now,
      leaseExpiresAt: new Date(now.getTime() + leaseMinutes(minutes) * 60_000),
      lastActor: actor,
      updatedAt: now,
    },
  }
}

type ClaimDoc = {
  status?: string | null
  claimedBy?: string | null
  leaseExpiresAt?: Date | string | null
}

const toDate = (v: Date | string | null | undefined): Date | null => (v ? new Date(v) : null)

/** How a successful claim came about, from the document as it was before the update. */
export function claimKind(before: ClaimDoc, actor: string, now: Date): 'claimed' | 'renewed' | 'reclaimed' {
  if (before.status === 'pending') return 'claimed'
  const lease = toDate(before.leaseExpiresAt)
  if (before.claimedBy === actor && lease && lease > now) return 'renewed'
  return 'reclaimed'
}

/** Why a claim matched nothing, from a fresh read of the task (null = not found). */
export function claimRefusal(doc: ClaimDoc | null, id: string, now: Date): string {
  if (!doc) return `Task ${id} not found`
  const lease = toDate(doc.leaseExpiresAt)
  if (doc.status === 'in-progress' && doc.claimedBy && lease && lease > now) {
    return `Task ${id} is already claimed by ${doc.claimedBy} until ${lease.toISOString()}`
  }
  if (doc.status === 'in-progress') {
    return `Task ${id} is in progress without a lease (started outside task_claim); it can't be claimed`
  }
  return `Task ${id} is ${doc.status ?? 'in an unknown state'}, not pending; it can't be claimed`
}
