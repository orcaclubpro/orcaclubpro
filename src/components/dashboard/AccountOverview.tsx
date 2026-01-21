import type { ClientAccount, Order } from '@/types/payload-types'
import {
  DollarSign,
  ShoppingCart,
  Briefcase,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { Sparkline } from './visualizations/Sparkline'
import { MiniBar } from './visualizations/MiniBar'

export function AccountOverview({
  account,
  orders = [],
}: {
  account: ClientAccount
  orders?: Order[]
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const hasBalance = (account.accountBalance || 0) > 0
  const activeProjectsCount =
    account.projects?.filter((p: any) => p.status === 'active').length || 0

  // Calculate order status distribution
  const orderStatusCounts = orders.reduce(
    (acc, order: any) => {
      const status = order.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const orderDistribution = [
    {
      value: orderStatusCounts['paid'] || 0,
      color: 'rgb(74, 222, 128)', // green-400
      label: 'Paid',
    },
    {
      value: orderStatusCounts['pending'] || 0,
      color: 'rgb(250, 204, 21)', // yellow-400
      label: 'Pending',
    },
    {
      value: orderStatusCounts['cancelled'] || 0,
      color: 'rgb(248, 113, 113)', // red-400
      label: 'Cancelled',
    },
  ]

  // Generate balance trend data (last 6 months)
  const generateBalanceTrend = () => {
    const sortedOrders = [...orders].sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    const now = Date.now()
    const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60 * 1000

    // Get balance snapshots for each month
    const monthlyBalances: number[] = []
    for (let i = 5; i >= 0; i--) {
      const monthEnd = now - i * 30 * 24 * 60 * 60 * 1000
      const ordersUntilMonth = sortedOrders.filter(
        (o: any) => new Date(o.createdAt).getTime() <= monthEnd
      )
      const pendingBalance = ordersUntilMonth
        .filter((o: any) => o.status === 'pending')
        .reduce((sum, o: any) => sum + (o.amount || 0), 0)
      monthlyBalances.push(pendingBalance)
    }

    return monthlyBalances.length > 0 ? monthlyBalances : [0, 0, 0, 0, 0, 0]
  }

  const balanceTrend = generateBalanceTrend()

  const stats = [
    {
      label: 'Account Balance',
      value: formatCurrency(account.accountBalance || 0),
      description: hasBalance ? 'Outstanding balance' : 'All caught up',
      icon: DollarSign,
      color: hasBalance ? 'text-yellow-400' : 'text-green-400',
      showAlert: hasBalance,
    },
    {
      label: 'Total Orders',
      value: account.totalOrders || 0,
      description: 'All-time orders',
      icon: ShoppingCart,
      color: 'text-intelligence-cyan',
      showAlert: false,
    },
    {
      label: 'Active Projects',
      value: activeProjectsCount,
      description: 'Currently in progress',
      icon: Briefcase,
      color: 'text-blue-400',
      showAlert: false,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Financial Alert - Minimal Glass */}
      {hasBalance && (
        <div className="relative overflow-hidden rounded-xl border border-yellow-500/20 bg-white/[0.02] backdrop-blur-sm p-6 fluid-enter">
          <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/[0.05] rounded-full blur-3xl" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertCircle className="size-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1.5 text-base">
                Payment Due
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                You have an outstanding balance of{' '}
                <span className="font-semibold text-yellow-400">
                  {formatCurrency(account.accountBalance || 0)}
                </span>
                . Please make a payment to keep your services active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - Refined Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-500 hover:scale-[1.01] fluid-enter"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Subtle glow effect */}
              <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500 ${
                stat.color === 'text-yellow-400' || stat.color === 'text-green-400'
                  ? 'bg-yellow-400'
                  : stat.color === 'text-intelligence-cyan'
                  ? 'bg-intelligence-cyan'
                  : 'bg-blue-400'
              }`} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] transition-transform duration-300 group-hover:scale-105">
                    <Icon className={`size-5 ${stat.color}`} />
                  </div>
                  {stat.showAlert && (
                    <div className="size-2 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-bold ${stat.color} tracking-tight`}>
                    {stat.value}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {stat.description}
                    </p>
                    {/* Show sparkline for balance card */}
                    {stat.label === 'Account Balance' && balanceTrend.length > 1 && (
                      <Sparkline
                        data={balanceTrend}
                        color={hasBalance ? 'rgb(250, 204, 21)' : 'rgb(74, 222, 128)'}
                        height={20}
                        width={60}
                        showDot={true}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Stats Summary with Order Distribution - Minimal Glass */}
      {account.totalOrders && account.totalOrders > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6 fluid-enter">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-intelligence-cyan/[0.06] rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <TrendingUp className="size-4 text-intelligence-cyan" />
                </div>
                <h3 className="font-semibold text-white text-base">Account Summary</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Projects
                </p>
                <p className="text-2xl font-bold text-white">
                  {account.projects?.length || 0}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Active
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {activeProjectsCount}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Completed
                </p>
                <p className="text-2xl font-bold text-blue-400">
                  {account.projects?.filter((p: any) => p.status === 'completed')
                    .length || 0}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-intelligence-cyan">
                  {account.totalOrders}
                </p>
              </div>
            </div>

            {/* Order Status Distribution */}
            {orders.length > 0 && (
              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
                  Order Status Distribution
                </p>
                <MiniBar segments={orderDistribution} height={6} showLabels={true} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
