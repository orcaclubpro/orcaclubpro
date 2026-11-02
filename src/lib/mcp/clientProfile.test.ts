import { describe, expect, test } from 'bun:test'

import type { RetainerPortfolioRow } from '@/actions/retainers'
import { billingBlock, clientBasics, profileBlock } from './clientProfile'

const row: RetainerPortfolioRow = {
  clientAccountId: 'c1',
  clientName: 'Acme',
  clientCompany: 'Acme Co',
  retainerId: 'r1',
  tier: 'growth' as RetainerPortfolioRow['tier'],
  used: 12.5,
  cap: 20,
  pct: 63,
  overageHours: 0,
  overageAmount: 999,
  remaining: 7.5,
  daysLeft: 9,
  cycleLabel: 'Nov 2026',
  deactivateOn: null,
  health: 'healthy',
  pitch: null,
  proposalSentAt: null,
}

const MONEY_KEYS = /amount|price|fee|rate|stripe|shopify|payment|balance|budget|pitch/i

describe('get_client_profile billing block', () => {
  test('carries hours and cycle state', () => {
    expect(billingBlock(row)).toEqual({
      retainerId: 'r1',
      tier: 'growth',
      health: 'healthy',
      cycleLabel: 'Nov 2026',
      usedHours: 12.5,
      capHours: 20,
      remainingHours: 7.5,
      overageHours: 0,
      pctUsed: 63,
      daysLeft: 9,
      deactivateOn: null,
    })
  })

  test('never carries a money key or value', () => {
    const out = billingBlock(row)
    expect(Object.keys(out).filter((k) => MONEY_KEYS.test(k))).toEqual([])
    expect(JSON.stringify(out)).not.toContain('999')
  })
})

describe('get_client_profile client basics', () => {
  const account = {
    id: 'c1',
    name: 'Acme',
    company: 'Acme Co',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    stripeCustomerId: 'cus_secret',
    shopifyCustomerId: 'gid://shopify/Customer/1',
    accountBalance: 1234,
    defaultPaymentConfig: 'pmc_x',
  }

  test('allowlists identity fields only', () => {
    expect(clientBasics(account)).toEqual({
      id: 'c1',
      name: 'Acme',
      company: 'Acme Co',
      contactName: 'Ada Lovelace',
      email: 'ada@example.com',
    })
  })

  test('drops Stripe, Shopify, balance and payment config', () => {
    const s = JSON.stringify(clientBasics(account))
    for (const leak of ['cus_secret', 'shopify', '1234', 'pmc_x']) expect(s).not.toContain(leak)
  })

  test('blank strings become null', () => {
    expect(clientBasics({ id: 'c2', name: ' ', firstName: '', company: null })).toEqual({
      id: 'c2',
      name: null,
      company: null,
      contactName: null,
      email: null,
    })
  })
})

describe('get_client_profile profile block', () => {
  test('null while the profile group is absent or empty', () => {
    expect(profileBlock({ id: 'c1' })).toBeNull()
    expect(profileBlock({ id: 'c1', profile: {} })).toBeNull()
    expect(profileBlock({ id: 'c1', profile: { facts: '  ' } })).toBeNull()
  })

  test('reads only the allowlisted profile keys', () => {
    const out = profileBlock({
      id: 'c1',
      profile: {
        facts: 'Shopify store, two locations',
        rules: 'No Friday deploys',
        driveFolderUrl: 'https://drive.google.com/drive/folders/abc_123',
        billingNotes: 'Net 15',
        updatedAt: '2026-11-02T00:00:00.000Z',
        updatedBy: 'gojo',
        secret: 'nope',
      },
    })
    expect(out).toEqual({
      facts: 'Shopify store, two locations',
      rules: 'No Friday deploys',
      driveFolderUrl: 'https://drive.google.com/drive/folders/abc_123',
      billingNotes: 'Net 15',
      updatedAt: '2026-11-02T00:00:00.000Z',
      updatedBy: 'gojo',
    })
    expect(JSON.stringify(out)).not.toContain('nope')
  })
})
