import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ORCACLUB Kaiju Hunting',
  description: 'Epic 16-Day Japan Journey • November 4-19, 2024 - Interactive kaiju hunting trip planner',
  keywords: ['Japan', 'travel', 'itinerary', 'ORCACLUB', 'adventure', 'kaiju hunting', 'trip planner'],
  openGraph: {
    title: 'ORCACLUB Kaiju Hunting - Japan Adventure',
    description: 'Epic 16-Day Japan Journey • November 4-19, 2024 - Kaiju Hunting Adventure',
    type: 'website',
  },
}

export default function KaijuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}