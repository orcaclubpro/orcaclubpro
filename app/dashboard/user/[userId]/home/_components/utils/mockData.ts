// Mock data for dashboard charts and metrics
export const revenueData = [
  { name: 'Jan', value: 4000, growth: 12 },
  { name: 'Feb', value: 3000, growth: -5 },
  { name: 'Mar', value: 5000, growth: 18 },
  { name: 'Apr', value: 4500, growth: 8 },
  { name: 'May', value: 6000, growth: 25 },
  { name: 'Jun', value: 5500, growth: 15 },
];

export const performanceData = [
  { time: '00:00', cpu: 45, memory: 62, network: 78 },
  { time: '04:00', cpu: 52, memory: 58, network: 82 },
  { time: '08:00', cpu: 78, memory: 71, network: 65 },
  { time: '12:00', cpu: 85, memory: 79, network: 88 },
  { time: '16:00', cpu: 72, memory: 68, network: 75 },
  { time: '20:00', cpu: 58, memory: 64, network: 70 },
];

export const distributionData = [
  { name: 'Active', value: 65, color: '#3B82F6' },
  { name: 'Idle', value: 25, color: '#10B981' },
  { name: 'Error', value: 10, color: '#EF4444' },
];

export const terminalLogs = [
  { time: '14:32:15', level: 'INFO', message: 'pod.system initialized successfully' },
  { time: '14:32:18', level: 'SUCCESS', message: 'user authentication verified' },
  { time: '14:32:22', level: 'INFO', message: 'workspace sync completed' },
  { time: '14:32:25', level: 'WARNING', message: 'memory usage at 78%' },
  { time: '14:32:28', level: 'INFO', message: 'backup process started' },
];

export const quickActions = [
  { icon: 'GitBranch', label: 'Deploy', action: 'deploy.production' },
  { icon: 'Database', label: 'Backup', action: 'backup.create' },
  { icon: 'Zap', label: 'Optimize', action: 'system.optimize' }
];

export const metricCards = [
  {
    title: "cpu.usage",
    value: "72",
    unit: "%",
    change: "+5.2%",
    icon: "Cpu",
    trend: "up" as const,
    description: "processing power"
  },
  {
    title: "memory.allocated",
    value: "2.4",
    unit: "GB",
    change: "+12.8%",
    icon: "HardDrive",
    trend: "up" as const,
    description: "ram utilization"
  },
  {
    title: "active.sessions",
    value: "1,247",
    change: "+18.2%",
    icon: "Users",
    trend: "up" as const,
    description: "concurrent users"
  },
  {
    title: "uptime.hours",
    value: "99.9",
    unit: "%",
    change: "stable",
    icon: "Clock",
    trend: "neutral" as const,
    description: "system availability"
  }
]; 