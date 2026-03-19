"use client";

import React, { useState, useEffect, useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

interface AnimatedBackgroundProps {
  className?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ className = "" }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate particles once — no per-frame JS updates
  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.35 + 0.08,
        duration: Math.random() * 20 + 15,   // 15–35s drift cycle
        delay: Math.random() * -30,           // stagger start times
        driftX: (Math.random() - 0.5) * 12,  // ±6% drift
        driftY: (Math.random() - 0.5) * 12,
      }))
    );
  }, []);

  // Scroll parallax — passive listener, throttled via rAF
  useEffect(() => {
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

  const parallaxY    = useMemo(() => scrollPosition * 0.3, [scrollPosition]);
  const parallaxSlow = useMemo(() => scrollPosition * 0.1, [scrollPosition]);

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>

      {/* Base gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-black via-gray-900 to-black" />

      {/* Aurora — soft cyan light from above */}
      <div
        className="absolute inset-0 pointer-events-none aurora-breathe"
        style={{
          background: 'radial-gradient(ellipse 90% 45% at 50% -5%, rgba(103, 232, 249, 0.07) 0%, rgba(59, 130, 246, 0.03) 45%, transparent 70%)',
          transform: `translateY(${parallaxY * 0.06}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      />

      {/* Depth glow — blue-indigo from bottom-right corner */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 55% 50% at 90% 100%, rgba(59, 130, 246, 0.055) 0%, transparent 65%)',
        }}
      />

      {/* Noise grain */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.025 }}
        aria-hidden="true"
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Particles — pure CSS animation, zero JS per-frame */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${parallaxSlow * 0.6}px, ${parallaxY * 0.15}px)`,
          willChange: 'transform',
        }}
        aria-hidden="true"
      >
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size * 2}px`,
              height: `${particle.size * 2}px`,
              borderRadius: '50%',
              backgroundColor: '#67e8f9',
              opacity: particle.opacity,
              animation: `particleDrift ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
              '--drift-x': `${particle.driftX}%`,
              '--drift-y': `${particle.driftY}%`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <style>{`
        @keyframes auroraBreathe {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
        .aurora-breathe {
          animation: auroraBreathe 8s ease-in-out infinite;
        }
        @keyframes particleDrift {
          0%, 100% { transform: translate(0, 0); }
          25%       { transform: translate(var(--drift-x), calc(var(--drift-y) * 0.5)); }
          50%       { transform: translate(calc(var(--drift-x) * 0.7), var(--drift-y)); }
          75%       { transform: translate(calc(var(--drift-x) * -0.3), calc(var(--drift-y) * 0.8)); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
