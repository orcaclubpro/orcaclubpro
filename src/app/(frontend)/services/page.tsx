import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import {
  Code2,
  Zap,
  Target,
  Brain,
  ArrowRight,
  Sparkles,
  Rocket,
  Search,
} from "lucide-react"
import { getPayload } from "payload"
import config from "@payload-config"

// Icon mapping for dynamic icon selection
const iconMap: { [key: string]: any } = {
  Code2,
  Zap,
  Target,
  Brain,
  Sparkles,
  Rocket,
  Search,
}

export default async function ServicesPage() {
  // Fetch services from Payload
  const payload = await getPayload({ config })
  const servicesData = await payload.find({
    collection: 'services' as any,
    sort: 'displayOrder',
  })

  const services = servicesData.docs

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
              Our <span className="gradient-text font-light">Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-12">
              Tailored solutions designed to elevate your business.
              From elegant web design to intelligent automation, we bring your vision to life.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {services.length > 0 ? (
            <div className="flex justify-center">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service: any, index: number) => {
                const IconComponent = iconMap[service.icon] || Code2

                return (
                  <ScrollReveal key={service.id || index} delay={index * 150}>
                    <div className="workspace-card rounded-3xl p-8 group morph h-full flex flex-col">
                      {/* Icon without background overlay */}
                      <div className="mb-6 inline-flex w-fit group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-16 h-16 text-cyan-400" />
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-light mb-4 text-white group-hover:text-cyan-400 transition-colors">
                        {service.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-400 leading-relaxed font-light text-base flex-grow mb-6">
                        {service.description}
                      </p>

                      {/* Category Badge */}
                      <div className="mt-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-400/10 border border-cyan-400/20 rounded-full">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span className="text-xs text-cyan-400 font-light capitalize">
                            {service.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                )
              })}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 font-light text-lg">
                No services available at the moment. Please check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8 border-t border-slate-800/50 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
              Ready to get <span className="gradient-text font-light">started</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
              Let&apos;s discuss how we can create tailored solutions that make your business
              more efficient, more profitable, and more competitive.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                Start Your Project <ArrowRight size={20} />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors magnetic"
              >
                View Our Work <ArrowRight size={16} className="opacity-50" />
              </Link>
            </div>
            <p className="text-xs text-gray-600 mt-8 font-light">
              Free consultation • Custom solutions • Transparent pricing
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-16 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl tracking-tight mb-4">
            <span className="font-extralight">ORCA</span>
            <span className="font-light gradient-text">CLUB</span>
          </div>
          <p className="text-gray-500 text-sm font-light">Software Agency • Tailored Solutions • Smarter Workflows</p>
        </div>
      </footer>
    </div>
  )
}
