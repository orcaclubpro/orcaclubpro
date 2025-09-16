'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TripHeader } from './TripHeader'
import { DayNavigation } from './DayNavigation'
import { DayContent } from './DayContent'
import { ActivityModal } from './ActivityModal'
import { tripData, type Activity, type TripDay } from '../data/tripData'

export function JapanTripPlanner() {
  const [currentDay, setCurrentDay] = useState(0)
  const [activities, setActivities] = useState<Record<number, Activity[]>>(
    Object.fromEntries(
      tripData.days.map((_, index) => [index, tripData.days[index].activities])
    )
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<{
    dayIndex: number
    activityIndex: number
    activity: Activity
  } | null>(null)

  const handleAddActivity = (dayIndex: number) => {
    setEditingActivity(null)
    setCurrentDay(dayIndex)
    setIsModalOpen(true)
  }

  const handleEditActivity = (dayIndex: number, activityIndex: number) => {
    const activity = activities[dayIndex][activityIndex]
    setEditingActivity({ dayIndex, activityIndex, activity })
    setIsModalOpen(true)
  }

  const handleDeleteActivity = (dayIndex: number, activityIndex: number) => {
    setActivities(prev => ({
      ...prev,
      [dayIndex]: prev[dayIndex].filter((_, index) => index !== activityIndex)
    }))
  }

  const handleSaveActivity = (activity: Activity) => {
    if (editingActivity) {
      // Edit existing activity
      setActivities(prev => ({
        ...prev,
        [editingActivity.dayIndex]: prev[editingActivity.dayIndex].map((a, index) =>
          index === editingActivity.activityIndex ? activity : a
        )
      }))
    } else {
      // Add new activity
      setActivities(prev => ({
        ...prev,
        [currentDay]: [...(prev[currentDay] || []), activity]
      }))
    }
    setIsModalOpen(false)
    setEditingActivity(null)
  }

  const navigateDay = (direction: number) => {
    const newDay = currentDay + direction
    if (newDay >= 0 && newDay < tripData.days.length) {
      setCurrentDay(newDay)
    }
  }

  const currentDayData: TripDay = {
    ...tripData.days[currentDay],
    activities: activities[currentDay] || []
  }

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <TripHeader />
        
        <DayNavigation
          currentDay={currentDay}
          totalDays={tripData.days.length}
          currentDayData={currentDayData}
          onNavigate={navigateDay}
          onJumpToDay={setCurrentDay}
          startDate={tripData.startDate}
        />
        
        <AnimatePresence mode="wait">
          <DayContent
            key={currentDay}
            dayData={currentDayData}
            dayIndex={currentDay}
            onAddActivity={() => handleAddActivity(currentDay)}
            onEditActivity={(activityIndex) => handleEditActivity(currentDay, activityIndex)}
            onDeleteActivity={(activityIndex) => handleDeleteActivity(currentDay, activityIndex)}
          />
        </AnimatePresence>
      </motion.div>

      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingActivity(null)
        }}
        onSave={handleSaveActivity}
        activity={editingActivity?.activity}
        isEdit={!!editingActivity}
      />
    </div>
  )
}