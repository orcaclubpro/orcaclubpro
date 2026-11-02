import { describe, expect, test } from 'bun:test'

import { BOT_ACTORS, isValidActor } from './actor'
import { checkWriteInput, findMoneyKeys, isWriteTool, prepareSowSave, WRITE_TOOL_FIELDS } from './writeGuard'

const ACTOR = 'vegapunk'

describe('mcp write guard: price/Stripe writes are rejected', () => {
  test('rejects price/Stripe writes on every MCP write tool', () => {
    const probes: Record<string, unknown>[] = [
      { price: 100 },
      { stripePriceId: 'price_123' },
      { stripeCustomerId: 'cus_123' },
      { paymentLink: 'https://buy.stripe.com/x' },
      { stripe_customer: 'cus_123' },
      { monthlyFee: 1000 },
      { amount: 5 },
      { hourlyRate: 150 },
      { adjustedPrice: 10 },
      { paymentConfigId: 'pmc_1' },
    ]
    for (const tool of Object.keys(WRITE_TOOL_FIELDS)) {
      for (const probe of probes) {
        const res = checkWriteInput(tool, { actor: ACTOR, ...probe })
        expect(res.ok).toBe(false)
      }
    }
  })

  test('rejects a price nested inside create_package line items', () => {
    const res = checkWriteInput('create_package', {
      actor: ACTOR,
      name: 'Pkg',
      lineItems: [{ name: 'Site', price: 3000 }],
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toContain('lineItems[0].price')
  })

  test('rejects a Stripe id nested inside line items', () => {
    const res = checkWriteInput('create_package', {
      actor: ACTOR,
      name: 'Pkg',
      lineItems: [{ name: 'Site', stripePriceId: 'price_1' }],
    })
    expect(res.ok).toBe(false)
  })

  test('accepts a create_package with no money fields', () => {
    expect(
      checkWriteInput('create_package', {
        actor: ACTOR,
        name: 'Pkg',
        notes: 'internal',
        lineItems: [{ name: 'Site', quantity: 1, isRecurring: true, recurringInterval: 'month' }],
      }).ok,
    ).toBe(true)
  })

  test('rejects fields outside the per-tool allowlist', () => {
    const res = checkWriteInput('create_milestone', { actor: ACTOR, projectId: 'p', title: 't', date: 'd', client: 'x' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toContain('client')
  })

  test('rejects unknown tools', () => {
    expect(checkWriteInput('create_order', { actor: ACTOR }).ok).toBe(false)
    expect(isWriteTool('list_clients')).toBe(false)
  })

  test('log_work hours are work, not price', () => {
    expect(
      checkWriteInput('log_work', {
        actor: ACTOR,
        retainerId: 'r',
        clientAccountId: 'c',
        date: '2026-11-01',
        hours: 2,
        description: 'Fixed nav',
      }).ok,
    ).toBe(true)
  })

  test('recap narrative passes the money scan', () => {
    expect(
      checkWriteInput('save_recap_draft', {
        actor: ACTOR,
        clientAccountId: 'c',
        recap: {
          headline: 'Good month',
          siteHealth: { label: 'Healthy', note: 'ok' },
          openRequests: { count: 2, note: 'two' },
          buckets: [{ label: 'Work', note: 'n' }],
          recommendations: [{ title: 't', note: 'n' }],
        },
      }).ok,
    ).toBe(true)
  })

  test('findMoneyKeys reports nested paths', () => {
    expect(findMoneyKeys({ a: { b: [{ price: 1 }] } })).toEqual(['a.b[0].price'])
  })

  test('key scan matches exact money field names only, not generic total/cost/budget/rate', () => {
    expect(
      findMoneyKeys({
        total: 3,
        cost: 'low',
        budget: 'tight',
        rate: 'fast',
        totalHours: 4,
        costNote: 'n',
        priceNote: 'n',
        rateLimit: 1,
        nested: [{ total: 1, budgetNote: 'x' }],
      }),
    ).toEqual([])
    expect(findMoneyKeys({ hourlyRate: 1, stripePriceId: 'p', nested: { adjustedPrice: 2 } })).toEqual([
      'hourlyRate',
      'stripePriceId',
      'nested.adjustedPrice',
    ])
  })

  test('save_sow input: key scan runs on sowData (outside the SOW money fields)', () => {
    const bad = checkWriteInput('save_sow', {
      actor: ACTOR,
      packageId: 'p',
      sowData: { projectName: 'x', milestones: [{ name: 'm', date: 'd', notes: 'n', price: 5 }] },
    })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error).toContain('sowData.milestones[0].price')
    expect(checkWriteInput('save_sow', { actor: ACTOR, packageId: 'p', sowData: { stripePriceId: 'x' } }).ok).toBe(false)
    expect(
      checkWriteInput('save_sow', {
        actor: ACTOR,
        packageId: 'p',
        sowData: { projectName: 'x', projectItems: [{ desc: 'Build', amount: '3000' }], hourlyRate: '150' },
      }).ok,
    ).toBe(true)
  })
})

describe('mcp write guard: save_sow money diff (prepareSowSave)', () => {
  const current = {
    projectName: 'Site',
    pricingType: 'project',
    projectItems: [{ desc: 'Build', amount: '3000' }],
    retainerItems: [],
    paymentSchedule: [{ label: 'Deposit', pct: '50', note: '', amount: '1500' }],
    netDays: '15',
    hourlyRate: '150',
    revisionRate: '120',
    lateFee: '1.5',
    reactivationFee: '750',
    liabilityFloor: '2000',
    clauseOverrides: { fees: 'Custom fee wording', scope: 'Custom scope' },
    clauseDisabled: ['payment', 'hosting'],
  }

  test('allows an unchanged round-trip with edited wording', () => {
    const res = prepareSowSave(current, { ...current, projectName: 'Site v2', projectOverview: 'New words' })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.sowData.projectName).toBe('Site v2')
  })

  test('save_sow: omitted money fields keep their old values', () => {
    const res = prepareSowSave(current, { projectName: 'Site', projectOverview: 'only prose' })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    for (const f of [
      'pricingType',
      'projectItems',
      'paymentSchedule',
      'netDays',
      'hourlyRate',
      'revisionRate',
      'lateFee',
      'reactivationFee',
      'liabilityFloor',
    ] as const) {
      expect(res.sowData[f]).toEqual(current[f])
    }
    expect((res.sowData.clauseOverrides as Record<string, string>).fees).toBe('Custom fee wording')
    expect(res.sowData.clauseDisabled).toContain('payment')
  })

  test('save_sow: omitted money clause entries keep their old values while prose clauses follow the input', () => {
    const res = prepareSowSave(current, {
      ...current,
      clauseOverrides: { scope: 'New scope' },
      clauseDisabled: ['hosting'],
    })
    // Omitting `fees` from clauseOverrides / `payment` from clauseDisabled is a change → rejected.
    expect(res.ok).toBe(false)
    const omitted = prepareSowSave(current, { projectName: 'Site', clauseOverrides: { scope: 'New scope', fees: 'Custom fee wording' } })
    expect(omitted.ok).toBe(true)
    if (omitted.ok) {
      expect(omitted.sowData.clauseOverrides).toEqual({ scope: 'New scope', fees: 'Custom fee wording' })
      expect(omitted.sowData.clauseDisabled).toEqual(['payment'])
    }
  })

  test('rejects a changed line price', () => {
    const res = prepareSowSave(current, { ...current, projectItems: [{ desc: 'Build', amount: '1' }] })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toContain('projectItems')
  })

  test('rejects changed rates, fees, net days and payment schedule', () => {
    const res = prepareSowSave(current, {
      ...current,
      hourlyRate: '10',
      lateFee: '0',
      netDays: '90',
      paymentSchedule: [{ label: 'Deposit', pct: '50', note: '', amount: '1' }],
    })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      for (const f of ['hourlyRate', 'lateFee', 'netDays', 'paymentSchedule']) expect(res.error).toContain(f)
    }
  })

  test('rejects rewriting or re-enabling a money clause', () => {
    expect(prepareSowSave(current, { ...current, clauseOverrides: { fees: 'Free!', scope: 'Custom scope' } }).ok).toBe(false)
    expect(prepareSowSave(current, { ...current, clauseDisabled: ['hosting', 'liability'] }).ok).toBe(false)
  })

  test('rejects a stray money key in sowData (key scan)', () => {
    expect(prepareSowSave(current, { ...current, stripePriceId: 'price_1' }).ok).toBe(false)
    expect(prepareSowSave(current, { ...current, scopeItems: [{ title: 't', price: 9 }] }).ok).toBe(false)
  })
})

describe('mcp actor', () => {
  test('accepts every named bot', () => {
    for (const bot of BOT_ACTORS) expect(isValidActor(bot)).toBe(true)
  })
  test('accepts a ccq task id', () => expect(isValidActor('T261101-232341')).toBe(true))
  test('rejects missing, blank and unknown actors', () => {
    for (const bad of [undefined, null, '', 'chance', 'Vegapunk', 'T2611-1', 42]) expect(isValidActor(bad)).toBe(false)
  })
})
