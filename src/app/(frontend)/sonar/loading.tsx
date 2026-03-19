export default function Loading() {
  return (
    <div className="min-h-screen bg-black relative">
      {/* Hero */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="text-center mb-12">
            <div className="h-16 w-48 bg-white/[0.05] rounded mx-auto mb-6" />
            <div className="h-5 w-2/3 bg-white/[0.04] rounded mx-auto mb-3" />
            <div className="h-5 w-1/2 bg-white/[0.03] rounded mx-auto" />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-3 justify-center mb-16">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-28 bg-white/[0.04] rounded-full" />
            ))}
          </div>
        </div>
      </section>

      {/* Featured post */}
      <section className="pb-20 px-8 relative z-10">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.02]">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Featured image area */}
              <div className="h-80 md:h-72 bg-white/[0.03]" />
              {/* Content area */}
              <div className="p-8 md:p-12 flex flex-col gap-4">
                <div className="h-6 w-20 bg-white/[0.05] rounded-full" />
                <div className="h-8 w-5/6 bg-white/[0.05] rounded" />
                <div className="h-8 w-2/3 bg-white/[0.04] rounded" />
                <div className="h-4 w-full bg-white/[0.03] rounded" />
                <div className="h-4 w-5/6 bg-white/[0.03] rounded" />
                <div className="h-4 w-4/6 bg-white/[0.03] rounded" />
                <div className="flex gap-4 mt-2">
                  <div className="h-3 w-24 bg-white/[0.04] rounded" />
                  <div className="h-3 w-24 bg-white/[0.04] rounded" />
                  <div className="h-3 w-20 bg-white/[0.04] rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regular posts grid */}
      <section className="pb-40 px-8 relative z-10">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col">
                {/* Image placeholder */}
                <div className="h-48 bg-white/[0.03]" />
                {/* Card content */}
                <div className="p-6 flex flex-col gap-3 flex-grow">
                  <div className="h-5 w-16 bg-white/[0.04] rounded-full" />
                  <div className="h-5 w-full bg-white/[0.05] rounded" />
                  <div className="h-5 w-4/5 bg-white/[0.04] rounded" />
                  <div className="h-3 w-full bg-white/[0.03] rounded mt-1" />
                  <div className="h-3 w-5/6 bg-white/[0.03] rounded" />
                  <div className="h-3 w-4/6 bg-white/[0.03] rounded" />
                </div>
                {/* Footer */}
                <div className="p-6 pt-0 border-t border-white/[0.04] flex justify-between">
                  <div className="h-3 w-24 bg-white/[0.04] rounded" />
                  <div className="h-3 w-16 bg-white/[0.04] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
