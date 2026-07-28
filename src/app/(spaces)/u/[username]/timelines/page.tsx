import { redirect } from 'next/navigation'
import { getSessionUser } from '@/app/(spaces)/session'
import { effectiveExperience } from '@/app/(spaces)/preview'
import { TimelinesAdminView } from '../_views/TimelinesAdminView'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return {
    title: `Timelines - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function TimelinesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')
  if (await effectiveExperience(user) !== 'staff') redirect(`/u/${username}`)

  return <TimelinesAdminView username={username} />
}
