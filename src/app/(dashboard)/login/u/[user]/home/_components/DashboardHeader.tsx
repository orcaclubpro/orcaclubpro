'use client';

import { motion } from 'framer-motion';
import { Wifi, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { itemVariants } from './utils/animations';

interface DashboardHeaderProps {
  userId: string;
}

export function DashboardHeader({ userId }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Set mounted to true and initialize time after hydration
    setMounted(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      variants={itemVariants} 
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-3xl font-mono font-bold text-white mb-2">
          Welcome to POD.{userId}
        </h1>
        <p className="text-gray-400 font-mono">
          {mounted && currentTime ? currentTime.toLocaleString() : '--:--:-- --/--/----'} • System Status: Optimal
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <motion.div
          className="flex items-center space-x-2 bg-gray-900/50 rounded-lg px-4 py-2 border border-gray-700/50"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
        >
          <Wifi className="h-4 w-4 text-green-400" />
          <span className="text-sm font-mono text-gray-300">Connected</span>
        </motion.div>
        <motion.div
          className="flex items-center space-x-2 bg-gray-900/50 rounded-lg px-4 py-2 border border-gray-700/50"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
        >
          <Shield className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-mono text-gray-300">Secure</span>
        </motion.div>
      </div>
    </motion.div>
  );
} 