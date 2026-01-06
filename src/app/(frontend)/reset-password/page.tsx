'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AnimatedBackground from '@/components/layout/animated-background'
import ScrollReveal from '@/components/layout/scroll-reveal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Check, X } from 'lucide-react'

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

  // Password strength indicators
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

    // Validate all password requirements
    if (!Object.values(passwordChecks).every(check => check)) {
      setError('Please meet all password requirements.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setPassword('')
        setConfirmPassword('')

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/admin')
        }, 3000)
      } else {
        setError(data.message || 'An error occurred. Please try again.')
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Main Content */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-md mx-auto">
          <ScrollReveal>
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extralight tracking-tight mb-4">
                Reset <span className="gradient-text font-light">Password</span>
              </h1>
              <p className="text-lg text-gray-400 font-light">
                Choose a new password for your ORCACLUB account.
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-600/20 to-emerald-500/20 border border-green-400/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-medium mb-1">Password reset successful!</p>
                    <p className="text-sm text-gray-300">
                      Your password has been updated. Redirecting you to login...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-600/20 to-rose-500/20 border border-red-400/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium mb-1">Error</p>
                    <p className="text-sm text-gray-300">{error}</p>
                    {error.includes('expired') && (
                      <Link
                        href="/forgot-password"
                        className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 inline-block"
                      >
                        Request a new reset link →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form Card */}
            {!success && token && (
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* New Password Input */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        disabled={loading}
                        className="pl-12 pr-12 bg-black/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                        disabled={loading}
                        className="pl-12 pr-12 bg-black/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  {password && (
                    <div className="space-y-2 p-4 bg-black/30 rounded-lg border border-gray-700/50">
                      <p className="text-sm font-medium text-gray-300 mb-3">Password Requirements:</p>

                      <div className="space-y-2">
                        <RequirementItem
                          met={passwordChecks.minLength}
                          text="At least 8 characters"
                        />
                        <RequirementItem
                          met={passwordChecks.hasUppercase}
                          text="One uppercase letter (A-Z)"
                        />
                        <RequirementItem
                          met={passwordChecks.hasLowercase}
                          text="One lowercase letter (a-z)"
                        />
                        <RequirementItem
                          met={passwordChecks.hasNumber}
                          text="One number (0-9)"
                        />
                        {confirmPassword && (
                          <RequirementItem
                            met={passwordChecks.passwordsMatch}
                            text="Passwords match"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading || !Object.values(passwordChecks).every(check => check)}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium py-6 text-lg rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                        Resetting Password...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Remember your password?{' '}
                <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}

// Password requirement indicator component
function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-gray-500 flex-shrink-0" />
      )}
      <span className={`text-sm ${met ? 'text-green-400' : 'text-gray-400'}`}>
        {text}
      </span>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
