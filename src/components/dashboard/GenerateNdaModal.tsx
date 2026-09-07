'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, Download, FileSignature, Loader2, Mail, Save,
  ShieldCheck, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { createDocument, sendDocumentEmail } from '@/actions/files'
import type { NdaFormData } from '@/lib/document-generators'
import { BRAND_LEGAL_DESCRIPTION, BRAND_TAGLINE } from '@/lib/brand'

// ─── Generate NDA ─────────────────────────────────────────────────────────────
// The client record's own document control. It exists here rather than only on
// the Files tab because everything it needs — legal name, address, who signs,
// where notices go — is already on the record in front of you; opening it from
// a client fills the form and files the result back against that client.
//
// Three stages, one decision each:
//   1. Parties     — who is bound, and by what legal name
//   2. Protections — which optional sections print, and the numbers in them
//   3. Deliver     — download, file it, or send it
//
// The document itself is built in `pdf-generators.ts`; this only collects the
// `NdaFormData` that feeds it.

type Step = 1 | 2 | 3

const STEPS = [
  { num: 1 as Step, label: 'Parties',     icon: Users },
  { num: 2 as Step, label: 'Protections', icon: ShieldCheck },
  { num: 3 as Step, label: 'Deliver',     icon: FileSignature },
]

export interface ClientAddress {
  line1?: string | null
  line2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
}

export interface GenerateNdaModalProps {
  clientId: string
  /** Display name on the client record — the default Client legal name. */
  clientName: string
  clientCompany?: string | null
  clientEmail?: string | null
  clientAddress?: ClientAddress | null
  /** Client-side users on the account, offered as email recipients. */
  recipients?: Array<{ id: string; name: string; email: string }>
  variant?: 'quiet' | 'solid'
}

