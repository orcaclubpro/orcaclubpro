import { JapanTripPlanner } from './components/JapanTripPlanner'
import { fetchKaijuActivities } from './lib/actions'

export default async function KaijuPage() {
  // Fetch trip data from simplified KaijuActivities collection
  let tripData = null
  try {
    tripData = await fetchKaijuActivities()
  } catch (error) {
    console.error('Error fetching kaiju activities:', error)
  }
  return (
    <div className="min-h-screen">
      <JapanTripPlanner initialTripData={tripData} />
    </div>
  )
}

export const metadata = {
  title: '怪獣 X HUNTER | ORCACLUB',
  description: 'Plan your ultimate 16-day Japan journey • November 4-19, 2024 • Detailed daily itineraries and activity planning',
}