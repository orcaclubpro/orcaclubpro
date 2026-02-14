import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Building2, DollarSign, Plus, ShoppingCart, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { ClientAccount } from '@/types/payload-types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Clients - ${username} - ORCACLUB Spaces`,
    description: 'View and manage your client accounts',
  }
}

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await getCurrentUser()

  if (!user || user.username !== username) {
    redirect('/login')
  }

  if (!user.username) {
    redirect('/login')
  }

  const payload = await getPayload({ config })

  // Fetch client accounts based on role
  const { docs: clientAccounts } = await payload.find({
    collection: 'client-accounts',
    where:
      user.role === 'admin'
        ? {}
        : { assignedTo: { contains: user.id } },
    depth: 1,
    sort: '-createdAt',
  })

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="size-8 text-intelligence-cyan" />
              {user.role === 'admin' ? 'All Clients' : 'Your Clients'}
            </h1>
            <p className="text-gray-400">
              {user.role === 'admin'
                ? 'View and manage all client accounts across the platform'
                : 'Manage your assigned client accounts'}
            </p>
          </div>
          <Button
            asChild
            className="bg-intelligence-cyan hover:bg-intelligence-cyan/90 text-black font-semibold"
          >
            <Link href="/admin/collections/client-accounts/create" className="gap-2">
              <Plus className="size-4" />
              New Client Account
            </Link>
          </Button>
        </div>
      </div>

      {/* Client Accounts Grid */}
      {clientAccounts && clientAccounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientAccounts.map((client) => {
            const balance = client.accountBalance ?? 0
            const orders = client.totalOrders ?? 0
            const balanceColor = balance === 0 ? 'text-green-500' : 'text-red-500'

            return (
              <Link key={client.id} href={`/u/${username}/clients/${client.id}`}>
                <Card className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-intelligence-cyan/50 transition-all duration-300 cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold text-white truncate">
                          {client.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400 truncate">
                          {client.email}
                        </CardDescription>
                      </div>
                      {balance > 0 && (
                        <Badge variant="destructive" className="shrink-0">
                          Outstanding
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Company */}
                    {client.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="size-4 text-gray-500" />
                        <span className="text-gray-300 truncate">{client.company}</span>
                      </div>
                    )}

                    {/* Account Balance */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <DollarSign className="size-4" />
                        <span>Balance</span>
                      </div>
                      <span className={`text-lg font-bold ${balanceColor}`}>
                        {formatCurrency(balance)}
                      </span>
                    </div>

                    {/* Total Orders */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ShoppingCart className="size-4" />
                        <span>Orders</span>
                      </div>
                      <span className="text-lg font-semibold text-white">{orders}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        // Empty State
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="p-4 rounded-full bg-white/5 inline-flex mb-4">
              <Users className="size-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Client Accounts</h3>
            <p className="text-gray-400 mb-6">
              {user.role === 'admin'
                ? 'No client accounts have been created yet. Create your first client account to get started.'
                : 'You are not assigned to any client accounts at the moment. Contact your admin to get assigned.'}
            </p>
            {user.role === 'admin' && (
              <Button
                asChild
                variant="default"
                size="lg"
                className="bg-intelligence-cyan hover:bg-intelligence-cyan/90 text-black"
              >
                <Link href="/admin/collections/client-accounts/create" className="gap-2">
                  <Plus className="size-4" />
                  Create Client Account
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
