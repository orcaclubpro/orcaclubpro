'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionUser } from './session'
import { experienceFor } from './experience'
import { PREVIEW_COOKIE } from './preview'

/**
 * Enter "view as client" mode for a specific client account. Staff only.
 * Sets the preview cookie and drops the previewer on the client home so they
 * see the portal from the ground up.
 */
export async function enterClientPreview(accountId: string): Promise<void> {
  const user = await getSessionUser()
  if (!user || experienceFor(user.role) !== 'staff') redirect('/login')
  if (!accountId) redirect(`/u/${user.username}`)

  const store = await cookies()
  store.set(PREVIEW_COOKIE, accountId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  redirect(`/u/${user.username}`)
}

/** Exit preview mode and return to the staff Clients tab. */
export async function exitClientPreview(): Promise<void> {
  const user = await getSessionUser()
  const store = await cookies()
  store.delete(PREVIEW_COOKIE)
  redirect(user?.username ? `/u/${user.username}/clients` : '/login')
}
