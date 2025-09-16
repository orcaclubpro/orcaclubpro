'use client'

import { motion } from 'framer-motion'
import { Target, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface TaskStatsProps {
  stats: {
    total: number
    pending: number
    in_progress: number
    completed: number
    failed: number
  }
}

export function TaskStats({ stats }: TaskStatsProps) {
  const statItems = [
    {
      label: 'Total Hunts',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      borderColor: 'border-cyan-400/20',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/20',
    },
    {
      label: 'In Progress',
      value: stats.in_progress,
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/20',
    },
    {
      label: 'Failed',
      value: stats.failed,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20',
    },
  ]

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className={`bg-slate-800/50 border-2 ${item.borderColor} ${item.bgColor} backdrop-blur-sm`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{item.label}</p>
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Completion Rate Bar */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Hunt Success Rate</span>
          <span className="text-sm font-semibold text-green-400">{completionRate}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, delay: 0.8 }}
            className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Rookie Hunter</span>
          <span>Elite Hunter</span>
        </div>
      </motion.div>
    </div>
  )
}