"use client"

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { services } from '@/data/services'

export default function ServicesComparison() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-20 px-8 relative z-10" id="services-comparison">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Choose Your <span className="gradient-text">Service</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light">
            Compare our services and find the perfect solution for your business needs
          </p>
        </motion.div>

        {/* Desktop Table View */}
        <motion.div
          className="hidden lg:block overflow-x-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-cyan-400/20">
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Service
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Best For
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Key Features
                </th>
                <th className="text-right py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => (
                <motion.tr
                  key={service.id}
                  className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                >
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-12 rounded-full bg-gradient-to-b ${service.color.gradient}`} />
                      <div>
                        <div className="font-semibold text-white mb-1">{service.shortTitle}</div>
                        <div className="text-sm text-gray-400">{service.headline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <span className="text-white font-medium">
                      {service.id === 'web-development' && '2-4 weeks'}
                      {service.id === 'digital-marketing' && 'Ongoing'}
                      {service.id === 'seo-services' && '3-6 months'}
                      {service.id === 'integration-automation' && '1-3 weeks'}
                    </span>
                  </td>
                  <td className="py-6 px-6">
                    <div className="text-sm text-gray-300">
                      {service.id === 'web-development' && 'New websites, custom tools'}
                      {service.id === 'digital-marketing' && 'Campaign management, growth'}
                      {service.id === 'seo-services' && 'Search visibility, traffic'}
                      {service.id === 'integration-automation' && 'Workflow automation, efficiency'}
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <div className="flex flex-col gap-2">
                      {service.features.slice(0, 2).map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <Check className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-6 px-6 text-right">
                    <Link
                      href={`/services/${service.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300 group"
                    >
                      Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-xl p-6 hover:border-cyan-400/40 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            >
              {/* Service Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-1.5 h-16 rounded-full bg-gradient-to-b ${service.color.gradient} flex-shrink-0`} />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{service.shortTitle}</h3>
                  <p className="text-sm text-cyan-400">{service.headline}</p>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-sm text-gray-400">Timeline</span>
                  <span className="text-sm font-medium text-white">
                    {service.id === 'web-development' && '2-4 weeks'}
                    {service.id === 'digital-marketing' && 'Ongoing'}
                    {service.id === 'seo-services' && '3-6 months'}
                    {service.id === 'integration-automation' && '1-3 weeks'}
                  </span>
                </div>
                <div className="py-2 border-b border-slate-800">
                  <span className="text-sm text-gray-400 block mb-2">Best For</span>
                  <span className="text-sm text-gray-300">
                    {service.id === 'web-development' && 'New websites, custom tools'}
                    {service.id === 'digital-marketing' && 'Campaign management, growth'}
                    {service.id === 'seo-services' && 'Search visibility, traffic'}
                    {service.id === 'integration-automation' && 'Workflow automation, efficiency'}
                  </span>
                </div>
              </div>

              {/* Key Features */}
              <div className="mb-6">
                <span className="text-sm text-gray-400 block mb-3">Key Features</span>
                <div className="space-y-2">
                  {service.features.slice(0, 3).map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <Link
                href={`/services/${service.id}`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-cyan-400/10 border border-cyan-400/30 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300 group"
              >
                View Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-gray-500">
            Need a custom solution?{' '}
            <Link href="/contact" className="text-cyan-400 hover:underline font-medium">
              Let's talk →
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
