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
          ? "flex items-center gap-2.5 bg-[var(--space-bg-card)] hover:bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] hover:border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] font-bold rounded-full px-5 py-2 text-sm transition-all duration-200"
          : "flex items-center gap-1.5 text-xs text-[var(--space-text-secondary)] hover:text-[var(--space-text-tertiary)] bg-[var(--space-bg-card)] hover:bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] hover:border-[var(--space-border-hard)] rounded-lg px-3.5 py-2.5 transition-all duration-150"
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
