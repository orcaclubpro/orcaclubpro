import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { experienceFor } from '@/app/(spaces)/experience'
import {
  loadStaffPackagesTab,
  resolveClientAccount,
  loadClientPackagesTab,
} from '../dashboard-data'
import { AccountNotFound } from '../_views/AccountNotFound'
import { PackagesAdminView } from '../_views/PackagesAdminView'
import { PackagesClientView } from '../_views/PackagesClientView'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return {
    title: `Packages - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function PackagesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')

  const payload = await getPayload({ config })

  if (experienceFor(user.role) === 'staff') {
    const { allPackages } = await loadStaffPackagesTab(payload)
    return <PackagesAdminView allPackages={allPackages} username={username} />
  }

  const clientAccount = await resolveClientAccount(payload, user)
  if (!clientAccount) return <AccountNotFound />

  const { clientPackages } = await loadClientPackagesTab(payload, clientAccount)
  return <PackagesClientView clientPackages={clientPackages} username={username} />
}
