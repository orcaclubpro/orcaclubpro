import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Cinzel_Decorative } from 'next/font/google'
import { PackageActions } from './PackageActions'
import { ScrollToTop } from './ScrollToTop'

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
  const isStaff = user.role === 'admin' || user.role === 'user'

  let oneTime = 0, monthly = 0, annual = 0
  for (const item of lineItems) {
    const qty = item.quantity ?? 1
    const total = (item.price ?? 0) * qty
    if (item.isRecurring) {
      item.recurringInterval === 'year' ? (annual += total) : (monthly += total)
    } else {
      oneTime += total
    }
  }

  const clientAccount = pkg.clientAccount
  const clientName = clientAccount && typeof clientAccount === 'object' ? clientAccount.name ?? '' : ''
  const clientCompany = clientAccount && typeof clientAccount === 'object' ? clientAccount.company ?? '' : ''

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
          {(clientName || clientCompany) && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>Bill To</p>
              {clientName && <p style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{clientName}</p>}
              {clientCompany && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{clientCompany}</p>}
            </div>
          )}
          <div style={{ textAlign: clientName || clientCompany ? 'right' : 'left' }}>
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
          <div style={{ marginBottom: 32, padding: '16px 20px', background: '#f9fafb', borderRadius: 8, borderLeft: '3px solid #67e8f9' }}>
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
              const total = (item.price ?? 0) * qty
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
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>{item.name}</p>
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
                  <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'right', paddingTop: 1, fontVariantNumeric: 'tabular-nums' }}>{fmt(item.price ?? 0)}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', textAlign: 'right', paddingTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(total)}
                    {item.isRecurring && (
                      <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af' }}>/{item.recurringInterval === 'year' ? 'yr' : 'mo'}</span>
                    )}
                  </p>
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

        {/* ── NOTES ───────────────────────────────── */}
        {pkg.notes && (
          <div style={{ marginBottom: 32, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>Notes</p>
            <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{pkg.notes}</p>
          </div>
        )}

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
