import { describe, expect, test } from 'bun:test'

import { qaCompletionError } from './qaGate'

const run = (data: Record<string, any>, originalDoc: Record<string, any>) => {
  const err = qaCompletionError(data, originalDoc)
  if (err) throw new Error(err)
}

const tracked = { status: 'in-progress', ccqTaskId: 'T261103-120329' }

describe('close gate: tracked tasks complete on qa pass + commit or reportLink', () => {
  test('pass + commit completes', () => {
    expect(() => run({ status: 'completed', qa: { status: 'pass', commit: 'a'.repeat(40) } }, tracked)).not.toThrow()
  })

  test('pass + reportLink (no commit) completes', () => {
    expect(() =>
      run({ status: 'completed', qa: { status: 'pass', commit: null, reportLink: 'https://discord.com/x' } }, tracked),
    ).not.toThrow()
  })

  test('pass with neither commit nor reportLink is refused', () => {
    expect(() => run({ status: 'completed', qa: { status: 'pass', commit: '', reportLink: '  ' } }, tracked)).toThrow(
      /qa\.commit or qa\.reportLink/,
    )
  })

  test('reportLink without a pass is refused', () => {
    expect(() => run({ status: 'completed', qa: { status: 'pending', reportLink: 'https://x' } }, tracked)).toThrow()
    expect(() => run({ status: 'completed', qa: { status: 'fail', commit: 'abc' } }, tracked)).toThrow()
  })

  test('reportLink already on the stored QA record counts (qa merged from originalDoc)', () => {
    expect(() =>
      run({ status: 'completed' }, { ...tracked, qa: { status: 'pass', reportLink: 'https://x' } }),
    ).not.toThrow()
  })

  test('untracked portal tasks and non-completing writes are unaffected', () => {
    expect(() => run({ status: 'completed' }, { status: 'in-progress' })).not.toThrow()
    expect(() => run({ status: 'in-progress' }, { ...tracked, status: 'pending' })).not.toThrow()
  })
})
