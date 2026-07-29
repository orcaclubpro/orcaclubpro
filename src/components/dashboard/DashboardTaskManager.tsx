'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PackageBuilderModal } from '@/components/dashboard/PackageBuilderModal'

interface DashboardTaskManagerProps {
  username: string
  userRole?: string | null
}

/**
 * Global floating "new package" action. Opens the two-pane PackageBuilderModal
 * in create mode (the client is chosen inside the modal). Admin/user only.
 */
export function DashboardTaskManager({ username, userRole }: DashboardTaskManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [initialTab, setInitialTab] = useState<'builder' | 'retainer'>('builder')

  const isStaff = Boolean(userRole) && userRole !== 'client'

  const openTool = (tab: 'builder' | 'retainer') => {
    setInitialTab(tab)
    setOpen(true)
  }

  // Global "k" shortcut — brings up the package builder (mirrors the "l"
  // search-palette shortcut in GlobalSearchPalette). Opens only; the modal
  // holds in-progress work, so we never toggle it closed from a keystroke.
  useEffect(() => {
    if (!isStaff) return
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        openTool('builder')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isStaff])

  // Launch hand-off from the search palette's mode strip — opens the modal on
  // the requested tab ('builder' | 'retainer').
  useEffect(() => {
    if (!isStaff) return
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail?.tab === 'retainer' ? 'retainer' : 'builder'
      openTool(tab)
    }
    document.addEventListener('orcaclub:open-builder', handler)
    return () => document.removeEventListener('orcaclub:open-builder', handler)
  }, [isStaff])

  // Access gate — clients never see the builder FAB
  if (!isStaff) return null

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => openTool('builder')}
        aria-label="New package"
        className={cn(
          'print:hidden fixed bottom-28 right-4 md:bottom-8 md:right-8 z-[53] size-14 md:size-16 rounded-full bg-[var(--space-accent)] text-black shadow-2xl shadow-[#000000]/[0.40]',
          'hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group',
        )}
      >
        <Package className="size-7 group-hover:scale-110 transition-transform" />
      </button>

      {open && (
        <PackageBuilderModal
          mode="create"
          username={username}
          initialTab={initialTab}
          onClose={(createdId) => {
            setOpen(false)
            // Pull fresh server data so the new proposal appears without a hard reload
            if (createdId) router.refresh()
          }}
        />
      )}
    </>
  )
}
