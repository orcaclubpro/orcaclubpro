import crypto from 'node:crypto'
import { describe, expect, test } from 'bun:test'

import {
  canonicalResource,
  isAllowedRedirect,
  redirectMatches,
  resourceMatches,
  signClientId,
  verifyClientId,
  verifyPkce,
} from './core'

describe('verifyPkce', () => {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')

  test('accepts the matching S256 verifier', () => expect(verifyPkce(verifier, challenge)).toBe(true))
  test('rejects a different verifier', () =>
    expect(verifyPkce(crypto.randomBytes(32).toString('base64url'), challenge)).toBe(false))
  test('rejects plain (verifier sent as its own challenge)', () => expect(verifyPkce(verifier, verifier)).toBe(false))
  test('rejects a too-short verifier', () => expect(verifyPkce('abc', challenge)).toBe(false))
})

describe('redirectMatches', () => {
  test('exact match', () =>
    expect(redirectMatches('https://claude.ai/api/mcp/auth_callback', 'https://claude.ai/api/mcp/auth_callback')).toBe(true))
  test('loopback ignores port', () =>
    expect(redirectMatches('http://localhost/callback', 'http://localhost:53122/callback')).toBe(true))
  test('loopback still checks path', () =>
    expect(redirectMatches('http://localhost/callback', 'http://localhost:53122/evil')).toBe(false))
  test('loopback host must match', () =>
    expect(redirectMatches('http://127.0.0.1/callback', 'http://localhost:1/callback')).toBe(false))
  test('https never ignores anything', () =>
    expect(redirectMatches('https://claude.ai/api/mcp/auth_callback', 'https://claude.ai/api/mcp/auth_callback/x')).toBe(false))
  test('https host is not loopback', () =>
    expect(redirectMatches('https://localhost/callback', 'https://localhost:9/callback')).toBe(false))
})

describe('isAllowedRedirect', () => {
  test("Claude's hosted callback", () => expect(isAllowedRedirect('https://claude.ai/api/mcp/auth_callback')).toBe(true))
  test('loopback', () => expect(isAllowedRedirect('http://127.0.0.1:6274/oauth/callback')).toBe(true))
  test('arbitrary https host is refused', () => expect(isAllowedRedirect('https://evil.example/cb')).toBe(false))
  test('lookalike host is refused', () => expect(isAllowedRedirect('https://claude.ai.evil.example/api/mcp/auth_callback')).toBe(false))
  test('non-loopback http is refused', () => expect(isAllowedRedirect('http://192.168.1.5/callback')).toBe(false))
})

describe('resource', () => {
  test('canonicalises default port, case and trailing slash', () =>
    expect(canonicalResource('HTTPS://OrcaClub.pro:443/api/mcp/')).toBe('https://orcaclub.pro/api/mcp'))
  test('absent resource is accepted', () => expect(resourceMatches(undefined)).toBe(true))
  test('own resource matches', () => expect(resourceMatches('https://orcaclub.pro/api/mcp/')).toBe(true))
  test('another resource does not', () => expect(resourceMatches('https://example.com/api/mcp')).toBe(false))
})

describe('stateless client registration', () => {
  const reg = { name: 'Claude', redirectUris: ['https://claude.ai/api/mcp/auth_callback'] }

  test('round-trips', () => expect(verifyClientId(signClientId(reg, 's1'), 's1')).toEqual(reg))
  test('fails under another secret', () => expect(verifyClientId(signClientId(reg, 's1'), 's2')).toBeNull())
  test('fails when the redirect list is tampered with', () => {
    const id = signClientId(reg, 's1')
    const forged = signClientId({ ...reg, redirectUris: ['https://evil.example/cb'] }, 'other')
    const tampered = forged.split('.')[0] + '.' + id.split('.')[1]
    expect(verifyClientId(tampered, 's1')).toBeNull()
  })
  test('ignores non-DCR ids', () => expect(verifyClientId('https://claude.ai/x', 's1')).toBeNull())
})
