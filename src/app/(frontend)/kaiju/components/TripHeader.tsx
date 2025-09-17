'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Zap, Users, Calendar, MapPin } from 'lucide-react'
import Image from 'next/image'

export function TripHeader() {
  return (
    <div className="relative min-h-[100vh] overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Animated neon lines */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scaleX: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400 to-transparent"
          animate={{
            opacity: [0.8, 0.2, 0.8],
            scaleX: [1.2, 0.8, 1.2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* Hero Image Background */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          <img
            src="/kaiju.png"
            alt="Cyberpunk Japan Adventure - Two hunters in neon-lit Tokyo street"
            className="w-full h-full object-cover opacity-80"
            style={{ imageRendering: 'crisp-edges' }}
          />
          {/* Light overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/30 to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-transparent to-slate-900/40" />
        </div>
      </div>

      {/* Main hero content */}
      <div className="relative z-10 container mx-auto px-6 py-16 flex items-center justify-center min-h-[100vh]">
        <div className="flex flex-col items-center text-center space-y-12">

          {/* Logo at top */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="relative">
              <motion.div
                className="relative"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Image
                  src="/orcaclubpro.png"
                  alt="ORCACLUB Pro"
                  width={300}
                  height={300}
                  className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
                  priority
                />

                {/* Subtle glow effect */}
                <motion.div
                  className="absolute inset-0 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-gradient-to-r from-cyan-400/20 to-pink-400/20 rounded-full blur-3xl"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Centered content */}
          <div className="space-y-8 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >

              {/* Main title with neon sign effect */}
              <div className="relative">
                <motion.h1
                  className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 relative z-10"
                  animate={{
                    filter: [
                      'drop-shadow(0 0 10px rgba(34, 211, 238, 0.5))',
                      'drop-shadow(0 0 20px rgba(34, 211, 238, 0.8))',
                      'drop-shadow(0 0 10px rgba(34, 211, 238, 0.5))'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    textShadow: `
                      0 0 5px rgba(34, 211, 238, 0.5),
                      0 0 10px rgba(34, 211, 238, 0.3),
                      0 0 15px rgba(34, 211, 238, 0.2),
                      0 0 20px rgba(34, 211, 238, 0.1)
                    `
                  }}
                >
                  <motion.span
                    className="bg-gradient-to-r from-cyan-300 via-cyan-100 to-cyan-300 bg-clip-text text-transparent font-mono tracking-tight"
                    animate={{
                      filter: [
                        'brightness(1)',
                        'brightness(1.3)',
                        'brightness(1)'
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    懐郷
                  </motion.span>
                  <br />
                  <motion.span
                    className="bg-gradient-to-r from-pink-300 via-pink-100 to-pink-300 bg-clip-text text-transparent font-mono tracking-tight"
                    animate={{
                      filter: [
                        'brightness(1)',
                        'brightness(1.3)',
                        'brightness(1)'
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.7
                    }}
                    style={{
                      textShadow: `
                        0 0 5px rgba(244, 114, 182, 0.5),
                        0 0 10px rgba(244, 114, 182, 0.3),
                        0 0 15px rgba(244, 114, 182, 0.2)
                      `
                    }}
                  >
                    HUNTING
                  </motion.span>
                </motion.h1>
                {/* Enhanced glow effect */}
                <motion.div
                  className="absolute inset-0 text-5xl md:text-7xl lg:text-8xl font-bold font-mono tracking-tight blur-lg opacity-30"
                  animate={{
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <span className="text-cyan-400">懐郷</span>
                  <br />
                  <span className="text-pink-400">HUNTING</span>
                </motion.div>
                {/* Additional neon tube effect */}
                <motion.div
                  className="absolute inset-0 text-5xl md:text-7xl lg:text-8xl font-bold font-mono tracking-tight blur-2xl opacity-20"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                >
                  <span className="text-cyan-300">懐郷</span>
                  <br />
                  <span className="text-pink-300">HUNTING</span>
                </motion.div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom fade with neon accent */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="h-24 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
      </div>
    </div>
  )
}