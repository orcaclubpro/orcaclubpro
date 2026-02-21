import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProjectsList } from '@/components/dashboard/ProjectsList'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'
import { FolderKanban, Mail, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return {
    title: `Projects - ${username} - ORCACLUB Spaces`,
    description: 'View and manage your projects',
  }
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const user = await getCurrentUser()

  if (!user || user.username !== username) redirect('/login')
  if (!user.username) redirect('/login')

  const payload = await getPayload({ config })

  // ─── ADMIN / USER ─────────────────────────────────────────────────────────

  if (user.role === 'admin' || user.role === 'user') {
    const { docs: projects } = await payload.find({
      collection: 'projects',
      where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
      depth: 2,
      sort: '-createdAt',
      limit: 100,
    })

    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-16 space-y-8">
        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-3">
              {user.role === 'admin' ? 'Admin' : 'Dashboard'}
            </p>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Projects</h1>
            <p className="text-sm text-gray-500 mt-1.5">
              {user.role === 'admin'
                ? `${projects.length} total project${projects.length !== 1 ? 's' : ''}`
                : `${projects.length} assigned project${projects.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <CreateProjectModal />
        </div>

        {/* Projects List */}
        {projects.length > 0 ? (
          <ProjectsList projects={projects} />
        ) : (
          <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] p-12 text-center">
            <p className="text-sm font-semibold text-white mb-2">No Projects Yet</p>
            <p className="text-xs text-gray-500">
              {user.role === 'admin'
                ? 'No projects have been created yet.'
                : 'You are not assigned to any projects at the moment.'}
            </p>
          </div>
        )}
      </div>
    )
  }

  // ─── CLIENT VIEW ──────────────────────────────────────────────────────────

  const clientAccount = user.clientAccount
    ? await payload.findByID({
        collection: 'client-accounts',
        id: typeof user.clientAccount === 'string' ? user.clientAccount : user.clientAccount.id,
        depth: 2,
      })
    : null

  if (!clientAccount) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <p className="text-sm font-semibold text-white mb-2">Account Not Found</p>
          <p className="text-xs text-gray-500 mb-6">
            Your client account could not be found. Please contact support.
          </p>
          <Button asChild size="sm" className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-xs">
            <a href="/contact">Contact Support</a>
          </Button>
        </div>
      </div>
    )
  }

  const projects = clientAccount.projects || []

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-16 space-y-8">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-3">
            Client Dashboard
          </p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Your Projects</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-xs"
        >
          <a href="/contact" className="gap-1.5">
            <Plus className="size-3.5" />
            New Project
          </a>
        </Button>
      </div>

      {/* Projects List */}
      {projects.length > 0 ? (
        <ProjectsList projects={projects} />
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1c] p-12 text-center">
          <p className="text-sm font-semibold text-white mb-2">No Projects Yet</p>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            You don't have any projects yet. Reach out to get started.
          </p>
          <Button
            asChild
            size="sm"
            className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium text-xs"
          >
            <a href="/contact" className="gap-1.5">
              <Mail className="size-3.5" />
              Start a Project
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
