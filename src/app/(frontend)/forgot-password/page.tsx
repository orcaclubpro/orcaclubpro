'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import AnimatedBackground from '@/components/layout/animated-background'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setEmail('')
      } else {
        setError(data.message || 'An error occurred. Please try again.')
      }
    } catch {
      setError('Unable to connect to the server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex min-h-screen">

        {/* ── LEFT PANEL ── transparent over animated background */}
        <div className="hidden lg:flex flex-col w-[55%] px-16 py-16">
          {/* Brand wordmark */}
          <div>
            <Link href="/">
              <span className="text-sm font-light tracking-[0.35em] uppercase text-white/50">
                ORCA<span className="text-[#67e8f9]/60">CLUB</span>
              </span>
            </Link>
          </div>

          {/* Center copy */}
          <div className="flex-1 flex items-center">
            <div>
              <p className="text-xs tracking-[0.45em] uppercase text-white/30 font-light mb-5">
                Account Recovery
              </p>
              <h2 className="text-[4.5rem] font-extralight text-white leading-[1.1]">
                We&apos;ll get<br />you back in.
              </h2>
              <div className="mt-6 w-8 h-px bg-[#67e8f9]/30" />
              <p className="mt-6 text-lg text-white/50 leading-relaxed font-light max-w-[300px]">
                A reset link will be sent to your registered email address.
              </p>
            </div>
          </div>

          {/* Bottom label */}
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-white/15" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-light">
              Forgot Password
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── frosted glass card */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div
            className="w-full max-w-[400px] rounded-2xl p-8 lg:p-10"
            style={{
              background: 'rgba(8, 8, 12, 0.75)',
              backdropFilter: 'blur(24px) saturate(1.2)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            {/* Mobile brand */}
            <div className="lg:hidden mb-8">
              <Link href="/">
                <span className="text-sm font-light tracking-[0.35em] uppercase text-white/50">
                  ORCA<span className="text-[#67e8f9]/60">CLUB</span>
                </span>
              </Link>
              <p className="text-xs text-white/30 tracking-[0.3em] uppercase mt-2 font-light">
                Account Recovery
              </p>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p className="text-xs tracking-[0.4em] uppercase text-white/30 font-light mb-3">
                Password Reset
              </p>
              <h2 className="text-4xl font-extralight text-white leading-tight">
                Forgot your password?
              </h2>
              <div className="mt-4 w-8 h-px bg-[#67e8f9]/40" />
            </div>

            {/* Success state */}
            {success ? (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#67e8f9]/70 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/80">Check your email</p>
                    <p className="text-xs text-white/35 font-light leading-relaxed mt-1">
                      If an account exists with that address, you&apos;ll receive reset instructions within a few minutes.
                    </p>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/[0.07]">
                  <Link
                    href="/login"
                    className="text-xs text-[#67e8f9]/60 hover:text-[#67e8f9] transition-colors duration-200"
                  >
                    Back to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error message */}
                {error && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-red-500/15 border border-red-400/30 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-white/70">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-white/25 group-focus-within:text-[#67e8f9]/60 transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 rounded-xl bg-white/[0.06] border border-white/[0.10] hover:border-white/[0.18] transition-all duration-200 outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black transition-all duration-200 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#67e8f9]/20 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                    ) : 'Send Reset Link'}
                  </span>
                </button>

                {/* Security note */}
                <p className="text-[11px] text-white/20 font-light text-center tracking-[0.1em]">
                  Reset links expire after 1 hour.
                </p>

                {/* Footer */}
                <div className="pt-5 border-t border-white/[0.07]">
                  <p className="text-xs text-white/25 font-light">
                    Remember your password?{' '}
                    <Link
                      href="/login"
                      className="text-[#67e8f9]/60 hover:text-[#67e8f9] transition-colors duration-200"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
