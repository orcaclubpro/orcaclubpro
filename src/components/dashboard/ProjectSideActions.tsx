'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Flag, Zap } from 'lucide-react'
import type { Project, Task } from '@/types/payload-types'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
const ProjectSettingsModal = dynamic(
  () => import('./ProjectSettingsModal').then(m => ({ default: m.ProjectSettingsModal })),
  { ssr: false }
)
import { CreateMilestoneModal } from './CreateMilestoneModal'
import { CreateSprintModal } from './CreateSprintModal'

interface ProjectSideActionsProps {
  project: Project
  tasks: Task[]
  username: string
}

const BUTTONS = [
  { key: 'settings', icon: Settings, label: 'Settings', color: 'text-gray-400' },
  { key: 'milestone', icon: Flag,     label: 'Milestone', color: 'text-green-400' },
  { key: 'sprint',   icon: Zap,       label: 'Sprint',    color: 'text-[var(--space-accent)]' },
] as const

export function ProjectSideActions({ project, tasks, username }: ProjectSideActionsProps) {
  const router = useRouter()
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const [milestoneOpen, setMilestoneOpen] = useState(false)
  const [sprintOpen, setSprintOpen]       = useState(false)

  const handlers: Record<string, () => void> = {
    settings: () => setSettingsOpen(true),
    milestone: () => setMilestoneOpen(true),
    sprint:    () => setSprintOpen(true),
  }

  const buttonClass = (i: number, mobile: boolean) => cn(
    'flex flex-col items-center gap-2 transition-all duration-300 group',
    mobile
      ? 'pl-2.5 pr-2 py-3 bg-[#1C1C1C] border border-r-0 border-[#404040] hover:border-[rgba(139,156,182,0.20)] hover:bg-[#2D2D2D] active:scale-95'
      : 'pl-3 pr-2.5 py-5 bg-[#252525] border border-r-0 border-[#404040] hover:border-[rgba(139,156,182,0.20)] hover:bg-[#2D2D2D]',
    i === 0 ? 'rounded-tl-xl' : 'border-t-0',
    i === BUTTONS.length - 1 ? 'rounded-bl-xl' : '',
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col">
        {BUTTONS.map(({ key, icon: Icon, label, color }, i) => (
          <button key={key} onClick={handlers[key]} className={buttonClass(i, false)} aria-label={label}>
            <Icon className={cn('size-3.5', color)} />
            <span className="text-[9px] font-semibold text-[#6B6B6B] uppercase tracking-[0.18em] group-hover:text-[#A0A0A0] transition-colors [writing-mode:vertical-rl] rotate-180">
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col">
        {BUTTONS.map(({ key, icon: Icon, label, color }, i) => (
          <button key={key} onClick={handlers[key]} className={buttonClass(i, true)} aria-label={label}>
            <Icon className={cn('size-3', color)} />
            <span className="text-[8px] font-semibold text-[#6B6B6B] uppercase tracking-[0.15em] [writing-mode:vertical-rl] rotate-180">
              {label}
            </span>
          </button>
        ))}
      </div>

      <ProjectSettingsModal
        project={project}
        tasks={tasks}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        username={username}
      />
      <CreateMilestoneModal
        projectId={project.id}
        open={milestoneOpen}
        onOpenChange={setMilestoneOpen}
        onSuccess={() => { setMilestoneOpen(false); router.refresh() }}
      />
      <CreateSprintModal
        projectId={project.id}
        open={sprintOpen}
        onOpenChange={setSprintOpen}
        onSuccess={() => { setSprintOpen(false); router.refresh() }}
      />
    </>
  )
}
