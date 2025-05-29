'use client';

import { motion } from 'framer-motion';
import { TrendingUp, LucideIcon } from 'lucide-react';
import { itemVariants, cardHoverVariants } from './utils/animations';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  unit?: string;
  description?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend = 'up',
  unit = '',
  description 
}: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-blue-400';
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover="hover"
      whileTap="tap"
      {...cardHoverVariants}
      className="bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-lg p-6 relative overflow-hidden group"
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-linear-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider">{title}</h3>
              {description && (
                <p className="text-xs text-gray-500 font-mono">{description}</p>
              )}
            </div>
          </div>
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-2 h-2 bg-green-400 rounded-full"
          />
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
              className="text-2xl font-mono font-bold text-white mb-1"
            >
              {value}{unit}
            </motion.div>
            <div className={`text-sm font-mono ${trendColor} flex items-center`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {change}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 