import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProjectsList } from '@/components/dashboard/ProjectsList'
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal'
import { FolderKanban, Plus } from 'lucide-react'
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

  if (!user || user.username !== username) {
    redirect('/login')
  }

  if (!user.username) {
    redirect('/login')
  }

  const payload = await getPayload({ config })

  // ROLE-BASED PROJECT FETCHING
  if (user.role === 'admin' || user.role === 'user') {
    // Fetch projects based on role
    const { docs: projects } = await payload.find({
      collection: 'projects',
      where:
        user.role === 'admin'
          ? {}
          : { assignedTo: { contains: user.id } },
      depth: 2,
      sort: '-createdAt',
      limit: 100,
    })

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <FolderKanban className="size-8 text-intelligence-cyan" />
                {user.role === 'admin' ? 'All Projects' : 'Assigned Projects'}
              </h1>
              <p className="text-gray-400">
                {user.role === 'admin'
                  ? 'View and manage all projects across the platform'
                  : 'Track progress of your assigned projects'}
              </p>
            </div>

            {/* Create Project Button */}
            <CreateProjectModal />
          </div>
        </div>

        {/* Projects List */}
        {projects && projects.length > 0 ? (
          <ProjectsList projects={projects} />
        ) : (
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="p-4 rounded-full bg-white/5 inline-flex mb-4">
                <FolderKanban className="size-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Projects
              </h3>
              <p className="text-gray-400 mb-6">
                {user.role === 'admin'
                  ? 'No projects have been created yet.'
                  : 'You are not assigned to any projects at the moment.'}
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // CLIENT ROLE: Original logic
  // Fetch client account with projects
  const clientAccount = user.clientAccount
    ? await payload.findByID({
        collection: 'client-accounts',
        id: typeof user.clientAccount === 'string' ? user.clientAccount : user.clientAccount.id,
        depth: 2,
      })
    : null

  if (!clientAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="p-4 rounded-full bg-red-500/20 inline-flex mb-4">
            <FolderKanban className="size-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Account Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            Your client account could not be found. Please contact support.
          </p>
          <Button asChild variant="default" size="lg">
            <a href="/contact" className="gap-2">
              Contact Support
            </a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <FolderKanban className="size-8 text-intelligence-cyan" />
              Your Projects
            </h1>
            <p className="text-gray-400">
              Track progress and view details of your active projects
            </p>
          </div>
          <Button asChild className="bg-intelligence-cyan hover:bg-intelligence-cyan/90 text-black font-semibold">
            <a href="/contact" className="gap-2">
              <Plus className="size-4" />
              New Project
            </a>
          </Button>
        </div>
      </div>

      {/* Projects List */}
      {clientAccount.projects && clientAccount.projects.length > 0 ? (
        <ProjectsList projects={clientAccount.projects} />
      ) : (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="p-4 rounded-full bg-white/5 inline-flex mb-4">
              <FolderKanban className="size-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Projects Yet
            </h3>
            <p className="text-gray-400 mb-6">
              You don't have any projects at the moment. Get started by reaching out to discuss your next project.
            </p>
            <Button asChild variant="default" size="lg" className="bg-intelligence-cyan hover:bg-intelligence-cyan/90 text-black">
              <a href="/contact" className="gap-2">
                <Plus className="size-4" />
                Start a Project
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
