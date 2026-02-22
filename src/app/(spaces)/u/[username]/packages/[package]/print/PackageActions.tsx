'use client'

import { Printer } from 'lucide-react'

export function PackageActions() {
  return (
    <div className="print:hidden fixed bottom-6 left-6 z-50">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111] text-white text-sm font-medium hover:bg-[#1a1a1a] transition-colors shadow-xl border border-white/10"
      >
        <Printer className="size-4" />
        Save as PDF
      </button>
    </div>
  )
}
