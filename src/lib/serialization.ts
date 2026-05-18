// Canonical serialized types and helpers for converting raw Payload documents
// into plain objects safe to pass across the server/client boundary.

export type SerializedSprint = {
  id: string
  name: string
  status: 'pending' | 'in-progress' | 'delayed' | 'finished'
  startDate: string
  endDate: string
  description: string | null
  goalDescription: string | null
  completedTasksCount: number
  totalTasksCount: number
  projectId: string
}

export type SerializedTask = {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent' | null
  dueDate: string | null
}

export type SerializedProject = {
  id: string
  name: string
  status: string
  description: string | null
  startDate: string | null
  endDate: string | null
  budget: number | null
  currency: string
  updatedAt: string
  client: { id: string; name: string } | null
  milestones: Array<{
    id: string
    title: string
    date: string | null
    description: string | null
    completed: boolean
  }>
  sprints: SerializedSprint[]
  tasks: SerializedTask[]
}

export function serializeSprint(s: any): SerializedSprint {
  const projectId = typeof s.project === 'string' ? s.project : s.project?.id ?? ''
  return {
    id: s.id,
    name: s.name ?? '',
    status: (s.status ?? 'pending') as SerializedSprint['status'],
    startDate: s.startDate ?? new Date().toISOString(),
    endDate: s.endDate ?? new Date().toISOString(),
    description: s.description ?? null,
    goalDescription: s.goalDescription ?? null,
    completedTasksCount: s.completedTasksCount ?? 0,
    totalTasksCount: s.totalTasksCount ?? 0,
    projectId,
  }
}

export function serializeProject(
  p: any,
  sprints: SerializedSprint[] = [],
  tasks: SerializedTask[] = [],
): SerializedProject {
  const clientRaw = p.client
  const client =
    clientRaw && typeof clientRaw === 'object'
      ? { id: clientRaw.id ?? '', name: clientRaw.name ?? '' }
      : null

  return {
    id: p.id,
    name: p.name ?? '',
    status: p.status ?? 'active',
    description: p.description ?? null,
    startDate: p.startDate ?? null,
    endDate: p.projectedEndDate ?? null,
    budget: p.budgetAmount ?? null,
    currency: p.currency ?? 'USD',
    updatedAt: p.updatedAt ?? new Date().toISOString(),
    client,
    milestones: (p.milestones ?? []).map((m: any) => ({
      id: m.id ?? '',
      title: m.title ?? '',
      date: m.date ?? null,
      description: m.description ?? null,
      completed: m.completed ?? false,
    })),
    sprints,
    tasks,
  }
}

// Build a sprint-by-project lookup map from a flat sprint array.
export function groupSprintsByProject(sprints: any[]): Record<string, SerializedSprint[]> {
  const map: Record<string, SerializedSprint[]> = {}
  for (const s of sprints) {
    const pid = typeof s.project === 'string' ? s.project : (s.project as any)?.id ?? ''
    if (!map[pid]) map[pid] = []
    map[pid].push(serializeSprint(s))
  }
  return map
}

// Build a task-by-project lookup map from a flat task array (tasks without dueDate are skipped).
export function groupTasksByProject(tasks: any[]): Record<string, SerializedTask[]> {
  const map: Record<string, SerializedTask[]> = {}
  for (const t of tasks) {
    if (!t.dueDate) continue
    const pid = typeof t.project === 'string' ? t.project : (t.project as any)?.id ?? ''
    if (!pid) continue
    if (!map[pid]) map[pid] = []
    map[pid].push({
      id: t.id,
      title: t.title ?? '',
      status: (t.status ?? 'pending') as SerializedTask['status'],
      priority: (t.priority ?? null) as SerializedTask['priority'],
      dueDate: t.dueDate,
    })
  }
  return map
}
