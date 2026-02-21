import { ProjectsCarousel } from '@/components/dashboard/ProjectsCarousel'
import type { SerializedProject } from '@/components/dashboard/ProjectsCarousel'
import type { ClientOption } from '@/components/dashboard/CreateProjectModal'

interface ProjectsAdminViewProps {
  serializedProjects: SerializedProject[]
  clientOptions: ClientOption[]
  username: string
  userRole: string
}

export function ProjectsAdminView({
  serializedProjects,
  clientOptions,
  username,
}: ProjectsAdminViewProps) {
  return (
    <ProjectsCarousel
      projects={serializedProjects}
      username={username}
      canCreate={true}
      clients={clientOptions}
    />
  )
}
