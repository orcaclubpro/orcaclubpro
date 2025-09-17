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
                bg-background/95 backdrop-blur-md border border-border
                rounded-full px-6 py-3 shadow-lg
                cursor-pointer hover:bg-accent/50 transition-all duration-300
                hover:shadow-xl
                group relative overflow-hidden
                min-w-[280px] max-w-[90vw]
              "
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="text-foreground font-medium">Nov {4 + currentDay}</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span className="text-muted-foreground text-xs">{getCurrentDate()}</span>
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
                    className="w-6 h-6 p-0"
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
                    className="w-6 h-6 p-0"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>

                  {/* Expand indicator */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
                    bg-background/95 backdrop-blur-md border border-border
                    rounded-xl p-4 shadow-xl
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
                            relative p-2 sm:p-3 rounded-lg text-xs sm:text-sm transition-all duration-200 min-h-[3rem] flex items-center justify-center
                            ${isActive
                              ? 'bg-primary text-primary-foreground border-2 border-primary'
                              : 'bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground'
                            }
                          `}
                          onClick={() => handleDaySelect(index)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="text-center">
                            <div className="font-semibold text-sm sm:text-base">{novemberDay}</div>
                            <div className="text-[10px] sm:text-xs opacity-75 leading-tight">
                              {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Progress indicator */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="text-foreground font-medium">
                        {Math.round(((currentDay + 1) / totalDays) * 100)}% Complete
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
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