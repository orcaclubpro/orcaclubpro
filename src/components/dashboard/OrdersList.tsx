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
          <div className="p-2.5 rounded-lg bg-[var(--space-bg-card)] border border-[var(--space-border-hard)]">
            <Receipt className="size-5" style={{ color: 'var(--space-accent)' }} />
          </div>
          <h2 className="text-2xl font-semibold text-[var(--space-text-primary)]">Recent Orders</h2>
        </div>

        {/* Empty State */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] p-12 fluid-enter">
          <div className="relative z-10 text-center">
            <div className="inline-flex p-5 rounded-xl bg-[var(--space-bg-card)] border border-[var(--space-border-hard)] mb-6">
              <Package className="size-10 text-[var(--space-text-muted)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--space-text-primary)] mb-2">No Orders Yet</h3>
            <p className="text-[var(--space-text-tertiary)] text-sm max-w-md mx-auto">
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
        <div className="p-2.5 rounded-lg bg-[var(--space-bg-card)] border border-[var(--space-border-hard)]">
          <Receipt className="size-5" style={{ color: 'var(--space-accent)' }} />
        </div>
        <h2 className="text-2xl font-semibold text-[var(--space-text-primary)]">Recent Orders</h2>
      </div>

      {/* Orders Container */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] fluid-enter">
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-[rgba(139,156,182,0.06)] rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Mobile-friendly card view */}
          <div className="block md:hidden space-y-2.5 p-4">
            {orders.map((order: any, index: number) => {
              const statusConfig = getStatusConfig(order.status)
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={order.id}
                  className="relative overflow-hidden rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] p-4 hover:bg-[var(--space-bg-card-hover)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${Math.min(index * 40, 200)}ms`, animationDuration: '300ms' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-[var(--space-text-primary)] text-base">
                        {(order.lineItems as any[])?.[0]?.title ?? order.orderNumber}
                      </p>
                      {(order.lineItems as any[])?.[0]?.title && (
                        <p className="text-xs text-[var(--space-text-muted)] font-mono mt-0.5">#{order.orderNumber}</p>
                      )}
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
                      <p className="text-xs text-[var(--space-text-muted)] uppercase tracking-wider font-medium mb-1">
                        Amount
                      </p>
                      <p className="text-[var(--space-text-primary)] font-semibold text-sm">
                        {formatCurrency(order.amount || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--space-text-muted)] uppercase tracking-wider font-medium mb-1">
                        Date
                      </p>
                      <p className="text-[var(--space-text-tertiary)] font-medium text-sm">
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
                <tr className="border-b border-[var(--space-border-hard)]">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--space-text-tertiary)] uppercase tracking-wider">
                    Order
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--space-text-tertiary)] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--space-text-tertiary)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-[var(--space-text-tertiary)] uppercase tracking-wider">
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
                      className="border-b border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card-hover)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${Math.min(index * 40, 200)}ms`, animationDuration: '300ms' }}
                    >
                      <td className="py-4 px-6">
                        <p className="text-[var(--space-text-primary)] font-semibold text-sm">
                          {(order.lineItems as any[])?.[0]?.title ?? order.orderNumber}
                        </p>
                        {(order.lineItems as any[])?.[0]?.title && (
                          <p className="text-xs text-[var(--space-text-muted)] font-mono mt-0.5">#{order.orderNumber}</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-[var(--space-text-primary)] font-semibold text-base">
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
                      <td className="py-4 px-6 text-[var(--space-text-tertiary)] font-medium text-sm">
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
