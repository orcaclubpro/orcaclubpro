import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Cinzel_Decorative, Dancing_Script } from 'next/font/google'
import { PackageActions } from './PackageActions'
import { ScrollToTop } from './ScrollToTop'
import { SERVICE_AGREEMENT_TERMS } from '@/lib/contract-terms'

const gothic = Cinzel_Decorative({ weight: '700', subsets: ['latin'] })
const sigFont = Dancing_Script({ weight: '700', subsets: ['latin'] })

interface LineItem {
  id?: string
  name: string
  description?: string | null
  price: number
  adjustedPrice?: number | null
  quantity?: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

interface ScheduledEntry {
  id?: string
  label: string
  amount: number
  dueDate?: string | null
  orderId?: string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

/** Parse YYYY-MM-DD as a local date to avoid UTC-shift display issues. */
function fmtScheduleDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const parts = iso.split('T')[0].split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return '—'
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  if (!isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export default async function PackagePrintPage({
  params,
}: {
  params: Promise<{ username: string; package: string }>
}) {
  const { username, package: packageId } = await params
  const user = await getCurrentUser()

  if (!user) redirect(`/login?callbackUrl=/u/${username}/packages/${packageId}/print`)
  if (user.username !== username && user.role === 'client') redirect(`/u/${user.username}`)

  const payload = await getPayload({ config })

  let pkg: any
  try {
    pkg = await payload.findByID({ collection: 'packages', id: packageId, depth: 1 })
  } catch {
    notFound()
  }
  if (!pkg) notFound()

  if (user.role === 'client') {
    const clientAccountId =
      typeof user.clientAccount === 'string' ? user.clientAccount : (user.clientAccount as any)?.id
    const pkgClientId =
      typeof pkg.clientAccount === 'string' ? pkg.clientAccount : pkg.clientAccount?.id
    if (pkg.type !== 'proposal' || pkgClientId !== clientAccountId) notFound()
  }

  const lineItems: LineItem[] = pkg.lineItems ?? []
  const paymentSchedule: ScheduledEntry[] = pkg.paymentSchedule ?? []
  const isDeveloper = user.role === 'admin' || user.role === 'user'

  let oneTime = 0, monthly = 0, annual = 0
  for (const item of lineItems) {
    const qty = item.quantity ?? 1
    const total = (item.adjustedPrice ?? item.price ?? 0) * qty
    if (item.isRecurring) {
      item.recurringInterval === 'year' ? (annual += total) : (monthly += total)
    } else {
      oneTime += total
    }
  }

  const clientAccount = pkg.clientAccount
  const clientName    = clientAccount && typeof clientAccount === 'object' ? clientAccount.name    ?? '' : ''
  const clientCompany = clientAccount && typeof clientAccount === 'object' ? clientAccount.company ?? '' : ''
  const clientEmail   = clientAccount && typeof clientAccount === 'object' ? (clientAccount as any).email   ?? '' : ''
  const clientPhone   = clientAccount && typeof clientAccount === 'object' ? (clientAccount as any).phone   ?? '' : ''
  const clientAddress = clientAccount && typeof clientAccount === 'object' ? (clientAccount as any).address ?? null : null

  // Signature data
  const clientSig     = (pkg as any).clientSignature ?? null
  const orcaclubSig   = (pkg as any).orcaclubSignature ?? null
  const isSigned      = !!clientSig?.signedAt

  const proposalDate = new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(pkg.createdAt))

  // Short reference like INV-A3F2
  const ref = `PKG-${packageId.slice(-6).toUpperCase()}`

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#111' }}>
      <ScrollToTop />
      <PackageActions />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '56px 48px 64px' }}>

