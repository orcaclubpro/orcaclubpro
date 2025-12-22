"use client";

import React, { useState, useEffect, useMemo } from 'react';

// Define particle interface
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

interface AnimatedBackgroundProps {
  className?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ className = "" }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize particles
  useEffect(() => {
    const initParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.1,
      speedY: (Math.random() - 0.5) * 0.1,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setParticles(initParticles);
  }, []);

  // Update particles position using requestAnimationFrame
  useEffect(() => {
    if (!isMounted) return;

    let animationFrameId: number;
    let lastUpdateTime = Date.now();

    const updateParticles = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTime;

      // Update at ~60fps (16ms intervals)
      if (deltaTime >= 16) {
        lastUpdateTime = now;
        setParticles(prevParticles =>
          prevParticles.map(particle => ({
            ...particle,
            x: (particle.x + particle.speedX + 100) % 100,
            y: (particle.y + particle.speedY + 100) % 100,
          }))
        );
      }

      animationFrameId = requestAnimationFrame(updateParticles);
    };

    animationFrameId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isMounted]);

  // Throttled scroll handler with passive listener
  useEffect(() => {
    setIsMounted(true);

    let scrollTicking = false;

    const handleScroll = () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          setScrollPosition(window.scrollY);
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Memoized parallax effect values
  const parallaxY = useMemo(() => scrollPosition * 0.3, [scrollPosition]);
  const parallaxSlow = useMemo(() => scrollPosition * 0.1, [scrollPosition]);

  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-linear-to-br from-black via-gray-900 to-black" />
      
      {/* Floating particles with connections */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        style={{
          transform: `translate(${parallaxSlow}px, ${parallaxY * 0.2}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      >
        {particles.map((particle, idx) => (
          <g key={particle.id}>
            <circle
              cx={`${particle.x}%`}
              cy={`${particle.y}%`}
              r={particle.size}
              fill="white"
              opacity={particle.opacity}
            />
            {particles.slice(idx + 1, idx + 6).map(targetParticle => {
              const distance = Math.sqrt(
                Math.pow(targetParticle.x - particle.x, 2) +
                Math.pow(targetParticle.y - particle.y, 2)
              );
              if (distance < 15) {
                return (
                  <line
                    key={`${particle.id}-${targetParticle.id}`}
                    x1={`${particle.x}%`}
                    y1={`${particle.y}%`}
                    x2={`${targetParticle.x}%`}
                    y2={`${targetParticle.y}%`}
                    stroke="rgba(96, 165, 250, 0.3)"
                    strokeWidth="0.5"
                    opacity={Math.max(0, 0.4 - distance / 15)}
                  />
                );
              }
              return null;
            })}
          </g>
        ))}
      </svg>

      {/* Enhanced grid pattern with parallax */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          transform: `translate(${parallaxSlow * 0.5}px, ${parallaxY * 0.1}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      >
        <div className="grid-pattern" />
      </div>

      {/* Code-like background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          transform: `translate(${parallaxSlow * 0.3}px, ${parallaxY * 0.15}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      >
        <pre className="text-cyan-400 font-mono text-xs leading-relaxed p-8 overflow-hidden">
{`export const competitiveAdvantage = {
  core: 'mathematical precision meets cognitive impact',
  approach: 'intelligent predator methodology',
  commitment: 'engineered dominance'
};

const engineerSolution = async () => {
  const intelligence = await calculatePrecision(workflow);
  return optimizePerformance(intelligence.execute());
};

// Neural workflow optimization
const neuralWorkflow = {
  accuracy: 0.90,
  efficiency: 0.80,
  scalability: Infinity
};`}
        </pre>
      </div>

      {/* Enhanced floating geometric shapes with parallax */}
      <div
        className="absolute top-1/4 left-1/4 w-32 h-32 border border-cyan-400/20 rounded-full float"
        style={{
          animationDelay: "0s",
          transform: `translate(${parallaxY * 0.1}px, ${parallaxSlow}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      />
      <div
        className="absolute top-3/4 right-1/4 w-24 h-24 border border-blue-500/20 rotate-45 float"
        style={{
          animationDelay: "2s",
          transform: `translate(${-parallaxY * 0.15}px, ${-parallaxSlow * 0.8}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      />
      <div
        className="absolute top-1/2 right-1/3 w-16 h-16 bg-linear-to-r from-cyan-400/10 to-blue-500/10 rounded-lg float"
        style={{
          animationDelay: "4s",
          transform: `translate(${parallaxY * 0.08}px, ${parallaxSlow * 1.2}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      />

      {/* Additional floating elements */}
      <div
        className="absolute top-1/3 right-1/6 w-20 h-20 border border-indigo-400/15 rounded-xl rotate-12 float"
        style={{
          animationDelay: "1s",
          transform: `translate(${-parallaxY * 0.12}px, ${parallaxSlow * 0.7}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      />
      <div
        className="absolute bottom-1/4 left-1/6 w-12 h-12 bg-linear-to-r from-blue-400/8 to-cyan-400/8 rounded-full float"
        style={{
          animationDelay: "3s",
          transform: `translate(${parallaxY * 0.2}px, ${-parallaxSlow * 0.9}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      />
    </div>
  );
};

export default AnimatedBackground; 