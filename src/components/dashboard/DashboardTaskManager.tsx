'use client'

import { useState } from 'react'
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

  // Access gate — clients never see the builder FAB
  if (!userRole || userRole === 'client') return null

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
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
