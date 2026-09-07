'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import dynamic from 'next/dynamic'
const ProjectSettingsModal = dynamic(
  () => import('./ProjectSettingsModal').then(m => ({ default: m.ProjectSettingsModal })),
  { ssr: false }
)
import type { Project } from '@/types/payload-types'

interface ProjectRowActionsProps {
  project: Project
  username: string
}

export function ProjectRowActions({ project, username }: ProjectRowActionsProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        className="shrink-0 rounded-md p-1.5 text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]"
        title="Project settings"
      >
        <Settings className="size-3.5" />
      </button>

      <ProjectSettingsModal
        project={project}
        tasks={[]}
        open={open}
        onOpenChange={setOpen}
        username={username}
      />
    </>
  )
}
