import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { theme } = await req.json()
  const validThemes = ['void', 'arctic', 'ember', 'emerald', 'dusk', 'chrome']
  if (!validThemes.includes(theme)) return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { dashboardTheme: theme },
    overrideAccess: false,
    user,
  })

  return NextResponse.json({ ok: true })
}
