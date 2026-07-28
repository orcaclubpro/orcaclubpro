import { cookies } from 'next/headers'
import { cache } from 'react'
import { experienceFor, type Experience } from './experience'

// ── Client-view preview ("View as client") ────────────────────────────────────
// Staff (admin/user) can preview the portal exactly as a specific client sees it.
// The chosen client-account id rides in an httpOnly cookie so every server route,
// loader, and the nav read it without threading a query param through links.
//
// PRESENTATION + account-resolution only. Data scoping is unchanged — client
// loaders already fetch by clientAccount id, and only staff can ever set this
// cookie, so a real client can never fake a preview.

export const PREVIEW_COOKIE = 'orca_preview_client'

type Userish = { role?: string | null } | null | undefined

/** The previewed client-account id, or null. Non-staff always get null. */
export const getPreviewClientId = cache(async (user: Userish): Promise<string | null> => {
  if (!user || experienceFor(user.role) !== 'staff') return null
  const store = await cookies()
  return store.get(PREVIEW_COOKIE)?.value ?? null
})

/**
 * The experience the UI should render. Same as experienceFor(role), except a
 * staff member with an active preview renders as 'client'. Use this — not
 * experienceFor(user.role) — for every route guard and nav decision in (spaces).
 */
export async function effectiveExperience(user: Userish): Promise<Experience> {
  if (await getPreviewClientId(user)) return 'client'
  return experienceFor(user?.role)
}
