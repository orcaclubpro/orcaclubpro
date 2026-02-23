'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Check, X, Loader2 } from 'lucide-react'

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-3 h-3 text-cyan-400/70 flex-shrink-0" />
      ) : (
        <X className="w-3 h-3 text-white/20 flex-shrink-0" />
      )}
      <span className={`text-[10px] tracking-[0.1em] font-light ${met ? 'text-cyan-400/70' : 'text-white/25'}`}>
        {text}
      </span>
    </div>
  )
}

function SetupAccountForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    passwordsMatch: false,
  })

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing setup link. Please contact support to resend your invitation.')
    }
  }, [token])

  useEffect(() => {
    setPasswordChecks({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      passwordsMatch: password !== '' && password === confirmPassword,
    })
  }, [password, confirmPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError('Invalid or missing setup link.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!Object.values(passwordChecks).every(check => check)) {
      setError('Please meet all password requirements.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setPassword('')
        setConfirmPassword('')
        const redirectTo = data.username ? `/u/${data.username}` : '/login'
        // Brief pause so the success state is visible, then navigate — the
        // payload-token cookie was set in the response so the user is already
        // authenticated when they land on the dashboard.
        setTimeout(() => { router.push(redirectTo) }, 800)
      } else {
        setError(data.message || 'An error occurred. Please try again.')
      }
    } catch {
      setError('Unable to connect to the server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const allChecksMet = Object.values(passwordChecks).every(Boolean)

  return (
    <div className="flex h-screen overflow-hidden bg-black">

      {/* ── LEFT PANEL ── */}
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
              Account Setup
            </p>
            <h2 className="text-2xl font-extralight text-white/75 tracking-wide mb-8">
              Welcome to ORCACLUB.
            </h2>
            <div className="w-6 h-px bg-cyan-400/30 mx-auto mb-10" />
            <p className="text-[11px] tracking-[0.15em] text-white/20 font-light leading-relaxed max-w-[240px] mx-auto">
              Create a strong, unique password to secure your workspace.
            </p>
          </div>
        </div>

        {/* Bottom label */}
        <div className="relative z-10 px-12 pb-10 flex items-center gap-4">
          <div className="h-px w-8 bg-white/10" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-light">
            First Time Setup
          </span>
        </div>
      </div>

      {/* Panel separator */}
      <div className="hidden lg:block w-px bg-white/[0.05] flex-shrink-0" />

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 bg-[#080808] flex flex-col items-center justify-center px-10 py-12 relative overflow-hidden">

        {/* Mobile-only logo */}
        <div className="lg:hidden mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-white">ORCA</span>
            <span className="gradient-text">CLUB</span>
          </h1>
          <p className="text-[11px] text-white/25 tracking-[0.3em] uppercase mt-2 font-light">
            Account Setup
          </p>
        </div>

        <div className="w-full max-w-[320px]">

          {/* Heading block */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-light mb-4">
              Set Your Password
            </p>
            <h2 className="text-xl font-extralight text-white tracking-wide">
              Set up your account.
            </h2>
            <div className="mt-5 w-6 h-px bg-cyan-400/40" />
          </div>

          {/* Success state */}
          {success ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400/70 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-light text-white/80 mb-1">Account created.</p>
                  <p className="text-[11px] font-light text-white/35 leading-relaxed">
                    Redirecting you to your dashboard...
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-white/[0.06]">
                <Link
                  href="/login"
                  className="text-[11px] text-cyan-400/50 hover:text-cyan-400/80 transition-colors duration-300 hover:underline underline-offset-2"
                >
                  Go to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400/90">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-light leading-relaxed">{error}</p>
                    {error.includes('expired') && (
                      <Link
                        href="/contact"
                        className="text-[11px] text-cyan-400/50 hover:text-cyan-400/80 transition-colors mt-2 inline-block"
                      >
                        Contact support
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* New password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 transition-all duration-200 outline-none focus:bg-gray-800 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-lg text-white placeholder-gray-500 transition-all duration-200 outline-none focus:bg-gray-800 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password requirements */}
              {password && (
                <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                  <RequirementItem met={passwordChecks.minLength} text="At least 8 characters" />
                  <RequirementItem met={passwordChecks.hasUppercase} text="One uppercase letter" />
                  <RequirementItem met={passwordChecks.hasLowercase} text="One lowercase letter" />
                  <RequirementItem met={passwordChecks.hasNumber} text="One number" />
                  {confirmPassword && (
                    <RequirementItem met={passwordChecks.passwordsMatch} text="Passwords match" />
                  )}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !allChecksMet}
                className="w-full py-3 rounded-lg font-semibold bg-cyan-400 hover:bg-cyan-400/90 hover:shadow-lg hover:shadow-cyan-400/20 text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>
                  ) : 'Create Password'}
                </span>
              </button>

              {/* Footer */}
              <div className="pt-6 border-t border-white/[0.06]">
                <p className="text-[11px] text-white/20 font-light">
                  Need help?{' '}
                  <Link
                    href="/contact"
                    className="text-cyan-400/50 hover:text-cyan-400/80 transition-colors duration-300 hover:underline underline-offset-2"
                  >
                    Contact support
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

export default function SetupAccountPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-px h-8 bg-cyan-400/40 animate-pulse" />
      </div>
    }>
      <SetupAccountForm />
    </Suspense>
  )
}
