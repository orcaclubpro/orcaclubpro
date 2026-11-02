/**
 * Who is acting through the shared MCP connection.
 *
 * All bots share one MCP identity (one Payload user), so the Payload user alone
 * cannot say which bot made a write. Every write tool therefore requires an
 * explicit `actor`: one of the named bots, or a ccq task id (`T<yymmdd>-<hhmmss>`)
 * for a dev session working a queued task. It is recorded on the activity row
 * the write produces, and later on tasks/reports (plan steps 2–3).
 */
import { z } from 'zod'

export const BOT_ACTORS = ['gojo', 'vegapunk', 'edison', 'shaka', 'finn', 'orca', 'mothership', 'sia'] as const

/** ccq task id, e.g. T261101-232341. */
export const CCQ_TASK_ID = /^T\d{6}-\d{6}$/

export function isValidActor(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return (BOT_ACTORS as readonly string[]).includes(value) || CCQ_TASK_ID.test(value)
}

export const ACTOR = z
  .string()
  .refine(isValidActor, {
    message: `actor must be one of ${BOT_ACTORS.join('|')} or a ccq task id like T261101-232341`,
  })
  .describe(`Who is making this write: ${BOT_ACTORS.join(' | ')} | <ccq task id>. Required on every write.`)
