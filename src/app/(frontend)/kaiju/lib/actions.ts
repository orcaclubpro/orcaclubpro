/**
 * Simplified server actions for managing KaijuActivities via Payload CMS
 *
 * These functions use Payload's Local API to create, read, update, and delete
 * kaiju activities (trip activities) with direct 1:1 mapping to Activity interface.
 */

'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Activity, TripDay, TripData } from '../data/tripData'

// Define the simplified KaijuActivity type that matches our collection
export interface KaijuActivity {
  id: string
  title: string
  description?: string
  time?: string
  hasTime: boolean
  category?: 'cultural' | 'food' | 'nature' | 'shopping' | 'entertainment' | 'transport'
  location: string
  city: 'tokyo' | 'kyoto' | 'osaka' | 'fuji'
  phase: string
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
 * Convert Activity to KaijuActivity data for creation/update
 */
function activityToKaijuActivityData(
  activity: Activity,
  location: string,
  city: 'tokyo' | 'kyoto' | 'osaka' | 'fuji',
  phase: string
): Partial<KaijuActivity> {
  return {
    title: activity.title,
    description: activity.description,
    time: activity.time,
    hasTime: activity.hasTime,
    category: activity.category,
    location,
    city,
    phase,
  }
}

/**
 * Fetch all kaiju activities and organize them into TripData structure
 */
export async function fetchKaijuActivities(): Promise<TripData | null> {
  try {
    const payload = await getPayload({ config })

    // Fetch all kaiju activities
    const result = await payload.find({
      collection: 'kaiju-activities',
      limit: 1000, // Large limit to get all activities
      sort: 'createdAt', // Sort by creation order
    })

    if (!result.docs.length) {
      return null
    }

    const kaijuActivities = result.docs as KaijuActivity[]

    // Group activities by location and phase to recreate trip structure
    const groupedActivities = groupActivitiesByLocationAndPhase(kaijuActivities)

    // Convert to TripData structure
    const days: TripDay[] = Object.entries(groupedActivities).map(([key, group]) => ({
      location: group.location,
      city: group.city,
      phase: group.phase,
      activities: group.activities.map(kaijuActivityToActivity),
    }))

    return {
      startDate: '2024-11-04', // Default start date
      days,
    }
  } catch (error) {
    console.error('Error fetching kaiju activities:', error)
    return null
  }
}

/**
 * Create a new kaiju activity
 */
export async function createKaijuActivity(
  activity: Activity,
  location: string,
  city: 'tokyo' | 'kyoto' | 'osaka' | 'fuji',
  phase: string
): Promise<KaijuActivity | null> {
  try {
    const payload = await getPayload({ config })

    const activityData = activityToKaijuActivityData(activity, location, city, phase)

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
 * Update an existing kaiju activity
 */
export async function updateKaijuActivity(
  activityId: string,
  activity: Activity,
  location: string,
  city: 'tokyo' | 'kyoto' | 'osaka' | 'fuji',
  phase: string
): Promise<KaijuActivity | null> {
  try {
    const payload = await getPayload({ config })

    const activityData = activityToKaijuActivityData(activity, location, city, phase)

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
 * Get activities for a specific location
 */
export async function getActivitiesByLocation(location: string): Promise<KaijuActivity[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'kaiju-activities',
      where: {
        location: {
          equals: location,
        },
      },
      sort: 'createdAt',
      limit: 1000,
    })

    return result.docs as KaijuActivity[]
  } catch (error) {
    console.error('Error fetching activities by location:', error)
    return []
  }
}

/**
 * Get activities for a specific city
 */
export async function getActivitiesByCity(city: 'tokyo' | 'kyoto' | 'osaka' | 'fuji'): Promise<KaijuActivity[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'kaiju-activities',
      where: {
        city: {
          equals: city,
        },
      },
      sort: 'createdAt',
      limit: 1000,
    })

    return result.docs as KaijuActivity[]
  } catch (error) {
    console.error('Error fetching activities by city:', error)
    return []
  }
}

/**
 * Seed initial kaiju activities from static trip data
 */
export async function seedKaijuActivitiesFromTripData(tripData: TripData): Promise<boolean> {
  try {
    const payload = await getPayload({ config })

    for (const day of tripData.days) {
      for (const activity of day.activities) {
        const activityData = activityToKaijuActivityData(
          activity,
          day.location,
          day.city,
          day.phase
        )

        await payload.create({
          collection: 'kaiju-activities',
          data: activityData as any,
        })
      }
    }

    return true
  } catch (error) {
    console.error('Error seeding kaiju activities:', error)
    throw new Error(`Failed to seed kaiju activities: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Clear all kaiju activities (for reset/cleanup)
 */
export async function clearAllKaijuActivities(): Promise<boolean> {
  try {
    const payload = await getPayload({ config })

    // First, fetch all activities to get their IDs
    const result = await payload.find({
      collection: 'kaiju-activities',
      limit: 1000,
    })

    // Delete each activity individually
    for (const activity of result.docs) {
      await payload.delete({
        collection: 'kaiju-activities',
        id: activity.id,
      })
    }

    return true
  } catch (error) {
    console.error('Error clearing kaiju activities:', error)
    throw new Error(`Failed to clear kaiju activities: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Helper function to group activities by location and phase
 */
function groupActivitiesByLocationAndPhase(activities: KaijuActivity[]): Record<string, {
  location: string
  city: 'tokyo' | 'kyoto' | 'osaka' | 'fuji'
  phase: string
  activities: KaijuActivity[]
}> {
  const grouped: Record<string, {
    location: string
    city: 'tokyo' | 'kyoto' | 'osaka' | 'fuji'
    phase: string
    activities: KaijuActivity[]
  }> = {}

  for (const activity of activities) {
    const key = `${activity.location}-${activity.phase}`

    if (!grouped[key]) {
      grouped[key] = {
        location: activity.location,
        city: activity.city,
        phase: activity.phase,
        activities: []
      }
    }

    grouped[key].activities.push(activity)
  }

  return grouped
}

/**
 * Search activities by title or description
 */
export async function searchKaijuActivities(query: string): Promise<KaijuActivity[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'kaiju-activities',
      where: {
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
      },
      sort: 'createdAt',
      limit: 100,
    })

    return result.docs as KaijuActivity[]
  } catch (error) {
    console.error('Error searching kaiju activities:', error)
    return []
  }
}