        {/* ── HEADER ─────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <span className={gothic.className} style={{ fontSize: 18, color: '#111', letterSpacing: '0.04em' }}>
              ORCACLUB
            </span>
            <p style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 3 }}>
              Technical Operations Development Studio
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Proposal</p>
            <p style={{ fontSize: 13, color: '#111', fontWeight: 600, marginTop: 2 }}>{ref}</p>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{proposalDate}</p>
          </div>
        </div>

        {/* ── DIVIDER ─────────────────────────────── */}
        <div style={{ height: 1, background: '#e5e7eb', marginBottom: 32 }} />

        {/* ── BILL TO / PACKAGE NAME ──────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
          {(clientName || clientCompany || clientEmail || clientPhone || clientAddress) && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>Bill To</p>
              {clientName && <p style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{clientName}</p>}
              {clientCompany && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{clientCompany}</p>}
              {clientAddress?.line1 && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{clientAddress.line1}</p>}
              {clientAddress?.line2 && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{clientAddress.line2}</p>}
              {(clientAddress?.city || clientAddress?.state || clientAddress?.zip) && (
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
                  {[clientAddress.city, clientAddress.state, clientAddress.zip].filter(Boolean).join(', ')}
                </p>
              )}
              {clientPhone && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{clientPhone}</p>}
              {clientEmail && (
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  <a href={`mailto:${clientEmail}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{clientEmail}</a>
                </p>
              )}
            </div>
          )}
          <div style={{ textAlign: (clientName || clientCompany || clientEmail || clientPhone || clientAddress) ? 'right' : 'left' }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>{pkg.name}</p>
            {pkg.description && (
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4, maxWidth: 280, lineHeight: 1.5, textAlign: clientName || clientCompany ? 'right' : 'left' }}>
                {pkg.description}
              </p>
            )}
          </div>
        </div>

        {/* ── COVER MESSAGE ────────────────────────── */}
        {pkg.coverMessage && (
          <div style={{ marginBottom: 32, padding: '16px 20px', background: '#f9fafb', borderRadius: 8, borderLeft: '3px solid #1E3A6E' }}>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{pkg.coverMessage}</p>
          </div>
        )}

