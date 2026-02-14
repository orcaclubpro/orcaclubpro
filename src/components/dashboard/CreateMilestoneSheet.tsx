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
import { createMilestone } from '@/actions/projects'

interface CreateMilestoneSheetProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateMilestoneSheet({
  projectId,
  open,
  onOpenChange,
}: CreateMilestoneSheetProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('Milestone title is required')
      return
    }

    if (!date) {
      setError('Milestone date is required')
      return
    }

    setIsLoading(true)

    const result = await createMilestone({
      projectId,
      title: title.trim(),
      date,
      description: description.trim() || undefined,
    })

    setIsLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to create milestone')
      return
    }

    // Reset form
    setTitle('')
    setDate('')
    setDescription('')
    setError(null)

    // Close sheet and refresh
    onOpenChange(false)
    router.refresh()
  }

  const handleCancel = () => {
    // Reset form
    setTitle('')
    setDate('')
    setDescription('')
    setError(null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-black/95 border-white/[0.08] backdrop-blur-xl w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold text-white">
            Add Milestone
          </SheetTitle>
          <SheetDescription className="text-gray-400">
            Create a new milestone to track important project deliverables.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-300">
              Milestone Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Beta Release"
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-intelligence-cyan/50"
              disabled={isLoading}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-gray-300">
              Target Date <span className="text-red-400">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/50"
              disabled={isLoading}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: Describe what this milestone represents..."
              rows={4}
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-intelligence-cyan/50 resize-none"
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
              className="flex-1 bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="size-4 mr-2" />
                  Add Milestone
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
