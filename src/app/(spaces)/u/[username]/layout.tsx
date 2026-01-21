import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'

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

  // Verify user is a client
  if (user.role !== 'client') {
    redirect('/admin')
  }

  // Verify username matches
  if (user.username !== username) {
    redirect(`/u/${user.username}`)
  }

  return <>{children}</>
}
