// src/lib/packages/workLines.test.ts
import { expect, test, describe } from 'bun:test'
import { buildWorkLines, WORK_CATEGORY_LABEL } from './workLines'

describe('buildWorkLines', () => {
  test('formats a titled line with hours, category, and source', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: 'Rebuilt inventory sync', hours: 3, category: 'work' },
    ])
    expect(lines).toEqual([
      { entryId: 'a', title: 'May 2 — Rebuilt inventory sync', description: '3h · Work · milestone log' },
    ])
  })

  test('omits hours from the description when absent or zero', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: 'Design review', category: 'design' },
      { id: 'b', date: '2026-05-03T00:00:00.000Z', description: 'Standup', hours: 0, category: 'meeting' },
    ])
    expect(lines[0].description).toBe('Design · milestone log')
    expect(lines[1].description).toBe('Meetings · milestone log')
  })

  test('falls back to the category label when the description is blank', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: '   ', hours: 1.5, category: 'revision' },
    ])
    expect(lines[0].title).toBe('May 2 — Revisions')
  })

  test('defaults a missing category to work', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: 'Thing', hours: 1 },
    ])
    expect(lines[0].description).toBe('1h · Work · milestone log')
  })

  test('sorts entries oldest first regardless of input order', () => {
    const lines = buildWorkLines([
      { id: 'b', date: '2026-05-09T00:00:00.000Z', description: 'Later', category: 'work' },
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: 'Earlier', category: 'work' },
    ])
    expect(lines.map((l) => l.entryId)).toEqual(['a', 'b'])
  })

  test('formats dates in UTC so a day-only date never slips a day', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-01-01T00:00:00.000Z', description: 'New year', category: 'work' },
    ])
    expect(lines[0].title).toBe('Jan 1 — New year')
  })

  test('trims fractional hours to at most two decimals', () => {
    const lines = buildWorkLines([
      { id: 'a', date: '2026-05-02T00:00:00.000Z', description: 'Thing', hours: 1.256, category: 'work' },
    ])
    expect(lines[0].description).toBe('1.26h · Work · milestone log')
  })

  test('returns an empty array for no entries', () => {
    expect(buildWorkLines([])).toEqual([])
  })

  test('exposes a label for every category', () => {
    expect(WORK_CATEGORY_LABEL).toEqual({
      work: 'Work',
      design: 'Design',
      revision: 'Revisions',
      meeting: 'Meetings',
    })
  })
})
