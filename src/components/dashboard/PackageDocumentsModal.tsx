'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  X, Loader2, FileText, Receipt, FileSignature, ChevronRight, ChevronLeft,
  Eye, Send, Files, Pencil, Check, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  sendProposalEmail,
  getPackageBillTo,
  getPackageSowDraft,
  savePackageSowDocument,
} from '@/actions/packages'
import { SowTermsEditor } from './SowTermsEditor'
import type { SowFormData } from '@/lib/document-generators'
import type { PackageDocumentType } from '@/lib/packages/documents'

const emptyBillTo = {
  name: '', company: '', email: '', phone: '',
  line1: '', line2: '', city: '', state: '', zip: '',
}

const billToInputCls =
  'w-full px-2.5 py-2 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-lg text-[var(--space-text-primary)] placeholder-[#555555] focus:outline-none focus:border-[rgba(139,156,182,0.20)]'

const DOCS: Array<{ value: PackageDocumentType; label: string; icon: typeof FileText; hint: string }> = [
  { value: 'proposal', label: 'Proposal', icon: FileText, hint: 'Services, pricing, and payment schedule for review' },
  { value: 'invoice', label: 'Invoice', icon: Receipt, hint: 'A straight invoice copy — no payment link or order is created' },
  { value: 'sow', label: 'SOW', icon: FileSignature, hint: 'Scope of Work contract — deliverables, timeline, fees, and terms' },
]

const SENT_LABEL: Record<PackageDocumentType, string> = {
  proposal: 'Proposal',
  invoice: 'Invoice',
  sow: 'Scope of Work',
}

type Step = 'list' | 'send' | 'sow'

/**
 * The package's documents in one place: each of the three renderings can be
 * opened as a PDF or emailed, and the Scope of Work can be written before it
 * goes out. Preview and send share a builder server-side, so what staff open
 * here is exactly what the client receives.
 */
