'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Fingerprint, Loader2, CheckCircle2 } from 'lucide-react'
import { startAuthentication } from '@simplewebauthn/browser'

type Phase = 'idle' | 'prompting' | 'success' | 'error'

/**
 * Press "K" anywhere on the marketing site to sign in with a passkey.
 *
 * Mounted from the (frontend) layout only — the dashboard has its own console
 * bound to K (see CommandConsole), so this must never render inside (spaces).
 */
export function PasskeyHotkey() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  // Guards against a second ceremony being started while one is in flight —
  // `phase` is stale inside the keydown listener, which only binds once.
  const busyRef = useRef(false)

  const run = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    setError(null)
    setPhase('prompting')

    try {
      const optRes = await fetch('/api/auth/passkey/authenticate-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      if (!optRes.ok) throw new Error('Could not start passkey sign-in.')
      const { options } = await optRes.json()

      const credential = await startAuthentication({ optionsJSON: options })

      const verifyRes = await fetch('/api/auth/passkey/verify-authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      const data = await verifyRes.json()

      if (!data.success) throw new Error(data.error || 'Passkey sign-in failed.')

      setPhase('success')
      const dest = data.user?.username ? `/u/${data.user.username}` : '/login'
      setTimeout(() => {
        router.push(dest)
        router.refresh()
      }, 600)
    } catch (err: any) {
      // The user dismissing the OS sheet isn't an error worth shouting about.
      if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
        setPhase('idle')
      } else {
        setError(err?.message || 'Passkey sign-in failed.')
        setPhase('error')
      }
    } finally {
      busyRef.current = false
    }
  }, [router])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!busyRef.current) setPhase('idle')
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      if (e.key !== 'k' && e.key !== 'K') return
      e.preventDefault()
      void run()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [run])

  if (phase === 'idle') return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="passkey-hotkey-title"
    >
      <div className="mx-4 w-full max-w-xs rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 text-center shadow-2xl">
        {phase === 'success' ? (
          <>
            <CheckCircle2 className="mx-auto mb-3 size-7 text-cyan-300" />
            <p id="passkey-hotkey-title" className="text-sm font-medium text-white">
              Signed in
            </p>
            <p className="mt-1 text-xs text-gray-400">Taking you to your dashboard…</p>
          </>
        ) : (
          <>
            {phase === 'prompting' ? (
              <Loader2 className="mx-auto mb-3 size-7 animate-spin text-cyan-300" />
            ) : (
              <Fingerprint className="mx-auto mb-3 size-7 text-cyan-300" />
            )}
            <p id="passkey-hotkey-title" className="text-sm font-medium text-white">
              Sign in with a passkey
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {phase === 'prompting'
                ? 'Confirm with your fingerprint or device unlock.'
                : error}
            </p>
            {phase === 'error' && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => void run()}
                  className="flex-1 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-cyan-300"
                >
                  Try again
                </button>
                <button
                  onClick={() => setPhase('idle')}
                  className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            )}
            {phase === 'prompting' && (
              <p className="mt-4 text-[10px] uppercase tracking-widest text-gray-600">
                Esc to cancel
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
