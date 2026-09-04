import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { effectiveExperience } from '@/app/(spaces)/preview'
import { loadStaffFilesTab } from '../dashboard-data'
import { FilesView } from '../_views/FilesView'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return {
    title: `Files - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function FilesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')
  if (await effectiveExperience(user) !== 'staff') redirect(`/u/${username}`)

  const payload = await getPayload({ config })
  const { allFiles, allProjects, allSprints, clientAccounts } = await loadStaffFilesTab(payload, user)

  return (
    <FilesView
      allFiles={allFiles}
      allProjects={allProjects}
      allSprints={allSprints}
      clientAccounts={clientAccounts}
      currentUserEmail={user.email ?? ''}
    />
  )
}
