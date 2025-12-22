"use client"

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, Zap, Lock, ArrowRight, Network } from "lucide-react"

export default function IntegrationSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  // Tool nodes data
  const tools = [
    { name: 'Slack', color: 'text-purple-400', angle: 0, distance: 140 },
    { name: 'Stripe', color: 'text-blue-400', angle: 45, distance: 120 },
    { name: 'Google', color: 'text-violet-400', angle: 90, distance: 150 },
    { name: 'Salesforce', color: 'text-blue-300', angle: 135, distance: 130 },
    { name: 'HubSpot', color: 'text-orange-400', angle: 180, distance: 140 },
    { name: 'Zapier', color: 'text-pink-400', angle: 225, distance: 125 },
    { name: 'Notion', color: 'text-white', angle: 270, distance: 145 },
    { name: 'Airtable', color: 'text-red-400', angle: 315, distance: 135 }
  ]

  return (
    <section
      ref={ref}
      className="relative min-h-[600px] md:min-h-[700px]"
      aria-label="Integration & Automation Services"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/8 via-violet-500/4 to-transparent"
           style={{ backgroundPosition: '70% 40%' }} />

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col md:block">
        {/* Content Block - Right */}
        <motion.div
          className="max-w-md mb-12 md:ml-auto md:text-right"
          initial={{ opacity: 0, x: 30 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-400/10 border border-purple-400/20 rounded-full text-xs font-medium text-purple-400 uppercase tracking-wider mb-6">
            Integration & Automation
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Seamless Integration & Automation
          </h2>

          <h3 className="text-2xl md:text-3xl font-light bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-6">
            100x Your Operations
          </h3>

          <p className="text-gray-300 leading-relaxed mb-8">
            Transform manual processes into smart workflows. Connect your tools, automate repetitive tasks, and build custom systems that scale securely.
          </p>

          {/* Features */}
          <div className="space-y-3 flex flex-col md:items-end">
            {['Reduce manpower by 90%', 'Intelligent automation', 'Custom integrations', 'Enterprise security'].map((feature, i) => (
              <motion.div
                key={feature}
                className="flex items-center gap-3 text-sm text-gray-400"
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <Check className="w-4 h-4 text-purple-400 flex-shrink-0 md:hidden" />
                <span>{feature}</span>
                <Check className="w-4 h-4 text-purple-400 flex-shrink-0 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Integration Network - Left Side */}
        <div className="relative md:absolute md:left-0 md:top-10 w-full md:w-[60%] max-w-2xl">
          <div className="relative h-[500px] flex items-center justify-center">
            {/* SVG Layer for Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="rgb(124, 58, 237)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="rgb(217, 70, 239)" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Connection Lines */}
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
                      strokeWidth="2"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.7 }}
                    />
                    {/* Animated pulse particle */}
                    {isInView && (
                      <motion.circle
                        r="3"
                        fill="rgb(217, 70, 239)"
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
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 shadow-2xl shadow-purple-500/30 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Network className="w-10 h-10 text-white" />
                </motion.div>
                {/* Orbital ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-purple-400/30"
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
                  className="absolute w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-xl border-2 border-purple-400/30 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-purple-400/80 hover:shadow-purple-400/50 cursor-pointer group z-10"
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
                  <Zap className={`w-5 h-5 ${tool.color}`} />
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-purple-400/30 px-2 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    {tool.name}
                  </div>
                </motion.div>
              )
            })}

            {/* Workflow Cards */}
            <motion.div
              className="absolute top-12 left-12 bg-slate-900/70 backdrop-blur-xl border border-purple-400/20 rounded-lg p-3 shadow-xl max-w-[180px] z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.2 }}
            >
              <div className="text-xs text-gray-300 space-y-1">
                <div className="text-purple-400 font-medium">IF: New sale</div>
                <ArrowRight className="w-3 h-3 text-gray-500 my-1" />
                <div className="text-gray-400">→ Update CRM</div>
                <div className="text-gray-400">→ Send receipt</div>
              </div>
            </motion.div>

            <motion.div
              className="absolute bottom-4 right-12 bg-slate-900/70 backdrop-blur-xl border border-purple-400/20 rounded-lg p-3 shadow-xl max-w-[180px] z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.4 }}
            >
              <div className="text-xs text-gray-300 space-y-1">
                <div className="text-purple-400 font-medium">IF: Form submit</div>
                <ArrowRight className="w-3 h-3 text-gray-500 my-1" />
                <div className="text-gray-400">→ Add to DB</div>
                <div className="text-gray-400">→ Notify team</div>
              </div>
            </motion.div>
          </div>

          {/* Efficiency Metrics */}
          <motion.div
            className="mt-8 bg-slate-900/60 backdrop-blur-xl border border-violet-400/20 rounded-xl p-6 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.8 }}
          >
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Time Saved</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xl text-gray-500 line-through">8 hrs</span>
                  <ArrowRight className="w-4 h-4 text-purple-400" />
                  <span className="text-3xl font-bold text-purple-400">15 min</span>
                </div>
                <div className="text-xs text-emerald-400">⚡ 95% faster</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Tasks Automated</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xl text-gray-500 line-through">95</span>
                  <ArrowRight className="w-4 h-4 text-purple-400" />
                  <span className="text-3xl font-bold text-purple-400">5</span>
                </div>
                <div className="text-xs text-emerald-400">⚡ 90 tasks saved</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
