import { describe, expect, test } from 'bun:test'

import { buildClientDigest, isOpenTaskStatus, nextMilestoneOf, type DigestInput } from './clientDigest'

const NOW = '2026-11-02T20:00:00.000Z'

const project = (id: string, clientAccountId: string | null, extra: Partial<DigestInput['projects'][number]> = {}) => ({
  id,
  name: `Project ${id}`,
  status: 'in-progress',
  clientAccountId,
  percent: 50,
  tasksDone: 1,
  tasksTotal: 2,
  milestonesDone: 0,
  milestonesTotal: 0,
  milestones: [],
  ...extra,
})

const task = (id: string, projectId: string | null, status: string, createdAt: string, extra = {}) => ({
  id,
  title: `Task ${id}`,
  status,
  projectId,
  createdAt,
  ...extra,
})

const base = (): DigestInput => ({
  clients: [
    { id: 'A', name: 'Acme', company: 'Acme Inc' },
    { id: 'B', name: 'Beta', company: null },
    { id: 'C', name: 'Quiet Co', company: null },
  ],
  tasks: [
    task('t1', 'pA', 'pending', '2026-10-03T00:00:00Z'),
    task('t2', 'pA', 'in-progress', '2026-10-01T00:00:00Z', { dueDate: '2026-10-15T00:00:00Z' }),
    task('t3', 'pA', 'waiting-chance', '2026-10-05T00:00:00Z'),
    task('t4', 'pB', 'blocked', '2026-10-02T00:00:00Z'),
    task('t5', 'pB', 'completed', '2026-09-01T00:00:00Z'),
    task('t6', 'pOrphan', 'pending', '2026-10-09T00:00:00Z'),
    task('t7', 'pB', 'review', '2026-10-04T00:00:00Z'),
  ],
  projects: [project('pA', 'A'), project('pB', 'B'), project('pOrphan', null), project('pDone', 'C', { status: 'completed' })],
  retainers: [
    { clientAccountId: 'A', tier: 'growth', used: 12, cap: 20, cycleLabel: 'Nov 2026', health: 'healthy', overageAmount: 999 },
  ],
  drafts: [{ id: 'f1', name: 'SOW', documentTemplate: 'sow', clientAccountId: 'B', projectId: 'pB', createdAt: '2026-10-10' }],
  now: NOW,
})

describe('isOpenTaskStatus', () => {
  test('only completed and cancelled are closed; new statuses count as open', () => {
    for (const s of ['pending', 'in-progress', 'blocked', 'waiting-chance', 'anything-new', null, undefined]) {
      expect(isOpenTaskStatus(s)).toBe(true)
    }
    expect(isOpenTaskStatus('completed')).toBe(false)
    expect(isOpenTaskStatus('cancelled')).toBe(false)
  })
})

describe('buildClientDigest', () => {
  test('counts open work per client, by status, with overdue', () => {
    const { clients } = buildClientDigest(base())
    const a = clients.find((c) => c.clientAccountId === 'A')!
    expect(a.counts).toEqual({ open: 3, pending: 1, inProgress: 1, blocked: 0, waitingChance: 1, other: 0, overdue: 1 })
    const b = clients.find((c) => c.clientAccountId === 'B')!
    // completed t5 is not counted; unknown "review" goes to other.
    expect(b.counts).toEqual({ open: 2, pending: 0, inProgress: 0, blocked: 1, waitingChance: 0, other: 1, overdue: 0 })
  })

  test('tasks are oldest first, and the waiting/blocked lists are pulled out', () => {
    const { clients } = buildClientDigest(base())
    const a = clients.find((c) => c.clientAccountId === 'A')!
    expect(a.tasks.map((t) => t.id)).toEqual(['t2', 't1', 't3'])
    expect(a.tasks[0]).toMatchObject({ overdue: true, projectName: 'Project pA' })
    expect(a.waitingOnChance.map((t) => t.id)).toEqual(['t3'])
    expect(clients.find((c) => c.clientAccountId === 'B')!.blocked.map((t) => t.id)).toEqual(['t4'])
  })

  test('most urgent client first: waiting on Chance, then blocked', () => {
    const { clients } = buildClientDigest(base())
    expect(clients.map((c) => c.clientAccountId)).toEqual(['A', 'B', null])
  })

  test('tasks on a project with no client go to a "(no client)" bucket', () => {
    const { clients } = buildClientDigest(base())
    const none = clients.find((c) => c.clientAccountId === null)!
    expect(none.name).toBe('(no client)')
    expect(none.tasks.map((t) => t.id)).toEqual(['t6'])
  })

  test('clients with nothing open are omitted unless includeEmpty', () => {
    const out = buildClientDigest(base())
    expect(out.clients.some((c) => c.clientAccountId === 'C')).toBe(false)
    expect(out.omittedEmptyClients).toBe(1)
    const all = buildClientDigest({ ...base(), includeEmpty: true })
    const c = all.clients.find((x) => x.clientAccountId === 'C')!
    expect(c.counts.open).toBe(0)
    // Its only project is completed, so it lists none.
    expect(c.projects).toEqual([])
  })

  test('retainer keeps hours only: no amounts survive', () => {
    const { clients } = buildClientDigest(base())
    const a = clients.find((c) => c.clientAccountId === 'A')!
    expect(a.retainer).toEqual({ tier: 'growth', used: 12, cap: 20, cycleLabel: 'Nov 2026', health: 'healthy' })
    expect(JSON.stringify(clients)).not.toContain('999')
    expect(JSON.stringify(clients).toLowerCase()).not.toContain('amount')
  })

  test('drafts and projects land on their client', () => {
    const { clients } = buildClientDigest(base())
    const b = clients.find((c) => c.clientAccountId === 'B')!
    expect(b.drafts).toEqual([{ fileId: 'f1', name: 'SOW', type: 'sow', projectId: 'pB', createdAt: '2026-10-10' }])
    expect(b.projects.map((p) => p.id)).toEqual(['pB'])
    expect(b.hours).toBeNull()
  })

  test('taskLimit truncates rows but never counts', () => {
    const { clients } = buildClientDigest({ ...base(), taskLimit: 1 })
    const a = clients.find((c) => c.clientAccountId === 'A')!
    expect(a.tasks).toHaveLength(1)
    expect(a.tasksTruncated).toBe(true)
    expect(a.counts.open).toBe(3)
    expect(a.waitingOnChance).toHaveLength(1)
  })

  test('totals add up across clients', () => {
    const { totals } = buildClientDigest(base())
    expect(totals).toMatchObject({ clients: 3, open: 6, waitingChance: 1, blocked: 1, pending: 2, inProgress: 1, other: 1 })
  })
})

describe('nextMilestoneOf', () => {
  test('earliest dated incomplete milestone, then undated in list order', () => {
    expect(
      nextMilestoneOf([
        { id: 'm1', title: 'Done', date: '2026-01-01', completed: true },
        { id: 'm2', title: 'Undated', date: null },
        { id: 'm3', title: 'Later', date: '2026-12-01' },
        { id: 'm4', title: 'Sooner', date: '2026-11-15' },
      ]),
    ).toEqual({ id: 'm4', title: 'Sooner', date: '2026-11-15' })
    expect(nextMilestoneOf([{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }])?.id).toBe('a')
    expect(nextMilestoneOf([{ id: 'a', title: 'A', completed: true }])).toBeNull()
  })
})
