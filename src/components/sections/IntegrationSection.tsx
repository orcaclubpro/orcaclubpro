"use client"

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { Check, Zap, ArrowRight, Network } from "lucide-react"

export default function IntegrationSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const tools = [
    { name: 'Slack',       angle: 0,   distance: 140 },
    { name: 'Stripe',      angle: 45,  distance: 120 },
    { name: 'Google',      angle: 90,  distance: 150 },
    { name: 'Salesforce',  angle: 135, distance: 130 },
    { name: 'HubSpot',     angle: 180, distance: 140 },
    { name: 'Zapier',      angle: 225, distance: 125 },
    { name: 'Notion',      angle: 270, distance: 145 },
    { name: 'Airtable',    angle: 315, distance: 135 },
  ]

  return (
    <section
      ref={ref}
      className="relative min-h-[600px] md:min-h-[700px]"
      aria-label="Integration & Automation Services"
    >
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/[0.03] via-transparent to-transparent"
           style={{ backgroundPosition: '70% 40%' }} />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:block">
        {/* Content Block — Right */}
        <motion.div
          className="max-w-md mb-12 md:ml-auto md:text-right"
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
            Integration & Automation
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Seamless Integration & Automation
          </h2>

          <h3 className="text-2xl md:text-3xl font-light text-cyan-400 mb-6">
            100x Your Operations
          </h3>

          <p className="text-gray-400 leading-relaxed mb-8 font-light">
            Transform manual processes into smart workflows. Connect your tools, automate repetitive tasks, and build custom systems that scale securely.
          </p>

          <div className="space-y-3 flex flex-col md:items-end mb-8">
            {['Reduce manpower by 90%', 'Intelligent automation', 'Custom integrations', 'Enterprise security'].map((feature, i) => (
              <motion.div
                key={feature}
                className="flex items-center gap-3 text-sm text-gray-400"
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 md:hidden" />
                <span>{feature}</span>
                <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 hidden md:block" />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="md:flex md:justify-end"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2 }}
          >
            <Link
              href="/services/integration-automation"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400/10 border border-cyan-400/20 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/20 transition-all duration-300 group"
            >
              Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Integration Network — Left Side */}
        <div className="relative md:absolute md:left-0 md:top-10 w-full md:w-[60%] max-w-2xl">
          <div className="relative h-[500px] flex items-center justify-center">
            {/* SVG Layer for Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#67e8f9" stopOpacity="0.5" />
                  <stop offset="50%"  stopColor="#67e8f9" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.08" />
                </linearGradient>
              </defs>

              {tools.map((tool, i) => {
                const centerX = 250
                const centerY = 250
                const radian = (tool.angle * Math.PI) / 180
                const endX = centerX + Math.cos(radian) * tool.distance
                const endY = centerY + Math.sin(radian) * tool.distance

                return (
                  <motion.g key={tool.name}>
                    <motion.path
                      d={`M ${centerX} ${centerY} Q ${centerX + Math.cos(radian) * tool.distance * 0.5} ${centerY + Math.sin(radian) * tool.distance * 0.5} ${endX} ${endY}`}
                      stroke="url(#connection-gradient)"
                      strokeWidth="1.5"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.7 }}
                    />
                    {isInView && (
                      <motion.circle
                        r="2.5"
                        fill="#67e8f9"
                        opacity="0.7"
                      >
                        <animateMotion
                          dur={`${2 + i * 0.3}s`}
                          repeatCount="indefinite"
                          path={`M ${centerX} ${centerY} Q ${centerX + Math.cos(radian) * tool.distance * 0.5} ${centerY + Math.sin(radian) * tool.distance * 0.5} ${endX} ${endY}`}
                        />
                      </motion.circle>
                    )}
                  </motion.g>
                )
              })}
            </svg>

            {/* Central Hub Node */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              initial={{ scale: 0, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/60 via-blue-600/80 to-cyan-700/60 shadow-2xl shadow-cyan-500/20 flex items-center justify-center border border-cyan-400/30">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Network className="w-10 h-10 text-white/90" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-full border border-cyan-400/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </motion.div>

            {/* Tool Nodes */}
            {tools.map((tool, i) => {
              const radian = (tool.angle * Math.PI) / 180
              const x = 50 + Math.cos(radian) * (tool.distance / 5)
              const y = 50 + Math.sin(radian) * (tool.distance / 5)

              return (
                <motion.div
                  key={tool.name}
                  className="absolute w-11 h-11 rounded-full bg-black/80 backdrop-blur-xl border border-cyan-400/25 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-cyan-400/60 hover:shadow-cyan-400/20 cursor-pointer group z-10"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1, y: [0, -5, 0] } : {}}
                  transition={{
                    scale: { delay: 0.7 + i * 0.1 },
                    y: { duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                  whileHover={{ scale: 1.15 }}
                >
                  <Zap className="w-4 h-4 text-cyan-400/70" />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 border border-cyan-400/20 px-2 py-1 rounded text-xs text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 font-light">
                    {tool.name}
                  </div>
                </motion.div>
              )
            })}

            {/* Workflow Cards */}
            <motion.div
              className="absolute top-12 left-12 bg-black/70 backdrop-blur-xl border border-cyan-400/15 rounded-lg p-3 shadow-xl max-w-[180px] z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.2 }}
            >
              <div className="text-xs text-gray-300 space-y-1 font-light">
                <div className="text-cyan-400 font-medium">IF: New sale</div>
                <ArrowRight className="w-3 h-3 text-gray-600 my-1" />
                <div className="text-gray-500">→ Update CRM</div>
                <div className="text-gray-500">→ Send receipt</div>
              </div>
            </motion.div>

            <motion.div
              className="absolute bottom-4 right-12 bg-black/70 backdrop-blur-xl border border-cyan-400/15 rounded-lg p-3 shadow-xl max-w-[180px] z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.4 }}
            >
              <div className="text-xs text-gray-300 space-y-1 font-light">
                <div className="text-cyan-400 font-medium">IF: Form submit</div>
                <ArrowRight className="w-3 h-3 text-gray-600 my-1" />
                <div className="text-gray-500">→ Add to DB</div>
                <div className="text-gray-500">→ Notify team</div>
              </div>
            </motion.div>
          </div>

          {/* Efficiency Metrics */}
          <motion.div
            className="mt-8 bg-black/60 backdrop-blur-xl border border-cyan-400/15 rounded-xl p-6 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.8 }}
          >
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Time Saved</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-lg text-gray-600 line-through font-light">8 hrs</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400/50" />
                  <span className="text-3xl font-light text-cyan-400">15 min</span>
                </div>
                <div className="text-xs text-cyan-400/60">95% faster</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Tasks Automated</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-lg text-gray-600 line-through font-light">95</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400/50" />
                  <span className="text-3xl font-light text-cyan-400">5</span>
                </div>
                <div className="text-xs text-cyan-400/60">90 tasks saved</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
