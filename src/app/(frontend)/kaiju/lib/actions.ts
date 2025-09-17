/**
 * Simplified server actions for managing KaijuActivities via Payload CMS
 * ONLY uses dayIndex field for day-aware activities - minimal integration
 */

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Activity, TripConfig } from '../data/tripData'

// Define the simplified KaijuActivity type with ONLY dayIndex
export interface KaijuActivity {
  id: string
  title: string
  description?: string
  time?: string
  hasTime: boolean
  category?: 'cultural' | 'food' | 'nature' | 'shopping' | 'entertainment' | 'transport'
  dayIndex: number
  createdAt?: string
  updatedAt?: string
}

/**
 * Convert KaijuActivity to Activity (simple 1:1 mapping)
 */
function kaijuActivityToActivity(kaijuActivity: KaijuActivity): Activity {
  return {
    id: kaijuActivity.id,
    title: kaijuActivity.title,
    description: kaijuActivity.description,
    time: kaijuActivity.time,
    hasTime: kaijuActivity.hasTime,
    category: kaijuActivity.category,
  }
}

/**
 * Convert Activity to KaijuActivity data for creation/update (ONLY dayIndex)
 */
function activityToKaijuActivityData(
  activity: Activity,
  dayIndex: number
): Partial<KaijuActivity> {
  return {
    title: activity.title,
    description: activity.description,
    time: activity.time,
    hasTime: activity.hasTime,
    category: activity.category,
    dayIndex,
  }
}

/**
 * Fetch activities organized by day (0-15)
 */
export async function fetchActivitiesByDay(dayIndex: number): Promise<Activity[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'kaiju-activities',
      where: {
        dayIndex: {
          equals: dayIndex,
        },
      },
      sort: 'createdAt',
      limit: 1000,
    })

    const kaijuActivities = result.docs as KaijuActivity[]
    return kaijuActivities.map(kaijuActivityToActivity)
  } catch (error) {
    console.error('Error fetching activities by day:', error)
    return []
  }
}

/**
 * Fetch all activities organized by day index
 */
export async function fetchKaijuActivities(): Promise<Record<number, Activity[]>> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'kaiju-activities',
      limit: 1000,
      sort: 'createdAt',
    })

    if (!result.docs.length) {
      return {}
    }

    const kaijuActivities = result.docs as KaijuActivity[]

    // Group activities by dayIndex
    const activitiesByDay: Record<number, Activity[]> = {}

    for (const kaijuActivity of kaijuActivities) {
      const dayIndex = kaijuActivity.dayIndex
      if (!activitiesByDay[dayIndex]) {
        activitiesByDay[dayIndex] = []
      }
      activitiesByDay[dayIndex].push(kaijuActivityToActivity(kaijuActivity))
    }

    return activitiesByDay
  } catch (error) {
    console.error('Error fetching kaiju activities:', error)
    return {}
  }
}

/**
 * Create a new kaiju activity with only dayIndex
 */