export function PackageDocumentsModal({
  packageId,
  username,
  onClose,
}: {
  packageId: string
  /** Enables the link through to the saved SOW in the Files tab. */
  username?: string
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>('list')
  const [sendFor, setSendFor] = useState<PackageDocumentType | null>(null)
  const [viewing, setViewing] = useState<PackageDocumentType | null>(null)
  const [viewError, setViewError] = useState<string | null>(null)
  const [addresses, setAddresses] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent?: number; error?: string } | null>(null)
  const [showBillTo, setShowBillTo] = useState(false)
  const [billTo, setBillTo] = useState(emptyBillTo)

  // ── Scope of Work ──────────────────────────────────────────────────────────
  const [sow, setSow] = useState<SowFormData | null>(null)
  const [sowDocId, setSowDocId] = useState<string | null>(null)
  const [sowLoading, setSowLoading] = useState(false)
  const [sowSaving, setSowSaving] = useState(false)
  const [sowDirty, setSowDirty] = useState(false)
  const [sowSaved, setSowSaved] = useState(false)
  const [sowError, setSowError] = useState<string | null>(null)

  // Prefill the override with the client's saved bill-to so staff edit from a
  // starting point rather than a blank form — and address the send to the client
  // by default, since that is who a proposal or contract is for. Still editable:
  // typing over it sends anywhere.
  useEffect(() => {
    let active = true
    getPackageBillTo(packageId).then(res => {
      if (!active || !res.success) return
      setBillTo({ ...emptyBillTo, ...res.billTo })
      if (res.billTo.email) setAddresses(a => (a.trim() ? a : res.billTo.email))
    })
    return () => { active = false }
  }, [packageId])

  /**
   * The SOW draft — the linked document's saved wording when there is one, else
   * a fresh derivation from the package. Loaded on demand so the modal opens
   * fast for the two documents that need no editing.
   */
  const loadSow = useCallback(async () => {
    if (sow || sowLoading) return sow
    setSowLoading(true)
    setSowError(null)
    const res = await getPackageSowDraft(packageId)
    setSowLoading(false)
    if (!res.success) { setSowError(res.error); return null }
    setSow(res.sowData)
    setSowDocId(res.documentId)
    return res.sowData
  }, [packageId, sow, sowLoading])

  const patchBill = (k: keyof typeof billTo, v: string) => setBillTo(b => ({ ...b, [k]: v }))

  // Override only applies when every required field is filled (company/suite/phone optional).
  const billToComplete = [billTo.name, billTo.email, billTo.line1, billTo.city, billTo.state, billTo.zip]
    .every(v => v.trim().length > 0)

  /** The override the server should apply — SOW has no bill-to block. */
  function overrideFor(type: PackageDocumentType) {
    if (type === 'sow' || !billToComplete) return undefined
    return {
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
  }

  async function handleView(type: PackageDocumentType) {
    setViewing(type)
    setViewError(null)
    try {
      // The SOW preview renders the editor's current wording, saved or not.
      const sowData = type === 'sow' ? (sow ?? (await loadSow())) : null
      const res = await fetch(`/api/packages/${packageId}/document/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, billTo: overrideFor(type) ?? null, sowData }),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        setViewError(msg.error ?? 'Could not open the document')
        return
      }
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), '_blank')
    } catch {
      setViewError('Could not open the document')
    } finally {
      setViewing(null)
    }
  }

  /** Write the SOW to its document in Files, creating it on first save. */
  async function handleSaveSow(): Promise<boolean> {
    if (!sow) return false
    setSowSaving(true)
    setSowError(null)
    const res = await savePackageSowDocument(packageId, sow)
    setSowSaving(false)
    if (!res.success) { setSowError(res.error); return false }
    setSowDocId(res.id)
    setSowDirty(false)
    setSowSaved(true)
    setTimeout(() => setSowSaved(false), 2000)
    return true
  }

  async function handleSend() {
    if (!sendFor) return
    const emails = addresses.split(',').map(e => e.trim()).filter(e => e.includes('@'))
    if (emails.length === 0) return

    // Unsent edits would go out as the standard text, so the SOW saves first.
    if (sendFor === 'sow' && sowDirty) {
      const ok = await handleSaveSow()
      if (!ok) return
    }

    setSending(true)
    setResult(null)
    // The SOW goes out as the editor currently holds it — including a seeded
    // provider email or edits not yet written to the document — so what was
    // previewed is what the client receives.
    const res = await sendProposalEmail(
      packageId,
      emails,
      sendFor,
      overrideFor(sendFor),
      sendFor === 'sow' ? sow : null,
    )
    setSending(false)
    if ('sent' in res && res.sent > 0) {
      setResult({ sent: res.sent })
      // The SOW step stays open so its document can be created afterwards.
      if (sendFor !== 'sow') setTimeout(onClose, 2500)
    } else {
      setResult({ error: ('error' in res ? res.error : undefined) ?? 'Failed to send' })
    }
  }

  async function openSend(type: PackageDocumentType) {
    setSendFor(type)
    setResult(null)
    setStep('send')
    if (type === 'sow') void loadSow()
  }

  async function openSowEditor() {
    setStep('sow')
    void loadSow()
  }

  function updateSow(updater: (f: SowFormData) => SowFormData) {
    setSow(f => (f ? updater(f) : f))
    setSowDirty(true)
  }

  if (typeof document === 'undefined') return null

  const activeDoc = sendFor ? DOCS.find(d => d.value === sendFor)! : null
  const wide = step === 'sow'

  const sowDocLink = username && sowDocId ? `/u/${username}/files` : null

  // Portaled to <body> so the overlay is never trapped by an ancestor's
  // transform/overflow context and always centers against the viewport.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#000000]/60" onClick={onClose} />

      {/* Dialog */}
      <div
        className={cn(
          'relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--space-border-hard)] bg-[var(--space-bg-base)] p-6 space-y-4 shadow-[0_8px_40px_rgba(255,255,255,0.06)] transition-[max-width]',
          wide ? 'max-w-2xl' : 'max-w-sm',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step !== 'list' ? (
              <button
                onClick={() => { setStep('list'); setSendFor(null); setResult(null) }}
                className="p-1 -ml-1 text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] transition-colors rounded-lg hover:bg-[var(--space-bg-card-hover)]"
                aria-label="Back to documents"
              >
                <ChevronLeft className="size-4" />
              </button>
            ) : (
              <Files className="size-4" style={{ color: 'var(--space-accent)' }} />
            )}
            <h3 className="text-sm font-semibold text-[var(--space-text-primary)]">
              {step === 'sow' ? 'Scope of Work' : activeDoc ? `Send ${activeDoc.label}` : 'Documents'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] transition-colors rounded-lg hover:bg-[var(--space-bg-card-hover)]"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── Document list ──────────────────────────────────────────────── */}
        {step === 'list' && (
          <>
            <div className="space-y-2">
              {DOCS.map(doc => {
                const Icon = doc.icon

                // The SOW is written before it is sent, so its row goes straight
                // to the editor — preview, save, and send all live in there.
                if (doc.value === 'sow') {
                  return (
                    <button
                      key={doc.value}
                      type="button"
                      onClick={openSowEditor}
                      className="w-full flex items-start gap-3 rounded-xl border border-[var(--space-border-hard)] px-3 py-2.5 text-left transition-all hover:border-[rgba(139,156,182,0.25)] hover:bg-[var(--space-bg-card-hover)]"
                    >
                      <Icon className="size-4 mt-0.5 shrink-0" style={{ color: 'var(--space-accent)' }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[var(--space-text-primary)]">{doc.label}</p>
                        <p className="text-[0.625rem] text-[var(--space-text-muted)] leading-relaxed">
                          {sowDocId
                            ? 'Saved as a document — open to revise and send'
                            : 'Write the contract, then preview or send it'}
                        </p>
                      </div>
                      <ChevronRight className="size-4 mt-0.5 shrink-0 text-[var(--space-text-muted)]" />
                    </button>
                  )
                }

                return (
                  <div
                    key={doc.value}
                    className="flex items-start gap-3 rounded-xl border border-[var(--space-border-hard)] px-3 py-2.5 transition-all hover:border-[rgba(139,156,182,0.25)] hover:bg-[var(--space-bg-card-hover)]"
                  >
                    <Icon className="size-4 mt-0.5 shrink-0" style={{ color: 'var(--space-accent)' }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--space-text-primary)]">{doc.label}</p>
                      <p className="text-[0.625rem] text-[var(--space-text-muted)] leading-relaxed">{doc.hint}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleView(doc.value)}
                        disabled={viewing !== null}
                        title="Open as PDF"
                        className="flex items-center gap-1 px-2 py-1 text-[0.625rem] font-semibold text-[var(--space-text-muted)] border border-[var(--space-border-hard)] rounded-lg hover:text-[var(--space-text-primary)] hover:bg-[var(--space-bg-card-hover)] disabled:opacity-40 transition-all"
                      >
                        {viewing === doc.value
                          ? <Loader2 className="size-3 animate-spin" />
                          : <Eye className="size-3" />
                        }
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openSend(doc.value)}
                        title="Email this document"
                        className="flex items-center gap-1 px-2 py-1 text-[0.625rem] font-semibold border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded-lg hover:bg-[rgba(139,156,182,0.10)] transition-all"
                        style={{ color: 'var(--space-accent)' }}
                      >
                        <Send className="size-3" />
                        Send
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {viewError && (
              <div className="rounded-xl px-3 py-2.5 text-xs font-medium bg-red-500/[0.08] border border-red-500/20 text-red-400">
                ✗ {viewError}
              </div>
            )}

            <p className="text-[0.625rem] text-[var(--space-text-muted)] leading-relaxed">
              View opens the PDF exactly as it would be attached. Sending creates no orders.
            </p>
          </>
        )}

        {/* ── Scope of Work editor ───────────────────────────────────────── */}
        {step === 'sow' && (
          <>
            {sowLoading && (
              <div className="flex items-center gap-2 text-xs text-[var(--space-text-muted)] py-6">
                <Loader2 className="size-3.5 animate-spin" /> Loading the Scope of Work…
              </div>
            )}

            {sow && (
              <>
                <p className="text-[0.625rem] text-[var(--space-text-muted)] leading-relaxed">
                  Deliverables and pricing come from the package. Everything below is the contract itself —
                  fill in the overview, set the numbers, and rewrite any clause that does not fit this engagement.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-secondary)] mb-1">
                      Service Provider
                    </label>
                    <input
                      value={sow.providerName}
                      onChange={e => updateSow(f => ({ ...f, providerName: e.target.value }))}
                      placeholder="ORCACLUB"
                      className={billToInputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-secondary)] mb-1">
                      Service Provider Email
                    </label>
                    <input
                      value={sow.providerContact}
                      onChange={e => updateSow(f => ({ ...f, providerContact: e.target.value }))}
                      placeholder="you@orcaclub.pro"
                      className={billToInputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-secondary)] mb-1">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={sow.effectiveDate}
                      onChange={e => updateSow(f => ({ ...f, effectiveDate: e.target.value }))}
                      className={billToInputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-secondary)] mb-1">
                      Client Contact
                    </label>
                    <input
                      value={sow.clientContact}
                      onChange={e => updateSow(f => ({ ...f, clientContact: e.target.value }))}
                      placeholder="Email for notices"
                      className={billToInputCls}
                    />
                  </div>
                </div>
                <p className="text-[0.5625rem] text-[var(--space-text-muted)] leading-relaxed -mt-1">
                  Both emails print in the parties block and are the addresses the Notices clause sends to.
                </p>

                <div>
                  <label className="block text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-secondary)] mb-1">
                    Project Overview
                  </label>
                  <textarea
                    value={sow.projectOverview}
                    onChange={e => updateSow(f => ({ ...f, projectOverview: e.target.value }))}
                    rows={4}
                    placeholder="What this engagement covers, its goals, and the expected outcome. Left blank, it is written from the project name and deliverables."
                    className="w-full px-3 py-2.5 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-xl text-[var(--space-text-primary)] placeholder-[#555555] focus:outline-none focus:border-[rgba(139,156,182,0.20)] resize-y"
                  />
                </div>

                <SowTermsEditor form={sow} onChange={updateSow} />

                {sowError && (
                  <div className="rounded-xl px-3 py-2.5 text-xs font-medium bg-red-500/[0.08] border border-red-500/20 text-red-400">
                    ✗ {sowError}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 sticky bottom-0 bg-[var(--space-bg-base)] pb-1">
                  <button
                    onClick={() => handleView('sow')}
                    disabled={viewing !== null}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[var(--space-text-muted)] border border-[var(--space-border-hard)] rounded-xl hover:text-[var(--space-text-tertiary)] disabled:opacity-40 transition-all"
                  >
                    {viewing === 'sow'
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <Eye className="size-3.5" />
                    }
                    Preview
                  </button>
                  <button
                    onClick={handleSaveSow}
                    disabled={sowSaving}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[var(--space-text-muted)] border border-[var(--space-border-hard)] rounded-xl hover:text-[var(--space-text-primary)] disabled:opacity-40 transition-all"
                  >
                    {sowSaving ? <Loader2 className="size-3.5 animate-spin" />
                      : sowSaved ? <Check className="size-3.5 text-emerald-400" />
                      : <FileSignature className="size-3.5" />}
                    {sowSaving ? 'Saving…' : sowSaved ? 'Saved' : sowDocId ? 'Save document' : 'Create document'}
                  </button>
                  <button
                    onClick={() => openSend('sow')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded-xl hover:bg-[rgba(139,156,182,0.10)] transition-all"
                    style={{ color: 'var(--space-accent)' }}
                  >
                    <Send className="size-3.5" />
                    Send
                  </button>
                </div>
              </>
            )}

            {!sow && !sowLoading && sowError && (
              <div className="rounded-xl px-3 py-2.5 text-xs font-medium bg-red-500/[0.08] border border-red-500/20 text-red-400">
                ✗ {sowError}
              </div>
            )}
          </>
        )}

        {/* ── Send step ──────────────────────────────────────────────────── */}
        {step === 'send' && activeDoc && (
          <>
            <p className="text-[0.625rem] text-[var(--space-text-muted)] leading-relaxed">{activeDoc.hint}</p>

            {activeDoc.value === 'sow' && (
              <button
                type="button"
                onClick={openSowEditor}
                className="w-full flex items-center gap-2 rounded-xl border border-[var(--space-border-hard)] px-3 py-2 text-left hover:bg-[var(--space-bg-card-hover)] transition-all"
              >
                <Pencil className="size-3.5 shrink-0" style={{ color: 'var(--space-accent)' }} />
                <span className="text-[0.625rem] text-[var(--space-text-tertiary)]">
                  {sowDirty ? 'Unsaved edits — saved automatically on send' : 'Edit the contract before sending'}
                </span>
                <ChevronRight className="size-3.5 ml-auto shrink-0 text-[var(--space-text-muted)]" />
              </button>
            )}

            {/* Addresses */}
            <div className="space-y-1.5">
              <label className="text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">
                Email addresses
              </label>
              <textarea
                value={addresses}
                onChange={e => setAddresses(e.target.value)}
                placeholder="client@example.com, another@example.com"
                rows={3}
                className="w-full px-3 py-2.5 text-sm bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] rounded-xl text-[var(--space-text-primary)] placeholder-[#555555] focus:outline-none focus:border-[rgba(139,156,182,0.20)] resize-none"
              />
              <p className="text-[0.625rem] text-[var(--space-text-muted)]">Separate multiple addresses with commas</p>
            </div>

            {/* Bill to override — proposal & invoice only */}
            {activeDoc.value !== 'sow' && (
              <div className="rounded-xl border border-[var(--space-border-hard)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowBillTo(v => !v)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                >
                  <ChevronRight className={cn('size-3.5 text-[var(--space-text-muted)] transition-transform', showBillTo && 'rotate-90')} />
                  <span className="text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">Bill to override</span>
                  <span
                    className={cn(
                      'ml-auto text-[0.5625rem] font-semibold uppercase tracking-widest',
                      billToComplete ? 'text-emerald-400' : 'text-[var(--space-text-muted)]',
                    )}
                  >
                    {billToComplete ? 'Active' : 'Using client'}
                  </span>
                </button>
                {showBillTo && (
                  <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[var(--space-border-hard)]">
                    <p className="text-[0.625rem] text-[var(--space-text-muted)] leading-relaxed pt-2">
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
                  ? `✓ ${SENT_LABEL[activeDoc.value]} sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}`
                  : `✗ ${result.error ?? 'Failed to send'}`
                }
              </div>
            )}

            {/* After a SOW goes out, keep the contract as a document. */}
            {result?.sent && activeDoc.value === 'sow' && (
              <div className="rounded-xl border border-[var(--space-border-hard)] px-3 py-3 space-y-2">
                <p className="text-[0.625rem] text-[var(--space-text-tertiary)] leading-relaxed">
                  {sowDocId
                    ? 'This Scope of Work is saved as a document. Reopen it any time to revise the terms and send an updated copy.'
                    : 'Save this Scope of Work as a document so the wording is kept and can be revised later.'}
                </p>
                <div className="flex items-center gap-2">
                  {!sowDocId && (
                    <button
                      onClick={handleSaveSow}
                      disabled={sowSaving || !sow}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[0.625rem] font-semibold border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded-lg hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-40 transition-all"
                      style={{ color: 'var(--space-accent)' }}
                    >
                      {sowSaving ? <Loader2 className="size-3 animate-spin" /> : <FileSignature className="size-3" />}
                      Create SOW document
                    </button>
                  )}
                  {sowDocLink && (
                    <Link
                      href={sowDocLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[0.625rem] font-semibold text-[var(--space-text-muted)] border border-[var(--space-border-hard)] rounded-lg hover:text-[var(--space-text-primary)] transition-all"
                    >
                      <ExternalLink className="size-3" />
                      Open in Files
                    </Link>
                  )}
                  <button
                    onClick={openSowEditor}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[0.625rem] font-semibold text-[var(--space-text-muted)] border border-[var(--space-border-hard)] rounded-lg hover:text-[var(--space-text-primary)] transition-all"
                  >
                    <Pencil className="size-3" />
                    Revise
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleView(activeDoc.value)}
                disabled={viewing !== null}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[var(--space-text-muted)] border border-[var(--space-border-hard)] rounded-xl hover:text-[var(--space-text-tertiary)] disabled:opacity-40 transition-all"
              >
                {viewing === activeDoc.value
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : <Eye className="size-3.5" />
                }
                Preview
              </button>
              <button
                onClick={handleSend}
                disabled={sending || sowSaving || !addresses.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] rounded-xl hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-40 transition-all"
                style={{ color: 'var(--space-accent)' }}
              >
                {sending
                  ? <><Loader2 className="size-3.5 animate-spin" /> Sending…</>
                  : <><Send className="size-3.5" /> Send</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
