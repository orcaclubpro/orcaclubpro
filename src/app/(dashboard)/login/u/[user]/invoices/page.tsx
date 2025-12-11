'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Eye,
  Send,
  Building,
  Mail,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  dueDate: string;
  issueDate: string;
  description: string;
  items: InvoiceItem[];
  paymentMethod: string | null;
  paidDate: string | null;
}

interface InvoicesPageProps {
  params: Promise<{ userId: string }>;
}

// Mock data
const invoices: Invoice[] = [
  {
    id: 'INV-001',
    clientName: 'TechCorp Inc.',
    clientEmail: 'billing@techcorp.com',
    amount: 15750,
    status: 'paid',
    dueDate: '2024-01-15',
    issueDate: '2023-12-15',
    description: 'E-commerce Platform Development - Phase 1',
    items: [
      { description: 'Frontend Development', quantity: 80, rate: 125, amount: 10000 },
      { description: 'Backend API Development', quantity: 40, rate: 150, amount: 6000 },
      { description: 'Database Setup', quantity: 10, rate: 175, amount: 1750 }
    ],
    paymentMethod: 'Bank Transfer',
    paidDate: '2024-01-10'
  },
  {
    id: 'INV-002',
    clientName: 'FinanceFirst',
    clientEmail: 'accounts@financefirst.com',
    amount: 22500,
    status: 'pending',
    dueDate: '2024-02-20',
    issueDate: '2024-01-20',
    description: 'Mobile Banking App - UI/UX Design',
    items: [
      { description: 'UI Design', quantity: 60, rate: 200, amount: 12000 },
      { description: 'UX Research', quantity: 30, rate: 175, amount: 5250 },
      { description: 'Prototyping', quantity: 25, rate: 210, amount: 5250 }
    ],
    paymentMethod: null,
    paidDate: null
  },
  {
    id: 'INV-003',
    clientName: 'DataDriven LLC',
    clientEmail: 'finance@datadriven.com',
    amount: 35000,
    status: 'overdue',
    dueDate: '2024-01-30',
    issueDate: '2023-12-30',
    description: 'AI Analytics Dashboard - Full Stack Development',
    items: [
      { description: 'Machine Learning Integration', quantity: 50, rate: 300, amount: 15000 },
      { description: 'Dashboard Development', quantity: 80, rate: 200, amount: 16000 },
      { description: 'Data Visualization', quantity: 20, rate: 200, amount: 4000 }
    ],
    paymentMethod: null,
    paidDate: null
  },
  {
    id: 'INV-004',
    clientName: 'StartupXYZ',
    clientEmail: 'billing@startupxyz.com',
    amount: 8500,
    status: 'draft',
    dueDate: '2024-03-15',
    issueDate: '2024-02-15',
    description: 'Website Redesign - Consultation & Planning',
    items: [
      { description: 'Design Consultation', quantity: 20, rate: 250, amount: 5000 },
      { description: 'Technical Planning', quantity: 15, rate: 200, amount: 3000 },
      { description: 'Project Setup', quantity: 3, rate: 500, amount: 1500 }
    ],
    paymentMethod: null,
    paidDate: null
  }
];

const revenueData = [
  { month: 'Jan', revenue: 45000, expenses: 12000, profit: 33000 },
  { month: 'Feb', revenue: 52000, expenses: 15000, profit: 37000 },
  { month: 'Mar', revenue: 48000, expenses: 13000, profit: 35000 },
  { month: 'Apr', revenue: 61000, expenses: 18000, profit: 43000 },
  { month: 'May', revenue: 55000, expenses: 16000, profit: 39000 },
  { month: 'Jun', revenue: 67000, expenses: 20000, profit: 47000 }
];

const statusData = [
  { name: 'Paid', value: 15750, color: '#10b981', count: 1 },
  { name: 'Pending', value: 22500, color: '#f59e0b', count: 1 },
  { name: 'Overdue', value: 35000, color: '#ef4444', count: 1 },
  { name: 'Draft', value: 8500, color: '#6b7280', count: 1 }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12
    }
  }
};

const cardVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10
    }
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'paid': return CheckCircle;
    case 'pending': return Clock;
    case 'overdue': return AlertCircle;
    case 'draft': return FileText;
    default: return FileText;
  }
};

const InvoiceCard = ({ invoice, index }: { invoice: Invoice; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const StatusIcon = getStatusIcon(invoice.status);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xs border border-gray-200 dark:border-gray-700 cursor-pointer relative overflow-hidden"
    >
      {/* Background gradient on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.05 : 0 }}
        className="absolute inset-0 bg-linear-to-br from-blue-500 to-purple-600"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {invoice.id}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(invoice.status)}`}>
                <StatusIcon className="h-3 w-3" />
                <span>{invoice.status}</span>
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {invoice.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <Building className="h-3 w-3 mr-1" />
                {invoice.clientName}
              </span>
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Due {invoice.dueDate}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${invoice.amount.toLocaleString()}
              </p>
              {invoice.status === 'paid' && invoice.paidDate && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Paid {invoice.paidDate}
                </p>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* Progress bar for overdue invoices */}
        {invoice.status === 'overdue' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Overdue
              </span>
              <span className="text-sm text-red-600 dark:text-red-400">
                {Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
            <div className="w-full bg-red-100 dark:bg-red-900/20 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="bg-red-500 h-2 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Items summary */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Items ({invoice.items.length})
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Total Hours: {invoice.items.reduce((sum: number, item: InvoiceItem) => sum + item.quantity, 0)}
            </span>
          </div>
          <div className="space-y-1">
            {invoice.items.slice(0, 2).map((item: InvoiceItem, i: number) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {item.description}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  ${item.amount.toLocaleString()}
                </span>
              </div>
            ))}
            {invoice.items.length > 2 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{invoice.items.length - 2} more items
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Mail className="h-3 w-3" />
            <span>{invoice.clientEmail}</span>
          </div>

          <div className="flex items-center space-x-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </motion.button>
            {invoice.status !== 'paid' && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function InvoicesPage({ /* params */ }: InvoicesPageProps) {
  // Since userId is not used in this component, we don't need to extract it
  // If userId is needed in the future, use React's `use` hook: const { userId } = use(params);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

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
              Invoices
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your billing and track payments
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>New Invoice</span>
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {[
            { 
              label: 'Total Revenue', 
              value: `$${totalRevenue.toLocaleString()}`, 
              icon: DollarSign, 
              color: 'blue',
              change: '+12.5%',
              trend: 'up'
            },
            { 
              label: 'Paid', 
              value: `$${paidAmount.toLocaleString()}`, 
              icon: CheckCircle, 
              color: 'green',
              change: '+8.2%',
              trend: 'up'
            },
            { 
              label: 'Pending', 
              value: `$${pendingAmount.toLocaleString()}`, 
              icon: Clock, 
              color: 'yellow',
              change: '+15.3%',
              trend: 'up'
            },
            { 
              label: 'Overdue', 
              value: `$${overdueAmount.toLocaleString()}`, 
              icon: AlertCircle, 
              color: 'red',
              change: '-5.1%',
              trend: 'down'
            }
          ].map((stat /*, index */) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xs border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xs border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#revenueGradient)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Invoice Status Distribution */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xs border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Invoice Status
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.count}
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
              placeholder="Search invoices..."
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
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="draft">Draft</option>
          </select>
        </motion.div>

        {/* Invoices Grid */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredInvoices.map((invoice, index) => (
              <InvoiceCard key={invoice.id} invoice={invoice} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filteredInvoices.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No invoices found
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