'use client'

import { motion } from 'framer-motion'
import { Plus, Clock, Edit2, Trash2, Calendar, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  type TripDay, 
  type Activity, 
  getCategoryIcon, 
  getCategoryColor 
} from '../data/tripData'

interface DayContentProps {
  dayData: TripDay
  dayIndex: number
  startDate: string
  onAddActivity: () => void
  onEditActivity: (activityIndex: number) => void
  onDeleteActivity: (activityIndex: number) => void
}

export function DayContent({
  dayData,
  dayIndex,
  startDate,
  onAddActivity,
  onEditActivity,
  onDeleteActivity
}: DayContentProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour12 = parseInt(hours) % 12 || 12
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM'
    return `${hour12}:${minutes} ${ampm}`
  }

  const sortedActivities = [...dayData.activities].sort((a, b) => {
    // Sort timed activities first, then by time, then untimed activities
    if (a.hasTime && !b.hasTime) return -1
    if (!a.hasTime && b.hasTime) return 1
    if (a.hasTime && b.hasTime) {
      return (a.time || '').localeCompare(b.time || '')
    }
    return 0
  })

  const EmptyState = () => (
    <div className="border-2 border-dashed border-cyan-400/30 rounded-xl bg-slate-800/20 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-6 filter drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">🎯</div>
          <h3 className="text-2xl font-bold text-cyan-100 mb-3 font-mono tracking-wide">
            NO ACTIVITIES DETECTED
          </h3>
          <p className="text-slate-300 mb-8 max-w-md font-mono text-sm tracking-wide">
            Initialize mission planning for {dayData.location.toUpperCase()}. 
            Deploy your first activity to begin tactical operations.
          </p>
          <Button
            onClick={onAddActivity}
            size="lg"
            className="
              bg-gradient-to-r from-cyan-500 to-cyan-600 
              hover:from-cyan-400 hover:to-cyan-500
              text-slate-900 font-mono font-bold tracking-wider
              shadow-[0_0_20px_rgba(0,255,255,0.3)]
              hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]
              border-none
              transition-all duration-300
            "
          >
            <Plus className="w-4 h-4 mr-2" />
            DEPLOY FIRST MISSION
          </Button>
        </motion.div>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-900/50 backdrop-blur-sm relative"
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      <div className="relative z-10 container mx-auto px-8 py-12">
        {/* Day Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div className="flex-1">
            {/* Mission header with glow */}
            <div className="relative mb-4">
              <h2 className="text-4xl md:text-5xl font-bold text-cyan-100 font-mono tracking-wider relative z-10">
                NOV {new Date(new Date(startDate).getTime() + dayIndex * 24 * 60 * 60 * 1000).getDate()} - {dayData.location.toUpperCase()}
              </h2>
              <div className="absolute inset-0 text-4xl md:text-5xl font-bold text-cyan-400/30 blur-sm font-mono tracking-wider">
                NOV {new Date(new Date(startDate).getTime() + dayIndex * 24 * 60 * 60 * 1000).getDate()} - {dayData.location.toUpperCase()}
              </div>
            </div>
            
            {/* Phase indicator */}
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-pink-400" />
              <p className="text-pink-100 font-mono tracking-wide text-lg">
                MISSION: {dayData.phase.toUpperCase()}
              </p>
            </div>
          </div>
          
          <Button
            onClick={onAddActivity}
            size="lg"
            className="
              bg-gradient-to-r from-cyan-500 to-cyan-600 
              hover:from-cyan-400 hover:to-cyan-500
              text-slate-900 font-mono font-bold tracking-wider
              shadow-[0_0_20px_rgba(0,255,255,0.3)]
              hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]
              border-none transition-all duration-300
              min-w-[200px]
            "
          >
            <Plus className="w-4 h-4 mr-2" />
            DEPLOY MISSION
          </Button>
        </div>

      {/* Activities List */}
      <div className="space-y-4 min-h-[400px]">
        {sortedActivities.length === 0 ? (
          <EmptyState />
        ) : (
          sortedActivities.map((activity, index) => {
            const originalIndex = dayData.activities.indexOf(activity)
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="group relative">
                  {/* Glowing border effect */}
                  <div className="absolute -inset-px bg-gradient-to-r from-cyan-400/50 via-pink-400/50 to-cyan-400/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  
                  {/* Main card */}
                  <div className="relative bg-slate-800/80 backdrop-blur-sm border border-cyan-400/30 rounded-xl overflow-hidden group-hover:border-cyan-400/60 transition-all duration-300">
                    {/* Activity type indicator bar */}
                    <div className={`h-1 ${activity.hasTime ? 'bg-gradient-to-r from-cyan-400 to-blue-400' : 'bg-gradient-to-r from-pink-400 to-purple-400'}`} />
                    
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          {/* Status badges */}
                          <div className="flex items-center gap-3 mb-4">
                            {activity.hasTime ? (
                              <Badge
                                variant="secondary"
                                className="bg-cyan-400/20 text-cyan-300 border-cyan-400/50 font-mono tracking-wider"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(activity.time!)}
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-pink-400/20 text-pink-300 border-pink-400/50 font-mono tracking-wider"
                              >
                                <Calendar className="w-3 h-3 mr-1" />
                                FLEXIBLE
                              </Badge>
                            )}
                            
                            {activity.category && (
                              <Badge
                                variant="outline"
                                className="bg-slate-700/50 text-slate-300 border-slate-500/50 hover:border-slate-400 font-mono text-xs"
                              >
                                {getCategoryIcon(activity.category)} {activity.category.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Mission title */}
                          <h3 className="text-xl font-bold text-cyan-100 mb-3 font-mono tracking-wide group-hover:text-cyan-50 transition-colors">
                            {activity.title.toUpperCase()}
                          </h3>
                          
                          {/* Description */}
                          {activity.description && (
                            <p className="text-slate-300 leading-relaxed font-mono text-sm tracking-wide">
                              {activity.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditActivity(originalIndex)}
                            className="
                              bg-slate-700/50 border-cyan-400/50 text-cyan-300 
                              hover:bg-cyan-400/10 hover:border-cyan-400 hover:text-cyan-100
                              font-mono text-xs tracking-wider
                            "
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('CONFIRM: Delete this mission?')) {
                                onDeleteActivity(originalIndex)
                              }
                            }}
                            className="
                              bg-slate-700/50 border-pink-400/50 text-pink-300 
                              hover:bg-pink-400/10 hover:border-pink-400 hover:text-pink-100
                              font-mono text-xs tracking-wider
                            "
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      </div>
    </motion.div>
  )
}