export async function createKaijuActivity(
  activity: Activity,
  dayIndex: number
): Promise<KaijuActivity | null> {
  try {
    const payload = await getPayload({ config })

    const activityData = activityToKaijuActivityData(activity, dayIndex)

    const newActivity = await payload.create({
      collection: 'kaiju-activities',
      data: activityData as any,
    })

    return newActivity as KaijuActivity
  } catch (error) {
    console.error('Error creating kaiju activity:', error)
    throw new Error(`Failed to create kaiju activity: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update an existing kaiju activity with only dayIndex
 */
export async function updateKaijuActivity(
  activityId: string,
  activity: Activity,
  dayIndex: number
): Promise<KaijuActivity | null> {
  try {
    const payload = await getPayload({ config })

    const activityData = activityToKaijuActivityData(activity, dayIndex)

    const updatedActivity = await payload.update({
      collection: 'kaiju-activities',
      id: activityId,
      data: activityData as any,
    })

    return updatedActivity as KaijuActivity
  } catch (error) {
    console.error('Error updating kaiju activity:', error)
    throw new Error(`Failed to update kaiju activity: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete a kaiju activity
 */
export async function deleteKaijuActivity(activityId: string): Promise<boolean> {
  try {
    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'kaiju-activities',
      id: activityId,
    })

    return true
  } catch (error) {
    console.error('Error deleting kaiju activity:', error)
    throw new Error(`Failed to delete kaiju activity: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}





/**
 * Search activities by title or description within a specific day
 */
export async function searchKaijuActivities(query: string, dayIndex?: number): Promise<Activity[]> {
  try {
    const payload = await getPayload({ config })

    const whereClause: any = {
      or: [
        {
          title: {
            contains: query,
          },
        },
        {
          description: {
            contains: query,
          },
        },
      ],
    }

    // If dayIndex is provided, filter by day as well
    if (typeof dayIndex === 'number') {
      whereClause.and = [
        whereClause,
        {
          dayIndex: {
            equals: dayIndex,
          },
        },
      ]
      delete whereClause.or
    }

    const result = await payload.find({
      collection: 'kaiju-activities',
      where: whereClause,
      sort: 'createdAt',
      limit: 100,
    })

    const kaijuActivities = result.docs as KaijuActivity[]
    return kaijuActivities.map(kaijuActivityToActivity)
  } catch (error) {
    console.error('Error searching kaiju activities:', error)
    return []
  }
}

/**
 * Extended interface for scheduled activities with computed datetime
 */
export interface ScheduledActivity {
  id: string
  title: string
  time: string
  dayIndex: number
  location: string
  dateTime: Date
  timeRemaining: string
  category?: Activity['category']
}

/**
 * Fetch all scheduled activities across all 16 days with computed date times
 */
export async function fetchAllScheduledActivities(): Promise<ScheduledActivity[]> {
  try {
    const payload = await getPayload({ config })

    // Trip start date from static data
    const tripStartDate = '2024-11-04'

    // Get all activities that have scheduled times
    const result = await payload.find({
      collection: 'kaiju-activities',
      where: {
        hasTime: {
          equals: true,
        },
      },
      sort: ['dayIndex', 'time'],
      limit: 1000,
    })

    const kaijuActivities = result.docs as KaijuActivity[]

    // Get trip data for location information
    const { tripData } = await import('../data/tripData')

    // Convert to ScheduledActivity format with computed DateTime
    const scheduledActivities: ScheduledActivity[] = kaijuActivities
      .filter(activity => activity.time) // Ensure time exists
      .map(activity => {
        // Get location from trip data
        const dayData = tripData.days[activity.dayIndex]
        const location = dayData ? dayData.location : 'Unknown Location'

        // Compute full DateTime: startDate + dayIndex + time
        const startDate = new Date(tripStartDate)
        const activityDate = new Date(startDate)
        activityDate.setDate(startDate.getDate() + activity.dayIndex)

        // Parse time (assuming format like "09:00" or "14:30")
        const [hours, minutes] = (activity.time || '00:00').split(':').map(Number)
        activityDate.setHours(hours, minutes, 0, 0)

        // Calculate time remaining
        const now = new Date()
        const timeDiff = activityDate.getTime() - now.getTime()

        let timeRemaining = ''
        if (timeDiff > 0) {
          const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60))
          const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

          if (hoursRemaining > 0) {
            timeRemaining = `${hoursRemaining}h ${minutesRemaining}m`
          } else {
            timeRemaining = `${minutesRemaining}m`
          }
        } else {
          timeRemaining = 'Past'
        }

        return {
          id: activity.id,
          title: activity.title,
          time: activity.time || '',
          dayIndex: activity.dayIndex,
          location,
          dateTime: activityDate,
          timeRemaining,
          category: activity.category,
        }
      })
      // Sort by computed dateTime
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())

    return scheduledActivities
  } catch (error) {
    console.error('Error fetching all scheduled activities:', error)
    return []
  }
}

