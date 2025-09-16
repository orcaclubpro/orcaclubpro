import { KaijuHuntingPlanner } from './components/KaijuHuntingPlanner'

export default function KaijuHuntingPage() {
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 -z-10">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,0,0,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,1)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        {/* Animated scanning lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400/20 to-transparent animate-pulse" />
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-400/20 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400/20 to-transparent animate-pulse" style={{ animationDelay: '4s' }} />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-400/20 to-transparent animate-pulse" style={{ animationDelay: '6s' }} />
        </div>
        
        {/* Corner accents - kaiju themed */}
        <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-red-400/20" />
        <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-red-400/20" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-orange-400/20" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-orange-400/20" />
        
        {/* Kaiju silhouettes - subtle background elements */}
        <div className="absolute top-1/4 right-10 w-32 h-32 opacity-[0.01] bg-gradient-to-t from-red-900 to-transparent" style={{
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
        }} />
        <div className="absolute bottom-1/4 left-10 w-24 h-24 opacity-[0.01] bg-gradient-to-t from-orange-900 to-transparent rounded-full" />
      </div>
      
      <KaijuHuntingPlanner />
    </div>
  )
}

export const metadata = {
  title: '懐獣ハンターズ - ORCACLUB Kaiju Hunting Division',
  description: 'Elite Kaiju Hunting Task Management • Monitor, Track, Eliminate • ORCACLUB Defense Division',
}