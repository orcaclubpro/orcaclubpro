import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { experienceFor } from '@/app/(spaces)/experience'
import { loadStaffClientsTab } from '../dashboard-data'
import { ClientsView } from '../_views/ClientsView'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return {
    title: `Clients - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function ClientsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')
  if (experienceFor(user.role) !== 'staff') redirect(`/u/${username}`)

  const payload = await getPayload({ config })
  const { clientAccounts, serializedProjects, allOrders } = await loadStaffClientsTab(payload, user)

  return (
    <ClientsView
      clientAccounts={clientAccounts}
      username={username}
      userRole={user.role}
      serializedProjects={serializedProjects}
      allOrders={allOrders}
    />
  )
}
