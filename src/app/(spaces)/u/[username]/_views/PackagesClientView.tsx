'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, ArrowRight, ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LineItem {
  name: string
  description?: string | null
  price: number
  quantity?: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

interface PackageDoc {
  id: string
  name: string
  description?: string | null
  lineItems?: LineItem[]
}

interface PackagesClientViewProps {
  clientPackages: PackageDoc[]
  username: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function computeTotals(lineItems: LineItem[] = []) {
  let oneTime = 0, monthly = 0, annual = 0
  for (const item of lineItems) {
    const total = (item.price ?? 0) * (item.quantity ?? 1)
    if (item.isRecurring) {
      if (item.recurringInterval === 'year') annual += total
      else monthly += total
    } else {
      oneTime += total
    }
  }
  return { oneTime, monthly, annual }
}

export function PackagesClientView({ clientPackages, username }: PackagesClientViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (clientPackages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-10 pb-20">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07]"
          style={{ background: 'linear-gradient(145deg, #181818 0%, #111 100%)' }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-64 rounded-full bg-[#67e8f9]/[0.02] blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center py-20 px-6">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-6">
              <Sparkles className="size-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Your packages are on the way</h3>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              Your team is putting together custom service packages for you. They&apos;ll appear here once ready.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-10 pb-20 space-y-5">
      <div className="flex items-baseline gap-3">
        <h2 className="text-xl font-bold text-white tracking-tight">Your Packages</h2>
        <span className="text-xs text-gray-600 tabular-nums">{clientPackages.length}</span>
      </div>

      {clientPackages.map((pkg) => {
        const { oneTime, monthly, annual } = computeTotals(pkg.lineItems ?? [])
        const lineItems = pkg.lineItems ?? []
        const isExpanded = expandedId === pkg.id
        const hasItems = lineItems.length > 0

        return (
          <div
            key={pkg.id}
            className={cn(
              'rounded-2xl border overflow-hidden transition-all duration-300',
              isExpanded
                ? 'border-[#67e8f9]/20'
                : 'border-white/[0.07] hover:border-white/[0.12]',
            )}
            style={{ background: 'linear-gradient(145deg, #191919 0%, #121212 100%)' }}
          >
            {/* Glow bar */}
            <div className={cn(
              'h-px transition-all duration-500',
              isExpanded
                ? 'bg-gradient-to-r from-transparent via-[#67e8f9]/60 to-transparent'
                : 'bg-gradient-to-r from-transparent via-white/[0.06] to-transparent',
            )} />

            {/* Card header */}
            <div className="px-7 pt-7 pb-6">
              <p className="text-[10px] font-bold text-[#67e8f9]/60 uppercase tracking-[0.3em] mb-4">
                Service Package
              </p>

              <h3 className="text-2xl font-bold text-white leading-tight mb-2">{pkg.name}</h3>

              {pkg.description && (
                <p className="text-sm text-gray-400 leading-relaxed mb-6">{pkg.description}</p>
              )}

              {/* Pricing numbers */}
              {hasItems && (oneTime > 0 || monthly > 0 || annual > 0) ? (
                <div className="flex items-end gap-8 flex-wrap">
                  {oneTime > 0 && (
                    <div>
                      <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{fmt(oneTime)}</p>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">one-time</p>
                    </div>
                  )}
                  {monthly > 0 && (
                    <div>
                      <div className="flex items-baseline gap-0.5">
                        <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{fmt(monthly)}</p>
                        <p className="text-lg text-gray-500 font-normal">/mo</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">per month</p>
                    </div>
                  )}
                  {annual > 0 && (
                    <div>
                      <div className="flex items-baseline gap-0.5">
                        <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{fmt(annual)}</p>
                        <p className="text-lg text-gray-500 font-normal">/yr</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">per year</p>
                    </div>
                  )}
                  <div className="pb-0.5">
                    <p className="text-3xl font-bold text-white">{lineItems.length}</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
                      {lineItems.length === 1 ? 'service' : 'services'}
                    </p>
                  </div>
                </div>
              ) : hasItems ? (
                <div>
                  <p className="text-3xl font-bold text-white">{lineItems.length}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
                    {lineItems.length === 1 ? 'service included' : 'services included'}
                  </p>
                </div>
              ) : null}
            </div>

            {/* What's included trigger */}
            {hasItems && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
                <button
                  onClick={() => setExpandedId(isExpanded ? null : pkg.id)}
                  className="w-full px-7 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-medium text-gray-300">
                    {isExpanded ? "Hide details" : "What's included"}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/u/${username}/packages/${pkg.id}/print`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#67e8f9] transition-colors"
                    >
                      <FileText className="size-3.5" />
                      View full package
                      <ArrowRight className="size-3" />
                    </Link>
                    {isExpanded
                      ? <ChevronUp className="size-4 text-gray-500" />
                      : <ChevronDown className="size-4 text-gray-500" />
                    }
                  </div>
                </button>
              </>
            )}

            {/* Expanded — included services */}
            {isExpanded && (
              <div className="border-t border-white/[0.06] px-7 py-6"
                style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lineItems.map((item, i) => {
                    const qty = item.quantity ?? 1
                    const total = (item.price ?? 0) * qty
                    return (
                      <div
                        key={i}
                        className="flex flex-col gap-3 p-4 rounded-xl border border-white/[0.06]"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 size-5 rounded-full bg-[#67e8f9]/15 border border-[#67e8f9]/35 flex items-center justify-center shrink-0">
                            <Check className="size-3 text-[#67e8f9]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white leading-snug">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pl-8">
                          {item.isRecurring && (
                            <span className="text-[10px] text-[#67e8f9]/80 uppercase tracking-widest font-medium">
                              {item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
                            </span>
                          )}
                          <span className="ml-auto text-sm font-bold text-white tabular-nums font-mono">
                            {fmt(total)}
                            {item.isRecurring && (
                              <span className="text-xs font-normal text-gray-500 font-sans">
                                /{item.recurringInterval === 'year' ? 'yr' : 'mo'}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
