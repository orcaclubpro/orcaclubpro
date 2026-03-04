'use client'
import type { Timeline } from '@/types/payload-types'
export default function TimelineBlueprint({ timeline }: { timeline: Timeline }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <p style={{ color: '#7eb8d4', fontSize: 14 }}>Blueprint style — {timeline.title} (building…)</p>
    </div>
  )
}
