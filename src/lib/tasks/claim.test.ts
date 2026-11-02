import { describe, expect, test } from 'bun:test'
import {
  LEASE_DEFAULT_MINUTES,
  LEASE_MAX_MINUTES,
  claimFilter,
  claimKind,
  claimRefusal,
  claimUpdate,
  isTaskId,
  leaseMinutes,
} from './claim'

const now = new Date('2026-11-02T22:00:00.000Z')
const later = new Date(now.getTime() + 60_000)
const earlier = new Date(now.getTime() - 60_000)

describe('task claim helpers', () => {
  test('lease defaults to 30 minutes and clamps to 1..1440', () => {
    expect(leaseMinutes()).toBe(LEASE_DEFAULT_MINUTES)
    expect(leaseMinutes(0)).toBe(1)
    expect(leaseMinutes(99_999)).toBe(LEASE_MAX_MINUTES)
    expect(leaseMinutes(Number.NaN)).toBe(LEASE_DEFAULT_MINUTES)
  })

  test('filter matches pending, expired lease, or own live lease only', () => {
    const f = claimFilter('a'.repeat(24), 'mothership', now)
    expect(f._id).toBe('a'.repeat(24))
    expect(f.$or).toEqual([
      { status: 'pending' },
      { status: 'in-progress', leaseExpiresAt: { $lte: now } },
      { status: 'in-progress', claimedBy: 'mothership', leaseExpiresAt: { $gt: now } },
    ])
  })

  test('update sets in-progress, claimant, lease and lastActor in one $set', () => {
    const u = claimUpdate('gojo', now, 10)
    expect(u.$set.status).toBe('in-progress')
    expect(u.$set.claimedBy).toBe('gojo')
    expect(u.$set.lastActor).toBe('gojo')
    expect(u.$set.claimedAt).toEqual(now)
    expect(u.$set.leaseExpiresAt.getTime() - now.getTime()).toBe(10 * 60_000)
  })

  test('outcome: claimed / renewed / reclaimed', () => {
    expect(claimKind({ status: 'pending' }, 'gojo', now)).toBe('claimed')
    expect(claimKind({ status: 'in-progress', claimedBy: 'gojo', leaseExpiresAt: later }, 'gojo', now)).toBe('renewed')
    expect(claimKind({ status: 'in-progress', claimedBy: 'sia', leaseExpiresAt: earlier }, 'gojo', now)).toBe(
      'reclaimed',
    )
    // Own lease that already expired counts as a reclaim, not a renewal.
    expect(claimKind({ status: 'in-progress', claimedBy: 'gojo', leaseExpiresAt: earlier }, 'gojo', now)).toBe(
      'reclaimed',
    )
  })

  test('refusal names the holder, or the reason', () => {
    const id = 'b'.repeat(24)
    expect(claimRefusal(null, id, now)).toBe(`Task ${id} not found`)
    expect(claimRefusal({ status: 'in-progress', claimedBy: 'sia', leaseExpiresAt: later }, id, now)).toContain(
      'already claimed by sia until',
    )
    expect(claimRefusal({ status: 'in-progress' }, id, now)).toContain('without a lease')
    expect(claimRefusal({ status: 'completed' }, id, now)).toContain('is completed, not pending')
  })

  test('task id must be an ObjectId', () => {
    expect(isTaskId('6ae905860b1eb79d52627e40')).toBe(true)
    expect(isTaskId('nope')).toBe(false)
    expect(isTaskId(undefined)).toBe(false)
  })
})
