'use client'

import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Pause,
  XCircle,
  Folder,
  Bell,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from './visualizations/ProgressRing'
import { MetricBadge } from './visualizations/MetricBadge'

export function ProjectsList({ projects }: { projects: any[] }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'text-green-400',
          bg: 'bg-green-400/10',
          border: 'border-green-400/20',
          icon: CheckCircle2,
          label: 'Active',
          glowColor: 'bg-green-400',
        }
      case 'on-hold':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          border: 'border-yellow-400/20',
          icon: Pause,
          label: 'On Hold',
          glowColor: 'bg-yellow-400',
        }
      case 'completed':
        return {
          color: 'text-blue-400',
          bg: 'bg-blue-400/10',
          border: 'border-blue-400/20',
          icon: CheckCircle2,
          label: 'Completed',
          glowColor: 'bg-blue-400',
        }
      case 'cancelled':
        return {
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/20',
          icon: XCircle,
          label: 'Cancelled',
          glowColor: 'bg-red-400',
        }
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-400/10',
          border: 'border-gray-400/20',
          icon: AlertCircle,
          label: status,
          glowColor: 'bg-gray-400',
        }
    }
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Not set'
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  const calculateProgress = (project: any) => {
    if (project.status === 'completed') return 100
    if (project.status === 'cancelled') return 0
    if (!project.startDate) return 0

    const start = new Date(project.startDate).getTime()
    const end = project.endDate
      ? new Date(project.endDate).getTime()
      : start + 30 * 24 * 60 * 60 * 1000
    const now = Date.now()

    if (now >= end) return 100
    if (now <= start) return 0

    const progress = Math.min(100, Math.round(((now - start) / (end - start)) * 100))
    return progress
  }

  const getDaysRemaining = (endDate: string | Date | null | undefined) => {
    if (!endDate) return null
    const end = new Date(endDate).getTime()
    const now = Date.now()
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    return days
  }

  // Check for upcoming deadlines (within 7 days)
  const upcomingDeadlines = projects.filter((project: any) => {
    if (!project.endDate || project.status !== 'active') return false
    const daysRemaining = getDaysRemaining(project.endDate)
    return daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7
  })

  return (
    <div className="space-y-8">
      {/* Section Header with Upcoming Deadlines Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <Folder className="size-5 text-intelligence-cyan" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Your Projects</h2>
        </div>
        {upcomingDeadlines.length > 0 && (
          <MetricBadge
            icon="Bell"
            label="Due Soon"
            value={upcomingDeadlines.length}
            variant="warning"
          />
        )}
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        {projects.map((project: any, index: number) => {
          const statusConfig = getStatusConfig(project.status)
          const StatusIcon = statusConfig.icon
          const progress = calculateProgress(project)
          const daysRemaining = getDaysRemaining(project.endDate)

          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-500 hover:scale-[1.01] fluid-enter"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Subtle glow orb */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${statusConfig.glowColor} blur-3xl opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {project.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border} px-2.5 py-0.5 text-xs`}
                      >
                        <StatusIcon className="size-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>
                  {/* Progress Ring */}
                  {project.status !== 'cancelled' && (
                    <ProgressRing
                      progress={progress}
                      size={48}
                      strokeWidth={4}
                      color={
                        project.status === 'on-hold'
                          ? 'rgb(250, 204, 21)'
                          : project.status === 'completed'
                          ? 'rgb(96, 165, 250)'
                          : 'rgb(74, 222, 128)'
                      }
                      showLabel={true}
                    />
                  )}
                </div>

                {/* Progress Bar */}
                {project.status !== 'cancelled' && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </span>
                      <span className="text-xs font-semibold text-gray-300">
                        {progress}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.05]">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                          project.status === 'on-hold'
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-400 opacity-60'
                            : project.status === 'completed'
                            ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                            : 'bg-gradient-to-r from-green-400 to-intelligence-cyan'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="p-2 rounded-md bg-white/[0.04] border border-white/[0.06]">
                      <Calendar className="size-3.5 text-intelligence-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-0.5">
                        Start Date
                      </p>
                      <p className="text-sm text-white font-medium">
                        {formatDate(project.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                    <div className="p-2 rounded-md bg-white/[0.04] border border-white/[0.06]">
                      <Clock className="size-3.5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-0.5">
                        End Date
                      </p>
                      <p className="text-sm text-white font-medium">
                        {formatDate(project.endDate)}
                      </p>
                      {daysRemaining !== null &&
                        daysRemaining > 0 &&
                        project.status === 'active' && (
                          <p className="text-xs text-intelligence-cyan mt-0.5 font-medium">
                            {daysRemaining} days remaining
                          </p>
                        )}
                      {daysRemaining !== null &&
                        daysRemaining < 0 &&
                        project.status === 'active' && (
                          <p className="text-xs text-yellow-400 mt-0.5 font-medium">
                            {Math.abs(daysRemaining)} days overdue
                          </p>
                        )}
                    </div>
                  </div>

                  {project.budget && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      <div className="p-2 rounded-md bg-white/[0.04] border border-white/[0.06]">
                        <DollarSign className="size-3.5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-0.5">
                          Budget
                        </p>
                        <p className="text-sm text-white font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(project.budget)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
