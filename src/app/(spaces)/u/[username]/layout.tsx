import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { DashboardTaskManager } from '@/components/dashboard/DashboardTaskManager'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await getCurrentUser()

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
    // If user has no username, redirect based on role
    if (user.role === 'admin' || user.role === 'user') {
      redirect('/admin')
    }
    // Client without username shouldn't happen, but redirect to login
    redirect('/login')
  }

  return (
    <>
      {children}
      <DashboardTaskManager username={username} />
    </>
  )
}
