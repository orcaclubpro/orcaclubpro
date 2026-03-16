'use client'

import Link from 'next/link'

const TIMEFRAMES = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
] as const

interface TimeframePickerProps {
  active: string
  basePath: string
}

export function TimeframePicker({ active, basePath }: TimeframePickerProps) {
  return (
    <div className="flex items-center gap-0.5 bg-[rgba(255,255,255,0.06)] border border-[#404040] rounded-lg p-0.5 shrink-0">
      {TIMEFRAMES.map(tf => (
        <Link
          key={tf.value}
          href={`${basePath}?timeframe=${tf.value}`}
          scroll={false}
          prefetch={false}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
            active === tf.value
              ? 'bg-[var(--space-accent)] text-white shadow-sm'
              : 'text-[#6B6B6B] hover:text-[#A0A0A0]'
          }`}
        >
          {tf.label}
        </Link>
      ))}
    </div>
  )
}
