import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { project: projectId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // Verify user has access to the project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0,
    })

    if (user.role !== 'admin') {
      const assignedUserIds = Array.isArray(project.assignedTo)
        ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
        : []
      if (!assignedUserIds.includes(user.id)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const { docs: sprints } = await payload.find({
      collection: 'sprints',
      where: { project: { equals: projectId } },
      depth: 1,
      sort: '-createdAt',
      limit: 50,
    })

    return NextResponse.json({ sprints })
  } catch (error) {
    console.error('[GET /api/projects/[project]/sprints]', error)
    return NextResponse.json(
      { error: 'Failed to fetch sprints' },
      { status: 500 }
    )
  }
}
