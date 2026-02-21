'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

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
    <div className="flex h-screen overflow-hidden bg-black">

      {/* ── LEFT PANEL ── atmospheric, structural */}
      <div className="relative hidden lg:flex flex-col w-[60%] overflow-hidden bg-black">

        {/* Orbital geometry */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <svg
            width="600"
            height="600"
            viewBox="0 0 600 600"
            fill="none"
            aria-hidden="true"
            className="opacity-[0.032]"
          >
            <circle cx="300" cy="300" r="299" stroke="white" strokeWidth="1" />
            <circle cx="300" cy="300" r="226" stroke="white" strokeWidth="0.5" />
            <line x1="300" y1="0" x2="300" y2="600" stroke="white" strokeWidth="0.5" />
            <line x1="0" y1="300" x2="600" y2="300" stroke="white" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="3" stroke="white" strokeWidth="0.5" fill="none" />
            <line x1="300" y1="1" x2="300" y2="20" stroke="white" strokeWidth="1" />
            <line x1="300" y1="580" x2="300" y2="599" stroke="white" strokeWidth="1" />
            <line x1="1" y1="300" x2="20" y2="300" stroke="white" strokeWidth="1" />
            <line x1="580" y1="300" x2="599" y2="300" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        {/* Top-left wordmark */}
        <div className="relative z-10 px-12 pt-10">
          <Link href="/">
            <span className="text-[11px] font-light tracking-[0.4em] uppercase text-white/20">
              ORCA<span className="text-cyan-400/30">CLUB</span>
            </span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center px-12">
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/15 font-light mb-6">
              Account Recovery
            </p>
            <h2 className="text-2xl font-extralight text-white/75 tracking-wide mb-8">
              We'll get you back in.
            </h2>
            <div className="w-6 h-px bg-cyan-400/30 mx-auto mb-10" />
            <p className="text-[11px] tracking-[0.15em] text-white/20 font-light leading-relaxed max-w-[240px] mx-auto">
              A reset link will be sent to your registered email address.
            </p>
          </div>
        </div>

        {/* Bottom label */}
        <div className="relative z-10 px-12 pb-10 flex items-center gap-4">
          <div className="h-px w-8 bg-white/10" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-light">
            Forgot Password
          </span>
        </div>
      </div>

      {/* Panel separator */}
      <div className="hidden lg:block w-px bg-white/[0.05] flex-shrink-0" />

      {/* ── RIGHT PANEL ── clean, functional */}
      <div className="flex-1 bg-[#080808] flex flex-col items-center justify-center px-10 py-12 relative overflow-hidden">

        {/* Mobile-only logo */}
        <div className="lg:hidden mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-white">ORCA</span>
            <span className="gradient-text">CLUB</span>
          </h1>
          <p className="text-[11px] text-white/25 tracking-[0.3em] uppercase mt-2 font-light">
            Account Recovery
          </p>
        </div>

        <div className="w-full max-w-[320px]">

          {/* Heading block */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-light mb-4">
              Password Reset
            </p>
            <h2 className="text-xl font-extralight text-white tracking-wide">
              Forgot your password?
            </h2>
            <div className="mt-5 w-6 h-px bg-cyan-400/40" />
          </div>

          {/* Success state */}
          {success ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400/70 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-light text-white/80 mb-1">Check your email</p>
                  <p className="text-[11px] font-light text-white/35 leading-relaxed">
                    If an account exists with that address, you'll receive reset instructions within a few minutes.
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-white/[0.06]">
                <p className="text-[11px] text-white/20 font-light">
                  <Link
                    href="/login"
                    className="text-cyan-400/50 hover:text-cyan-400/80 transition-colors duration-300 hover:underline underline-offset-2"
                  >
                    Back to sign in
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-3 text-red-400/80">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-light leading-relaxed">{error}</p>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 transition-all duration-200 outline-none focus:bg-gray-800 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold bg-cyan-400 hover:bg-cyan-400/90 text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : 'Send Reset Link'}
              </button>

              {/* Security note */}
              <p className="text-[10px] tracking-[0.1em] text-white/15 font-light text-center leading-relaxed">
                Reset links expire after 1 hour.
              </p>

              {/* Footer */}
              <div className="pt-6 border-t border-white/[0.06]">
                <p className="text-[11px] text-white/20 font-light">
                  Remember your password?{' '}
                  <Link
                    href="/login"
                    className="text-cyan-400/50 hover:text-cyan-400/80 transition-colors duration-300 hover:underline underline-offset-2"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Corner geometry */}
        <div className="absolute bottom-0 right-0 pointer-events-none select-none" aria-hidden="true">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" className="opacity-[0.05]">
            <path d="M96 0 L96 96 L0 96" stroke="white" strokeWidth="1" />
            <path d="M96 28 L96 96 L28 96" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
      </div>
    </div>
  )
}
