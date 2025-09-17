'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, Edit2, Trash2, Calendar, MapPin } from 'lucide-react'
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
import { ActivityDetailsModal } from './ActivityDetailsModal'

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
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const handleActivityClick = (activity: Activity) => {
    console.log('Activity clicked:', activity.title)
    setSelectedActivity(activity)
    setIsDetailsModalOpen(true)
  }
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
    <Card className="border-dashed border-2 border-cyan-400/30 bg-slate-900/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.1)]">
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-cyan-400/30 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold text-cyan-100">
            No activities planned
          </h3>
          <p className="text-slate-300 mb-6 max-w-md text-sm">
            Get started by adding your first activity for {dayData.location}.
          </p>
          <Button
            onClick={onAddActivity}
            className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-900 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] border-none"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="backdrop-blur-sm"
    >
      <div className="container mx-auto px-6 py-8">
        {/* Day Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div className="flex-1">
            <div className="mb-3">
              <h2 className="text-3xl md:text-4xl font-bold text-cyan-100 mb-2">
                November {4 + dayIndex} - {dayData.location}
              </h2>
            </div>

            {/* Phase indicator */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-400" />
              <p className="text-slate-300 text-sm">
                {dayData.phase}
              </p>
            </div>
          </div>

          <Button
            onClick={onAddActivity}
            size="lg"
            className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-900 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] border-none"
          >
            <Plus className="w-4 h-4" />
            Add Activity
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
                <Card
                  className="border border-cyan-400/30 bg-slate-900/60 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:border-cyan-400/60 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  onClick={() => handleActivityClick(activity)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        {/* Status badges */}
                        <div className="flex items-center gap-2 mb-3">
                          {activity.hasTime ? (
                            <Badge className="gap-1 bg-cyan-400/20 text-cyan-300 border-cyan-400/50 hover:bg-cyan-400/30">
                              <Clock className="w-3 h-3" />
                              {formatTime(activity.time!)}
                            </Badge>
                          ) : (
                            <Badge className="gap-1 bg-pink-400/20 text-pink-300 border-pink-400/50 hover:bg-pink-400/30">
                              <Calendar className="w-3 h-3" />
                              Flexible
                            </Badge>
                          )}

                          {activity.category && (
                            <Badge variant="outline" className="text-xs bg-slate-800/50 text-slate-300 border-slate-500/50 hover:border-slate-400">
                              {getCategoryIcon(activity.category)} {activity.category}
                            </Badge>
                          )}
                        </div>

                        {/* Activity title */}
                        <CardTitle className="text-lg font-semibold mb-2 text-cyan-100">
                          {activity.title}
                        </CardTitle>

                        {/* Description */}
                        {activity.description && (
                          <p className="text-slate-300 text-sm leading-relaxed">
                            {activity.description.length > 100
                              ? `${activity.description.substring(0, 100)}...`
                              : activity.description
                            }
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditActivity(originalIndex)
                          }}
                          className="bg-slate-800/50 border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-400 hover:text-cyan-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Are you sure you want to delete this activity?')) {
                              onDeleteActivity(originalIndex)
                            }
                          }}
                          className="bg-slate-800/50 border-pink-400/50 text-pink-300 hover:bg-pink-400/10 hover:border-pink-400 hover:text-pink-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      </div>

      {/* Activity Details Modal */}
      <ActivityDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        activity={selectedActivity}
        dayIndex={dayIndex}
        startDate={startDate}
      />
    </motion.div>
  )
}