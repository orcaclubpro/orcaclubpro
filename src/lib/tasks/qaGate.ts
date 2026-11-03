/**
 * Close gate for tracked dev tasks (a task with a `ccqTaskId`): it can only be
 * completed once QA has passed it with proof, either a recorded commit or a
 * report link (read-only reviews, reports and ops work have no commit; Chance,
 * Nov 3 2026). Ordinary portal tasks are unaffected.
 *
 * Pure (no payload import) so it is unit-testable; the Tasks collection's
 * beforeChange hook throws an APIError with the returned message.
 */
export function qaCompletionError(
  data: Record<string, any> | undefined | null,
  originalDoc: Record<string, any> | undefined | null,
): string | null {
  if (!data) return null
  const completing = data.status === 'completed' && originalDoc?.status !== 'completed'
  const merged = { ...(originalDoc ?? {}), ...data } as Record<string, any>
  if (!completing || !merged.ccqTaskId) return null
  const qa = (merged.qa ?? {}) as { status?: string; commit?: string | null; reportLink?: string | null }
  const commit = String(qa.commit ?? '').trim()
  const reportLink = String(qa.reportLink ?? '').trim()
  if (qa.status === 'pass' && (commit || reportLink)) return null
  return (
    `Task ${merged.ccqTaskId} cannot be completed: qa.status must be "pass" with qa.commit or qa.reportLink set ` +
    `(got status "${qa.status ?? 'none'}", commit "${commit}", reportLink "${reportLink}").`
  )
}
