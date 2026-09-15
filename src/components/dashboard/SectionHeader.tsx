/**
 * Section heading in the dashboard-home idiom: an accent tick beside the label,
 * with an optional right-hand aside for a count or a control.
 *
 * Lived inside `PackageDetailView` until the project detail route adopted the
 * same idiom. Copying it would have meant two headings drifting apart, so it
 * moved here whole — the package view imports it and renders exactly as before.
 */
export function SectionHeader({
  children,
  aside,
}: {
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-3">
        <div className="w-px h-4 bg-[var(--space-accent)]/40 rounded-full shrink-0" />
        <h2 className="text-sm font-semibold text-[var(--space-text-primary)]">{children}</h2>
      </div>
      {aside}
    </div>
  )
}
