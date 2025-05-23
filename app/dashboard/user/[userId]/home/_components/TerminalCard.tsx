'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { terminalLogs } from './utils/mockData';
import { itemVariants } from './utils/animations';

export function TerminalCard() {
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogIndex(prev => (prev + 1) % terminalLogs.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div
      variants={itemVariants}
      className="bg-black/50 backdrop-blur-md border border-green-500/30 rounded-lg p-6 font-mono"
    >
      <div className="flex items-center space-x-2 mb-4">
        <Terminal className="h-5 w-5 text-green-400" />
        <span className="text-green-400 font-semibold">pod.terminal</span>
        <div className="flex-1" />
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <div className="w-3 h-3 bg-green-500 rounded-full" />
        </div>
      </div>
      
      <div className="space-y-2 h-48 overflow-hidden">
        <AnimatePresence mode="wait">
          {terminalLogs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: index <= currentLogIndex ? 1 : 0.3,
                x: 0 
              }}
              className="flex items-center space-x-3 text-sm"
            >
              <span className="text-gray-500">{log.time}</span>
              <span className={`
                px-2 py-1 rounded text-xs font-bold
                ${log.level === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                  log.level === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                  log.level === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'}
              `}>
                {log.level}
              </span>
              <span className="text-gray-300">{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <motion.div
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="flex items-center space-x-2 text-green-400"
        >
          <span>$</span>
          <span className="w-2 h-4 bg-green-400" />
        </motion.div>
      </div>
    </motion.div>
  );
} 