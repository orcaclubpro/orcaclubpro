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
        className="p-1.5 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-colors shrink-0"
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
