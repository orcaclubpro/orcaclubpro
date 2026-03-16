'use client'

import { useState } from 'react'
import { Calendar, CheckCircle, Circle, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils/dateUtils'
import type { Project, Task } from '@/types/payload-types'

interface ProjectTimelineProps {
  project: Project
  tasks: Task[]
}

export function ProjectTimeline({ project, tasks }: ProjectTimelineProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null)

  const milestones = project.milestones || []
  const hasTimeline = !!project.startDate && !!project.projectedEndDate

  // Calculate progress
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const totalTasks = tasks.length
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Calculate time progress
  const calculateTimeProgress = () => {
    if (!project.startDate || !project.projectedEndDate) return 0
    const start = new Date(project.startDate).getTime()
    const end = new Date(project.projectedEndDate).getTime()
    const now = Date.now()

    if (now >= end) return 100
    if (now <= start) return 0

    return Math.min(100, ((now - start) / (end - start)) * 100)
  }

  const timeProgress = calculateTimeProgress()

  // Sort milestones by date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate milestone position on timeline
  const calculatePosition = (milestoneDate: string) => {
    if (!project.startDate || !project.projectedEndDate) return 50

    const start = new Date(project.startDate).getTime()
    const end = new Date(project.projectedEndDate).getTime()
    const milestone = new Date(milestoneDate).getTime()

    const position = ((milestone - start) / (end - start)) * 100
    return Math.max(0, Math.min(100, position))
  }

  if (!hasTimeline) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#404040] bg-[#252525] p-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,255,255,0.01)] to-transparent" />
        <div className="relative z-10">
          <Calendar className="size-12 text-[#6B6B6B] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#F0F0F0] mb-2">No Timeline Set</h3>
          <p className="text-[#A0A0A0] text-sm max-w-md mx-auto">
            Set a start and end date to visualize the project timeline.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Main Timeline */}
      <div className="relative overflow-hidden rounded-2xl border border-[#404040] bg-[#252525] p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,255,255,0.02)] via-transparent to-blue-500/[0.02]" />

        <div className="relative z-10 space-y-8">
          {/* Date Labels */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#A0A0A0]">
              <Calendar className="size-4" />
              <span className="font-medium">{formatDate(project.startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-[#A0A0A0]">
              <Calendar className="size-4" />
              <span className="font-medium">{formatDate(project.projectedEndDate)}</span>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="relative">
            {/* Base line */}
            <div className="relative h-3 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
              {/* Progress fill */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1E3A6E] via-[rgba(139,156,182,0.70)] to-[#2B4A8A] rounded-full transition-all duration-1000 ease-out timeline-progress"
                style={{ width: `${timeProgress}%` }}
              />

              {/* Shimmer effect */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full timeline-shimmer"
                style={{ width: '50%' }}
              />
            </div>

            {/* Milestone markers */}
            {sortedMilestones.map((milestone, index) => {
              const position = calculatePosition(milestone.date)
              const isHovered = hoveredMilestone === index

              return (
                <div
                  key={milestone.id || index}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${position}%` }}
                  onMouseEnter={() => setHoveredMilestone(index)}
                  onMouseLeave={() => setHoveredMilestone(null)}
                >
                  {/* Milestone point */}
                  <div className="relative group cursor-pointer">
                    {/* Outer glow ring */}
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-300 ${
                        milestone.completed
                          ? 'bg-green-400/20 scale-150 animate-pulse-slow'
                          : 'bg-[rgba(139,156,182,0.15)] scale-125'
                      } ${isHovered ? 'scale-200' : ''}`}
                    />

                    {/* Inner point */}
                    <div
                      className={`relative size-8 rounded-full border-2 transition-all duration-300 ${
                        milestone.completed
                          ? 'bg-green-400 border-green-300 shadow-lg shadow-green-400/50'
                          : 'bg-[rgba(255,255,255,0.06)] border-[var(--space-accent)] shadow-lg shadow-[rgba(139,156,182,0.20)]'
                      } ${isHovered ? 'scale-125' : ''}`}
                    >
                      {milestone.completed ? (
                        <CheckCircle className="size-full p-1.5 text-white" />
                      ) : (
                        <Circle className="size-full p-2 text-[var(--space-accent)]" />
                      )}
                    </div>

                    {/* Hover tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="relative overflow-hidden rounded-xl border border-[#404040] bg-[#252525] p-4 shadow-2xl">
                          {/* Glow effect */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--space-accent)] to-transparent" />

                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-sm font-semibold text-[#F0F0F0] leading-tight">
                                {milestone.title}
                              </h4>
                              {milestone.completed && (
                                <CheckCircle className="size-4 text-green-400 shrink-0" />
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                              <Calendar className="size-3" />
                              {formatDate(milestone.date)}
                            </div>

                            {milestone.description && (
                              <p className="text-xs text-[#A0A0A0] leading-relaxed pt-2 border-t border-[#404040]">
                                {milestone.description}
                              </p>
                            )}
                          </div>

                          {/* Arrow */}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#252525] border-r border-b border-[#404040]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Current position indicator (if in progress) */}
            {timeProgress > 0 && timeProgress < 100 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                style={{ left: `${timeProgress}%` }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-[rgba(139,156,182,0.20)] rounded-full blur-md scale-150 animate-pulse" />
                  <div className="relative size-4 rounded-full bg-[var(--space-accent)] shadow-lg shadow-[rgba(139,156,182,0.30)] ring-2 ring-[rgba(255,255,255,0.06)]">
                    <TrendingUp className="size-full p-0.5 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 text-xs text-[#6B6B6B]">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[var(--space-accent)]" />
              <span>Current Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-400" />
              <span>Completed Milestone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[rgba(255,255,255,0.06)] border border-[var(--space-accent)]" />
              <span>Pending Milestone</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .timeline-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        .timeline-progress {
          animation: timeline-draw 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes timeline-draw {
          from {
            width: 0%;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
