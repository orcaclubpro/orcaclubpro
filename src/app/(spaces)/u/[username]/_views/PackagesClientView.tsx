'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Check, X, Loader2,
  Sparkles, FileText, ExternalLink, CheckCircle2, CalendarDays, Mail,
  PenLine, ShieldCheck, AlertCircle, ChevronDown, ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signProposal, emailPackageToSelf, emailContractToSelf } from '@/actions/packages'

// ── Types ──────────────────────────────────────────────────────────────────────

interface LineItem {
  name: string
  description?: string | null
  price: number
  adjustedPrice?: number | null
  quantity?: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

interface ScheduledEntry {
  id: string
  label: string
  amount: number
  dueDate?: string | null
  orderId?: string | null
}

interface PackageDoc {
  id: string
  name: string
  description?: string | null
  coverMessage?: string | null
  lineItems?: LineItem[]
  paymentSchedule?: ScheduledEntry[]
  status?: string
  clientSignature?: {
    typedName?: string | null
    signedByEmail?: string | null
    signedAt?: string | null
  } | null
  orcaclubSignature?: {
    authorizedByName?: string | null
    authorizedByEmail?: string | null
    authorizedAt?: string | null
  } | null
}

interface PackagesClientViewProps {
  clientPackages: PackageDoc[]
  username: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function computeTotals(lineItems: LineItem[] = []) {
  let oneTime = 0, monthly = 0, annual = 0
  for (const item of lineItems) {
    const total = (item.adjustedPrice ?? item.price ?? 0) * (item.quantity ?? 1)
    if (item.isRecurring) {
      if (item.recurringInterval === 'year') annual += total
      else monthly += total
    } else {
      oneTime += total
    }
  }
  return { oneTime, monthly, annual }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return ''
  const parts = isoDate.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return ''
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d)
  if (!isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function statusStyle(status?: string) {
  switch (status) {
    case 'accepted': return 'text-emerald-400 border-emerald-400/25 bg-emerald-400/10'
    case 'sent':     return 'text-[#67e8f9] border-[#67e8f9]/25 bg-[#67e8f9]/10'
    default:         return 'text-gray-500 border-white/10 bg-white/[0.04]'
  }
}

const CONSENT_DISCLOSURE = `By typing your full legal name and clicking "Sign Agreement", you:

1. Consent to receive this agreement and related notices electronically. You may request a paper copy at any time by emailing carbon@orcaclub.pro.

2. Acknowledge your right to withdraw consent at any time without penalty by contacting carbon@orcaclub.pro — withdrawal applies to future records only.

3. Confirm that typing your name constitutes a legal electronic signature under the ESIGN Act and UETA, equivalent to a handwritten signature.

4. Confirm you have read and agree to the Service Agreement Terms displayed on the full proposal.`

// ── Canvas Signature Pad ──────────────────────────────────────────────────────

function SignaturePad({
  onSign,
}: {
  onSign: (dataUrl: string | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const [hasSignature, setHasSignature] = useState(false)

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e instanceof MouseEvent) {
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
    } else {
      const touch = e.touches[0]
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = 'transparent'
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const onStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      drawing.current = true
      lastPos.current = getPos(e, canvas)
    }
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      if (!drawing.current || !lastPos.current) return
      const pos = getPos(e, canvas)
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      lastPos.current = pos
      setHasSignature(true)
      onSign(canvas.toDataURL('image/png'))
    }
    const onEnd = () => { drawing.current = false; lastPos.current = null }

    canvas.addEventListener('mousedown', onStart)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onEnd)
    canvas.addEventListener('mouseleave', onEnd)
    canvas.addEventListener('touchstart', onStart, { passive: false })
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchend', onEnd)

    return () => {
      canvas.removeEventListener('mousedown', onStart)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onEnd)
      canvas.removeEventListener('mouseleave', onEnd)
      canvas.removeEventListener('touchstart', onStart)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onEnd)
    }
  }, [onSign])

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onSign(null)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-gray-500">Draw Signature <span className="text-gray-700 normal-case tracking-normal font-normal">(optional)</span></p>
        {hasSignature && (
          <button type="button" onClick={clear} className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest">
            Clear
          </button>
        )}
      </div>
      <div className="relative rounded-xl border border-white/[0.10] bg-white/[0.02] overflow-hidden" style={{ height: 100 }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-full cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-gray-700 italic">Draw your signature here</p>
          </div>
        )}
        {/* Baseline */}
        <div className="absolute bottom-6 left-8 right-8 border-b border-dashed border-white/[0.08] pointer-events-none" />
      </div>
    </div>
  )
}

