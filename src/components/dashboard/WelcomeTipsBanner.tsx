'use client'

import { useState, useTransition } from 'react'
import { X, FolderOpen, Receipt, ArrowRight } from 'lucide-react'
import { dismissTips } from '@/actions/profile'

interface WelcomeTipsBannerProps {
  firstName?: string | null
}

export function WelcomeTipsBanner({ firstName }: WelcomeTipsBannerProps) {
  const [visible, setVisible] = useState(true)
  const [, startTransition] = useTransition()

  if (!visible) return null

  const handleDismiss = () => {
    setVisible(false) // optimistic hide — feels instant
    startTransition(() => {
      dismissTips()
    })
  }

  return (
    <div className="relative rounded-xl border border-[rgba(139,156,182,0.15)] bg-[rgba(255,255,255,0.03)] overflow-hidden">
      {/* Subtle left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[rgba(139,156,182,0.50)] rounded-l-xl" />

      <div className="px-5 py-4 pl-6 flex items-start gap-4">

        {/* Icon */}
        <div className="shrink-0 mt-0.5 p-2 rounded-lg bg-[rgba(139,156,182,0.10)] border border-[rgba(139,156,182,0.15)]">
          <FolderOpen className="size-4 text-[var(--space-accent)]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-[var(--space-accent)] uppercase tracking-[0.25em] mb-1">
            Welcome to ORCACLUB{firstName ? `, ${firstName}` : ''}
          </p>
          <p className="text-sm text-gray-300 font-light leading-relaxed">
            This is your client portal — view the progress of your projects and pay your invoices, all in one place.
          </p>

          {/* Quick tips row */}
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <FolderOpen className="size-3 text-[rgba(139,156,182,0.50)]" />
              Track project milestones &amp; sprints
              <ArrowRight className="size-3 opacity-40" />
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <Receipt className="size-3 text-[rgba(139,156,182,0.50)]" />
              View and pay invoices
              <ArrowRight className="size-3 opacity-40" />
            </span>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
          aria-label="Dismiss welcome banner"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
