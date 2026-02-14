import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const user = await getCurrentUser()

    if (!user || user.username !== username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const { docs: projects } = await payload.find({
      collection: 'projects',
      where:
        user.role === 'admin'
          ? {}
          : { assignedTo: { contains: user.id } },
      depth: 1,
      sort: '-createdAt',
      limit: 100,
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('[GET /api/users/[username]/projects]', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
