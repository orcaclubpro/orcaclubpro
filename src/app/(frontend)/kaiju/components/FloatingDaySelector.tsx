'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingDaySelectorProps {
  currentDay: number
  totalDays: number
  onJumpToDay: (day: number) => void
  onNavigate: (direction: number) => void
  isVisible: boolean
  startDate: string
}

export function FloatingDaySelector({
  currentDay,
  totalDays,
  onJumpToDay,
  onNavigate,
  isVisible,
  startDate
}: FloatingDaySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getCurrentDate = () => {
    const start = new Date(startDate)
    const current = new Date(start)
    current.setDate(start.getDate() + currentDay)
    return current.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDaySelect = (dayIndex: number) => {
    onJumpToDay(dayIndex)
    setIsExpanded(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="relative">
            {/* Collapsed state */}
            <motion.div
              layout
              className="
                bg-slate-900/90 backdrop-blur-md border border-cyan-400/50
                rounded-full px-6 py-3 shadow-[0_0_30px_rgba(0,255,255,0.2)]
                cursor-pointer hover:bg-slate-800/90 transition-all duration-300
                hover:shadow-[0_0_40px_rgba(0,255,255,0.3)]
                group relative overflow-hidden
                min-w-[280px] max-w-[90vw]
              "
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {/* Subtle scanning line effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <div className="font-mono text-sm">
                    <span className="text-cyan-100">Nov {4 + currentDay}</span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="text-cyan-300 text-xs">{getCurrentDate()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick nav arrows */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigate(-1)
                    }}
                    disabled={currentDay === 0}
                    className="
                      w-6 h-6 p-0 text-cyan-400 hover:text-cyan-300
                      hover:bg-cyan-400/10 disabled:opacity-30 disabled:hover:bg-transparent
                    "
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigate(1)
                    }}
                    disabled={currentDay === totalDays - 1}
                    className="
                      w-6 h-6 p-0 text-cyan-400 hover:text-cyan-300
                      hover:bg-cyan-400/10 disabled:opacity-30 disabled:hover:bg-transparent
                    "
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>

                  {/* Expand indicator */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-cyan-400" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Expanded state */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="
                    absolute bottom-full left-0 right-0 mb-2
                    bg-slate-900/95 backdrop-blur-md border border-cyan-400/50
                    rounded-xl p-4 shadow-[0_0_40px_rgba(0,255,255,0.3)]
                    min-w-[320px] max-w-[95vw] mx-auto
                  "
                >
                  {/* Day grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-[40vh] overflow-y-auto">
                    {Array.from({ length: totalDays }, (_, index) => {
                      const isActive = index === currentDay
                      const novemberDay = 4 + index // Nov 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
                      const dayDate = new Date(2024, 10, novemberDay) // Month 10 = November (0-indexed)

                      return (
                        <motion.button
                          key={index}
                          className={`
                            relative p-2 sm:p-3 rounded-lg font-mono text-xs sm:text-sm transition-all duration-200 min-h-[3rem] flex items-center justify-center
                            ${isActive
                              ? 'bg-cyan-400/20 text-cyan-100 border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                              : 'bg-slate-800/50 text-slate-300 border border-slate-600 hover:bg-slate-700/50 hover:border-slate-500 hover:text-cyan-100'
                            }
                          `}
                          onClick={() => handleDaySelect(index)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="text-center">
                            <div className="font-bold text-sm sm:text-base">{novemberDay}</div>
                            <div className="text-[10px] sm:text-xs opacity-75 leading-tight">
                              {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                          </div>

                          {/* Active day glow effect */}
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 rounded-lg border border-cyan-400/50"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-4 pt-3 border-t border-cyan-400/20">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Progress</span>
                      <span className="text-cyan-400">
                        {Math.round(((currentDay + 1) / totalDays) * 100)}% Complete
                      </span>
                    </div>
                    <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentDay + 1) / totalDays) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}