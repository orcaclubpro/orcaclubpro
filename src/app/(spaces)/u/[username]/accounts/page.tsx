import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { experienceFor } from '@/app/(spaces)/experience'
import { resolveClientAccount, loadClientCredentials } from '../dashboard-data'
import { AccountNotFound } from '../_views/AccountNotFound'
import { ClientCredentialsTab } from '@/components/dashboard/ClientCredentialsTab'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return {
    title: `Accounts - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function AccountsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')
  if (experienceFor(user.role) !== 'client') redirect(`/u/${username}`)

  const payload = await getPayload({ config })
  const clientAccount = await resolveClientAccount(payload, user)
  if (!clientAccount) return <AccountNotFound />

  const { clientCredentials } = await loadClientCredentials(payload, clientAccount)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20">
      <ClientCredentialsTab credentials={clientCredentials} />
    </div>
  )
}
