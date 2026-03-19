export default function Loading() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Hero */}
      <section className="relative z-10 pt-32 pb-24 px-8">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-3 w-36 bg-white/[0.05] rounded mb-6" />
          <div className="h-14 w-3/4 bg-white/[0.05] rounded mb-4" />
          <div className="h-14 w-1/2 bg-white/[0.04] rounded mb-8" />
          <div className="h-4 w-2/3 bg-white/[0.04] rounded mb-3" />
          <div className="h-4 w-1/2 bg-white/[0.03] rounded mb-12" />
          <div className="h-12 w-48 bg-white/[0.05] rounded-full" />
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 max-w-5xl mx-auto px-8">
        <div className="h-px bg-white/[0.04]" />
      </div>

      {/* Solutions grid */}
      <section className="relative z-10 py-24 px-8">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.06]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-8 bg-black min-h-[220px] flex flex-col gap-4">
                <div className="h-2 w-6 bg-white/[0.04] rounded" />
                <div className="h-5 w-2/3 bg-white/[0.05] rounded" />
                <div className="h-3 w-full bg-white/[0.03] rounded" />
                <div className="h-3 w-5/6 bg-white/[0.03] rounded" />
                <div className="mt-auto flex items-center justify-between">
                  <div className="h-2 w-20 bg-white/[0.03] rounded" />
                  <div className="h-4 w-4 bg-white/[0.04] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-28 px-8">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="rounded-3xl border border-white/[0.06] p-12 md:p-16 text-center bg-white/[0.02]">
            <div className="h-3 w-24 bg-white/[0.04] rounded mx-auto mb-5" />
            <div className="h-10 w-2/3 bg-white/[0.05] rounded mx-auto mb-4" />
            <div className="h-4 w-3/4 bg-white/[0.03] rounded mx-auto mb-10" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="h-12 w-44 bg-white/[0.05] rounded-full mx-auto sm:mx-0" />
              <div className="h-12 w-36 bg-white/[0.04] rounded-full mx-auto sm:mx-0" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
