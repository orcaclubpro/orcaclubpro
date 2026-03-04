'use client'

import type { Timeline } from '@/types/payload-types'
import TimelineCinematic from './timelines/TimelineCinematic'
import TimelineVertical from './timelines/TimelineVertical'
import TimelineBlueprint from './timelines/TimelineBlueprint'
import TimelineEditorial from './timelines/TimelineEditorial'
import TimelineTerminal from './timelines/TimelineTerminal'

export default function TimelineRenderer({ timeline }: { timeline: Timeline }) {
  const style = timeline.style ?? 'cinematic'

  switch (style) {
    case 'vertical-clean': return <TimelineVertical  timeline={timeline} />
    case 'blueprint':      return <TimelineBlueprint timeline={timeline} />
    case 'editorial':      return <TimelineEditorial timeline={timeline} />
    case 'terminal':       return <TimelineTerminal  timeline={timeline} />
    default:               return <TimelineCinematic timeline={timeline} />
  }
}
