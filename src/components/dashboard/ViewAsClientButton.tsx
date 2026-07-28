'use client'

import { useTransition } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { enterClientPreview } from '@/app/(spaces)/preview-actions'

/**
 * Staff-only. Enters "view as client" mode for the given account — the whole
 * dashboard then renders as that client sees it, with an exit banner up top.
 */
export function ViewAsClientButton({ accountId }: { accountId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => enterClientPreview(accountId))}
      className="flex items-center gap-2.5 bg-[var(--space-bg-card-hover)] hover:bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] hover:border-[var(--space-border-hard)] text-[var(--space-text-tertiary)] hover:text-[var(--space-text-primary)] font-semibold rounded-full px-7 py-3 text-sm transition-all duration-200 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
      View as client
    </button>
  )
}
