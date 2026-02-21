'use client'

import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSidebarProps {
  children: React.ReactNode
}

export function CollapsibleSidebar({ children }: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col shrink-0 border-r border-white/[0.08] bg-[#1c1c1c]/40 sticky top-16 self-start h-[calc(100vh-64px)] overflow-hidden transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-12' : 'w-72 xl:w-80',
      )}
    >
      {/* Toggle button */}
      <div className={cn('flex shrink-0 pt-3', collapsed ? 'justify-center' : 'justify-end pr-3')}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {/* Content — fades out when collapsed but stays mounted */}
      <div
        className={cn(
          'flex-1 overflow-y-auto transition-opacity duration-200',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100',
        )}
      >
        {children}
      </div>
    </aside>
  )
}