// ── Package Detail Modal ────────────────────────────────────────────────────────

type ModalStep = 'details' | 'sign' | 'signed'

function PackageModal({
  pkg,
  username,
  onClose,
}: {
  pkg: PackageDoc
  username: string
  onClose: () => void
}) {
  const [step, setStep] = useState<ModalStep>(
    pkg.clientSignature?.signedAt ? 'signed' : 'details'
  )
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState<string | null>(null)
  const [typedName, setTypedName] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [invoiceUrls, setInvoiceUrls] = useState<string[]>([])

  const lineItems = pkg.lineItems ?? []
  const schedule = pkg.paymentSchedule ?? []
  const { oneTime, monthly, annual } = computeTotals(lineItems)

  const pendingEntries = schedule.filter(e => !e.orderId)
  const canSign =
    pkg.status !== 'accepted' &&
    !pkg.clientSignature?.signedAt &&
    (pendingEntries.length > 0 || (schedule.length === 0 && lineItems.length > 0))

  const pendingTotal = schedule.length > 0
    ? pendingEntries.reduce((s, e) => s + e.amount, 0)
    : oneTime + monthly + annual

  const isSignValid = typedName.trim().length >= 2 && consentChecked

  const handleSign = async () => {
    if (!isSignValid) return
    setSigning(true)
    setSignError(null)
    const result = await signProposal({ packageId: pkg.id, typedName })
    setSigning(false)
    if (result.success) {
      setInvoiceUrls(result.invoiceUrls ?? [])
      setStep('signed')
    } else {
      setSignError(result.error ?? 'Failed to sign agreement')
    }
  }

  // ESC close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-20 sm:pb-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-[580px] max-h-[calc(92vh-80px)] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-white/[0.10] overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #141414 0%, #0d0d0d 100%)' }}
      >
        {/* Top cyan line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#67e8f9]/50 to-transparent shrink-0" />

        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-white/[0.15]" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── SIGNED CONFIRMATION ── */}
          {step === 'signed' && (
            <div className="py-4 space-y-5">
              <div className="flex flex-col items-center text-center gap-4 py-6">
                <div className="size-14 rounded-2xl bg-emerald-400/10 border border-emerald-400/25 flex items-center justify-center">
                  <ShieldCheck className="size-7 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1.5">Agreement Signed</h2>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                    Your electronic signature has been recorded. A confirmation with your certificate hash has been sent to your email.
                  </p>
                </div>
              </div>

              {/* Signature record */}
              {pkg.clientSignature?.signedAt && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4 space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-400/80 mb-3">Signature Record</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-gray-600">Signed by</span>
                    <span className="text-gray-300 text-right font-medium">{pkg.clientSignature.typedName}</span>
                    <span className="text-gray-600">Email</span>
                    <span className="text-gray-300 text-right">{pkg.clientSignature.signedByEmail}</span>
                    <span className="text-gray-600">Date</span>
                    <span className="text-gray-300 text-right">
                      {new Date(pkg.clientSignature.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}

              {invoiceUrls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gray-500">Your Invoices</p>
                  {invoiceUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#67e8f9]/20 bg-[#67e8f9]/[0.04] text-sm text-[#67e8f9] hover:bg-[#67e8f9]/[0.08] transition-all">
                      <ExternalLink className="size-3.5 shrink-0" />
                      View Invoice {invoiceUrls.length > 1 ? `#${i + 1}` : ''}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SIGN STEP ── */}
          {step === 'sign' && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold tracking-[0.32em] uppercase text-[#67e8f9]/80 mb-2">Sign Agreement</p>
                  <h2 className="text-lg font-bold text-white leading-tight">{pkg.name}</h2>
                </div>
                <button onClick={onClose} className="size-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all shrink-0">
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Amount to authorize */}
              {pendingTotal > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex-1">
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest font-semibold mb-0.5">Total authorized</p>
                    <p className="text-lg font-bold text-white tabular-nums font-mono">{fmt(pendingTotal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest font-semibold mb-0.5">Proposal</p>
                    <p className="text-xs text-gray-400">{pkg.name}</p>
                  </div>
                </div>
              )}

              {/* ESIGN Disclosure */}
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400/80 mb-2">Electronic Signature Disclosure</p>
                <p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-line">{CONSENT_DISCLOSURE}</p>
              </div>

              {/* Canvas signature pad */}
              <SignaturePad onSign={() => {}} />

              {/* Typed name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-[0.22em] uppercase text-gray-500">
                  Type Your Full Legal Name <span className="text-[#67e8f9]/80">*</span>
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={e => setTypedName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  autoComplete="name"
                  className="w-full px-4 py-3 text-sm bg-white/[0.04] border border-white/[0.12] rounded-xl text-white placeholder-gray-700 focus:outline-none focus:border-[#67e8f9]/40 focus:bg-white/[0.06] transition-all"
                  style={{ fontFamily: 'Georgia, serif', fontSize: 15 }}
                />
                <p className="text-[10px] text-gray-700">This constitutes your legal electronic signature</p>
              </div>

              {/* Consent checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  className={cn(
                    'mt-0.5 size-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                    consentChecked
                      ? 'bg-[#67e8f9]/20 border-[#67e8f9]/70'
                      : 'border-white/[0.22] group-hover:border-white/40',
                  )}
                  onClick={() => setConsentChecked(v => !v)}
                >
                  {consentChecked && <Check className="size-2.5 text-[#67e8f9]" />}
                </div>
                <span className="text-xs text-gray-400 leading-relaxed" onClick={() => setConsentChecked(v => !v)}>
                  I agree to sign this agreement electronically, have read the{' '}
                  <Link href={`/u/${username}/packages/${pkg.id}/print`} target="_blank" className="text-[#67e8f9] hover:underline">
                    full proposal and service terms
                  </Link>
                  , and consent to receive records electronically.
                </span>
              </label>

              {signError && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-red-400/25 bg-red-400/[0.06]">
                  <AlertCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{signError}</p>
                </div>
              )}
            </div>
          )}

          {/* ── DETAILS STEP ── */}
          {step === 'details' && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold tracking-[0.32em] uppercase text-[#67e8f9]/80 mb-2">
                    Service Package
                  </p>
                  <h2 className="text-xl font-bold text-white leading-tight">{pkg.name}</h2>
                  {pkg.description && (
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">{pkg.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {pkg.status === 'accepted' && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border text-emerald-400 border-emerald-400/25 bg-emerald-400/10">
                      Signed
                    </span>
                  )}
                  <button
                    onClick={onClose}
                    className="size-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Pricing summary */}
              {(oneTime > 0 || monthly > 0 || annual > 0) && (
                <div className="flex items-end gap-6 flex-wrap p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  {oneTime > 0 && (
                    <div>
                      <p className="text-2xl font-bold text-white tabular-nums">{fmt(oneTime)}</p>
                      <p className="text-[9px] text-gray-300 mt-1 uppercase tracking-[0.18em]">one-time</p>
                    </div>
                  )}
                  {monthly > 0 && (
                    <div>
                      <div className="flex items-baseline gap-0.5">
                        <p className="text-2xl font-bold text-white tabular-nums">{fmt(monthly)}</p>
                        <p className="text-sm text-gray-500">/mo</p>
                      </div>
                      <p className="text-[9px] text-gray-300 mt-1 uppercase tracking-[0.18em]">monthly</p>
                    </div>
                  )}
                  {annual > 0 && (
                    <div>
                      <div className="flex items-baseline gap-0.5">
                        <p className="text-2xl font-bold text-white tabular-nums">{fmt(annual)}</p>
                        <p className="text-sm text-gray-500">/yr</p>
                      </div>
                      <p className="text-[9px] text-gray-300 mt-1 uppercase tracking-[0.18em]">annually</p>
                    </div>
                  )}
                </div>
              )}

              {/* Cover message */}
              {pkg.coverMessage && (
                <div className="px-4 py-3.5 rounded-xl border-l-2 border-[#67e8f9]/30 bg-[#67e8f9]/[0.025]">
                  <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{pkg.coverMessage}</p>
                </div>
              )}

              {/* Included services */}
              {lineItems.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold tracking-[0.25em] uppercase gradient-text mb-2.5">
                    What&apos;s Included &middot; {lineItems.length}
                  </p>
                  <div className="space-y-1.5">
                    {lineItems.map((item, i) => {
                      const qty = item.quantity ?? 1
                      const basePrice = item.price ?? 0
                      const adjustedTotal = (item.adjustedPrice ?? basePrice) * qty
                      const baseTotal = basePrice * qty
                      const hasDiscount = item.adjustedPrice != null && item.adjustedPrice !== basePrice
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-white/[0.025] border border-white/[0.05]"
                        >
                          <div className="mt-0.5 size-4 rounded-full bg-[#67e8f9]/15 border border-[#67e8f9]/30 flex items-center justify-center shrink-0">
                            <Check className="size-2.5 text-[#67e8f9]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-sm font-semibold text-white leading-snug">{item.name}</p>
                              <div className="flex flex-col items-end gap-0.5 shrink-0">
                                {hasDiscount && (
                                  <span className="text-xs text-gray-300 line-through tabular-nums font-mono">
                                    {fmt(baseTotal)}
                                  </span>
                                )}
                                <span className={cn('text-sm font-bold tabular-nums font-mono', hasDiscount ? 'text-[#67e8f9]' : 'text-white')}>
                                  {fmt(adjustedTotal)}
                                  {item.isRecurring && (
                                    <span className="text-xs font-normal text-gray-500">/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
                                  )}
                                </span>
                              </div>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-300 mt-1 leading-relaxed">{item.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Payment schedule */}
              {schedule.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <CalendarDays className="size-3.5 text-gray-600" />
                    <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-gray-500">
                      Payment Schedule
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {schedule.map((entry, i) => {
                      const isInvoiced = !!entry.orderId
                      return (
                        <div
                          key={entry.id ?? i}
                          className={cn(
                            'flex items-center gap-3 px-3.5 py-2.5 rounded-xl border',
                            isInvoiced
                              ? 'bg-white/[0.015] border-white/[0.04]'
                              : 'bg-white/[0.025] border-white/[0.05]',
                          )}
                        >
                          <div className={`size-1.5 rounded-full shrink-0 ${isInvoiced ? 'bg-emerald-400' : 'bg-[#67e8f9]/50'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium', isInvoiced ? 'text-gray-500' : 'text-gray-300')}>
                              {entry.label}
                            </p>
                            {entry.dueDate && (
                              <p className={cn('text-[10px] mt-0.5', isInvoiced ? 'text-gray-700' : 'text-gray-600')}>
                                Due {formatDisplayDate(entry.dueDate)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isInvoiced && (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
                                Invoiced
                              </span>
                            )}
                            <span className={cn('text-sm font-bold tabular-nums font-mono', isInvoiced ? 'text-gray-500' : 'text-white')}>
                              {fmt(entry.amount)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {/* Schedule total */}
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-white/[0.01]">
                      <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest">Total</span>
                      <span className="text-sm font-bold text-white tabular-nums font-mono">
                        {fmt(schedule.reduce((s, e) => s + e.amount, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {lineItems.length === 0 && schedule.length === 0 && (
                <p className="text-xs text-gray-300 italic py-1">
                  Your team is still configuring this package. Check back soon.
                </p>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.07] bg-black/20">
          {step === 'signed' ? (
            <div className="flex items-center gap-3 px-6 py-4">
              <Link
                href={`/u/${username}/packages/${pkg.id}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                <FileText className="size-3.5" />
                View Signed Contract
              </Link>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-semibold text-white bg-white/[0.06] border border-white/[0.12] rounded-xl hover:bg-white/[0.10] transition-all"
              >
                Done
              </button>
            </div>
          ) : step === 'sign' ? (
            <div className="flex items-center gap-3 px-6 py-4">
              <button
                onClick={() => { setStep('details'); setSignError(null) }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                Back
              </button>
              <div className="flex-1" />
              <button
                onClick={handleSign}
                disabled={signing || !isSignValid}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#67e8f9]/[0.12] border border-[#67e8f9]/30 text-[#67e8f9] hover:bg-[#67e8f9]/[0.20] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {signing
                  ? <><Loader2 className="size-3.5 animate-spin" /> Signing…</>
                  : <><PenLine className="size-3.5" /> Sign Agreement</>
                }
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-6 py-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                Close
              </button>
              <div className="flex-1" />
              <Link
                href={`/u/${username}/packages/${pkg.id}/print`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                <FileText className="size-3.5" />
                Full Package
                <ExternalLink className="size-3" />
              </Link>
              {canSign && (
                <button
                  onClick={() => setStep('sign')}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-[#67e8f9]/[0.10] border border-[#67e8f9]/25 text-[#67e8f9] hover:bg-[#67e8f9]/[0.18] hover:border-[#67e8f9]/40 transition-all duration-200"
                >
                  <PenLine className="size-3.5" />
                  Review & Sign
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PackagesClientView({ clientPackages, username }: PackagesClientViewProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [modalPkg, setModalPkg] = useState<PackageDoc | null>(null)
  const [emailingId, setEmailingId] = useState<string | null>(null)
  const [emailSentIds, setEmailSentIds] = useState<Set<string>>(new Set())
  const [emailPopupId, setEmailPopupId] = useState<string | null>(null)
  const [emailOptPkg, setEmailOptPkg] = useState(true)
  const [emailOptContract, setEmailOptContract] = useState(false)
  const total = clientPackages.length

  const openEmailPopup = (pkg: PackageDoc) => {
    const bothSigned = !!pkg.clientSignature?.signedAt && !!pkg.orcaclubSignature?.authorizedAt
    setEmailOptPkg(!bothSigned)
    setEmailOptContract(bothSigned)
    setEmailPopupId(pkg.id)
  }

  const handleEmailSend = async (pkg: PackageDoc) => {
    setEmailPopupId(null)
    setEmailingId(pkg.id)
    const result = emailOptContract
      ? await emailContractToSelf(pkg.id)
      : await emailPackageToSelf(pkg.id)
    setEmailingId(null)
    if (result.success) {
      setEmailSentIds(prev => new Set(prev).add(pkg.id))
      setTimeout(() => setEmailSentIds(prev => { const n = new Set(prev); n.delete(pkg.id); return n }), 4000)
    }
  }
  const containerRef = useRef<HTMLDivElement>(null)

  // Touch swipe on carousel
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchLocked = useRef<'h' | 'v' | null>(null)

  const goTo = (idx: number) => setActiveIdx(Math.max(0, Math.min(total - 1, idx)))

  // Keyboard nav (only when modal closed)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (modalPkg) return
      if (e.key === 'ArrowLeft') goTo(activeIdx - 1)
      if (e.key === 'ArrowRight') goTo(activeIdx + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIdx, modalPkg])

  // Touch on carousel container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      touchLocked.current = null
    }
    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = e.touches[0].clientY - touchStartY.current
      if (!touchLocked.current) {
        if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 8) touchLocked.current = 'h'
        else if (Math.abs(dy) > 8) touchLocked.current = 'v'
      }
      if (touchLocked.current === 'h') e.preventDefault()
    }
    const onEnd = (e: TouchEvent) => {
      if (touchLocked.current !== 'h') return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      if (dx < -40) goTo(activeIdx + 1)
      else if (dx > 40) goTo(activeIdx - 1)
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [activeIdx])

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (total === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <div className="text-center max-w-xs">
          <div className="inline-flex p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#67e8f9]/5 to-transparent" />
            <Sparkles className="size-8 text-gray-600 relative z-10" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Your packages are on the way</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your team is curating custom service packages for you. They&apos;ll appear here once ready.
          </p>
        </div>
      </div>
    )
  }

  // ── Carousel ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop to close email popup */}
      {emailPopupId && (
        <div className="fixed inset-0 z-40" onClick={() => setEmailPopupId(null)} />
      )}

      <div className="flex flex-col">

        {/* Header */}
        <div className="px-6 lg:px-10 pt-8 pb-6 flex items-end justify-between">
          <div>
            <p className="text-[9px] font-bold tracking-[0.32em] uppercase text-[#67e8f9]/80 mb-1.5">
              Service Packages
            </p>
            <h2 className="text-xl font-bold text-white tracking-tight">Your Packages</h2>
          </div>
          {total > 1 && (
            <span className="text-sm font-mono text-gray-300 tabular-nums">
              {pad(activeIdx + 1)}<span className="text-gray-700 mx-1">/</span>{pad(total)}
            </span>
          )}
        </div>

        {/* ── Main carousel ────────────────────────────────────────────────── */}
        <div ref={containerRef} className="px-6 lg:px-10 overflow-hidden select-none">
          <div
            className="flex"
            style={{
              transform: `translateX(-${activeIdx * 100}%)`,
              transition: 'transform 420ms cubic-bezier(0.36, 0.66, 0.04, 1)',
            }}
          >
            {clientPackages.map((pkg, i) => {
              const { oneTime, monthly, annual } = computeTotals(pkg.lineItems ?? [])
              const lineItems = pkg.lineItems ?? []
              const schedule = pkg.paymentSchedule ?? []
              const isActive = i === activeIdx
              const canSign =
                pkg.status !== 'accepted' &&
                !pkg.clientSignature?.signedAt &&
                (schedule.some(e => !e.orderId) || (schedule.length === 0 && lineItems.length > 0))
              const bothSigned = !!pkg.clientSignature?.signedAt && !!pkg.orcaclubSignature?.authorizedAt

              return (
                <div key={pkg.id} className="min-w-full">
                  <div
                    className={cn(
                      'relative rounded-2xl border overflow-hidden transition-all duration-500',
                      isActive ? 'border-[#67e8f9]/[0.18]' : 'border-white/[0.06]',
                    )}
                    style={{ background: 'linear-gradient(155deg, #181818 0%, #0e0e0e 60%, #121212 100%)' }}
                  >
                    {/* Top cyan line */}
                    <div className={cn(
                      'h-px transition-all duration-700',
                      isActive
                        ? 'bg-gradient-to-r from-transparent via-[#67e8f9]/60 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-white/[0.05] to-transparent',
                    )} />

                    <div className="p-8 lg:p-10">
                      {/* Eyebrow + status */}
                      <div className="flex items-center justify-between mb-8">
                        <p className="text-[9px] font-bold tracking-[0.32em] uppercase text-[#67e8f9]/80">
                          Service Package
                        </p>
                        {pkg.status && pkg.status !== 'draft' && (
                          <span className={cn(
                            'text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border',
                            statusStyle(pkg.status),
                          )}>
                            {pkg.status}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="text-3xl lg:text-[2.5rem] font-bold text-white leading-tight tracking-tight mb-4">
                        {pkg.name}
                      </h3>

                      {pkg.description && (
                        <p className="text-sm text-gray-400 leading-relaxed mb-8 max-w-xl">
                          {pkg.description}
                        </p>
                      )}

                      {/* Pricing */}
                      {(oneTime > 0 || monthly > 0 || annual > 0) && (
                        <div className="flex items-end gap-8 flex-wrap mb-8">
                          {oneTime > 0 && (
                            <div>
                              <p className="text-4xl font-bold text-white tabular-nums tracking-tight">{fmt(oneTime)}</p>
                              <p className="text-[9px] text-gray-300 mt-1.5 uppercase tracking-[0.2em]">one-time</p>
                            </div>
                          )}
                          {monthly > 0 && (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <p className="text-4xl font-bold text-white tabular-nums tracking-tight">{fmt(monthly)}</p>
                                <p className="text-xl text-gray-300 font-normal">/mo</p>
                              </div>
                              <p className="text-[9px] text-gray-300 mt-1.5 uppercase tracking-[0.2em]">monthly</p>
                            </div>
                          )}
                          {annual > 0 && (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <p className="text-4xl font-bold text-white tabular-nums tracking-tight">{fmt(annual)}</p>
                                <p className="text-xl text-gray-300 font-normal">/yr</p>
                              </div>
                              <p className="text-[9px] text-gray-300 mt-1.5 uppercase tracking-[0.2em]">annually</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Services cluster */}
                      {lineItems.length > 0 && (
                        <div className="flex items-center gap-3 mb-9">
                          <div className="flex -space-x-1.5">
                            {Array.from({ length: Math.min(6, lineItems.length) }).map((_, j) => (
                              <div
                                key={j}
                                className="size-6 rounded-full bg-[#67e8f9]/15 border-2 flex items-center justify-center"
                                style={{ borderColor: '#0e0e0e' }}
                              >
                                <Check className="size-3 text-[#67e8f9]" />
                              </div>
                            ))}
                            {lineItems.length > 6 && (
                              <div
                                className="size-6 rounded-full bg-white/[0.08] border-2 flex items-center justify-center"
                                style={{ borderColor: '#0e0e0e' }}
                              >
                                <span className="text-[9px] text-gray-400 font-bold">+{lineItems.length - 6}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {lineItems.length} service{lineItems.length !== 1 ? 's' : ''} included
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* View Details — primary action */}
                        <button
                          onClick={() => setModalPkg(pkg)}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.08] border border-white/[0.18] text-white hover:bg-white/[0.13] hover:border-white/30 transition-all duration-200"
                        >
                          View Details
                        </button>

                        {/* Sign state */}
                        {canSign ? (
                          <button
                            onClick={() => setModalPkg(pkg)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#67e8f9]/[0.10] border border-[#67e8f9]/25 text-[#67e8f9] hover:bg-[#67e8f9]/[0.18] hover:border-[#67e8f9]/40 transition-all duration-200"
                          >
                            <PenLine className="size-3.5" />
                            Review & Sign
                          </button>
                        ) : pkg.clientSignature?.signedAt ? (
                          <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                            <ShieldCheck className="size-3.5" />
                            Signed
                          </span>
                        ) : null}

                        {/* Full Package link */}
                        <Link
                          href={`/u/${username}/packages/${pkg.id}/print`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          <FileText className="size-3.5" />
                          Full Package
                          <ExternalLink className="size-3" />
                        </Link>

                        {/* View Contract — only when both parties have signed */}
                        {bothSigned && (
                          <Link
                            href={`/u/${username}/packages/${pkg.id}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            <ScrollText className="size-3.5" />
                            View Contract
                            <ExternalLink className="size-3" />
                          </Link>
                        )}

                        {/* Email with popup — always last */}
                        <div className="relative">
                          <button
                            onClick={() => emailPopupId === pkg.id ? setEmailPopupId(null) : openEmailPopup(pkg)}
                            disabled={emailingId === pkg.id}
                            className={cn(
                              'flex items-center gap-1.5 text-sm transition-colors',
                              emailSentIds.has(pkg.id)
                                ? 'text-emerald-400'
                                : 'text-gray-500 hover:text-gray-300',
                            )}
                          >
                            {emailingId === pkg.id
                              ? <Loader2 className="size-3.5 animate-spin" />
                              : emailSentIds.has(pkg.id)
                              ? <CheckCircle2 className="size-3.5" />
                              : <Mail className="size-3.5" />}
                            {emailingId === pkg.id ? 'Sending…' : emailSentIds.has(pkg.id) ? 'Sent!' : 'Email'}
                            {!emailSentIds.has(pkg.id) && emailingId !== pkg.id && (
                              <ChevronDown className={cn('size-3 transition-transform duration-200', emailPopupId === pkg.id && 'rotate-180')} />
                            )}
                          </button>

                          {/* Popup */}
                          {emailPopupId === pkg.id && (
                            <div className="absolute bottom-full right-0 mb-2 w-52 rounded-xl bg-[#111] border border-white/[0.12] shadow-xl p-3 z-50">
                              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Email me</p>
                              <label className="flex items-center gap-2 py-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={emailOptPkg}
                                  onChange={e => setEmailOptPkg(e.target.checked)}
                                  className="accent-[#67e8f9] size-3.5"
                                />
                                <span className="text-sm text-gray-300">Package proposal</span>
                              </label>
                              {bothSigned && (
                                <label className="flex items-center gap-2 py-1 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={emailOptContract}
                                    onChange={e => setEmailOptContract(e.target.checked)}
                                    className="accent-[#67e8f9] size-3.5"
                                  />
                                  <span className="text-sm text-gray-300">Signed contract</span>
                                </label>
                              )}
                              <button
                                onClick={() => handleEmailSend(pkg)}
                                disabled={!emailOptPkg && !emailOptContract}
                                className="mt-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.08] border border-white/[0.12] text-white hover:bg-white/[0.12] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Send
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        {total > 1 && (
          <div className="flex items-center justify-between px-6 lg:px-10 pt-5 pb-2">
            {/* Arrow buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => goTo(activeIdx - 1)}
                disabled={activeIdx === 0}
                className={cn(
                  'size-9 rounded-xl border flex items-center justify-center transition-all duration-200',
                  activeIdx === 0
                    ? 'border-white/[0.04] text-gray-700 cursor-not-allowed'
                    : 'border-white/[0.10] text-gray-400 hover:border-[#67e8f9]/35 hover:text-[#67e8f9] hover:bg-[#67e8f9]/[0.05]',
                )}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => goTo(activeIdx + 1)}
                disabled={activeIdx === total - 1}
                className={cn(
                  'size-9 rounded-xl border flex items-center justify-center transition-all duration-200',
                  activeIdx === total - 1
                    ? 'border-white/[0.04] text-gray-700 cursor-not-allowed'
                    : 'border-white/[0.10] text-gray-400 hover:border-[#67e8f9]/35 hover:text-[#67e8f9] hover:bg-[#67e8f9]/[0.05]',
                )}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {clientPackages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === activeIdx
                      ? 'w-5 h-1.5 bg-[#67e8f9]'
                      : 'w-1.5 h-1.5 bg-white/[0.18] hover:bg-white/30',
                  )}
                />
              ))}
            </div>

            {/* Spacer to balance arrows */}
            <div className="w-20" />
          </div>
        )}

        {/* ── Package selector strip ────────────────────────────────────────── */}
        {total > 1 && (
          <div className="px-6 lg:px-10 pt-4 pb-10">
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase gradient-text mb-3">
              All Packages
            </p>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
              {clientPackages.map((pkg, i) => {
                const { oneTime, monthly } = computeTotals(pkg.lineItems ?? [])
                const isActive = i === activeIdx
                return (
                  <button
                    key={pkg.id}
                    onClick={() => { goTo(i); setModalPkg(pkg) }}
                    className={cn(
                      'shrink-0 flex flex-col gap-1.5 p-3.5 rounded-xl border text-left transition-all duration-200',
                      isActive
                        ? 'border-[#67e8f9]/25 bg-[#67e8f9]/[0.06]'
                        : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]',
                    )}
                    style={{ minWidth: 150, maxWidth: 200 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[9px] font-bold tabular-nums', isActive ? 'text-[#67e8f9]/60' : 'text-gray-600')}>
                        {pad(i + 1)}
                      </span>
                    </div>
                    <p className={cn('text-xs font-semibold leading-snug line-clamp-2', isActive ? 'text-white' : 'text-gray-400')}>
                      {pkg.name}
                    </p>
                    {(oneTime > 0 || monthly > 0) && (
                      <p className={cn('text-xs font-mono tabular-nums', isActive ? 'text-[#67e8f9]' : 'text-gray-600')}>
                        {oneTime > 0 ? fmt(oneTime) : `${fmt(monthly)}/mo`}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── Detail modal ─────────────────────────────────────────────────────── */}
      {modalPkg && (
        <PackageModal
          pkg={modalPkg}
          username={username}
          onClose={() => setModalPkg(null)}
        />
      )}
    </>
  )
}
