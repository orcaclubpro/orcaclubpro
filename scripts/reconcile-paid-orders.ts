/**
 * Reconcile Payload orders marked `paid` against their Stripe invoices.
 *
 * Finds orders where Payload claims payment but Stripe disagrees — the exact
 * divergence that the old `fulfillOrderPaidOutOfBand` could create when Stripe
 * refused a paid-out-of-band call and the error was swallowed.
 *
 * Read-only. Prints a report; changes nothing.
 *
 *   bun run scripts/reconcile-paid-orders.ts
 */

import { getPayload } from 'payload'
import config from '../src/lib/payload/payload.config'
import { getStripe } from '../src/lib/stripe'

/** Stripe invoice states that genuinely back a Payload order marked `paid`. */
const SETTLED = new Set(['paid'])

async function reconcile() {
  const payload = await getPayload({ config })
  const stripe = getStripe()

  const { docs: orders } = await payload.find({
    collection: 'orders',
    where: { status: { equals: 'paid' } },
    limit: 1000,
    depth: 0,
    sort: '-updatedAt',
  })

  console.log(`\nChecking ${orders.length} order(s) marked paid…\n`)

  const mismatched: string[] = []
  let noInvoice = 0
  let clean = 0

  for (const order of orders) {
    const invoiceId = order.stripeInvoiceId as string | undefined

    // Payload-only orders (INV-NNNN placeholders) have nothing to reconcile.
    if (!invoiceId) {
      noInvoice++
      continue
    }

    try {
      const invoice = await stripe.invoices.retrieve(invoiceId, { expand: ['payments'] })

      if (SETTLED.has(invoice.status ?? '')) {
        clean++
        continue
      }

      const inFlight = ((invoice as any).payments?.data ?? []).filter(
        (p: any) => p?.status === 'open',
      ).length

      mismatched.push(order.id as string)
      console.log(`  MISMATCH  ${order.orderNumber}  (order ${order.id})`)
      console.log(`            Payload: paid   Stripe: ${invoice.status}`)
      console.log(`            amount_due $${((invoice.amount_due ?? 0) / 100).toFixed(2)}  ` +
                  `amount_paid $${((invoice.amount_paid ?? 0) / 100).toFixed(2)}`)
      if (inFlight > 0) {
        console.log(`            ${inFlight} payment(s) still in flight — likely ACH settling`)
      }
      console.log(`            updated ${order.updatedAt}`)
      console.log(`            https://dashboard.stripe.com/invoices/${invoiceId}\n`)
    } catch (err: any) {
      mismatched.push(order.id as string)
      console.log(`  ERROR     ${order.orderNumber}  (order ${order.id})`)
      console.log(`            Could not read Stripe invoice ${invoiceId}: ${err?.message}\n`)
    }
  }

  console.log('─'.repeat(60))
  console.log(`  reconciled clean : ${clean}`)
  console.log(`  no Stripe invoice: ${noInvoice}  (nothing to check)`)
  console.log(`  MISMATCHED       : ${mismatched.length}`)
  console.log('─'.repeat(60))

  if (mismatched.length > 0) {
    console.log('\nAn in-flight payment resolves itself when it settles — the invoice.paid')
    console.log('webhook will re-mark the order and send the receipt. Anything else needs')
    console.log('a human: either the payment never happened, or the order is the wrong one.\n')
  }

  process.exit(0)
}

reconcile().catch((err) => {
  console.error('Reconcile failed:', err)
  process.exit(1)
})
