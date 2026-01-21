'use client'

import {
  CheckCircle,
  Clock,
  XCircle,
  FolderPlus,
  type LucideIcon
} from 'lucide-react'

export interface ActivityEvent {
  id: string
  title: string
  description?: string
  timestamp: Date
  icon: 'CheckCircle' | 'Clock' | 'XCircle' | 'FolderPlus'
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

interface ActivityTimelineProps {
  events: ActivityEvent[]
  maxEvents?: number
}

export function ActivityTimeline({ events, maxEvents = 5 }: ActivityTimelineProps) {
  const displayEvents = events.slice(0, maxEvents)

  const getIconComponent = (iconName: ActivityEvent['icon']): LucideIcon => {
    const iconMap = {
      CheckCircle,
      Clock,
      XCircle,
      FolderPlus,
    }
    return iconMap[iconName]
  }

  const getVariantColors = (variant: ActivityEvent['variant'] = 'default') => {
    switch (variant) {
      case 'success':
        return {
          dot: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]',
          icon: 'text-green-400',
          iconBg: 'bg-green-400/10 border-green-400/20',
        }
      case 'warning':
        return {
          dot: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]',
          icon: 'text-yellow-400',
          iconBg: 'bg-yellow-400/10 border-yellow-400/20',
        }
      case 'danger':
        return {
          dot: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]',
          icon: 'text-red-400',
          iconBg: 'bg-red-400/10 border-red-400/20',
        }
      default:
        return {
          dot: 'bg-intelligence-cyan shadow-[0_0_8px_rgba(103,232,249,0.4)]',
          icon: 'text-intelligence-cyan',
          iconBg: 'bg-intelligence-cyan/10 border-intelligence-cyan/20',
        }
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (displayEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {displayEvents.map((event, index) => {
        const Icon = getIconComponent(event.icon)
        const colors = getVariantColors(event.variant)
        const isLast = index === displayEvents.length - 1

        return (
          <div key={event.id} className="relative group">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[18px] top-[36px] bottom-[-4px] w-px bg-white/[0.06]" />
            )}

            {/* Event content */}
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-all duration-300">
              {/* Icon with dot */}
              <div className="relative flex-shrink-0">
                <div
                  className={`p-2 rounded-lg ${colors.iconBg} border backdrop-blur-sm`}
                >
                  <Icon className={`size-4 ${colors.icon}`} />
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 size-2 rounded-full ${colors.dot}`}
                />
              </div>

              {/* Event details */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium text-white leading-snug">
                  {event.title}
                </p>
                {event.description && (
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {event.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimestamp(event.timestamp)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
