import { cn } from '@/lib/utils'

// ── Skeleton primitives ───────────────────────────────────────────────────────
// Server components — pure markup, animated by the .skel class in globals.css.
// Surfaces use the same theme tokens and radii as real cards so the swap to
// content is a non-event: same containers, same shapes, no layout shift.

export function Skel({ className }: { className?: string }) {
  return <div className={cn('skel', className)} />
}

function SkelCard({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={cn('rounded-xl border p-5', className)}
      style={{ background: 'var(--space-bg-card)', borderColor: 'var(--space-border)' }}
    >
      {children}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-20">
      {children}
    </div>
  )
}

function Header() {
  return (
    <div className="space-y-2.5 mb-8">
      <Skel className="h-7 w-44" />
      <Skel className="h-3.5 w-64" />
    </div>
  )
}

function Row() {
  return (
    <SkelCard className="flex items-center gap-4 p-4">
      <Skel className="size-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skel className="h-3.5 w-1/3" />
        <Skel className="h-3 w-1/5" />
      </div>
      <Skel className="h-3.5 w-16" />
    </SkelCard>
  )
}

// ── Route skeletons ───────────────────────────────────────────────────────────

/** Home: greeting + stat cards + two content panels. */
export function HomeSkeleton() {
  return (
    <Shell>
      <Header />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map(i => (
          <SkelCard key={i} className="space-y-3">
            <Skel className="h-3 w-20" />
            <Skel className="h-6 w-28" />
          </SkelCard>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <SkelCard key={i} className="space-y-3.5 min-h-[240px]">
            <Skel className="h-3.5 w-32" />
            <Skel className="h-3 w-full" />
            <Skel className="h-3 w-5/6" />
            <Skel className="h-3 w-2/3" />
          </SkelCard>
        ))}
      </div>
    </Shell>
  )
}

/** Lists: search bar + stacked rows (clients, files, invoices, accounts). */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Shell>
      <Header />
      <Skel className="h-10 w-full sm:w-80 rounded-lg mb-5" />
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => <Row key={i} />)}
      </div>
    </Shell>
  )
}

/** Card grids: projects carousel, packages. */
export function GridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <Shell>
      <Header />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: cards }, (_, i) => (
          <SkelCard key={i} className="space-y-3.5 min-h-[180px]">
            <Skel className="h-4 w-2/3" />
            <Skel className="h-3 w-1/3" />
            <div className="pt-4 space-y-2">
              <Skel className="h-3 w-full" />
              <Skel className="h-3 w-4/5" />
            </div>
          </SkelCard>
        ))}
      </div>
    </Shell>
  )
}

/** Board: three task columns of stacked cards. */
export function BoardSkeleton() {
  return (
    <Shell>
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map(col => (
          <div key={col} className="space-y-3">
            <Skel className="h-3.5 w-24" />
            {[0, 1, 2].map(card => (
              <SkelCard key={card} className="space-y-2.5 p-4">
                <Skel className="h-3.5 w-5/6" />
                <Skel className="h-3 w-1/2" />
              </SkelCard>
            ))}
          </div>
        ))}
      </div>
    </Shell>
  )
}
