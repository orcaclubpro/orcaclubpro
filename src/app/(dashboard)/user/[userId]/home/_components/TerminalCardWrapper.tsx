'use client';

import dynamic from 'next/dynamic';

const TerminalCard = dynamic(() => import('./TerminalCard').then(mod => ({ default: mod.TerminalCard })), {
  ssr: false, // Disable SSR for terminal animations
  loading: () => (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Live Terminal</h3>
        <div className="h-4 w-16 bg-gray-700 rounded" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-800 rounded" style={{ width: `${Math.random() * 40 + 60}%` }} />
        ))}
      </div>
    </div>
  )
});

export default function TerminalCardWrapper() {
  return <TerminalCard />;
} 