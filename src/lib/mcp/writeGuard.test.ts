import { describe, expect, test } from 'bun:test'

import { BOT_ACTORS, isValidActor } from './actor'
import { checkWriteInput, findMoneyKeys, isWriteTool, sowMoneyChanges, WRITE_TOOL_FIELDS } from './writeGuard'

const ACTOR = 'vegapunk'

describe('mcp write guard: price/Stripe writes are rejected', () => {
  test('rejects price/Stripe writes on every MCP write tool', () => {
    const probes: Record<string, unknown>[] = [
      { price: 100 },
      { stripePriceId: 'price_123' },
      { stripeCustomerId: 'cus_123' },
      { paymentLink: 'https://buy.stripe.com/x' },
      { payment_link: 'https://buy.stripe.com/x' },
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
    expect(findMoneyKeys({ a: { b: [{ unitPrice: 1 }] } })).toEqual(['a.b[0].unitPrice'])
  })
})

describe('mcp write guard: save_sow money diff', () => {
  const current = {
    projectName: 'Site',
    pricingType: 'project',
    projectItems: [{ description: 'Build', price: '3000' }],
    retainerItems: [],
    paymentSchedule: [{ label: 'Deposit', amount: '1500' }],
    hourlyRate: '150',
    revisionRate: '120',
    lateFee: '1.5',
  }

  test('allows an unchanged round-trip with edited wording', () => {
    expect(sowMoneyChanges(current, { ...current, projectName: 'Site v2', projectOverview: 'New words' })).toEqual([])
  })

  test('allows money fields to be omitted (package re-derives them)', () => {
    expect(sowMoneyChanges(current, { projectName: 'Site' })).toEqual([])
  })

  test('rejects a changed line price', () => {
    expect(
      sowMoneyChanges(current, { ...current, projectItems: [{ description: 'Build', price: '1' }] }),
    ).toEqual(['projectItems'])
  })

  test('rejects changed rates, fees and payment schedule', () => {
    const changed = sowMoneyChanges(current, {
      ...current,
      hourlyRate: '10',
      lateFee: '0',
      paymentSchedule: [{ label: 'Deposit', amount: '1' }],
    })
    expect(changed).toEqual(expect.arrayContaining(['hourlyRate', 'lateFee', 'paymentSchedule']))
  })

  test('rejects a stray Stripe key added to sowData', () => {
    expect(sowMoneyChanges(current, { ...current, stripePriceId: 'price_1' })).toEqual(['stripePriceId'])
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
