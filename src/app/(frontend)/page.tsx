import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import HeroSection from "@/components/sections/HeroSection"
import RenderBlocks from "@/components/blocks/RenderBlocks"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getCachedClients, getCachedHomePage } from "@/lib/payload/cached-queries"
import { buildMetadata } from "@/lib/seo/meta"

export const metadata = buildMetadata({
  // TODO(chance): confirm final home title/description wording
  title: "ORCACLUB | Websites That Get Found — Orange County",
  description:
    "Websites built and run by one senior operator in Orange County. Payload CMS and Shopify builds, plus a get-found system that covers Google and AI search. Fixed quotes, fast delivery.",
  path: "/",
})

// The funnel: home routes to the two hubs and /pricing. Nothing else — every
// other path (contact, money pages) is reached through them or the nav.
const HUBS = [
  {
    title: "Websites",
    href: "/websites",
    eyebrow: "Build",
    blurb:
      "Payload CMS and Shopify builds shipped in weeks, not months. Fixed scope, fixed quote, full ownership at handoff.",
  },
  {
    title: "Get Found",
    href: "/get-found",
    eyebrow: "Visibility",
    blurb:
      "One system for showing up everywhere it matters — Google, Maps, ads, and AI search. Start with the audit.",
  },
] as const

export default async function HomePage() {
  // Fetch clients and CMS home page in parallel using cached queries
  let clients: any[] = []
  let homePage: any = null
  try {
    const [clientsData, pagesData] = await Promise.all([
      getCachedClients(),
      getCachedHomePage(),
    ])
    clients = clientsData.docs
    homePage = pagesData.docs[0] ?? null
  } catch {
    // Pages collection may not exist yet or no home page created
  }

  const hasCmsLayout = homePage?.layout && Array.isArray(homePage.layout) && homePage.layout.length > 0

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {hasCmsLayout ? (
        // CMS-managed layout
        <RenderBlocks blocks={homePage.layout} />
      ) : (
        <>
          {/* Hero — brand + outcome one-liner, proof via client carousel */}
          <HeroSection
            clients={clients}
            subheading="Websites that get you found. Built by one senior operator."
            primaryButtonLabel="What we build"
            primaryButtonHref="/websites"
            secondaryButtonLabel="See pricing"
            secondaryButtonHref="/pricing"
          />

          {/* The two hubs */}
          <section className="py-40 px-8 relative z-10">
            <div className="max-w-5xl mx-auto">
              <ScrollReveal>
                <div className="text-center mb-24">
                  <p className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-light mb-5">
                    Two Ways In
                  </p>
                  <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
                    Build it. Then get it <span className="gradient-text font-light">found</span>.
                  </h2>
                  <div className="mx-auto w-6 h-px bg-cyan-400/40 mb-8" />
                  <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                    Everything ORCACLUB does lives in one of two systems — a website
                    built right, and a visibility engine that puts it in front of the
                    people searching for it.
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid md:grid-cols-2 gap-6">
                {HUBS.map((hub, i) => (
                  <ScrollReveal key={hub.href} delay={i * 120}>
                    <Link
                      href={hub.href}
                      className="group block h-full p-10 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:bg-white/[0.05] hover:border-cyan-400/30 transition-all duration-500"
                    >
                      <p className="text-[10px] tracking-[0.3em] uppercase text-cyan-400/60 font-light mb-4">
                        {hub.eyebrow}
                      </p>
                      <h3 className="text-2xl font-extralight text-white mb-4 tracking-tight">
                        {hub.title}
                      </h3>
                      <p className="text-gray-400 font-light leading-relaxed mb-8">{hub.blurb}</p>
                      <span className="inline-flex items-center gap-2 text-sm font-light text-cyan-400 group-hover:gap-3 transition-all duration-300">
                        Explore {hub.title.toLowerCase()} <ArrowRight size={16} />
                      </span>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* Closing CTA — drains to /pricing, the decision page */}
          <section className="py-40 px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <ScrollReveal>
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-light mb-5">
                  Get Started
                </p>
                <h2 className="text-4xl md:text-5xl font-extralight mb-6 tracking-tight">
                  One page. Every <span className="gradient-text font-light">price</span>.
                </h2>
                <div className="mx-auto w-6 h-px bg-cyan-400/40 mb-8" />
                <p className="text-lg text-gray-400 mb-16 font-light leading-relaxed max-w-2xl mx-auto">
                  No opaque quotes. No lengthy sales cycles. Every offer, scoped and
                  priced in writing, on a single page.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-4 px-12 py-5 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-md text-base font-light text-cyan-400 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
                  >
                    See Pricing <ArrowRight size={18} />
                  </Link>
                </div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-white/15 font-light">
                  Fixed Quotes · Fast Delivery · Direct Operator Access
                </p>
              </ScrollReveal>
            </div>
          </section>
        </>
      )}

      {/* Footer is now in the layout */}
    </div>
  )
}
