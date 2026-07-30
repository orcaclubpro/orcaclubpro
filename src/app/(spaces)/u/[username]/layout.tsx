import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSessionUser } from '@/app/(spaces)/session'
import { experienceFor } from '@/app/(spaces)/experience'
import { effectiveExperience } from '@/app/(spaces)/preview'
import { CommandConsoleLoader } from '@/components/dashboard/CommandConsoleLoader'
import { PasskeySetupPrompt } from '@/components/dashboard/PasskeySetupPrompt'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  return {
    title: `SPACES | ${username}'s Dashboard`,
  }
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await getSessionUser()

  // Check authentication
  if (!user) {
    redirect('/login')
  }

  // Verify username matches (all roles need matching username)
  if (user.username !== username) {
    // If user has a different username, redirect to their own dashboard
    if (user.username) {
      redirect(`/u/${user.username}`)
    }
    // If user has no username, redirect based on experience
    if (experienceFor(user.role) === 'staff') {
      redirect('/admin')
    }
    // Client without username shouldn't happen, but redirect to login
    redirect('/login')
  }

  const hasPasskey = Boolean((user as any).passkeyCredentials?.length)
  // While staff preview a client's portal, hide staff-only chrome so the view
  // matches what the client actually sees.
  const experience = await effectiveExperience(user)
  const previewing = experience === 'client' && experienceFor(user.role) === 'staff'

  return (
    <>
      {!hasPasskey && !previewing && <PasskeySetupPrompt />}
      {children}
      {/* The powerhouse: search + package builder + retainer, one console.
          Staff-only, and hidden while a staff member previews a client's portal. */}
      {experienceFor(user.role) === 'staff' && !previewing && (
        <CommandConsoleLoader username={username} />
      )}
    </>
  )
}
