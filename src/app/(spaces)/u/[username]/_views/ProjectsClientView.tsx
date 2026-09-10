import { ProjectsLedgerView } from '@/components/dashboard/ProjectsLedgerView'
import type { SerializedProject } from '@/lib/serialization'

export function ProjectsClientView({
  serializedProjects,
  username,
}: {
  serializedProjects: SerializedProject[]
  username: string
}) {
  return <ProjectsLedgerView projects={serializedProjects} username={username} />
}
