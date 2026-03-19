import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Clock, Calendar, MessageSquare, Zap, Shield } from 'lucide-react'
import AnimatedBackground from '@/components/layout/animated-background'
import ScrollReveal from '@/components/layout/scroll-reveal'
import dynamic from 'next/dynamic'
const BookingModal = dynamic(() => import('@/components/booking-modal').then(m => ({ default: m.BookingModal })))

export const metadata: Metadata = {
  title: 'Free Consultation | ORCACLUB',
  description:
    'Schedule a free 30-minute call with ORCACLUB. We listen first, define the right solution, and leave you with a clear plan — no obligation.',
  openGraph: {
    title: 'Free Consultation | ORCACLUB',
    description: 'Schedule a free 30-minute call. Walk away with a clear plan for your project.',
    url: 'https://orcaclub.pro/consultations',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  alternates: { canonical: 'https://orcaclub.pro/consultations' },
}

const steps = [
  {
    num: '01',
    title: 'We listen first.',
    desc: 'No pitch, no pressure. We ask questions about your business, your goals, and what\'s holding you back.',
  },
  {
    num: '02',
    title: 'We define the solution.',
    desc: 'Based on what you share, we\'ll identify exactly which package or custom approach fits your situation.',
  },
  {
    num: '03',
    title: 'You leave with a plan.',
    desc: 'By the end of the call you\'ll know the timeline, the scope, and what it takes to get started.',
  },
]

const trust = [
  {
    Icon: MessageSquare,
    title: 'Direct access',
    desc: "You're speaking with the developer, not a salesperson or account manager.",
  },
  {
    Icon: Shield,
    title: 'Scoped before you pay',
    desc: 'We define the full scope before any money changes hands. Zero surprises.',
  },
  {
    Icon: Zap,
    title: 'No lock-in',
    desc: 'Everything we build is owned by you. Walk away any time — no strings attached.',
  },
]

const bookingBtnClass =
  'inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-500/80 to-cyan-400/80 text-black font-semibold rounded-full hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 text-base shadow-lg shadow-cyan-900/20'

export default function ConsultationsPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative z-10 pt-36 pb-28 px-8">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <p className="text-[10px] tracking-[0.4em] uppercase text-cyan-400/60 font-light mb-8">
              Free Consultation
            </p>
          </ScrollReveal>

          <ScrollReveal delay={60}>
            <h1 className="text-6xl md:text-8xl font-extralight text-white tracking-tight leading-[1.0] mb-8">
              Schedule a call<br />
              <span className="gradient-text">today.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <p className="text-xl text-gray-400 font-light leading-relaxed mb-10 max-w-xl">
              The process will allow us to find solutions that work with your needs — not a template, not a guess.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <div className="flex flex-wrap gap-3 mb-10">
              {['Free · No obligation', '30 minutes', 'Start within 48 hrs'].map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/10 text-xs text-gray-400 font-light"
                >
                  <Check className="w-3 h-3 text-cyan-400/60" />
                  {chip}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <BookingModal
              triggerText="Schedule your free call"
              triggerClassName={bookingBtnClass}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 max-w-4xl mx-auto px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      </div>

      {/* ── What to expect ─────────────────────────────────── */}
      <section className="relative z-10 py-28 px-8">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-light mb-16">
              What to expect
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {steps.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 80}>
                <div className="pr-10 pb-10 md:pb-0 border-b md:border-b-0 md:border-r border-white/[0.06] last:border-0 md:pl-10 first:pl-0">
                  <span className="block text-[10px] font-mono text-cyan-400/30 tracking-widest mb-5">
                    {step.num}
                  </span>
                  <h3 className="text-base font-light text-white mb-3 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-light leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust points ───────────────────────────────────── */}
      <section className="relative z-10 py-16 px-8 border-y border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            {trust.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 60}>
                <div className="flex gap-4 md:px-8 first:pl-0 last:pr-0 md:border-r border-white/[0.06] last:border-0">
                  <item.Icon className="w-4 h-4 text-cyan-400/50 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                    <p className="text-xs text-gray-500 font-light leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="relative z-10 py-36 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight text-white mb-4 tracking-tight leading-tight">
              Start your project today.
            </h2>
            <p className="text-lg text-gray-500 font-light mb-12">
              One call is all it takes.
            </p>
            <BookingModal
              triggerText="Schedule your free call"
              triggerClassName={bookingBtnClass}
            />
            <div className="mt-8">
              <Link
                href="/packages"
                className="inline-flex items-center gap-2 text-sm text-gray-600 font-light hover:text-gray-300 transition-colors duration-200"
              >
                View packages first
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
