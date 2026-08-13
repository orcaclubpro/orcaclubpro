/**
 * Visible "Last updated <date>" line for spoke pages. Subtle gray-400 mono.
 * Pass an ISO date string (e.g. '2026-08-13') — the same value should feed
 * articleSchema()'s dateModified so the visible date and JSON-LD never drift.
 */
export function LastUpdated({ date, className = '' }: { date: string; className?: string }) {
  const formatted = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
  return (
    <p className={`text-xs text-gray-400 font-mono tracking-wide ${className}`}>
      Last updated <time dateTime={date}>{formatted}</time>
    </p>
  )
}
