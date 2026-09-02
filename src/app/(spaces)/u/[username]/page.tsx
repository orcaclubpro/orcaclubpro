import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { effectiveExperience } from '@/app/(spaces)/preview'
import { tabsFor } from './tabs'
import { loadStaffHome, loadStaffActivity, loadClientHome, resolveActiveClientAccount } from './dashboard-data'
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
  const experience = await effectiveExperience(user)

  // ── Staff (admin / user) ───────────────────────────────────────────────────

  if (experience === 'staff') {
    // The activity feed is the tab the page opens on, so it loads alongside
    // the ledger rather than after it.
    const [data, { activity }] = await Promise.all([
      loadStaffHome(payload, user),
      loadStaffActivity(payload, user),
    ])
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
        activeRetainers={data.activeRetainers}
        activity={activity}
      />
    )
  }

  // ── Client (real client, or staff previewing "view as client") ─────────────

  const clientAccount = await resolveActiveClientAccount(payload, user)
  if (!clientAccount) return <AccountNotFound />

  const data = await loadClientHome(payload, user, clientAccount)
  // When staff previews, greet with the client's name rather than the staff user's.
  const firstName = user.role === 'client' ? data.firstName : (clientAccount.firstName ?? clientAccount.name)
  return (
    <ClientHomeView
      user={{ firstName }}
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
