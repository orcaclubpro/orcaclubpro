import { describe, expect, test } from 'bun:test'
import { taskAdminUrl } from './url'

describe('taskAdminUrl', () => {
  test('builds the admin edit link from the id', () => {
    expect(taskAdminUrl('6ae97f281c5269f1d46f8c72', 'https://orcaclub.pro')).toBe(
      'https://orcaclub.pro/admin/collections/tasks/6ae97f281c5269f1d46f8c72',
    )
  })
  test('drops a trailing slash on the base', () => {
    expect(taskAdminUrl('abc', 'http://localhost:3000/')).toBe('http://localhost:3000/admin/collections/tasks/abc')
  })
  test('falls back to orcaclub.pro when no base is configured', () => {
    const prev = process.env.NEXT_PUBLIC_SERVER_URL
    delete process.env.NEXT_PUBLIC_SERVER_URL
    try {
      expect(taskAdminUrl('abc')).toBe('https://orcaclub.pro/admin/collections/tasks/abc')
    } finally {
      if (prev !== undefined) process.env.NEXT_PUBLIC_SERVER_URL = prev
    }
  })
})
