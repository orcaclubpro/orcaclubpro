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
    <aside
      className={cn(
        'relative hidden lg:flex flex-col shrink-0 border-r border-white/[0.08] bg-[#1c1c1c]/40 sticky top-16 self-start h-[calc(100vh-64px)] transition-[width] duration-300 ease-in-out',
        isOpen ? 'w-72 xl:w-80' : 'w-12',
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
            className="p-1.5 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-colors"
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
    </aside>
  )
}
