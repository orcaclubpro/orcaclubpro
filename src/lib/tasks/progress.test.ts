import { describe, expect, test } from 'bun:test'

import { computeProgress } from './progress'

describe('computeProgress', () => {
  test('empty plan is 0%, not 100%', () => {
    expect(computeProgress({ tasks: [], milestones: [] }).percent).toBe(0)
  })

  test('counts tasks and milestones equally and ignores cancelled tasks', () => {
    const p = computeProgress({
      tasks: [{ status: 'completed' }, { status: 'in-progress' }, { status: 'cancelled' }, { status: 'pending' }],
      milestones: [{ completed: true }, { completed: false }],
    })
    expect(p.tasks).toEqual({
      total: 3,
      done: 1,
      byStatus: { pending: 1, 'in-progress': 1, completed: 1, cancelled: 1 },
    })
    expect(p.milestones).toEqual({ total: 2, done: 1 })
    expect(p.percent).toBe(40) // (1 task + 1 milestone) / (3 + 2)
  })

  test('all done is 100%', () => {
    expect(
      computeProgress({ tasks: [{ status: 'completed' }], milestones: [{ completed: true }] }).percent,
    ).toBe(100)
  })

  test('unknown status counts as pending', () => {
    expect(computeProgress({ tasks: [{ status: 'weird' }], milestones: [] }).tasks.byStatus.pending).toBe(1)
  })
})
