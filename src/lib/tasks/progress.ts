/**
 * Progress for a package or project, from its tasks and milestones.
 *
 * - Cancelled tasks are out of scope: they count toward neither done nor total.
 * - `percent` weighs every open unit equally, so a task and a milestone each
 *   count once. It is 0 when there is nothing to do yet (not 100: an empty
 *   plan is not a finished one).
 */

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'

export interface ProgressInput {
  tasks: Array<{ status?: string | null }>
  milestones: Array<{ completed?: boolean | null }>
}

export interface Progress {
  tasks: { total: number; done: number; byStatus: Record<TaskStatus, number> }
  milestones: { total: number; done: number }
  /** 0–100, rounded to a whole number. */
  percent: number
}

const STATUSES: TaskStatus[] = ['pending', 'in-progress', 'completed', 'cancelled']

export function computeProgress({ tasks, milestones }: ProgressInput): Progress {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<TaskStatus, number>
  for (const t of tasks) {
    const s = (STATUSES as string[]).includes(t.status ?? '') ? (t.status as TaskStatus) : 'pending'
    byStatus[s]++
  }
  const taskTotal = tasks.length - byStatus.cancelled
  const taskDone = byStatus.completed
  const msTotal = milestones.length
  const msDone = milestones.filter((m) => m.completed).length
  const units = taskTotal + msTotal
  const percent = units === 0 ? 0 : Math.round(((taskDone + msDone) / units) * 100)
  return {
    tasks: { total: taskTotal, done: taskDone, byStatus },
    milestones: { total: msTotal, done: msDone },
    percent,
  }
}
