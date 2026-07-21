import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { experienceFor } from '@/app/(spaces)/experience'
import {
  loadStaffProjectsTab,
  resolveClientAccount,
  loadClientProjectsTab,
} from '../dashboard-data'
import { AccountNotFound } from '../_views/AccountNotFound'
import { ProjectsAdminView } from '../_views/ProjectsAdminView'
import { ProjectsClientView } from '../_views/ProjectsClientView'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return {
    title: `Projects - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function ProjectsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')

  const payload = await getPayload({ config })

  if (experienceFor(user.role) === 'staff') {
    const { serializedProjects, clientOptions } = await loadStaffProjectsTab(payload, user)
    return (
      <ProjectsAdminView
        serializedProjects={serializedProjects}
        clientOptions={clientOptions}
        username={username}
        userRole={user.role}
      />
    )
  }

  const clientAccount = await resolveClientAccount(payload, user)
  if (!clientAccount) return <AccountNotFound />

  const { serializedClientProjects } = await loadClientProjectsTab(payload, clientAccount)
  return <ProjectsClientView serializedProjects={serializedClientProjects} username={username} />
}
