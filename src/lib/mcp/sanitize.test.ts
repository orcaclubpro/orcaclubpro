import { describe, expect, test } from 'bun:test'
import { sanitizeToolOutput } from './sanitize'

// Fake values only: never a real key.
const FAKE_USER = {
  id: 'u1',
  name: 'Staff Person',
  email: 'staff@test.local',
  role: 'admin',
  username: 'staff',
  enableAPIKey: true,
  apiKey: 'fake-api-key-value',
  apiKeyIndex: 'fake-index',
  sessions: [{ id: 's1', expiresAt: '2030-01-01' }],
  passkeyCredentials: [{ credentialId: 'c1', publicKey: 'pk' }],
  hash: 'h',
  salt: 's',
  loginTwoFactorCode: '123456',
  twoFactorCode: '654321',
  resetPasswordToken: 'rt',
}

const SECRET = /apiKey|apiKeyIndex|sessions|passkey|loginTwoFactor|twoFactorCode|resetPassword|"hash"|"salt"|fake-api-key-value/

describe('sanitizeToolOutput', () => {
  test('log_work shape: loggedBy and retainer.clientAccount.assignedTo collapse to {id, name}', () => {
    const entry = {
      id: 'e1',
      hours: 2,
      loggedBy: FAKE_USER,
      retainer: { id: 'r1', clientAccount: { id: 'ca1', name: 'Client Co', assignedTo: [FAKE_USER, { ...FAKE_USER, id: 'u2', name: undefined }] } },
    }
    const out = sanitizeToolOutput({ success: true, id: 'e1', entry }) as any
    expect(out.entry.loggedBy).toEqual({ id: 'u1', name: 'Staff Person' })
    expect(out.entry.retainer.clientAccount.assignedTo).toEqual([
      { id: 'u1', name: 'Staff Person' },
      { id: 'u2', name: 'staff' },
    ])
    expect(out.entry.retainer.clientAccount.name).toBe('Client Co')
    expect(JSON.stringify(out)).not.toMatch(SECRET)
  })

  test('any object holding a secret key is treated as a user and collapsed', () => {
    const out = sanitizeToolOutput({ a: { nested: [{ id: 'n1', apiKey: 'x', sessions: [], keep: 1 }] } }) as any
    expect(out.a.nested[0]).toEqual({ id: 'n1', name: null })
    expect(JSON.stringify(out)).not.toContain('apiKey')
  })

  test('a user detected by collection or email+role collapses even without secrets', () => {
    expect(sanitizeToolOutput({ u: { id: 'x', email: 'a@b.c', role: 'user', name: 'A' } })).toEqual({ u: { id: 'x', name: 'A' } })
    expect(sanitizeToolOutput({ u: { id: 'y', collection: 'users', username: 'b' } })).toEqual({ u: { id: 'y', name: 'b' } })
  })

  test('leaves ordinary data, ids and primitives alone', () => {
    const v = { success: true, rows: [{ id: '1', name: 'Pkg', email: 'billing@client.test', price: 10 }], n: null, s: 'x' }
    expect(sanitizeToolOutput(v)).toEqual(v)
  })
})
