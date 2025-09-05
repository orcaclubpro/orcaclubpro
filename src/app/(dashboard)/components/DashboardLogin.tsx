'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2,
  CheckCircle,
  Terminal,
  Shield,
  UserPlus
} from 'lucide-react';
import { loginUser, createDemoUser, registerUser } from '@/lib/payload/auth-actions';

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

interface DashboardLoginProps {
  onAuthSuccess: (userId: string, userName: string, userEmail: string) => void;
}

export function DashboardLogin({ onAuthSuccess }: DashboardLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [particles, setParticles] = useState<Particle[]>([]);

  const authMessages = [
    "establishing secure connection...",
    "validating credentials...",
    "initializing workspace...",
    "✓ access granted"
  ];

  // Initialize floating particles for background
  useEffect(() => {
    const initParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.1,
      speedY: (Math.random() - 0.5) * 0.1,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setParticles(initParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          x: (particle.x + particle.speedX + 100) % 100,
          y: (particle.y + particle.speedY + 100) % 100,
        }))
      );
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'register' && !name)) return;
    
    setIsLoading(true);
    setTerminalLines([]);
    setError(null);

    // Show terminal authentication process
    for (let i = 0; i < authMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 200));
      setTerminalLines(prev => [...prev, authMessages[i]]);
    }

    try {
      let result;
      if (mode === 'login') {
        result = await loginUser(email, password);
      } else {
        result = await registerUser(email, password, name);
        if (result.success) {
          // If registration successful, log them in
          result = await loginUser(email, password);
        }
      }

      if (result.success && result.user) {
        setIsSuccess(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        onAuthSuccess(result.user.id, result.user.name || 'User', result.user.email);
      } else {
        setError(result.error || 'Authentication failed');
        setIsLoading(false);
        setTerminalLines([]);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
      setTerminalLines([]);
    }
  };

  const handleDemoAccess = async () => {
    setIsLoading(true);
    setTerminalLines([]);
    setError(null);
    
    // Show terminal process
    for (let i = 0; i < authMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setTerminalLines(prev => [...prev, authMessages[i]]);
    }

    try {
      const result = await createDemoUser();
      
      if (result.success && result.user) {
        setIsSuccess(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        onAuthSuccess(result.user.id, result.user.name || 'Demo User', result.user.email);
      } else {
        setError(result.error || 'Demo access failed');
        setIsLoading(false);
        setTerminalLines([]);
      }
    } catch (err) {
      console.error('Demo access error:', err);
      setError('Demo access failed');
      setIsLoading(false);
      setTerminalLines([]);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Hero Background with Particles */}
      <div className="absolute inset-0 -inset-x-8 -inset-y-8 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />
        
        {/* Floating particles network */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
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
                      opacity={Math.max(0, 0.2 - distance / 20)}
                      className="transition-all duration-300"
                    />
                  );
                }
                return null;
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* Success State */}
      {isSuccess && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-green-900/30 border border-green-400/30 rounded-lg p-4 mb-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <CheckCircle className="h-5 w-5 text-green-400" />
            </motion.div>
            <span className="text-green-300 text-sm font-medium">POD access granted</span>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-red-900/30 border border-red-400/30 rounded-lg p-4 mb-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-5 w-5 text-red-400" />
            <span className="text-red-300 text-sm font-medium">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl text-white font-medium mb-2">
            {mode === 'login' ? 'Secure Access' : 'Create Account'}
          </h2>
          <p className="text-gray-400 text-sm">
            {mode === 'login' 
              ? 'Enter your credentials to access the POD workspace'
              : 'Create your account to access the POD workspace'
            }
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg p-1 bg-black/30 backdrop-blur-sm border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === 'login'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === 'register'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field - Only for Registration */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-cyan-200 mb-2 font-medium">
                Full Name
              </label>
              <motion.div
                animate={{ scale: focusedField === 'name' ? 1.02 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative"
              >
                <UserPlus className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-300 text-white placeholder-gray-400 text-sm"
                  placeholder="Your full name"
                  disabled={isLoading || isSuccess}
                  required
                />
              </motion.div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm text-cyan-200 mb-2 font-medium">
              Email Address
            </label>
            <motion.div
              animate={{ scale: focusedField === 'email' ? 1.02 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative"
            >
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="w-full pl-12 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-300 text-white placeholder-gray-400 text-sm"
                placeholder="your@email.com"
                disabled={isLoading || isSuccess}
                required
              />
            </motion.div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm text-cyan-200 mb-2 font-medium">
              Password
            </label>
            <motion.div
              animate={{ scale: focusedField === 'password' ? 1.02 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative"
            >
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="w-full pl-12 pr-12 py-3 bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-300 text-white placeholder-gray-400 text-sm"
                placeholder="••••••••"
                disabled={isLoading || isSuccess}
                required
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                disabled={isLoading || isSuccess}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </motion.button>
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading || isSuccess || !email || !password || (mode === 'register' && !name)}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{mode === 'login' ? 'Authenticating...' : 'Creating Account...'}</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Access Granted</span>
              </>
            ) : (
              <>
                <Terminal className="h-4 w-4" />
                <span>{mode === 'login' ? 'Access POD' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Demo Access */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDemoAccess}
            disabled={isLoading || isSuccess}
            className="w-full bg-white/10 text-white p-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-white/15 border border-white/10"
          >
            <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
            <span>Demo Access</span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Terminal Output */}
        {terminalLines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="relative mt-4 p-3 bg-black/50 backdrop-blur-sm rounded border border-cyan-400/20 font-mono text-xs"
          >
            {terminalLines.map((line, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-cyan-400 mb-1"
              >
                <span className="text-cyan-500">$</span> {line}
              </motion.div>
            ))}
            {isLoading && !isSuccess && (
              <div className="inline-block w-2 h-3 bg-cyan-400 ml-1 animate-pulse" />
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}