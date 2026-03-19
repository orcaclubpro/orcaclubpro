export default function Loading() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Hero */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center animate-pulse">
          <div className="h-16 w-2/3 bg-white/[0.05] rounded mx-auto mb-6" />
          <div className="h-5 w-3/4 bg-white/[0.04] rounded mx-auto mb-3" />
          <div className="h-5 w-1/2 bg-white/[0.03] rounded mx-auto mb-12" />
        </div>
      </section>

      {/* Services sections — one tall skeleton per service */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-32 md:space-y-40 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="relative min-h-[500px] flex flex-col md:flex-row gap-12 items-start">
              {/* Content block */}
              <div className="max-w-md flex flex-col gap-4 flex-shrink-0">
                <div className="h-6 w-36 bg-white/[0.05] rounded-full" />
                <div className="h-10 w-full bg-white/[0.05] rounded" />
                <div className="h-6 w-4/5 bg-white/[0.04] rounded" />
                <div className="h-4 w-full bg-white/[0.03] rounded" />
                <div className="h-4 w-5/6 bg-white/[0.03] rounded" />
                <div className="space-y-2 mt-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-3 w-3/4 bg-white/[0.03] rounded" />
                  ))}
                </div>
                <div className="flex gap-3 mt-2">
                  <div className="h-10 w-28 bg-white/[0.05] rounded-lg" />
                  <div className="h-10 w-28 bg-white/[0.04] rounded-lg" />
                </div>
              </div>

              {/* Visual block */}
              <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/[0.05] min-h-[300px]" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-8 border-t border-white/[0.04] relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-pulse">
          <div className="h-10 w-2/3 bg-white/[0.05] rounded mx-auto mb-6" />
          <div className="h-5 w-3/4 bg-white/[0.04] rounded mx-auto mb-4" />
          <div className="h-5 w-1/2 bg-white/[0.03] rounded mx-auto mb-12" />
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <div className="h-14 w-48 bg-white/[0.05] rounded-full mx-auto sm:mx-0" />
            <div className="h-14 w-36 bg-white/[0.04] rounded-full mx-auto sm:mx-0" />
          </div>
        </div>
      </section>
    </div>
  )
}
