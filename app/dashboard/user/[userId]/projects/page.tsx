'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
  FolderOpen
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  status: 'in-progress' | 'planning' | 'completed' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  startDate: string;
  dueDate: string;
  team: string[];
  budget: number;
  spent: number;
  tags: string[];
}

interface ProjectsPageProps {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params: Promise<{ userId: string }>;
}

// Mock data
const projects: Project[] = [
  {
    id: 'PRJ-001',
    name: 'E-commerce Platform',
    client: 'TechCorp Inc.',
    description: 'Modern e-commerce platform with advanced features',
    status: 'in-progress',
    priority: 'high',
    progress: 75,
    startDate: '2024-01-15',
    dueDate: '2024-03-15',
    team: ['John Doe', 'Jane Smith', 'Mike Johnson'],
    budget: 45000,
    spent: 33750,
    tags: ['React', 'Node.js', 'PostgreSQL']
  },
  {
    id: 'PRJ-002',
    name: 'Mobile Banking App',
    client: 'FinanceFirst',
    description: 'Secure mobile banking application with biometric authentication',
    status: 'planning',
    priority: 'medium',
    progress: 25,
    startDate: '2024-02-01',
    dueDate: '2024-05-01',
    team: ['Sarah Wilson', 'David Brown'],
    budget: 65000,
    spent: 16250,
    tags: ['React Native', 'Firebase', 'iOS', 'Android']
  },
  {
    id: 'PRJ-003',
    name: 'AI Analytics Dashboard',
    client: 'DataDriven LLC',
    description: 'Advanced analytics dashboard with machine learning insights',
    status: 'completed',
    priority: 'high',
    progress: 100,
    startDate: '2023-11-01',
    dueDate: '2024-01-30',
    team: ['Alex Chen', 'Maria Garcia', 'Tom Anderson'],
    budget: 80000,
    spent: 78000,
    tags: ['Python', 'TensorFlow', 'React', 'AWS']
  },
  {
    id: 'PRJ-004',
    name: 'Website Redesign',
    client: 'StartupXYZ',
    description: 'Complete website redesign with modern UI/UX',
    status: 'on-hold',
    priority: 'low',
    progress: 15,
    startDate: '2024-01-01',
    dueDate: '2024-04-01',
    team: ['Lisa Taylor'],
    budget: 25000,
    spent: 3750,
    tags: ['Figma', 'Next.js', 'Tailwind']
  }
];

const timeData = [
  { month: 'Jan', hours: 320, billable: 280 },
  { month: 'Feb', hours: 380, billable: 340 },
  { month: 'Mar', hours: 420, billable: 380 },
  { month: 'Apr', hours: 360, billable: 320 },
  { month: 'May', hours: 400, billable: 360 },
  { month: 'Jun', hours: 440, billable: 400 }
];

const statusData = [
  { name: 'Completed', value: 2, color: '#10b981' },
  { name: 'In Progress', value: 1, color: '#3b82f6' },
  { name: 'Planning', value: 1, color: '#f59e0b' },
  { name: 'On Hold', value: 1, color: '#6b7280' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const cardVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'on-hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return CheckCircle;
    case 'in-progress': return Clock;
    case 'planning': return FileText;
    case 'on-hold': return AlertCircle;
    default: return FileText;
  }
};

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const StatusIcon = getStatusIcon(project.status);

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer relative overflow-hidden"
    >
      {/* Background gradient on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.05 : 0 }}
        className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {project.name}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(project.status)}`}>
                <StatusIcon className="h-3 w-3" />
                <span>{project.status.replace('-', ' ')}</span>
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {project.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {project.client}
              </span>
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Due {project.dueDate}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {project.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1, delay: index * 0.1 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Budget */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Budget
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(project.spent / project.budget) * 100}%` }}
              transition={{ duration: 1, delay: index * 0.1 + 0.2 }}
              className="bg-green-500 h-1.5 rounded-full"
            />
          </div>
        </div>

        {/* Team & Tags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {project.team.slice(0, 3).map((member: string, i: number) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-xs font-semibold text-white border-2 border-white dark:border-gray-800"
                >
                  {member.split(' ').map((n: string) => n[0]).join('')}
                </div>
              ))}
              {project.team.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                  +{project.team.length - 3}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {project.tags.slice(0, 3).map((tag: string, i: number) => (
            <span
              key={i}
              className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-md"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function ProjectsPage({ /* params */ }: ProjectsPageProps) {
  // Since userId is not used in this component, we don't need to extract it
  // If userId is needed in the future, use React's `use` hook: const { userId } = use(params);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 min-h-screen">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and track your project portfolio
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {[
            { label: 'Total Projects', value: projects.length, icon: FolderOpen, color: 'blue' },
            { label: 'Active', value: projects.filter(p => p.status === 'in-progress').length, icon: Clock, color: 'green' },
            { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, icon: CheckCircle, color: 'purple' },
            { label: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length, icon: AlertCircle, color: 'yellow' }
          ].map((stat /*, index */) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Timeline */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Project Timeline
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="hours" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Budget Overview */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Budget Overview
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} projects`, '']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="planning">Planning</option>
            <option value="on-hold">On Hold</option>
          </select>
        </motion.div>

        {/* Projects Grid */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}