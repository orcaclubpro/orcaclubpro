import { Skel } from '@/components/dashboard/LoadingSkeleton'

// Matches AnalyticsView's shell exactly — same max width, padding and true-scale
// opt-out — so the swap to real content shifts nothing. The generic `Shell` in
// LoadingSkeleton is a rem-scaled max-w-7xl and would jump on arrival.
export default function Loading() {
  return (
    <div
      className="space-true-scale mx-auto w-full px-6 pb-24 pt-10 sm:px-10"
      style={{ maxWidth: '1180px' }}
    >
      <header className="flex flex-wrap items-end justify-between gap-6 pb-10">
        <div className="min-w-0 flex-1">
          <Skel className="h-[40px] w-[200px] rounded-lg" />
          <Skel className="mt-4 h-[15px] w-full max-w-[420px] rounded" />
          <Skel className="mt-2 h-[15px] w-[60%] max-w-[280px] rounded" />
        </div>
        <Skel className="h-[36px] w-[38px] rounded-lg" />
      </header>

      {/* Four score cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border p-4"
            style={{ borderColor: 'var(--space-border-hard)' }}
          >
            <Skel className="h-[13px] w-[96px] rounded" />
            <Skel className="mt-3 h-[34px] w-[128px] rounded" />
            <Skel className="mt-3 h-[13px] w-[104px] rounded" />
            <Skel className="mt-5 h-[3px] w-full rounded-full" />
            <Skel className="mt-4 h-[12px] w-[120px] rounded" />
          </div>
        ))}
      </div>

      {/* Definition strip */}
      <div
        className="mt-6 rounded-xl border px-4 py-3.5"
        style={{ borderColor: 'var(--space-border-hard)' }}
      >
        <Skel className="h-[14px] w-[70%] rounded" />
        <Skel className="mt-2 h-[13px] w-full rounded" />
      </div>

      {/* The open study */}
      <div className="pt-14">
        <Skel className="h-[15px] w-[180px] rounded" />
        <Skel className="mt-6 h-[160px] w-full rounded-lg" />
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <Skel className="h-[20px] w-[72px] rounded" />
              <Skel className="mt-2 h-[13px] w-[88px] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
