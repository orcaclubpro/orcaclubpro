"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mail, Phone, MapPin, User, Building2, MessageSquare,
  Calendar, Loader2, ArrowLeft, ArrowRight, Check,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import AnimatedBackground from "@/components/layout/animated-background"
import { UnifrakturMaguntia } from "next/font/google"

const blackletter = UnifrakturMaguntia({ weight: "400", subsets: ["latin"] })

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  name: string
  email: string
  phone: string
  company: string
  service: string
  message: string
  preferredDate: string
  preferredTime: string
}

interface TimeSlot { start: string; end: string; label: string }
type ConnectMode = 'booking' | 'message' | null
type Step = 1 | 2 | 3

// ── Services ──────────────────────────────────────────────────────────────────

const SERVICES = [
  { value: 'web-design',       label: 'Web Design' },
  { value: 'ai-automation',    label: 'AI & Automation' },
  { value: 'custom-software',  label: 'Custom Software' },
  { value: 'seo-services',     label: 'SEO Services' },
  { value: 'consulting',       label: 'Consulting' },
  { value: 'other',            label: 'Something Else' },
]

// ── Animation ─────────────────────────────────────────────────────────────────

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center:               { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir * -40 }),
}
const spring = { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const }

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2, 3] as Step[]).map((n) => (
        <React.Fragment key={n}>
          <motion.div
            className="h-1 rounded-full"
            animate={{
              width: n === step ? 24 : 8,
              backgroundColor: n <= step ? '#67e8f9' : 'rgba(255,255,255,0.12)',
              opacity: n <= step ? 1 : 0.5,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
          {n < 3 && <div className="h-px w-4 bg-white/10 flex-shrink-0" />}
        </React.Fragment>
      ))}
      <span className="ml-2 text-xs text-white/30 tracking-wider">Step {step} of 3</span>
    </div>
  )
}

// ── Input / select classes ────────────────────────────────────────────────────

const inputCls =
  "w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/[0.10] rounded-xl text-white placeholder-white/25 text-sm transition-all duration-200 outline-none focus:bg-white/[0.09] focus:ring-2 focus:ring-[#67e8f9]/35 focus:border-[#67e8f9]/50 hover:border-white/[0.18]"

const selectCls =
  "w-full px-4 py-3.5 bg-white/[0.06] border border-white/[0.10] rounded-xl text-white text-sm transition-all duration-200 outline-none focus:bg-white/[0.09] focus:ring-2 focus:ring-[#67e8f9]/35 focus:border-[#67e8f9]/50 hover:border-white/[0.18] appearance-none"

const labelCls = "block text-sm font-medium text-white/50 mb-2 tracking-wide"

// ── Step 1: About you ─────────────────────────────────────────────────────────

function Step1({
  data, onChange, onNext,
}: {
  data: FormData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onNext: () => void
}) {
  const canProceed = data.name.trim() !== '' && data.email.trim() !== ''

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="name" className={labelCls}>Your Name *</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input id="name" name="name" type="text" required autoFocus
            value={data.name} onChange={onChange} placeholder="Jane Smith"
            className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelCls}>Email Address *</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input id="email" name="email" type="email" required
            value={data.email} onChange={onChange} placeholder="you@example.com"
            className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="phone" className={labelCls}>Phone</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input id="phone" name="phone" type="tel"
              value={data.phone} onChange={onChange} placeholder="+1 555-0000"
              className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="company" className={labelCls}>Company</label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input id="company" name="company" type="text"
              value={data.company} onChange={onChange} placeholder="Acme Inc."
              className={inputCls} />
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3.5 rounded-xl font-semibold text-sm bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 relative overflow-hidden group hover:shadow-lg hover:shadow-[#67e8f9]/20 hover:scale-[1.01] active:scale-[0.99]"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <span className="relative flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></span>
      </button>
    </div>
  )
}

// ── Step 2: Your project ──────────────────────────────────────────────────────

