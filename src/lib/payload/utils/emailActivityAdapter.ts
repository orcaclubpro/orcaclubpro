/**
 * Email adapter wrapper — the single choke point for "an email was sent".
 *
 * `payload.sendEmail()` is the initialized email adapter's own `sendEmail`, so
 * wrapping the adapter once in payload.config.ts records every send in the app
 * — API routes, server actions, the invoice/receipt template modules and the
 * Users hooks alike — without touching a single call site, and without a future
 * call site being able to opt out by accident.
 *
 * The wrapper is transparent: it awaits the real send, returns its result
 * unchanged, and only then hands the message to the (fire-and-forget, never
 * throwing) activity writer. A failed send is not recorded, and a failure to
 * record can never fail a send.
 */

import type { PayloadEmailAdapter } from 'payload'
import { recordEmailActivity } from '../hooks/recordActivity'

export const withActivityLogging = async <T>(
  // Adapter factories are async (nodemailerAdapter verifies the transport
  // before resolving), and Payload accepts a promise here — so we await the
  // real adapter and hand back a wrapped one, still as a promise.
  adapter: PayloadEmailAdapter<T> | Promise<PayloadEmailAdapter<T>>,
): Promise<PayloadEmailAdapter<T>> => {
  const resolved = await adapter

  return (args) => {
    const initialized = resolved(args)

    return {
      ...initialized,
      sendEmail: async (message) => {
        const result = await initialized.sendEmail(message)
        recordEmailActivity(args.payload, message)
        return result
      },
    }
  }
}
