'use client'

import { useMemo, useState } from 'react'
import { Check, Download, Loader2, Mail, ShieldAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { generateW9, sendW9 } from '@/actions/w9'
import { W9_REVISION, type W9Classification, type W9FormData } from '@/lib/forms/w9-types'

// ─── Form W-9 composer ────────────────────────────────────────────────────────
// A W-9 is furnished by the payee to the payer. Clients pay ORCACLUB, so this
// composes ORCACLUB's OWN form for a client who has asked for one — the only
// thing read from the client record is the optional requester box.
//
// Nothing here is remembered. The taxpayer identification number is typed each
// time and lives only in this component's state and the request that builds the
// PDF: no draft is saved, no document is filed, and the state — TIN included —
// dies with the component when the host modal closes or steps away.
//
// Rendered as a panel inside PackageDocumentsModal, alongside the proposal,
// invoice, and SOW — every document a package can produce lives in one place.

const CLASSIFICATIONS: Array<{ value: W9Classification; label: string }> = [
  { value: 'individual', label: 'Individual / sole proprietor' },
  { value: 'c-corp', label: 'C corporation' },
  { value: 's-corp', label: 'S corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'trust-estate', label: 'Trust / estate' },
  { value: 'llc', label: 'Limited liability company' },
  { value: 'other', label: 'Other' },
]

const inputCls =
  'h-9 bg-[var(--space-bg-card-hover)] border-[var(--space-border-hard)] text-[var(--space-text-primary)] ' +
  'placeholder:text-[var(--space-text-muted)] focus-visible:ring-[var(--space-accent)]/30 text-sm'

const labelCls = 'text-[0.625rem] font-semibold uppercase tracking-widest text-[var(--space-text-muted)]'

const selectCls =
  'w-full h-9 px-2 text-sm rounded-md bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] ' +
  'text-[var(--space-text-primary)] focus:outline-none focus:border-[rgba(139,156,182,0.25)]'

export interface W9Recipient {
  id: string
  name: string
  email: string
}

export interface W9ComposerProps {
  /** Who asked for the form — fills the optional requester box. */
  clientName: string
  clientCompany?: string | null
  clientAddress?: {
    line1?: string | null
    line2?: string | null
    city?: string | null
    state?: string | null
    zip?: string | null
  } | null
  /** Client-side users on the account, offered as recipients. */
  recipients?: W9Recipient[]
  /** Prefills line 7 so the requester can file it against the right engagement. */
  accountReference?: string
  /** Defaults the signature to whoever is signing. */
  signerName?: string
}

/** "Acme Co.\n12 Main St, Suite 4\nIrvine, CA 92614" — the requester box. */
function requesterBlock(props: W9ComposerProps): string {
  const a = props.clientAddress
  const street = [a?.line1, a?.line2].filter(Boolean).join(', ')
  const region = [a?.city, [a?.state, a?.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return [props.clientCompany || props.clientName, street, region].filter(Boolean).join('\n')
}

type Outcome = { ok: true; note: string } | { ok: false; note: string }

export function W9Composer(props: W9ComposerProps) {
  const { recipients = [], accountReference, signerName } = props

  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [classification, setClassification] = useState<W9Classification>('llc')
  const [llcTaxClass, setLlcTaxClass] = useState<'C' | 'S' | 'P'>('S')
  const [otherDescription, setOtherDescription] = useState('')
  const [foreignPartners, setForeignPartners] = useState(false)
  const [address, setAddress] = useState('')
  const [cityStateZip, setCityStateZip] = useState('')
  const [exemptPayeeCode, setExemptPayeeCode] = useState('')
  const [fatcaCode, setFatcaCode] = useState('')
  const [tinType, setTinType] = useState<'ein' | 'ssn'>('ein')
  const [tin, setTin] = useState('')
  const [requester, setRequester] = useState(() => requesterBlock(props))
  const [accountNumbers, setAccountNumbers] = useState(accountReference ?? '')
  const [sign, setSign] = useState(true)
  const [signatureName, setSignatureName] = useState(signerName ?? '')
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(recipients.map(r => r.id)))
  const [message, setMessage] = useState('')

  const [busy, setBusy] = useState<'save' | 'send' | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const tinDigits = tin.replace(/\D/g, '')

  const formData = useMemo<W9FormData>(() => ({
    name,
    businessName: businessName || undefined,
    classification,
    ...(classification === 'llc' ? { llcTaxClass } : {}),
    ...(classification === 'other' ? { otherDescription } : {}),
    foreignPartners,
    exemptPayeeCode: exemptPayeeCode || undefined,
    fatcaCode: fatcaCode || undefined,
    address,
    cityStateZip,
    requester: requester || undefined,
    accountNumbers: accountNumbers || undefined,
    tinType,
    tin,
    signature: sign ? { name: signatureName, date: new Date() } : null,
  }), [
    name, businessName, classification, llcTaxClass, otherDescription, foreignPartners,
    exemptPayeeCode, fatcaCode, address, cityStateZip, requester, accountNumbers,
    tinType, tin, sign, signatureName,
  ])

  const ready =
    name.trim().length > 0 &&
    address.trim().length > 0 &&
    cityStateZip.trim().length > 0 &&
    tinDigits.length === 9 &&
    (classification !== 'llc' || !!llcTaxClass) &&
    (classification !== 'other' || otherDescription.trim().length > 0) &&
    (!sign || signatureName.trim().length > 0)

  const handleSave = async () => {
    setBusy('save')
    setOutcome(null)
    const result = await generateW9(formData)
    setBusy(null)
    if (!result.success || !result.pdfBase64 || !result.filename) {
      setOutcome({ ok: false, note: result.error ?? 'Could not build the form.' })
      return
    }
    // Handed straight to the browser's own save dialog — the file is never
    // written to the server and never uploaded anywhere.
    const blob = new Blob(
      [Uint8Array.from(atob(result.pdfBase64), c => c.charCodeAt(0))],
      { type: 'application/pdf' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    a.click()
    URL.revokeObjectURL(url)
    setOutcome({ ok: true, note: `Saved ${result.filename}.` })
  }

  const handleSend = async () => {
    const picked = recipients.filter(r => chosen.has(r.id)).map(r => ({ email: r.email, name: r.name }))
    if (picked.length === 0) {
      setOutcome({ ok: false, note: 'Choose who the form goes to.' })
      return
    }
    setBusy('send')
    setOutcome(null)
    const result = await sendW9(formData, picked, message || undefined)
    setBusy(null)
    if (!result.success) {
      setOutcome({ ok: false, note: result.error ?? 'Could not send the form.' })
      return
    }
    setOutcome({
      ok: true,
      note: result.error
        ?? `Sent to ${result.sent} ${result.sent === 1 ? 'recipient' : 'recipients'}.`,
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-[var(--space-text-tertiary)]">
        Your completed W-9 for {props.clientName} to keep on file — the IRS form,
        {' '}{W9_REVISION}, filled and flattened.
      </p>

      {/* ── Your details ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <Label className={labelCls}>Name on your tax return (line 1)</Label>
          <Input value={name} onChange={e => setName(e.target.value)}
            placeholder="Legal name of the entity or individual" className={cn(inputCls, 'mt-1')} />
        </div>
        <div>
          <Label className={labelCls}>Business name, if different (line 2)</Label>
          <Input value={businessName} onChange={e => setBusinessName(e.target.value)}
            placeholder="Trade or disregarded entity name" className={cn(inputCls, 'mt-1')} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className={labelCls}>Federal tax classification (line 3a)</Label>
            <select
              value={classification}
              onChange={e => setClassification(e.target.value as W9Classification)}
              className={cn(selectCls, 'mt-1')}
            >
              {CLASSIFICATIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {classification === 'llc' && (
            <div>
              <Label className={labelCls}>LLC tax classification</Label>
              <select
                value={llcTaxClass}
                onChange={e => setLlcTaxClass(e.target.value as 'C' | 'S' | 'P')}
                className={cn(selectCls, 'mt-1')}
              >
                <option value="C">C — C corporation</option>
                <option value="S">S — S corporation</option>
                <option value="P">P — Partnership</option>
              </select>
            </div>
          )}
          {classification === 'other' && (
            <div>
              <Label className={labelCls}>Describe it</Label>
              <Input value={otherDescription} onChange={e => setOtherDescription(e.target.value)}
                placeholder="As it should print on the form" className={cn(inputCls, 'mt-1')} />
            </div>
          )}
        </div>

        <div>
          <Label className={labelCls}>Address (line 5)</Label>
          <Input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Number, street, and apt or suite no." className={cn(inputCls, 'mt-1')} />
        </div>
        <div>
          <Label className={labelCls}>City, state, ZIP (line 6)</Label>
          <Input value={cityStateZip} onChange={e => setCityStateZip(e.target.value)}
            placeholder="Irvine, CA 92614" className={cn(inputCls, 'mt-1')} />
        </div>
      </div>

      {/* ── TIN ──────────────────────────────────────────────────────── */}
      <div className="space-y-2 rounded-lg border border-[var(--space-border-hard)] p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[auto_1fr]">
          <div>
            <Label className={labelCls}>Number type</Label>
            <select value={tinType} onChange={e => setTinType(e.target.value as 'ein' | 'ssn')}
              className={cn(selectCls, 'mt-1')}>
              <option value="ein">EIN</option>
              <option value="ssn">SSN</option>
            </select>
          </div>
          <div>
            <Label className={labelCls}>{tinType === 'ein' ? 'Employer identification number' : 'Social security number'}</Label>
            <Input
              value={tin}
              onChange={e => setTin(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              placeholder={tinType === 'ein' ? '12-3456789' : '123-45-6789'}
              className={cn(inputCls, 'mt-1 font-mono tabular-nums')}
            />
          </div>
        </div>
        <p className="flex items-start gap-1.5 text-[0.625rem] leading-relaxed text-[var(--space-text-muted)]">
          <ShieldAlert className="mt-px size-3 shrink-0" aria-hidden="true" />
          Typed each time and never stored. It goes to the server only to build the PDF,
          is not written to the database, and is cleared when this closes.
        </p>
      </div>

      {/* ── Requester and reference ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className={labelCls}>Requester (optional)</Label>
          <textarea
            value={requester}
            onChange={e => setRequester(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-none rounded-md border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-2 py-1.5 text-sm text-[var(--space-text-primary)] focus:border-[rgba(139,156,182,0.25)] focus:outline-none"
          />
        </div>
        <div className="space-y-3">
          <div>
            <Label className={labelCls}>Account numbers (line 7, optional)</Label>
            <Input value={accountNumbers} onChange={e => setAccountNumbers(e.target.value)}
              className={cn(inputCls, 'mt-1')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className={labelCls}>Exempt payee code</Label>
              <Input value={exemptPayeeCode} onChange={e => setExemptPayeeCode(e.target.value)}
                className={cn(inputCls, 'mt-1')} />
            </div>
            <div>
              <Label className={labelCls}>FATCA code</Label>
              <Input value={fatcaCode} onChange={e => setFatcaCode(e.target.value)}
                className={cn(inputCls, 'mt-1')} />
            </div>
          </div>
        </div>
      </div>

      {/* Line 3b only applies to the flow-through classifications. */}
      {(classification === 'partnership' || classification === 'trust-estate'
        || (classification === 'llc' && llcTaxClass === 'P')) && (
        <label className="flex items-start gap-2 text-xs text-[var(--space-text-tertiary)]">
          <input type="checkbox" checked={foreignPartners}
            onChange={e => setForeignPartners(e.target.checked)} className="mt-0.5" />
          <span>
            Line 3b — this form goes to a partnership, trust, or estate in which you hold an
            interest, and you have foreign partners, owners, or beneficiaries.
          </span>
        </label>
      )}

      {/* ── Sign ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-[var(--space-text-tertiary)]">
          <input type="checkbox" checked={sign} onChange={e => setSign(e.target.checked)} />
          Sign it now — your name is typed on the certification line and dated today
        </label>
        {sign && (
          <Input value={signatureName} onChange={e => setSignatureName(e.target.value)}
            placeholder="Name of the person signing" className={inputCls} />
        )}
        {!sign && (
          <p className="text-[0.625rem] text-[var(--space-text-muted)]">
            Part II will be left blank for a handwritten signature.
          </p>
        )}
      </div>

      {/* ── Deliver ──────────────────────────────────────────────────── */}
      <div className="space-y-3 border-t border-[var(--space-border-hard)] pt-4">
        {recipients.length > 0 && (
          <div className="space-y-1.5">
            <Label className={labelCls}>Send to</Label>
            {recipients.map(r => (
              <label key={r.id} className="flex items-center gap-2 text-xs text-[var(--space-text-tertiary)]">
                <input
                  type="checkbox"
                  checked={chosen.has(r.id)}
                  onChange={e => setChosen(prev => {
                    const next = new Set(prev)
                    if (e.target.checked) next.add(r.id); else next.delete(r.id)
                    return next
                  })}
                />
                {r.name} <span className="text-[var(--space-text-muted)]">{r.email}</span>
              </label>
            ))}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={2}
              placeholder="Note to include (optional)"
              className="mt-1 w-full resize-none rounded-md border border-[var(--space-border-hard)] bg-[var(--space-bg-card-hover)] px-2 py-1.5 text-sm text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] focus:border-[rgba(139,156,182,0.25)] focus:outline-none"
            />
          </div>
        )}

        {outcome && (
          <p className={cn('text-xs', outcome.ok ? 'text-emerald-400' : 'text-red-400')}>
            {outcome.ok && <Check className="mr-1 inline size-3" />}
            {outcome.note}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!ready || busy !== null}
            className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--space-border-hard)] px-3 py-2 text-xs font-medium text-[var(--space-text-tertiary)] transition-all hover:bg-[var(--space-bg-card-hover)] hover:text-[var(--space-text-primary)] disabled:opacity-40"
          >
            {busy === 'save' ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Save PDF
          </button>
          {recipients.length > 0 && (
            <button
              type="button"
              onClick={handleSend}
              disabled={!ready || busy !== null || chosen.size === 0}
              className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[rgba(139,156,182,0.18)] bg-[rgba(139,156,182,0.06)] px-3 py-2 text-xs font-semibold transition-all hover:bg-[rgba(139,156,182,0.10)] disabled:opacity-40"
              style={{ color: 'var(--space-accent)' }}
            >
              {busy === 'send' ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
              {busy === 'send' ? 'Sending…' : 'Send W-9'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
