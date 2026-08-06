// src/app/(spaces)/themes.test.ts
import { expect, test, describe } from 'bun:test'
import { isThemeId, THEME_LIST, THEMES, DEFAULT_THEME, themeSelectOptions } from './themes'

describe('isThemeId', () => {
  test('accepts every id in the registry', () => {
    expect(THEME_LIST.length).toBeGreaterThan(0)
    for (const theme of THEME_LIST) {
      expect(isThemeId(theme.id)).toBe(true)
    }
  })

  test('rejects themes that were removed from the registry', () => {
    // These two ids are still stored on live user records; they must be
    // recognised as invalid so the Users beforeValidate hook coerces them.
    expect(isThemeId('emerald')).toBe(false)
    expect(isThemeId('void')).toBe(false)
  })

  test('rejects empty and non-string values', () => {
    expect(isThemeId('')).toBe(false)
    expect(isThemeId(null)).toBe(false)
    expect(isThemeId(undefined)).toBe(false)
    expect(isThemeId(0)).toBe(false)
    expect(isThemeId({})).toBe(false)
    expect(isThemeId([])).toBe(false)
    expect(isThemeId(true)).toBe(false)
  })

  test('rejects arbitrary unknown ids', () => {
    expect(isThemeId('nope')).toBe(false)
    expect(isThemeId('SONAR')).toBe(false)
    expect(isThemeId(' sonar')).toBe(false)
  })

  test('is not fooled by inherited Object.prototype keys', () => {
    // `id in THEMES` would otherwise report true for prototype members.
    expect(isThemeId('toString')).toBe(false)
    expect(isThemeId('constructor')).toBe(false)
    expect(isThemeId('hasOwnProperty')).toBe(false)
  })
})

describe('DEFAULT_THEME', () => {
  test('is itself a valid theme id', () => {
    // Invariant: the Users beforeValidate coercion writes DEFAULT_THEME, so if
    // this ever went stale the "fix" would store another invalid selection.
    expect(isThemeId(DEFAULT_THEME)).toBe(true)
  })

  test('resolves to a real theme definition', () => {
    expect(THEMES[DEFAULT_THEME]?.id).toBe(DEFAULT_THEME)
  })

  test('is offered by the Payload select options', () => {
    const values = themeSelectOptions().map((o) => o.value)
    expect(values).toContain(DEFAULT_THEME)
    expect(values.sort()).toEqual(THEME_LIST.map((t) => t.id).sort())
  })
})
