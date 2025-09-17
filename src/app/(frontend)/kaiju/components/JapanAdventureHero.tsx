"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, MapPin, Plane, Compass, Camera, Heart, Clock } from 'lucide-react';
import Image from 'next/image';
import { fetchAllScheduledActivities } from '../lib/actions';
import { type Activity } from '../data/tripData';

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

const JapanAdventureHero = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isTerminalActive, setIsTerminalActive] = useState(false);
  const [codeLineIndex, setCodeLineIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [geometricShapes, setGeometricShapes] = useState<GeometricShape[]>([]);
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Up Next functionality state
  const [nextActivity, setNextActivity] = useState<Activity | null>(null);
  const [tokyoTime, setTokyoTime] = useState(new Date());
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  // Terminal code animation - Japan themed
  const codeLines = [
    "initializing japan adventure protocol...",
    "loading cultural experiences database...",
    "optimizing 16-day journey pathways...",
    "✓ konnichiwa! adventure framework ready"
  ];


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
  }, [isMounted]);

  useEffect(() => {
    setIsMounted(true);
    setIsVisible(true);

    // Mobile detection
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is Tailwind's md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkIsMobile);
    };
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

  // Add 3s delay before terminal starts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTerminalActive(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Up Next functionality - Tokyo time tracking and activity loading
  useEffect(() => {
    let isActive = true;

    const updateTokyoTimeAndActivity = async () => {
      const now = new Date();
      const tokyoNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
      setTokyoTime(tokyoNow);

      try {
        const activities = await fetchAllScheduledActivities();

        if (activities && activities.length > 0) {
          // Get trip start date (November 4, 2024)
          const tripStart = new Date('2024-11-04T00:00:00+09:00');

          // Find next upcoming activity
          const upcoming = activities
            .map(activity => {
              if (!activity.time || !activity.hasTime) return null;

              const [hours, minutes] = activity.time.split(':').map(Number);
              const activityDate = new Date(tripStart);
              activityDate.setDate(tripStart.getDate() + activity.dayIndex);
              activityDate.setHours(hours, minutes, 0, 0);

              return {
                ...activity,
                datetime: activityDate
              };
            })
            .filter(activity => activity && activity.datetime > tokyoNow)
            .sort((a, b) => a!.datetime.getTime() - b!.datetime.getTime());

          if (upcoming.length > 0 && isActive) {
            const next = upcoming[0]!;
            setNextActivity(next);

            // Calculate time until next activity
            const timeDiff = next.datetime.getTime() - tokyoNow.getTime();
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
              setTimeUntilNext(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
              setTimeUntilNext(`${hours}h ${minutes}m`);
            } else {
              setTimeUntilNext(`${minutes}m`);
            }
          } else if (isActive) {
            setNextActivity(null);
            setTimeUntilNext('');
          }
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    // Update immediately
    updateTokyoTimeAndActivity();

    // Update every 30 seconds
    const interval = setInterval(updateTokyoTimeAndActivity, 30000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  // Scroll page with terminal output
  useEffect(() => {
    if (!isTerminalActive) return;
    if (codeLineIndex === 0) return;
    const terminal = terminalRef.current;
    if (terminal) {
      terminal.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [codeLineIndex, isTerminalActive]);

  // Parallax effect values - much more dramatic
  const parallaxY = scrollPosition * 0.8;

  // Calculate gradient position based on mouse movement
  const gradientPosition = {
    x: mousePosition.x,
    y: mousePosition.y
  };


  return (
    <div className="relative overflow-hidden bg-black min-h-screen">
      {/* Background ecosystem */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Hero background image */}
        <div
          className={`absolute inset-0 bg-no-repeat ${
            isMobile
              ? 'bg-cover bg-center' // Mobile: cover ensures full viewport coverage
              : 'bg-cover bg-center transition-transform duration-100 ease-out' // Desktop: with smooth parallax
          }`}
          style={{
            backgroundImage: 'url(/kaiju_hd.png)',
            transform: isMobile
              ? 'none' // No parallax on mobile, image fills viewport properly
              : `translate(${parallaxY * 0.2}px, ${parallaxY * 0.4}px) scale(1.2)`, // Parallax on desktop
            ...(isMobile && {
              // Additional mobile optimizations
              backgroundAttachment: 'scroll', // Better performance on mobile
              willChange: 'auto', // Disable GPU acceleration when not needed
            }),
          }}
        />

        {/* Dynamic gradient overlay responsive to mouse movement */}
        <div
          className="absolute inset-0 opacity-70 transition-all duration-300 ease-out"
          style={{
            background: `
              radial-gradient(circle at ${gradientPosition.x}% ${gradientPosition.y}%,
                rgba(236, 72, 153, 0.4) 0%,
                rgba(168, 85, 247, 0.3) 25%,
                rgba(0, 0, 0, 0.85) 50%),
              linear-gradient(135deg,
                rgba(0, 0, 0, 0.8) 0%,
                rgba(17, 24, 39, 0.7) 50%,
                rgba(0, 0, 0, 0.9) 100%)
            `
          }}
        />

        {/* Floating geometric shapes with mouse influence */}
        <svg className="absolute inset-0 w-full h-full opacity-20 transition-transform duration-150 ease-out" style={{ transform: `translate(${parallaxY * 0.15}px, ${parallaxY * 0.25}px)` }}>
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
                  stroke="rgba(236, 72, 153, 0.6)"
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
          className="absolute inset-0 w-full h-full opacity-40 transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${parallaxY * 0.3}px, ${parallaxY * 0.5}px)`,
          }}
        >
          {particles.map(particle => (
            <g key={particle.id}>
              {/* Main particle */}
              <circle
                cx={`${particle.x}%`}
                cy={`${particle.y}%`}
                r={particle.size}
                fill="rgba(255, 255, 255, 0.6)"
                opacity={particle.opacity}
                className="transition-all duration-1000"
              />
              {/* Particle glow effect */}
              <circle
                cx={`${particle.x}%`}
                cy={`${particle.y}%`}
                r={particle.size * 2}
                fill="rgba(255, 255, 255, 0.1)"
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
                      stroke="rgba(236, 72, 153, 0.4)"
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
          <pre className="text-pink-400 font-mono text-xs leading-relaxed p-8 overflow-hidden">
{`X CASAMIGOS
X CASAMIGOS
X CASAMIGOS
X CASAMIGOS
X CASAMIGOS
X CASAMIGOS
X CASAMIGOS
X CASAMIGOS`}
          </pre>
        </div>
      </div>

      {/* Main content container */}
      <div
        ref={heroRef}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white px-6 pb-20 pt-28"
      >
        {/* Up Next Status bar */}
        <div
          className="fixed top-12 left-6 right-6 flex justify-between items-center py-2 px-4 bg-gray-900/40 backdrop-blur-md rounded-lg border border-white/5"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 0.8s ease-out 200ms',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs text-gray-300 font-mono">
              {nextActivity ? 'up next' : 'planning mode'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {nextActivity ? (
              <>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-cyan-300 font-mono">{timeUntilNext}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-pink-300 font-mono truncate max-w-24 sm:max-w-none">
                    {nextActivity.title}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Plane className="w-3 h-3 text-gray-400" />
                <Compass className="w-3 h-3 text-gray-400" />
                <Camera className="w-3 h-3 text-gray-400" />
              </>
            )}
          </div>
        </div>

        {/* Logo */}
        <div
          className="relative mb-8"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 1s ease-out 400ms',
          }}
        >
          <Image
            src="/orcaclubpro.png"
            alt="ORCACLUB Pro"
            width={120}
            height={120}
            className="w-24 h-24 md:w-30 md:h-30 object-contain"
            priority
          />
        </div>

        {/* Japan Adventure title with glitch effects */}
        <div className="relative py-14 mb-4 flex flex-col items-center">
          <h1
            className="text-5xl md:text-7xl text-center leading-none relative cursor-pointer"
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
              {/* Main title */}
              <span className="font-bold tracking-wide relative z-10">怪獣</span>
              <span className="font-black mx-3 relative z-10 text-white">X</span>
              <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-purple-600 font-black relative z-10" style={{ WebkitTextStroke: '2px white' }}>
                HUNTER
              </span>

              {/* Subtle glitch layers - always active */}
              <span className="absolute inset-0 font-bold tracking-wide text-red-500 opacity-15 animate-glitch-1">
                <span>怪獣</span>
                <span className="font-black mx-3 text-red-500">X</span>
                <span className="text-red-400 font-black" style={{ WebkitTextStroke: '2px white' }}>HUNTER</span>
              </span>
              <span className="absolute inset-0 font-bold tracking-wide text-cyan-400 opacity-12 animate-glitch-2">
                <span>怪獣</span>
                <span className="font-black mx-3 text-cyan-400">X</span>
                <span className="text-cyan-300 font-black" style={{ WebkitTextStroke: '2px white' }}>HUNTER</span>
              </span>
              <span className="absolute inset-0 font-bold tracking-wide text-green-400 opacity-10 animate-glitch-3">
                <span>怪獣</span>
                <span className="font-black mx-3 text-green-400">X</span>
                <span className="text-green-300 font-black" style={{ WebkitTextStroke: '2px white' }}>HUNTER</span>
              </span>
              <span className="absolute inset-0 font-bold tracking-wide text-yellow-400 opacity-8 animate-glitch-4">
                <span>怪獣</span>
                <span className="font-black mx-3 text-yellow-400">X</span>
                <span className="text-yellow-300 font-black" style={{ WebkitTextStroke: '2px white' }}>HUNTER</span>
              </span>

              {/* Scrambled text glitch effect */}
              <span className="absolute inset-0 font-bold tracking-wide text-white opacity-6 animate-glitch-scramble">
                <span>怪獸</span>
                <span className="font-black mx-3 text-white">X</span>
                <span className="font-black" style={{ WebkitTextStroke: '2px white' }}>H█NT█R</span>
              </span>
              <span className="absolute inset-0 font-bold tracking-wide text-white opacity-4 animate-glitch-scramble-2">
                <span>███</span>
                <span className="font-black mx-3 text-white">X</span>
                <span className="font-black" style={{ WebkitTextStroke: '2px white' }}>██NTER</span>
              </span>
            </span>
          </h1>

          {/* Trip details */}
          <div
            className="text-center mt-6 mb-2 space-y-2"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s ease-out 900ms',
            }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-pink-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">November 4-19, 2024</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">16-Day Journey</span>
              </div>
            </div>
            <p className="text-lg text-pink-200 font-light tracking-wider max-w-2xl mx-auto">
              Plan and organize your ultimate Japan experience with detailed daily itineraries
            </p>
          </div>
        </div>

        {/* Padding between branding and service cards */}
        <div className="h-10" />

        {/* Compact experience cards */}
        <div
          className="relative w-full max-w-md mb-6"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease-out 1100ms',
          }}
        >
          <div className="relative grid grid-cols-3 gap-4 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-pink-900/30">
            {/* Cultural Experiences */}
            <div className="flex flex-col items-center justify-center py-4">
              <Heart className="w-6 h-6 mb-1 text-pink-300" />
              <span className="text-xs text-pink-100 font-mono">culture.immersion</span>
              {/* Activity indicator */}
              <span className="mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDuration: '2s' }} />
                <span className="text-[10px] text-pink-300/70">active</span>
              </span>
            </div>
            {/* Adventure Planning */}
            <div className="flex flex-col items-center justify-center py-4">
              <Compass className="w-6 h-6 mb-1 text-purple-300" />
              <span className="text-xs text-pink-100 font-mono">adventure.planning</span>
              {/* Activity indicator */}
              <span className="mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDuration: '2.5s' }} />
                <span className="text-[10px] text-pink-300/70">active</span>
              </span>
            </div>
            {/* Memory Capture */}
            <div className="flex flex-col items-center justify-center py-4">
              <Camera className="w-6 h-6 mb-1 text-cyan-300" />
              <span className="text-xs text-pink-100 font-mono">memory.capture</span>
              {/* Activity indicator */}
              <span className="mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDuration: '1.7s' }} />
                <span className="text-[10px] text-pink-300/70">active</span>
              </span>
            </div>
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

        @keyframes glitch-1 {
          0%, 95% { transform: translate(0, 0) skew(0deg); }
          96% { transform: translate(-1px, 0px) skew(-0.5deg); }
          97% { transform: translate(1px, -1px) skew(0.3deg); }
          98% { transform: translate(-0.5px, 1px) skew(-0.2deg); }
          99% { transform: translate(0.5px, 0px) skew(0.1deg); }
          100% { transform: translate(0, 0) skew(0deg); }
        }

        @keyframes glitch-2 {
          0%, 92% { transform: translate(0, 0) scale(1) rotate(0deg); }
          93% { transform: translate(1px, -1px) scale(1.005) rotate(0.2deg); }
          94% { transform: translate(-1px, 1px) scale(0.998) rotate(-0.2deg); }
          95% { transform: translate(0.5px, -0.5px) scale(1.002) rotate(0.1deg); }
          96% { transform: translate(-0.5px, 0.5px) scale(0.999) rotate(-0.1deg); }
          97% { transform: translate(1px, 0px) scale(1.003) rotate(0.15deg); }
          98% { transform: translate(-1px, -0.5px) scale(0.997) rotate(-0.15deg); }
          99% { transform: translate(0.5px, 1px) scale(1.001) rotate(0.05deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }

        @keyframes glitch-3 {
          0%, 88% { transform: translate(0, 0); opacity: 0.4; }
          89% { transform: translate(-1.5px, 1px); opacity: 0.6; }
          90% { transform: translate(1px, -1.5px); opacity: 0.2; }
          91% { transform: translate(-1px, -0.5px); opacity: 0.5; }
          92% { transform: translate(1.5px, 1.5px); opacity: 0.3; }
          93% { transform: translate(-0.5px, -1px); opacity: 0.7; }
          94% { transform: translate(1px, 0.5px); opacity: 0.4; }
          95% { transform: translate(-1.5px, 0px); opacity: 0.6; }
          96% { transform: translate(0.5px, -1px); opacity: 0.2; }
          97% { transform: translate(-0.5px, 1.5px); opacity: 0.5; }
          98% { transform: translate(1.5px, -0.5px); opacity: 0.3; }
          99% { transform: translate(-1px, 1px); opacity: 0.6; }
          100% { transform: translate(0, 0); opacity: 0.4; }
        }

        @keyframes glitch-4 {
          0%, 85% { transform: translate(0, 0); filter: hue-rotate(0deg); }
          86% { transform: translate(2px, -1px); filter: hue-rotate(15deg); }
          87% { transform: translate(-1px, 2px); filter: hue-rotate(30deg); }
          88% { transform: translate(1px, -2px); filter: hue-rotate(45deg); }
          89% { transform: translate(-2px, 1px); filter: hue-rotate(60deg); }
          90% { transform: translate(1.5px, 1px); filter: hue-rotate(75deg); }
          91% { transform: translate(-1px, -1.5px); filter: hue-rotate(90deg); }
          92% { transform: translate(2px, 0.5px); filter: hue-rotate(105deg); }
          93% { transform: translate(-1.5px, -1px); filter: hue-rotate(120deg); }
          94% { transform: translate(1px, 2px); filter: hue-rotate(135deg); }
          95% { transform: translate(-0.5px, -2px); filter: hue-rotate(150deg); }
          96% { transform: translate(2px, 1px); filter: hue-rotate(165deg); }
          97% { transform: translate(-2px, 0.5px); filter: hue-rotate(180deg); }
          98% { transform: translate(1px, -1px); filter: hue-rotate(195deg); }
          99% { transform: translate(-1px, 1.5px); filter: hue-rotate(210deg); }
          100% { transform: translate(0, 0); filter: hue-rotate(0deg); }
        }

        @keyframes glitch-scramble {
          0%, 90% { transform: translate(0, 0); opacity: 0.2; }
          91% { transform: translate(-2px, 1px); opacity: 0.4; }
          92% { transform: translate(1px, -2px); opacity: 0.1; }
          93% { transform: translate(-1px, 1.5px); opacity: 0.5; }
          94% { transform: translate(2px, -0.5px); opacity: 0.2; }
          95% { transform: translate(-1.5px, -1px); opacity: 0.3; }
          96% { transform: translate(1px, 2px); opacity: 0.1; }
          97% { transform: translate(-1px, 0.5px); opacity: 0.4; }
          98% { transform: translate(1.5px, -1.5px); opacity: 0.2; }
          99% { transform: translate(-2px, 1px); opacity: 0.3; }
          100% { transform: translate(0, 0); opacity: 0.2; }
        }

        @keyframes glitch-scramble-2 {
          0%, 87% { transform: translate(0, 0) scaleX(1); opacity: 0.15; }
          88% { transform: translate(2.5px, -1px) scaleX(0.98); opacity: 0.2; }
          89% { transform: translate(-1.5px, 2px) scaleX(1.02); opacity: 0.4; }
          90% { transform: translate(1px, -2.5px) scaleX(0.99); opacity: 0.1; }
          91% { transform: translate(-2px, 1.5px) scaleX(1.01); opacity: 0.3; }
          92% { transform: translate(1.5px, 1px) scaleX(0.97); opacity: 0.5; }
          93% { transform: translate(-1px, -2px) scaleX(1.03); opacity: 0.2; }
          94% { transform: translate(2px, 1px) scaleX(0.96); opacity: 0.4; }
          95% { transform: translate(-2.5px, -1px) scaleX(1.04); opacity: 0.2; }
          96% { transform: translate(1px, 2px) scaleX(0.95); opacity: 0.3; }
          97% { transform: translate(-0.5px, -2.5px) scaleX(1.05); opacity: 0.1; }
          98% { transform: translate(2.5px, 0.5px) scaleX(0.94); opacity: 0.4; }
          99% { transform: translate(-2px, 1.5px) scaleX(1.06); opacity: 0.2; }
          100% { transform: translate(0, 0) scaleX(1); opacity: 0.15; }
        }

        .animate-glitch-1 {
          animation: glitch-1 4.7s infinite linear;
          animation-delay: 0.3s;
        }

        .animate-glitch-2 {
          animation: glitch-2 6.2s infinite linear;
          animation-delay: 1.1s;
        }

        .animate-glitch-3 {
          animation: glitch-3 5.8s infinite linear;
          animation-delay: 2.3s;
        }

        .animate-glitch-4 {
          animation: glitch-4 7.1s infinite linear;
          animation-delay: 0.7s;
        }

        .animate-glitch-scramble {
          animation: glitch-scramble 8.3s infinite linear;
          animation-delay: 1.9s;
        }

        .animate-glitch-scramble-2 {
          animation: glitch-scramble-2 9.7s infinite linear;
          animation-delay: 3.1s;
        }
      `}</style>
    </div>
  );
};

export default JapanAdventureHero;