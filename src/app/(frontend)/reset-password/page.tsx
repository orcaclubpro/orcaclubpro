'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Check, X, Loader2 } from 'lucide-react'
import AnimatedBackground from '@/components/layout/animated-background'

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-3 h-3 text-[#67e8f9]/70 flex-shrink-0" />
      ) : (
        <X className="w-3 h-3 text-white/20 flex-shrink-0" />
      )}
      <span className={`text-xs font-light ${met ? 'text-[#67e8f9]/70' : 'text-white/30'}`}>
        {text}
      </span>
    </div>
  )
}

function ResetPasswordForm() {
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
      setError('Invalid or missing reset token. Please request a new password reset.')
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
      setError('Invalid or missing reset token.')
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
        setTimeout(() => { router.push(redirectTo) }, 2000)
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
                Secure Access
              </p>
              <h2 className="text-[4.5rem] font-extralight text-white leading-[1.1]">
                Choose a<br />new password.
              </h2>
              <div className="mt-6 w-8 h-px bg-[#67e8f9]/30" />
              <p className="mt-6 text-lg text-white/50 leading-relaxed font-light max-w-[300px]">
                Use a strong, unique password you haven&apos;t used elsewhere.
              </p>
            </div>
          </div>

          {/* Bottom label */}
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-white/15" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-light">
              Password Reset
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
                Password Reset
              </p>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p className="text-xs tracking-[0.4em] uppercase text-white/30 font-light mb-3">
                New Password
              </p>
              <h2 className="text-4xl font-extralight text-white leading-tight">
                Reset your password.
              </h2>
              <div className="mt-4 w-8 h-px bg-[#67e8f9]/40" />
            </div>

            {/* Success state */}
            {success ? (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#67e8f9]/70 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/80">Password updated.</p>
                    <p className="text-xs text-white/35 font-light leading-relaxed mt-1">
                      Redirecting you to your dashboard...
                    </p>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/[0.07]">
                  <Link
                    href="/login"
                    className="text-xs text-[#67e8f9]/60 hover:text-[#67e8f9] transition-colors duration-200"
                  >
                    Go to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error message */}
                {error && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-red-500/15 border border-red-400/30 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-300">{error}</p>
                      {error.includes('expired') && (
                        <Link
                          href="/forgot-password"
                          className="text-xs text-[#67e8f9]/60 hover:text-[#67e8f9] transition-colors mt-1.5 inline-block"
                        >
                          Request a new link
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* New password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-white/70">
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-white/25 group-focus-within:text-[#67e8f9]/60 transition-colors" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 text-sm text-white placeholder-white/25 rounded-xl bg-white/[0.06] border border-white/[0.10] hover:border-white/[0.18] transition-all duration-200 outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/25 hover:text-white/50 transition-colors disabled:opacity-40"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-white/25 group-focus-within:text-[#67e8f9]/60 transition-colors" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 text-sm text-white placeholder-white/25 rounded-xl bg-white/[0.06] border border-white/[0.10] hover:border-white/[0.18] transition-all duration-200 outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/25 hover:text-white/50 transition-colors disabled:opacity-40"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password requirements */}
                {password && (
                  <div className="space-y-1.5 pt-3 border-t border-white/[0.07]">
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
                  className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black transition-all duration-200 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#67e8f9]/20 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
                    ) : 'Reset Password'}
                  </span>
                </button>

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 h-screen flex items-center justify-center">
          <div className="w-px h-8 bg-[#67e8f9]/40 animate-pulse" />
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
