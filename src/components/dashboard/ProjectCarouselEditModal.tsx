'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { ProjectSettingsModal } from './ProjectSettingsModal'
import type { SerializedProject } from './ProjectsCarousel'

export function ProjectCarouselEditModal({ project, large }: { project: SerializedProject; large?: boolean }) {
  const [open, setOpen] = useState(false)

  // Adapt SerializedProject field names to the shape ProjectSettingsModal expects
  const adapted = {
    ...project,
    projectedEndDate: project.endDate,
    actualEndDate: null,
    budgetAmount: project.budget,
  } as any

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={large
          ? "flex items-center gap-3 bg-[#1c1c1c] hover:bg-[#242424] border border-white/[0.14] hover:border-white/[0.24] text-white/75 hover:text-white font-semibold rounded-full px-8 py-4 text-base transition-all duration-200 shadow-xl"
          : "flex items-center gap-1.5 text-xs text-white/45 hover:text-white/75 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.18] rounded-lg px-3.5 py-2.5 transition-all duration-150"
        }
      >
        <Settings className={large ? "size-5" : "size-3.5"} />
        Edit
      </button>
      <ProjectSettingsModal
        project={adapted}
        tasks={[]}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