        {/* ── LINE ITEMS TABLE ─────────────────────── */}
        {lineItems.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px', gap: 8, padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px 6px 0 0' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Item</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Qty</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Rate</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Amount</p>
            </div>

            {/* Rows */}
            {lineItems.map((item, i) => {
              const qty = item.quantity ?? 1
              const baseRate = item.price ?? 0
              const unitRate = item.adjustedPrice ?? baseRate
              const total = unitRate * qty
              const baseTotal = baseRate * qty
              const isDiscounted = item.adjustedPrice != null && item.adjustedPrice !== baseRate
              const isLast = i === lineItems.length - 1
              return (
                <div
                  key={item.id ?? i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 90px 90px',
                    gap: 8,
                    padding: '12px 12px',
                    borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                    alignItems: 'start',
                    background: isDiscounted ? '#f0fdff' : 'transparent',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>{item.name}</p>
                      {isDiscounted && (
                        <span style={{
                          fontSize: 8, fontWeight: 700, color: '#0891b2',
                          textTransform: 'uppercase', letterSpacing: '0.12em',
                          background: '#cffafe', padding: '2px 5px', borderRadius: 3,
                          border: '1px solid #a5f3fc',
                        }}>
                          Discounted
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{item.description}</p>
                    )}
                    {item.isRecurring && (
                      <span style={{
                        display: 'inline-block', marginTop: 4,
                        fontSize: 9, fontWeight: 600, color: '#0891b2',
                        textTransform: 'uppercase', letterSpacing: '0.12em',
                        background: '#ecfeff', padding: '2px 6px', borderRadius: 4,
                      }}>
                        {item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', paddingTop: 1 }}>{qty}</p>
                  {/* Rate */}
                  <div style={{ textAlign: 'right', paddingTop: 1 }}>
                    {isDiscounted && (
                      <p style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
                        {fmt(baseRate)}
                      </p>
                    )}
                    <p style={{ fontSize: 13, color: isDiscounted ? '#0891b2' : '#6b7280', fontVariantNumeric: 'tabular-nums', fontWeight: isDiscounted ? 600 : 400 }}>
                      {fmt(unitRate)}
                    </p>
                  </div>
                  {/* Amount */}
                  <div style={{ textAlign: 'right', paddingTop: 1 }}>
                    {isDiscounted && (
                      <p style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
                        {fmt(baseTotal)}
                        {item.isRecurring && <span style={{ fontSize: 9 }}>/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>}
                      </p>
                    )}
                    <p style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isDiscounted ? '#0891b2' : '#111' }}>
                      {fmt(total)}
                      {item.isRecurring && (
                        <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af' }}>/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Border under last row */}
            <div style={{ height: 1, background: '#e5e7eb' }} />
          </div>
        )}

        {/* ── TOTALS ───────────────────────────────── */}
        {(oneTime > 0 || monthly > 0 || annual > 0) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
            <div style={{ width: 240, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
              {oneTime > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>Subtotal (one-time)</span>
                  <span style={{ fontWeight: 600, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{fmt(oneTime)}</span>
                </div>
              )}
              {monthly > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>Monthly recurring</span>
                  <span style={{ fontWeight: 600, color: '#0891b2', fontVariantNumeric: 'tabular-nums' }}>{fmt(monthly)}<span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af' }}>/mo</span></span>
                </div>
              )}
              {annual > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>Annual recurring</span>
                  <span style={{ fontWeight: 600, color: '#0891b2', fontVariantNumeric: 'tabular-nums' }}>{fmt(annual)}<span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af' }}>/yr</span></span>
                </div>
              )}
              {oneTime > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4, borderTop: '1px solid #e5e7eb', fontSize: 14 }}>
                  <span style={{ fontWeight: 700, color: '#111' }}>Total due</span>
                  <span style={{ fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{fmt(oneTime)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PAYMENT SCHEDULE ─────────────────────── */}
        {paymentSchedule.length > 0 ? (
          <div style={{ marginBottom: 32, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
              Payment Schedule
            </p>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 130px', gap: 8, padding: '6px 12px', background: '#f3f4f6', borderRadius: '6px 6px 0 0' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Payment</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Amount</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Due Date</p>
            </div>

            {paymentSchedule.map((entry, i) => {
              const isLast = i === paymentSchedule.length - 1
              const isInvoiced = !!entry.orderId
              return (
                <div
                  key={entry.id ?? i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 110px 130px',
                    gap: 8,
                    padding: '10px 12px',
                    borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{entry.label}</p>
                    {isInvoiced && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, color: '#059669',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        background: '#ecfdf5', padding: '2px 6px', borderRadius: 4,
                        border: '1px solid #a7f3d0',
                      }}>
                        Invoiced
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(entry.amount)}
                  </p>
                  <p style={{ fontSize: 12, color: entry.dueDate ? '#6b7280' : '#d1d5db', textAlign: 'right' }}>
                    {fmtScheduleDate(entry.dueDate)}
                  </p>
                </div>
              )
            })}

            {/* Schedule total */}
            <div style={{ height: 1, background: '#e5e7eb', marginTop: 2 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px 0', fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#111' }}>Total</span>
              <span style={{ fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(paymentSchedule.reduce((s, e) => s + (e.amount ?? 0), 0))}
              </span>
            </div>

            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, lineHeight: 1.6 }}>
              Each payment will be invoiced individually on or before its due date. You will receive a separate invoice link for each installment.
            </p>
          </div>
        ) : oneTime > 0 ? (
          <div style={{ marginBottom: 32, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>Payment Terms</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: '#f9fafb', borderRadius: 8 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 3 }}>
                  Single invoice — {fmt(oneTime)}
                </p>
                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                  A single invoice for the full amount will be issued upon project commencement. Payment is due within the timeframe specified on the invoice.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── NOTES ───────────────────────────────── */}
        {pkg.notes && (
          <div style={{ marginBottom: 32, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>Notes</p>
            <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{pkg.notes}</p>
          </div>
        )}

        {/* ── SERVICE AGREEMENT TERMS ──────────────── */}
        <div style={{ marginBottom: 32, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
            Service Agreement Terms &amp; Conditions
          </p>
          <p style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {SERVICE_AGREEMENT_TERMS}
          </p>
        </div>

        {/* ── SIGNATURE BLOCK ──────────────────────── */}
        <div style={{ marginBottom: 32, paddingTop: 20, borderTop: '2px solid #111' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 20 }}>
            Agreement Acceptance
          </p>
          <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
            By signing below, the parties agree to be bound by the terms of this Agreement.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

            {/* Client signature */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Client</p>
              {isSigned ? (
                <>
                  <p className={sigFont.className} style={{ fontSize: 26, color: '#111', borderBottom: '1px solid #111', paddingBottom: 4, marginBottom: 8, lineHeight: 1.2 }}>
                    {clientSig.typedName}
                  </p>
                  <p style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginBottom: 2 }}>{clientSig.typedName}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{clientName}{clientCompany ? ` — ${clientCompany}` : ''}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{clientSig.signedByEmail}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                    Signed: {new Date(clientSig.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}{' '}
                    at {new Date(clientSig.signedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
                  </p>
                  <p style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'monospace' }}>
                    IP: {clientSig.ipAddress}
                  </p>
                  <p style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'monospace' }}>
                    Doc hash: {clientSig.documentHash?.slice(0, 16)}...
                  </p>
                  <p style={{ fontSize: 9, color: '#9ca3af', marginTop: 4 }}>
                    ESIGN Act compliant — typed name consent
                  </p>
                </>
              ) : (
                <>
                  <div style={{ borderBottom: '1px solid #9ca3af', marginBottom: 8, height: 28 }} />
                  <p style={{ fontSize: 11, color: '#374151', fontWeight: 500, marginBottom: 2 }}>{clientName}</p>
                  {clientCompany && <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{clientCompany}</p>}
                  {clientEmail && <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{clientEmail}</p>}
                  <p style={{ fontSize: 10, color: '#d1d5db', marginTop: 8, fontStyle: 'italic' }}>Awaiting signature</p>
                </>
              )}
            </div>

            {/* ORCACLUB signature */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>ORCACLUB LLC</p>
              {orcaclubSig?.authorizedAt ? (
                <>
                  <p className={sigFont.className} style={{ fontSize: 26, color: '#111', borderBottom: '1px solid #111', paddingBottom: 4, marginBottom: 8, lineHeight: 1.2 }}>
                    {orcaclubSig.authorizedByName}
                  </p>
                  <p style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginBottom: 2 }}>{orcaclubSig.authorizedByName}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>ORCACLUB LLC</p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{orcaclubSig.authorizedByEmail}</p>
                  <p style={{ fontSize: 11, color: '#6b7280' }}>
                    Authorized: {new Date(orcaclubSig.authorizedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </>
              ) : (
                <>
                  <div style={{ borderBottom: '1px solid #9ca3af', marginBottom: 8, height: 28 }} />
                  <p style={{ fontSize: 11, color: '#374151', fontWeight: 500, marginBottom: 2 }}>ORCACLUB LLC</p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>carbon@orcaclub.pro</p>
                  <p style={{ fontSize: 10, color: '#d1d5db', marginTop: 8, fontStyle: 'italic' }}>Awaiting authorization</p>
                </>
              )}
            </div>

          </div>

          {/* Signature reference row */}
          <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 9, color: '#9ca3af' }}>
              Proposal reference: {ref} · Created: {proposalDate}
              {isSigned ? ` · Signed: ${new Date(clientSig.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
            </p>
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────── */}
        <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>orcaclub.pro</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{ref} · {proposalDate}</span>
        </div>

      </div>

      <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0;
          }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, footer, nav { display: none !important; }
        }
      `}</style>
    </div>
  )
}
