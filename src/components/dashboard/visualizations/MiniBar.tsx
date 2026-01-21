'use client'

interface Segment {
  value: number
  color: string
  label: string
}

interface MiniBarProps {
  segments: Segment[]
  height?: number
  showLabels?: boolean
}

export function MiniBar({ segments, height = 6, showLabels = false }: MiniBarProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0)

  if (total === 0) return null

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div
        className="w-full bg-white/[0.05] rounded-full overflow-hidden flex border border-white/[0.06]"
        style={{ height }}
      >
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100
          if (percentage === 0) return null

          return (
            <div
              key={index}
              className="transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: segment.color,
                opacity: 0.8,
              }}
            />
          )
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex items-center gap-4 text-xs">
          {segments.map((segment, index) => {
            const percentage = Math.round((segment.value / total) * 100)
            if (percentage === 0) return null

            return (
              <div key={index} className="flex items-center gap-1.5">
                <div
                  className="size-2 rounded-full"
                  style={{ backgroundColor: segment.color, opacity: 0.8 }}
                />
                <span className="text-gray-400 font-medium">
                  {segment.label}: {percentage}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
