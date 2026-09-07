import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { effectiveExperience } from '@/app/(spaces)/preview'
import { loadStaffAnalytics } from '../dashboard-data'
import { AnalyticsView } from '../_views/AnalyticsView'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Analytics - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')
  // effectiveExperience, not experienceFor — a staff member previewing a client
  // resolves to 'client' and must not land on the studio's books.
  if ((await effectiveExperience(user)) !== 'staff') redirect(`/u/${username}`)

  const payload = await getPayload({ config })
  const data = await loadStaffAnalytics(payload, user)

  return (
    <AnalyticsView
      username={username}
      clientAccounts={data.clientAccounts}
      allOrders={data.allOrders}
      allProjects={data.allProjects}
      allPackages={data.allPackages}
      serializedProjects={data.serializedProjects}
      activeRetainers={data.activeRetainers}
      retainerPortfolio={data.retainerPortfolio}
      truncated={data.truncated}
    />
  )
}
