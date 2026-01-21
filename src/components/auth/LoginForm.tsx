'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function LoginForm() {
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

    // Validate fields
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)

    if (!isEmailValid || !isPasswordValid) {
      return
    }

    setLoading(true)

    try {
      const result = await loginAction({ email, password })

      if (result.success && result.username) {
        // Show success state
        setSuccess(true)

        // Wait for animation before redirect
        setTimeout(() => {
          router.push(`/u/${result.username}`)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Login successful!</p>
            <p className="text-green-400/80 text-xs mt-0.5">Redirecting to your dashboard...</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{error}</p>
            {error.includes('admin panel') ? (
              <p className="text-red-400/80 text-xs mt-1">
                Admin users should{' '}
                <a href="/admin" className="underline hover:text-red-300 transition-colors font-medium">
                  login via the admin panel
                </a>
              </p>
            ) : (
              <p className="text-red-400/80 text-xs mt-1">
                Need help?{' '}
                <a href="/contact" className="underline hover:text-red-300 transition-colors">
                  Contact support
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email Address
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="w-5 h-5 text-gray-500 group-focus-within:text-intelligence-cyan transition-colors" />
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={(e) => validateEmail(e.target.value)}
            disabled={loading || success}
            className={`w-full pl-12 pr-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500
              transition-all duration-200 outline-none
              focus:bg-gray-800 focus:ring-2 focus:ring-intelligence-cyan/50 focus:border-intelligence-cyan
              disabled:opacity-50 disabled:cursor-not-allowed
              ${emailError ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' : 'border-gray-700 hover:border-gray-600'}`}
            placeholder="you@example.com"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (
            <p id="email-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {emailError}
            </p>
          )}
        </div>
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="w-5 h-5 text-gray-500 group-focus-within:text-intelligence-cyan transition-colors" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={(e) => validatePassword(e.target.value)}
            disabled={loading || success}
            className={`w-full pl-12 pr-12 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-500
              transition-all duration-200 outline-none
              focus:bg-gray-800 focus:ring-2 focus:ring-intelligence-cyan/50 focus:border-intelligence-cyan
              disabled:opacity-50 disabled:cursor-not-allowed
              ${passwordError ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' : 'border-gray-700 hover:border-gray-600'}`}
            placeholder="••••••••"
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading || success}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          {passwordError && (
            <p id="password-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {passwordError}
            </p>
          )}
        </div>
      </div>

      {/* Forgot password link */}
      <div className="flex items-center justify-end">
        <a
          href="/forgot-password"
          className="text-sm text-intelligence-cyan hover:text-intelligence-cyan/80 transition-colors group inline-flex items-center gap-1"
        >
          Forgot password?
          <svg
            className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={loading || success}
        className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 relative overflow-hidden group
          ${success
            ? 'bg-green-500 hover:bg-green-500 text-white'
            : 'bg-intelligence-cyan hover:bg-intelligence-cyan/90 hover:shadow-lg hover:shadow-intelligence-cyan/20 text-black'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          transform hover:scale-[1.02] active:scale-[0.98]`}
      >
        {/* Button shine effect */}
        {!loading && !success && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
        )}

        {/* Button content */}
        <span className="relative flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {success && <CheckCircle2 className="w-5 h-5" />}
          {loading ? 'Signing in...' : success ? 'Success!' : 'Sign in'}
        </span>
      </Button>

      {/* Keyboard shortcut hint */}
      <p className="text-center text-xs text-gray-600">
        Press <kbd className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400 font-mono">Enter</kbd> to sign in
      </p>
    </form>
  )
}
