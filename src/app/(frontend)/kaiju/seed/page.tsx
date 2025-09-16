/**
 * Kaiju Hunting Tasks Seeding Page
 *
 * This page provides utilities to seed the database with initial kaiju hunting tasks
 * from the static trip data. It's useful for testing and initial setup.
 */

import { SeedingInterface } from './components/SeedingInterface'

export default function SeedPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-cyan-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-mono mb-4">
            🦈 KAIJU HUNTING DATABASE SEEDER
          </h1>
          <p className="text-lg text-slate-300">
            Deploy initial kaiju hunting missions to the database
          </p>
          <div className="mt-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
            <p className="text-amber-200 font-mono text-sm">
              ⚠️ WARNING: This is a development tool. Use with caution in production.
            </p>
          </div>
        </div>

        <SeedingInterface />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Kaiju Hunter Database Seeder - Development Tool',
  description: 'Development utility for seeding kaiju hunting tasks',
}