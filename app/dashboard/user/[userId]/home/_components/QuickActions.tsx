'use client';

import { motion } from 'framer-motion';
import { GitBranch, Database, Zap, ChevronRight } from 'lucide-react';
import { itemVariants, cardHoverVariants } from './utils/animations';

// Icon mapping for quick actions
const iconMap = {
  GitBranch,
  Database,
  Zap
};

// Quick actions data
const quickActionsData = [
  { icon: 'GitBranch', label: 'Deploy', action: 'deploy.production' },
  { icon: 'Database', label: 'Backup', action: 'backup.create' },
  { icon: 'Zap', label: 'Optimize', action: 'system.optimize' }
];

export function QuickActions() {
  return (
    <motion.div 
      variants={itemVariants} 
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {quickActionsData.map((item, index) => {
        const IconComponent = iconMap[item.icon as keyof typeof iconMap];
        
        return (
          <motion.button
            key={index}
            whileHover="hover"
            whileTap="tap"
            {...cardHoverVariants}
            className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700/50 rounded-lg hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
                <IconComponent className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-mono font-semibold text-white">{item.label}</p>
                <p className="text-sm text-gray-400 font-mono">{item.action}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
          </motion.button>
        );
      })}
    </motion.div>
  );
} 