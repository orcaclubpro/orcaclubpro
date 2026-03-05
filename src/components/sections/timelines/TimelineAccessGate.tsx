'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Cinzel_Decorative } from 'next/font/google'
import { Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { verifyTimelineAccess } from '@/actions/timelines'
import { cn } from '@/lib/utils'

const gothic = Cinzel_Decorative({ weight: '700', subsets: ['latin'] })

interface Props {
  slug: string
  eyebrow?: string | null
  title?: string | null
}

export default function TimelineAccessGate({ slug, eyebrow, title }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!code.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await verifyTimelineAccess(slug, code)
      if (result.ok) {
        router.refresh()
      } else {
        setError(result.error ?? 'Incorrect access code.')
      }
    })
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #080808 0%, #0c0c0c 60%, #080808 100%)' }}
    >
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #67e8f9 1px, transparent 1px),
            linear-gradient(to bottom, #67e8f9 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Wordmark */}
        <div className="flex flex-col items-center mb-10">
          <span className={`${gothic.className} text-white text-xl tracking-widest`}>
            ORCACLUB
          </span>
          <div className="mt-2 h-px w-16 bg-gradient-to-r from-transparent via-[#67e8f9]/40 to-transparent" />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/[0.09] overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #141414 0%, #0f0f0f 100%)' }}
        >
          {/* Top accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#67e8f9]/35 to-transparent" />

          <div className="px-7 pt-7 pb-7">
            {/* Lock icon */}
            <div className="flex justify-center mb-5">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                <Lock className="size-5 text-[#67e8f9]/60" />
              </div>
            </div>

            {/* Project info */}
            {eyebrow && (
              <p className="text-center text-[9px] font-bold tracking-[0.28em] uppercase text-[#67e8f9]/60 mb-2">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="text-center text-lg font-bold text-white mb-1 leading-snug">
                {title}
              </h1>
            )}

            <p className="text-center text-xs text-white/30 mb-7 leading-relaxed">
              This timeline is private. Enter your access code to continue.
            </p>

            {/* Input */}
            <div className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value); setError(null) }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Access code"
                autoFocus
                className={cn(
                  'w-full px-4 py-3 text-sm font-mono text-center tracking-widest',
                  'bg-white/[0.04] border rounded-xl text-white placeholder:text-white/20',
                  'focus:outline-none focus:bg-white/[0.06] transition-all',
                  error
                    ? 'border-red-500/40 focus:border-red-500/60'
                    : 'border-white/[0.08] focus:border-[#67e8f9]/30',
                )}
              />

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/[0.07] border border-red-500/20">
                  <AlertCircle className="size-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isPending || !code.trim()}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
                  'text-sm font-semibold tracking-wide',
                  'bg-[#67e8f9]/[0.10] border border-[#67e8f9]/25 text-[#67e8f9]',
                  'hover:bg-[#67e8f9]/[0.18] hover:border-[#67e8f9]/40',
                  'disabled:opacity-30 disabled:pointer-events-none',
                  'transition-all duration-150',
                )}
              >
                {isPending ? (
                  <>
                    <span className="size-3.5 rounded-full border-2 border-[#67e8f9]/30 border-t-[#67e8f9] animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    Access Timeline
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-white/15 tracking-wide">
          Contact your ORCACLUB account manager for access.
        </p>
      </div>
    </div>
  )
}
