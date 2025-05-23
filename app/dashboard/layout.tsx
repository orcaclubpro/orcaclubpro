'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home,
  BarChart3,
  FolderOpen,
  FileText,
  Calendar,
  Settings,
  Search,
  LogIn,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Activity,
  Wifi,
  Server
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

// Define particle type for background animation
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

// Dashboard context for sharing state across components
interface DashboardContextType {
  isAuthenticated: boolean;
  currentUser: string | null;
  setAuthState: (authenticated: boolean, userId?: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardLayout');
  }
  return context;
};

// Navigation items - will show different sets based on auth state
const publicNavigation = [
  { id: 'login', name: 'Access POD', icon: LogIn, component: 'login' },
];

const authenticatedNavigation = [
  { id: 'workspace', name: 'Workspace', icon: Home, href: '/dashboard/user/{userId}/home' },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, href: '/dashboard/user/{userId}/analytics' },
  { id: 'projects', name: 'Projects', icon: FolderOpen, href: '/dashboard/user/{userId}/projects' },
  { id: 'documents', name: 'Documents', icon: FileText, href: '/dashboard/user/{userId}/invoices' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, href: '/dashboard/user/{userId}/calendar' },
  { id: 'settings', name: 'Settings', icon: Settings, href: '/dashboard/user/{userId}/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('standby');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  // Initialize floating particles for ambience
  useEffect(() => {
    const initParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.05,
      speedY: (Math.random() - 0.5) * 0.05,
      opacity: Math.random() * 0.4 + 0.1,
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
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Simulate connection status updates
  useEffect(() => {
    const states = ['standby', 'connecting', 'secure'];
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % states.length;
      setConnectionStatus(states[currentIndex]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Update authentication state based on URL
  useEffect(() => {
    const isUserPath = pathname.includes('/dashboard/user/');
    if (isUserPath && !isAuthenticated) {
      // Extract user ID from path
      const userIdMatch = pathname.match(/\/dashboard\/user\/([^\/]+)/);
      if (userIdMatch) {
        setIsAuthenticated(true);
        setCurrentUser(userIdMatch[1]);
        // Set active tab based on current path
        if (pathname.includes('/home')) setActiveTab('workspace');
        else if (pathname.includes('/analytics')) setActiveTab('analytics');
        else if (pathname.includes('/projects')) setActiveTab('projects');
        else if (pathname.includes('/invoices')) setActiveTab('documents');
        else if (pathname.includes('/calendar')) setActiveTab('calendar');
        else if (pathname.includes('/settings')) setActiveTab('settings');
      }
    } else if (!isUserPath && isAuthenticated) {
      // Reset to login state when navigating back to main dashboard
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActiveTab('login');
    }
  }, [pathname, isAuthenticated]);

  const setAuthState = (authenticated: boolean, userId?: string) => {
    setIsAuthenticated(authenticated);
    setCurrentUser(userId || null);
    if (authenticated) {
      setActiveTab('workspace');
      // Automatically redirect to user's home page after successful authentication
      if (userId) {
        router.push(`/dashboard/user/${userId}/home`);
      }
    } else {
      setActiveTab('login');
    }
  };

  const handleNavigation = (item: { id: string; href?: string }) => {
    if (isAuthenticated && item.href) {
      // Navigate to the user's specific route
      const href = item.href.replace('{userId}', currentUser || 'demo');
      router.push(href);
    } else if (item.id === 'login') {
      router.push('/dashboard');
    }
    setActiveTab(item.id);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('login');
    router.push('/dashboard');
  };

  const navigation = isAuthenticated ? authenticatedNavigation : publicNavigation;
  const statusColor = connectionStatus === 'secure' ? 'green' : connectionStatus === 'connecting' ? 'yellow' : 'blue';

  const contextValue: DashboardContextType = {
    isAuthenticated,
    currentUser,
    setAuthState,
    activeTab,
    setActiveTab,
    isSidebarExpanded,
    setIsSidebarExpanded,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="relative overflow-hidden bg-black min-h-screen flex">
        {/* Dynamic background with particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />
          
          {/* Floating particles network */}
          <svg className="absolute inset-0 w-full h-full opacity-30">
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
                {particles.filter(p => p.id > particle.id && Math.sqrt(Math.pow(p.x - particle.x, 2) + Math.pow(p.y - particle.y, 2)) < 20).map(targetParticle => (
                  <line
                    key={`${particle.id}-${targetParticle.id}`}
                    x1={`${particle.x}%`}
                    y1={`${particle.y}%`}
                    x2={`${targetParticle.x}%`}
                    y2={`${targetParticle.y}%`}
                    stroke="white"
                    strokeWidth="0.2"
                    opacity={0.1}
                    className="transition-all duration-300"
                  />
                ))}
              </g>
            ))}
          </svg>

          {/* Subtle code pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]">
            <pre className="text-cyan-400 font-mono text-xs leading-relaxed p-8 overflow-hidden">
{`const pod = {
  environment: 'secure',
  access: 'authorized',
  workspace: 'premium'
};

const authenticate = async () => {
  const session = await secure.validate();
  return workspace.initialize(session);
};`}
            </pre>
          </div>
        </div>

        {/* Modern status bar */}
        <div className="fixed top-0 left-0 right-0 bg-gray-900/60 backdrop-blur-md h-10 border-b border-white/5 z-50">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-3 text-xs font-mono text-gray-300">
              <div className={`w-1.5 h-1.5 rounded-full bg-${statusColor}-400 animate-pulse`} />
              <span>pod.{connectionStatus}</span>
            </div>
            <div className="text-xs text-gray-500 font-mono">orcaclub.pro/workspace</div>
            <div className="flex items-center gap-3">
              <Server className="w-3 h-3 text-gray-500" />
              <Wifi className="w-3 h-3 text-gray-500" />
              <Activity className="w-3 h-3 text-gray-500" />
            </div>
          </div>
        </div>
        
        {/* Persistent Sidebar Navigation with layoutId for seamless transitions */}
        <motion.div 
          layoutId="dashboard-sidebar"
          animate={{ width: isSidebarExpanded ? 280 : 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative bg-gray-900/80 backdrop-blur-md border-r border-gray-700/30 flex flex-col z-40"
          style={{ marginTop: '40px' }}
        >
          {/* POD Header */}
          <div className="p-4 border-b border-gray-700/30">
            <div className="flex items-center justify-between">
              <AnimatePresence>
                {isSidebarExpanded && (
                  <motion.div
                    layoutId="pod-header"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-white">
                        {isAuthenticated ? `POD.${currentUser}` : 'POD Access'}
                      </h2>
                      <p className="text-xs text-gray-400 font-mono">
                        {isAuthenticated ? 'workspace' : 'authentication'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-1.5 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
              >
                {isSidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </motion.button>
            </div>

            {/* Search - authenticated users only */}
            <AnimatePresence>
              {isSidebarExpanded && isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search workspace..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-black/30 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <AnimatePresence>
              {isSidebarExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-mono"
                >
                  {isAuthenticated ? 'workspace' : 'access'}
                </motion.div>
              )}
            </AnimatePresence>

            {navigation.map((item, index) => {
              const isActive = activeTab === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button
                    onClick={() => handleNavigation(item)}
                    className={`group w-full flex items-center rounded-lg p-3 text-sm transition-all duration-200 relative overflow-hidden ${
                      isActive 
                        ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30' 
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    {/* Active indicator with layoutId for smooth transitions */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-r"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}

                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`flex-shrink-0 ${isSidebarExpanded ? 'mr-3' : 'mx-auto'}`}
                    >
                      <item.icon className="h-5 w-5" />
                    </motion.div>

                    <AnimatePresence>
                      {isSidebarExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="truncate font-medium"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-full group-hover:translate-x-full" />
                  </button>
                </motion.div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700/30">
            {/* Logout Button - Only for authenticated users */}
            {isAuthenticated && (
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group w-full flex items-center rounded-lg p-3 text-sm transition-all duration-200 relative overflow-hidden text-gray-300 hover:bg-red-900/30 hover:text-red-300 border border-transparent hover:border-red-500/30 mb-3`}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex-shrink-0 ${isSidebarExpanded ? 'mr-3' : 'mx-auto'}`}
                >
                  <LogOut className="h-5 w-5" />
                </motion.div>

                <AnimatePresence>
                  {isSidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="truncate font-medium"
                    >
                      Logout
                    </motion.span>
                  )}
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-full group-hover:translate-x-full" />
              </motion.button>
            )}
            
            <AnimatePresence>
              {isSidebarExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-gray-500 font-mono text-center"
                >
                  secure workspace platform
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Main Content Area with layoutId for seamless transitions */}
        <motion.div 
          layoutId="dashboard-content"
          className="flex-1 relative z-10" 
          style={{ marginTop: '40px' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </DashboardContext.Provider>
  );
}