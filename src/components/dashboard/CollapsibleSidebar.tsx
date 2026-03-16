'use client'

import { useState, useRef, useCallback } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSidebarProps {
  children: React.ReactNode
}

export function CollapsibleSidebar({ children }: CollapsibleSidebarProps) {
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOpen = pinned || hovered

  const handleMouseEnter = useCallback(() => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setHovered(false), 150)
  }, [])

  return (
    // aside stretches to the flex container's full height (no self-start, no fixed height)
    // border-r extends the full page length for visual continuity
    <aside
      className={cn(
        'hidden lg:block shrink-0 border-r border-[#404040] bg-[#252525] transition-[width] duration-300 ease-in-out',
        isOpen ? 'w-72 xl:w-80' : 'w-12',
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sticky panel — pins to viewport below the header while the aside background spans full page */}
      <div className="sticky top-[49px] h-[calc((100vh-64px)/1.3)] flex flex-col">

        {/* Extended hover zone — invisible 32px strip beyond the right edge */}
        <div
          className="absolute top-0 bottom-0 left-full w-8"
          onMouseEnter={handleMouseEnter}
          aria-hidden="true"
        />

        {/* Overflow clip wrapper — needed to clip wide content when collapsed */}
        <div className="flex flex-col h-full overflow-hidden">

          {/* Pin toggle — click to lock open / unlock */}
          <div className={cn('flex shrink-0 pt-3', isOpen ? 'justify-end pr-3' : 'justify-center')}>
            <button
              onClick={() => setPinned((p) => !p)}
              className="p-1.5 rounded-md text-[#4A4A4A] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-colors"
              aria-label={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
            >
              {pinned ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4" />
              )}
            </button>
          </div>

          {/* Content — fades out when collapsed but stays mounted */}
          <div
            className={cn(
              'flex-1 overflow-y-auto transition-opacity duration-200',
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
          >
            {children}
          </div>

        </div>
      </div>
    </aside>
  )
}
