import { describe, expect, test } from 'bun:test'

import { buildClientDigest, buildRecentWork, descriptionText, latestNotesOf } from './clientDigest'
import { plainTextToLexical } from './richText'

const DESC = [
  'Extend the stop hook.',
  '',
  '[poller] started 2026-11-02 15:12 PST | ccq T1 | tmux w | machine fedora',
  'next: orca: build it',
  'decision: keep comments in the description for now',
  'result: ~/dev/orca/results/T1.md',
  'drive internal: https://drive.google.com/drive/folders/X',
  'left off 2026-11-02 15:40 PT: blocked | next: chance: approve the push | commit: abc1234 | result: -',
].join('\n')

describe('latestNotesOf', () => {
  test('newest line wins; left-off segments count; "-" is none', () => {
    expect(latestNotesOf(DESC)).toEqual({
      next: 'chance: approve the push',
      decision: 'keep comments in the description for now',
      result: '~/dev/orca/results/T1.md',
      leftOff: '2026-11-02 15:40 PT: blocked | next: chance: approve the push | commit: abc1234 | result: -',
    })
  })

  test('a later plain next: line beats an earlier left-off line', () => {
    const d = `${DESC}\nnext: orca: write the docs`
    expect(latestNotesOf(d).next).toBe('orca: write the docs')
    expect(latestNotesOf(d).leftOff).toContain('blocked')
  })

  test('empty, placeholders and prose mentioning next are ignored', () => {
    expect(latestNotesOf(null)).toEqual({ next: null, decision: null, result: null, leftOff: null })
    const d = 'Readers take the newest next: line.\nnext: <owner>: <step>\n- next: orca: real step'
    expect(latestNotesOf(d).next).toBe('orca: real step')
  })

  test('works on the Lexical description after descriptionText', () => {
    expect(latestNotesOf(descriptionText(plainTextToLexical(DESC))).next).toBe('chance: approve the push')
  })

  test('task rows carry latest', () => {
    const rw = buildRecentWork({
      tasks: [{ id: 't1', projectId: 'p', status: 'in-progress', updatedAt: '2026-11-02', description: DESC }],
      projects: [{ id: 'p', name: 'P', clientAccountId: 'A' }],
      clients: [{ id: 'A', name: 'Acme' }],
    })
    expect(rw[0]!.latest.next).toBe('chance: approve the push')
    const d = buildClientDigest({
      clients: [{ id: 'A', name: 'Acme' }],
      tasks: [{ id: 't1', projectId: 'p', status: 'in-progress', createdAt: '2026-10-01', description: DESC }],
      projects: [{ id: 'p', name: 'P', status: 'in-progress', clientAccountId: 'A', percent: 0, tasksDone: 0, tasksTotal: 1, milestonesDone: 0, milestonesTotal: 0, milestones: [] }],
      retainers: [],
      drafts: [],
      now: '2026-11-02T20:00:00.000Z',
    })
    const row = d.clients[0]!
    expect(row.tasks.find((t) => t.id === 't1')?.latest).toEqual(latestNotesOf(DESC))
  })
})
