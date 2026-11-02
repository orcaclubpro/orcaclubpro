/**
 * One `activity` row (kind `agent-write`) per MCP write, carrying the bot actor.
 *
 * Awaited, not `setImmediate`: on serverless a deferred write can be frozen away
 * after the response, and this row is the only place the bot's name is kept.
 * It runs without `req` (its own transaction) and never throws, so a failed
 * audit write cannot fail or roll back the tool call it records.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

export interface AgentWriteRecord {
  actor: string
  tool: string
  ok: boolean
  /** Primary id the tool acted on, if any (projectId, packageId, entry id…). */
  targetId?: string | null
  error?: string | null
}

const TARGET_KEYS = ['packageId', 'projectId', 'retainerId', 'clientAccountId', 'id'] as const

export function targetIdOf(input: Record<string, unknown>): string | null {
  for (const key of TARGET_KEYS) {
    const v = input[key]
    if (typeof v === 'string' && v) return v
  }
  return null
}

export async function recordAgentWrite(rec: AgentWriteRecord): Promise<void> {
  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'activity',
      data: {
        kind: 'agent-write',
        occurredAt: new Date().toISOString(),
        title: `${rec.actor}: ${rec.tool}`,
        summary: rec.ok ? (rec.targetId ? `target ${rec.targetId}` : 'ok') : `rejected: ${rec.error ?? 'error'}`.slice(0, 500),
        status: rec.ok ? 'ok' : 'error',
        agentActor: rec.actor,
        tool: rec.tool,
      },
      context: { skipActivityLog: true },
    })
  } catch (error) {
    console.error('[mcp audit] failed to record agent write', rec.tool, error instanceof Error ? error.message : error)
  }
}