/** "12 Main St, Suite 4, Irvine, CA 92614" from the account's address group. */
function formatAddress(a?: ClientAddress | null): string {
  if (!a) return ''
  const street = [a.line1, a.line2].filter(Boolean).join(', ')
  const region = [a.city, [a.state, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return [street, region, a.country && a.country !== 'United States' ? a.country : null]
    .filter(Boolean)
    .join(', ')
}

const today = () => new Date().toISOString().split('T')[0]

/** A labelled switch row — the protections step is nothing but these. */
function Toggle({
  checked, onChange, title, note,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  note: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{ fontSize: 13 }}
      className="flex w-full items-start gap-3 rounded-lg border border-[var(--space-border-hard)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--space-bg-card-hover)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]"
    >
      <span
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors"
        style={{
          borderColor: checked ? 'var(--space-accent)' : 'var(--space-border-hard)',
          background: checked ? 'var(--space-accent)' : 'transparent',
        }}
      >
        {checked && <Check className="size-3 text-black" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-[var(--space-text-primary)]">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-[var(--space-text-tertiary)]">{note}</span>
      </span>
    </button>
  )
}

function Field({
  label, hint, children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-[var(--space-text-secondary)]">
        {label}
        {hint && <span className="ml-1.5 text-xs font-normal text-[var(--space-text-muted)]">{hint}</span>}
      </Label>
      {children}
    </div>
  )
}

const inputCx =
  'bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] h-11 focus-visible:ring-[rgba(139,156,182,0.20)]'

export function GenerateNdaModal({
  clientId,
  clientName,
  clientCompany,
  clientEmail,
  clientAddress,
  recipients = [],
  variant = 'quiet',
}: GenerateNdaModalProps) {
  const router = useRouter()

  const [open, setOpen]       = useState(false)
  const [step, setStep]       = useState<Step>(1)
  const [busy, setBusy]       = useState<null | 'download' | 'save' | 'send'>(null)
  const [error, setError]     = useState<string | null>(null)
  const [done, setDone]       = useState<null | string>(null)

  const [brand, setBrand] = useState<'orcaclub' | 'personal'>('orcaclub')
  const [to, setTo] = useState<string>(clientEmail ?? recipients[0]?.email ?? '')

  const [form, setForm] = useState<NdaFormData>(() => ({
    effectiveDate: today(),
    clientName: clientCompany || clientName,
    clientType: clientCompany ? 'company' : 'individual',
    clientAddress: formatAddress(clientAddress),
    clientEntity: '',
    clientSignerName: clientCompany ? clientName : '',
    clientSignerTitle: '',
    clientEmail: clientEmail ?? '',
    providerEntity: '',
    providerEmail: '',
    termYears: '3',
    breachNoticeHours: '72',
    offboardDays: '10',
    governingState: 'California',
    venueCounty: 'Orange',
    includeAccessSection: true,
    includePersonalData: true,
    includeAiClause: true,
    includeDtsaNotice: true,
    includeNonSolicit: false,
  }))

  function set<K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const docName = useMemo(
    () => `NDA — ${form.clientName || clientName} (${brand === 'orcaclub' ? 'ORCACLUB' : 'Personal'})`,
    [form.clientName, clientName, brand],
  )

  function handleOpenChange(v: boolean) {
    if (busy) return
    setOpen(v)
    if (!v) {
      setStep(1)
      setError(null)
      setDone(null)
    }
  }

  async function buildPdf(): Promise<Uint8Array> {
    const { buildPersonalNdaPdf, buildOrcaclubNdaPdf } = await import('@/lib/pdf-generators')
    return brand === 'personal' ? buildPersonalNdaPdf(form) : buildOrcaclubNdaPdf(form)
  }

  async function handleDownload() {
    setBusy('download')
    setError(null)
    try {
      const bytes = await buildPdf()
      // `bytes.buffer` is an ArrayBufferLike; copy through a fresh Uint8Array so
      // the Blob gets a plain ArrayBuffer regardless of the backing store.
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `NDA_${(form.clientName || clientName).replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[GenerateNdaModal] download', err)
      setError('Could not build the PDF.')
    } finally {
      setBusy(null)
    }
  }

  /** Files the NDA against this client and returns its id, or null on failure. */
  async function saveDocument(): Promise<string | null> {
    const result = await createDocument({
      name: docName,
      description: `Mutual NDA for ${form.clientName || clientName}`,
      documentTemplate: 'nda',
      documentBrand: brand,
      documentData: form,
      clientAccountId: clientId,
    })
    if (!result.success || !result.id) {
      setError(result.error ?? 'Could not save the document.')
      return null
    }
    return result.id
  }

  async function handleSave() {
    setBusy('save')
    setError(null)
    const id = await saveDocument()
    setBusy(null)
    if (id) {
      setDone('Saved to Files.')
      router.refresh()
    }
  }

  async function handleSend() {
    if (!to.trim()) {
      setError('Add an email address to send to.')
      return
    }
    setBusy('send')
    setError(null)
    const id = await saveDocument()
    if (!id) {
      setBusy(null)
      return
    }
    const sent = await sendDocumentEmail(
      id,
      [{ email: to.trim(), name: form.clientSignerName || form.clientName }],
      'Attached is the mutual NDA covering our work together — it sets out how account access, credentials, and data are handled on both sides. Review it, and send it back signed when you are ready.',
    )
    setBusy(null)
    if (sent.success) {
      setDone(`Saved and sent to ${to.trim()}.`)
      router.refresh()
    } else {
      setError(sent.error ?? 'Saved, but the email did not go out.')
    }
  }

  const canAdvance = step !== 1 || form.clientName.trim().length > 0

  return (
    <>
      {variant === 'quiet' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          // Inline size: `.space-true-scale :is(button)` is unlayered CSS and so
          // outranks any Tailwind text-* utility on a button inside the subtree.
          style={{ fontSize: 13 }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--space-border-hard)] px-3 py-1.5 text-[var(--space-text-tertiary)] transition-colors duration-150 hover:bg-[var(--space-bg-card)] hover:text-[var(--space-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--space-accent)]"
        >
          <FileSignature className="size-[13px]" aria-hidden="true" />
          Generate NDA
        </button>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="gap-2 bg-[var(--space-accent)] font-semibold text-black hover:bg-[var(--space-accent)]/90"
        >
          <FileSignature className="size-4" />
          Generate NDA
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="gap-0 overflow-hidden border border-[var(--space-border-hard)] bg-[var(--space-bg-base)] p-0 text-[var(--space-text-primary)] sm:max-w-[38rem]">
          <DialogTitle className="sr-only">Generate NDA</DialogTitle>

          {done ? (
            <div className="flex flex-col items-center justify-center gap-5 px-8 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                <Check className="size-8 text-emerald-400" strokeWidth={2.5} />
              </div>
              <div>
                <p className="mb-1 text-xl font-bold text-[var(--space-text-primary)]">NDA ready</p>
                <p className="text-sm text-[var(--space-text-secondary)]">{done}</p>
              </div>
              <Button
                onClick={() => handleOpenChange(false)}
                className="mt-2 bg-[var(--space-accent)] font-semibold text-black hover:bg-[var(--space-accent)]/90"
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* ── Stage indicator ── */}
              <div className="border-b border-[var(--space-border-hard)] px-8 pb-6 pt-8">
                <div className="flex items-center">
                  {STEPS.map((s, i) => {
                    const current = step === s.num
                    const past = step > s.num
                    const Icon = s.icon
                    return (
                      <div key={s.num} className="flex items-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div
                            className="flex size-9 items-center justify-center rounded-xl border transition-all duration-300"
                            style={{
                              background: current || past ? 'rgba(139,156,182,0.06)' : 'rgba(255,255,255,0.02)',
                              borderColor: current || past ? 'rgba(139,156,182,0.15)' : 'var(--space-border-hard)',
                            }}
                          >
                            {past ? (
                              <Check className="size-4" style={{ color: 'var(--space-accent)' }} strokeWidth={2.5} />
                            ) : (
                              <Icon
                                className={`size-4 ${current ? '' : 'text-[var(--space-text-muted)]'}`}
                                style={current ? { color: 'var(--space-accent)' } : undefined}
                              />
                            )}
                          </div>
                          <span
                            className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--space-text-muted)]"
                            style={current ? { color: 'var(--space-accent)' } : undefined}
                          >
                            {s.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div
                            className="mx-3 mb-5 h-px w-12 transition-all duration-300"
                            style={{ background: past ? 'rgba(139,156,182,0.20)' : 'var(--space-divider)' }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="max-h-[60vh] min-h-[20rem] overflow-y-auto px-8 py-7">

                {/* ── 1. Parties ── */}
                {step === 1 && (
                  <div className="space-y-5 duration-300 animate-in fade-in-0 slide-in-from-bottom-2">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">Step 1</p>
                      <h3 className="text-xl font-bold text-[var(--space-text-primary)]">Who is bound?</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(['orcaclub', 'personal'] as const).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBrand(b)}
                          // Inline: the accent token is not a Tailwind colour, and
                          // `.space-true-scale :is(button)` outranks text-* utilities.
                          style={{
                            fontSize: 13,
                            borderColor: brand === b ? 'var(--space-accent)' : 'var(--space-border-hard)',
                            background: brand === b ? 'rgba(139,156,182,0.06)' : 'transparent',
                          }}
                          className="rounded-lg border px-3 py-2.5 text-left transition-colors"
                        >
                          <span className="block font-medium text-[var(--space-text-primary)]">
                            {b === 'orcaclub' ? 'ORCACLUB' : 'Chance Noonan'}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-[var(--space-text-tertiary)]">
                            {b === 'orcaclub' ? BRAND_TAGLINE : 'Personal name, employer firewall'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <Field label="Legal form of the signing entity" hint="optional">
                      <Input
                        value={form.providerEntity ?? ''}
                        onChange={(e) => set('providerEntity', e.target.value)}
                        placeholder={
                          brand === 'orcaclub'
                            ? 'e.g. a California limited liability company'
                            : 'e.g. an individual doing business as ORCACLUB'
                        }
                        className={inputCx}
                      />
                      {/* The trade description always prints; this names the entity
                          actually bound, which the description alone does not. */}
                      <p className="text-[12px] leading-snug text-[var(--space-text-muted)]">
                        {brand === 'orcaclub'
                          ? `Blank prints “ORCACLUB, ${BRAND_LEGAL_DESCRIPTION}.”`
                          : 'Blank prints “Chance Noonan, an individual doing business as an independent freelance consultant.”'}
                      </p>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Client legal name">
                        <Input
                          value={form.clientName}
                          onChange={(e) => set('clientName', e.target.value)}
                          placeholder="e.g. Acme Corp"
                          className={inputCx}
                          autoFocus
                        />
                      </Field>
                      <Field label="Client legal description" hint="optional">
                        <Input
                          value={form.clientEntity ?? ''}
                          onChange={(e) => set('clientEntity', e.target.value)}
                          placeholder="e.g. a Delaware corporation"
                          className={inputCx}
                        />
                      </Field>
                    </div>

                    <Field label="Client address">
                      <Input
                        value={form.clientAddress}
                        onChange={(e) => set('clientAddress', e.target.value)}
                        placeholder="Street, City, State, ZIP"
                        className={inputCx}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Signs for client" hint="optional">
                        <Input
                          value={form.clientSignerName ?? ''}
                          onChange={(e) => set('clientSignerName', e.target.value)}
                          placeholder="e.g. Jane Smith"
                          className={inputCx}
                        />
                      </Field>
                      <Field label="Title" hint="optional">
                        <Input
                          value={form.clientSignerTitle ?? ''}
                          onChange={(e) => set('clientSignerTitle', e.target.value)}
                          placeholder="e.g. Founder"
                          className={inputCx}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Client notice email">
                        <Input
                          type="email"
                          value={form.clientEmail ?? ''}
                          onChange={(e) => set('clientEmail', e.target.value)}
                          placeholder="client@example.com"
                          className={inputCx}
                        />
                      </Field>
                      <Field label="Effective date">
                        <Input
                          type="date"
                          value={form.effectiveDate}
                          onChange={(e) => set('effectiveDate', e.target.value)}
                          className={`${inputCx} [color-scheme:light]`}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {/* ── 2. Protections ── */}
                {step === 2 && (
                  <div className="space-y-5 duration-300 animate-in fade-in-0 slide-in-from-bottom-2">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">Step 2</p>
                      <h3 className="text-xl font-bold text-[var(--space-text-primary)]">What does it promise?</h3>
                      <p className="mt-1 text-[13px] text-[var(--space-text-tertiary)]">
                        Everything below prints by default. Switching one off removes its section and renumbers the rest.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Toggle
                        checked={form.includeAccessSection !== false}
                        onChange={(v) => set('includeAccessSection', v)}
                        title="Access to systems, accounts, and assets"
                        note="Least privilege, credential handling, no lock-out, change control, off-boarding. This is the section that answers “what will you do with my logins?”"
                      />
                      <Toggle
                        checked={form.includePersonalData !== false}
                        onChange={(v) => set('includePersonalData', v)}
                        title="Personal data handling"
                        note="Service-provider undertakings under CCPA/CPRA — no selling, no combining with other clients' data, subprocessors bound."
                      />
                      <Toggle
                        checked={form.includeAiClause !== false}
                        onChange={(v) => set('includeAiClause', v)}
                        title="AI and machine learning tools"
                        note="Neither side feeds the other's confidential information to a tool that trains on it."
                      />
                      <Toggle
                        checked={form.includeDtsaNotice !== false}
                        onChange={(v) => set('includeDtsaNotice', v)}
                        title="Whistleblower immunity notice (18 U.S.C. § 1833(b))"
                        note="Federal law requires this notice in any agreement restricting trade-secret use. Leaving it out forfeits exemplary damages and attorneys' fees in a trade-secret claim."
                      />
                      <Toggle
                        checked={form.includeNonSolicit === true}
                        onChange={(v) => set('includeNonSolicit', v)}
                        title="Mutual non-solicitation of personnel"
                        note="Off by default — employee non-solicits are narrowly enforced in California."
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Term" hint="years">
                        <Input
                          value={form.termYears ?? ''}
                          onChange={(e) => set('termYears', e.target.value)}
                          placeholder="3"
                          className={inputCx}
                        />
                      </Field>
                      <Field label="Breach notice" hint="hours">
                        <Input
                          value={form.breachNoticeHours ?? ''}
                          onChange={(e) => set('breachNoticeHours', e.target.value)}
                          placeholder="72"
                          className={inputCx}
                        />
                      </Field>
                      <Field label="Off-board" hint="days">
                        <Input
                          value={form.offboardDays ?? ''}
                          onChange={(e) => set('offboardDays', e.target.value)}
                          placeholder="10"
                          className={inputCx}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Governing law" hint="state">
                        <Input
                          value={form.governingState ?? ''}
                          onChange={(e) => set('governingState', e.target.value)}
                          placeholder="California"
                          className={inputCx}
                        />
                      </Field>
                      <Field label="Venue" hint="county">
                        <Input
                          value={form.venueCounty ?? ''}
                          onChange={(e) => set('venueCounty', e.target.value)}
                          placeholder="Orange"
                          className={inputCx}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {/* ── 3. Deliver ── */}
                {step === 3 && (
                  <div className="space-y-5 duration-300 animate-in fade-in-0 slide-in-from-bottom-2">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--space-text-muted)]">Step 3</p>
                      <h3 className="text-xl font-bold text-[var(--space-text-primary)]">Send it out</h3>
                    </div>

                    <div className="rounded-lg border border-[var(--space-border-hard)] bg-[var(--space-bg-card)] px-4 py-3">
                      <p className="text-[13px] font-medium text-[var(--space-text-primary)]">{docName}</p>
                      <p className="mt-1 text-[12px] text-[var(--space-text-tertiary)]">
                        Mutual NDA · {form.termYears || '3'}-year term ·{' '}
                        {[
                          form.includeAccessSection !== false && 'systems access',
                          form.includePersonalData !== false && 'personal data',
                          form.includeAiClause !== false && 'AI tools',
                        ].filter(Boolean).join(', ') || 'confidentiality only'}
                      </p>
                    </div>

                    <Field label="Send to" hint="saves to Files first">
                      <Input
                        type="email"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="client@example.com"
                        className={inputCx}
                        list="nda-recipients"
                      />
                    </Field>
                    {recipients.length > 0 && (
                      <datalist id="nda-recipients">
                        {recipients.map((r) => (
                          <option key={r.id} value={r.email}>{r.name}</option>
                        ))}
                      </datalist>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={handleDownload}
                        disabled={busy !== null}
                        className="gap-2 border-[var(--space-border-hard)] bg-transparent text-[var(--space-text-secondary)] hover:bg-[var(--space-bg-card-hover)] hover:text-[var(--space-text-primary)]"
                      >
                        {busy === 'download' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSave}
                        disabled={busy !== null}
                        className="gap-2 border-[var(--space-border-hard)] bg-transparent text-[var(--space-text-secondary)] hover:bg-[var(--space-bg-card-hover)] hover:text-[var(--space-text-primary)]"
                      >
                        {busy === 'save' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Save to Files
                      </Button>
                      <Button
                        onClick={handleSend}
                        disabled={busy !== null}
                        className="gap-2 bg-[var(--space-accent)] font-semibold text-black hover:bg-[var(--space-accent)]/90"
                      >
                        {busy === 'send' ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                        Save and email
                      </Button>
                    </div>

                    <p className="text-[12px] leading-relaxed text-[var(--space-text-muted)]">
                      Generated for signature, not legal advice. Have counsel review the standing template once
                      before it goes out to clients.
                    </p>
                  </div>
                )}

                {error && (
                  <p className="mt-4 text-[13px] text-red-400">{error}</p>
                )}
              </div>

              {/* ── Footer nav ── */}
              <div className="flex items-center justify-between border-t border-[var(--space-border-hard)] px-8 py-5">
                <button
                  type="button"
                  onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
                  disabled={step === 1 || busy !== null}
                  style={{ fontSize: 13 }}
                  className="inline-flex items-center gap-1.5 text-[var(--space-text-tertiary)] transition-colors hover:text-[var(--space-text-primary)] disabled:opacity-0"
                >
                  <ArrowLeft className="size-[13px]" />
                  Back
                </button>

                {step < 3 ? (
                  <Button
                    onClick={() => setStep((s) => ((s + 1) as Step))}
                    disabled={!canAdvance}
                    className="gap-2 bg-[var(--space-accent)] font-semibold text-black hover:bg-[var(--space-accent)]/90"
                  >
                    Continue
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <span className="text-[12px] text-[var(--space-text-muted)]">
                    {form.clientName || clientName}
                  </span>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
