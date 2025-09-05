'use client';

import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { itemVariants, buttonVariants } from './utils/animations';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  height?: number;
  actions?: boolean;
}

export function ChartCard({ 
  title, 
  children, 
  height = 300,
  actions = false 
}: ChartCardProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  
  return (
    <motion.div
      variants={itemVariants}
      className="bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-lg p-6 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <h3 className="text-lg font-mono font-semibold text-white">{title}</h3>
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </motion.button>
          </div>
        )}
      </div>
      
      <div style={{ height }}>
        {children}
      </div>
    </motion.div>
  );
} 