import { ProjectsLedgerView } from '@/components/dashboard/ProjectsLedgerView'
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
    <ProjectsLedgerView
      projects={serializedProjects}
      username={username}
      canCreate
      clients={clientOptions}
    />
  )
}
