'use client'

import { useEffect, useState } from 'react'
import { Fingerprint, CheckCircle2, Loader2 } from 'lucide-react'
import { startRegistration } from '@simplewebauthn/browser'

type PromptState = 'idle' | 'loading' | 'success' | 'error' | 'cancelled'

export function PasskeySetupPrompt() {
  const [visible, setVisible] = useState(false)
  const [state, setState] = useState<PromptState>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    if (localStorage.getItem('passkey-prompt-dismissed') === 'true') return
    setVisible(true)
  }, [])

  if (!visible) return null

  const handleSetup = async () => {
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/passkey/register-options', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to get registration options')
      const { options } = await res.json()

      const credential = await startRegistration({ optionsJSON: options })

      const verifyRes = await fetch('/api/auth/passkey/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, deviceName: 'My Passkey' }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Verification failed')
      }

      setState('success')
      setTimeout(() => setVisible(false), 2000)
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
        setState('cancelled')
        setErrorMsg('Registration cancelled.')
      } else {
        setState('error')
        setErrorMsg(err?.message || 'Something went wrong. Please try again.')
        console.error('[PasskeySetupPrompt]', err)
      }
    }
  }

  const handleNotNow = () => {
    setVisible(false)
  }

  const handleNeverShow = () => {
    localStorage.setItem('passkey-prompt-dismissed', 'true')
    setVisible(false)
  }

  const isLoading = state === 'loading'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      aria-modal="true"
      role="dialog"
      aria-labelledby="passkey-prompt-title"
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl border p-6 shadow-2xl"
        style={{
          background: 'var(--space-bg-secondary, #0d0d0d)',
          borderColor: 'var(--space-border, #1f2937)',
        }}
      >
        {state === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2
              className="size-10"
              style={{ color: 'var(--space-accent, #67e8f9)' }}
            />
            <p className="text-base font-semibold text-white">Passkey saved!</p>
            <p className="text-sm text-gray-400">You&rsquo;re all set.</p>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <Fingerprint
                className="size-10"
                style={{ color: 'var(--space-accent, #67e8f9)' }}
              />
            </div>

            {/* Title */}
            <h2
              id="passkey-prompt-title"
              className="text-lg font-semibold text-white text-center mb-2"
            >
              Secure your account
            </h2>

            {/* Body */}
            <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
              Add a passkey to sign in faster and more securely — no password required.
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-black transition-opacity disabled:opacity-60"
                style={{ background: 'var(--space-accent, #67e8f9)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Setting up…
                  </>
                ) : (
                  'Set up passkey'
                )}
              </button>

              <button
                onClick={handleNotNow}
                disabled={isLoading}
                className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:text-white disabled:opacity-60"
                style={{ borderColor: 'var(--space-border, #1f2937)' }}
              >
                Not now
              </button>
            </div>

            {/* Error / cancelled message */}
            {(state === 'error' || state === 'cancelled') && errorMsg && (
              <p
                className={`text-xs text-center mt-3 ${
                  state === 'error' ? 'text-red-400' : 'text-gray-500'
                }`}
              >
                {errorMsg}
              </p>
            )}

            {/* Never show again */}
            <div className="mt-4 text-center">
              <button
                onClick={handleNeverShow}
                className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-400 transition-colors"
              >
                Never show again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
