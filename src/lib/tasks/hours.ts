/**
 * Hours on tasks and projects (plan step 4, MCP 4).
 *
 * - `actualHours` on a task is work time an agent or human logs, usually when the
 *   task closes. It is NOT billable time: nothing here creates a `log_work` entry.
 * - `approvedHours` on a project is the hours budget only Chance sets. MCP can
 *   never write it (writeGuard `CHANCE_ONLY_KEYS`); bots read it here.
 * - Going over the approved hours is a warning in tool output, never a block.
 */

/** Hours are logged in quarter-hour steps. */
export const HOURS_STEP = 0.25

/** Largest single value accepted for a task's hours (a guard against typos like 3000). */
export const MAX_TASK_HOURS = 1000

export const isQuarterHour = (n: number): boolean => Number.isFinite(n) && Math.abs(n * 4 - Math.round(n * 4)) < 1e-9

/** Round a wall-clock duration up to the next quarter hour (for agent-clock hours). */
export const roundUpToQuarter = (hours: number): number => Math.ceil(hours * 4 - 1e-9) / 4

export interface ProjectHours {
  /** Chance-approved budget, or null when none is set. */
  approved: number | null
  /** Sum of `actualHours` over the project's tasks (cancelled tasks included: the time was spent). */
  used: number
  /** approved − used, or null when there is no approved budget. Negative when over. */
  remaining: number | null
  /** Tasks marked completed with no hours logged. */
  completedWithoutHours: number
  warnings: string[]
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export function computeProjectHours(input: {
  approvedHours?: unknown
  tasks: Array<{ status?: string | null; actualHours?: unknown }>
}): ProjectHours {
  const approved = num(input.approvedHours)
  let used = 0
  let completedWithoutHours = 0
  for (const t of input.tasks) {
    const h = num(t.actualHours)
    if (h != null && h > 0) used += h
    if (t.status === 'completed' && (h == null || h <= 0)) completedWithoutHours++
  }
  used = Math.round(used * 100) / 100
  const remaining = approved == null ? null : Math.round((approved - used) * 100) / 100

  const warnings: string[] = []
  if (approved != null && remaining != null && remaining < 0) {
    warnings.push(`Logged hours (${used}) are over the approved ${approved} by ${-remaining}. Flag it to Chance.`)
  }
  if (completedWithoutHours > 0) {
    warnings.push(`${completedWithoutHours} completed task(s) have no actualHours logged.`)
  }
  return { approved, used, remaining, completedWithoutHours, warnings }
}
