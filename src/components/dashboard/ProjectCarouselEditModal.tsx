'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import dynamic from 'next/dynamic'
const ProjectSettingsModal = dynamic(
  () => import('./ProjectSettingsModal').then(m => ({ default: m.ProjectSettingsModal })),
  { ssr: false }
)
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
          ? "flex items-center gap-2.5 bg-[#252525] hover:bg-[#2D2D2D] border border-[#404040] hover:border-[#404040] text-[#A0A0A0] hover:text-[#F0F0F0] font-bold rounded-full px-5 py-2 text-sm transition-all duration-200"
          : "flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#A0A0A0] bg-[#252525] hover:bg-[#2D2D2D] border border-[#404040] hover:border-[#404040] rounded-lg px-3.5 py-2.5 transition-all duration-150"
        }
      >
        <Settings className={large ? "size-4" : "size-3.5"} />
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
