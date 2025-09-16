'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Skull } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createTask, updateTask, type KaijuHuntingTask, type TaskFormData } from '../actions/tasks'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  task?: KaijuHuntingTask | null
  isEdit?: boolean
}

export function TaskModal({ isOpen, onClose, onSave, task, isEdit = false }: TaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    kaijuType: '',
    location: '',
    difficulty: 'medium',
    estimatedDuration: 0,
    requiredEquipment: '',
    rewards: 0,
    dueDate: '',
    assignedHunter: '',
    category: 'reconnaissance',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load task data when editing
  useEffect(() => {
    if (isEdit && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        kaijuType: task.kaijuType || '',
        location: task.location || '',
        difficulty: task.difficulty || 'medium',
        estimatedDuration: task.estimatedDuration || 0,
        requiredEquipment: task.requiredEquipment || '',
        rewards: task.rewards || 0,
        dueDate: task.dueDate || '',
        assignedHunter: task.assignedHunter || '',
        category: task.category || 'reconnaissance',
      })
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        kaijuType: '',
        location: '',
        difficulty: 'medium',
        estimatedDuration: 0,
        requiredEquipment: '',
        rewards: 0,
        dueDate: '',
        assignedHunter: '',
        category: 'reconnaissance',
      })
    }
    setErrors({})
  }, [isEdit, task, isOpen])

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required'
    }
    if (!formData.kaijuType.trim()) {
      newErrors.kaijuType = 'Kaiju type is required'
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    
    try {
      let result
      
      if (isEdit && task?.id) {
        result = await updateTask(task.id, formData)
      } else {
        result = await createTask(formData)
      }

      if (result.success) {
        onSave()
      } else {
        console.error('Failed to save task:', result.error)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Skull className="w-6 h-6 text-red-400" />
            {isEdit ? 'Edit Hunt Mission' : 'New Hunt Mission'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-300">
                Mission Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Eliminate Godzilla in Tokyo Bay"
                className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="kaijuType" className="text-sm font-medium text-gray-300">
                Kaiju Type *
              </Label>
              <Input
                id="kaijuType"
                value={formData.kaijuType}
                onChange={(e) => handleInputChange('kaijuType', e.target.value)}
                placeholder="e.g., Godzilla, Mothra, King Ghidorah"
                className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
              />
              {errors.kaijuType && <p className="text-red-400 text-sm mt-1">{errors.kaijuType}</p>}
            </div>

            <div>
              <Label htmlFor="location" className="text-sm font-medium text-gray-300">
                Location *
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Tokyo Bay, Mount Fuji"
                className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
              />
              {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-300">
              Mission Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed description of the hunting mission..."
              rows={3}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 resize-none"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category and Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-300">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="reconnaissance">🔍 Reconnaissance</SelectItem>
                  <SelectItem value="capture">🕸️ Capture</SelectItem>
                  <SelectItem value="elimination">💀 Elimination</SelectItem>
                  <SelectItem value="rescue">🚑 Rescue</SelectItem>
                  <SelectItem value="research">🔬 Research</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedDuration" className="text-sm font-medium text-gray-300">
                Duration (hours)
              </Label>
              <Input
                id="estimatedDuration"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Equipment and Rewards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requiredEquipment" className="text-sm font-medium text-gray-300">
                Required Equipment
              </Label>
              <Textarea
                id="requiredEquipment"
                value={formData.requiredEquipment}
                onChange={(e) => handleInputChange('requiredEquipment', e.target.value)}
                placeholder="List required equipment..."
                rows={3}
                className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 resize-none"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="rewards" className="text-sm font-medium text-gray-300">
                  Reward Points
                </Label>
                <Input
                  id="rewards"
                  type="number"
                  value={formData.rewards}
                  onChange={(e) => handleInputChange('rewards', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label htmlFor="dueDate" className="text-sm font-medium text-gray-300">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white border-0"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : isEdit ? 'Update Hunt' : 'Create Hunt'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}