/**
 * Deep link to a task's admin edit page, computed from its id (no stored field).
 * Bots put this in Discord pings so a ping opens the task, not the site root.
 */
export function taskAdminUrl(id: string, base = process.env.NEXT_PUBLIC_SERVER_URL || 'https://orcaclub.pro'): string {
  return `${base.replace(/\/+$/, '')}/admin/collections/tasks/${encodeURIComponent(id)}`
}
