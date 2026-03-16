'use client'

import { useState } from 'react'
import { CreditCard, Loader2, ExternalLink } from 'lucide-react'
import { createBillingPortalSession } from '@/actions/billing'

interface BillingPortalButtonProps {
  clientAccountId: string
  variant?: 'primary' | 'subtle'
  label?: string
}

export function BillingPortalButton({
  clientAccountId,
  variant = 'primary',
  label = 'Manage Billing',
}: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle() {
    setLoading(true)
    setError(null)
    const result = await createBillingPortalSession(clientAccountId)
    setLoading(false)
    if (result.success && result.url) {
      window.open(result.url, '_blank')
    } else {
      setError(result.error ?? 'Failed to open billing portal')
    }
  }

  if (variant === 'subtle') {
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          onClick={handle}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 border border-white/[0.08] rounded-lg hover:text-[var(--space-accent)] hover:border-[rgba(139,156,182,0.18)] disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <CreditCard className="size-3.5" />}
          {loading ? 'Loading…' : label}
          {!loading && <ExternalLink className="size-3 opacity-60" />}
        </button>
        {error && <p className="text-[10px] text-red-400 leading-snug max-w-[200px]">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={handle}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.18)] text-[var(--space-accent)] text-sm font-semibold hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-50 transition-all"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
        {loading ? 'Opening portal…' : label}
        {!loading && <ExternalLink className="size-3.5 opacity-60" />}
      </button>
      {error && <p className="text-xs text-red-400 leading-snug max-w-xs">{error}</p>}
    </div>
  )
}
