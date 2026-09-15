'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPaymentConfigChoices, type PaymentConfigChoice } from '@/actions/paymentConfigs'

/**
 * Picks which payment methods a Stripe invoice offers, by choosing one of the account's
 * payment method configurations as a preset.
 *
 * Shared by every order-creation surface — the client orders modal, the package schedule
 * modal, and retainer billing — so the choice means the same thing everywhere.
 *
 * The empty value means "use the account default", which is what every flow did before
 * this existed. That is deliberately the fallback rather than an error state: if Stripe
 * is unreachable the picker renders nothing and invoicing carries on unchanged.
 */

const inputCls =
  'w-full px-3 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:outline-none focus:border-[rgba(139,156,182,0.20)] transition-colors'
const labelCls =
  'text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]'

export interface PaymentConfigSelectProps {
  value: string
  onChange: (paymentConfigId: string) => void
  /** Hidden entirely when false — e.g. while the form is set to fulfill rather than bill. */
  visible?: boolean
  disabled?: boolean
  className?: string
  label?: string
}

export function PaymentConfigSelect({
  value,
  onChange,
  visible = true,
  disabled,
  className,
  label = 'Payment methods',
}: PaymentConfigSelectProps) {
  const [choices, setChoices] = useState<PaymentConfigChoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    getPaymentConfigChoices()
      .then((r) => {
        if (live) setChoices(r.choices)
      })
      .catch(() => {
        /* leave the list empty — the caller falls back to the account default */
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [])

  // Nothing to choose between is the same as no choice — don't show a dead control.
  if (!visible || (!loading && choices.length === 0)) return null

  const selected = choices.find((c) => c.id === value)

  return (
    <label className={cn('block', className)}>
      <span className={labelCls}>{label}</span>

      {loading ? (
        <div className={cn(inputCls, 'mt-1 flex items-center gap-2 text-xs py-1.5')}>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-[var(--space-text-muted)]">Loading presets…</span>
        </div>
      ) : (
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputCls, 'mt-1 text-xs py-1.5')}
        >
          <option value="">Stripe account default</option>
          {choices.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.isDefault ? ' (Stripe default)' : ''} — {c.summary}
            </option>
          ))}
        </select>
      )}

      {selected?.allowsCard && (
        <span className="mt-1 flex items-center gap-1 text-[0.625rem] text-[var(--space-text-muted)]">
          <CreditCard className="h-3 w-3" />
          Card payment enabled on this invoice
        </span>
      )}
    </label>
  )
}
