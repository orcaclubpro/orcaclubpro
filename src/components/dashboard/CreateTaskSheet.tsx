'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTask } from '@/actions/tasks'

interface CreateTaskSheetProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTaskSheet({ projectId, open, onOpenChange }: CreateTaskSheetProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('Task title is required')
      return
    }

    setIsLoading(true)

    const result = await createTask({
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
    })

    setIsLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to create task')
      return
    }

    // Reset form
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    setError(null)

    // Close sheet and refresh
    onOpenChange(false)
    router.refresh()
  }

  const handleCancel = () => {
    // Reset form
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
    setError(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#1C1C1C] border-[#404040] w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold text-[#F0F0F0]">
            Create New Task
          </SheetTitle>
          <SheetDescription className="text-[#6B6B6B]">
            Add a new task to this project. The task will be automatically assigned to you.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-[#A0A0A0]">
              Task Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fix authentication bug"
              className="bg-[rgba(255,255,255,0.06)] border-[#404040] text-[#F0F0F0] placeholder:text-[#6B6B6B] focus:border-[rgba(139,156,182,0.30)]"
              disabled={isLoading}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-[#A0A0A0]">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: Add more details about this task..."
              rows={4}
              className="bg-[rgba(255,255,255,0.06)] border-[#404040] text-[#F0F0F0] placeholder:text-[#6B6B6B] focus:border-[rgba(139,156,182,0.30)] resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium text-[#A0A0A0]">
              Priority
            </Label>
            <Select
              value={priority}
              onValueChange={(value) =>
                setPriority(value as 'low' | 'medium' | 'high' | 'urgent')
              }
              disabled={isLoading}
            >
              <SelectTrigger className="bg-[rgba(255,255,255,0.06)] border-[#404040] text-[#F0F0F0] focus:border-[rgba(139,156,182,0.30)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1C1C] border-[#404040]">
                <SelectItem value="low" className="text-[#6B6B6B]">
                  Low Priority
                </SelectItem>
                <SelectItem value="medium" className="text-blue-400">
                  Medium Priority
                </SelectItem>
                <SelectItem value="high" className="text-yellow-400">
                  High Priority
                </SelectItem>
                <SelectItem value="urgent" className="text-red-400">
                  Urgent
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#6B6B6B]">
              {priority === 'low' && 'Can be completed later'}
              {priority === 'medium' && 'Normal priority (default)'}
              {priority === 'high' && 'Should be completed soon'}
              {priority === 'urgent' && 'Requires immediate attention'}
            </p>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium text-[#A0A0A0]">
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-[rgba(255,255,255,0.06)] border-[#404040] text-[#F0F0F0] focus:border-[rgba(139,156,182,0.30)]"
              disabled={isLoading}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 bg-[rgba(255,255,255,0.06)] border-[#404040] hover:bg-[rgba(255,255,255,0.06)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[var(--space-accent)] text-[#F0F0F0] hover:bg-[var(--space-accent)]/90 font-medium shadow-lg shadow-[rgba(139,156,182,0.10)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
