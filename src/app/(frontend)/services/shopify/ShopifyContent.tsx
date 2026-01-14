'use client'

import Link from "next/link"
import { ArrowRight, ShoppingBag, Code2, Palette, Settings, Globe, CheckCircle, Clock, MessageSquare } from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"

const services = [
  {
    icon: Globe,
    title: "Headless Shopify",
    description: "Lightning-fast storefronts with Shopify Hydrogen and custom React frontends. Perfect for brands needing complete design freedom."
  },
  {
    icon: Palette,
    title: "Theme Development",
    description: "Custom Shopify themes built from scratch or extensive modifications to existing themes. Pixel-perfect, on-brand designs."
  },
  {
    icon: Code2,
    title: "App Development",
    description: "Custom Shopify apps for unique functionality—inventory systems, checkout customizations, automation tools, and more."
  },
  {
    icon: Settings,
    title: "Integrations",
    description: "Connect your store with ERPs, CRMs, fulfillment services, marketing tools, and any third-party platform you need."
  }
]

const expertise = [
  "Shopify Storefront API",
  "Shopify Admin API",
  "Liquid Templating",
  "Hydrogen & Remix",
  "Shopify Plus",
  "Custom Checkouts",
  "Inventory Sync",
  "Multi-currency",
  "Wholesale/B2B",
  "Subscription Commerce"
]

const process = [
  { step: "01", title: "Discovery", description: "Understand your store needs and goals" },
  { step: "02", title: "Strategy", description: "Recommend theme, headless, or custom app" },
  { step: "03", title: "Development", description: "Build with daily updates and communication" },
  { step: "04", title: "Launch", description: "Deploy with documentation and training" }
]

export default function ShopifyContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-cyan-400 text-sm mb-8">
              <ShoppingBag className="w-4 h-4" />
              Shopify Expert
            </div>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
              <span className="gradient-text font-light">Shopify Developer</span> Services
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-8">
              Looking to <strong className="text-white font-normal">hire a Shopify developer</strong>?
              We&apos;re <strong className="text-white font-normal">Shopify experts</strong> specializing in
              headless commerce, custom themes, and app development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:from-cyan-400/30 hover:to-blue-500/30 transition-all duration-300">
                View Packages <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors">
                Start Your Project <ArrowRight size={16} className="opacity-50" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Shopify <span className="gradient-text font-light">Development Services</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                From <strong className="text-white font-normal">custom Shopify development</strong> to
                full <strong className="text-white font-normal">Shopify store development</strong>.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group h-full">
                  <service.icon className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-medium text-white mb-3">{service.title}</h3>
                  <p className="text-gray-400 font-light leading-relaxed">{service.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Shopify <span className="gradient-text font-light">Expertise</span>
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="flex flex-wrap justify-center gap-4">
              {expertise.map((skill, index) => (
                <div key={index} className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-300">
                  <span className="text-white font-light">{skill}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Our <span className="gradient-text font-light">Process</span>
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-4 gap-6">
            {process.map((item, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="text-center p-6 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300">
                  <div className="text-cyan-400 text-sm font-mono mb-4">{item.step}</div>
                  <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 font-light">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Why <span className="gradient-text font-light">Hire Us</span> as Your Shopify Developer
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: 'Fast Delivery', desc: '1-4 weeks vs months with agencies' },
              { icon: MessageSquare, title: 'Direct Access', desc: 'Talk to the Shopify expert directly' },
              { icon: CheckCircle, title: 'Fixed Pricing', desc: 'Know your costs upfront' },
            ].map((benefit, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="p-8 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 text-center">
                  <benefit.icon className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-cyan-400 mb-2">{benefit.title}</h3>
                  <p className="text-gray-300 font-light">{benefit.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-8 border-t border-slate-800/50 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
              Ready to <span className="gradient-text font-light">Hire a Shopify Expert</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
              Whether you need a simple theme tweak or a complete headless rebuild,
              let&apos;s discuss your Shopify project.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/pricing" className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500">
                View Packages <ArrowRight size={20} />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors">
                Start Your Project <ArrowRight size={16} className="opacity-50" />
              </Link>
            </div>
            <p className="text-xs text-gray-600 mt-8 font-light">
              Free consultation | Fixed pricing | 1-4 week delivery
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
