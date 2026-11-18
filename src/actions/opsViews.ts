'use server'
/**
 * Read side of the Carbonara read-view mirror (see src/lib/cards/opsViews.ts). Staff only, read-only: each call
 * returns the text Fedora published for that view, unchanged.
 */
import { getCurrentUser } from '@/actions/auth'
import { cardsEnabled, findOpsViews } from '@/lib/cards/db'
import { pickSnapshot, type ViewName } from '@/lib/cards/opsViews'

export type OpsViewResult = { ok: true; text: string } | { ok: false; error: string }

export async function readOpsView(view: ViewName, arg = ''): Promise<OpsViewResult> {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'admin' && user.role !== 'user')) return { ok: false, error: 'Unauthorized' }
  if (!cardsEnabled()) return { ok: false, error: 'Cards database is off (CARDS_DATABASE_URI is not set).' }
  try {
    const stored = await findOpsViews(view)
    return pickSnapshot(view, arg, stored.map((s) => ({ key: String(s.key ?? ''), text: String(s.text ?? '') })))
  } catch {
    return { ok: false, error: 'Cards database is unavailable; try again.' }
  }
}
