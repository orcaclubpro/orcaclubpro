'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Calendar, Target } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { type Activity } from '../data/tripData'

const activitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  time: z.string().optional(),
  hasTime: z.boolean(),
  category: z.enum(['cultural', 'food', 'nature', 'shopping', 'entertainment', 'transport']).optional()
}).refine((data) => {
  if (data.hasTime && !data.time) {
    return false
  }
  return true
}, {
  message: "Time is required when 'Specific Time' is enabled",
  path: ["time"]
})

type ActivityFormData = z.infer<typeof activitySchema>

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (activity: Activity) => void
  activity?: Activity
  isEdit?: boolean
  isPending?: boolean
}

export function ActivityModal({
  isOpen,
  onClose,
  onSave,
  activity,
  isEdit = false,
  isPending = false
}: ActivityModalProps) {
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: '',
      description: '',
      time: '',
      hasTime: false,
      category: undefined
    }
  })

  const { watch, setValue } = form
  const hasTime = watch('hasTime')

  useEffect(() => {
    if (activity && isEdit) {
      form.reset({
        title: activity.title,
        description: activity.description || '',
        time: activity.time || '',
        hasTime: activity.hasTime,
        category: activity.category
      })
    } else {
      form.reset({
        title: '',
        description: '',
        time: '',
        hasTime: false,
        category: undefined
      })
    }
  }, [activity, isEdit, form])

  useEffect(() => {
    if (!hasTime) {
      setValue('time', '')
    }
  }, [hasTime, setValue])

  const onSubmit = (data: ActivityFormData) => {
    const newActivity: Activity = {
      id: activity?.id || Math.random().toString(36).substr(2, 9),
      title: data.title,
      description: data.description,
      time: data.hasTime ? data.time : undefined,
      hasTime: data.hasTime,
      category: data.category
    }
    
    onSave(newActivity)
    form.reset()
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="
        sm:max-w-[700px] max-h-[90vh] overflow-y-auto
        bg-slate-900/95 backdrop-blur-sm border border-cyan-400/50
        shadow-[0_0_50px_rgba(0,255,255,0.3)]
      ">
        <DialogHeader className="border-b border-cyan-400/20 pb-6">
          <DialogTitle className="text-2xl font-bold font-mono tracking-wider text-cyan-100 flex items-center gap-3">
            <Target className="w-6 h-6 text-pink-400" />
            {isEdit ? 'MODIFY MISSION' : 'DEPLOY NEW MISSION'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Mission Timing Configuration */}
            <div className="flex items-center justify-between p-6 bg-slate-800/50 backdrop-blur-sm border border-cyan-400/30 rounded-xl">
              <div className="flex items-center space-x-4">
                {hasTime ? (
                  <Clock className="w-6 h-6 text-cyan-400" />
                ) : (
                  <Calendar className="w-6 h-6 text-pink-400" />
                )}
                <div>
                  <Label htmlFor="hasTime" className="text-base font-bold font-mono tracking-wide text-cyan-100">
                    {hasTime ? 'SCHEDULED MISSION' : 'FLEXIBLE MISSION'}
                  </Label>
                  <p className="text-sm text-slate-300 font-mono tracking-wide mt-1">
                    {hasTime 
                      ? 'Deploy at specific time coordinates' 
                      : 'Execute when tactical situation allows'
                    }
                  </p>
                </div>
              </div>
              <FormField
                control={form.control}
                name="hasTime"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-cyan-400 data-[state=unchecked]:bg-slate-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Time Input */}
            <AnimatePresence>
              {hasTime && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mission Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-cyan-100 font-mono font-bold tracking-wider">
                    MISSION DESIGNATION *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., INFILTRATE SENSO-JI TEMPLE"
                      {...field}
                      className="
                        bg-slate-800/50 border-cyan-400/50 text-cyan-100 
                        placeholder:text-slate-400 font-mono tracking-wide
                        focus:border-cyan-400 focus:ring-cyan-400/20
                      "
                    />
                  </FormControl>
                  <FormMessage className="text-pink-300 font-mono text-xs" />
                </FormItem>
              )}
            />

            {/* Mission Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-cyan-100 font-mono font-bold tracking-wider">
                    MISSION TYPE
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="
                        bg-slate-800/50 border-cyan-400/50 text-cyan-100 
                        font-mono tracking-wide focus:border-cyan-400
                      ">
                        <SelectValue placeholder="SELECT MISSION TYPE" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-800 border-cyan-400/50">
                      <SelectItem value="cultural" className="text-cyan-100 font-mono hover:bg-slate-700">🏛️ CULTURAL</SelectItem>
                      <SelectItem value="food" className="text-cyan-100 font-mono hover:bg-slate-700">🍜 SUSTENANCE</SelectItem>
                      <SelectItem value="nature" className="text-cyan-100 font-mono hover:bg-slate-700">🌸 NATURE</SelectItem>
                      <SelectItem value="shopping" className="text-cyan-100 font-mono hover:bg-slate-700">🛍️ ACQUISITION</SelectItem>
                      <SelectItem value="entertainment" className="text-cyan-100 font-mono hover:bg-slate-700">🎮 RECREATION</SelectItem>
                      <SelectItem value="transport" className="text-cyan-100 font-mono hover:bg-slate-700">🚄 TRANSPORT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-pink-300 font-mono text-xs" />
                </FormItem>
              )}
            />

            {/* Mission Intel */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-cyan-100 font-mono font-bold tracking-wider">
                    MISSION INTEL
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tactical notes, objectives, and operational details..."
                      className="
                        min-h-[120px] resize-none bg-slate-800/50 border-cyan-400/50 
                        text-cyan-100 placeholder:text-slate-400 font-mono tracking-wide
                        focus:border-cyan-400 focus:ring-cyan-400/20
                      "
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-pink-300 font-mono text-xs" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-4 pt-8 border-t border-cyan-400/20">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                className="
                  flex-1 sm:flex-none bg-slate-800/50 border-slate-500 text-slate-300
                  hover:bg-slate-700 hover:border-slate-400 hover:text-slate-100
                  font-mono tracking-wider disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                ABORT
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="
                  flex-1 sm:flex-none bg-gradient-to-r from-cyan-500 to-cyan-600
                  hover:from-cyan-400 hover:to-cyan-500 text-slate-900
                  font-mono font-bold tracking-wider
                  shadow-[0_0_20px_rgba(0,255,255,0.3)]
                  hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]
                  border-none disabled:opacity-50 disabled:cursor-not-allowed
                  disabled:from-slate-500 disabled:to-slate-600
                "
              >
                {isPending ?
                  (isEdit ? 'UPDATING MISSION...' : 'DEPLOYING MISSION...') :
                  (isEdit ? 'UPDATE MISSION' : 'DEPLOY MISSION')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}