"use client";

import React, { useState, useEffect, useRef } from 'react';
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
}

const Hero = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isTerminalActive, setIsTerminalActive] = useState(false);
  const [codeLineIndex, setCodeLineIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [buttonStates, setButtonStates] = useState({
    custom: 'idle',
    login: 'idle'
  });

  // Terminal code animation
  const codeLines = [
    "deploying premium solutions...",
    "initializing creative workflow...",
    "building tomorrow's digital landscape...",
    "✓ workflow redesigned successfully"
  ];

  // Initialize particles
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

  useEffect(() => {
    setIsMounted(true);
    setIsVisible(true);

    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
        };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        
        {/* Floating particles with connections */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-30"
          style={{
            transform: `translate(${parallaxY * 0.1}px, ${parallaxY * 0.2}px)`,
          }}
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
            className="text-6xl md:text-8xl text-center leading-none relative"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
              transition: 'all 1s ease-out 600ms',
              letterSpacing: '-0.02em'
            }}
          >
            <span className="inline-block">
              <span className="font-light tracking-wide">ORCA</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500 font-medium">CLUB</span>
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
            className="group relative w-full overflow-hidden bg-white text-black p-4 rounded-lg font-medium transition-all duration-300"
            style={{ 
              transform: buttonStates.custom === 'pressed' ? 'scale(0.98)' : 'scale(1)',
              boxShadow: buttonStates.custom === 'pressed' 
                ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' 
                : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <Terminal className="w-4 h-4" />
              <span>Custom Solutions</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
            
            {/* Button shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </button>

          {/* Pod Login Button */}
          <button 
            onMouseDown={() => handleButtonPress('login')}
            className="group relative w-full overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg font-medium transition-all duration-300"
            style={{
              transform: buttonStates.login === 'pressed' ? 'scale(0.98)' : 'scale(1)',
              boxShadow: buttonStates.login === 'pressed' 
                ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)' 
                : '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
              <span>Pod Login</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
            
            {/* Button shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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