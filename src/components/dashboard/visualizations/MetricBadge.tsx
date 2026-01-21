'use client'

import {
  LucideIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  XCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bell,
} from 'lucide-react'

type IconName =
  | 'Clock'
  | 'CheckCircle'
  | 'AlertCircle'
  | 'Package'
  | 'XCircle'
  | 'DollarSign'
  | 'TrendingUp'
  | 'TrendingDown'
  | 'Bell'

interface MetricBadgeProps {
  icon: IconName
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

// Map icon names to components
const iconMap: Record<IconName, LucideIcon> = {
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  XCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bell,
}

export function MetricBadge({
  icon: iconName,
  label,
  value,
  trend,
  variant = 'default',
}: MetricBadgeProps) {
  const Icon = iconMap[iconName]
  const variantStyles = {
    default: {
      bg: 'bg-white/[0.04]',
      border: 'border-white/[0.08]',
      icon: 'text-intelligence-cyan',
      text: 'text-white',
    },
    success: {
      bg: 'bg-green-400/[0.08]',
      border: 'border-green-400/[0.15]',
      icon: 'text-green-400',
      text: 'text-green-400',
    },
    warning: {
      bg: 'bg-yellow-400/[0.08]',
      border: 'border-yellow-400/[0.15]',
      icon: 'text-yellow-400',
      text: 'text-yellow-400',
    },
    danger: {
      bg: 'bg-red-400/[0.08]',
      border: 'border-red-400/[0.15]',
      icon: 'text-red-400',
      text: 'text-red-400',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-lg ${styles.bg} border ${styles.border} backdrop-blur-sm transition-all duration-300 hover:scale-105`}
    >
      <div className={`p-1.5 rounded-md bg-white/[0.05] ${styles.icon}`}>
        <Icon className="size-3.5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          {label}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-sm font-semibold ${styles.text}`}>{value}</span>
          {trend && (
            <span
              className={`text-xs font-medium ${
                trend === 'up'
                  ? 'text-green-400'
                  : trend === 'down'
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
