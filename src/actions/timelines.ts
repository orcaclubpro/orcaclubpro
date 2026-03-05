'use server'

import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cookieName, computeHash } from '@/lib/timeline-access'

export async function verifyTimelineAccess(
  slug: string,
  enteredCode: string,
): Promise<{ ok: boolean; error?: string }> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'timelines',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })

  const timeline = docs[0]
  if (!timeline) return { ok: false, error: 'Timeline not found.' }

  const storedCode = timeline.accessCode as string | null | undefined
  if (!storedCode) return { ok: true }

  if (enteredCode.trim() !== storedCode.trim()) {
    return { ok: false, error: 'Incorrect access code.' }
  }

  const hash = await computeHash(enteredCode, slug)
  const jar = await cookies()
  jar.set(cookieName(slug), hash, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return { ok: true }
}
