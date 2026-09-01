import { ProjectsView } from '@/components/dashboard/ProjectsView'
import type { SerializedProject } from '@/lib/serialization'
import type { ClientOption } from '@/components/dashboard/CreateProjectModal'

export function ProjectsAdminView({
  serializedProjects,
  clientOptions,
  username,
}: {
  serializedProjects: SerializedProject[]
  clientOptions: ClientOption[]
  username: string
  userRole: string
}) {
  return (
    <ProjectsView
      projects={serializedProjects}
      username={username}
      canCreate
      clients={clientOptions}
    />
  )
}
