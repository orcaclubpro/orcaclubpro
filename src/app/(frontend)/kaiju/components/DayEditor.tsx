'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Calendar, Trash2, Plus, GripVertical } from 'lucide-react'
import { getCityBadgeColor, getCityDisplayName } from '../data/tripData'
import type { TripDayConfig } from '../data/tripData'

interface DayEditorProps {
  days: TripDayConfig[]
  onDaysChange: (days: TripDayConfig[]) => void
  startDate: string
}

interface DayItemProps {
  day: TripDayConfig
  index: number
  onUpdate: (index: number, day: TripDayConfig) => void
  onDelete: (index: number) => void
  startDate: string
  canDelete: boolean
}

function DayItem({ day, index, onUpdate, onDelete, startDate, canDelete }: DayItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localDay, setLocalDay] = useState<TripDayConfig>(day)

  const handleSave = () => {
    onUpdate(index, localDay)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setLocalDay(day)
    setIsEditing(false)
  }

  // Calculate the actual date for this day
  const dayDate = new Date(startDate)
  dayDate.setDate(dayDate.getDate() + index)
  const formattedDate = dayDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group"
    >
      <Card className="border border-slate-200 hover:border-slate-300 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GripVertical className="h-4 w-4 text-slate-400" />
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs font-mono">
                  Day {index + 1}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formattedDate}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="text-xs"
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(index)}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Location
                </label>
                <Input
                  value={localDay.location}
                  onChange={(e) => setLocalDay({ ...localDay, location: e.target.value })}
                  placeholder="e.g., Tokyo, Shibuya District"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  City Type
                </label>
                <Select
                  value={localDay.city}
                  onValueChange={(value) => setLocalDay({
                    ...localDay,
                    city: value as any,
                    customCityName: value === 'custom' ? localDay.customCityName || '' : undefined
                  })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tokyo">Tokyo</SelectItem>
                    <SelectItem value="kyoto">Kyoto</SelectItem>
                    <SelectItem value="osaka">Osaka</SelectItem>
                    <SelectItem value="fuji">Mt. Fuji</SelectItem>
                    <SelectItem value="custom">Custom Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {localDay.city === 'custom' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Custom City Name
                  </label>
                  <Input
                    value={localDay.customCityName || ''}
                    onChange={(e) => setLocalDay({ ...localDay, customCityName: e.target.value })}
                    placeholder="Enter custom city name"
                    className="text-sm"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Phase Description
                </label>
                <Textarea
                  value={localDay.phase}
                  onChange={(e) => setLocalDay({ ...localDay, phase: e.target.value })}
                  placeholder="e.g., Arrival & First Exploration"
                  className="text-sm"
                  rows={2}
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Badge className={`${getCityBadgeColor(day.city)} text-white`}>
                  <MapPin className="h-3 w-3 mr-1" />
                  {getCityDisplayName(day.city, day.customCityName)}
                </Badge>
                <span className="text-sm font-medium text-slate-900">
                  {day.location}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {day.phase}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DayEditor({ days, onDaysChange, startDate }: DayEditorProps) {
  const handleUpdateDay = (index: number, updatedDay: TripDayConfig) => {
    const newDays = [...days]
    newDays[index] = updatedDay
    onDaysChange(newDays)
  }

  const handleDeleteDay = (index: number) => {
    const newDays = days.filter((_, i) => i !== index)
    onDaysChange(newDays)
  }

  const handleAddDay = () => {
    const newDay: TripDayConfig = {
      location: 'New Location',
      city: 'tokyo',
      phase: 'New Phase'
    }
    onDaysChange([...days, newDay])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Trip Days ({days.length} days)
        </h3>
        <Button
          size="sm"
          onClick={handleAddDay}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Day
        </Button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {days.map((day, index) => (
          <DayItem
            key={index}
            day={day}
            index={index}
            onUpdate={handleUpdateDay}
            onDelete={handleDeleteDay}
            startDate={startDate}
            canDelete={days.length > 1}
          />
        ))}
      </div>

      {days.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No days configured.</p>
          <Button
            size="sm"
            onClick={handleAddDay}
            className="mt-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add First Day
          </Button>
        </div>
      )}
    </div>
  )
}