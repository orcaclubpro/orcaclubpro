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
import { startAuthentication } from '@simplewebauthn/browser'

export default function CustomLogin() {
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | 'code' | 'locked' | 'unlock-sent'>('credentials')
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
      } else if (data.locked) {
        setStep('locked')
        setError('')
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
        router.push(`/u/${data.user.username}`)
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

  const handlePasskeyLogin = async () => {
    setError('')
    setLoading(true)

    try {
      // Step 1: Get authentication options (discoverable credentials)
      const optionsResponse = await fetch('/api/auth/passkey/authenticate-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!optionsResponse.ok) {
        const data = await optionsResponse.json()
        setError(data.error || 'Failed to start passkey sign-in')
        return
      }

      const { options } = await optionsResponse.json()

      // Step 2: Prompt user to use their passkey
      let credential
      try {
        credential = await startAuthentication({ optionsJSON: options })
      } catch (err: unknown) {
        const name = err instanceof Error ? err.name : ''
        if (name === 'NotAllowedError' || name === 'AbortError') {
          setError('Sign-in cancelled.')
        } else {
          setError('Passkey sign-in was cancelled.')
        }
        return
      }

      // Step 3: Verify with server (sets payload-token cookie)
      const verifyResponse = await fetch('/api/auth/passkey/verify-authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })

      const data = await verifyResponse.json()

      if (data.success) {
        const { username } = data.user
        router.push(`/u/${username}`)
        router.refresh()
      } else {
        setError(data.error || 'Passkey sign-in failed. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestUnlock = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/request-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setStep('unlock-sent')
      } else {
        setError(data.message || 'Failed to send unlock email')
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

        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #374151;
        }

        .divider-text {
          color: #6b7280;
          font-size: 13px;
          white-space: nowrap;
        }

        .passkey-button {
          width: 100%;
          padding: 0.875rem;
          background: transparent;
          border: 1px solid #374151;
          border-radius: 8px;
          color: #9ca3af;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .passkey-button:hover {
          border-color: #67e8f9;
          color: #67e8f9;
        }

        .passkey-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .passkey-button:hover:disabled {
          border-color: #374151;
          color: #9ca3af;
        }
      `}</style>

      <div className="login-card">
        <div className="login-header">
          <div className="brand">
            ORCA<span className="gradient-text">CLUB</span>
          </div>
          <div className="subtitle">
            {step === 'credentials' && 'Admin Login'}
            {step === 'code' && 'Enter Verification Code'}
            {step === 'locked' && 'Account Locked'}
            {step === 'unlock-sent' && 'Check your inbox'}
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {step === 'credentials' ? (
          <>
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

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            <button
              type="button"
              className="passkey-button"
              onClick={handlePasskeyLogin}
              disabled={loading}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2C8.5 2 5.5 4 4 7" />
                <path d="M20 7c-1.5-3-4.5-5-8-5" />
                <path d="M4 12c0-4.4 3.6-8 8-8" />
                <path d="M20 12c0-1.7-.5-3.2-1.4-4.5" />
                <path d="M12 8c2.2 0 4 1.8 4 4v1" />
                <path d="M8 12c0-2.2 1.8-4 4-4" />
                <path d="M8 15c0 .8.1 1.6.4 2.3" />
                <path d="M16 13v3c0 1.7-.7 3.2-1.8 4.3" />
                <path d="M12 12v4" />
              </svg>
              Sign in with a passkey
            </button>
          </>
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

        {step === 'locked' && (
          <div>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#9ca3af', lineHeight: '1.6' }}>
              Your account has been temporarily locked after too many failed login attempts.
              We can send you an unlock link to <strong style={{ color: '#e5e5e5' }}>{email}</strong>.
            </p>

            {error && <div className="error">{error}</div>}

            <button
              type="button"
              className="submit-button"
              onClick={handleRequestUnlock}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Unlock Email'}
            </button>

            <button
              type="button"
              className="back-button"
              onClick={() => {
                setStep('credentials')
                setError('')
              }}
            >
              Back to Login
            </button>
          </div>
        )}

        {step === 'unlock-sent' && (
          <div>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#9ca3af', lineHeight: '1.6' }}>
              Unlock link sent to <strong style={{ color: '#e5e5e5' }}>{email}</strong>. Click the link in the email to unlock your account, then return here to log in.
            </p>

            <button
              type="button"
              className="back-button"
              onClick={() => {
                setStep('credentials')
                setError('')
              }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
