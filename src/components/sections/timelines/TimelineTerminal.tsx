'use client'
import type { Timeline } from '@/types/payload-types'
export default function TimelineTerminal({ timeline }: { timeline: Timeline }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <p style={{ color: '#00ff41', fontSize: 14 }}>Terminal style — {timeline.title} (building…)</p>
    </div>
  )
}
