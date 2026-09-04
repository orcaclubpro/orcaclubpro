'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface SearchClient {
  id: string
  name: string
  email: string
  company?: string | null
  accountBalance?: number | null
}

export interface SearchProject {
  id: string
  name: string
  status: string
  description?: string | null
  clientName?: string | null
  clientId?: string | null
}

export interface SearchSprint {
  id: string
  name: string
  status: string
  projectId: string
  projectName: string
  clientName?: string | null
  description?: string | null
}

export interface SearchPackage {
  id: string
  name: string
  status: string
  clientId: string | null
  clientName?: string | null
  description?: string | null
  /** Totals over included items only — add-ons are an offer, never a charge. */
  oneTime: number
  monthly: number
  annual: number
}

export interface SearchData {
  clients: SearchClient[]
  projects: SearchProject[]
  sprints: SearchSprint[]
  packages: SearchPackage[]
}

export async function fetchSearchData(): Promise<{
  success: boolean
  data?: SearchData
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const [clientsResult, projectsResult, sprintsResult] = await Promise.all([
      payload.find({
        collection: 'client-accounts',
        depth: 0,
        limit: 500,
        sort: 'name',
        where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
      }),
      payload.find({
        collection: 'projects',
        depth: 1,
        limit: 500,
        sort: '-updatedAt',
        where: user.role === 'admin' ? {} : { assignedTo: { contains: user.id } },
      }),
      payload.find({
        collection: 'sprints',
        depth: 2,
        limit: 500,
        sort: 'name',
        where: user.role === 'admin' ? {} : { 'project.assignedTo': { equals: user.id } },
      }),
    ])

    const clients: SearchClient[] = clientsResult.docs.map((c: any) => ({
      id: c.id,
      name: c.name ?? '',
      email: c.email ?? '',
      company: c.company ?? null,
      accountBalance: c.accountBalance ?? null,
    }))

    const projects: SearchProject[] = projectsResult.docs.map((p: any) => {
      const clientRaw = p.client
      const clientName = clientRaw && typeof clientRaw === 'object' ? clientRaw.name : null
      const clientId =
        clientRaw && typeof clientRaw === 'object'
          ? clientRaw.id
          : typeof clientRaw === 'string'
            ? clientRaw
            : null
      return {
        id: p.id,
        name: p.name ?? '',
        status: p.status ?? 'pending',
        description: p.description ?? null,
        clientName,
        clientId,
      }
    })

    const sprints: SearchSprint[] = sprintsResult.docs.map((s: any) => {
      const project = s.project && typeof s.project === 'object' ? s.project : null
      const client = project?.client && typeof project.client === 'object' ? project.client : null
      return {
        id: s.id,
        name: s.name ?? '',
        status: s.status ?? 'pending',
        projectId: project?.id ?? (typeof s.project === 'string' ? s.project : ''),
        projectName: project?.name ?? '',
        clientName: client?.name ?? null,
        description: s.description ?? null,
      }
    })

    // Proposals, scoped the same way the rest of this action scopes: admins see
    // everything, other staff see only the clients assigned to them. Runs after
    // the batch because the non-admin filter needs the resolved client ids.
    const canSeeAnyPackages = user.role === 'admin' || clients.length > 0
    const packagesResult = canSeeAnyPackages
      ? await payload
          .find({
            collection: 'packages',
            depth: 1,
            limit: 500,
            sort: '-createdAt',
            where:
              user.role === 'admin'
                ? ({ type: { equals: 'proposal' } } as any)
                : ({
                    and: [
                      { type: { equals: 'proposal' } },
                      { clientAccount: { in: clients.map((c) => c.id) } },
                    ],
                  } as any),
          })
          .catch(() => ({ docs: [] as any[] }))
      : { docs: [] as any[] }

    const packages: SearchPackage[] = packagesResult.docs.map((p: any) => {
      const account = p.clientAccount && typeof p.clientAccount === 'object' ? p.clientAccount : null
      let oneTime = 0, monthly = 0, annual = 0
      for (const item of (p.lineItems ?? []) as any[]) {
        if (item.isAddOn) continue
        const total = (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1)
        if (item.isRecurring) {
          if (item.recurringInterval === 'year') annual += total
          else monthly += total
        } else {
          oneTime += total
        }
      }
      return {
        id: p.id,
        name: p.name ?? '',
        status: p.status ?? 'draft',
        clientId: account?.id ?? (typeof p.clientAccount === 'string' ? p.clientAccount : null),
        clientName: account?.name ?? null,
        description: p.description ?? null,
        oneTime,
        monthly,
        annual,
      }
    })

    return { success: true, data: { clients, projects, sprints, packages } }
  } catch (error) {
    console.error('[fetchSearchData]', error)
    return { success: false, error: 'Failed to fetch search data' }
  }
}
