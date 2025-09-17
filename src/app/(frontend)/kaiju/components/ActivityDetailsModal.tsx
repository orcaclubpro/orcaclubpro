'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Calendar, MapPin, Tag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type Activity, getCategoryIcon } from '../data/tripData'

interface ActivityDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  activity: Activity | null
  dayIndex: number
  startDate: string
}

export function ActivityDetailsModal({
  isOpen,
  onClose,
  activity,
  dayIndex,
  startDate
}: ActivityDetailsModalProps) {
  if (!activity) return null

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour12 = parseInt(hours) % 12 || 12
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM'
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatDate = (startDate: string, dayIndex: number) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayIndex)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-cyan-400/50 shadow-[0_0_50px_rgba(0,255,255,0.3)]">
        <DialogHeader className="border-b border-cyan-400/20 pb-6">
          <DialogTitle className="text-2xl font-bold text-cyan-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center">
              {activity.category && (
                <span className="text-lg">{getCategoryIcon(activity.category)}</span>
              )}
            </div>
            {activity.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Activity Header Info */}
          <div className="flex flex-wrap gap-3">
            {/* Date Badge */}
            <Badge className="bg-slate-800/50 text-slate-300 border-slate-500/50 hover:border-slate-400">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(startDate, dayIndex)}
            </Badge>

            {/* Time Badge */}
            {activity.hasTime ? (
              <Badge className="bg-cyan-400/20 text-cyan-300 border-cyan-400/50">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(activity.time!)}
              </Badge>
            ) : (
              <Badge className="bg-pink-400/20 text-pink-300 border-pink-400/50">
                <Calendar className="w-3 h-3 mr-1" />
                Flexible Timing
              </Badge>
            )}

            {/* Category Badge */}
            {activity.category && (
              <Badge className="bg-purple-400/20 text-purple-300 border-purple-400/50">
                <Tag className="w-3 h-3 mr-1" />
                {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
              </Badge>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-cyan-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-pink-400" />
                Activity Details
              </h3>
              <div className="bg-slate-800/30 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4">
                <p className="text-slate-300 leading-relaxed">
                  {activity.description}
                </p>
              </div>
            </div>
          )}

          {/* Activity Insights */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-cyan-100">Quick Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800/30 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-100">Duration</span>
                </div>
                <p className="text-slate-300 text-sm">
                  {activity.hasTime ? 'Scheduled activity' : 'Flexible duration - plan as needed'}
                </p>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-cyan-100">Type</span>
                </div>
                <p className="text-slate-300 text-sm">
                  {activity.category ? activity.category.charAt(0).toUpperCase() + activity.category.slice(1) + ' Experience' : 'General Activity'}
                </p>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          {activity.category && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-cyan-100">Tips & Recommendations</h3>
              <div className="bg-gradient-to-r from-cyan-400/10 to-purple-400/10 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {activity.category === 'cultural' && "Immerse yourself in the local culture. Consider learning basic Japanese phrases and understanding local customs."}
                  {activity.category === 'food' && "Try local specialties and don't be afraid to explore street food. Ask locals for recommendations!"}
                  {activity.category === 'nature' && "Bring comfortable walking shoes and a camera. Check weather conditions beforehand."}
                  {activity.category === 'shopping' && "Bring cash as many places don't accept cards. Look for tax-free shopping opportunities."}
                  {activity.category === 'entertainment' && "Check opening hours and book tickets in advance if needed. Learn about local entertainment customs."}
                  {activity.category === 'transport' && "Keep your IC card handy and download offline maps. Allow extra time for navigation in new areas."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-cyan-400/20">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-900 font-bold shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] border-none"
          >
            Close Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}