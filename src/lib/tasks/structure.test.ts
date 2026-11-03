import { describe, expect, test } from 'bun:test'

import {
  buildAddItems,
  buildItem,
  closeGateMissing,
  describeEdit,
  fromTemplate,
  intakeMissing,
  listCount,
  nowBlock,
  ownerSlice,
  parseItemLine,
  patchUpdate,
  renderItem,
  reorderRows,
  screenPathError,
  structureProgress,
  summaryLine,
  templateSections,
} from './structure'

const SHOT = '/home/chank/dev/orca/qa/ccrecap-shots/1c5eb5e1a621/after-desktop-home.jpg'
const NOW = new Date('2026-11-03T20:00:00Z')

describe('intake (Ask + >=1 deliverable + >=1 checklist item, no max)', () => {
  test('an empty task is refused with every missing part', () => {
    expect(intakeMissing({ title: 'Do a thing' })).toEqual(['Ask', 'Deliverables', 'Checklist'])
  })

  test('structured fields pass', () => {
    expect(intakeMissing({ title: 'x', ask: 'a', deliverables: [{}], checklist: [{}] })).toEqual([])
  })

  test('a 20-item checklist is accepted (no upper cap, no split rule)', () => {
    const checklist = Array.from({ length: 20 }, (_, i) => ({ text: `item ${i}` }))
    expect(intakeMissing({ title: 'x', ask: 'a', deliverables: [{ text: 'd' }], checklist })).toEqual([])
    const desc = 'Ask: a\nDeliverables: d\nChecklist:\n' + checklist.map((c) => `- [ ] ${c.text}`).join('\n')
    expect(intakeMissing({ title: 'x', description: desc })).toEqual([])
    expect(fromTemplate(desc).checklist).toHaveLength(20)
  })

  test('the text template passes, matching the poller cases', () => {
    expect(intakeMissing({ title: 'x', description: 'Ask: a\nDeliverables: d\nChecklist:\n- c1' })).toEqual([])
    expect(intakeMissing({ title: 'x', description: 'Ask: a\nDeliverables: d\nChecklist: check it builds' })).toEqual([])
    expect(intakeMissing({ title: 'x', description: 'Deliverables: x\nChecklist:\n- a' })).toEqual(['Ask'])
    expect(intakeMissing({ title: 'x', description: 'Ask: a\nDeliverables: x\nnext: y' })).toEqual(['Checklist'])
    expect(intakeMissing({ title: 'x', description: 'Ask: a\nChecklist:\n- a' })).toEqual(['Deliverables'])
    expect(intakeMissing({ title: 'x', description: 'Ask: a\nDeliverables: d\nChecklist:\nnext [dev]: orca: go' })).toEqual([
      'Checklist',
    ])
  })

  test('read-only work is exempt, as in the poller', () => {
    expect(intakeMissing({ title: 'Read-only review of the PR' })).toEqual([])
    expect(intakeMissing({ title: 'x', description: 'Diagnose the 500, no approval needed' })).toEqual([])
  })

  test('listCount: one item per line when there is no list', () => {
    expect(listCount('- a\n- b\nnote')).toBe(2)
    expect(listCount('just words')).toBe(1)
  })
})

