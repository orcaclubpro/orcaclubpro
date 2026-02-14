import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  Building2,
  Mail,
  DollarSign,
  Receipt,
  FolderKanban,
  Users,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { ClientAccount, Order, Project, User as UserType } from '@/types/payload-types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; client: string }>
}) {
  const { client: clientId } = await params

  try {
    const payload = await getPayload({ config })
    const clientAccount = await payload.findByID({
      collection: 'client-accounts',
      id: clientId,
      depth: 0,
    })

    return {
      title: `${clientAccount.name} - Client Details - ORCACLUB Spaces`,
      description: `View details for ${clientAccount.name}`,
    }
  } catch {
    return {
      title: 'Client Not Found - ORCACLUB Spaces',
      description: 'Client account not found',
    }
  }
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ username: string; client: string }>
}) {
  const { username, client: clientId } = await params
  const user = await getCurrentUser()

  // Auth check
  if (!user || user.username !== username) {
    redirect('/login')
  }

  // Only admin and user roles can access client details
  if (user.role === 'client') {
    redirect(`/u/${username}`)
  }

  const payload = await getPayload({ config })

  // Fetch client account with relationships
  let clientAccount: ClientAccount
  try {
    clientAccount = await payload.findByID({
      collection: 'client-accounts',
      id: clientId,
      depth: 2,
    })
  } catch {
    notFound()
  }

  // Access validation: users can only see clients they are assigned to
  if (user.role !== 'admin') {
    const assignedUserIds = Array.isArray(clientAccount.assignedTo)
      ? clientAccount.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
      : []
    if (!assignedUserIds.includes(user.id)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl border border-red-400/20 bg-white/[0.02] backdrop-blur-sm p-8 text-center">
            <div className="inline-flex p-5 rounded-xl bg-red-400/10 border border-red-400/20 mb-6">
              <AlertCircle className="size-10 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 text-sm">
              You do not have permission to view this client account.
            </p>
          </div>
        </div>
      )
    }
  }

  // Fetch related orders
  const { docs: orders } = await payload.find({
    collection: 'orders',
    where: { clientAccount: { equals: clientId } },
    depth: 2,
    sort: '-createdAt',
    limit: 100,
  })

  // Fetch related projects
  const { docs: projects } = await payload.find({
    collection: 'projects',
    where: { client: { equals: clientId } },
    depth: 1,
    sort: '-createdAt',
    limit: 100,
  })

  // Group orders by status
  const pendingOrders = orders.filter((order) => order.status === 'pending')
  const paidOrders = orders.filter((order) => order.status === 'paid')
  const cancelledOrders = orders.filter((order) => order.status === 'cancelled')

  // Calculate totals
  const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.amount || 0), 0)

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          border: 'border-yellow-400/20',
          icon: Clock,
        }
      case 'in-progress':
        return {
          color: 'text-blue-400',
          bg: 'bg-blue-400/10',
          border: 'border-blue-400/20',
          icon: Clock,
        }
      case 'completed':
        return {
          color: 'text-green-400',
          bg: 'bg-green-400/10',
          border: 'border-green-400/20',
          icon: CheckCircle,
        }
      case 'on-hold':
        return {
          color: 'text-orange-400',
          bg: 'bg-orange-400/10',
          border: 'border-orange-400/20',
          icon: AlertCircle,
        }
      case 'cancelled':
        return {
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/20',
          icon: XCircle,
        }
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-400/10',
          border: 'border-gray-400/20',
          icon: Package,
        }
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-2">
            {clientAccount.name}
          </h1>
          <p className="text-gray-400 text-base">
            Client account details and activity
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12]"
        >
          <a
            href={`/admin/collections/client-accounts/${clientId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-2"
          >
            Edit in Admin
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>

      {/* Client Profile Section */}
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-intelligence-cyan/[0.04] rounded-full blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-intelligence-cyan/10 border border-intelligence-cyan/20">
              <Building2 className="size-5 text-intelligence-cyan" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Client Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-sm text-gray-500 uppercase tracking-wider font-medium">
                Contact Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <Mail className="size-4 text-gray-500" />
                  <span className="text-sm">{clientAccount.email}</span>
                </div>
                {clientAccount.company && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Building2 className="size-4 text-gray-500" />
                    <span className="text-sm">{clientAccount.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-3">
              <h3 className="text-sm text-gray-500 uppercase tracking-wider font-medium">
                Financial Summary
              </h3>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-sm text-gray-400">Account Balance:</span>
                  <span
                    className={`text-sm font-semibold ${
                      clientAccount.accountBalance && clientAccount.accountBalance > 0
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {formatCurrency(clientAccount.accountBalance || 0)}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-sm text-gray-400">Total Revenue:</span>
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(totalRevenue)}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-sm text-gray-400">Total Orders:</span>
                  <span className="text-sm font-semibold text-white">{orders.length}</span>
                </div>
              </div>
            </div>

            {/* Assigned Team */}
            <div className="space-y-3">
              <h3 className="text-sm text-gray-500 uppercase tracking-wider font-medium">
                Assigned Team
              </h3>
              {Array.isArray(clientAccount.assignedTo) && clientAccount.assignedTo.length > 0 ? (
                <div className="space-y-2">
                  {clientAccount.assignedTo.map((assignedUser, index) => {
                    const userData =
                      typeof assignedUser === 'string' ? null : (assignedUser as UserType)
                    return (
                      <div key={userData?.id || `user-${index}`} className="flex items-center gap-2">
                        <Users className="size-4 text-gray-500" />
                        <span className="text-sm text-gray-300">
                          {userData
                            ? `${userData.firstName} ${userData.lastName}`
                            : 'Unknown User'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No team members assigned</p>
              )}
            </div>
          </div>
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
                This client has {pendingOrders.length} pending{' '}
                {pendingOrders.length === 1 ? 'order' : 'orders'} awaiting payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <Receipt className="size-5 text-intelligence-cyan" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Orders ({orders.length})
            </h2>
            <p className="text-sm text-gray-400">Order history and invoices</p>
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-8">
            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Pending ({pendingOrders.length})
                  </h3>
                </div>
                <div className="grid gap-4">
                  {pendingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} formatCurrency={formatCurrency} formatDate={formatDate} />
                  ))}
                </div>
              </div>
            )}

            {/* Paid Orders */}
            {paidOrders.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Paid ({paidOrders.length})
                  </h3>
                </div>
                <div className="grid gap-4">
                  {paidOrders.slice(0, 5).map((order) => (
                    <OrderCard key={order.id} order={order} formatCurrency={formatCurrency} formatDate={formatDate} />
                  ))}
                </div>
                {paidOrders.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    Showing 5 of {paidOrders.length} paid orders
                  </p>
                )}
              </div>
            )}

            {/* Cancelled Orders */}
            {cancelledOrders.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <XCircle className="size-4 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Cancelled ({cancelledOrders.length})
                  </h3>
                </div>
                <div className="grid gap-4">
                  {cancelledOrders.map((order) => (
                    <OrderCard key={order.id} order={order} formatCurrency={formatCurrency} formatDate={formatDate} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-12 text-center">
            <div className="relative z-10">
              <div className="inline-flex p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
                <Receipt className="size-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                This client has no orders on record.
              </p>
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-white/[0.06]" />

      {/* Projects Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <FolderKanban className="size-5 text-intelligence-cyan" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Projects ({projects.length})
            </h2>
            <p className="text-sm text-gray-400">Active and completed projects</p>
          </div>
        </div>

        {projects.length > 0 ? (
          <div className="grid gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                getStatusConfig={getStatusConfig}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-12 text-center">
            <div className="relative z-10">
              <div className="inline-flex p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
                <FolderKanban className="size-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                This client has no projects on record.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({
  order,
  formatCurrency,
  formatDate,
}: {
  order: Order
  formatCurrency: (amount: number) => string
  formatDate: (date: string | Date) => string
}) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          color: 'text-green-400',
          bg: 'bg-green-400/10',
          border: 'border-green-400/20',
          label: 'Paid',
        }
      case 'pending':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          border: 'border-yellow-400/20',
          label: 'Pending',
        }
      case 'cancelled':
        return {
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/20',
          label: 'Cancelled',
        }
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-400/10',
          border: 'border-gray-400/20',
          label: status,
        }
    }
  }

  const statusConfig = getStatusConfig(order.status)
  const projectName = order.project || (typeof order.projectRef !== 'string' && order.projectRef?.name)

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6 hover:border-white/[0.12] transition-all duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <p className="text-white font-semibold text-lg">{order.orderNumber}</p>
            <Badge
              variant="outline"
              className={`${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border} px-2 py-0.5 text-xs font-medium`}
            >
              {statusConfig.label}
            </Badge>
          </div>
          {projectName && (
            <p className="text-sm text-gray-400">Project: {projectName}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDate(order.createdAt)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
            Amount
          </p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(order.amount || 0)}
          </p>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({
  project,
  getStatusConfig,
  formatDate,
  formatCurrency,
}: {
  project: Project
  getStatusConfig: (status: string) => {
    color: string
    bg: string
    border: string
    icon: any
  }
  formatDate: (date: string | Date) => string
  formatCurrency: (amount: number) => string
}) {
  const statusConfig = getStatusConfig(project.status)
  const StatusIcon = statusConfig.icon

  const completedMilestones = project.milestones?.filter((m) => m.completed).length || 0
  const totalMilestones = project.milestones?.length || 0

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6 hover:border-white/[0.12] transition-all duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-white font-semibold text-lg">{project.name}</h3>
              <Badge
                variant="outline"
                className={`${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border} px-2 py-0.5 text-xs font-medium flex items-center gap-1`}
              >
                <StatusIcon className="size-3" />
                {project.status.replace('-', ' ')}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-gray-400 line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>

        {/* Project Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {project.startDate && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                Start Date
              </p>
              <p className="text-sm text-gray-300">{formatDate(project.startDate)}</p>
            </div>
          )}
          {project.projectedEndDate && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                Target Date
              </p>
              <p className="text-sm text-gray-300">{formatDate(project.projectedEndDate)}</p>
            </div>
          )}
          {project.budgetAmount && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                Budget
              </p>
              <p className="text-sm text-gray-300">
                {formatCurrency(project.budgetAmount)}
              </p>
            </div>
          )}
          {totalMilestones > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                Milestones
              </p>
              <p className="text-sm text-gray-300">
                {completedMilestones} / {totalMilestones} complete
              </p>
            </div>
          )}
        </div>

        {/* Assigned Team */}
        {Array.isArray(project.assignedTo) && project.assignedTo.length > 0 && (
          <div className="pt-4 border-t border-white/[0.06]">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
              Assigned Team
            </p>
            <div className="flex flex-wrap gap-2">
              {project.assignedTo.map((assignedUser, index) => {
                const userData =
                  typeof assignedUser === 'string' ? null : (assignedUser as UserType)
                return (
                  <Badge
                    key={userData?.id || `assigned-${index}`}
                    variant="outline"
                    className="bg-white/[0.03] border-white/[0.08] text-gray-300 text-xs"
                  >
                    {userData
                      ? `${userData.firstName} ${userData.lastName}`
                      : 'Unknown User'}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
