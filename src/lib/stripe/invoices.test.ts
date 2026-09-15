import { expect, test, describe } from 'bun:test'
import { hasPaymentInFlight, openPaymentIntentIds, isPaymentInFlightError } from './invoices'

// Shape mirrors the Stripe `InvoicePayment` objects returned by
// `invoices.retrieve(id, { expand: ['payments'] })` on API version 2025-12-15.clover.
const payment = (status: string, intentId: string | null = 'pi_1') =>
  ({ status, payment: intentId ? { type: 'payment_intent', payment_intent: intentId } : null }) as any
const invoiceWith = (...payments: any[]) => ({ payments: { data: payments } }) as any

/** A Stripe stub that answers with the given status for every intent id. */
const stripeWith = (statuses: Record<string, string>) =>
  ({
    paymentIntents: {
      retrieve: async (id: string) =>
        id in statuses ? { id, status: statuses[id] } : Promise.reject(new Error(`No such intent: ${id}`)),
    },
  }) as any

describe('openPaymentIntentIds', () => {
  test('collects the intent behind each open payment', () => {
    expect(openPaymentIntentIds(invoiceWith(payment('open', 'pi_a'), payment('open', 'pi_b'))))
      .toEqual(['pi_a', 'pi_b'])
  })

  test('ignores settled and canceled payments', () => {
    expect(openPaymentIntentIds(invoiceWith(payment('paid', 'pi_a'), payment('canceled', 'pi_b'))))
      .toEqual([])
  })

  test('skips an open payment with no payment intent', () => {
    expect(openPaymentIntentIds(invoiceWith(payment('open', null)))).toEqual([])
  })

  // Absent unless `expand: ['payments']` was passed, and absent on older API
  // versions. Never guess from missing data — that would block every offline
  // fulfillment.
  test('an unexpanded invoice yields nothing', () => {
    expect(openPaymentIntentIds({} as any)).toEqual([])
  })
})

describe('hasPaymentInFlight', () => {
  test('an ACH debit still settling is in flight', async () => {
    const invoice = invoiceWith(payment('open', 'pi_ach'))
    expect(await hasPaymentInFlight(stripeWith({ pi_ach: 'processing' }), invoice)).toBe(true)
  })

  test('an authorized but uncaptured card hold is in flight', async () => {
    const invoice = invoiceWith(payment('open', 'pi_hold'))
    expect(await hasPaymentInFlight(stripeWith({ pi_hold: 'requires_capture' }), invoice)).toBe(true)
  })

  // The regression this guard used to cause: Stripe opens a *default*
  // InvoicePayment the moment an invoice is finalized, so every unpaid invoice
  // we raise carries an `open` payment that nobody has paid into. Reading the
  // status alone refused offline payment on all of them.
  test('the default open payment on a freshly finalized invoice is not in flight', async () => {
    const invoice = invoiceWith(payment('open', 'pi_new'))
    expect(await hasPaymentInFlight(stripeWith({ pi_new: 'requires_payment_method' }), invoice)).toBe(false)
  })

  test('an abandoned attempt awaiting customer action is not in flight', async () => {
    const invoice = invoiceWith(payment('open', 'pi_3ds'))
    expect(await hasPaymentInFlight(stripeWith({ pi_3ds: 'requires_action' }), invoice)).toBe(false)
  })

  test('a settled payment is not in flight', async () => {
    expect(await hasPaymentInFlight(stripeWith({}), invoiceWith(payment('paid')))).toBe(false)
  })

  test('a canceled payment is not in flight', async () => {
    expect(await hasPaymentInFlight(stripeWith({}), invoiceWith(payment('canceled')))).toBe(false)
  })

  test('detects a settling payment alongside terminal ones', async () => {
    const invoice = invoiceWith(payment('canceled', 'pi_dead'), payment('open', 'pi_ach'))
    expect(await hasPaymentInFlight(stripeWith({ pi_ach: 'processing' }), invoice)).toBe(true)
  })

  test('an invoice with no payments is not in flight', async () => {
    expect(await hasPaymentInFlight(stripeWith({}), invoiceWith())).toBe(false)
  })

  test('an unexpanded invoice is not treated as in flight', async () => {
    expect(await hasPaymentInFlight(stripeWith({}), {} as any)).toBe(false)
  })

  // Stripe's own refusal inside `invoices.pay` is the backstop, so an
  // unreadable intent must not block the offline payment here.
  test('an unreadable payment intent does not block fulfillment', async () => {
    const invoice = invoiceWith(payment('open', 'pi_gone'))
    expect(await hasPaymentInFlight(stripeWith({}), invoice)).toBe(false)
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
