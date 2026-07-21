import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getSessionUser } from '@/app/(spaces)/session'
import { experienceFor } from '@/app/(spaces)/experience'
import { resolveClientAccount, loadClientInvoices } from '../dashboard-data'
import { AccountNotFound } from '../_views/AccountNotFound'
import { OrdersView } from '../_views/OrdersView'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return {
    title: `Invoices - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function InvoicesPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await getSessionUser()
  if (!user || user.username !== username) redirect('/login')
  if (experienceFor(user.role) !== 'client') redirect(`/u/${username}`)

  const payload = await getPayload({ config })
  const clientAccount = await resolveClientAccount(payload, user)
  if (!clientAccount) return <AccountNotFound />

  const { orders, clientPackages } = await loadClientInvoices(payload, clientAccount)

  return (
    <OrdersView
      allOrders={orders as any}
      clientAccount={clientAccount}
      clientPackages={clientPackages as any}
      username={username}
    />
  )
}
