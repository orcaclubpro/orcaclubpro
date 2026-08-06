import { expect, test, describe } from 'bun:test'
import {
  generateGenericInvoiceEmail,
  generateGenericInvoiceEmailText,
  type GenericInvoiceEmailData,
} from './genericInvoiceEmailTemplate'

const base: GenericInvoiceEmailData = {
  orderNumber: '#1042',
  customerName: 'Steinway',
  customerEmail: 'a@b.com',
  lineItems: [{ title: 'Final Payment', quantity: 1, price: 4000 }],
  totalAmount: 4000,
}

describe('work log section', () => {
  test('omits the section entirely when there is no work log', () => {
    expect(generateGenericInvoiceEmail(base)).not.toContain('Work completed')
    expect(generateGenericInvoiceEmailText(base)).not.toContain('Work completed')
  })

  test('omits the section when the work log is empty', () => {
    const html = generateGenericInvoiceEmail({ ...base, workLog: [] })
    expect(html).not.toContain('Work completed')
  })

  test('renders each work item in the HTML body', () => {
    const html = generateGenericInvoiceEmail({
      ...base,
      workLog: [
        { title: 'May 2 — Rebuilt inventory sync', description: '3h · Work · milestone log' },
        { title: 'May 4 — Homepage polish', description: '2h · Design · milestone log' },
      ],
    })
    expect(html).toContain('Work completed')
    expect(html).toContain('May 2 — Rebuilt inventory sync')
    expect(html).toContain('3h · Work · milestone log')
    expect(html).toContain('May 4 — Homepage polish')
  })

  test('renders each work item in the plain text body', () => {
    const text = generateGenericInvoiceEmailText({
      ...base,
      workLog: [{ title: 'May 2 — Rebuilt inventory sync', description: '3h · Work · milestone log' }],
    })
    expect(text).toContain('Work completed')
    expect(text).toContain('May 2 — Rebuilt inventory sync')
  })

  test('escapes HTML in work titles and descriptions', () => {
    const html = generateGenericInvoiceEmail({
      ...base,
      workLog: [{ title: 'May 2 — <script>alert(1)</script>', description: 'a & b' }],
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('a &amp; b')
  })

  test('renders a work item with no description', () => {
    const html = generateGenericInvoiceEmail({
      ...base,
      workLog: [{ title: 'May 2 — Rebuilt inventory sync' }],
    })
    expect(html).toContain('May 2 — Rebuilt inventory sync')
  })

  test('uses inline styles only — no style blocks or class-only styling in the work section', () => {
    const html = generateGenericInvoiceEmail({
      ...base,
      workLog: [{ title: 'May 2 — Thing', description: '1h' }],
    })
    const section = html.slice(html.indexOf('Work completed'))
    expect(section).not.toContain('<style')
  })
})
