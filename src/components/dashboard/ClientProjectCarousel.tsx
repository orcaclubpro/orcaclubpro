'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar, DollarSign, ArrowRight } from 'lucide-react'

interface CarouselProject {
  id: string
  name: string
  status: string
  description?: string | null
  startDate?: string | null
  projectedEndDate?: string | null
  budgetAmount?: number | null
  currency?: string | null
}

interface ClientProjectCarouselProps {
  projects: CarouselProject[]
  username: string
}

const statusConfig: Record<string, { dot: string; label: string; color: string; bg: string; border: string }> = {
  pending: {
    dot: 'bg-yellow-400',
    label: 'Pending',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
  'in-progress': {
    dot: 'bg-cyan-400',
    label: 'In Progress',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
  },
  'on-hold': {
    dot: 'bg-orange-400',
    label: 'On Hold',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
  },
  completed: {
    dot: 'bg-green-400',
    label: 'Completed',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
  },
  cancelled: {
    dot: 'bg-red-400',
    label: 'Cancelled',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
  },
}

function fmt(d: string | null | undefined) {
  if (!d) return null
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(d))
}

function fmtCurrency(amount: number | null | undefined, currency = 'USD') {
  if (!amount) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function ProjectCard({ project, username }: { project: CarouselProject; username: string }) {
  const status = statusConfig[project.status] ?? statusConfig.pending
  const startFmt = fmt(project.startDate)
  const endFmt = fmt(project.projectedEndDate)
  const budget = fmtCurrency(project.budgetAmount, project.currency ?? 'USD')

  return (
    <div className="relative flex flex-col shrink-0 w-[calc(100vw-3rem)] sm:w-80 lg:w-72 xl:w-80 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#181818] to-[#111] overflow-hidden group hover:border-white/[0.14] transition-all duration-300">

      {/* Top accent stripe based on status */}
      <div className={`h-0.5 w-full ${status.dot}`} />

      <div className="flex flex-col flex-1 p-5 gap-4">

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${status.color} ${status.bg} ${status.border}`}>
            <span className={`size-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Project name */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white leading-snug group-hover:text-intelligence-cyan transition-colors duration-200">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-200 mt-2 leading-relaxed line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Meta info */}
        <div className="space-y-2 pt-1 border-t border-white/[0.06]">
          {(startFmt || endFmt) && (
            <div className="flex items-center gap-1.5 text-sm text-gray-300">
              <Calendar className="size-3 shrink-0 text-gray-400" />
              <span>
                {startFmt && endFmt
                  ? `${startFmt} → ${endFmt}`
                  : startFmt
                    ? `Started ${startFmt}`
                    : `Due ${endFmt}`}
              </span>
            </div>
          )}
          {budget && (
            <div className="flex items-center gap-1.5 text-sm text-gray-300">
              <DollarSign className="size-3 shrink-0 text-gray-400" />
              <span>{budget}</span>
            </div>
          )}
        </div>

        {/* View link */}
        <Link
          href={`/u/${username}/projects/${project.id}`}
          className="flex items-center justify-between text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 group/link"
        >
          <span>View project</span>
          <ArrowRight className="size-3 group-hover/link:translate-x-0.5 transition-transform duration-150" />
        </Link>
      </div>
    </div>
  )
}

export function ClientProjectCarousel({ projects, username }: ClientProjectCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    const container = scrollRef.current
    if (!container) return
    const card = container.querySelector('[data-card]') as HTMLElement | null
    const cardWidth = (card?.offsetWidth ?? 320) + 16 // card width + gap
    container.scrollBy({ left: dir === 'right' ? cardWidth : -cardWidth, behavior: 'smooth' })
  }

  // Sort: active first (in-progress, pending), then others
  const sorted = [...projects].sort((a, b) => {
    const priority = (s: string) => (s === 'in-progress' ? 0 : s === 'pending' ? 1 : 2)
    return priority(a.status) - priority(b.status)
  })

  if (sorted.length === 0) return null

  return (
    <div className="relative">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        data-h-scroll
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
      >
        {sorted.map((project) => (
          <div key={project.id} data-card style={{ scrollSnapAlign: 'start' }}>
            <ProjectCard project={project} username={username} />
          </div>
        ))}
      </div>

      {/* Arrow navigation — only shown when there are enough cards */}
      {sorted.length > 1 && (
        <div className="hidden sm:flex items-center gap-2 mt-4 justify-end">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="flex items-center justify-center size-7 rounded-full border border-white/[0.10] bg-[#1c1c1c] text-gray-500 hover:text-white hover:border-white/[0.20] transition-colors duration-150"
            aria-label="Previous projects"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="flex items-center justify-center size-7 rounded-full border border-white/[0.10] bg-[#1c1c1c] text-gray-500 hover:text-white hover:border-white/[0.20] transition-colors duration-150"
            aria-label="Next projects"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
