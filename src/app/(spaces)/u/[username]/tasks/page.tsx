import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { effectiveExperience } from '@/app/(spaces)/preview'
import { loadStaffTasksTab } from '../dashboard-data'
import { TasksView } from '../_views/TasksView'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return {
    title: `Tasks - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function TasksPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')
  if (await effectiveExperience(user) !== 'staff') redirect(`/u/${username}`)

  const payload = await getPayload({ config })
  const { tasks, sprints, projects } = await loadStaffTasksTab(payload, user)

  return <TasksView tasks={tasks} sprints={sprints} projects={projects} />
}
