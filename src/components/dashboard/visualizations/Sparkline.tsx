'use client'

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
  showDot?: boolean
}

export function Sparkline({
  data,
  color = 'rgb(103, 232, 249)', // intelligence-cyan
  height = 24,
  width = 100,
  showDot = true,
}: SparklineProps) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  // Create SVG path points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  })

  const pathData = `M ${points.join(' L ')}`
  const lastPoint = points[points.length - 1].split(',')

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      style={{ minWidth: width, minHeight: height }}
    >
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />

      {/* Dot at end */}
      {showDot && (
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="2.5"
          fill={color}
          opacity="0.9"
        />
      )}
    </svg>
  )
}
