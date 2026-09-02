import { expect, test, describe } from 'bun:test'
import { hasPaymentInFlight, isPaymentInFlightError } from './invoices'

// Shape mirrors the Stripe `InvoicePayment` objects returned by
// `invoices.retrieve(id, { expand: ['payments'] })` on API version 2025-12-15.clover.
const payment = (status: string) => ({ status }) as any
const invoiceWith = (...statuses: string[]) =>
  ({ payments: { data: statuses.map(payment) } }) as any

describe('hasPaymentInFlight', () => {
  test('an open invoice payment means money is on its way', () => {
    expect(hasPaymentInFlight(invoiceWith('open'))).toBe(true)
  })

  test('a settled payment is not in flight', () => {
    expect(hasPaymentInFlight(invoiceWith('paid'))).toBe(false)
  })

  test('a canceled payment is not in flight', () => {
    expect(hasPaymentInFlight(invoiceWith('canceled'))).toBe(false)
  })

  test('detects an open payment alongside terminal ones', () => {
    expect(hasPaymentInFlight(invoiceWith('canceled', 'open'))).toBe(true)
  })

  test('an invoice with no payments is not in flight', () => {
    expect(hasPaymentInFlight(invoiceWith())).toBe(false)
  })

  // The field is absent unless `expand: ['payments']` was passed, and absent on
  // older API versions. Never guess "in flight" from missing data — that would
  // block every offline fulfillment.
  test('an unexpanded invoice is not treated as in flight', () => {
    expect(hasPaymentInFlight({} as any)).toBe(false)
  })
})

describe('isPaymentInFlightError', () => {
  test('recognises the Stripe overpayment rejection', () => {
    const err = Object.assign(new Error(
      'There is a payment processing on this invoice and marking it paid out of band could cause overpayment.',
    ), { type: 'invalid_request_error' })
    expect(isPaymentInFlightError(err)).toBe(true)
  })

  test('ignores unrelated Stripe errors', () => {
    const err = Object.assign(new Error('No such invoice: in_123'), {
      type: 'invalid_request_error',
    })
    expect(isPaymentInFlightError(err)).toBe(false)
  })

  test('ignores transient network failures', () => {
    expect(isPaymentInFlightError(new Error('socket hang up'))).toBe(false)
  })

  test('tolerates a non-error throw', () => {
    expect(isPaymentInFlightError(undefined)).toBe(false)
    expect(isPaymentInFlightError('boom')).toBe(false)
  })
})
