import Hero from '@/app/_home/hero'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'orcaclub.pro | redesign your workflow.',
  description: 'Streamline your operations, boost productivity, and drive growth with our comprehensive business management and analysis solution.',
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
    </main>
  )
} 
