// src/lib/packages/recap.test.ts
import { expect, test, describe } from 'bun:test'
import { derivePackageRecapDefaults, mergePackageRecap, type PackageRecapDeriveInput } from './recap'

const base: PackageRecapDeriveInput = {
  clientName: 'Steinway',
  clientCompany: 'Steinway & Sons',
  packageName: 'Used Steinway Website Launch',
  paymentLabel: 'Final Payment',
  paymentAmount: 4000,
  paymentDueDate: '2026-06-01T00:00:00.000Z',
  paymentIndex: 2,
  paymentCount: 3,
  packageTotal: 10000,
  amountPaid: 6000,
  loggedEntries: [
    { date: '2026-05-02T00:00:00.000Z', description: 'Rebuilt inventory sync', hours: 3, category: 'work' },
    { date: '2026-05-04T00:00:00.000Z', description: 'Homepage polish', hours: 2, category: 'design' },
    { date: '2026-05-06T00:00:00.000Z', description: 'Copy revisions', hours: null, category: 'design' },
  ],
  plannedOpen: [
    { date: '2026-05-20T00:00:00.000Z', description: 'Launch checklist', hours: null, category: 'work' },
  ],
  remainingPayments: [
    { label: 'Balance', amount: 4000, dueDate: '2026-07-01T00:00:00.000Z' },
  ],
}

describe('derivePackageRecapDefaults', () => {
  test('derives the payment cover facts', () => {
    const r = derivePackageRecapDefaults(base)
    expect(r.clientName).toBe('Steinway')
    expect(r.packageName).toBe('Used Steinway Website Launch')
    expect(r.paymentLabel).toBe('Final Payment')
    expect(r.paymentAmount).toBe(4000)
    expect(r.paymentPosition).toBe('Payment 2 of 3')
    expect(r.amountPaid).toBe(6000)
    expect(r.amountRemaining).toBe(4000)
  })

  test('buckets logged entries by category and sums hours', () => {
    const r = derivePackageRecapDefaults(base)
    expect(r.buckets.map((b) => b.label)).toEqual(['Work', 'Design'])
    expect(r.buckets[0].hours).toBe(3)
    expect(r.buckets[1].hours).toBe(2)
    expect(r.buckets[1].items).toHaveLength(2)
    expect(r.itemsShipped).toBe(3)
    expect(r.totalHours).toBe(5)
  })

  test('drops empty categories from the buckets', () => {
    const r = derivePackageRecapDefaults(base)
    expect(r.buckets.some((b) => b.label === 'Revisions')).toBe(false)
    expect(r.buckets.some((b) => b.label === 'Meetings')).toBe(false)
  })

  test('builds "what is left" from open plans then remaining payments', () => {
    const r = derivePackageRecapDefaults(base)
    expect(r.remaining).toEqual([
      { kind: 'planned', label: 'Launch checklist', amount: null, dueDate: '2026-05-20T00:00:00.000Z' },
      { kind: 'payment', label: 'Balance', amount: 4000, dueDate: '2026-07-01T00:00:00.000Z' },
    ])
  })

  test('seeds a headline and leaves narrative fields blank', () => {
    const r = derivePackageRecapDefaults(base)
    expect(r.headline).toBe('3 items delivered, 5 hours logged')
    expect(r.accomplishedHeadline).toBe('')
    expect(r.remainingHeadline).toBe('')
    expect(r.notes).toEqual([''])
    expect(r.nextSteps).toEqual([''])
  })

  test('handles a package with no logged work', () => {
    const r = derivePackageRecapDefaults({ ...base, loggedEntries: [] })
    expect(r.buckets).toEqual([])
    expect(r.itemsShipped).toBe(0)
    expect(r.totalHours).toBe(0)
    expect(r.headline).toBe('0 items delivered, 0 hours logged')
  })

  test('singularizes a one-item headline', () => {
    const r = derivePackageRecapDefaults({ ...base, loggedEntries: [base.loggedEntries[0]] })
    expect(r.headline).toBe('1 item delivered, 3 hours logged')
  })
})

describe('mergePackageRecap', () => {
  test('takes narrative text from the client', () => {
    const server = derivePackageRecapDefaults(base)
    const merged = mergePackageRecap(server, {
      headline: 'A great month',
      accomplishedHeadline: 'Shipped the store',
      notes: ['Client approved the design'],
      nextSteps: ['Launch'],
    })
    expect(merged.headline).toBe('A great month')
    expect(merged.accomplishedHeadline).toBe('Shipped the store')
    expect(merged.notes).toEqual(['Client approved the design'])
    expect(merged.nextSteps).toEqual(['Launch'])
  })

  test('never lets the client change amounts or counts', () => {
    const server = derivePackageRecapDefaults(base)
    const merged = mergePackageRecap(server, {
      paymentAmount: 999999,
      amountPaid: 0,
      amountRemaining: 0,
      itemsShipped: 100,
      totalHours: 100,
      packageTotal: 1,
    } as any)
    expect(merged.paymentAmount).toBe(4000)
    expect(merged.amountPaid).toBe(6000)
    expect(merged.amountRemaining).toBe(4000)
    expect(merged.itemsShipped).toBe(3)
    expect(merged.totalHours).toBe(5)
    expect(merged.packageTotal).toBe(10000)
  })

  test('zips bucket notes by index, keeping server hours and items', () => {
    const server = derivePackageRecapDefaults(base)
    const merged = mergePackageRecap(server, {
      buckets: [
        { label: 'Engineering', hours: 999, note: 'Sync rebuilt end to end', items: [] },
        { label: '', hours: 999, note: 'Visual pass', items: [] },
      ] as any,
    })
    expect(merged.buckets[0].label).toBe('Engineering')
    expect(merged.buckets[0].note).toBe('Sync rebuilt end to end')
    expect(merged.buckets[0].hours).toBe(3)
    expect(merged.buckets[0].items).toEqual(server.buckets[0].items)
    // Blank label falls back to the server label.
    expect(merged.buckets[1].label).toBe('Design')
  })

  test('cannot add buckets the server did not derive', () => {
    const server = derivePackageRecapDefaults(base)
    const merged = mergePackageRecap(server, {
      buckets: [
        { label: 'A', hours: 1, note: '', items: [] },
        { label: 'B', hours: 1, note: '', items: [] },
        { label: 'Fabricated', hours: 50, note: '', items: [] },
      ] as any,
    })
    expect(merged.buckets).toHaveLength(2)
  })

  test('cannot add or edit remaining rows', () => {
    const server = derivePackageRecapDefaults(base)
    const merged = mergePackageRecap(server, {
      remaining: [{ kind: 'payment', label: 'Free', amount: 0, dueDate: null }] as any,
    })
    expect(merged.remaining).toEqual(server.remaining)
  })

  test('null client input returns the server model unchanged', () => {
    const server = derivePackageRecapDefaults(base)
    expect(mergePackageRecap(server, null)).toEqual(server)
  })
})