describe('text format "- [ ] [dev] item — proof: ..." parses both ways', () => {
  test('parse: box, owner tag, proof, dropped, added by; untagged = dev', () => {
    expect(parseItemLine('- [ ] [dev] Additive Payload fields — proof: diff + task_get')).toMatchObject({
      text: 'Additive Payload fields',
      status: 'open',
      owner: 'dev',
      proof: 'diff + task_get',
    })
    expect(parseItemLine('- [x] [cm] client email drafted — proof: Drive/x.pdf')).toMatchObject({
      status: 'done',
      owner: 'cm',
      proof: 'Drive/x.pdf',
    })
    expect(parseItemLine('- [ ] plain item')).toMatchObject({ text: 'plain item', owner: 'dev', status: 'open' })
    expect(parseItemLine('- [~] [fin] money check — dropped: no prices touched')).toMatchObject({
      status: 'dropped',
      owner: 'fin',
      dropReason: 'no prices touched',
    })
    expect(parseItemLine('- [ ] [dev] extra test — added by gojo: edge case — proof: t.ts')).toMatchObject({
      text: 'extra test',
      addedBy: 'gojo',
      proof: 't.ts',
    })
    expect(parseItemLine('- [x] smoke. Proof: shot')).toMatchObject({ text: 'smoke.', status: 'done', proof: 'shot' })
  })

  test('render → parse round-trips every status', () => {
    const items = [
      { text: 'a', status: 'open', owner: 'dev' },
      { text: 'b', status: 'done', owner: 'cm', proof: 'sha 1234' },
      { text: 'c', status: 'dropped', owner: 'fin', dropReason: 'out of scope' },
      { text: 'd', status: 'open', owner: 'shaka', addedBy: 'gojo' },
    ] as const
    for (const it of items) {
      const line = renderItem(it as any)
      const back = parseItemLine(line)
      expect(back).toMatchObject({ text: it.text, status: it.status, owner: it.owner })
      if ('proof' in it) expect(back.proof).toBe(it.proof)
      if ('dropReason' in it) expect(back.dropReason).toBe(it.dropReason)
      if ('addedBy' in it) expect(back.addedBy).toBe(it.addedBy)
    }
    expect(renderItem({ text: 'b', status: 'done', owner: 'cm', proof: 'x' })).toBe('- [x] [cm] b — proof: x')
  })

  test('fromTemplate keeps owner tags and statuses', () => {
    const desc = [
      'Ask: fix it',
      'Deliverables: (1) the fix; (2) a #qa post',
      'Checklist:',
      '- [ ] [dev] builds',
      '- [x] [cm] email — proof: drive',
      '- [~] [fin] check — dropped: no money',
      'Changes:',
      '- 9:54 AM: deliverables as a list.',
      'next [dev]: orca: go',
    ].join('\n')
    const t = fromTemplate(desc)
    expect(t.ask).toBe('fix it')
    expect(t.deliverables.map((d) => d.text)).toEqual(['the fix', 'a #qa post'])
    expect(t.checklist.map((c) => [c.text, c.status, c.owner])).toEqual([
      ['builds', 'open', 'dev'],
      ['email', 'done', 'cm'],
      ['check', 'dropped', 'fin'],
    ])
    expect(t.changes).toEqual([{ words: '9:54 AM: deliverables as a list.', source: 'description' }])
    expect(templateSections(desc).Checklist).not.toContain('next')
  })
})

describe('rows', () => {
  test('items: status, owner (default dev), addedBy, ObjectId-shaped ids', () => {
    const r = buildAddItems(
      {
        deliverables: [{ text: 'd', link: 'https://x' }],
        checklist: [{ text: 'c', owner: 'CM' }, { text: 'f', owner: '[fin]', done: true }],
        askUpdates: [{ words: 'also do y', source: 'Chance 11:51' }],
        changes: [{ words: 'w', source: 's' }],
        screens: [{ path: SHOT }],
      },
      'gojo',
      NOW,
    )
    expect(r.deliverables[0]).toMatchObject({ text: 'd', status: 'open', owner: 'dev', addedBy: 'gojo', link: 'https://x' })
    expect(r.checklist.map((c) => [c.owner, c.status])).toEqual([
      ['cm', 'open'],
      ['fin', 'done'],
    ])
    expect(r.askUpdates[0]).toMatchObject({ words: 'also do y', source: 'Chance 11:51', at: NOW })
    expect(r.changes[0]).toMatchObject({ by: 'gojo' })
    for (const row of [...r.deliverables, ...r.checklist, ...r.changes, ...r.screens]) expect(row.id).toMatch(/^[a-f0-9]{24}$/)
  })

  test('a dropped item needs a reason; bad owners and statuses are refused', () => {
    expect(() => buildItem('checklist', { text: 'x', status: 'dropped' }, 'orca')).toThrow('dropReason')
    expect(buildItem('checklist', { text: 'x', status: 'dropped', dropReason: 'moot' }, 'orca').dropReason).toBe('moot')
    expect(() => buildItem('checklist', { text: 'x', owner: 'a b' }, 'orca')).toThrow('owner')
    expect(() => buildItem('checklist', { text: 'x', status: 'nope' as any }, 'orca')).toThrow('status')
  })

  test('screens dedupe and fence', () => {
    const r = buildAddItems({ screens: [{ path: SHOT }, { path: SHOT }] }, 'shaka', NOW, [])
    expect(r.screens).toHaveLength(1)
    expect(r.skippedScreens).toEqual([SHOT])
    expect(screenPathError('/etc/passwd.png')).toContain('ccrecap-shots')
    expect(screenPathError('/home/chank/dev/orca/qa/ccrecap-shots/../x.png')).toContain('..')
  })

  test('at most 50 adds per call', () => {
    const many = Array.from({ length: 51 }, (_, i) => ({ text: `${i}` }))
    expect(() => buildAddItems({ checklist: many }, 'orca', NOW)).toThrow('50')
  })
})

