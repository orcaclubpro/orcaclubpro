import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AccountOverview } from '@/components/dashboard/AccountOverview'
import { OrdersList } from '@/components/dashboard/OrdersList'
import { ProjectsList } from '@/components/dashboard/ProjectsList'
import {
  Mail,
  HelpCircle,
  FileText,
  ExternalLink,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivityTimeline, type ActivityEvent } from '@/components/dashboard/visualizations/ActivityTimeline'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Dashboard - ${username} - ORCACLUB`,
    description: 'Your ORCACLUB client dashboard',
  }
}

export default async function DashboardPage({
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

  // Fetch client account with orders
  const clientAccount = user.clientAccount
    ? await payload.findByID({
        collection: 'client-accounts',
        id: typeof user.clientAccount === 'string' ? user.clientAccount : user.clientAccount.id,
        depth: 2,
      })
    : null

  // Fetch orders for visualizations
  const { docs: orders } = clientAccount
    ? await payload.find({
        collection: 'orders',
        where: {
          clientAccount: { equals: clientAccount.id },
        },
        sort: '-createdAt',
        limit: 50,
      })
    : { docs: [] }

  if (!clientAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="relative overflow-hidden max-w-md w-full rounded-2xl border border-red-500/30 bg-black/60 backdrop-blur-xl p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 text-center">
            <div className="inline-flex p-6 rounded-2xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm mb-6">
              <HelpCircle className="size-12 text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Account Not Found
            </h2>
            <p className="text-gray-300 mb-8 text-lg leading-relaxed">
              Your client account could not be found. Please contact support for
              assistance.
            </p>
            <Button
              asChild
              variant="default"
              size="lg"
              className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-semibold shadow-lg shadow-intelligence-cyan/20 hover:shadow-intelligence-cyan/40 transition-all duration-300"
            >
              <a href="/contact" className="gap-2">
                <Mail className="size-4" />
                Contact Support
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  // Generate recent activity from orders and projects
  const recentActivity: ActivityEvent[] = [
    ...orders.slice(0, 10).map((order: any) => ({
      id: order.id,
      title: `Order ${order.orderNumber}`,
      description: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.amount || 0),
      timestamp: new Date(order.createdAt),
      icon:
        order.status === 'paid'
          ? 'CheckCircle' as const
          : order.status === 'pending'
          ? 'Clock' as const
          : 'XCircle' as const,
      variant:
        order.status === 'paid'
          ? ('success' as const)
          : order.status === 'pending'
          ? ('warning' as const)
          : ('danger' as const),
    })),
    ...(clientAccount.projects || []).slice(0, 5).map((project: any) => ({
      id: project.id,
      title: `Project: ${project.name}`,
      description: project.description || 'Project created',
      timestamp: new Date(project.createdAt || Date.now()),
      icon: 'FolderPlus' as const,
      variant:
        project.status === 'active'
          ? ('success' as const)
          : project.status === 'completed'
          ? ('default' as const)
          : ('warning' as const),
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 7)

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-16">
      {/* Welcome Section - Minimal Glass Hero */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-8 md:p-12 fluid-enter">
        {/* Subtle glow orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-intelligence-cyan/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/[0.04] rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08]">
                <div className="size-1.5 rounded-full bg-intelligence-cyan shadow-[0_0_8px_rgba(103,232,249,0.6)]" />
                <p className="text-intelligence-cyan text-sm font-medium">
                  {greeting}
                </p>
              </div>

              <h1 className="text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight">
                {user.firstName}{' '}
                <span className="gradient-text">{user.lastName}</span>
              </h1>

              <p className="text-gray-400 text-base max-w-2xl leading-relaxed">
                Welcome to your <span className="font-medium text-white">ORCA</span>
                <span className="font-medium gradient-text">CLUB</span> dashboard.
                Manage your projects, track orders, and stay connected.
              </p>
            </div>

            {/* Quick Actions - Minimal Glass Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                variant="default"
                size="lg"
                className="group bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/10 hover:shadow-intelligence-cyan/20 transition-all duration-300"
              >
                <a href="/contact" className="gap-2">
                  <Mail className="size-4 group-hover:scale-105 transition-transform" />
                  Contact Us
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300"
              >
                <a
                  href="https://docs.orcaclub.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <FileText className="size-4" />
                  Resources
                  <ExternalLink className="size-3 opacity-70" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Overview */}
      <AccountOverview account={clientAccount} orders={orders} />

      {/* Recent Activity Timeline */}
      {recentActivity.length > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6 fluid-enter">
          <div className="absolute top-0 left-0 w-48 h-48 bg-intelligence-cyan/[0.04] rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Activity className="size-5 text-intelligence-cyan" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>
            </div>
            <ActivityTimeline events={recentActivity} maxEvents={7} />
          </div>
        </div>
      )}

      {/* Projects Section */}
      {clientAccount.projects && clientAccount.projects.length > 0 ? (
        <ProjectsList projects={clientAccount.projects} />
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-12 fluid-enter">
          <div className="relative z-10 text-center">
            <div className="inline-flex p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
              <FileText className="size-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Projects Yet
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              You don't have any projects at the moment. Get started by
              reaching out to discuss your next project.
            </p>
            <Button
              asChild
              variant="default"
              size="lg"
              className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/10 hover:shadow-intelligence-cyan/20 transition-all duration-300"
            >
              <a href="/contact" className="gap-2">
                <Mail className="size-4" />
                Start a Project
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Orders Section */}
      <OrdersList accountId={clientAccount.id} />
    </div>
  )
}
