"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Code2, Palette, Target, Terminal, GitBranch, Activity, Coffee } from 'lucide-react';

// Define a type for particles
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  targetX?: number;
  targetY?: number;
  attractedToMouse?: boolean;
}

// Define type for mouse position
interface MousePosition {
  x: number;
  y: number;
}

// Define type for geometric shapes
interface GeometricShape {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  type: 'triangle' | 'square' | 'hexagon';
  opacity: number;
  speed: number;
}

const Hero = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isTerminalActive, setIsTerminalActive] = useState(false);
  const [codeLineIndex, setCodeLineIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [geometricShapes, setGeometricShapes] = useState<GeometricShape[]>([]);
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [gradientPosition, setGradientPosition] = useState({ x: 50, y: 50 });
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [buttonStates, setButtonStates] = useState({
    custom: 'idle',
    login: 'idle'
  });
  const [buttonMagnetPositions, setButtonMagnetPositions] = useState({
    custom: { x: 0, y: 0 },
    login: { x: 0, y: 0 }
  });

  // Terminal code animation
  const codeLines = [
    "deploying premium solutions...",
    "initializing creative workflow...",
    "building tomorrow's digital landscape...",
    "✓ workflow redesigned successfully"
  ];

  // Mouse tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (rect) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });

      // Smooth gradient following
      setGradientPosition(prev => ({
        x: prev.x + (x - prev.x) * 0.1,
        y: prev.y + (y - prev.y) * 0.1
      }));
    }
  }, []);

  // Initialize particles with enhanced properties
  useEffect(() => {
    const initParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      attractedToMouse: Math.random() > 0.7,
    }));
    setParticles(initParticles);

    // Initialize geometric shapes
    const initShapes = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 30 + 20,
      rotation: Math.random() * 360,
      type: ['triangle', 'square', 'hexagon'][Math.floor(Math.random() * 3)] as 'triangle' | 'square' | 'hexagon',
      opacity: Math.random() * 0.1 + 0.05,
      speed: Math.random() * 0.5 + 0.2,
    }));
    setGeometricShapes(initShapes);
  }, []);

  // Update particles position with mouse interaction
  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      setParticles(prevParticles =>
        prevParticles.map(particle => {
          let newX = particle.x;
          let newY = particle.y;

          if (particle.attractedToMouse) {
            // Attract particles to mouse
            const dx = mousePosition.x - particle.x;
            const dy = mousePosition.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30) {
              newX += dx * 0.02;
              newY += dy * 0.02;
            } else {
              newX = (particle.x + particle.speedX + 100) % 100;
              newY = (particle.y + particle.speedY + 100) % 100;
            }
          } else {
            newX = (particle.x + particle.speedX + 100) % 100;
            newY = (particle.y + particle.speedY + 100) % 100;
          }

          return {
            ...particle,
            x: newX,
            y: newY,
          };
        })
      );

      // Update geometric shapes rotation
      setGeometricShapes(prevShapes =>
        prevShapes.map(shape => ({
          ...shape,
          rotation: (shape.rotation + shape.speed) % 360,
          x: (shape.x + Math.sin(Date.now() * 0.001 + shape.id) * 0.01 + 100) % 100,
          y: (shape.y + Math.cos(Date.now() * 0.0008 + shape.id) * 0.01 + 100) % 100,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isMounted, mousePosition]);

  useEffect(() => {
    setIsMounted(true);
    setIsVisible(true);

    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  // Terminal animation
  useEffect(() => {
    if (!isTerminalActive) return;
    
    const timer = setTimeout(() => {
      if (codeLineIndex < codeLines.length - 1) {
        setCodeLineIndex(prev => prev + 1);
      }
    }, 800 + Math.random() * 400);
    
    return () => clearTimeout(timer);
  }, [isTerminalActive, codeLineIndex, codeLines.length]);

  // 6. Add 3s delay before terminal starts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTerminalActive(true);
    }, 3000); // 3 second delay
    return () => clearTimeout(timer);
  }, []);

  // 5. Scroll page with terminal output
  useEffect(() => {
    if (!isTerminalActive) return;
    if (codeLineIndex === 0) return;
    const terminal = terminalRef.current;
    if (terminal) {
      terminal.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [codeLineIndex, isTerminalActive]);

  // Parallax effect values
  const parallaxY = scrollPosition * 0.3;

  // Button interaction handlers
  const handleButtonPress = (button: 'custom' | 'login') => {
    setButtonStates(prev => ({ ...prev, [button]: 'pressed' }));
    setTimeout(() => {
      setButtonStates(prev => ({ ...prev, [button]: 'released' }));
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, [button]: 'idle' }));
      }, 200);
    }, 150);
  };

  // Magnetic button effect
  const handleButtonMouseMove = (e: React.MouseEvent, button: 'custom' | 'login') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;

    setButtonMagnetPositions(prev => ({
      ...prev,
      [button]: { x: deltaX, y: deltaY }
    }));
  };

  const handleButtonMouseLeave = (button: 'custom' | 'login') => {
    setButtonMagnetPositions(prev => ({
      ...prev,
      [button]: { x: 0, y: 0 }
    }));
  };

  return (
    <div className="relative overflow-hidden bg-black min-h-screen">
      {/* Browser window frame */}
      <div className="absolute top-4 left-0 right-0 bg-gray-900/80 backdrop-blur-md h-8 border-b border-white/10">
        {/* macOS window controls */}
        <div className="absolute right-4 top-2 flex gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer" />
          <div className="w-4 h-4 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer" />
          <div className="w-4 h-4 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer" />
        </div>
        
        {/* URL bar suggestion */}
        <div className="absolute left-1/2 top-2 -translate-x-1/2 text-xs text-gray-400 font-mono">
          orcaclub.io — your digital future starts here
        </div>
      </div>

      {/* Background ecosystem */}
      <div className="absolute inset-0 overflow-hidden">

        {/* Dynamic morphing gradient overlay */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: `
              radial-gradient(circle at ${gradientPosition.x}% ${gradientPosition.y}%,
                rgba(59, 130, 246, 0.4) 0%,
                rgba(99, 102, 241, 0.3) 25%,
                rgba(0, 0, 0, 0.85) 50%),
              linear-gradient(135deg,
                rgba(0, 0, 0, 0.8) 0%,
                rgba(17, 24, 39, 0.7) 50%,
                rgba(0, 0, 0, 0.9) 100%)
            `,
            transition: 'background 0.3s ease-out'
          }}
        />

        {/* Floating geometric shapes */}
        <svg className="absolute inset-0 w-full h-full opacity-20" style={{ transform: `translate(${parallaxY * 0.05}px, ${parallaxY * 0.1}px)` }}>
          {geometricShapes.map(shape => {
            const getShapePath = () => {
              switch (shape.type) {
                case 'triangle':
                  return `M${shape.size/2},0 L${shape.size},${shape.size} L0,${shape.size} Z`;
                case 'square':
                  return `M0,0 L${shape.size},0 L${shape.size},${shape.size} L0,${shape.size} Z`;
                case 'hexagon':
                  const s = shape.size / 2;
                  return `M${s},0 L${s*1.5},${s*0.5} L${s*1.5},${s*1.5} L${s},${s*2} L${s*0.5},${s*1.5} L${s*0.5},${s*0.5} Z`;
                default:
                  return '';
              }
            };

            return (
              <g key={shape.id}>
                <path
                  d={getShapePath()}
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.6)"
                  strokeWidth="1"
                  opacity={shape.opacity}
                  transform={`translate(${shape.x}%, ${shape.y}%) rotate(${shape.rotation}) translate(-${shape.size/2}, -${shape.size/2})`}
                  className="transition-all duration-1000"
                />
              </g>
            );
          })}
        </svg>
        
        {/* Enhanced floating particles with connections */}
        <svg
          className="absolute inset-0 w-full h-full opacity-40"
          style={{
            transform: `translate(${parallaxY * 0.1}px, ${parallaxY * 0.2}px)`,
          }}
        >
          {particles.map(particle => (
            <g key={particle.id}>
              {/* Main particle */}
              <circle
                cx={`${particle.x}%`}
                cy={`${particle.y}%`}
                r={particle.size}
                fill={particle.attractedToMouse ? "rgba(59, 130, 246, 0.8)" : "rgba(255, 255, 255, 0.6)"}
                opacity={particle.opacity}
                className="transition-all duration-1000"
              />
              {/* Particle glow effect */}
              <circle
                cx={`${particle.x}%`}
                cy={`${particle.y}%`}
                r={particle.size * 2}
                fill={particle.attractedToMouse ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.1)"}
                opacity={particle.opacity * 0.5}
                className="transition-all duration-1000"
              />
              {/* Connections between particles */}
              {particles.filter(p => p.id > particle.id).map(targetParticle => {
                const distance = Math.sqrt(
                  Math.pow(targetParticle.x - particle.x, 2) +
                  Math.pow(targetParticle.y - particle.y, 2)
                );
                if (distance < 25) {
                  return (
                    <line
                      key={`${particle.id}-${targetParticle.id}`}
                      x1={`${particle.x}%`}
                      y1={`${particle.y}%`}
                      x2={`${targetParticle.x}%`}
                      y2={`${targetParticle.y}%`}
                      stroke="rgba(59, 130, 246, 0.4)"
                      strokeWidth="0.5"
                      opacity={Math.max(0, 0.4 - distance / 25)}
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
{`export const designPhilosophy = {
  core: 'elegance meets functionality',
  approach: 'human-centered innovation',
  commitment: 'transforming workflows'
};

const buildFuture = async () => {
  const vision = await reimagine(workflow);
  return premium(vision.execute());
};`}
          </pre>
        </div>
      </div>

      {/* Main content container */}
      <div 
        ref={heroRef}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white px-6 pb-20 pt-28"
      >
        {/* Status bar */}
        <div 
          className="fixed top-12 left-6 right-6 flex justify-between items-center py-2 px-4 bg-gray-900/40 backdrop-blur-md rounded-lg border border-white/5"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 0.8s ease-out 200ms',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-300 font-mono">system ready</span>
          </div>
          <div className="flex items-center gap-4">
            <GitBranch className="w-3 h-3 text-gray-400" />
            <Activity className="w-3 h-3 text-gray-400" />
            <Coffee className="w-3 h-3 text-gray-400" />
          </div>
        </div>

        {/* Isolated brand display with emphasis */}
        <div className="relative py-14 mb-4 flex flex-col items-center">
          <h1
            className="text-6xl md:text-8xl text-center leading-none relative cursor-pointer"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'all 1s ease-out 600ms',
              letterSpacing: '-0.02em'
            }}
            onMouseEnter={() => setIsHoveringTitle(true)}
            onMouseLeave={() => setIsHoveringTitle(false)}
          >
            <span className="inline-block relative">
              <span className="font-light tracking-wide">ORCA</span>
              <span className={`text-transparent bg-clip-text bg-linear-to-r from-blue-300 to-blue-500 font-medium transition-all duration-300 ${isHoveringTitle ? 'animate-pulse' : ''}`}>
                CLUB
              </span>
              {/* Glitch effect overlay */}
              {isHoveringTitle && (
                <>
                  <span className="absolute inset-0 font-light tracking-wide text-red-500 opacity-20 animate-ping" style={{ transform: 'translate(-2px, -2px)' }}>
                    ORCA
                  </span>
                  <span className="absolute inset-0 font-medium text-cyan-400 opacity-20 animate-ping" style={{ transform: 'translate(2px, 2px)' }}>
                    CLUB
                  </span>
                </>
              )}
            </span>
          </h1>
          {/* Tagline directly under branding */}
          <div 
            className="text-center mt-4 mb-2"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s ease-out 900ms',
            }}
          >
            <p className="text-xl text-blue-200 font-light tracking-wider">redesign your workflow</p>
          </div>
        </div>

        {/* Padding between branding and service cards */}
        <div className="h-10" />
        
        {/* Compact service cards with animated uptime indicator */}
        <div 
          className="relative w-full max-w-md mb-6"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease-out 1100ms',
          }}
        >
          <div className="relative grid grid-cols-3 gap-4 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-blue-900/30">
            {/* Custom Software */}
            <div className="flex flex-col items-center justify-center py-4">
              <Code2 className="w-6 h-6 mb-1 text-blue-300" />
              <span className="text-xs text-blue-100 font-mono">custom.software</span>
              {/* Uptime indicator */}
              <span className="mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDuration: '2s' }} />
                <span className="text-[10px] text-blue-300/70">uptime</span>
              </span>
            </div>
            {/* Digital Design */}
            <div className="flex flex-col items-center justify-center py-4">
              <Palette className="w-6 h-6 mb-1 text-indigo-300" />
              <span className="text-xs text-blue-100 font-mono">digital.design</span>
              {/* Uptime indicator */}
              <span className="mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDuration: '2.5s' }} />
                <span className="text-[10px] text-blue-300/70">uptime</span>
              </span>
            </div>
            {/* Project Management */}
            <div className="flex flex-col items-center justify-center py-4">
              <Target className="w-6 h-6 mb-1 text-cyan-300" />
              <span className="text-xs text-blue-100 font-mono">project.mgmt</span>
              {/* Uptime indicator */}
              <span className="mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDuration: '1.7s' }} />
                <span className="text-[10px] text-blue-300/70">uptime</span>
              </span>
            </div>
          </div>
        </div>

        {/* Premium CTAs */}
        <div 
          className="relative w-full max-w-sm space-y-4"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease-out 1300ms',
          }}
        >
          {/* Custom Solutions Button */}
          <button
            onMouseDown={() => handleButtonPress('custom')}
            onMouseMove={(e) => handleButtonMouseMove(e, 'custom')}
            onMouseLeave={() => handleButtonMouseLeave('custom')}
            className="group relative w-full overflow-hidden bg-white text-black p-4 rounded-lg font-medium transition-all duration-300"
            style={{
              transform: `scale(${buttonStates.custom === 'pressed' ? 0.98 : 1}) translate(${buttonMagnetPositions.custom.x}px, ${buttonMagnetPositions.custom.y}px)`,
              boxShadow: buttonStates.custom === 'pressed'
                ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                : '0 4px 20px 0 rgba(255, 255, 255, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <Terminal className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Custom Solutions</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>

            {/* Button shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-black/10 to-transparent" />

            {/* Magnetic border glow */}
            <div className="absolute inset-0 rounded-lg border border-blue-300/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          {/* Pod Login Button */}
          <button
            onMouseDown={() => handleButtonPress('login')}
            onMouseMove={(e) => handleButtonMouseMove(e, 'login')}
            onMouseLeave={() => handleButtonMouseLeave('login')}
            className="group relative w-full overflow-hidden bg-linear-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg font-medium transition-all duration-300"
            style={{
              transform: `scale(${buttonStates.login === 'pressed' ? 0.98 : 1}) translate(${buttonMagnetPositions.login.x}px, ${buttonMagnetPositions.login.y}px)`,
              boxShadow: buttonStates.login === 'pressed'
                ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)'
                : '0 8px 32px 0 rgba(59, 130, 246, 0.6), 0 4px 14px 0 rgba(59, 130, 246, 0.4)',
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse transition-transform group-hover:scale-125" />
              <span>Pod Login</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>

            {/* Button shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent" />

            {/* Magnetic border glow */}
            <div className="absolute inset-0 rounded-lg border border-cyan-300/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          
          {/* Terminal output with breathing space */}
          <div 
            ref={terminalRef}
            className="mt-6 p-3 bg-black/50 backdrop-blur-sm rounded border border-green-400/20 font-mono text-xs"
          >
            {isTerminalActive && codeLines.slice(0, codeLineIndex + 1).map((line, index) => (
              <div key={index} className="text-green-400">
                <span className="text-green-500">$</span> {line}
              </div>
            ))}
            {isTerminalActive && (
              <div className="inline-block w-2 h-3 bg-green-400 ml-1 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Custom animations and effects */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Hero;