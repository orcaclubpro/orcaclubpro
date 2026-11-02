import { describe, expect, test } from 'bun:test'
import { CUSTOM_LINE_BLOCKED, isHourlyRateItem, priceCatalogLine } from './catalogLinePrice'

const hourly = { billingType: 'hourly', defaultRate: 120 }

describe('priceCatalogLine', () => {
  test('hourly item with a rate: price = rate × hours', () => {
    expect(priceCatalogLine(hourly, 3, 'Dev', 'si1')).toEqual({ ok: true, price: 360, hourly: true })
  })

  test('hourly price is rounded to cents', () => {
    const r = priceCatalogLine({ billingType: 'hourly', defaultRate: 33.33 }, 1.5, 'Dev', 'si1')
    expect(r).toEqual({ ok: true, price: 50, hourly: true })
    const r2 = priceCatalogLine({ billingType: 'hourly', defaultRate: 99.99 }, 0.333, 'Dev', 'si1')
    expect(r2).toEqual({ ok: true, price: 33.3, hourly: true })
  })

  test('hourly item requires hours > 0', () => {
    for (const hours of [undefined, null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY, '3']) {
      const r = priceCatalogLine(hourly, hours, 'Dev', 'si1')
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toBe("Line item 'Dev': hourly service item si1 needs hours greater than 0 (price = rate × hours).")
    }
  })

  test('hourly rate wins over a defaultPrice on the same item', () => {
    expect(priceCatalogLine({ billingType: 'hourly', defaultRate: 100, defaultPrice: 5000 }, 2, 'Dev', 'si1')).toEqual({
      ok: true,
      price: 200,
      hourly: true,
    })
  })

  test('hourly item with no rate falls back to a defaultPrice, ignoring hours', () => {
    expect(priceCatalogLine({ billingType: 'hourly', defaultPrice: 800 }, undefined, 'Dev', 'si1')).toEqual({
      ok: true,
      price: 800,
      hourly: false,
    })
  })

  test('fixed item takes its defaultPrice; a stray defaultRate is ignored', () => {
    expect(priceCatalogLine({ billingType: 'fixed', defaultPrice: 1800, defaultRate: 50 }, 4, 'Site', 'si2')).toEqual({
      ok: true,
      price: 1800,
      hourly: false,
    })
  })

  test('an item with no positive price or rate is rejected', () => {
    for (const item of [{ billingType: 'fixed' }, { billingType: 'fixed', defaultPrice: 0 }, { billingType: 'hourly', defaultRate: 0 }]) {
      const r = priceCatalogLine(item, 2, 'X', 'si3')
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toContain("Line item 'X': service item si3 has no locked price")
    }
  })

  test('isHourlyRateItem', () => {
    expect(isHourlyRateItem(hourly)).toBe(true)
    expect(isHourlyRateItem({ billingType: 'hourly' })).toBe(false)
    expect(isHourlyRateItem({ billingType: 'fixed', defaultRate: 120 })).toBe(false)
    expect(isHourlyRateItem(null)).toBe(false)
  })

  test('the custom-line message is exactly Finn’s wording', () => {
    expect(CUSTOM_LINE_BLOCKED).toBe('Price comes from the service item. Pick one, or ask Chance for a custom line.')
  })
})
