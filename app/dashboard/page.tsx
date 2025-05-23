'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { DashboardLogin } from './_components/DashboardLogin';
import { useDashboard } from './layout';

export default function DashboardPage() {
  const { 
    isAuthenticated, 
    setAuthState, 
    activeTab
  } = useDashboard();

  const handleAuthSuccess = (userId: string) => {
    setAuthState(true, userId);
  };

  return (
    <>
      {/* Brand Header */}
      <div className="p-8 border-b border-gray-700/20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl text-white leading-none mb-2" style={{ letterSpacing: '-0.02em' }}>
            <span className="font-light tracking-wide">ORCA</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 font-medium">CLUB</span>
          </h1>
          <p className="text-lg text-cyan-200 font-light tracking-wider">
            {isAuthenticated ? 'secure workspace' : 'pod access portal'}
          </p>
        </motion.div>
      </div>

      {/* Dynamic Content Based on Active Tab */}
      <div className="flex-1 p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'login' && !isAuthenticated && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto"
            >
              <DashboardLogin onAuthSuccess={handleAuthSuccess} />
            </motion.div>
          )}
          
          {isAuthenticated && (
            <motion.div
              key="authenticated"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center py-16">
                <Terminal className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
                <h2 className="text-3xl text-white mb-4">Welcome to your POD</h2>
                <p className="text-gray-400 mb-8">Your secure workspace is ready. Select a workspace area from the navigation.</p>
                
                {/* Quick Access Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:border-cyan-500/30 transition-all cursor-pointer"
                  >
                    <Terminal className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-2">Workspace</h3>
                    <p className="text-gray-400 text-sm">Access your workspace</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:border-cyan-500/30 transition-all cursor-pointer"
                  >
                    <Terminal className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-2">Analytics</h3>
                    <p className="text-gray-400 text-sm">Access your analytics</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/30 rounded-xl p-6 hover:border-cyan-500/30 transition-all cursor-pointer"
                  >
                    <Terminal className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-2">Projects</h3>
                    <p className="text-gray-400 text-sm">Access your projects</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}