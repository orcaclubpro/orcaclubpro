import { Eye, X } from 'lucide-react'
import { exitClientPreview } from '@/app/(spaces)/preview-actions'

/**
 * Persistent indicator shown to staff while previewing a client's portal.
 * Renders at the top of the dashboard content; the Exit button clears the
 * preview cookie via the server action and returns to the Clients tab.
 */
export function ClientPreviewBanner({ clientName }: { clientName: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-sm bg-amber-400/10 border-b border-amber-400/25 text-amber-200/90">
      <Eye className="size-4 shrink-0 text-amber-300/90" />
      <span className="truncate">
        Previewing <span className="font-semibold text-amber-100">{clientName}</span>&rsquo;s client view
      </span>
      <form action={exitClientPreview}>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-400/20"
        >
          <X className="size-3" />
          Exit preview
        </button>
      </form>
    </div>
  )
}
