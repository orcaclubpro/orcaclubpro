import Hero from '@/app/_home/hero'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Oracle Club Pro - Transform Your Business',
  description: 'Streamline your operations, boost productivity, and drive growth with our comprehensive business management solution.',
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
    </main>
  )
} 