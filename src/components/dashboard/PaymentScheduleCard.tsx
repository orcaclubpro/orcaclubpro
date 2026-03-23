import Link from 'next/link'
import { CalendarDays, ArrowRight } from 'lucide-react'
import { fmtCurrency, fmtScheduleDate, isDueSoon, type ScheduledPackage } from '@/lib/dashboard/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentScheduleCardProps {
  packages: ScheduledPackage[]
  /** Max packages to display (default: all) */
  maxPackages?: number
  /** Max entries per package (default: all) */
  maxEntries?: number
  /**
   * Per-package "View →" link in the package header row.
   * Receives the package id, returns an href.
   * Use this when already on the invoices page (e.g. link to print view).
   */
  getPackageHref?: (pkgId: string) => string
  /**
   * Single footer link at the bottom of the whole card.
   * Use this when on a summary page linking to the full invoices view.
   */
  footerLink?: { label: string; href: string }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentScheduleCard({
  packages,
  maxPackages,
  maxEntries,
  getPackageHref,
  footerLink,
}: PaymentScheduleCardProps) {
  const scheduledPkgs = packages
    .map(pkg => ({
      ...pkg,
      upcoming: (pkg.paymentSchedule ?? []).filter(e => !e.orderId),
    }))
    .filter(pkg => pkg.upcoming.length > 0)
    .slice(0, maxPackages)

  if (scheduledPkgs.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] overflow-hidden divide-y divide-[var(--space-divider)]">
      {scheduledPkgs.map((pkg) => {
        const entries = maxEntries ? pkg.upcoming.slice(0, maxEntries) : pkg.upcoming
        const pkgHref = getPackageHref?.(pkg.id)

        return (
          <div key={pkg.id}>
            {/* Package header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[rgba(255,255,255,0.02)]">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--space-text-secondary)]">
                {pkg.name}
              </span>
              {pkgHref && (
                <Link
                  href={pkgHref}
                  className="text-[9px] transition-colors ml-2 shrink-0 text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)]"
                  style={{ color: 'rgba(139,156,182,0.25)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(139,156,182,0.70)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(139,156,182,0.25)')}
                >
                  View →
                </Link>
              )}
            </div>

            {/* Schedule entries */}
            {entries.map((entry) => {
              const soon = isDueSoon(entry.dueDate)
              return (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`size-1.5 rounded-full shrink-0 ${
                    soon ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'bg-[rgba(139,156,182,0.20)]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--space-text-tertiary)] truncate leading-snug">
                      {entry.label}
                    </p>
                    {entry.dueDate && (
                      <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${soon ? 'text-amber-400' : 'text-[var(--space-text-muted)]'}`}>
                        <CalendarDays className="size-3 shrink-0" />
                        Due {fmtScheduleDate(entry.dueDate)}
                        {soon && (
                          <span className="text-[9px] px-1 py-px rounded-full bg-amber-400/10 border border-amber-400/20 ml-0.5">
                            Soon
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: 'var(--space-accent)' }}>
                    {fmtCurrency(entry.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}

      {footerLink && (
        <div className="px-4 py-2.5 bg-[rgba(255,255,255,0.02)]">
          <Link
            href={footerLink.href}
            className="text-[10px] text-[var(--space-text-muted)] hover:text-[var(--space-text-secondary)] transition-colors flex items-center gap-1"
          >
            {footerLink.label}
            <ArrowRight className="size-2.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
