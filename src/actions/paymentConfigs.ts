'use server'

import { getCurrentUser } from '@/actions/auth'
import { listPaymentConfigs, type PaymentConfigOption } from '@/lib/stripe/paymentConfigs'

export interface PaymentConfigChoice {
  id: string
  name: string
  isDefault: boolean
  /** Invoice-payable methods this preset turns on, already filtered to what Stripe will accept. */
  methods: string[]
  allowsCard: boolean
  /** Short human summary for the picker, e.g. "Card, bank transfer". */
  summary: string
}

const METHOD_LABELS: Record<string, string> = {
  card: 'Card',
  us_bank_account: 'Bank transfer (ACH)',
  link: 'Link',
  cashapp: 'Cash App',
  paypal: 'PayPal',
  klarna: 'Klarna',
  affirm: 'Affirm',
  amazon_pay: 'Amazon Pay',
  acss_debit: 'Pre-authorized debit',
  sepa_debit: 'SEPA debit',
  bacs_debit: 'Bacs debit',
  customer_balance: 'Bank transfer',
  crypto: 'Crypto',
}

const summarize = (methods: string[]): string =>
  methods.length === 0
    ? 'Stripe account default'
    : methods.map((m) => METHOD_LABELS[m] ?? m.replace(/_/g, ' ')).join(', ')

/**
 * Payment method presets staff can pick from when raising an invoice.
 *
 * Staff-only: this reads the Stripe account's configuration list, which is not
 * client-facing information. Failures return an empty list rather than an error — the
 * picker then simply offers nothing and every flow falls through to the account
 * default, which is the pre-existing behavior.
 */
export async function getPaymentConfigChoices(): Promise<{
  success: boolean
  choices: PaymentConfigChoice[]
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role === 'client') {
      return { success: false, choices: [], error: 'Unauthorized' }
    }

    const options = await listPaymentConfigs()

    // Card-enabling presets first — that is what staff are almost always reaching for —
    // then Stripe's default, then the rest by name.
    const ranked = [...options].sort((a, b) => {
      if (a.allowsCard !== b.allowsCard) return a.allowsCard ? -1 : 1
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return {
      success: true,
      choices: ranked.map((o: PaymentConfigOption) => ({
        id: o.id,
        name: o.name,
        isDefault: o.isDefault,
        methods: o.methods,
        allowsCard: o.allowsCard,
        summary: summarize(o.methods),
      })),
    }
  } catch (error) {
    console.error('[getPaymentConfigChoices]', error)
    return { success: false, choices: [], error: 'Could not load payment presets' }
  }
}
