'use client'

/**
 * Custom Login View - 2FA Authentication Flow
 *
 * This component replaces PayloadCMS's default login view to enforce 2FA.
 *
 * Flow:
 * 1. User enters email + password
 * 2. Submit to /api/auth/request-login-code
 * 3. Show code input field
 * 4. User enters 6-digit code
 * 5. Submit to /api/auth/verify-login-code with email + password + code
 * 6. On success, redirect to /admin
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomLogin() {
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | 'code'>('credentials')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')

  // Step 1: Request login code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/request-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        setStep('code')
      } else {
        setError(data.message || 'Failed to send login code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify code and login
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to admin dashboard
        router.push('/admin')
        router.refresh()
      } else {
        setError(data.message || 'Invalid verification code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/request-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        setError('') // Clear any errors
        // Optionally show a success message
      } else {
        setError(data.message || 'Failed to resend code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          padding: 2rem;
        }

        .login-card {
          background: #1a1a1a;
          border: 1px solid #67e8f9;
          border-radius: 12px;
          padding: 3rem;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 0 40px rgba(103, 232, 249, 0.1);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .brand {
          font-size: 28px;
          font-weight: bold;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .gradient-text {
          background: linear-gradient(45deg, #67e8f9, #3b82f6);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          color: #9ca3af;
          font-size: 14px;
          margin-top: 0.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          color: #e5e5e5;
          font-size: 14px;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #0a0a0a;
          border: 1px solid #374151;
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          transition: all 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #67e8f9;
          box-shadow: 0 0 0 3px rgba(103, 232, 249, 0.1);
        }

        input::placeholder {
          color: #6b7280;
        }

        .code-input {
          text-align: center;
          letter-spacing: 0.5em;
          font-size: 24px;
          font-family: 'Courier New', monospace;
        }

        .error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          color: #fca5a5;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 1.5rem;
        }

        .submit-button {
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(90deg, #67e8f9, #3b82f6);
          border: none;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(103, 232, 249, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .resend-link {
          text-align: center;
          margin-top: 1rem;
        }

        .resend-button {
          background: none;
          border: none;
          color: #67e8f9;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
        }

        .resend-button:hover {
          color: #3b82f6;
        }

        .back-button {
          background: none;
          border: 1px solid #374151;
          color: #9ca3af;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
          margin-top: 0.5rem;
          transition: all 0.2s;
        }

        .back-button:hover {
          border-color: #67e8f9;
          color: #67e8f9;
        }

        .help-text {
          color: #9ca3af;
          font-size: 13px;
          margin-top: 0.5rem;
          text-align: center;
        }
      `}</style>

      <div className="login-card">
        <div className="login-header">
          <div className="brand">
            ORCA<span className="gradient-text">CLUB</span>
          </div>
          <div className="subtitle">
            {step === 'credentials' ? 'Admin Login' : 'Enter Verification Code'}
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {step === 'credentials' ? (
          <form onSubmit={handleRequestCode}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Sending Code...' : 'Continue'}
            </button>

            <p className="help-text">
              You'll receive a 6-digit verification code via email
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="code-input"
                autoFocus
              />
            </div>

            <p className="help-text">
              Check your email ({email}) for a 6-digit code
            </p>

            <button type="submit" className="submit-button" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying...' : 'Login'}
            </button>

            <div className="resend-link">
              <button
                type="button"
                className="resend-button"
                onClick={handleResendCode}
                disabled={loading}
              >
                Resend Code
              </button>
            </div>

            <button
              type="button"
              className="back-button"
              onClick={() => {
                setStep('credentials')
                setCode('')
                setError('')
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
