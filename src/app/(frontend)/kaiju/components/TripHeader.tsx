'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Settings } from 'lucide-react'
import Image from 'next/image'
import type { TripConfig } from '../data/tripData'

interface TripHeaderProps {
  tripConfig?: TripConfig | null
  onEditTrip?: () => void
}

export function TripHeader({ tripConfig, onEditTrip }: TripHeaderProps) {
  return (
    <div className="relative min-h-[60vh] overflow-hidden bg-gradient-to-b from-muted/50 to-background">
      {/* Hero Image Background */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          <img
            src="/kaiju.png"
            alt="Japan Adventure - Travel Planning"
            className="w-full h-full object-cover opacity-40"
          />
          {/* Clean overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-background/20" />
        </div>
      </div>

      {/* Edit Trip Button - Top Right */}
      {onEditTrip && (
        <div className="absolute top-6 right-6 z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Button
              onClick={onEditTrip}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm border-white/20 text-slate-700 hover:bg-white hover:text-slate-900 shadow-lg"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Trip
            </Button>
          </motion.div>
        </div>
      )}

      {/* Main hero content */}
      <div className="relative z-10 container mx-auto px-6 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center text-center space-y-8">

          {/* Logo */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Image
              src="/orcaclubpro.png"
              alt="ORCACLUB Pro"
              width={200}
              height={200}
              className="w-32 h-32 md:w-40 md:h-40 object-contain"
              priority
            />
          </motion.div>

          {/* Main title */}
          <div className="space-y-4">
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {tripConfig?.title || 'Japan Adventure'}
            </motion.h1>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {tripConfig ? (
                    `${new Date(tripConfig.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })} - ${new Date(
                      new Date(tripConfig.startDate).getTime() +
                      (tripConfig.numberOfDays - 1) * 24 * 60 * 60 * 1000
                    ).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}`
                  ) : (
                    'November 4-19, 2024'
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {tripConfig ? `${tripConfig.numberOfDays}-Day Journey` : '16-Day Journey'}
                </span>
              </div>
            </motion.div>

            <motion.p
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {tripConfig?.description || 'Plan and organize your ultimate Japan experience with detailed daily itineraries.'}
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  )
}