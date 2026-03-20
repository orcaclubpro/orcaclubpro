'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/actions/auth'
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError(null)
    return true
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required')
      return false
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return false
    }
    setPasswordError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)

    if (!isEmailValid || !isPasswordValid) {
      return
    }

    setLoading(true)

    try {
      const result = await loginAction({ email, password })

      if (result.success) {
        // Trigger browser save-password prompt
        if (typeof window !== 'undefined' && 'PasswordCredential' in window) {
          try {
            // @ts-ignore — PasswordCredential not in all TS DOM libs
            const cred = new window.PasswordCredential({ id: email, password })
            await navigator.credentials.store(cred)
          } catch {
            // Non-blocking
          }
        }

        if (!result.username) {
          if (result.role === 'admin' || result.role === 'user') {
            setSuccess(true)
            setTimeout(() => {
              router.push('/admin')
              router.refresh()
            }, 500)
            return
          }

          setError('Your account does not have a username set. Please contact support.')
          setLoading(false)
          return
        }

        setSuccess(true)

        const safeFallback = `/u/${result.username}`
        const redirectPath = callbackUrl && callbackUrl.startsWith('/')
          ? callbackUrl
          : safeFallback

        setTimeout(() => {
          router.push(redirectPath)
          router.refresh()
        }, 1000)
      } else {
        setError(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
    } finally {
      if (!success) {
        setLoading(false)
      }
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (emailError && value) {
      validateEmail(value)
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (passwordError && value) {
      validatePassword(value)
    }
  }

  return (
    <form onSubmit={handleSubmit} method="post" className="space-y-5">
      {/* Success message */}
      {success && (
        <div className="flex items-start gap-3 px-4 py-3 bg-[#67e8f9]/10 border border-[#67e8f9]/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-[#67e8f9]/70 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white/80">Login successful!</p>
            <p className="text-xs text-white/40 mt-0.5">Redirecting to your dashboard...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/15 border border-red-400/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300">{error}</p>
            {error.includes('admin panel') ? (
              <p className="text-xs text-red-300/60 mt-1">
                Admin users should{' '}
                <a href="/admin" className="underline hover:text-red-200 transition-colors font-medium">
                  login via the admin panel
                </a>
              </p>
            ) : (
              <p className="text-xs text-red-300/60 mt-1">
                Need help?{' '}
                <a href="/contact" className="underline hover:text-red-200 transition-colors">
                  Contact support
                </a>
              </p>
            )}
          </div>
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
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={(e) => validateEmail(e.target.value)}
            disabled={loading || success}
            className={`w-full pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 rounded-xl bg-white/[0.06] border transition-all duration-200 outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/50 disabled:opacity-40 disabled:cursor-not-allowed ${
              emailError
                ? 'border-red-400/40 focus:ring-red-400/30 focus:border-red-400/50'
                : 'border-white/[0.10] hover:border-white/[0.18]'
            }`}
            placeholder="you@example.com"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
        </div>
        {emailError && (
          <p id="email-error" className="text-xs text-red-300/80 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3" />
            {emailError}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-white/70">
          Password
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Lock className="w-4 h-4 text-white/25 group-focus-within:text-[#67e8f9]/60 transition-colors" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={(e) => validatePassword(e.target.value)}
            disabled={loading || success}
            className={`w-full pl-10 pr-11 py-3 text-sm text-white placeholder-white/25 rounded-xl bg-white/[0.06] border transition-all duration-200 outline-none focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/50 disabled:opacity-40 disabled:cursor-not-allowed ${
              passwordError
                ? 'border-red-400/40 focus:ring-red-400/30 focus:border-red-400/50'
                : 'border-white/[0.10] hover:border-white/[0.18]'
            }`}
            placeholder="••••••••"
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading || success}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/25 hover:text-white/50 transition-colors disabled:opacity-40"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {passwordError && (
          <p id="password-error" className="text-xs text-red-300/80 flex items-center gap-1 mt-1">
            <AlertCircle className="w-3 h-3" />
            {passwordError}
          </p>
        )}
      </div>

      {/* Forgot password link */}
      <div className="flex justify-end">
        <a
          href="/forgot-password"
          className="text-xs text-[#67e8f9]/60 hover:text-[#67e8f9] transition-colors duration-200"
        >
          Forgot password?
        </a>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || success}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed ${
          success
            ? 'bg-[#67e8f9]/15 border border-[#67e8f9]/25 text-[#67e8f9]'
            : 'bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black hover:shadow-lg hover:shadow-[#67e8f9]/20 hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <span className="relative flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {success && <CheckCircle2 className="w-4 h-4" />}
          {loading ? 'Signing in...' : success ? 'Success!' : 'Sign in'}
        </span>
      </button>

      {/* Keyboard shortcut hint */}
      <p className="text-center text-[11px] text-white/20 font-light">
        Press{' '}
        <kbd className="px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.10] rounded text-white/30 font-mono text-[10px]">
          Enter
        </kbd>{' '}
        to sign in
      </p>
    </form>
  )
}
