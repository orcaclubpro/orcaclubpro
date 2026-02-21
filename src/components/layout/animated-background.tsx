"use client";

import React, { useState, useEffect, useMemo } from 'react';

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

  useEffect(() => {
    const initParticles = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.4,
      speedX: (Math.random() - 0.5) * 0.05,
      speedY: (Math.random() - 0.5) * 0.05,
      opacity: Math.random() * 0.35 + 0.08,
    }));
    setParticles(initParticles);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let animationFrameId: number;
    let lastUpdateTime = Date.now();

    const updateParticles = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTime;

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

  const parallaxY   = useMemo(() => scrollPosition * 0.3, [scrollPosition]);
  const parallaxSlow = useMemo(() => scrollPosition * 0.1, [scrollPosition]);

  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`}>

      {/* Base gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-black via-gray-900 to-black" />

      {/* Aurora — soft cyan light from above, like filtered deep water */}
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

      {/* Noise grain — organic texture, prevents sterile digital look */}
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

      {/* Particles — slow-drifting, no connections, bioluminescent */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `translate(${parallaxSlow * 0.6}px, ${parallaxY * 0.15}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
        aria-hidden="true"
      >
        {particles.map((particle) => (
          <circle
            key={particle.id}
            cx={`${particle.x}%`}
            cy={`${particle.y}%`}
            r={particle.size}
            fill="#67e8f9"
            opacity={particle.opacity}
          />
        ))}
      </svg>

      <style>{`
        @keyframes auroraBreathe {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
        .aurora-breathe {
          animation: auroraBreathe 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
