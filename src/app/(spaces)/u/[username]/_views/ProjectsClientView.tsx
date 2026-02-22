import { ProjectsCarousel } from '@/components/dashboard/ProjectsCarousel'
import type { SerializedProject } from '@/components/dashboard/ProjectsCarousel'

interface ProjectsClientViewProps {
  serializedProjects: SerializedProject[]
  username: string
}

export function ProjectsClientView({ serializedProjects, username }: ProjectsClientViewProps) {
  return (
    <ProjectsCarousel
      projects={serializedProjects}
      username={username}
      canCreate={false}
    />
  )
}
