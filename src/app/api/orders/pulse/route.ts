import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Order pulse — a tiny fingerprint of "have any orders I can see changed?".
 *
 * The (spaces) routes are dynamic and uncached, so `revalidatePath` has nothing to
 * expire; what leaves an open tab stale is simply that it never asks again. Orders
 * also move out of band — a Stripe webhook marking an invoice paid, an admin edit,
 * another staff member — where no server action runs in this browser at all.
 *
 * So the client polls this and only calls `router.refresh()` when the value moves,
 * which keeps the heavy route loaders off the polling path. The fingerprint is
 * `count:latestUpdatedAt`: the timestamp catches edits, the count catches deletes
 * (a delete can lower the count without moving the newest timestamp).
 *
 * Scoped by access control — a client's pulse only moves for their own orders.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { docs, totalDocs } = await payload.find({
      collection: 'orders',
      user,
      overrideAccess: false,
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      select: { updatedAt: true },
    })

    const latest = (docs[0] as { updatedAt?: string } | undefined)?.updatedAt ?? ''

    return NextResponse.json(
      { pulse: `${totalDocs}:${latest}` },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    console.error('[orders/pulse]', error)
    return NextResponse.json({ error: 'Failed to read order pulse' }, { status: 500 })
  }
}
