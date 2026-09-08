'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Files, ArrowRight, Plus, Link2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionHeader } from './SectionHeader'
import { PackageDocumentsModal } from './PackageDocumentsModal'
import { linkPackageToProject } from '@/actions/packages'
import { fmt, statusStyle, computeTotals, type ProjectPackage } from './package-detail/utils'

/**
 * The proposals raised against a project, and the things staff most often want
 * to do with one without leaving the project.
 *
 * Deliberately not a second package editor: line items, pricing, and the payment
 * schedule are edited on the package's own page, which is one click away. What
 * lives here is the read of where each package stands and the Documents panel —
 * proposal, invoice, and Scope of Work preview and send — because those are what
 * gets reached for mid-project.
 */
export function ProjectPackagesTab({
  packages,
  candidates = [],
  projectId,
  clientName,
  username,
  readOnly,
}: {
  packages: ProjectPackage[]
  /** The client's other proposals, offered for linking. */
  candidates?: ProjectPackage[]
  projectId: string
  clientName?: string | null
  username: string
  readOnly?: boolean
}) {
  const router = useRouter()
  const [docsFor, setDocsFor] = useState<string | null>(null)
  const [linking, setLinking] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function link(packageId: string) {
    setLinking(packageId)
    startTransition(async () => {
      const res = await linkPackageToProject(packageId, projectId)
      setLinking(null)
      if (res.success) router.refresh()
    })
  }

  const card = (pkg: ProjectPackage, candidate: boolean) => {
    // Add-ons are options the client has not taken, so they stay out of every
    // total here for the same reason they stay out of the package PDF.
    const included = (pkg.lineItems ?? []).filter(i => !i.isAddOn)
    const { oneTime, monthly, annual } = computeTotals(included)
    const total = oneTime + monthly + annual
    const invoicedPct = total > 0 ? Math.min(100, (pkg.invoiced / total) * 100) : 0
    const paidPct = total > 0 ? Math.min(100, (pkg.paid / total) * 100) : 0
    const href = pkg.clientId ? `/u/${username}/clients/${pkg.clientId}/packages/${pkg.id}` : null

    return (
      <div key={pkg.id} className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="text-sm font-semibold text-[var(--space-text-primary)] truncate">{pkg.name}</p>
              <span className={cn(
                'text-[0.5625rem] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border shrink-0',
                statusStyle(pkg.status),
              )}>
                {pkg.status ?? 'draft'}
              </span>
            </div>
            <p className="text-xs text-[var(--space-text-muted)] mt-1 tabular-nums">
              {[
                oneTime > 0 ? `${fmt(oneTime)} one-time` : null,
                monthly > 0 ? `${fmt(monthly)}/mo` : null,
                annual > 0 ? `${fmt(annual)}/yr` : null,
              ].filter(Boolean).join(' · ') || 'No priced items'}
              <span className="text-[var(--space-divider)]"> · </span>
              {included.length} {included.length === 1 ? 'service' : 'services'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!readOnly && candidate && (
              <button
                type="button"
                onClick={() => link(pkg.id)}
                disabled={linking === pkg.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-40 transition-all"
                style={{ color: 'var(--space-accent)' }}
              >
                {linking === pkg.id ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
                Link to project
              </button>
            )}
            {!readOnly && !candidate && (
              <button
                type="button"
                onClick={() => setDocsFor(pkg.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--space-border-hard)] text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] transition-all"
              >
                <Files className="size-3.5" />
                Documents
              </button>
            )}
            {href && (
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all',
                  candidate
                    ? 'border-[var(--space-border-hard)] text-[var(--space-text-secondary)] hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] font-medium'
                    : 'border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] hover:bg-[rgba(139,156,182,0.10)] font-semibold',
                )}
                style={candidate ? undefined : { color: 'var(--space-accent)' }}
              >
                Open package
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Invoiced / paid, same two-tone bar the package page uses. */}
        {total > 0 && pkg.invoiced > 0 && (
          <div className="space-y-1.5 max-w-md">
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
                <span className={pkg.paid > 0 ? 'text-emerald-400' : ''}>{fmt(pkg.invoiced)}</span> invoiced
              </span>
              <span>{fmt(Math.max(0, total - pkg.invoiced))} remaining</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader
          aside={<span className="text-xs text-[var(--space-text-muted)] tabular-nums">{packages.length}</span>}
        >
          Packages
        </SectionHeader>

        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 rounded-xl border border-[var(--space-border-hard)] bg-[rgba(255,255,255,0.02)] text-center">
            <Package className="size-8 text-[var(--space-text-muted)] mb-3" />
            <p className="text-sm text-[var(--space-text-tertiary)]">No package is linked to this project yet</p>
            <p className="text-xs text-[var(--space-text-muted)] mt-1 max-w-sm leading-relaxed">
              {candidates.length > 0
                ? 'The client\u2019s proposals are below — link one and it will show here and in the sidebar.'
                : 'A proposal links itself through the Link to project control on its own page.'}
            </p>
            {candidates.length === 0 && !readOnly && (
              <Link
                href={`/u/${username}/packages`}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--space-accent)] hover:underline"
              >
                <Plus className="size-3.5" />
                Go to packages
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden divide-y divide-[var(--space-divider)]">
            {packages.map(pkg => card(pkg, false))}
          </div>
        )}
      </div>

      {/* Unlinked proposals belonging to the same client. The link is manual and
          rarely set, so offering it here is what makes the tab useful at all. */}
      {!readOnly && candidates.length > 0 && (
        <div>
          <SectionHeader
            aside={<span className="text-xs text-[var(--space-text-muted)] tabular-nums">{candidates.length}</span>}
          >
            {clientName ? `Other packages for ${clientName}` : 'Other packages for this client'}
          </SectionHeader>
          <p className="text-[0.625rem] text-[var(--space-text-muted)] leading-relaxed -mt-1 mb-3">
            Not linked to this project. Linking one only sets the link — it does not touch pricing or status.
          </p>
          <div className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden divide-y divide-[var(--space-divider)] opacity-90">
            {candidates.map(pkg => card(pkg, true))}
          </div>
        </div>
      )}

      {docsFor && (
        <PackageDocumentsModal
          packageId={docsFor}
          username={username}
          onClose={() => setDocsFor(null)}
        />
      )}
    </div>
  )
}
