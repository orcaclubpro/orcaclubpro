import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Building2, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProjectTimeline } from '@/components/dashboard/ProjectTimeline'
import { ProjectSettingsModal } from '@/components/dashboard/ProjectSettingsModal'
import { TasksList } from '@/components/dashboard/TasksList'
import type { Project, Task } from '@/types/payload-types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; project: string }>
}) {
  const { project: projectId } = await params

  try {
    const payload = await getPayload({ config })
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0,
    })

    return {
      title: `${project.name} - ORCACLUB`,
      description: project.description || `Project timeline for ${project.name}`,
    }
  } catch {
    return {
      title: 'Project Not Found - ORCACLUB',
      description: 'Project not found',
    }
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ username: string; project: string }>
}) {
  const { username, project: projectId } = await params
  const user = await getCurrentUser()

  // Auth check
  if (!user || user.username !== username) {
    redirect('/login')
  }

  // Only admin and user roles can access project details
  if (user.role === 'client') {
    redirect(`/u/${username}`)
  }

  const payload = await getPayload({ config })

  // Fetch project with relationships
  let project: Project
  try {
    project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 2,
    })
  } catch {
    notFound()
  }

  // Access validation: users can only see projects they are assigned to
  if (user.role !== 'admin') {
    const assignedUserIds = Array.isArray(project.assignedTo)
      ? project.assignedTo.map((u) => (typeof u === 'string' ? u : u.id))
      : []
    if (!assignedUserIds.includes(user.id)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl border border-red-400/20 bg-white/[0.02] backdrop-blur-sm p-8 text-center">
            <div className="inline-flex p-5 rounded-xl bg-red-400/10 border border-red-400/20 mb-6">
              <AlertCircle className="size-10 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 text-sm">
              You do not have permission to view this project.
            </p>
          </div>
        </div>
      )
    }
  }

  // Fetch related tasks
  const { docs: tasks } = await payload.find({
    collection: 'tasks',
    where: { project: { equals: projectId } },
    depth: 2,
    sort: '-createdAt',
    limit: 200,
  })

  // Fetch related sprints
  const { docs: sprints } = await payload.find({
    collection: 'sprints',
    where: { project: { equals: projectId } },
    depth: 1,
    sort: '-createdAt',
    limit: 50,
  })

  // Get client info
  const clientAccount = typeof project.client === 'object' ? project.client : null

  return (
    <div className="min-h-screen">
      {/* Back Navigation */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <Link
          href={`/u/${username}/projects`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-intelligence-cyan transition-colors group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          Back to Projects
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6">
            {clientAccount && (
              <>
                <Building2 className="size-3.5 text-gray-400" />
                <span className="text-sm text-gray-400">{clientAccount.name}</span>
              </>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            {project.name}
          </h1>

          {project.description && (
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Settings Button */}
          <div className="mt-8">
            <ProjectSettingsModal project={project} tasks={tasks} />
          </div>
        </div>

        {/* Timeline */}
        <ProjectTimeline project={project} tasks={tasks} />

        {/* Tasks List */}
        <TasksList tasks={tasks} projectId={project.id} />
      </div>
    </div>
  )
}
