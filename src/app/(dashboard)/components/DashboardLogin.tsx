'use client';

import { useState } from 'react';
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
  Shield
} from 'lucide-react';

interface DashboardLoginProps {
  onAuthSuccess: (userId: string) => void;
}

export function DashboardLogin({ onAuthSuccess }: DashboardLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  const authMessages = [
    "establishing secure connection...",
    "validating credentials...",
    "initializing workspace...",
    "✓ access granted"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setTerminalLines([]);

    // Simulate terminal authentication process
    for (let i = 0; i < authMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 300));
      setTerminalLines(prev => [...prev, authMessages[i]]);
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSuccess(true);
    
    // Extract username from email for demo
    const userId = email.split('@')[0] || 'demo';
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    onAuthSuccess(userId);
  };

  const handleDemoAccess = async () => {
    setEmail('demo@orcaclub.pro');
    setPassword('demo123');
    setIsLoading(true);
    setTerminalLines([]);
    
    for (let i = 0; i < authMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setTerminalLines(prev => [...prev, authMessages[i]]);
    }

    await new Promise(resolve => setTimeout(resolve, 600));
    setIsSuccess(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    onAuthSuccess('demo');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Success State */}
      {isSuccess && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-900/30 border border-green-400/30 rounded-lg p-4 mb-6 backdrop-blur-sm"
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

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-md rounded-2xl border border-cyan-900/30 p-6"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-linear-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl text-white font-medium mb-2">Secure Access</h2>
          <p className="text-gray-400 text-sm">Enter your credentials to access the POD workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={isLoading || isSuccess || !email || !password}
            className="w-full bg-linear-to-r from-cyan-600 to-blue-700 text-white p-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Access Granted</span>
              </>
            ) : (
              <>
                <Terminal className="h-4 w-4" />
                <span>Access POD</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Demo Access */}
        <div className="mt-4 pt-4 border-t border-gray-700/30">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDemoAccess}
            disabled={isLoading || isSuccess}
            className="w-full bg-white/10 text-white p-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:bg-white/15"
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
            className="mt-4 p-3 bg-black/50 backdrop-blur-sm rounded border border-cyan-400/20 font-mono text-xs"
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