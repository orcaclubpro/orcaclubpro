// src/lib/retainers/scopeRecap.test.ts
import { expect, test, describe } from 'bun:test'
import { deriveScopeRecapDefaults, mergeScopeRecap, type ScopeRecapDeriveInput } from './scopeRecap'

const base: ScopeRecapDeriveInput = {
  clientName: 'Dana Ruiz',
  clientCompany: 'Northbeam Coffee',
  scopeSummary: 'Shopify support & monthly reporting',
  loggedEntries: [
    { date: '2026-06-03', description: 'Theme audit', hours: 4.5, category: 'work' },
    { date: '2026-06-11', description: 'Kickoff call', hours: 1, category: 'meeting' },
    { date: '2026-07-02', description: 'Checkout copy revisions', hours: 2.25, category: 'revision' },
    { date: '2026-08-20', description: '', hours: 0.75, category: 'work' },
  ],
  plannedEntries: [
    { date: '', description: 'Monthly performance report', hours: 2, category: 'reporting' },
    { date: '', description: '', hours: 1, category: 'meeting' },
  ],
  proposedAmountLabel: '$2,400/mo',
  proposedTermsLabel: 'Growth · 20 hrs/mo included',
}

describe('deriveScopeRecapDefaults', () => {
  test('derives the cover facts from the pitch', () => {
    const r = deriveScopeRecapDefaults(base)
    expect(r.clientName).toBe('Dana Ruiz')
    expect(r.clientCompany).toBe('Northbeam Coffee')
    expect(r.scopeTitle).toBe('Shopify support & monthly reporting')
    expect(r.proposedAmountLabel).toBe('$2,400/mo')
  })

  test('falls back to a generic title when there is no scope summary', () => {
    expect(deriveScopeRecapDefaults({ ...base, scopeSummary: null }).scopeTitle).toBe('Work to date')
    expect(deriveScopeRecapDefaults({ ...base, scopeSummary: '   ' }).scopeTitle).toBe('Work to date')
  })

  test('totals delivered and planned work separately', () => {
    const r = deriveScopeRecapDefaults(base)
    expect(r.itemsDelivered).toBe(4)
    expect(r.hoursDelivered).toBe(8.5)
    expect(r.itemsPlanned).toBe(2)
    expect(r.hoursPlanned).toBe(3)
  })

  test('spans the period from the first to the last logged day, in UTC', () => {
    // Day-only dates must not slip a day west of Greenwich.
    expect(deriveScopeRecapDefaults(base).periodLabel).toBe('Jun 3, 2026 – Aug 20, 2026')
  })

  test('collapses a single-day span to one date', () => {
    const one = deriveScopeRecapDefaults({
      ...base,
      loggedEntries: [{ date: '2026-06-03', description: 'Audit', hours: 1, category: 'work' }],
    })
    expect(one.periodLabel).toBe('Jun 3, 2026')
  })

  test('reads as a plan when nothing has been delivered yet', () => {
    const r = deriveScopeRecapDefaults({ ...base, loggedEntries: [] })
    expect(r.periodLabel).toBe('Work to date')
    expect(r.buckets).toHaveLength(0)
    expect(r.headline).toBe('2 items planned, 3 hours estimated')
  })

  test('buckets delivered work by category in a stable order', () => {
    const r = deriveScopeRecapDefaults(base)
    expect(r.buckets.map((b) => b.label)).toEqual(['Work', 'Revisions', 'Meetings'])
    expect(r.buckets[0].hours).toBe(5.25)
    expect(r.buckets[0].items).toHaveLength(2)
    // Empty categories drop out rather than rendering an empty section.
    expect(r.buckets.some((b) => b.label === 'Reporting')).toBe(false)
  })

  test('labels a described-less planned item by its category', () => {
    const r = deriveScopeRecapDefaults(base)
    expect(r.remaining.map((x) => x.label)).toEqual(['Monthly performance report', 'Meetings'])
    expect(r.remaining.every((x) => x.kind === 'planned')).toBe(true)
  })

  test('starts every narrative field blank or seeded, never fabricated', () => {
    const r = deriveScopeRecapDefaults(base)
    expect(r.headline).toBe('4 items delivered, 8.5 hours logged')
    expect(r.accomplishedHeadline).toBe('')
    expect(r.remainingHeadline).toBe('')
    expect(r.buckets.every((b) => b.note === '')).toBe(true)
  })
})

describe('mergeScopeRecap', () => {
  const server = deriveScopeRecapDefaults(base)

  test('takes narrative text from the client', () => {
    const m = mergeScopeRecap(server, {
      scopeTitle: 'Q3 support',
      headline: 'Site is faster',
      accomplishedHeadline: 'What six weeks bought',
      remainingHeadline: 'From September',
      notes: ['Report on the 1st'],
      nextSteps: ['Countersign'],
    })
    expect(m.scopeTitle).toBe('Q3 support')
    expect(m.headline).toBe('Site is faster')
    expect(m.accomplishedHeadline).toBe('What six weeks bought')
    expect(m.remainingHeadline).toBe('From September')
    expect(m.notes).toEqual(['Report on the 1st'])
    expect(m.nextSteps).toEqual(['Countersign'])
  })

  test('never lets the client fabricate hours, items, or the planned list', () => {
    const m = mergeScopeRecap(server, {
      hoursDelivered: 9999,
      itemsDelivered: 9999,
      hoursPlanned: 9999,
      itemsPlanned: 9999,
      periodLabel: 'FAKE',
      proposedAmountLabel: '$1',
      proposedTermsLabel: 'FAKE',
      remaining: [{ kind: 'planned', label: 'FABRICATED', amount: null, dueDate: null }],
      buckets: [{ label: 'Engineering', note: 'Audit and fixes.', hours: 9999, items: [] }],
    })
    expect(m.hoursDelivered).toBe(8.5)
    expect(m.itemsDelivered).toBe(4)
    expect(m.hoursPlanned).toBe(3)
    expect(m.itemsPlanned).toBe(2)
    expect(m.periodLabel).toBe(server.periodLabel)
    expect(m.proposedAmountLabel).toBe('$2,400/mo')
    expect(m.proposedTermsLabel).toBe('Growth · 20 hrs/mo included')
    expect(m.remaining).toEqual(server.remaining)
    // The bucket keeps the client's label and note but the server's hours and items.
    expect(m.buckets[0].label).toBe('Engineering')
    expect(m.buckets[0].note).toBe('Audit and fixes.')
    expect(m.buckets[0].hours).toBe(5.25)
    expect(m.buckets[0].items).toHaveLength(2)
  })

  test('falls back to the server model when the client sends nothing', () => {
    expect(mergeScopeRecap(server, null)).toEqual(server)
    expect(mergeScopeRecap(server, undefined)).toEqual(server)
    expect(mergeScopeRecap(server, {})).toEqual(server)
  })

  test('ignores a blank client title rather than clearing the cover', () => {
    expect(mergeScopeRecap(server, { scopeTitle: '   ' }).scopeTitle).toBe(server.scopeTitle)
  })
})
