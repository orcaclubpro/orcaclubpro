'use client'

interface ProgressRingProps {
  progress: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  showLabel?: boolean
}

export function ProgressRing({
  progress,
  size = 40,
  strokeWidth = 3,
  color = 'rgb(103, 232, 249)', // intelligence-cyan
  showLabel = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          opacity="0.8"
          className="transition-all duration-500"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-semibold text-white">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  )
}
