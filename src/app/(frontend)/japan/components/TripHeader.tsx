'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Zap, Users, Calendar, MapPin } from 'lucide-react'

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
            className="w-full h-full object-cover opacity-60"
          />
          {/* Light overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/30 to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-transparent to-slate-900/40" />
        </div>
      </div>

      {/* Main hero content */}
      <div className="relative z-10 container mx-auto px-6 py-16 flex items-center min-h-[100vh]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          
          {/* Left side - Text content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Organization badge */}
              <Badge 
                variant="secondary" 
                className="mb-6 bg-cyan-400/20 text-cyan-300 border-cyan-400/50 backdrop-blur-sm hover:bg-cyan-400/30 font-mono tracking-wider text-sm px-4 py-2"
              >
                <Users className="w-4 h-4 mr-2" />
                Orcaclub
              </Badge>
              
              {/* Main title with glow effect */}
              <div className="relative">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 relative z-10">
                  <span className="bg-gradient-to-r from-cyan-300 via-cyan-100 to-cyan-300 bg-clip-text text-transparent font-mono tracking-tight">
                    懐郷
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-pink-300 via-pink-100 to-pink-300 bg-clip-text text-transparent font-mono tracking-tight">
                    HUNTERS
                  </span>
                </h1>
                {/* Glow effect */}
                <div className="absolute inset-0 text-5xl md:text-7xl lg:text-8xl font-bold font-mono tracking-tight blur-lg opacity-30">
                  <span className="text-cyan-400">懐郷</span>
                  <br />
                  <span className="text-pink-400">HUNTERS</span>
                </div>
              </div>
              
              {/* Subtitle */}
              <div className="space-y-4">
                <motion.p 
                  className="text-xl md:text-2xl text-cyan-100 font-mono tracking-wide"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Kaiju Hunting Adventure
                </motion.p>
                
                {/* Mission details */}
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <div className="flex items-center gap-3 text-slate-300 font-mono">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <span>Epic 14-Day Japan Journey</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 font-mono">
                    <MapPin className="w-5 h-5 text-pink-400" />
                    <span>November 4-17, 2024</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 font-mono">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span>Proudly sponsored by Casamigos</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Status indicators */}
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="bg-slate-800/80 border border-cyan-400/50 rounded-lg px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-mono text-cyan-100">MISSION ACTIVE</span>
                </div>
              </div>
              <div className="bg-slate-800/80 border border-pink-400/50 rounded-lg px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                  <span className="text-sm font-mono text-pink-100">CASAMIGOS READY</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right side - Floating UI elements over the image */}
          <motion.div
            className="relative lg:min-h-[60vh] flex items-center justify-center"
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="relative">

            </div>
          </motion.div>
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