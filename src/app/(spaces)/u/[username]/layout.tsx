import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSessionUser } from '@/app/(spaces)/session'
import { experienceFor } from '@/app/(spaces)/experience'
import { DashboardTaskManager } from '@/components/dashboard/DashboardTaskManager'
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

  return (
    <>
      {!hasPasskey && <PasskeySetupPrompt />}
      {children}
      <DashboardTaskManager username={username} userRole={user.role} />
    </>
  )
}
