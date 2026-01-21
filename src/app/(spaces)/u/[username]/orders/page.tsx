import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { EnhancedOrderCard } from '@/components/dashboard/EnhancedOrderCard'
import { Receipt, AlertCircle, CheckCircle, Clock, Package } from 'lucide-react'
import { MetricBadge } from '@/components/dashboard/visualizations/MetricBadge'
import type { Order } from '@/types/payload-types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Orders - ${username} - ORCACLUB Spaces`,
    description: 'View your order history and invoices',
  }
}

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await getCurrentUser()

  if (!user || user.role !== 'client' || user.username !== username) {
    redirect('/login')
  }

  const payload = await getPayload({ config })

  // Fetch client account
  const clientAccount = user.clientAccount
    ? await payload.findByID({
        collection: 'client-accounts',
        id: typeof user.clientAccount === 'string' ? user.clientAccount : user.clientAccount.id,
        depth: 1,
      })
    : null

  if (!clientAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border border-red-400/20 bg-white/[0.02] backdrop-blur-sm p-8 text-center">
          <div className="inline-flex p-5 rounded-xl bg-red-400/10 border border-red-400/20 mb-6">
            <AlertCircle className="size-10 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Account Not Found
          </h2>
          <p className="text-gray-400 text-sm">
            Your client account could not be found. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  // Fetch all orders for this client
  const { docs: allOrders } = await getPayload({ config }).then((payload) =>
    payload.find({
      collection: 'orders',
      where: {
        clientAccount: { equals: clientAccount.id },
      },
      sort: '-createdAt',
      limit: 100,
    })
  )

  // Group orders by status
  const pendingOrders = allOrders.filter((order: Order) => order.status === 'pending')
  const paidOrders = allOrders.filter((order: Order) => order.status === 'paid')
  const cancelledOrders = allOrders.filter((order: Order) => order.status === 'cancelled')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-16">
      {/* Page Header with Metrics */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-3 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <Receipt className="size-8 text-intelligence-cyan" />
            </div>
            Orders & Payments
          </h1>
          <p className="text-gray-400 text-base ml-[76px]">
            Manage your orders, view invoices, and make payments
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex flex-wrap gap-3">
          <MetricBadge
            icon="Clock"
            label="Pending"
            value={pendingOrders.length}
            variant={pendingOrders.length > 0 ? 'warning' : 'default'}
          />
          <MetricBadge
            icon="CheckCircle"
            label="Paid"
            value={paidOrders.length}
            variant="success"
          />
          {cancelledOrders.length > 0 && (
            <MetricBadge
              icon="AlertCircle"
              label="Cancelled"
              value={cancelledOrders.length}
              variant="danger"
            />
          )}
        </div>
      </div>

      {/* Outstanding Balance Alert */}
      {clientAccount.accountBalance && clientAccount.accountBalance > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-yellow-400/20 bg-white/[0.02] backdrop-blur-sm p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/[0.05] rounded-full blur-3xl" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
              <AlertCircle className="size-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1.5 text-base">
                Outstanding Balance
              </h3>
              <p className="text-3xl font-bold text-yellow-400 mb-2">
                {formatCurrency(clientAccount.accountBalance)}
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                You have {pendingOrders.length} pending {pendingOrders.length === 1 ? 'order' : 'orders'}.
                Click "Pay Now" on any pending order below to complete payment via Stripe.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Orders Section */}
      {pendingOrders.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
              <Clock className="size-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Pending Payment ({pendingOrders.length})
              </h2>
              <p className="text-sm text-gray-400">Orders awaiting payment</p>
            </div>
          </div>

          <div className="grid gap-4">
            {pendingOrders.map((order: Order) => (
              <EnhancedOrderCard key={order.id} order={order} isPending={true} />
            ))}
          </div>
        </div>
      )}

      {/* Paid Orders Section */}
      {paidOrders.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-400/10 border border-green-400/20">
              <CheckCircle className="size-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Paid Orders ({paidOrders.length})
              </h2>
              <p className="text-sm text-gray-400">Completed payments</p>
            </div>
          </div>

          <div className="grid gap-4">
            {paidOrders.slice(0, 10).map((order: Order) => (
              <EnhancedOrderCard key={order.id} order={order} isPending={false} />
            ))}
          </div>

          {paidOrders.length > 10 && (
            <p className="text-center text-sm text-gray-500">
              Showing 10 of {paidOrders.length} paid orders
            </p>
          )}
        </div>
      )}

      {/* Cancelled Orders Section */}
      {cancelledOrders.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-400/10 border border-red-400/20">
              <AlertCircle className="size-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Cancelled Orders ({cancelledOrders.length})
              </h2>
              <p className="text-sm text-gray-400">Orders that were cancelled</p>
            </div>
          </div>

          <div className="grid gap-4">
            {cancelledOrders.map((order: Order) => (
              <EnhancedOrderCard key={order.id} order={order} isPending={false} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allOrders.length === 0 && (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-12 text-center">
          <div className="relative z-10">
            <div className="inline-flex p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
              <Package className="size-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Your order history will appear here once you place your first order.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
