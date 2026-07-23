'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Mail, X, Loader2, FileText, Receipt, FileSignature, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sendProposalEmail, getPackageBillTo } from '@/actions/packages'

const emptyBillTo = {
  name: '', company: '', email: '', phone: '',
  line1: '', line2: '', city: '', state: '', zip: '',
}

const billToInputCls =
  'w-full px-2.5 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder-[#555555] focus:outline-none focus:border-[rgba(139,156,182,0.20)]'

type SendAs = 'proposal' | 'invoice' | 'sow'

const MODES: Array<{ value: SendAs; label: string; icon: typeof FileText; hint: string }> = [
  { value: 'proposal', label: 'Proposal', icon: FileText, hint: 'Services, pricing, and payment schedule for review' },
  { value: 'invoice', label: 'Invoice', icon: Receipt, hint: 'A straight invoice copy — no payment link or order is created' },
  { value: 'sow', label: 'SOW', icon: FileSignature, hint: 'Scope of Work contract — deliverables, timeline, fees, and terms, attached as a PDF' },
]

const SENT_LABEL: Record<SendAs, string> = {
  proposal: 'Proposal',
  invoice: 'Invoice',
  sow: 'Scope of Work',
}

export function EmailPackageModal({
  packageId,
  onClose,
}: {
  packageId: string
  onClose: () => void
}) {
  const [sendAs, setSendAs] = useState<SendAs>('proposal')
  const [addresses, setAddresses] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent?: number; error?: string } | null>(null)
  const [showBillTo, setShowBillTo] = useState(false)
  const [billTo, setBillTo] = useState(emptyBillTo)

  // Prefill the override with the client's saved bill-to so staff edit from a
  // starting point rather than a blank form.
  useEffect(() => {
    let active = true
    getPackageBillTo(packageId).then(res => {
      if (active && res.success) setBillTo({ ...emptyBillTo, ...res.billTo })
    })
    return () => { active = false }
  }, [packageId])

  const hint = MODES.find(m => m.value === sendAs)!.hint
  const patchBill = (k: keyof typeof billTo, v: string) => setBillTo(b => ({ ...b, [k]: v }))

  // Override only applies when every required field is filled (company/suite/phone optional).
  const billToComplete = [billTo.name, billTo.email, billTo.line1, billTo.city, billTo.state, billTo.zip]
    .every(v => v.trim().length > 0)

  async function handleSend() {
    const emails = addresses.split(',').map(e => e.trim()).filter(e => e.includes('@'))
    if (emails.length === 0) return
    setSending(true)
    setResult(null)
    const override =
      sendAs !== 'sow' && billToComplete
        ? {
            name: billTo.name.trim(),
            company: billTo.company.trim() || undefined,
            email: billTo.email.trim(),
            phone: billTo.phone.trim() || undefined,
            address: {
              line1: billTo.line1.trim(),
              line2: billTo.line2.trim() || undefined,
              city: billTo.city.trim(),
              state: billTo.state.trim(),
              zip: billTo.zip.trim(),
            },
          }
        : undefined
    const res = await sendProposalEmail(packageId, emails, sendAs, override)
    setSending(false)
    if ('sent' in res && res.sent > 0) {
      setResult({ sent: res.sent })
      setTimeout(onClose, 2500)
    } else {
      setResult({ error: ('error' in res ? res.error : undefined) ?? 'Failed to send' })
    }
  }

  if (typeof document === 'undefined') return null

  // Portaled to <body> — inside the dashboard layout's zoomed <main>, fixed
  // positioning resolves against the zoomed box and the modal scrolls with
  // the page instead of centering in the viewport.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#000000]/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--space-border-hard)] bg-[var(--space-bg-base)] p-6 space-y-4 shadow-[0_8px_40px_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="size-4" style={{ color: 'var(--space-accent)' }} />
            <h3 className="text-sm font-semibold text-[var(--space-text-primary)]">Email</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] transition-colors rounded-lg hover:bg-[var(--space-bg-card-hover)]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Send as */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">
            Send as
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(mode => {
              const Icon = mode.icon
              const active = sendAs === mode.value
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setSendAs(mode.value)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all',
                    active
                      ? 'border-[rgba(139,156,182,0.25)] bg-[rgba(139,156,182,0.10)]'
                      : 'border-[var(--space-border-hard)] text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)]',
                  )}
                  style={active ? { color: 'var(--space-accent)' } : undefined}
                >
                  <Icon className="size-3.5" />
                  {mode.label}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-[var(--space-text-muted)] leading-relaxed">{hint}</p>
        </div>

        {/* Addresses */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">
            Email addresses
          </label>
          <textarea
            value={addresses}
            onChange={e => setAddresses(e.target.value)}
            placeholder="client@example.com, another@example.com"
            rows={3}
            className="w-full px-3 py-2.5 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-xl text-[var(--space-text-primary)] placeholder-[#555555] focus:outline-none focus:border-[rgba(139,156,182,0.20)] resize-none"
          />
          <p className="text-[10px] text-[var(--space-text-muted)]">Separate multiple addresses with commas</p>
        </div>

        {/* Bill to override — proposal & invoice only */}
        {sendAs !== 'sow' && (
          <div className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowBillTo(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
            >
              <ChevronRight className={cn('size-3.5 text-[var(--space-text-muted)] transition-transform', showBillTo && 'rotate-90')} />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">Bill to override</span>
              <span
                className={cn(
                  'ml-auto text-[9px] font-semibold uppercase tracking-widest',
                  billToComplete ? 'text-emerald-400' : 'text-[var(--space-text-muted)]',
                )}
              >
                {billToComplete ? 'Active' : 'Using client'}
              </span>
            </button>
            {showBillTo && (
              <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[var(--space-border-hard)]">
                <p className="text-[10px] text-[var(--space-text-muted)] leading-relaxed pt-2">
                  Prefilled from the client's saved details — edit any field to change the bill-to on this send. Used only when Name, Email, Street, City, State, and ZIP are all filled.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={billTo.name} onChange={e => patchBill('name', e.target.value)} placeholder="Name *" className={billToInputCls} />
                  <input value={billTo.company} onChange={e => patchBill('company', e.target.value)} placeholder="Company" className={billToInputCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={billTo.email} onChange={e => patchBill('email', e.target.value)} placeholder="Email *" className={billToInputCls} />
                  <input value={billTo.phone} onChange={e => patchBill('phone', e.target.value)} placeholder="Phone" className={billToInputCls} />
                </div>
                <input value={billTo.line1} onChange={e => patchBill('line1', e.target.value)} placeholder="Street address *" className={billToInputCls} />
                <input value={billTo.line2} onChange={e => patchBill('line2', e.target.value)} placeholder="Suite / unit" className={billToInputCls} />
                <div className="grid grid-cols-3 gap-2">
                  <input value={billTo.city} onChange={e => patchBill('city', e.target.value)} placeholder="City *" className={billToInputCls} />
                  <input value={billTo.state} onChange={e => patchBill('state', e.target.value)} placeholder="State *" className={billToInputCls} />
                  <input value={billTo.zip} onChange={e => patchBill('zip', e.target.value)} placeholder="ZIP *" className={billToInputCls} />
                </div>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className={cn(
            'rounded-xl px-3 py-2.5 text-xs font-medium',
            result.sent
              ? 'bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/[0.08] border border-red-500/20 text-red-400',
          )}>
            {result.sent
              ? `✓ ${SENT_LABEL[sendAs]} sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}`
              : `✗ ${result.error ?? 'Failed to send'}`
            }
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-xs font-medium text-[var(--space-text-muted)] border border-[var(--space-border-hard)] rounded-xl hover:text-[var(--space-text-tertiary)] hover:border-[var(--space-border-hard)] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !addresses.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded-xl hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-40 transition-all"
            style={{ color: 'var(--space-accent)' }}
          >
            {sending
              ? <><Loader2 className="size-3.5 animate-spin" /> Sending…</>
              : <><Mail className="size-3.5" /> Send</>
            }
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
