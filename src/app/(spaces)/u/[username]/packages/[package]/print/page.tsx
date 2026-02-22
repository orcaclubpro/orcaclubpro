import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Cinzel_Decorative } from 'next/font/google'
import { PackageActions } from './PackageActions'

const gothic = Cinzel_Decorative({ weight: '700', subsets: ['latin'] })

interface LineItem {
  id?: string
  name: string
  description?: string | null
  price: number
  quantity?: number
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtFull(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default async function PackagePrintPage({
  params,
}: {
  params: Promise<{ username: string; package: string }>
}) {
  const { username, package: packageId } = await params
  const user = await getCurrentUser()

  if (!user || user.username !== username) redirect('/login')

  const payload = await getPayload({ config })

  let pkg: any
  try {
    pkg = await payload.findByID({
      collection: 'packages',
      id: packageId,
      depth: 1,
    })
  } catch {
    notFound()
  }

  if (!pkg) notFound()

  if (user.role === 'client') {
    const clientAccountId =
      typeof user.clientAccount === 'string'
        ? user.clientAccount
        : (user.clientAccount as any)?.id

    const pkgClientId =
      typeof pkg.clientAccount === 'string'
        ? pkg.clientAccount
        : pkg.clientAccount?.id

    if (pkg.type !== 'proposal' || pkgClientId !== clientAccountId) {
      notFound()
    }
  }

  const lineItems: LineItem[] = pkg.lineItems ?? []
  const isStaff = user.role === 'admin' || user.role === 'user'

  let oneTime = 0
  let monthly = 0
  let annual = 0
  for (const item of lineItems) {
    const qty = item.quantity ?? 1
    const total = (item.price ?? 0) * qty
    if (item.isRecurring) {
      if (item.recurringInterval === 'year') annual += total
      else monthly += total
    } else {
      oneTime += total
    }
  }

  const clientAccount = pkg.clientAccount
  const clientName =
    clientAccount && typeof clientAccount === 'object' ? clientAccount.name ?? '' : ''
  const clientCompany =
    clientAccount && typeof clientAccount === 'object' ? clientAccount.company ?? '' : ''

  const proposalDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(pkg.createdAt))

  const hasPricing = oneTime > 0 || monthly > 0 || annual > 0

  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <PackageActions packageId={packageId} isStaff={isStaff} hasLineItems={lineItems.length > 0} />

      {/* ── DARK HEADER BAND ─────────────────────────── */}
      <div style={{ background: '#0a0a0a', padding: '36px 56px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Branding */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              {/* Cyan accent square */}
              <div style={{ width: 4, height: 32, background: '#67e8f9', borderRadius: 2, flexShrink: 0 }} />
              <span
                className={gothic.className}
                style={{ fontSize: 22, color: '#ffffff', letterSpacing: '0.04em', lineHeight: 1 }}
              >
                ORCACLUB
              </span>
            </div>
            <p style={{ fontSize: 10, color: '#67e8f9', letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 600, paddingLeft: 16 }}>
              Technical Operations Development Studio
            </p>
          </div>

          {/* Proposal badge + date */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 20,
              border: '1px solid rgba(103,232,249,0.3)',
              background: 'rgba(103,232,249,0.08)',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#67e8f9', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                Proposal
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{proposalDate}</p>
          </div>
        </div>

        {/* Client info — bottom of header band */}
        {(clientName || clientCompany) && (
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
              Prepared for
            </p>
            {clientName && (
              <p style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>{clientName}</p>
            )}
            {clientCompany && (
              <p style={{ fontSize: 13, color: '#9ca3af' }}>{clientCompany}</p>
            )}
          </div>
        )}
      </div>

      {/* ── CONTENT AREA ─────────────────────────────── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 56px 64px' }}>

        {/* Package name hero */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 10 }}>
            {pkg.name}
          </h1>
          {pkg.description && (
            <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.65, maxWidth: 560 }}>
              {pkg.description}
            </p>
          )}
        </div>

        {/* Pricing stats bar */}
        {hasPricing && (
          <div style={{
            display: 'flex',
            gap: 1,
            marginBottom: 40,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
          }}>
            {oneTime > 0 && (
              <div style={{ flex: 1, padding: '20px 24px', background: '#f9fafb' }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {fmt(oneTime)}
                </p>
                <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 600, marginTop: 6 }}>
                  One-time
                </p>
              </div>
            )}
            {monthly > 0 && (
              <div style={{ flex: 1, padding: '20px 24px', background: '#f9fafb' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {fmt(monthly)}
                  </p>
                  <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>/mo</span>
                </div>
                <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 600, marginTop: 6 }}>
                  Per month
                </p>
              </div>
            )}
            {annual > 0 && (
              <div style={{ flex: 1, padding: '20px 24px', background: '#f9fafb' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {fmt(annual)}
                  </p>
                  <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>/yr</span>
                </div>
                <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 600, marginTop: 6 }}>
                  Per year
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cover message */}
        {pkg.coverMessage && (
          <div style={{
            marginBottom: 40,
            padding: '24px 28px',
            borderLeft: '3px solid #67e8f9',
            background: '#f9fafb',
            borderRadius: '0 10px 10px 0',
          }}>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
              {pkg.coverMessage}
            </p>
          </div>
        )}

        {/* Line items */}
        {lineItems.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 16 }}>
              Package Options
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {lineItems.map((item, i) => {
                const qty = item.quantity ?? 1
                const total = (item.price ?? 0) * qty
                return (
                  <div
                    key={item.id ?? i}
                    style={{
                      padding: '18px 20px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 10,
                      background: '#ffffff',
                    }}
                  >
                    {/* Check + name */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'rgba(103,232,249,0.15)',
                        border: '1.5px solid rgba(103,232,249,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                      }}>
                        {/* SVG check */}
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="#67e8f9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>{item.name}</p>
                        {item.description && (
                          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3, lineHeight: 1.5 }}>{item.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Price row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
                      {item.isRecurring && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: '#0891b2',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          background: 'rgba(103,232,249,0.1)',
                          padding: '2px 8px',
                          borderRadius: 10,
                          border: '1px solid rgba(103,232,249,0.2)',
                        }}>
                          {item.recurringInterval === 'year' ? 'Annual' : 'Monthly'}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtFull(total)}
                        {item.isRecurring && (
                          <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280' }}>
                            /{item.recurringInterval === 'year' ? 'yr' : 'mo'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            {hasPricing && (
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 260 }}>
                  {oneTime > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>One-time subtotal</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{fmtFull(oneTime)}</span>
                    </div>
                  )}
                  {monthly > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Monthly recurring</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0891b2', fontVariantNumeric: 'tabular-nums' }}>{fmtFull(monthly)}<span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>/mo</span></span>
                    </div>
                  )}
                  {annual > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Annual recurring</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0891b2', fontVariantNumeric: 'tabular-nums' }}>{fmtFull(annual)}<span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>/yr</span></span>
                    </div>
                  )}
                  {oneTime > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Due today</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{fmtFull(oneTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {pkg.notes && (
          <div style={{ marginBottom: 40, paddingTop: 28, borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 12 }}>
              Notes
            </p>
            <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{pkg.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ paddingTop: 24, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 14, background: '#67e8f9', borderRadius: 1 }} />
            <span style={{ fontSize: 11, color: '#6b7280' }}>orcaclub.pro</span>
          </div>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{proposalDate}</span>
        </div>

      </div>

      <style>{`
        @media print {
          @page { margin: 0.6in 0.75in; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          header, footer, nav { display: none !important; }
        }
      `}</style>
    </div>
  )
}
