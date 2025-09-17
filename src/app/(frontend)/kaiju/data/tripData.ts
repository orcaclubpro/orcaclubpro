export interface Activity {
  id: string
  title: string
  description?: string
  time?: string
  hasTime: boolean
  category?: 'cultural' | 'food' | 'nature' | 'shopping' | 'entertainment' | 'transport'
}

export interface TripDay {
  location: string
  city: 'tokyo' | 'kyoto' | 'osaka' | 'fuji'
  phase: string
  activities: Activity[]
}

export interface TripData {
  startDate: string
  days: TripDay[]
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const tripData: TripData = {
  startDate: '2024-11-04',
  days: [
    {
      location: 'Tokyo',
      city: 'tokyo',
      phase: 'Arrival & First Exploration',
      activities: [
        {
          id: generateId(),
          title: 'Arrive at Haneda Airport',
          description: 'Land and get through customs. Take the monorail to central Tokyo.',
          time: '09:00',
          hasTime: true,
          category: 'transport'
        },
        {
          id: generateId(),
          title: 'Check into Hotel',
          description: 'Drop off luggage and freshen up in Shibuya area',
          time: '12:00',
          hasTime: true,
          category: 'transport'
        },
        {
          id: generateId(),
          title: 'Explore Shibuya Crossing',
          description: 'Experience the world\'s busiest pedestrian crossing',
          hasTime: false,
          category: 'cultural'
        },
        {
          id: generateId(),
          title: 'Dinner in Harajuku',
          description: 'Try some street food and quirky restaurants',
          time: '18:00',
          hasTime: true,
          category: 'food'
        }
      ]
    },
    {
      location: 'Tokyo',
      city: 'tokyo',
      phase: 'Urban Adventure',
      activities: []
    },
    {
      location: 'Tokyo',
      city: 'tokyo',
      phase: 'Cultural Immersion',
      activities: []
    },
    {
      location: 'Kyoto',
      city: 'kyoto',
      phase: 'Traditional Japan',
      activities: []
    },
    {
      location: 'Kyoto',
      city: 'kyoto',
      phase: 'Temple Hopping',
      activities: []
    },
    {
      location: 'Kyoto',
      city: 'kyoto',
      phase: 'Hidden Gems',
      activities: []
    },
    {
      location: 'Osaka',
      city: 'osaka',
      phase: 'Food Capital',
      activities: [
        {
          id: generateId(),
          title: 'Dotonbori Food Crawl',
          description: 'Sample takoyaki, okonomiyaki, and other Osaka specialties',
          hasTime: false,
          category: 'food'
        },
        {
          id: generateId(),
          title: 'Osaka Castle',
          description: 'Historic castle with great city views',
          time: '14:00',
          hasTime: true,
          category: 'cultural'
        },
        {
          id: generateId(),
          title: 'Kuromon Ichiba Market',
          description: 'Fresh seafood and local delicacies',
          hasTime: false,
          category: 'food'
        }
      ]
    },
    {
      location: 'Osaka',
      city: 'osaka',
      phase: 'Urban Culture',
      activities: []
    },
    {
      location: 'Osaka',
      city: 'osaka',
      phase: 'Nightlife & Entertainment',
      activities: []
    },
    {
      location: 'Mt. Fuji',
      city: 'fuji',
      phase: 'Natural Wonder',
      activities: [
        {
          id: generateId(),
          title: 'Travel to Mt. Fuji Area',
          description: 'Take JR to Kawaguchiko Station',
          time: '08:00',
          hasTime: true,
          category: 'transport'
        },
        {
          id: generateId(),
          title: 'Lake Kawaguchi Scenic Walk',
          description: 'Beautiful lake views with Mt. Fuji backdrop',
          hasTime: false,
          category: 'nature'
        },
        {
          id: generateId(),
          title: 'Chureito Pagoda',
          description: 'Iconic Mt. Fuji viewpoint and photo spot',
          time: '15:00',
          hasTime: true,
          category: 'cultural'
        }
      ]
    },
    {
      location: 'Mt. Fuji',
      city: 'fuji',
      phase: 'Mountain Adventure',
      activities: []
    },
    {
      location: 'Tokyo',
      city: 'tokyo',
      phase: 'Final Adventures',
      activities: []
    },
    {
      location: 'Tokyo',
      city: 'tokyo',
      phase: 'Last Discoveries',
      activities: []
    },
    {
      location: 'Tokyo',
      city: 'tokyo',
      phase: 'Farewell Tokyo',
      activities: []
    },
    {
      location: 'Tokyo',
      city: 'tokyo',
      phase: 'Departure Day',
      activities: []
    }
  ]
}

export const getCityBadgeColor = (city: string) => {
  const colors = {
    tokyo: 'bg-gradient-to-r from-pink-500 to-rose-500',
    kyoto: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    osaka: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    fuji: 'bg-gradient-to-r from-green-500 to-emerald-500'
  }
  return colors[city as keyof typeof colors] || 'bg-gradient-to-r from-gray-500 to-slate-500'
}

export const getCategoryIcon = (category: Activity['category']) => {
  const icons = {
    cultural: '🏛️',
    food: '🍜',
    nature: '🌸',
    shopping: '🛍️',
    entertainment: '🎮',
    transport: '🚄'
  }
  return icons[category || 'cultural']
}

export const getCategoryColor = (category: Activity['category']) => {
  const colors = {
    cultural: 'bg-purple-100 text-purple-800 border-purple-200',
    food: 'bg-orange-100 text-orange-800 border-orange-200',
    nature: 'bg-green-100 text-green-800 border-green-200',
    shopping: 'bg-pink-100 text-pink-800 border-pink-200',
    entertainment: 'bg-blue-100 text-blue-800 border-blue-200',
    transport: 'bg-gray-100 text-gray-800 border-gray-200'
  }
  return colors[category || 'cultural']
}