import { describe, expect, test } from 'bun:test'

import { checkProjectCreateScope, MCP_PROJECT_CLIENT_ID } from './projectScope'
import { checkWriteInput } from './writeGuard'

const ACTOR = 'orca'

describe('project_create scope: internal client only', () => {
  test('the pinned client id is the Chance Noonan internal account', () => {
    expect(MCP_PROJECT_CLIENT_ID).toBe('699bce7bf14753ae5d17cf8d')
  })

  test('accepts the pinned client id (whitespace trimmed)', () => {
    expect(checkProjectCreateScope(MCP_PROJECT_CLIENT_ID)).toEqual({ ok: true, clientId: MCP_PROJECT_CLIENT_ID })
    expect(checkProjectCreateScope(` ${MCP_PROJECT_CLIENT_ID} `)).toEqual({ ok: true, clientId: MCP_PROJECT_CLIENT_ID })
  })

  test('refuses any other client account with needs-chance', () => {
    const res = checkProjectCreateScope('6990000000000000000000aa')
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.startsWith('needs-chance:')).toBe(true)
      expect(res.error).toContain('6990000000000000000000aa')
    }
  })

  test('refuses a missing, empty or non-string client account with needs-chance', () => {
    for (const v of [undefined, null, '', '   ', 42, { id: MCP_PROJECT_CLIENT_ID }, [MCP_PROJECT_CLIENT_ID]]) {
      const res = checkProjectCreateScope(v)
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error.startsWith('needs-chance:')).toBe(true)
    }
  })

  test('near-miss ids are refused (no prefix or case match)', () => {
    for (const v of [MCP_PROJECT_CLIENT_ID.toUpperCase(), `${MCP_PROJECT_CLIENT_ID}0`, MCP_PROJECT_CLIENT_ID.slice(0, -1)]) {
      expect(checkProjectCreateScope(v).ok).toBe(false)
    }
  })
})

describe('project_create write guard: no budget/currency', () => {
  const base = { actor: ACTOR, name: 'Internal tool', clientAccountId: MCP_PROJECT_CLIENT_ID }

  test('accepts the allowlisted fields', () => {
    expect(
      checkWriteInput('project_create', {
        ...base,
        description: 'x',
        startDate: '2026-11-02',
        projectedEndDate: '2026-12-01',
      }).ok,
    ).toBe(true)
  })

  test('rejects budget, currency and the stored budget field names', () => {
    for (const key of ['budget', 'currency', 'budgetAmount', 'budgetCurrency', 'status', 'assignedTo', 'client']) {
      const res = checkWriteInput('project_create', { ...base, [key]: key === 'assignedTo' ? ['u1'] : 1 })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toContain(key)
    }
  })
})
