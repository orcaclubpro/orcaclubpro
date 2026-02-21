import { ProjectsCarousel } from '@/components/dashboard/ProjectsCarousel'
import { ProjectsSidebar } from '@/components/dashboard/ProjectsSidebar'
import type { SerializedProject } from '@/components/dashboard/ProjectsCarousel'

interface ProjectsClientViewProps {
  serializedProjects: SerializedProject[]
  username: string
}

export function ProjectsClientView({ serializedProjects, username }: ProjectsClientViewProps) {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-20 space-y-8">
        <div>
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">
            Client Dashboard
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Your Projects
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {serializedProjects.length} project{serializedProjects.length !== 1 ? 's' : ''}
          </p>
        </div>

        <ProjectsCarousel projects={serializedProjects} username={username} />
      </div>

      <ProjectsSidebar
        projects={serializedProjects}
        username={username}
        canCreate={false}
      />
    </>
  )
}
