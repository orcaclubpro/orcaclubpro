import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import AnimatedBackground from '@/components/layout/animated-background'
import ScrollReveal from '@/components/layout/scroll-reveal'

export const metadata: Metadata = {
  title: 'Solutions | ORCACLUB',
  description:
    'The proven solutions ORCACLUB uses to solve real business problems — from headless commerce to workflow automation.',
  openGraph: {
    title: 'Solutions | ORCACLUB',
    description:
      'Proven technical solutions for modern businesses. Built and refined by ORCACLUB.',
    url: 'https://orcaclub.pro/solutions',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solutions | ORCACLUB',
    description: 'Proven technical solutions for modern businesses.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/solutions',
  },
}

export default async function SolutionsPage() {
  const payload = await getPayload({ config })

  const { docs: solutions } = await payload.find({
    collection: 'solutions',
    limit: 100,
    overrideAccess: false,
    sort: 'createdAt',
  })

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-24 px-8">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <p className="text-xs tracking-[0.3em] uppercase text-cyan-400/70 font-light mb-6">
              ORCACLUB Solutions
            </p>
            <h1 className="text-5xl md:text-7xl font-extralight text-white mb-8 tracking-tight leading-[1.1]">
              Start a project{' '}
              <span className="gradient-text font-light">today.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl font-light leading-relaxed mb-4">
              These are the exact solutions we use to build, automate, and scale
              operations for our clients.
            </p>
            <p className="text-base text-gray-500 max-w-xl font-light leading-relaxed mb-12">
              Every solution is battle-tested, documented, and ready to deploy for
              your business — not prototypes, not experiments.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-400/30 rounded-full text-sm font-light text-cyan-400 hover:from-cyan-500/25 hover:to-blue-500/25 hover:border-cyan-400/50 transition-all duration-300"
            >
              Book a consultation
              <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 max-w-5xl mx-auto px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Solutions grid */}
      <section className="relative z-10 py-24 px-8">
        <div className="max-w-5xl mx-auto">

          {solutions.length === 0 ? (
            <ScrollReveal>
              <div className="text-center py-24">
                <p className="text-gray-600 font-light text-lg">Solutions coming soon.</p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.06]">
              {solutions.map((solution, i) => (
                <ScrollReveal key={solution.id} delay={i * 60}>
                  <Link
                    href={`/solutions/${solution.slug}`}
                    className="group relative flex flex-col justify-between p-8 bg-black hover:bg-white/[0.02] transition-colors duration-300 min-h-[220px]"
                  >
                    {/* Number */}
                    <span className="text-[10px] tracking-[0.3em] text-white/15 font-light mb-4 block">
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-light text-white mb-3 leading-tight group-hover:text-cyan-400 transition-colors duration-300">
                        {solution.title}
                      </h2>
                      {solution.description && (
                        <p className="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">
                          {solution.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-light tracking-wide">
                        Read solution
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>

                    {/* Hover accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-500/0 via-cyan-400/40 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-28 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="workspace-card rounded-3xl p-12 md:p-16 text-center">
            <ScrollReveal>
              <p className="text-xs tracking-[0.3em] uppercase text-cyan-400/60 font-light mb-5">
                Ready to build?
              </p>
              <h2 className="text-4xl md:text-5xl font-extralight text-white mb-6 tracking-tight leading-tight">
                Not sure which solution fits?
              </h2>
              <p className="text-lg text-gray-400 font-light leading-relaxed max-w-2xl mx-auto mb-10">
                We scope every engagement before any work begins. Tell us what you're
                trying to solve — we'll find the right path.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500/80 to-cyan-400/80 text-black font-semibold rounded-full hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 text-sm shadow-lg shadow-cyan-900/20"
                >
                  Start your project
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/packages"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-white/10 text-gray-400 font-light rounded-full hover:border-white/20 hover:text-white transition-all duration-300 text-sm"
                >
                  View packages
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  )
}
