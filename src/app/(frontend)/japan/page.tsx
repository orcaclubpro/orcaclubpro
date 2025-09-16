import { JapanTripPlanner } from './components/JapanTripPlanner'

export default function JapanPage() {
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 -z-10">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(0,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,1)_1px,transparent_1px)] bg-[size:100px_100px]" />
        
        {/* Animated scanning lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse" />
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400/20 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse" style={{ animationDelay: '4s' }} />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400/20 to-transparent animate-pulse" style={{ animationDelay: '6s' }} />
        </div>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-cyan-400/20" />
        <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-cyan-400/20" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-pink-400/20" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-pink-400/20" />
      </div>
      
      <JapanTripPlanner />
    </div>
  )
}

export const metadata = {
  title: '懐郷ハンターズ - Orcaclub Kaiju Hunting Adventure',
  description: 'Epic 14-Day Japan Journey • November 4-17, 2024 • Cyberpunk Japan Adventure',
}