import { describe, expect, test } from 'bun:test'

import {
  buildClientDigest,
  buildRecentWork,
  driveFolderOf,
  isQaPostLink,
  labeledLine,
  resultOf,
  waitingReasonOf,
} from './clientDigest'

const QA_POST = 'https://discord.com/channels/111/222/333'
const NOW = '2026-11-02T20:00:00.000Z'

describe('waitingOnChance fallback: QA PASS + #qa post', () => {
  test('isQaPostLink accepts Discord message links only', () => {
    expect(isQaPostLink(QA_POST)).toBe(true)
    expect(isQaPostLink('https://discordapp.com/channels/1/2/3')).toBe(true)
    expect(isQaPostLink('https://discord.com/channels/1/2')).toBe(false)
    expect(isQaPostLink('https://drive.google.com/drive/folders/abc')).toBe(false)
    expect(isQaPostLink(null)).toBe(false)
  })

  test('waitingReasonOf', () => {
    expect(waitingReasonOf({ status: 'waiting-chance' })).toBe('status')
    expect(waitingReasonOf({ status: 'in-progress', qa: { status: 'pass', reportLink: QA_POST } })).toBe('qa-pass')
    expect(waitingReasonOf({ status: 'in-progress', qa: { status: 'pass', reportLink: 'https://drive.google.com/x' } })).toBe(null)
    expect(waitingReasonOf({ status: 'in-progress', qa: { status: 'fail', reportLink: QA_POST } })).toBe(null)
    expect(waitingReasonOf({ status: 'completed', qa: { status: 'pass', reportLink: QA_POST } })).toBe(null)
  })

  test('QA-pass open tasks land in waitingOnChance and the counts', () => {
    const d = buildClientDigest({
      clients: [{ id: 'A', name: 'Acme' }],
      tasks: [
        { id: 't1', projectId: 'pA', status: 'in-progress', createdAt: '2026-10-01', qa: { status: 'pass', commit: 'abc1234', reportLink: QA_POST } },
        { id: 't2', projectId: 'pA', status: 'pending', createdAt: '2026-10-02', qa: { status: 'pass', reportLink: 'https://drive.google.com/x' } },
        { id: 't3', projectId: 'pA', status: 'waiting-chance', createdAt: '2026-10-03' },
      ],
      projects: [{ id: 'pA', name: 'Site', status: 'in-progress', clientAccountId: 'A', percent: 0, tasksDone: 0, tasksTotal: 3, milestonesDone: 0, milestonesTotal: 0, milestones: [] }],
      retainers: [],
      drafts: [],
      now: NOW,
    })
    const a = d.clients[0]!
    expect(a.waitingOnChance.map((t) => [t.id, t.waitingReason])).toEqual([
      ['t1', 'qa-pass'],
      ['t3', 'status'],
    ])
    expect(a.waitingOnChance[0]!.qa).toEqual({ status: 'pass', commit: 'abc1234', reportLink: QA_POST })
    expect(a.counts).toMatchObject({ open: 3, waitingChance: 2, inProgress: 0, pending: 1 })
    expect(d.totals.waitingChance).toBe(2)
  })
})

describe('recentWork', () => {
  const bc = {
    notes: 'Shipped the hero rework.\nResult: hero + nav live on preview\nDrive: Team/QA/vp/hero\n- Key file: `src/app/(frontend)/page.tsx`',
    brief: 'Rework the hero',
    liveUrl: 'https://preview.example.com',
    repo: 'orcaclubpro',
    branch: 'vp/hero',
  }

  test('labeledLine / resultOf / driveFolderOf', () => {
    expect(labeledLine(bc, ['key file', 'file'])).toBe('src/app/(frontend)/page.tsx')
    expect(resultOf(bc)).toBe('hero + nav live on preview')
    expect(resultOf({ notes: '\n  First line here\nsecond' })).toBe('First line here')
    expect(resultOf({ brief: 'Only a brief' })).toBe('Only a brief')
    expect(resultOf(null)).toBe(null)
    expect(driveFolderOf(bc)).toBe('Team/QA/vp/hero')
    expect(driveFolderOf({ notes: 'see https://drive.google.com/drive/folders/1AbC-d_9 for QA' })).toBe(
      'https://drive.google.com/drive/folders/1AbC-d_9',
    )
    expect(resultOf({ notes: 'x'.repeat(500) })!.length).toBe(200)
  })

  test('newest first, capped, joins project + client, falls back to project liveUrl', () => {
    const tasks = Array.from({ length: 25 }, (_, i) => ({
      id: `t${String(i).padStart(2, '0')}`,
      title: `T${i}`,
      status: i % 2 ? 'completed' : 'in-progress',
      projectId: i === 24 ? null : 'pA',
      updatedAt: `2026-10-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    }))
    tasks[23] = { ...tasks[23]!, qa: { status: 'pass', commit: 'deadbee', reportLink: QA_POST }, botContext: bc } as never
    const rows = buildRecentWork({
      tasks,
      projects: [{ id: 'pA', name: 'Site', clientAccountId: 'A', liveUrl: 'https://acme.example.com' }],
      clients: [{ id: 'A', name: 'Acme' }],
    })
    expect(rows).toHaveLength(20)
    expect(rows[0]!.id).toBe('t24')
    expect(rows[0]!.project).toBe(null)
    expect(rows[0]!.client).toBe(null)
    const r = rows[1]!
    expect(r).toMatchObject({
      id: 't23',
      status: 'completed',
      project: { id: 'pA', name: 'Site' },
      client: { id: 'A', name: 'Acme' },
      result: 'hero + nav live on preview',
      commit: 'deadbee',
      liveUrl: 'https://preview.example.com',
      recapOrQaLink: QA_POST,
      qaStatus: 'pass',
      driveFolder: 'Team/QA/vp/hero',
      keyFile: 'src/app/(frontend)/page.tsx',
      repo: 'orcaclubpro',
      branch: 'vp/hero',
    })
    expect(rows[2]!.liveUrl).toBe('https://acme.example.com')
    expect(rows[2]!.commit).toBe(null)
    expect(rows.at(-1)!.id).toBe('t05')
  })
})
