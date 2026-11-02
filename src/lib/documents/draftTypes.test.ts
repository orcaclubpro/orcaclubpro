import { describe, expect, test } from 'bun:test'

import { checkDraftInput, DRAFT_SOURCE, DRAFT_TYPES } from './draftTypes'
import { isWriteTool } from '@/lib/mcp/writeGuard'

describe('checkDraftInput', () => {
  test('each type needs its own source id', () => {
    for (const type of DRAFT_TYPES) {
      expect(checkDraftInput({ type }).ok).toBe(false)
      const res = checkDraftInput({ type, [DRAFT_SOURCE[type]]: ' x1 ', entryId: 'e1' })
      expect(res).toEqual({ ok: true, id: 'x1' })
    }
  })

  test('a different id does not satisfy the type', () => {
    expect(checkDraftInput({ type: 'recap', packageId: 'p1' }).ok).toBe(false)
    expect(checkDraftInput({ type: 'sow', clientAccountId: 'c1' }).ok).toBe(false)
  })

  test('package-recap needs entryId', () => {
    expect(checkDraftInput({ type: 'package-recap', packageId: 'p1' }).ok).toBe(false)
  })

  test('unknown type is refused', () => {
    expect(checkDraftInput({ type: 'invoice' as never, packageId: 'p1' }).ok).toBe(false)
  })

  test('get_draft_pdf is a read tool, never a write', () => {
    expect(isWriteTool('get_draft_pdf')).toBe(false)
  })
})
