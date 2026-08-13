import type { ReactNode } from 'react'
import AnimatedBackground from '@/components/layout/animated-background'

/**
 * Standard marketing-page wrapper: black canvas, fixed AnimatedBackground,
 * content lifted above it. Extracted from the wrapper every service Content
 * file repeats (`min-h-screen bg-black relative overflow-hidden` + background
 * + per-section `relative z-10`) — sections rendered inside PageShell no
 * longer need their own z-index.
 */
export function PageShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`min-h-screen bg-black relative overflow-hidden ${className}`}>
      <AnimatedBackground />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
