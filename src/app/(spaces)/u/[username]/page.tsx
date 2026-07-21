import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { tabsFor } from './tabs'
import { loadStaffHome, loadClientHome, resolveClientAccount } from './dashboard-data'
import { AdminHomeView } from './_views/AdminHomeView'
import { ClientHomeView } from './_views/ClientHomeView'
import { AccountNotFound } from './_views/AccountNotFound'

// Tabs are real routes now (/u/<username>/<tab>) — legacy ?tab= links redirect.
const LEGACY_TAB_IDS = new Set(
  [...tabsFor('staff'), ...tabsFor('client')].map(t => t.id),
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Home - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string; timeframe?: string }>
}) {
  const { username } = await params
  const { tab, timeframe: rawTimeframe } = await searchParams

  if (tab && tab !== 'home' && LEGACY_TAB_IDS.has(tab)) {
    redirect(`/u/${username}/${tab}`)
  }

  const timeframe = rawTimeframe === '30d' ? '30d' : rawTimeframe === '90d' ? '90d' : '7d'

  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')

  const payload = await getPayload({ config })

  // ── Staff (admin / user) ───────────────────────────────────────────────────

  if (user.role === 'admin' || user.role === 'user') {
    const data = await loadStaffHome(payload, user)
    return (
      <AdminHomeView
        user={{ firstName: data.firstName, role: user.role }}
        username={username}
        clientAccounts={data.clientAccounts}
        allOrders={data.allOrders}
        allProjects={data.allProjects}
        allTasks={data.allTasks}
        allPackages={data.allPackages}
        completedTasksCount={data.completedTasksCount}
        completedSprintsCount={data.completedSprintsCount}
        timeframe={timeframe}
        serializedProjects={data.serializedProjects}
      />
    )
  }

  // ── Client ─────────────────────────────────────────────────────────────────

  const clientAccount = await resolveClientAccount(payload, user)
  if (!clientAccount) return <AccountNotFound />

  const data = await loadClientHome(payload, user, clientAccount)
  return (
    <ClientHomeView
      user={{ firstName: data.firstName }}
      username={username}
      showTips={data.showTips}
      clientAccount={clientAccount}
      clientProjects={data.clientProjects}
      orders={data.orders}
      clientSprints={data.clientSprints}
      clientPackages={data.clientPackages}
    />
  )
}
