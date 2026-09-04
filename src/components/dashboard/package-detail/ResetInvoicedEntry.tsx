'use client'

import { Loader2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

// Sits beside the "Invoiced" badge on a schedule row. Two-click confirm (no
// window.confirm — this deletes an order and voids a Stripe invoice), spinner while
// running, and the outcome or the refusal rendered inline.

export function ResetInvoicedEntry({
  armed,
  running,
  disabled,
  result,
  onClick,
  onBlur,
}: {
  armed: boolean
  running: boolean
  disabled?: boolean
  result?: { note: string } | { error: string }
  onClick: () => void
  onBlur: () => void
}) {
  return (
    <>
      {result && 'note' in result && (
        <span className="text-[0.625rem] text-[var(--space-text-muted)] max-w-[8.75rem] leading-snug">{result.note}</span>
      )}
      {result && 'error' in result && (
        <span className="text-[0.625rem] text-red-400 max-w-[8.75rem] leading-snug">{result.error}</span>
      )}
      <button
        type="button"
        disabled={running || disabled}
        onClick={onClick}
        onBlur={onBlur}
        title={armed ? 'Click again to confirm reset' : 'Reset — put this payment back on the schedule'}
        aria-label={armed ? 'Confirm reset payment' : 'Reset — put this payment back on the schedule'}
        className={cn(
          'flex items-center gap-1 justify-center rounded transition-all disabled:opacity-40',
          armed
            ? 'px-1.5 py-0.5 text-[0.625rem] font-semibold text-amber-400 border border-amber-400/30 bg-amber-400/[0.08]'
            : 'size-6 text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] hover:bg-[var(--space-bg-card-hover)]',
        )}
      >
        {running
          ? <Loader2 className="size-3 animate-spin" />
          : <RotateCcw className="size-3" />
        }
        {armed && !running ? 'Confirm' : ''}
      </button>
    </>
  )
}
