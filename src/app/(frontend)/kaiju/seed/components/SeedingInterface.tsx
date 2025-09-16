'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, Database, Trash2, Upload, Download } from 'lucide-react'
import { toast } from 'sonner'
import {
  seedKaijuActivitiesFromTripData,
  clearAllKaijuActivities,
  fetchKaijuActivities
} from '../../lib/actions'
import { tripData } from '../../data/tripData'

export function SeedingInterface() {
  const [isPending, startTransition] = useTransition()
  const [operationStatus, setOperationStatus] = useState<{
    type: 'idle' | 'seeding' | 'clearing' | 'fetching'
    progress: number
    message: string
  }>({
    type: 'idle',
    progress: 0,
    message: 'Ready to deploy missions'
  })
  const [stats, setStats] = useState<{
    totalTasks: number
    activitiesWithTasks: number
    totalDays: number
  } | null>(null)

  const handleSeedData = () => {
    startTransition(async () => {
      try {
        setOperationStatus({
          type: 'seeding',
          progress: 0,
          message: 'Initializing kaiju hunting deployment...'
        })

        // Simulate progress updates
        const progressSteps = [
          { progress: 20, message: 'Analyzing trip data structure...' },
          { progress: 40, message: 'Converting activities to kaiju tasks...' },
          { progress: 60, message: 'Deploying missions to database...' },
          { progress: 80, message: 'Validating task deployment...' },
          { progress: 100, message: 'All missions deployed successfully!' }
        ]

        for (const step of progressSteps) {
          setOperationStatus(prev => ({ ...prev, ...step }))
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        const success = await seedKaijuActivitiesFromTripData(tripData)

        if (success) {
          toast.success('🦈 All kaiju hunting missions deployed successfully!')
          await fetchStats()
        } else {
          throw new Error('Seeding operation failed')
        }

        setOperationStatus({
          type: 'idle',
          progress: 0,
          message: 'Ready to deploy missions'
        })
      } catch (error) {
        console.error('Seeding error:', error)
        toast.error('Failed to deploy missions. Check console for details.')
        setOperationStatus({
          type: 'idle',
          progress: 0,
          message: 'Deployment failed - ready to retry'
        })
      }
    })
  }

  const handleClearData = () => {
    if (!confirm('Are you sure you want to eliminate ALL kaiju hunting missions? This action cannot be undone.')) {
      return
    }

    startTransition(async () => {
      try {
        setOperationStatus({
          type: 'clearing',
          progress: 0,
          message: 'Preparing to eliminate all missions...'
        })

        const progressSteps = [
          { progress: 25, message: 'Locating all active missions...' },
          { progress: 50, message: 'Initiating elimination protocol...' },
          { progress: 75, message: 'Purging mission database...' },
          { progress: 100, message: 'All missions eliminated!' }
        ]

        for (const step of progressSteps) {
          setOperationStatus(prev => ({ ...prev, ...step }))
          await new Promise(resolve => setTimeout(resolve, 400))
        }

        const success = await clearAllKaijuActivities()

        if (success) {
          toast.success('🗑️ All kaiju hunting missions eliminated!')
          setStats(null)
        } else {
          throw new Error('Clear operation failed')
        }

        setOperationStatus({
          type: 'idle',
          progress: 0,
          message: 'Ready to deploy missions'
        })
      } catch (error) {
        console.error('Clearing error:', error)
        toast.error('Failed to eliminate missions. Check console for details.')
        setOperationStatus({
          type: 'idle',
          progress: 0,
          message: 'Elimination failed - ready to retry'
        })
      }
    })
  }

  const fetchStats = async () => {
    try {
      setOperationStatus({
        type: 'fetching',
        progress: 50,
        message: 'Scanning for active missions...'
      })

      const data = await fetchKaijuActivities()

      if (data) {
        const totalTasks = data.days.reduce((sum, day) => sum + day.activities.length, 0)
        const activitiesWithTasks = data.days.filter(day => day.activities.length > 0).length
        const totalDays = data.days.length

        setStats({
          totalTasks,
          activitiesWithTasks,
          totalDays
        })

        toast.success('Mission status updated!')
      } else {
        setStats(null)
        toast.info('No active missions found')
      }

      setOperationStatus({
        type: 'idle',
        progress: 0,
        message: 'Mission scan complete'
      })
    } catch (error) {
      console.error('Fetch stats error:', error)
      toast.error('Failed to scan missions')
      setOperationStatus({
        type: 'idle',
        progress: 0,
        message: 'Scan failed - ready to retry'
      })
    }
  }

  const staticDataStats = {
    totalActivities: tripData.days.reduce((sum, day) => sum + day.activities.length, 0),
    daysWithActivities: tripData.days.filter(day => day.activities.length > 0).length,
    totalDays: tripData.days.length
  }

  return (
    <div className="space-y-6">
      {/* Operation Status */}
      {operationStatus.type !== 'idle' && (
        <Card className="bg-slate-800/50 border-cyan-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-100 font-mono">
              <Database className="w-5 h-5 animate-pulse" />
              Operation in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Progress value={operationStatus.progress} className="w-full" />
              <p className="text-slate-300 font-mono text-sm">{operationStatus.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Database Status */}
      <Card className="bg-slate-800/50 border-cyan-400/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-100 font-mono">
            <Database className="w-5 h-5" />
            Current Mission Status
          </CardTitle>
          <CardDescription className="text-slate-400">
            Active kaiju hunting missions in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button
              onClick={fetchStats}
              disabled={isPending}
              variant="outline"
              size="sm"
              className="font-mono"
            >
              <Download className="w-4 h-4 mr-2" />
              SCAN MISSIONS
            </Button>
          </div>

          {stats ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-cyan-400">{stats.totalTasks}</div>
                <div className="text-sm text-slate-400">Active Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-cyan-400">{stats.activitiesWithTasks}</div>
                <div className="text-sm text-slate-400">Days with Missions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-cyan-400">{stats.totalDays}</div>
                <div className="text-sm text-slate-400">Total Days</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-500 font-mono">No mission data found</p>
              <p className="text-xs text-slate-600 mt-1">Click SCAN MISSIONS to check for existing data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Static Data Info */}
      <Card className="bg-slate-800/50 border-cyan-400/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-100 font-mono">
            <Upload className="w-5 h-5" />
            Source Data Available
          </CardTitle>
          <CardDescription className="text-slate-400">
            Static trip data ready for deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-pink-400">{staticDataStats.totalActivities}</div>
              <div className="text-sm text-slate-400">Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-pink-400">{staticDataStats.daysWithActivities}</div>
              <div className="text-sm text-slate-400">Active Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-pink-400">{staticDataStats.totalDays}</div>
              <div className="text-sm text-slate-400">Total Days</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="font-mono">
              Tokyo: {tripData.days.filter(d => d.city === 'tokyo').length} days
            </Badge>
            <Badge variant="secondary" className="font-mono">
              Kyoto: {tripData.days.filter(d => d.city === 'kyoto').length} days
            </Badge>
            <Badge variant="secondary" className="font-mono">
              Osaka: {tripData.days.filter(d => d.city === 'osaka').length} days
            </Badge>
            <Badge variant="secondary" className="font-mono">
              Mt. Fuji: {tripData.days.filter(d => d.city === 'fuji').length} days
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-green-900/20 border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-300 font-mono">
              <CheckCircle className="w-5 h-5" />
              Deploy Missions
            </CardTitle>
            <CardDescription className="text-green-400">
              Convert static trip data to kaiju hunting tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSeedData}
              disabled={isPending}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-mono font-bold"
            >
              {isPending && operationStatus.type === 'seeding' ? 'DEPLOYING...' : 'DEPLOY ALL MISSIONS'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-red-900/20 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-300 font-mono">
              <Trash2 className="w-5 h-5" />
              Eliminate All Missions
            </CardTitle>
            <CardDescription className="text-red-400">
              Clear all kaiju hunting tasks from database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleClearData}
              disabled={isPending}
              variant="destructive"
              className="w-full font-mono font-bold"
            >
              {isPending && operationStatus.type === 'clearing' ? 'ELIMINATING...' : 'ELIMINATE ALL MISSIONS'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card className="bg-slate-800/50 border-slate-500/30">
        <CardHeader>
          <CardTitle className="text-slate-300 font-mono">Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400 space-y-2 font-mono">
          <p>1. Click <strong>SCAN MISSIONS</strong> to check current database status</p>
          <p>2. Use <strong>DEPLOY ALL MISSIONS</strong> to convert static trip data to kaiju tasks</p>
          <p>3. Use <strong>ELIMINATE ALL MISSIONS</strong> to clear all data (use with caution)</p>
          <p>4. Visit <strong>/japan</strong> to see the kaiju hunting trip planner in action</p>
          <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded">
            <p className="text-amber-200">
              💡 Tip: Deploy missions first, then test the Japan trip planner functionality
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}