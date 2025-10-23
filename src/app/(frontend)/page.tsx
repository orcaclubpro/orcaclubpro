"use client";

import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import DynamicGreeting from "@/components/layout/dynamic-greeting"
import WorkflowCanvas from "@/components/layout/workflow-canvas"
import Link from "next/link"
import {
  ArrowRight,
  Zap,
  Target,
  Brain,
  Code2
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="min-h-screen relative z-10">
        <div className="max-w-6xl mx-auto px-8 text-center relative">
          {/* Strategic top padding to create centerpiece effect */}
          <div className="pt-32 md:pt-40">
            <ScrollReveal>
              <DynamicGreeting className="mb-20" />
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="pt-8 mb-20">
                <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto font-light leading-relaxed">
                  <span className="text-cyan-400 font-medium">Orcaclub</span>, the software club that crafts tailored solutions to create smarter workflows. 
                  From elegant web design to AI-powered automation, we transform how businesses operate in the digital age.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={800}>
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-20">
                <Link
                  href="/services"
                  className="group relative px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Start Your Project <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  href="/portfolio"
                  className="text-lg font-light text-gray-300 hover:text-white transition-colors duration-300 flex items-center gap-2 magnetic"
                >
                  View Our Work <ArrowRight size={16} className="opacity-50" />
                </Link>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-40 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-32">
              <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
                Tailored <span className="gradient-text font-light">solutions</span> for modern business
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                We believe every business deserves software that works perfectly for their unique needs. 
                Here&apos;s how we make that happen.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left side - Services */}
            <div className="space-y-16">
              {[
                {
                  icon: Code2,
                  title: "Elegant Web Design",
                  description:
                    "Beautiful, responsive websites that convert visitors into customers. We focus on user experience, performance, and modern design principles that make your brand stand out.",
                  metric: "95% client satisfaction",
                },
                {
                  icon: Zap,
                  title: "Workflow Automation",
                  description:
                    "Automate repetitive processes and streamline operations with custom solutions. From data processing to customer communications, we help you work smarter, not harder.",
                  metric: "60% time savings average",
                },
                {
                  icon: Target,
                  title: "Visibility Engineering",
                  description:
                    "Get found by the right customers with strategic SEO and digital marketing solutions. We help businesses increase their online presence and drive organic growth.",
                  metric: "300% search visibility boost",
                },
                {
                  icon: Brain,
                  title: "AI Workflows",
                  description:
                    "Deploy intelligent AI agents that handle customer service, content creation, and data analysis. Custom AI solutions that integrate seamlessly with your existing systems.",
                  metric: "24/7 intelligent assistance",
                },
              ].map((service, index) => (
                <ScrollReveal key={index} delay={index * 200}>
                  <div className="group workspace-card rounded-2xl p-10 morph">
                    <div className="flex items-start gap-8">
                      <div className="p-5 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-xl">
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

            {/* Right side - Interactive Workflow Canvas */}
            <ScrollReveal delay={400}>
              <div className="relative">
                <WorkflowCanvas />
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
                Proven <span className="gradient-text font-light">results</span> that matter
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                We measure success by the impact we create for our clients. Here&apos;s what working with us delivers.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-4 gap-16">
            {[
              { metric: "150+", label: "Projects Delivered", sublabel: "Across all industries" },
              { metric: "99.9%", label: "Uptime Guarantee", sublabel: "Reliable performance" },
              { metric: "30+", label: "Happy Clients", sublabel: "Long-term partnerships" },
              { metric: "24/7", label: "Support Available", sublabel: "Always here to help" },
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
              Ready to transform your <span className="gradient-text font-light">business workflows</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-16 font-light leading-relaxed max-w-3xl mx-auto">
              Let&apos;s discuss how we can create tailored solutions that make your business more efficient, 
              more profitable, and more competitive in today&apos;s digital landscape.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive mb-8"
            >
              Start Your Project <ArrowRight size={20} />
            </Link>
            <p className="text-xs text-gray-600 font-light">
              Free consultation • Custom solutions • Transparent pricing
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
          <p className="text-gray-500 text-sm font-light">Software Agency • Tailored Solutions • Smarter Workflows</p>
        </div>
      </footer>
    </div>
  )
}
