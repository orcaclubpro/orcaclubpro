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
    const initParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.08,
      speedY: (Math.random() - 0.5) * 0.08,
      opacity: Math.random() * 0.25 + 0.05,
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

  const parallaxY = useMemo(() => scrollPosition * 0.3, [scrollPosition]);
  const parallaxSlow = useMemo(() => scrollPosition * 0.1, [scrollPosition]);

  return (
    <div className={`fixed inset-0 overflow-hidden ${className}`}>
      {/* Base: dark charcoal — matches reference image */}
      <div className="absolute inset-0" style={{ backgroundColor: '#1a1a1a' }} />

      {/* Atmospheric vignette — darker edges, slightly lighter center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.015) 0%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          transform: `translate(${parallaxSlow * 0.5}px, ${parallaxY * 0.1}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      >
        <div className="grid-pattern" />
      </div>

      {/* Orbital geometry — architectural precision, echoes the login page */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          transform: `translateY(${parallaxY * 0.04}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      >
        <svg
          width="760"
          height="760"
          viewBox="0 0 760 760"
          fill="none"
          aria-hidden="true"
          className="opacity-[0.055]"
        >
          {/* Concentric circles */}
          <circle cx="380" cy="380" r="370" stroke="white" strokeWidth="0.75" />
          <circle cx="380" cy="380" r="285" stroke="white" strokeWidth="0.5" />
          <circle cx="380" cy="380" r="190" stroke="white" strokeWidth="0.5" />
          <circle cx="380" cy="380" r="95" stroke="white" strokeWidth="0.5" />

          {/* Crosshairs */}
          <line x1="380" y1="0" x2="380" y2="760" stroke="white" strokeWidth="0.5" />
          <line x1="0" y1="380" x2="760" y2="380" stroke="white" strokeWidth="0.5" />

          {/* Diagonal dashes */}
          <line x1="110" y1="110" x2="650" y2="650" stroke="white" strokeWidth="0.3" strokeDasharray="3 10" />
          <line x1="650" y1="110" x2="110" y2="650" stroke="white" strokeWidth="0.3" strokeDasharray="3 10" />

          {/* Cardinal tick marks */}
          <line x1="380" y1="10" x2="380" y2="28" stroke="white" strokeWidth="1.5" />
          <line x1="380" y1="732" x2="380" y2="750" stroke="white" strokeWidth="1.5" />
          <line x1="10" y1="380" x2="28" y2="380" stroke="white" strokeWidth="1.5" />
          <line x1="732" y1="380" x2="750" y2="380" stroke="white" strokeWidth="1.5" />

          {/* Intercardinal ticks */}
          <line x1="645" y1="135" x2="631" y2="149" stroke="white" strokeWidth="0.75" />
          <line x1="115" y1="135" x2="129" y2="149" stroke="white" strokeWidth="0.75" />
          <line x1="645" y1="625" x2="631" y2="611" stroke="white" strokeWidth="0.75" />
          <line x1="115" y1="625" x2="129" y2="611" stroke="white" strokeWidth="0.75" />

          {/* Center dot */}
          <circle cx="380" cy="380" r="4" stroke="white" strokeWidth="0.75" fill="none" />
          <circle cx="380" cy="380" r="1.5" fill="white" opacity="0.5" />
        </svg>
      </div>

      {/* Particles — neutral gray, matching reference image */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `translate(${parallaxSlow}px, ${parallaxY * 0.2}px)`,
          willChange: 'transform',
          opacity: 0.55,
        } as React.CSSProperties}
      >
        {particles.map((particle, idx) => (
          <g key={particle.id}>
            <circle
              cx={`${particle.x}%`}
              cy={`${particle.y}%`}
              r={particle.size}
              fill="rgba(180, 180, 180, 1)"
              opacity={particle.opacity}
            />
            {particles.slice(idx + 1, idx + 5).map(targetParticle => {
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
                    stroke="rgba(180, 180, 180, 0.2)"
                    strokeWidth="0.5"
                    opacity={Math.max(0, 0.25 - distance / 15)}
                  />
                );
              }
              return null;
            })}
          </g>
        ))}
      </svg>

      {/* Floating geometric shapes — cyan-only palette */}
      <div
        className="absolute top-1/4 left-1/4 w-36 h-36 border border-white/[0.07] rounded-full float"
        style={{
          animationDelay: "0s",
          transform: `translate(${parallaxY * 0.1}px, ${parallaxSlow}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      />
      <div
        className="absolute top-3/4 right-1/4 w-24 h-24 border border-white/[0.06] rotate-45 float"
        style={{
          animationDelay: "2s",
          transform: `translate(${-parallaxY * 0.15}px, ${-parallaxSlow * 0.8}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      />
      <div
        className="absolute top-1/2 right-1/3 w-16 h-16 border border-white/[0.05] rounded-lg float"
        style={{
          animationDelay: "4s",
          transform: `translate(${parallaxY * 0.08}px, ${parallaxSlow * 1.2}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      />
      <div
        className="absolute top-1/3 right-1/6 w-20 h-20 border border-white/[0.05] rounded-xl rotate-12 float"
        style={{
          animationDelay: "1s",
          transform: `translate(${-parallaxY * 0.12}px, ${parallaxSlow * 0.7}px)`,
          willChange: 'transform',
        } as React.CSSProperties}
      />
      <div
        className="absolute bottom-1/4 left-1/6 w-12 h-12 border border-white/[0.04] rounded-full float"
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
