'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Filter, Search, Target, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskModal } from './TaskModal'
import { TaskCard } from './TaskCard'
import { TaskStats } from './TaskStats'
import { getTasks, getTaskStats, type KaijuHuntingTask } from '../actions/tasks'

export function KaijuHuntingPlanner() {
  const [tasks, setTasks] = useState<KaijuHuntingTask[]>([])
  const [filteredTasks, setFilteredTasks] = useState<KaijuHuntingTask[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<KaijuHuntingTask | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0,
  })

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [tasksData, statsData] = await Promise.all([
        getTasks(),
        getTaskStats(),
      ])
      setTasks(tasksData)
      setStats(statsData)
      setLoading(false)
    }

    fetchData()
  }, [])

  // Filter tasks based on search and filters
  useEffect(() => {
    let filtered = tasks

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.kaijuType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchTerm, statusFilter, priorityFilter])

  const handleAddTask = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleEditTask = (task: KaijuHuntingTask) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleTaskUpdated = async () => {
    // Refresh data after task update
    const [tasksData, statsData] = await Promise.all([
      getTasks(),
      getTaskStats(),
    ])
    setTasks(tasksData)
    setStats(statsData)
    setIsModalOpen(false)
    setEditingTask(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'in_progress':
        return <Target className="w-4 h-4 text-blue-400" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-400/20 bg-yellow-400/5'
      case 'in_progress':
        return 'border-blue-400/20 bg-blue-400/5'
      case 'completed':
        return 'border-green-400/20 bg-green-400/5'
      case 'failed':
        return 'border-red-400/20 bg-red-400/5'
      default:
        return 'border-gray-400/20 bg-gray-400/5'
    }
  }

  const groupedTasks = {
    pending: filteredTasks.filter(task => task.status === 'pending'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    completed: filteredTasks.filter(task => task.status === 'completed'),
    failed: filteredTasks.filter(task => task.status === 'failed'),
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Kaiju Hunting Tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
            懐獣ハンターズ
          </h1>
          <p className="text-lg text-gray-400 mb-2">ORCACLUB Kaiju Hunting Division</p>
          <p className="text-sm text-gray-500">Elite Task Management • Monitor • Track • Eliminate</p>
        </div>

        {/* Stats */}
        <TaskStats stats={stats} />

        {/* Controls */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tasks, kaiju types, locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px] bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full md:w-[180px] bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddTask}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Hunt
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            <div key={status} className="space-y-4">
              <div className={`rounded-lg border-2 ${getStatusColor(status)} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  {getStatusIcon(status)}
                  <h3 className="font-semibold text-white capitalize">
                    {status.replace('_', ' ')} ({statusTasks.length})
                  </h3>
                </div>
                
                <AnimatePresence>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {statusTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={() => handleEditTask(task)}
                        onUpdate={handleTaskUpdated}
                      />
                    ))}
                    {statusTasks.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-8">
                        No {status.replace('_', ' ')} tasks
                      </p>
                    )}
                  </div>
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTask(null)
        }}
        onSave={handleTaskUpdated}
        task={editingTask}
        isEdit={!!editingTask}
      />
    </div>
  )
}