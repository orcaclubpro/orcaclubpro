/**
 * POST /api/ops-views: Fedora's outbound push of the Carbonara read-view snapshots (orcaclub-ops-mcp v3 stage 1a).
 *
 * Same auth as /api/mcp (payload.auth on the Authorization header: OAuth bearer or `users API-Key`), staff only,
 * plus `actor: "orca"` in the body (Fedora's publisher). No new auth scheme. The body is validated by
 * checkPublish (view names, keys, sizes, sha256 of every text) and stored verbatim in the cards database
 * (CARDS_DATABASE_URI). Off when that database is unset (503, nothing stored). Readers use the read-only MCP
 * tools ops_my_queue / ops_card_get / ops_waiting_on_chance / ops_machine_busy; nothing else reads or writes here.
 */
import { getCurrentUser } from '@/actions/auth'
import { cardsEnabled, storeOpsViews } from '@/lib/cards/db'
import { checkPublish } from '@/lib/cards/opsViews'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BODY = 4 * 1024 * 1024

export async function POST(req: Request): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin' && user.role !== 'user') {
    return Response.json({ ok: false, error: 'Forbidden: staff only' }, { status: 403 })
  }
  if (!cardsEnabled()) return Response.json({ ok: false, error: 'cards database is off' }, { status: 503 })
  const raw = await req.text()
  if (raw.length > MAX_BODY) return Response.json({ ok: false, error: 'body too large' }, { status: 413 })
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return Response.json({ ok: false, error: 'body is not JSON' }, { status: 400 })
  }
  const check = checkPublish(body)
  if (!check.ok) return Response.json({ ok: false, error: check.error }, { status: 400 })
  try {
    const stored = await storeOpsViews(check.snapshots)
    return Response.json({ ok: true, stored })
  } catch {
    return Response.json({ ok: false, error: 'cards database is unavailable; try again' }, { status: 503 })
  }
}
