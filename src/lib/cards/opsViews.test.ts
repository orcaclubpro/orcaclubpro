/**
 * Carbonara read-view mirror (orcaclub-ops-mcp v3 stage 1a). Pure tests: no database, no network.
 * __fixtures__/ops-views.publish.json is a real publish body from CARBONARA's fixture cards
 * (tests/test_views.py, `core.views.publish.snapshots`), so these tests prove the mirror serves Fedora's bytes.
 */
import { describe, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { canonBot, checkPublish, pickSnapshot, VIEW_NAMES } from '@/lib/cards/opsViews'

const fixture = JSON.parse(readFileSync(join(import.meta.dir, '__fixtures__/ops-views.publish.json'), 'utf8'))
const sha = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex')

describe('checkPublish', () => {
  test('accepts the real Fedora publish body', () => {
    const r = checkPublish(fixture)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.snapshots.length).toBe(fixture.snapshots.length)
  })

  test('refuses a wrong actor, unknown view, bad key, tampered text, extra keys', () => {
    const one = fixture.snapshots[0]
    expect(checkPublish({ ...fixture, actor: 'shaka' }).ok).toBe(false)
    expect(checkPublish({ actor: 'orca', snapshots: [{ ...one, view: 'task_update' }] }).ok).toBe(false)
    expect(checkPublish({ actor: 'orca', snapshots: [{ ...one, key: 'Robert"); drop' }] }).ok).toBe(false)
    expect(checkPublish({ actor: 'orca', snapshots: [{ ...one, text: one.text + ' ' }] }).ok).toBe(false)
    expect(checkPublish({ actor: 'orca', snapshots: [{ ...one, extra: 1 }] }).ok).toBe(false)
    expect(checkPublish({ actor: 'orca', snapshots: [] }).ok).toBe(false)
    expect(checkPublish(null).ok).toBe(false)
  })
})

describe('pickSnapshot returns exactly what Fedora published', () => {
  const byView = (v: string) =>
    fixture.snapshots.filter((s: { view: string }) => s.view === v).map((s: { key: string; text: string }) => ({
      key: s.key,
      text: s.text,
    }))

  test('every view, byte for byte', () => {
    for (const s of fixture.snapshots) {
      const arg = s.view === 'card_get' ? s.key.slice(0, 24) : s.key
      const r = pickSnapshot(s.view, arg, byView(s.view))
      expect(r.ok).toBe(true)
      if (r.ok) {
        expect(r.text).toBe(s.text)
        expect(sha(r.text)).toBe(s.sha256)
      }
    }
  })

  test('aliases, prefixes, misses', () => {
    const q = byView('my_queue')
    const lucy = pickSnapshot('my_queue', 'Lucy', q)
    expect(lucy.ok && JSON.parse(lucy.text).bot).toBe('shaka')
    expect(pickSnapshot('my_queue', 'marin', q).ok).toBe(true)
    expect(pickSnapshot('my_queue', 'nobody', q).ok).toBe(false)
    const cards = byView('card_get')
    const first = cards[0].key as string
    const pre = pickSnapshot('card_get', first.slice(0, 8), cards)
    expect(pre.ok && pre.text).toBe(cards[0].text)
    expect(pickSnapshot('card_get', 'zz', cards).ok).toBe(false)
    expect(pickSnapshot('waiting_on_chance', '', []).ok).toBe(false)
    expect(canonBot('Turbo Granny')).toBe('shaka')
  })

  test('no finance data in any published view', () => {
    for (const s of fixture.snapshots) {
      expect(s.text).not.toContain('"money"')
      expect(s.text).not.toContain('fin_result')
    }
  })
})

describe('the mirror has no write tool', () => {
  test('ops_* tools are registered read-only (not through guardedWrite) and only the four views exist', () => {
    const src = readFileSync(join(import.meta.dir, '../mcp/tools.ts'), 'utf8')
    const names = [...src.matchAll(/'(ops_[a-z_]+)'/g)].map((m) => m[1]).sort()
    expect(names).toEqual(['ops_card_get', 'ops_machine_busy', 'ops_my_queue', 'ops_waiting_on_chance'])
    for (const n of names) {
      const at = src.indexOf(`'${n}'`)
      const block = src.slice(at, at + 1200)
      expect(block.includes('guardedWrite')).toBe(false)
      expect(block.includes('Read-only') || block.includes('read-only')).toBe(true)
    }
    expect(VIEW_NAMES.length).toBe(4)
  })
})
