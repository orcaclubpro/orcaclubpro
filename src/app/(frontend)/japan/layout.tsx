import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ORCACLUB Kaiji Hunting - Japan Adventure',
  description: 'Epic 14-Day Japan Journey • November 4-17, 2024 - Interactive trip planner and itinerary manager',
  keywords: ['Japan', 'travel', 'itinerary', 'ORCACLUB', 'adventure', 'trip planner'],
  openGraph: {
    title: 'ORCACLUB Kaiji Hunting - Japan Adventure',
    description: 'Epic 14-Day Japan Journey • November 4-17, 2024',
    type: 'website',
  },
}

export default function JapanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}