'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Code2, Palette, Target } from 'lucide-react';
import { DashboardLogin } from '../components/DashboardLogin';
import { useDashboard } from '../layout';

// Define a type for particles
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

export default function DashboardPage() {
  const { 
    isAuthenticated, 
    setAuthState, 
    activeTab
  } = useDashboard();
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize floating particles for hero background
  useEffect(() => {
    const initParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.4 + 0.1,
    }));
    setParticles(initParticles);
    setIsMounted(true);
  }, []);

  // Update particles position
  useEffect(() => {
    if (!isMounted) return;
    
    const interval = setInterval(() => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: (particle.x + particle.speedX + 100) % 100,
          y: (particle.y + particle.speedY + 100) % 100,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isMounted]);

  const handleAuthSuccess = (userId: string, userName: string, userEmail: string) => {
    setAuthState(true, userId);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero Background with particles - similar to homepage */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        
        {/* Floating particles with connections */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-30"
        >
          {particles.map(particle => (
            <g key={particle.id}>
              <circle
                cx={`${particle.x}%`}
                cy={`${particle.y}%`}
                r={particle.size}
                fill="white"
                opacity={particle.opacity}
                className="transition-all duration-1000"
              />
              {particles.filter(p => p.id > particle.id).map(targetParticle => {
                const distance = Math.sqrt(
                  Math.pow(targetParticle.x - particle.x, 2) + 
                  Math.pow(targetParticle.y - particle.y, 2)
                );
                if (distance < 20) {
                  return (
                    <line
                      key={`${particle.id}-${targetParticle.id}`}
                      x1={`${particle.x}%`}
                      y1={`${particle.y}%`}
                      x2={`${targetParticle.x}%`}
                      y2={`${targetParticle.y}%`}
                      stroke="white"
                      strokeWidth="0.5"
                      opacity={Math.max(0, 0.3 - distance / 20)}
                      className="transition-all duration-300"
                    />
                  );
                }
                return null;
              })}
            </g>
          ))}
        </svg>

        {/* Code-like background pattern */}
        <div className="absolute inset-0 opacity-5">
          <pre className="text-green-400 font-mono text-xs leading-relaxed p-8 overflow-hidden">
{`export const pod = {
  environment: 'secure',
  access: 'authenticated',
  workspace: 'premium'
};

const authenticate = async () => {
  const session = await secure.validate();
  return workspace.initialize(session);
};`}
          </pre>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Brand Header - Minimal and Clean */}
        <div className="flex flex-col items-center justify-center pt-20 pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl md:text-6xl text-white leading-none mb-3" style={{ letterSpacing: '-0.02em' }}>
              <span className="font-light tracking-wide">ORCA</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 font-medium">CLUB</span>
            </h1>
            <p className="text-xl text-blue-200 font-light tracking-wider">
              {isAuthenticated ? 'secure workspace' : 'pod access portal'}
            </p>
          </motion.div>

          {/* Service indicators - only show when not authenticated */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-md mb-8"
            >
              <div className="relative grid grid-cols-3 gap-4 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-blue-900/30">
                {/* Custom Software */}
                <div className="flex flex-col items-center justify-center py-4">
                  <Code2 className="w-6 h-6 mb-1 text-blue-300" />
                  <span className="text-xs text-blue-100 font-mono">custom.software</span>
                  <span className="mt-2 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDuration: '2s' }} />
                    <span className="text-[10px] text-blue-300/70">uptime</span>
                  </span>
                </div>
                {/* Digital Design */}
                <div className="flex flex-col items-center justify-center py-4">
                  <Palette className="w-6 h-6 mb-1 text-indigo-300" />
                  <span className="text-xs text-blue-100 font-mono">digital.design</span>
                  <span className="mt-2 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDuration: '2.5s' }} />
                    <span className="text-[10px] text-blue-300/70">uptime</span>
                  </span>
                </div>
                {/* Project Management */}
                <div className="flex flex-col items-center justify-center py-4">
                  <Target className="w-6 h-6 mb-1 text-cyan-300" />
                  <span className="text-xs text-blue-100 font-mono">project.mgmt</span>
                  <span className="mt-2 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDuration: '1.7s' }} />
                    <span className="text-[10px] text-blue-300/70">uptime</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Dynamic Content Based on Active Tab */}
        <div className="flex-1 flex items-center justify-center px-8 pb-20">
          <AnimatePresence mode="wait">
            {activeTab === 'login' && !isAuthenticated && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
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
                className="max-w-4xl mx-auto text-center"
              >
                <Terminal className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
                <h2 className="text-3xl text-white mb-4 font-light">Welcome to your POD</h2>
                <p className="text-gray-400 mb-12 text-lg font-light leading-relaxed">
                  Your secure workspace is ready. Select a workspace area from the navigation.
                </p>
                
                {/* Quick Access Cards - Minimal Design */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-cyan-400/30 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <Terminal className="h-8 w-8 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-medium mb-2">Workspace</h3>
                    <p className="text-gray-400 text-sm font-light">Access your workspace</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-cyan-400/30 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <Terminal className="h-8 w-8 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-medium mb-2">Analytics</h3>
                    <p className="text-gray-400 text-sm font-light">Access your analytics</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-cyan-400/30 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <Terminal className="h-8 w-8 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-medium mb-2">Projects</h3>
                    <p className="text-gray-400 text-sm font-light">Access your projects</p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}