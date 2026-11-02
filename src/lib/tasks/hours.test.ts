import { describe, expect, test } from 'bun:test'

import { computeProjectHours, isQuarterHour, roundUpToQuarter } from './hours'

describe('task hours helpers', () => {
  test('quarter-hour check', () => {
    for (const ok of [0, 0.25, 0.5, 1.75, 12]) expect(isQuarterHour(ok)).toBe(true)
    for (const bad of [0.1, 1.3, Number.NaN, Number.POSITIVE_INFINITY]) expect(isQuarterHour(bad)).toBe(false)
  })

  test('rounds agent wall-clock up to the next quarter hour', () => {
    expect(roundUpToQuarter(0.01)).toBe(0.25)
    expect(roundUpToQuarter(0.25)).toBe(0.25)
    expect(roundUpToQuarter(1.26)).toBe(1.5)
    expect(roundUpToQuarter(2)).toBe(2)
  })
})

describe('computeProjectHours', () => {
  test('no approved budget: used only, remaining null', () => {
    const h = computeProjectHours({
      tasks: [
        { status: 'completed', actualHours: 1.5 },
        { status: 'in-progress', actualHours: 0.5 },
        { status: 'pending' },
      ],
    })
    expect(h).toEqual({ approved: null, used: 2, remaining: null, completedWithoutHours: 0, warnings: [] })
  })

  test('under budget: remaining, no warning', () => {
    const h = computeProjectHours({ approvedHours: 10, tasks: [{ status: 'completed', actualHours: 4 }] })
    expect(h.remaining).toBe(6)
    expect(h.warnings).toEqual([])
  })

  test('over budget warns but never blocks', () => {
    const h = computeProjectHours({
      approvedHours: 3,
      tasks: [
        { status: 'completed', actualHours: 2.5 },
        { status: 'cancelled', actualHours: 1 },
      ],
    })
    expect(h.used).toBe(3.5)
    expect(h.remaining).toBe(-0.5)
    expect(h.warnings[0]).toContain('over the approved 3')
  })

  test('counts completed tasks with no hours logged', () => {
    const h = computeProjectHours({
      tasks: [{ status: 'completed' }, { status: 'completed', actualHours: 0 }, { status: 'pending' }],
    })
    expect(h.completedWithoutHours).toBe(2)
    expect(h.warnings).toHaveLength(1)
  })

  test('ignores junk values', () => {
    const h = computeProjectHours({ approvedHours: '10', tasks: [{ status: 'completed', actualHours: 'x' }] })
    expect(h.approved).toBeNull()
    expect(h.used).toBe(0)
  })
})
