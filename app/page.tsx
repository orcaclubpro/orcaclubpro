"use client";

import FloatingNavigation from "./components/floating-navigation"
import AnimatedBackground from "./components/animated-background"
import ScrollReveal from "./components/scroll-reveal"
import Link from "next/link"
import { ArrowRight, Code, Zap, Target, Brain, ChevronDown } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <FloatingNavigation />
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="min-h-screen relative z-10">
        <div className="max-w-6xl mx-auto px-8 text-center relative">
          {/* Strategic top padding to create centerpiece effect */}
          <div className="pt-32 md:pt-40">
            <ScrollReveal>
              <div className="text-reveal mb-20">
                <span className="block text-6xl md:text-8xl font-extralight tracking-tighter leading-tight mb-8">
                  We engineer
                </span>
                <span className="block text-6xl md:text-8xl font-light gradient-text tracking-tighter leading-tight mb-8">
                  competitive
                </span>
                <span className="block text-6xl md:text-8xl font-extralight tracking-tighter leading-tight">
                  advantages
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="pt-8 mb-20">
                <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                  Intelligent predators in the digital ecosystem. We don&apos;t just build software—we craft mathematical
                  precision into competitive dominance.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={800}>
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-20">
                <Link
                  href="/services"
                  className="group relative px-12 py-6 bg-linear-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-linear-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Initiate Project <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  href="/work"
                  className="text-lg font-light text-gray-300 hover:text-white transition-colors duration-300 flex items-center gap-2 magnetic"
                >
                  View Intelligence <ArrowRight size={16} className="opacity-50" />
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Scroll indicator positioned relative to bottom */}
          <ScrollReveal delay={1200}>
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
              <ChevronDown className="w-6 h-6 text-gray-500 animate-bounce" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-40 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-32">
              <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
                Precision-engineered <span className="gradient-text font-light">capabilities</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                Each solution architected with mathematical precision, designed for maximum cognitive impact.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left side - Services */}
            <div className="space-y-16">
              {[
                {
                  icon: Code,
                  title: "Interface Architecture",
                  description:
                    "Cognitive load reduction through mathematical design principles. Every pixel calculated for maximum psychological impact.",
                  metric: "300% conversion increase",
                },
                {
                  icon: Zap,
                  title: "Workflow Intelligence",
                  description:
                    "AI-powered automation that learns, adapts, and evolves. Transform repetitive processes into seamless operations.",
                  metric: "80% efficiency gain",
                },
                {
                  icon: Target,
                  title: "Visibility Engineering",
                  description:
                    "Technical SEO mastery combined with strategic positioning. Dominate search landscapes through precision.",
                  metric: "1000% organic growth",
                },
                {
                  icon: Brain,
                  title: "Neural Workflows",
                  description:
                    "Custom AI models that amplify human intelligence. Predictive analytics meets practical application.",
                  metric: "90% accuracy rate",
                },
              ].map((service, index) => (
                <ScrollReveal key={index} delay={index * 200}>
                  <div className="group workspace-card rounded-2xl p-10 morph">
                    <div className="flex items-start gap-8">
                      <div className="p-5 bg-linear-to-r from-blue-600/20 to-cyan-500/20 rounded-xl">
                        <service.icon className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-light mb-4 text-white group-hover:text-cyan-400 transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-gray-400 leading-relaxed mb-6 font-light text-lg">{service.description}</p>
                        <div className="text-sm text-cyan-400 font-mono">{service.metric}</div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Right side - Visual element */}
            <ScrollReveal delay={400}>
              <div className="relative">
                <div className="aspect-square bg-linear-to-br from-blue-600/10 to-cyan-500/10 rounded-3xl border border-cyan-400/20 relative overflow-hidden">
                  <div className="absolute inset-0 grid-pattern opacity-20" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-32 bg-linear-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-xl" />
                  </div>
                  <div className="absolute inset-8 border border-cyan-400/30 rounded-2xl" />
                  <div className="absolute inset-16 border border-blue-500/20 rounded-xl" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Intelligence Metrics */}
      <section className="py-40 px-8 border-t border-slate-800/50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-28">
              <h2 className="text-3xl md:text-4xl font-extralight mb-8">
                Measured <span className="gradient-text font-light">intelligence</span>
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                Performance metrics that define our competitive advantage in the digital ecosystem.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-4 gap-16">
            {[
              { metric: "99.97%", label: "System Reliability", sublabel: "Uptime guarantee" },
              { metric: "<850ms", label: "Response Time", sublabel: "Global average" },
              { metric: "50+", label: "Active Clients", sublabel: "By invitation only" },
              { metric: "∞", label: "Scalability", sublabel: "Infinite potential" },
            ].map((stat, index) => (
              <ScrollReveal key={index} delay={index * 150}>
                <div className="text-center group">
                  <div className="text-4xl md:text-5xl font-mono font-light text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {stat.metric}
                  </div>
                  <div className="text-xl font-light text-white mb-2">{stat.label}</div>
                  <div className="text-sm text-gray-500 font-light">{stat.sublabel}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-40 px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight mb-10 tracking-tight">
              Ready to evolve your <span className="gradient-text font-light">digital ecosystem</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-16 font-light leading-relaxed max-w-3xl mx-auto">
              We work with a carefully selected pod of clients. Limited availability ensures maximum attention to your
              competitive advantage.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-4 px-12 py-6 bg-linear-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-linear-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive mb-8"
            >
              Initiate Contact <ArrowRight size={20} />
            </Link>
            <p className="text-xs text-gray-600 font-light">
              By invitation • Limited capacity • Premium positioning
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl tracking-tight mb-6">
            <span className="font-extralight">ORCA</span>
            <span className="font-light gradient-text">CLUB</span>
          </div>
          <p className="text-gray-500 text-sm font-light">Intelligent digital predator • Mathematical precision</p>
        </div>
      </footer>
    </div>
  )
}
