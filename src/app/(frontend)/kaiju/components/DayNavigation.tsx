'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Zap, MapPin, Calendar, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type TripDay } from '../data/tripData'

interface DayNavigationProps {
  currentDay: number
  totalDays: number
  currentDayData: TripDay
  onNavigate: (direction: number) => void
  onJumpToDay: (day: number) => void
  startDate: string
}

export function DayNavigation({
  currentDay,
  totalDays,
  currentDayData,
  onNavigate,
  onJumpToDay,
  startDate
}: DayNavigationProps) {
  const getCurrentDate = () => {
    const start = new Date(startDate)
    const current = new Date(start)
    current.setDate(start.getDate() + currentDay)
    return current.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getJapaneseDate = () => {
    const start = new Date(startDate)
    const current = new Date(start)
    current.setDate(start.getDate() + currentDay)
    return `${current.getMonth() + 1}月${current.getDate()}日`
  }

  const getCityColor = (city: string) => {
    const colors = {
      tokyo: 'from-pink-500 to-rose-500',
      kyoto: 'from-emerald-400 to-teal-400',
      osaka: 'from-blue-400 to-cyan-400',
      fuji: 'from-green-400 to-emerald-400'
    }
    return colors[city as keyof typeof colors] || 'from-cyan-400 to-blue-400'
  }

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border-b border-cyan-500/20 px-6 py-8 relative overflow-hidden">
      {/* Cyberpunk background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>
      
      {/* HUD-style header */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent flex-1" />
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm tracking-wider">
            <Zap className="w-4 h-4" />
            <span>MISSION CONTROL</span>
            <Zap className="w-4 h-4" />
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent flex-1" />
        </div>
      </div>

      {/* Main Navigation HUD */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mb-8">
          
          {/* Previous Button */}
          <div className="flex justify-center lg:justify-start">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate(-1)}
              disabled={currentDay === 0}
              className="
                bg-slate-800/80 border-cyan-400/50 text-cyan-100 
                hover:bg-cyan-400/10 hover:border-cyan-400 hover:text-cyan-300
                hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] 
                disabled:opacity-30 disabled:border-slate-600
                transition-all duration-300 group relative overflow-hidden
                min-w-[160px] font-mono tracking-wide
              "
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>PREV DAY</span>
            </Button>
          </div>

          {/* Central HUD Display */}
          <div className="relative">
            {/* Main display panel */}
            <div className="
              bg-slate-800/90 backdrop-blur-sm
              border border-cyan-400/50 rounded-lg
              shadow-[0_0_30px_rgba(0,255,255,0.2)]
              relative overflow-hidden
            ">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/70" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/70" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/70" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/70" />
              
              <div className="p-6 text-center">
                <motion.div
                  key={currentDay}
                  initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Day number with glow */}
                  <div className="relative mb-3">
                    <div className="text-4xl font-bold text-cyan-100 font-mono tracking-wider relative z-10">
                      DAY {String(currentDay + 1).padStart(2, '0')}
                    </div>
                    <div className="absolute inset-0 text-4xl font-bold text-cyan-400/50 blur-sm font-mono tracking-wider">
                      DAY {String(currentDay + 1).padStart(2, '0')}
                    </div>
                  </div>
                  
                  {/* Location with icon */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <div className="text-xl font-semibold text-cyan-100 tracking-wide">
                      {currentDayData.location.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Date display */}
                  <div className="flex items-center justify-center gap-3 mb-3 text-slate-300">
                    <Calendar className="w-3 h-3" />
                    <span className="font-mono text-sm">{getCurrentDate()}</span>
                    <span className="text-cyan-400/70">|</span>
                    <span className="font-mono text-sm">{getJapaneseDate()}</span>
                  </div>
                  
                  {/* Phase badge */}
                  <div className="flex items-center justify-center gap-2">
                    <Target className="w-3 h-3 text-pink-400" />
                    <Badge
                      className={`
                        bg-gradient-to-r ${getCityColor(currentDayData.city)} 
                        text-white border-none font-mono text-xs tracking-wider
                        shadow-[0_0_15px_rgba(0,255,255,0.3)]
                      `}
                    >
                      {currentDayData.phase.toUpperCase()}
                    </Badge>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-center lg:justify-end">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate(1)}
              disabled={currentDay === totalDays - 1}
              className="
                bg-slate-800/80 border-cyan-400/50 text-cyan-100 
                hover:bg-cyan-400/10 hover:border-cyan-400 hover:text-cyan-300
                hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] 
                disabled:opacity-30 disabled:border-slate-600
                transition-all duration-300 group relative overflow-hidden
                min-w-[160px] font-mono tracking-wide
              "
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span>NEXT DAY</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Cyberpunk Timeline */}
        <div className="relative">
          {/* Timeline background */}
          <div className="h-1 bg-slate-700/50 rounded-full relative overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${((currentDay + 1) / totalDays) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </motion.div>
          </div>

          {/* Day indicators */}
          <div className="flex justify-between items-center relative">
            <TooltipProvider>
              {Array.from({ length: totalDays }, (_, index) => {
                const isActive = index === currentDay
                const isCompleted = index < currentDay
                const progress = index / (totalDays - 1)
                
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <motion.button
                        className={`
                          relative w-3 h-3 rounded-full border-2 transition-all duration-300
                          ${isActive 
                            ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.8)] scale-150' 
                            : isCompleted
                            ? 'bg-pink-400 border-pink-400 shadow-[0_0_10px_rgba(255,20,147,0.6)] hover:scale-125'
                            : 'bg-slate-700 border-slate-500 hover:bg-slate-600 hover:border-slate-400 hover:scale-110'
                          }
                          hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]
                        `}
                        onClick={() => onJumpToDay(index)}
                        whileHover={{ scale: isActive ? 1.5 : 1.3 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          left: `${progress * 100}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        {/* Pulsing ring for active day */}
                        {isActive && (
                          <motion.div
                            className="absolute inset-[-4px] rounded-full border border-cyan-400/50"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 border-cyan-400/50 text-cyan-100 font-mono">
                      <p>Day {index + 1}: {new Date(new Date(startDate).getTime() + index * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </div>

          {/* Progress stats */}
          <div className="flex justify-between items-center mt-4 text-xs font-mono tracking-wider">
            <span className="text-slate-400">START</span>
            <div className="flex items-center gap-2 text-cyan-400">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>{Math.round(((currentDay + 1) / totalDays) * 100)}% COMPLETE</span>
            </div>
            <span className="text-slate-400">END</span>
          </div>
        </div>
      </div>
    </div>
  )
}