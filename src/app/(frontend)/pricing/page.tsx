'use client'

import type { Metadata } from 'next'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, Sparkles, Code2, Clock, DollarSign, ArrowRight } from 'lucide-react'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Transparent <span className="gradient-text">Pricing</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                Clear, simple pricing for exceptional results. No hidden fees, no surprises.
              </p>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Web Development Pricing Section */}
      <WebDevelopmentPricing />

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight text-white">
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-2xl mx-auto">
              Let's discuss your project and create a custom solution that fits your needs and budget.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
            >
              Schedule Consultation <ArrowRight size={20} />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}

// Web Development Pricing Component
function WebDevelopmentPricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section
      ref={ref}
      className="relative z-10 py-20 px-6"
      aria-label="Web Development Pricing"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/5 via-transparent to-transparent"
           style={{ backgroundPosition: '50% 50%' }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
            Website Development
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            MVP Development Package
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Launch your idea fast with our proven MVP development process
          </p>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="relative bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-2xl shadow-2xl shadow-cyan-400/10 overflow-hidden">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Most Popular Package
              </div>
            </div>

            <div className="p-8 md:p-12">
              {/* Pricing Header */}
              <div className="text-center mb-12 mt-4">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className="text-3xl md:text-4xl text-gray-500 line-through font-light">
                    $899
                  </span>
                  <ArrowRight className="w-6 h-6 text-cyan-400" />
                  <span className="text-5xl md:text-6xl font-bold text-white">
                    $599
                  </span>
                </div>
                <p className="text-lg text-cyan-400 font-medium mb-2">
                  Special Launch Pricing - Save $300
                </p>
                <p className="text-sm text-gray-400">
                  Just $100 down to get started
                </p>
              </div>

              {/* Three Column Layout */}
              <div className="grid md:grid-cols-3 gap-8 mb-10">
                {/* Starter Package */}
                <motion.div
                  className="text-center md:text-left"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-400/10 rounded-lg mb-4">
                    <Code2 className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Starter Package</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Complete MVP development with everything you need to launch and validate your idea
                  </p>
                </motion.div>

                {/* Timeline */}
                <motion.div
                  className="text-center md:text-left"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-400/10 rounded-lg mb-4">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">2-4 Week Delivery</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Fast turnaround from concept to launch-ready application
                  </p>
                </motion.div>

                {/* Payment */}
                <motion.div
                  className="text-center md:text-left"
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.6 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-400/10 rounded-lg mb-4">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Flexible Payment</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    $100 down payment, remainder due upon completion
                  </p>
                </motion.div>
              </div>

              {/* What's Included Section */}
              <motion.div
                className="bg-black/30 rounded-xl p-8 border border-cyan-400/10"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-2xl font-bold text-white mb-6 text-center md:text-left">
                  What's Included
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      title: 'MVP Development',
                      description: 'Fully functional minimum viable product',
                      value: '$199 value'
                    },
                    {
                      title: 'Project Proposal Documentation',
                      description: 'Detailed project scope and technical specifications',
                      value: 'Included'
                    },
                    {
                      title: 'Project Discovery Session',
                      description: 'In-depth analysis of requirements and goals',
                      value: 'Included'
                    },
                    {
                      title: 'First 10 Hours Free',
                      description: 'Web development hours to kickstart your project',
                      value: '$500 value'
                    },
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.title}
                      className="flex items-start gap-3 bg-slate-900/40 rounded-lg p-4 border border-white/5 hover:border-cyan-400/20 transition-colors duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                        <p className="text-sm text-gray-400 mb-2">{feature.description}</p>
                        <span className="text-xs text-cyan-400 font-medium">{feature.value}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Hourly Rate Section */}
              <motion.div
                className="mt-8 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-400/20"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.2 }}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">
                      Additional Development Hours
                    </h4>
                    <p className="text-sm text-gray-400">
                      Need more features? Continue development at our standard hourly rate
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-3xl font-bold text-cyan-400">$50/hr</div>
                    <p className="text-xs text-gray-400">Billed in 1-hour increments</p>
                  </div>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                className="mt-10 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.4 }}
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg text-lg font-medium text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 group"
                >
                  Get Started Today
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-xs text-gray-500 mt-4">
                  Free consultation • No obligation • Quick response time
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Tech Stack Preview */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.6 }}
        >
          <p className="text-sm text-gray-500 mb-4">Built with modern, production-ready technologies</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: 'React', color: 'from-blue-400 to-blue-600' },
              { name: 'Next.js', color: 'from-slate-600 to-slate-800' },
              { name: 'TypeScript', color: 'from-blue-500 to-blue-700' },
              { name: 'Tailwind', color: 'from-cyan-400 to-cyan-600' },
              { name: 'PostgreSQL', color: 'from-indigo-500 to-indigo-700' },
            ].map((tech, i) => (
              <motion.div
                key={tech.name}
                className={`px-4 py-2 rounded-lg bg-gradient-to-r ${tech.color} text-white text-xs font-medium shadow-lg`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 1.7 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                {tech.name}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