describe('edits by id: reword, drop, reopen, owner; reorder', () => {
  const ID = 'aaaaaaaaaaaaaaaaaaaaaaaa'
  test('drop with reason, reword, change owner', () => {
    const u = patchUpdate([
      { kind: 'checklist', id: ID, status: 'dropped', dropReason: 'moot' },
      { kind: 'deliverable', id: ID, text: 'new words', owner: 'cm' },
    ])
    expect(u.$set).toMatchObject({
      'checklist.$[i0].status': 'dropped',
      'checklist.$[i0].dropReason': 'moot',
      'deliverables.$[i1].text': 'new words',
      'deliverables.$[i1].owner': 'cm',
    })
    expect(u.arrayFilters).toEqual([{ 'i0.id': ID }, { 'i1.id': ID }])
    expect(u.said[0]).toContain('dropped (moot)')
  })

  test('refusals: drop without reason, wrong fields for the kind, empty edit', () => {
    expect(() => patchUpdate([{ kind: 'checklist', id: ID, status: 'dropped' }])).toThrow('dropReason')
    expect(() => patchUpdate([{ kind: 'checklist', id: ID, link: 'x' }])).toThrow("don't take link")
    expect(() => patchUpdate([{ kind: 'screen', id: ID, text: 'x' }])).toThrow("don't take text")
    expect(() => patchUpdate([{ kind: 'checklist', id: ID }])).toThrow('changes nothing')
    expect(() => patchUpdate([{ kind: 'checklist', id: 'nope', done: true }])).toThrow('row id')
  })

  test('reorder needs every id exactly once', () => {
    const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(reorderRows(rows, ['c', 'a', 'b']).map((r) => r.id)).toEqual(['c', 'a', 'b'])
    expect(() => reorderRows(rows, ['a', 'b'])).toThrow('exactly once')
    expect(() => reorderRows(rows, ['a', 'a', 'b'])).toThrow('exactly once')
  })

  test('auto change words', () => {
    const added = buildAddItems({ checklist: [{ text: 'x' }, { text: 'y' }] }, 'orca', NOW)
    expect(describeEdit(added, ['checklist abc123 done'], ['deliverables'])).toBe(
      'added 2 checklist; checklist abc123 done; reordered deliverables',
    )
  })
})

