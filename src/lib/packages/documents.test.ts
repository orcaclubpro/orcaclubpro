import { describe, expect, test } from 'bun:test'

import { mergePackageSowData, packageToSowData, projectSowMilestones } from './documents'

const NOTES = 'Milestones:\nKickoff (Jan 5) — from notes\n\nTerms:\nNet Days: 15'

const project = {
  id: 'p1',
  milestones: [
    { id: 'm1', title: 'Design sign-off', date: '2026-12-01T08:00:00.000Z', description: 'Figma approved', completed: false },
    { id: 'm2', title: '  ', date: '2026-12-05T08:00:00.000Z' },
    { id: 'm3', title: 'Launch', date: '2027-01-10T08:00:00.000Z', completed: true },
  ],
}

const pkg = (projectRef: unknown) => ({ id: 'pkg1', name: 'Site', notes: NOTES, lineItems: [], projectRef })

describe('projectSowMilestones', () => {
  test('maps titled project milestones to SOW rows with YYYY-MM-DD dates', () => {
    expect(projectSowMilestones(pkg(project))).toEqual([
      { name: 'Design sign-off', date: '2026-12-01', notes: 'Figma approved' },
      { name: 'Launch', date: '2027-01-10', notes: '' },
    ])
  })

  test('is null for an unpopulated, missing or empty project', () => {
    expect(projectSowMilestones(pkg('p1'))).toBeNull()
    expect(projectSowMilestones(pkg(null))).toBeNull()
    expect(projectSowMilestones(pkg({ id: 'p1', milestones: [] }))).toBeNull()
  })
})

describe('packageToSowData milestones', () => {
  test('prefers the project over the notes', () => {
    expect(packageToSowData(pkg(project)).milestones.map((m) => m.name)).toEqual(['Design sign-off', 'Launch'])
  })

  test('falls back to the notes when the project has none', () => {
    const sow = packageToSowData(pkg({ id: 'p1', milestones: [] }))
    expect(sow.milestones).toEqual([{ name: 'Kickoff', date: 'Jan 5', notes: 'from notes' }])
    expect(sow.netDays).toBe('15')
  })
})

describe('mergePackageSowData milestones', () => {
  const saved = { milestones: [{ name: 'Old saved row', date: '2026-01-01', notes: '' }], projectOverview: 'Saved prose' }

  test('project milestones win over a saved document when pkg is passed', () => {
    const p = pkg(project)
    const merged = mergePackageSowData(packageToSowData(p), saved, p)
    expect(merged.milestones.map((m) => m.name)).toEqual(['Design sign-off', 'Launch'])
    expect(merged.projectOverview).toBe('Saved prose')
  })

  test('saved milestones stay when the project has none, or pkg is omitted', () => {
    const p = pkg({ id: 'p1', milestones: [] })
    expect(mergePackageSowData(packageToSowData(p), saved, p).milestones[0].name).toBe('Old saved row')
    const q = pkg(project)
    expect(mergePackageSowData(packageToSowData(q), saved).milestones[0].name).toBe('Old saved row')
  })
})
