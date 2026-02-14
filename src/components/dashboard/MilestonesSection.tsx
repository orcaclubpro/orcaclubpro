'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Plus, Calendar, CheckCircle, Circle, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateMilestoneSheet } from './CreateMilestoneSheet'
import { toggleMilestoneCompletion } from '@/actions/projects'
import { formatDate } from '@/lib/utils/dateUtils'
import type { Project } from '@/types/payload-types'

interface MilestonesSectionProps {
  project: Project
}

export function MilestonesSection({ project }: MilestonesSectionProps) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [updatingIndex, setUpdatingIndex] = useState<number | null>(null)

  const milestones = project.milestones || []
  const hasTimeline = !!project.startDate
  const completedCount = milestones.filter((m) => m.completed).length

  const handleToggleMilestone = async (index: number) => {
    setUpdatingIndex(index)

    const result = await toggleMilestoneCompletion({
      projectId: project.id,
      milestoneIndex: index,
    })

    setUpdatingIndex(null)

    if (result.success) {
      router.refresh()
    }
  }

  // Calculate milestone positions on timeline
  const calculatePosition = (milestoneDate: string) => {
    if (!project.startDate || !project.projectedEndDate) return 50

    const start = new Date(project.startDate).getTime()
    const end = new Date(project.projectedEndDate).getTime()
    const milestone = new Date(milestoneDate).getTime()

    const totalDuration = end - start
    const elapsed = milestone - start

    const position = (elapsed / totalDuration) * 100
    return Math.max(0, Math.min(100, position))
  }

  // Sort milestones by date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <Flag className="size-5 text-intelligence-cyan" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Timeline & Milestones</h2>
            <p className="text-sm text-gray-400">
              {milestones.length > 0
                ? `${completedCount} of ${milestones.length} completed`
                : 'Track project milestones and deliverables'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/10 hover:shadow-intelligence-cyan/20 transition-all duration-300"
        >
          <Plus className="size-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Timeline Visualization (Desktop) */}
      {hasTimeline && milestones.length > 0 && (
        <div className="hidden md:block relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-8">
          <div className="absolute top-0 right-0 w-48 h-48 bg-intelligence-cyan/[0.04] rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="size-4" />
                <span>{formatDate(project.startDate)}</span>
              </div>
              {project.projectedEndDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  <span>{formatDate(project.projectedEndDate)}</span>
                </div>
              )}
            </div>

            {/* Timeline Bar */}
            <div className="relative h-2 bg-white/[0.05] rounded-full">
              {/* Progress based on completed milestones */}
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-intelligence-cyan to-blue-500 rounded-full transition-all duration-500"
                style={{
                  width: `${milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0}%`,
                }}
              />

              {/* Milestone markers */}
              {sortedMilestones.map((milestone, index) => {
                const position = calculatePosition(milestone.date)
                return (
                  <button
                    key={milestone.id || index}
                    onClick={() => handleToggleMilestone(index)}
                    disabled={updatingIndex === index}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-pointer"
                    style={{ left: `${position}%` }}
                  >
                    <div className="relative">
                      {milestone.completed ? (
                        <CheckCircle className="size-6 text-green-400 group-hover:scale-110 transition-transform" />
                      ) : (
                        <Circle className="size-6 text-gray-500 group-hover:text-intelligence-cyan group-hover:scale-110 transition-all" />
                      )}
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/90 border border-white/[0.08] rounded-lg p-2 text-center">
                          <p className="text-xs font-medium text-white">
                            {milestone.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(milestone.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-gray-500 text-center">
              Click milestones to toggle completion
            </p>
          </div>
        </div>
      )}

      {/* Milestone List (Mobile and fallback) */}
      {milestones.length > 0 ? (
        <div className="space-y-3">
          {sortedMilestones.map((milestone, index) => (
            <div
              key={milestone.id || index}
              className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-5 hover:border-white/[0.12] transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-intelligence-cyan/[0.03] rounded-full blur-3xl" />

              <div className="relative z-10 flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleMilestone(index)}
                  disabled={updatingIndex === index}
                  className="mt-1 shrink-0 hover:scale-110 transition-transform disabled:opacity-50"
                >
                  {milestone.completed ? (
                    <CheckCircle className="size-6 text-green-400" />
                  ) : (
                    <Circle className="size-6 text-gray-500 hover:text-intelligence-cyan transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3
                        className={`text-lg font-semibold ${
                          milestone.completed ? 'text-gray-500 line-through' : 'text-white'
                        }`}
                      >
                        {milestone.title}
                      </h3>
                      {milestone.description && (
                        <p className="text-sm text-gray-400 mt-1">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="size-4" />
                      {formatDate(milestone.date)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-12 text-center">
          <div className="relative z-10">
            <div className="inline-flex p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
              <Award className="size-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Milestones Yet
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Add milestones to track important deliverables and project progress.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              variant="outline"
              className="bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
            >
              <Plus className="size-4 mr-2" />
              Add First Milestone
            </Button>
          </div>
        </div>
      )}

      {/* Progress Summary */}
      {milestones.length > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-intelligence-cyan/10 border border-intelligence-cyan/20">
              <Award className="size-6 text-intelligence-cyan" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                Milestone Progress
              </h3>
              <p className="text-sm text-gray-400">
                {completedCount} of {milestones.length} milestones completed (
                {Math.round((completedCount / milestones.length) * 100)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Milestone Sheet */}
      <CreateMilestoneSheet
        projectId={project.id}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  )
}
