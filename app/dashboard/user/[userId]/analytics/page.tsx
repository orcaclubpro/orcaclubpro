'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';

interface AnalyticsPageProps {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params: Promise<{ userId: string }>;
}

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

export default function AnalyticsPage({ /* params */ }: AnalyticsPageProps) {
  // Since this is just a static "coming soon" page, we don't need to extract userId
  // If userId is needed in the future, use React's `use` hook: const { userId } = use(params);

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
              Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your performance and insights
            </p>
          </div>
        </motion.div>

        {/* Coming Soon Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Advanced analytics and reporting features are coming soon. Track your performance, 
            monitor trends, and gain valuable insights into your workspace activity.
          </p>
          
          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[
              { icon: TrendingUp, title: 'Performance Metrics', desc: 'Track key performance indicators' },
              { icon: Users, title: 'User Analytics', desc: 'Monitor user engagement and activity' },
              { icon: DollarSign, title: 'Revenue Insights', desc: 'Analyze revenue trends and forecasts' }
            ].map((feature /*, index */) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <feature.icon className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 