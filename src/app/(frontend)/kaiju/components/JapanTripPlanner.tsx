'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { TripHeader } from './TripHeader'
import { FloatingDaySelector } from './FloatingDaySelector'
import { DayContent } from './DayContent'
import { ActivityModal } from './ActivityModal'
import { tripData as staticTripData, type Activity, type TripDay, type TripData } from '../data/tripData'
import { createKaijuActivity, updateKaijuActivity, deleteKaijuActivity, fetchActivitiesByDay } from '../lib/actions'
import { useScrollPosition } from '../hooks/useScrollPosition'
import { toast } from 'sonner'

interface JapanTripPlannerProps {
  initialTripData?: Record<number, Activity[]> | null
}

interface EditingActivity {
  dayIndex: number
  activityIndex: number
  activity: Activity
  taskId?: string // Add taskId for Payload CMS integration
}

export function JapanTripPlanner({ initialTripData }: JapanTripPlannerProps) {
  // Always use static trip data for structure, but activities come from Payload
  const tripData = staticTripData
  const [isPending, startTransition] = useTransition()
  const [isClient, setIsClient] = useState(false)

  // Always call hooks (React rules), but guard their usage
  const router = useRouter()
  const { isScrolledPastHero } = useScrollPosition()

  // Ensure we're on the client before using browser APIs
  useEffect(() => {
    setIsClient(true)
  }, [])

  const [currentDay, setCurrentDay] = useState(0)
  const [activities, setActivities] = useState<Record<number, Activity[]>>(
    initialTripData || {}
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<EditingActivity | null>(null)

  const handleAddActivity = (dayIndex: number) => {
    setEditingActivity(null)
    setCurrentDay(dayIndex)
    setIsModalOpen(true)
  }

  const handleEditActivity = (dayIndex: number, activityIndex: number) => {
    const activity = activities[dayIndex][activityIndex]
    // We'll need to find the taskId - for now, we'll use the activity id as taskId
    setEditingActivity({
      dayIndex,
      activityIndex,
      activity,
      taskId: activity.id // Assuming the activity id matches the Payload task id
    })
    setIsModalOpen(true)
  }

  const handleDeleteActivity = async (dayIndex: number, activityIndex: number) => {
    const activity = activities[dayIndex][activityIndex]

    startTransition(async () => {
      try {
        // Delete from Payload CMS
        if (activity.id) {
          await deleteKaijuActivity(activity.id)
          toast.success('Kaiju activity eliminated successfully!')
        }

        // Refresh activities for current day
        const updatedActivities = await fetchActivitiesByDay(dayIndex)
        setActivities(prev => ({
          ...prev,
          [dayIndex]: updatedActivities
        }))
      } catch (error) {
        console.error('Error deleting activity:', error)
        toast.error('Failed to eliminate kaiju activity. Please try again.')
      }
    })
  }

  const handleSaveActivity = async (activity: Activity) => {
    startTransition(async () => {
      try {
        if (editingActivity && editingActivity.taskId) {
          // Edit existing activity in Payload CMS - use currentDay as dayIndex
          await updateKaijuActivity(editingActivity.taskId, activity, currentDay)
          toast.success('Kaiju activity updated successfully!')

          // Update local state
          setActivities(prev => ({
            ...prev,
            [editingActivity.dayIndex]: prev[editingActivity.dayIndex].map((a, index) =>
              index === editingActivity.activityIndex ? activity : a
            )
          }))
        } else {
          // Add new activity to Payload CMS - use currentDay as dayIndex
          const newActivity = await createKaijuActivity(activity, currentDay)
          // Update the activity id to match the created activity id
          activity.id = newActivity?.id || activity.id
          toast.success('New kaiju activity deployed successfully!')

          // Add to local state
          setActivities(prev => ({
            ...prev,
            [currentDay]: [...(prev[currentDay] || []), activity]
          }))
        }

        setIsModalOpen(false)
        setEditingActivity(null)

        // Refresh activities for current day
        const updatedActivities = await fetchActivitiesByDay(currentDay)
        setActivities(prev => ({
          ...prev,
          [currentDay]: updatedActivities
        }))
      } catch (error) {
        console.error('Error saving activity:', error)
        toast.error('Kaiju activity deployment failed. Please try again.')
      }
    })
  }

  const navigateDay = (direction: number) => {
    const newDay = currentDay + direction
    if (newDay >= 0 && newDay < tripData.days.length) {
      setCurrentDay(newDay)
      // Load activities for the new day
      loadActivitiesForDay(newDay)
    }
  }

  const handleJumpToDay = (dayIndex: number) => {
    setCurrentDay(dayIndex)
    // Load activities for the selected day
    loadActivitiesForDay(dayIndex)
  }

  const loadActivitiesForDay = async (dayIndex: number) => {
    try {
      const dayActivities = await fetchActivitiesByDay(dayIndex)
      setActivities(prev => ({
        ...prev,
        [dayIndex]: dayActivities
      }))
    } catch (error) {
      console.error('Error loading activities for day:', error)
    }
  }

  // Load activities for current day on component mount
  useEffect(() => {
    loadActivitiesForDay(currentDay)
  }, [])

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

        <FloatingDaySelector
          currentDay={currentDay}
          totalDays={tripData.days.length}
          onJumpToDay={handleJumpToDay}
          onNavigate={navigateDay}
          isVisible={isScrolledPastHero}
          startDate={tripData.startDate}
        />

        <AnimatePresence mode="wait">
          <DayContent
            key={currentDay}
            dayData={currentDayData}
            dayIndex={currentDay}
            startDate={tripData.startDate}
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
        isPending={isPending}
      />
    </div>
  )
}