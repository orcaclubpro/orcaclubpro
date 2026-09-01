import { ProjectsView } from '@/components/dashboard/ProjectsView'
import type { SerializedProject } from '@/lib/serialization'

export function ProjectsClientView({
  serializedProjects,
  username,
}: {
  serializedProjects: SerializedProject[]
  username: string
}) {
  return <ProjectsView projects={serializedProjects} username={username} />
}
