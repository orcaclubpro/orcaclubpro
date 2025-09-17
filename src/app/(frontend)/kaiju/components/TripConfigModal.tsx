'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  X,
  Save,
  RotateCcw,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  Settings,
  Hash
} from 'lucide-react'
import { DayEditor } from './DayEditor'
import { validateTripConfig, getDefaultTripConfig } from '../data/tripData'
import type { TripConfig, TripDayConfig } from '../data/tripData'
import { toast } from 'sonner'

interface TripConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: TripConfig) => Promise<void>
  initialConfig?: TripConfig | null
  isPending?: boolean
}

export function TripConfigModal({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  isPending = false
}: TripConfigModalProps) {
  const [config, setConfig] = useState<TripConfig>(getDefaultTripConfig())
  const [errors, setErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'general' | 'days'>('general')
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize config when modal opens or initialConfig changes
  useEffect(() => {
    if (isOpen) {
      const configToUse = initialConfig || getDefaultTripConfig()
      setConfig(configToUse)
      setHasChanges(false)
      setErrors([])
      setActiveTab('general')
    }
  }, [isOpen, initialConfig])

  // Track changes
  useEffect(() => {
    if (initialConfig) {
      const isChanged = JSON.stringify(config) !== JSON.stringify(initialConfig)
      setHasChanges(isChanged)
    } else {
      setHasChanges(true) // New config
    }
  }, [config, initialConfig])

  const handleInputChange = (field: keyof TripConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleDaysChange = (days: TripDayConfig[]) => {
    setConfig(prev => ({
      ...prev,
      days,
      numberOfDays: days.length
    }))
  }

  const handleNumberOfDaysChange = (newCount: number) => {
    const currentDays = config.days.length

    if (newCount === currentDays) return

    if (newCount > currentDays) {
      // Add new days
      const newDays = [...config.days]
      for (let i = currentDays; i < newCount; i++) {
        newDays.push({
          location: `Day ${i + 1} Location`,
          city: 'tokyo',
          phase: `Day ${i + 1} Phase`
        })
      }
      setConfig(prev => ({ ...prev, days: newDays, numberOfDays: newCount }))
    } else {
      // Remove days and warn about activities
      const removedDays = currentDays - newCount
      if (removedDays > 0) {
        toast.warning(`Reducing days will remove ${removedDays} day(s) and any activities on those days.`)
      }
      setConfig(prev => ({
        ...prev,
        days: prev.days.slice(0, newCount),
        numberOfDays: newCount
      }))
    }
  }

  const handleSave = async () => {
    const validationErrors = validateTripConfig(config)

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setActiveTab('general') // Switch to general tab to show errors
      return
    }

    try {
      await onSave(config)
      toast.success('Trip configuration saved successfully!')
      onClose()
    } catch (error) {
      console.error('Error saving trip config:', error)
      toast.error('Failed to save trip configuration')
    }
  }

  const handleReset = () => {
    const defaultConfig = getDefaultTripConfig()
    setConfig(defaultConfig)
    setErrors([])
    toast.info('Trip configuration reset to default')
  }

  const handleClose = () => {
    if (hasChanges && !isPending) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Trip Configuration
                  </h2>
                  <p className="text-sm text-slate-600">
                    Customize your trip structure and settings
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isPending}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex mt-4 space-x-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'general'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                General Settings
              </button>
              <button
                onClick={() => setActiveTab('days')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'days'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Days & Locations
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Validation Errors */}
            {errors.length > 0 && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="font-medium mb-1">Please fix the following errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* General Settings Tab */}
            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Trip Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Trip Title
                      </label>
                      <Input
                        value={config.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter trip title"
                        disabled={isPending}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Description (Optional)
                      </label>
                      <Textarea
                        value={config.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Enter trip description"
                        rows={3}
                        disabled={isPending}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                          Start Date
                        </label>
                        <Input
                          type="date"
                          value={config.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                          Number of Days
                        </label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            value={config.numberOfDays}
                            onChange={(e) => handleNumberOfDaysChange(parseInt(e.target.value) || 1)}
                            disabled={isPending}
                            className="flex-1"
                          />
                          <Badge variant="outline" className="whitespace-nowrap">
                            <Hash className="h-3 w-3 mr-1" />
                            {config.days.length} configured
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Trip Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Duration:</span>
                          <span className="font-medium">{config.numberOfDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Start Date:</span>
                          <span className="font-medium">
                            {new Date(config.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Locations:</span>
                          <span className="font-medium">
                            {[...new Set(config.days.map(d => d.city))].length} cities
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">End Date:</span>
                          <span className="font-medium">
                            {new Date(new Date(config.startDate).getTime() + (config.numberOfDays - 1) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Days & Locations Tab */}
            {activeTab === 'days' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <DayEditor
                  days={config.days}
                  onDaysChange={handleDaysChange}
                  startDate={config.startDate}
                />
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isPending}
                  className="text-slate-600"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset to Default
                </Button>
                {hasChanges && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200">
                    Unsaved changes
                  </Badge>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isPending || !hasChanges}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}