'use client'

import Link from "next/link"
import { ArrowRight, ShoppingCart, CreditCard, Package, BarChart3, Truck, Shield, CheckCircle, Clock, MessageSquare } from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"

const services = [
  {
    icon: ShoppingCart,
    title: "Custom Online Stores",
    description: "Fully custom ecommerce websites with unique shopping experiences, product configurators, and business logic tailored to your needs."
  },
  {
    icon: CreditCard,
    title: "Payment Integration",
    description: "Stripe, PayPal, Apple Pay, Google Pay, and buy-now-pay-later services. Secure checkout that converts."
  },
  {
    icon: Package,
    title: "Inventory Management",
    description: "Real-time inventory tracking, multi-warehouse support, low-stock alerts, and automated reorder points."
  },
  {
    icon: Truck,
    title: "Shipping & Fulfillment",
    description: "Integration with ShipStation, Shippo, and fulfillment centers. Real-time rates and order tracking."
  }
]

const platforms = [
  "Shopify Headless",
  "Custom React/Next.js",
  "Stripe Commerce",
  "WooCommerce",
  "Medusa.js",
  "Payload CMS + Commerce"
]

const process = [
  { step: "01", title: "Discovery", desc: "Understand your products, customers, and goals" },
  { step: "02", title: "Design", desc: "Create a conversion-focused shopping experience" },
  { step: "03", title: "Build", desc: "Develop your store with all integrations" },
  { step: "04", title: "Launch", desc: "Go live with training and support" }
]

export default function EcommerceContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-cyan-400 text-sm mb-8">
              <ShoppingCart className="w-4 h-4" />
              Ecommerce Expert
            </div>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
              <span className="gradient-text font-light">Ecommerce</span> Development
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-8">
              Launch your <strong className="text-white font-normal">online store</strong> with custom{" "}
              <strong className="text-white font-normal">ecommerce web design</strong> and development.
              From Shopify headless to fully custom solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:from-cyan-400/30 hover:to-blue-500/30 transition-all duration-300"
              >
                View Packages <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
              >
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
                <span className="gradient-text font-light">Ecommerce</span> Capabilities
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                Everything you need for a successful{" "}
                <strong className="text-white font-normal">ecommerce website development</strong> project.
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

      {/* Platforms */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Platforms & <span className="gradient-text font-light">Technologies</span>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="flex flex-wrap justify-center gap-4">
              {platforms.map((platform, index) => (
                <div
                  key={index}
                  className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-300"
                >
                  <span className="text-white font-light">{platform}</span>
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
                  <p className="text-sm text-gray-400 font-light">{item.desc}</p>
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
                Why Choose Our <span className="gradient-text font-light">Ecommerce Development</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: 'Launch Fast', desc: '2-4 weeks to a live store' },
              { icon: Shield, title: 'Secure & Scalable', desc: 'Enterprise-grade infrastructure' },
              { icon: BarChart3, title: 'Conversion Focused', desc: 'Designed to sell more' },
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
              Ready to Launch Your <span className="gradient-text font-light">Online Store</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
              From simple product catalogs to complex B2B platforms,
              we build ecommerce that converts.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500"
              >
                View Packages <ArrowRight size={20} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
              >
                Start Your Project <ArrowRight size={16} className="opacity-50" />
              </Link>
            </div>
            <p className="text-xs text-gray-600 mt-8 font-light">
              Free consultation | Fixed pricing | 2-4 week delivery
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
