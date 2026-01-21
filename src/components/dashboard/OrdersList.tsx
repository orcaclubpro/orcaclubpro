import { getPayload } from 'payload'
import config from '@payload-config'
import {
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export async function OrdersList({ accountId }: { accountId: string }) {
  const payload = await getPayload({ config })

  const { docs: orders } = await payload.find({
    collection: 'orders',
    where: {
      clientAccount: { equals: accountId },
    },
    sort: '-createdAt',
    limit: 10,
  })

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          color: 'text-green-400',
          bg: 'bg-green-400/10',
          border: 'border-green-400/20',
          icon: CheckCircle2,
          label: 'Paid',
        }
      case 'pending':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          border: 'border-yellow-400/20',
          icon: Clock,
          label: 'Pending',
        }
      case 'cancelled':
        return {
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/20',
          icon: XCircle,
          label: 'Cancelled',
        }
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-400/10',
          border: 'border-gray-400/20',
          icon: Receipt,
          label: status,
        }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-8">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <Receipt className="size-5 text-intelligence-cyan" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Recent Orders</h2>
        </div>

        {/* Empty State */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-12 fluid-enter">
          <div className="relative z-10 text-center">
            <div className="inline-flex p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
              <Package className="size-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Your order history will appear here once you place your first order.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
          <Receipt className="size-5 text-intelligence-cyan" />
        </div>
        <h2 className="text-2xl font-semibold text-white">Recent Orders</h2>
      </div>

      {/* Orders Container */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md fluid-enter">
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-intelligence-cyan/[0.04] rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Mobile-friendly card view */}
          <div className="block md:hidden space-y-2.5 p-4">
            {orders.map((order: any, index: number) => {
              const statusConfig = getStatusConfig(order.status)
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={order.id}
                  className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                        Order Number
                      </p>
                      <p className="font-semibold text-white text-base">{order.orderNumber}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border} px-2.5 py-0.5 text-xs`}
                    >
                      <StatusIcon className="size-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                        Amount
                      </p>
                      <p className="text-white font-semibold text-sm">
                        {formatCurrency(order.amount || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                        Date
                      </p>
                      <p className="text-gray-400 font-medium text-sm">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any, index: number) => {
                  const statusConfig = getStatusConfig(order.status)
                  const StatusIcon = statusConfig.icon

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-all duration-300 fluid-enter"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-4 px-6 text-white font-semibold text-sm">
                        {order.orderNumber}
                      </td>
                      <td className="py-4 px-6 text-white font-semibold text-base">
                        {formatCurrency(order.amount || 0)}
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          variant="outline"
                          className={`${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border} px-2.5 py-0.5 text-xs`}
                        >
                          <StatusIcon className="size-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-gray-400 font-medium text-sm">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
