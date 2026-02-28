'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Eye, EyeOff, AlertCircle, Check, X, Loader2,
  Building2, Phone, MapPin, ArrowRight,
} from 'lucide-react'
import AnimatedBackground from '@/components/layout/animated-background'

// ── Helpers ──────────────────────────────────────────────────────────────────

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {met
        ? <Check className="w-3.5 h-3.5 text-[#67e8f9] flex-shrink-0" />
        : <X className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />}
      <span className={`text-xs font-medium ${met ? 'text-[#67e8f9]' : 'text-white/35'}`}>
        {text}
      </span>
    </div>
  )
}

// ── Framer Motion variants ────────────────────────────────────────────────────

const slideVariants = {
  enter: { opacity: 0, x: 36 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -36 },
}

const fadeUpVariants = {
  enter: { opacity: 0, y: 24 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
}

const spring = { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }

// ── Left panel copy per step ──────────────────────────────────────────────────

const COPY = {
  1: {
    tag: 'Account Setup',
    title: 'Welcome to\nORCACLUB.',
    body: 'Create a strong password to secure your workspace and get access to your projects, invoices, and proposals.',
    step: 'Step 1 of 2',
  },
  2: {
    tag: 'Almost There',
    title: 'Tell us about\nyour business.',
    body: 'These details help us tailor your experience. Everything is for internal use only — never shared.',
    step: 'Step 2 of 2',
  },
} as const

type Step = 1 | 2

// ── Shared input class ────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white placeholder-white/25 text-sm transition-all duration-200 outline-none focus:bg-white/[0.09] focus:ring-2 focus:ring-[#67e8f9]/40 focus:border-[#67e8f9]/50 disabled:opacity-50 disabled:cursor-not-allowed'

// ── Step 1: Password ──────────────────────────────────────────────────────────

function PasswordStep({
  token,
  onSuccess,
}: {
  token: string | null
  onSuccess: (username: string | null) => void
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNum: /[0-9]/.test(password),
    match: password !== '' && password === confirm,
  }
  const allMet = Object.values(checks).every(Boolean)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) { setError('Invalid or missing setup link.'); return }
    if (!allMet) { setError('Please meet all password requirements.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, source: 'setup' }),
      })
      const data = await res.json()
      if (res.ok) { onSuccess(data.username ?? null) }
      else { setError(data.message || 'Something went wrong. Please try again.') }
    } catch {
      setError('Unable to connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300 leading-relaxed">{error}</p>
            {error.includes('expired') && (
              <Link href="/contact" className="text-sm text-[#67e8f9]/70 hover:text-[#67e8f9] transition-colors mt-1 inline-block underline underline-offset-2">
                Contact support
              </Link>
            )}
          </div>
        </motion.div>
      )}

      {/* Password */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-white/70">
          Password
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="w-4 h-4 text-white/30 group-focus-within:text-[#67e8f9]/70 transition-colors" />
          </div>
          <input
            id="password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            placeholder="Create a password"
            className={`${inputCls} pl-11 pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            disabled={loading}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/60 transition-colors"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm */}
      <div className="space-y-2">
        <label htmlFor="confirm" className="block text-sm font-medium text-white/70">
          Confirm Password
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="w-4 h-4 text-white/30 group-focus-within:text-[#67e8f9]/70 transition-colors" />
          </div>
          <input
            id="confirm"
            type={showCf ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={loading}
            placeholder="Confirm your password"
            className={`${inputCls} pl-11 pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowCf(!showCf)}
            disabled={loading}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/60 transition-colors"
          >
            {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Requirements */}
      <AnimatePresence>
        {password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-3 pb-1 border-t border-white/[0.08]">
              <RequirementItem met={checks.minLength} text="At least 8 characters" />
              <RequirementItem met={checks.hasUpper}  text="One uppercase letter" />
              <RequirementItem met={checks.hasLower}  text="One lowercase letter" />
              <RequirementItem met={checks.hasNum}    text="One number" />
              {confirm && <RequirementItem met={checks.match} text="Passwords match" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={loading || !allMet || !token}
        className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#67e8f9]/10"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>
          : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
      </button>

      <p className="text-sm text-white/35 text-center pt-1">
        Need help?{' '}
        <Link href="/contact" className="text-[#67e8f9]/60 hover:text-[#67e8f9] transition-colors underline underline-offset-2">
          Contact support
        </Link>
      </p>
    </form>
  )
}

// ── Step 2: Business Details ──────────────────────────────────────────────────

function DetailsStep({
  onSave,
  onSkip,
  saving,
  error,
}: {
  onSave: (data: {
    company: string
    phone: string
    address: { line1: string; line2: string; city: string; state: string; zip: string; country: string }
  }) => Promise<void>
  onSkip: () => void
  saving: boolean
  error: string
}) {
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [addr, setAddrState] = useState({ line1: '', line2: '', city: '', state: '', zip: '', country: '' })
  const set = (k: keyof typeof addr) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddrState((a) => ({ ...a, [k]: e.target.value }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ company, phone, address: addr }) }} className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 leading-relaxed">{error}</p>
        </motion.div>
      )}

      {/* Company */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/70">Company Name</label>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Corp" disabled={saving}
            className={`${inputCls} pl-11`} />
        </div>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/70">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555-000-0000" disabled={saving}
            className={`${inputCls} pl-11`} />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-sm font-medium text-white/70">
          <MapPin className="w-3.5 h-3.5" />
          Business Address
        </label>
        <div className="space-y-2">
          <input type="text" value={addr.line1} onChange={set('line1')}
            placeholder="Street address" disabled={saving} className={inputCls} />
          <input type="text" value={addr.line2} onChange={set('line2')}
            placeholder="Suite, unit, etc. (optional)" disabled={saving} className={inputCls} />
          <div className="grid grid-cols-5 gap-2">
            <input type="text" value={addr.city} onChange={set('city')}
              placeholder="City" disabled={saving} className={`${inputCls} col-span-2`} />
            <input type="text" value={addr.state} onChange={set('state')}
              placeholder="State" disabled={saving} className={`${inputCls} col-span-1`} />
            <input type="text" value={addr.zip} onChange={set('zip')}
              placeholder="ZIP" disabled={saving} className={`${inputCls} col-span-2`} />
          </div>
          <input type="text" value={addr.country} onChange={set('country')}
            placeholder="Country" disabled={saving} className={inputCls} />
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#67e8f9]/10"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            : 'Save & Open Dashboard'}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 border border-white/[0.08] hover:border-white/[0.15] transition-all disabled:opacity-40"
        >
          Skip for now
        </button>
      </div>

      <p className="text-xs text-white/30 text-center leading-relaxed">
        Details are for internal use only and for our records.
        <br />You can update them anytime from your account.
      </p>
    </form>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

function SetupAccountForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [step, setStep] = useState<Step>(1)
  const [username, setUsername] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState('')
  const [step2Saving, setStep2Saving] = useState(false)
  const [step2Error, setStep2Error] = useState('')

  useEffect(() => {
    if (!token) setTokenError('Invalid or missing setup link. Please contact support to resend your invitation.')
  }, [token])

  const redirect = () => router.push(username ? `/u/${username}` : '/login')

  async function handleSave(data: {
    company: string
    phone: string
    address: { line1: string; line2: string; city: string; state: string; zip: string; country: string }
  }) {
    setStep2Saving(true)
    setStep2Error('')
    try {
      const res = await fetch('/api/auth/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company:  data.company || undefined,
          phone:    data.phone   || undefined,
          address: {
            line1:   data.address.line1   || undefined,
            line2:   data.address.line2   || undefined,
            city:    data.address.city    || undefined,
            state:   data.address.state   || undefined,
            zip:     data.address.zip     || undefined,
            country: data.address.country || undefined,
          },
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setStep2Error(body.message || 'Failed to save — you can update these later.')
        setTimeout(redirect, 2000)
        return
      }
      redirect()
    } catch {
      setStep2Error('Could not save details — redirecting to your dashboard.')
      setTimeout(redirect, 2000)
    } finally {
      setStep2Saving(false)
    }
  }

  const copy = COPY[step]

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden">

      {/* Animated homepage background */}
      <AnimatedBackground />

      {/* ── LEFT: Atmospheric copy ───────────────────────────────────────── */}
      <div className="relative z-10 hidden lg:flex flex-col justify-between w-[52%] px-16 py-14">

        {/* Wordmark */}
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span className="text-sm font-light tracking-[0.35em] uppercase text-white/50 group-hover:text-white/80 transition-colors">
            ORCA<span className="text-[#67e8f9]/60">CLUB</span>
          </span>
        </Link>

        {/* Center copy */}
        <div className="flex-1 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={fadeUpVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={spring}
              className="max-w-[420px]"
            >
              {/* Tag */}
              <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-[#67e8f9]/70 mb-6">
                {copy.tag}
              </span>

              {/* Title */}
              <h1 className="text-[3rem] font-extralight text-white leading-[1.15] mb-6 whitespace-pre-line">
                {copy.title}
              </h1>

              <div className="w-10 h-px bg-[#67e8f9]/30 mb-6" />

              {/* Body */}
              <p className="text-base text-white/50 leading-relaxed font-light max-w-[340px]">
                {copy.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {([1, 2] as Step[]).map((n) => (
              <motion.div
                key={n}
                className="h-0.5 rounded-full"
                animate={{
                  width: n === step ? 32 : 10,
                  backgroundColor: n <= step
                    ? 'rgba(103,232,249,0.6)'
                    : 'rgba(255,255,255,0.12)',
                }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            ))}
          </div>
          <span className="text-xs text-white/30 tracking-widest uppercase">{copy.step}</span>
        </div>
      </div>

      {/* ── RIGHT: Form ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-14 lg:py-0">

        {/* Glass panel */}
        <div
          className="w-full max-w-[420px] rounded-2xl border border-white/[0.10] p-8 lg:p-10 shadow-2xl"
          style={{ background: 'rgba(8, 8, 12, 0.75)', backdropFilter: 'blur(24px) saturate(1.2)' }}
        >

          {/* Mobile wordmark */}
          <div className="lg:hidden mb-8 text-center">
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-white/40 mb-1">ORCACLUB</p>
            <p className="text-sm text-white/30">{copy.tag}</p>
          </div>

          {/* Step heading above the form */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-5">
              {/* Step dots */}
              <div className="flex gap-1.5">
                {([1, 2] as Step[]).map((n) => (
                  <motion.div
                    key={n}
                    className="h-1 rounded-full"
                    animate={{
                      width: n === step ? 20 : 6,
                      backgroundColor: n <= step
                        ? 'rgba(103,232,249,0.7)'
                        : 'rgba(255,255,255,0.15)',
                    }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  />
                ))}
              </div>
              <span className="text-xs text-white/35 tracking-wider">{copy.step}</span>
            </div>

            <h2 className="text-2xl font-light text-white">
              {step === 1 ? 'Set up your account.' : 'Business details.'}
            </h2>
            <p className="text-sm text-white/45 mt-2 leading-relaxed">
              {step === 1
                ? 'Choose a strong password to protect your workspace.'
                : 'Optional — helps us personalise your experience.'}
            </p>
          </div>

          {/* Token error */}
          {tokenError && step === 1 && (
            <div className="flex items-start gap-3 bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 leading-relaxed">{tokenError}</p>
            </div>
          )}

          {/* Step content */}
          <AnimatePresence mode="wait" custom={1}>
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={spring}
              >
                <PasswordStep
                  token={token}
                  onSuccess={(u) => { setUsername(u); setStep(2) }}
                />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={spring}
              >
                <DetailsStep
                  onSave={handleSave}
                  onSkip={redirect}
                  saving={step2Saving}
                  error={step2Error}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function SetupAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-black flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-0.5 h-8 bg-[#67e8f9]/50 rounded-full"
          />
        </div>
      }
    >
      <SetupAccountForm />
    </Suspense>
  )
}
