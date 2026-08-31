// src/lib/packages/workLines.test.ts
import { expect, test, describe } from 'bun:test'
import { buildWorkLines, WORK_CATEGORY_LABEL, formatWorkLog, groupWorkLogByMonth } from './workLines'

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

describe('formatWorkLog', () => {
  test('one month renders as bare dated lines — the line item is its own heading', () => {
    expect(
      formatWorkLog([
        { date: '2026-08-04T12:00:00.000Z', description: 'Discovery call', hours: 2.5, category: 'Meetings' },
        { date: '2026-08-11T12:00:00.000Z', description: 'Wireframes', hours: 3 },
      ]),
    ).toBe('Aug 4 · 2.5h · Discovery call\nAug 11 · 3h · Wireframes')
  })

  test('sorts oldest first regardless of input order', () => {
    expect(
      formatWorkLog([
        { date: '2026-08-11T12:00:00.000Z', description: 'Second', hours: 1 },
        { date: '2026-08-04T12:00:00.000Z', description: 'First', hours: 1 },
      ]),
    ).toBe('Aug 4 · 1h · First\nAug 11 · 1h · Second')
  })

  test('spanning months adds a heading with that month\u2019s hours', () => {
    expect(
      formatWorkLog([
        { date: '2026-07-04T12:00:00.000Z', description: 'Discovery call', hours: 2.5 },
        { date: '2026-07-11T12:00:00.000Z', description: 'Wireframes', hours: 3 },
        { date: '2026-08-02T12:00:00.000Z', description: 'Revisions', hours: 1.5 },
      ]),
    ).toBe(
      'July 2026 — 5.5h\nJul 4 · 2.5h · Discovery call\nJul 11 · 3h · Wireframes\n\n' +
        'August 2026 — 1.5h\nAug 2 · 1.5h · Revisions',
    )
  })

  test('falls back to the category label, then to Work, so a line is never blank', () => {
    expect(formatWorkLog([{ date: '2026-08-04T12:00:00.000Z', hours: 1, category: 'Revisions' }])).toBe(
      'Aug 4 · 1h · Revisions',
    )
    expect(formatWorkLog([{ date: '2026-08-04T12:00:00.000Z', description: '   ', hours: 1 }])).toBe('Aug 4 · 1h · Work')
  })

  test('drops the hours segment when there are none', () => {
    expect(formatWorkLog([{ date: '2026-08-04T12:00:00.000Z', description: 'Kickoff', hours: 0 }])).toBe(
      'Aug 4 · Kickoff',
    )
  })

  test('empty in, empty out — callers use it as the include test', () => {
    expect(formatWorkLog([])).toBe('')
    expect(groupWorkLogByMonth([])).toEqual([])
  })

  test('a date near a month boundary buckets by its UTC month, not local', () => {
    const groups = groupWorkLogByMonth([{ date: '2026-08-01T00:00:00.000Z', description: 'Kickoff', hours: 1 }])
    expect(groups).toHaveLength(1)
    expect(groups[0].label).toBe('August 2026')
  })
})
