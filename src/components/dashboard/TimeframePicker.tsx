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
    <div className="flex items-center gap-0.5 bg-black/30 border border-white/[0.1] rounded-lg p-0.5 shrink-0">
      {TIMEFRAMES.map(tf => (
        <Link
          key={tf.value}
          href={`${basePath}?timeframe=${tf.value}`}
          scroll={false}
          prefetch={false}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
            active === tf.value
              ? 'bg-intelligence-cyan text-black shadow-sm'
              : 'text-gray-500 hover:text-gray-200'
          }`}
        >
          {tf.label}
        </Link>
      ))}
    </div>
  )
}