function Step2({
  data, onChange, onServiceSelect, onNext, onBack,
}: {
  data: FormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onServiceSelect: (v: string) => void
  onNext: () => void
  onBack: () => void
}) {
  const canProceed = data.service !== '' && data.message.trim() !== ''

  return (
    <div className="space-y-5">
      {/* Service pills */}
      <div>
        <label className={labelCls}>What do you need? *</label>
        <div className="grid grid-cols-2 gap-2">
          {SERVICES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onServiceSelect(s.value)}
              className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all duration-200 text-left flex items-center gap-2 ${
                data.service === s.value
                  ? 'bg-[#67e8f9]/10 border-[#67e8f9]/40 text-[#67e8f9]'
                  : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/[0.16] hover:bg-white/[0.05]'
              }`}
            >
              {data.service === s.value && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className={labelCls}>Tell us about your project *</label>
        <div className="relative">
          <MessageSquare className="absolute left-4 top-3.5 w-4 h-4 text-white/25" />
          <textarea id="message" name="message" required
            value={data.message} onChange={onChange} rows={4}
            placeholder="Describe your goals, timeline, and any key details..."
            className={`${inputCls} pl-11 resize-none`} />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm text-white/40 border border-white/[0.08] hover:text-white/70 hover:border-white/[0.16] transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group hover:shadow-lg hover:shadow-[#67e8f9]/20"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></span>
        </button>
      </div>
    </div>
  )
}

// ── Step 3: How to connect ────────────────────────────────────────────────────

function Step3({
  data, mode, setMode, onChange, onDateChange,
  availableSlots, isLoadingSlots,
  onBack, onSubmit, isSubmitting,
}: {
  data: FormData
  mode: ConnectMode
  setMode: (m: ConnectMode) => void
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onDateChange: (date: string) => void
  availableSlots: TimeSlot[]
  isLoadingSlots: boolean
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const canSubmit = mode === 'message' ||
    (mode === 'booking' && data.preferredDate !== '' && data.preferredTime !== '')

  return (
    <div className="space-y-4">
      {/* Mode cards */}
      <div>
        <label className={labelCls}>How would you like to connect?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('booking')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              mode === 'booking'
                ? 'bg-[#67e8f9]/[0.07] border-[#67e8f9]/40'
                : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.05]'
            }`}
          >
            <Calendar className={`w-5 h-5 mb-2.5 ${mode === 'booking' ? 'text-[#67e8f9]' : 'text-white/30'}`} />
            <p className={`text-sm font-semibold mb-1 ${mode === 'booking' ? 'text-[#67e8f9]' : 'text-white/70'}`}>
              Book a Call
            </p>
            <p className="text-xs text-white/30 leading-snug">Free 15-min consultation</p>
          </button>

          <button
            type="button"
            onClick={() => setMode('message')}
            className={`p-4 rounded-xl border text-left transition-all duration-200 ${
              mode === 'message'
                ? 'bg-[#67e8f9]/[0.07] border-[#67e8f9]/40'
                : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.05]'
            }`}
          >
            <Mail className={`w-5 h-5 mb-2.5 ${mode === 'message' ? 'text-[#67e8f9]' : 'text-white/30'}`} />
            <p className={`text-sm font-semibold mb-1 ${mode === 'message' ? 'text-[#67e8f9]' : 'text-white/70'}`}>
              Send a Message
            </p>
            <p className="text-xs text-white/30 leading-snug">Reply within 24 hours</p>
          </button>
        </div>
      </div>

      {/* Booking date/time — revealed when booking selected */}
      <AnimatePresence>
        {mode === 'booking' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3"
          >
            <div>
              <label htmlFor="preferredDate" className={labelCls}>Preferred Date *</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  id="preferredDate" name="preferredDate" type="date" required
                  value={data.preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => onDateChange(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {data.preferredDate && (
              <div>
                <label htmlFor="preferredTime" className={labelCls}>Preferred Time *</label>
                {isLoadingSlots ? (
                  <div className="flex items-center gap-3 h-12 px-4 bg-white/[0.06] border border-white/[0.10] rounded-xl">
                    <Loader2 className="h-4 w-4 animate-spin text-[#67e8f9]/60" />
                    <span className="text-sm text-white/30">Loading available times...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <select
                    id="preferredTime" name="preferredTime" required
                    value={data.preferredTime} onChange={onChange}
                    className={selectCls}
                  >
                    <option value="" className="bg-[#111]">Select a time...</option>
                    {availableSlots.map((slot, i) => (
                      <option key={i} value={slot.start} className="bg-[#111]">{slot.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center h-12 px-4 bg-white/[0.06] border border-white/[0.10] rounded-xl">
                    <span className="text-sm text-white/30">No available slots — try another date</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm text-white/40 border border-white/[0.08] hover:text-white/70 hover:border-white/[0.16] transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !canSubmit}
          className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group hover:shadow-lg hover:shadow-[#67e8f9]/20"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative flex items-center gap-2">
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : mode === 'booking' ? 'Book Consultation' : mode === 'message' ? 'Send Message' : 'Submit'}
          </span>
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [step, setStep] = useState<Step>(1)
  const [dir, setDir] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [connectMode, setConnectMode] = useState<ConnectMode>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "", email: "", phone: "", company: "",
    service: "", message: "", preferredDate: "", preferredTime: "",
  })

  // Pre-populate service from URL (e.g. ?service=web-design)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const svc = params.get('service')
    const pkg = params.get('package')
    if (svc || pkg) {
      setFormData(prev => ({
        ...prev,
        ...(svc ? { service: svc } : {}),
      }))
    }
  }, [])

  function navigate(next: Step) {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function fetchAvailableSlots(date: string) {
    setIsLoadingSlots(true)
    setAvailableSlots([])
    setFormData(prev => ({ ...prev, preferredTime: "" }))
    try {
      const res = await fetch(`/api/booking/available-slots?date=${date}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAvailableSlots(data.slots || [])
      if (!data.slots?.length) toast.info("No available slots", { description: "Try a different date." })
    } catch {
      toast.error("Couldn't load time slots", { description: "Please try another date." })
    } finally {
      setIsLoadingSlots(false)
    }
  }

  function handleDateChange(date: string) {
    setFormData(prev => ({ ...prev, preferredDate: date }))
    if (date) fetchAvailableSlots(date)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      if (connectMode === 'booking') {
        const res = await fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to book")
        toast.success("Consultation booked!", { description: "Check your email for a calendar invite." })
      } else {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name, email: formData.email,
            phone: formData.phone, company: formData.company,
            service: formData.service, message: formData.message,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to send")
        toast.success("Message sent!", { description: "We'll get back to you within 24 hours." })
      }
      // Reset
      setFormData({ name: "", email: "", phone: "", company: "", service: "", message: "", preferredDate: "", preferredTime: "" })
      setAvailableSlots([])
      setConnectMode(null)
      setDir(1)
      setStep(1)
    } catch (err) {
      toast.error("Something went wrong", { description: err instanceof Error ? err.message : "Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepHeadings: Record<Step, { title: string; sub: string }> = {
    1: { title: "Let's get acquainted.", sub: "Tell us a little about yourself." },
    2: { title: "Your project.", sub: "What are you looking to build?" },
    3: { title: "How to connect.", sub: "Pick the option that works best for you." },
  }
  const heading = stepHeadings[step]

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex h-screen">

        {/* ── LEFT PANEL ── transparent over animated background */}
        <div className="hidden lg:flex flex-col w-[50%] px-16 py-14">
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
              <p className={`${blackletter.className} text-2xl text-white/50 mb-5`}>
                Built to Surface.
              </p>
              <h2 className="text-[4.5rem] font-extralight text-white leading-[1.1]">
                Start a<br /><span className="text-[#67e8f9]">conversation.</span>
              </h2>
              <div className="mt-6 w-8 h-px bg-[#67e8f9]/30" />
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                  <p className="text-lg text-white/50 font-light">chance@orcaclub.pro</p>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                  <p className="text-lg text-white/50 font-light">California 714</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                  <p className="text-lg text-white/50 font-light">By appointment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom label */}
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-white/15" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-light">New Project</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── frosted glass column */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            background: 'rgba(8, 8, 12, 0.70)',
            backdropFilter: 'blur(28px) saturate(1.2)',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Mobile header — compact */}
          <div className="lg:hidden px-6 pt-8 pb-5 flex-shrink-0 border-b border-white/[0.07]">
            <Link href="/">
              <span className="text-sm font-light tracking-[0.35em] uppercase text-white/50">
                ORCA<span className="text-[#67e8f9]/60">CLUB</span>
              </span>
            </Link>
            <h1 className="text-xl font-extralight text-white mt-3 mb-1">
              Start a conversation.
            </h1>
            <p className="text-xs text-white/35 font-light">chance@orcaclub.pro · California 714</p>
          </div>

          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 lg:px-10 py-8 lg:py-12">
            <div className="w-full max-w-[420px]">

              {/* Step heading */}
              <div className="mb-6">
                <StepDots step={step} />
                <AnimatePresence mode="wait" custom={dir}>
                  <motion.div
                    key={`heading-${step}`}
                    custom={dir}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ ...spring, duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-light text-white tracking-wide">{heading.title}</h2>
                    <p className="text-base text-white/40 mt-2 font-light">{heading.sub}</p>
                    <div className="mt-4 w-8 h-px bg-[#67e8f9]/30" />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Form steps */}
              <div className="overflow-hidden">
                <AnimatePresence mode="wait" custom={dir}>
                  {step === 1 && (
                    <motion.div key="s1" custom={dir} variants={variants}
                      initial="enter" animate="center" exit="exit" transition={spring}>
                      <Step1
                        data={formData}
                        onChange={handleChange}
                        onNext={() => navigate(2)}
                      />
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div key="s2" custom={dir} variants={variants}
                      initial="enter" animate="center" exit="exit" transition={spring}>
                      <Step2
                        data={formData}
                        onChange={handleChange}
                        onServiceSelect={(v) => setFormData(p => ({ ...p, service: v }))}
                        onNext={() => navigate(3)}
                        onBack={() => navigate(1)}
                      />
                    </motion.div>
                  )}
                  {step === 3 && (
                    <motion.div key="s3" custom={dir} variants={variants}
                      initial="enter" animate="center" exit="exit" transition={spring}>
                      <Step3
                        data={formData}
                        mode={connectMode}
                        setMode={setConnectMode}
                        onChange={handleChange}
                        onDateChange={handleDateChange}
                        availableSlots={availableSlots}
                        isLoadingSlots={isLoadingSlots}
                        onBack={() => navigate(2)}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-5 border-t border-white/[0.07]">
                <p className="text-xs text-white/25 font-light">
                  Already a client?{' '}
                  <Link href="/login" className="text-[#67e8f9]/60 hover:text-[#67e8f9] transition-colors duration-200">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