describe('summary, close gate', () => {
  const task = {
    title: 'Landing page',
    version: 3,
    deliverables: [{ text: 'page', status: 'done', owner: 'dev' }],
    checklist: [
      { text: 'a', status: 'done', owner: 'dev' },
      { text: 'b', status: 'open' },
      { text: 'c', status: 'dropped', owner: 'dev', dropReason: 'x' },
      { text: 'email', status: 'done', owner: 'cm' },
      { text: 'call', status: 'open', owner: 'cm' },
      { text: 'qa pass', status: 'open', owner: 'shaka' },
    ],
  }

  test('"vN, dev x/y, cm x/y, fin x/y" counts non-dropped items per owner (untagged = dev)', () => {
    expect(summaryLine(task)).toBe('v3, dev 2/3, cm 1/2, fin 0/0, shaka 0/1')
    expect(structureProgress(task)).toMatchObject({ structured: true, checklist: '2/5', deliverables: '1/1' })
    expect(summaryLine({})).toBe('v0, dev 0/0, cm 0/0, fin 0/0')
  })

  test('close gate: every non-dropped item in every lane must be done', () => {
    expect(closeGateMissing(task)).toEqual(['checklist [dev] b', 'checklist [cm] call', 'checklist [shaka] qa pass'])
    const done = { ...task, checklist: task.checklist.map((c) => (c.status === 'open' ? { ...c, status: 'done' } : c)) }
    expect(closeGateMissing(done)).toEqual([])
    expect(closeGateMissing({ title: 'legacy' })).toEqual([]) // no structured items → not gated here
  })

  test('close gate: money tasks need a [fin] money check item', () => {
    const money = { title: 'Update prices on the menu', checklist: [{ text: 'a', status: 'done' }] }
    expect(closeGateMissing(money)[0]).toContain('[fin] money check')
    expect(
      closeGateMissing({ ...money, checklist: [...money.checklist, { text: 'money check', status: 'done', owner: 'fin' }] }),
    ).toEqual([])
    expect(closeGateMissing({ ...money, askUpdates: [], title: 'Hero copy' })).toEqual([])
  })
})

describe('Now block', () => {
  const desc = [
    'Ask: x',
    'next: orca: old untagged next',
    'left off [dev] 12:10: schema done',
    'next [cm]: gojo: draft the client email',
    '[poller] something',
    'left off [dev] 12:30: tests green | next [dev]: shaka: QA the branch',
    'result [cm]: email in #drafts',
  ].join('\n')

  test('one line per lane from the newest lines; untagged = dev; " | " segments count', () => {
    const now = nowBlock(desc, 'orcaclubpro · vp/task-structure')
    const dev = now.find((n) => n.lane === 'dev')!
    expect(dev).toMatchObject({
      next: 'QA the branch',
      waitingOn: 'shaka',
      leftOff: 'tests green',
      leftOffAt: '12:30',
      where: 'orcaclubpro · vp/task-structure',
    })
    expect(dev.line).toBe(
      'dev · next: shaka: QA the branch · where: orcaclubpro · vp/task-structure · waiting on: shaka · left off 12:30: tests green',
    )
    const cm = now.find((n) => n.lane === 'cm')!
    expect(cm).toMatchObject({ next: 'draft the client email', waitingOn: 'gojo', last: 'email in #drafts' })
    expect(now).toHaveLength(2)
  })

  test('owner slice: a lane or a bot gets its Now lines and open items', () => {
    const t = {
      checklist: [
        { id: '1', text: 'build', status: 'open' },
        { id: '2', text: 'email', status: 'open', owner: 'cm' },
        { id: '3', text: 'old', status: 'done', owner: 'cm' },
      ],
    }
    const cm = ownerSlice(t, desc, 'cm')
    expect(cm.now.map((n) => n.lane)).toEqual(['cm'])
    expect(cm.open.map((i) => i.text)).toEqual(['email'])
    const dev = ownerSlice(t, desc, 'dev')
    expect(dev.open.map((i) => i.line)).toEqual(['- [ ] [dev] build'])
    // a bot sees lanes waiting on it
    expect(ownerSlice(t, desc, 'gojo').now.map((n) => n.lane)).toEqual(['cm'])
    expect(ownerSlice(t, desc, 'shaka').now.map((n) => n.lane)).toEqual(['dev'])
  })
})
