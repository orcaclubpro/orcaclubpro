'use client'

import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssignPackageModal } from './AssignPackageModal'
import {
  fmt,
  computeTotals,
  type PackageDoc,
  type PackageOrderSummary,
} from './package-detail/utils'

interface ClientPackagesTabProps {
  packages: PackageDoc[]
  clientId: string
  username: string
  packageOrders?: Record<string, PackageOrderSummary[]>
}

/** Summary list of a client's proposals. Every card is a link — configuring a
 *  package (line items, schedule, invoicing) happens on its own detail page. */
export function ClientPackagesTab({ packages, clientId, username, packageOrders }: ClientPackagesTabProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-base font-semibold text-[var(--space-text-primary)]">Packages</h2>
          <span className="text-xs text-[var(--space-text-muted)] tabular-nums">{packages.length}</span>
        </div>
        <AssignPackageModal clientId={clientId} />
      </div>

      {packages.length > 0 ? (
        <div className="space-y-4">
          {packages.map((pkg) => {
            const allLineItems = pkg.lineItems ?? []
            // Add-ons are optional extras excluded from the proposal total —
            // included items (isAddOn falsy) drive pricing, counts and totals.
            const lineItems = allLineItems.filter(li => !li.isAddOn)
            const { oneTime, monthly, annual } = computeTotals(lineItems)
            const hasItems = lineItems.length > 0
            const pendingRequests = (pkg.requestedItems ?? []).filter(
              r => !allLineItems.some(li => li.name === r.name)
            ).length

            // Invoice progress
            const pkgOrders = packageOrders?.[pkg.id] ?? []
            const invoicedAmount = pkgOrders.reduce((s, o) => s + (o.amount ?? 0), 0)
            const paidAmount = pkgOrders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.amount ?? 0), 0)
            const invoicedPct = oneTime > 0 ? Math.min(100, (invoicedAmount / oneTime) * 100) : 0
            const paidPct = oneTime > 0 ? Math.min(100, (paidAmount / oneTime) * 100) : 0

            return (
              <Link
                key={pkg.id}
                href={`/u/${username}/clients/${clientId}/packages/${pkg.id}`}
                className={cn(
                  'block rounded-2xl border overflow-hidden transition-all duration-300 group',
                  'border-[var(--space-border-hard)] hover:border-[rgba(139,156,182,0.15)]',
                )}
                style={{ background: 'var(--space-bg-card)' }}
              >
                {/* Glow bar */}
                <div className="h-px transition-all duration-500 bg-gradient-to-r from-transparent via-[#333333] to-transparent group-hover:via-[var(--space-accent)]/30" />

                <div className="px-7 pt-7 pb-6">
                  <p className="text-[0.625rem] font-bold uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--space-accent)', opacity: 0.6 }}>
                    Service Package
                  </p>

                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-xl font-bold text-[var(--space-text-primary)] leading-tight">{pkg.name}</h3>
                    <div className="flex items-center gap-2 shrink-0 mt-1">
                      {pendingRequests > 0 && (
                        <span className="text-[0.625rem] text-amber-400 bg-amber-400/[0.08] border border-amber-400/25 rounded px-1.5 py-0.5 font-medium">
                          {pendingRequests} request{pendingRequests !== 1 ? 's' : ''}
                        </span>
                      )}
                      <ChevronRight className="size-4 text-[var(--space-text-muted)] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-sm text-[var(--space-text-secondary)] leading-relaxed mb-6">{pkg.description}</p>
                  )}

                  {/* Pricing */}
                  {hasItems && (oneTime > 0 || monthly > 0 || annual > 0) ? (
                    <div className="flex items-end gap-8 flex-wrap">
                      {oneTime > 0 && (
                        <div>
                          <p className="text-3xl font-bold text-[var(--space-text-primary)] tabular-nums tracking-tight">{fmt(oneTime)}</p>
                          <p className="text-xs text-[var(--space-text-muted)] mt-1 uppercase tracking-widest">one-time</p>
                        </div>
                      )}
                      {monthly > 0 && (
                        <div>
                          <div className="flex items-baseline gap-0.5">
                            <p className="text-3xl font-bold text-[var(--space-text-primary)] tabular-nums tracking-tight">{fmt(monthly)}</p>
                            <p className="text-lg text-[var(--space-text-muted)] font-normal">/mo</p>
                          </div>
                          <p className="text-xs text-[var(--space-text-muted)] mt-1 uppercase tracking-widest">per month</p>
                        </div>
                      )}
                      {annual > 0 && (
                        <div>
                          <div className="flex items-baseline gap-0.5">
                            <p className="text-3xl font-bold text-[var(--space-text-primary)] tabular-nums tracking-tight">{fmt(annual)}</p>
                            <p className="text-lg text-[var(--space-text-muted)] font-normal">/yr</p>
                          </div>
                          <p className="text-xs text-[var(--space-text-muted)] mt-1 uppercase tracking-widest">per year</p>
                        </div>
                      )}
                      <div className="pb-0.5">
                        <p className="text-3xl font-bold text-[var(--space-text-primary)] tabular-nums">{lineItems.length}</p>
                        <p className="text-xs text-[var(--space-text-muted)] mt-1 uppercase tracking-widest">
                          {lineItems.length === 1 ? 'service' : 'services'}
                        </p>
                      </div>
                    </div>
                  ) : !hasItems ? (
                    <p className="text-sm text-[var(--space-text-muted)] italic">No options selected — open to configure</p>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold text-[var(--space-text-primary)] tabular-nums">{lineItems.length}</p>
                      <p className="text-xs text-[var(--space-text-muted)] mt-1 uppercase tracking-widest">services</p>
                    </div>
                  )}

                  {/* Progress bar */}
                  {pkgOrders.length > 0 && oneTime > 0 && (
                    <div className="mt-5 space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-[var(--space-divider)] overflow-hidden">
                        <div className="h-full rounded-full flex">
                          {paidPct > 0 && (
                            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${paidPct}%` }} />
                          )}
                          {(invoicedPct - paidPct) > 0 && (
                            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${invoicedPct - paidPct}%` }} />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[0.625rem] text-[var(--space-text-muted)] tabular-nums">
                        <span>
                          <span className={paidAmount > 0 ? 'text-emerald-400' : ''}>{fmt(invoicedAmount)}</span>
                          {' '}invoiced
                        </span>
                        <span>{fmt(oneTime - invoicedAmount)} remaining</span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-[var(--space-border-hard)]"
          style={{ background: 'var(--space-bg-card)' }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-64 rounded-full bg-[rgba(255,255,255,0.01)] blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center py-14 px-6">
            <div className="p-4 rounded-2xl bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] mb-5">
              <Sparkles className="size-7 text-[var(--space-text-muted)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--space-text-primary)] mb-2">No packages assigned</h3>
            <p className="text-[var(--space-text-muted)] text-sm max-w-xs mb-6 leading-relaxed">
              Assign a service package to start building a custom offering for this client.
            </p>
            <AssignPackageModal clientId={clientId} />
          </div>
        </div>
      )}
    </section>
  )
}
