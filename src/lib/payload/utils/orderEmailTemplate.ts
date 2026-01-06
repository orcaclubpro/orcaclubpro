/**
 * Order Invoice Email Template
 * Generates a clean, branded HTML email for draft order invoices
 */

interface OrderLineItem {
  id: string
  title: string
  quantity: number
  originalUnitPrice: string
  discountedUnitPrice: string
  variant?: {
    id: string
    title: string
  }
}

interface OrderEmailData {
  orderNumber: string
  customerName?: string
  customerEmail: string
  invoiceUrl: string
  totalPrice: string
  subtotalPrice: string
  totalTax: string
  currencyCode: string
  lineItems: OrderLineItem[]
  createdAt: string
}

/**
 * Generate HTML email template for order invoice
 */
export function generateOrderInvoiceEmail(order: OrderEmailData): string {
  const lineItemsHtml = order.lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151;">
        <div style="color: #f3f4f6; font-weight: 500;">${item.title}</div>
        ${item.variant?.title ? `<div style="color: #9ca3af; font-size: 14px; margin-top: 4px;">${item.variant.title}</div>` : ''}
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151; text-align: center; color: #d1d5db;">
        ${item.quantity}
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #374151; text-align: right; color: #f3f4f6; font-weight: 500;">
        $${parseFloat(item.discountedUnitPrice).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('')

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Invoice - ORCACLUB</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" style="max-width: 600px;" cellpadding="0" cellspacing="0">

          <!-- Header with ORCACLUB Branding -->
          <tr>
            <td style="text-align: center; padding-bottom: 40px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">
                <span style="color: #ffffff;">ORCA</span><span style="background: linear-gradient(45deg, #67e8f9, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">CLUB</span>
              </h1>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px; font-weight: 300;">est 2025</p>
            </td>
          </tr>

          <!-- Order Confirmation Message -->
          <tr>
            <td style="padding-bottom: 32px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: -0.01em;">
                Order Confirmation
              </h2>
              <p style="margin: 0; color: #d1d5db; font-size: 16px; line-height: 1.6; font-weight: 300;">
                Thank you for your order${order.customerName ? `, ${order.customerName}` : ''}. Your invoice is ready for payment.
              </p>
            </td>
          </tr>

          <!-- Order Number Badge -->
          <tr>
            <td style="padding-bottom: 32px;">
              <div style="display: inline-block; background: linear-gradient(to right, rgba(37, 99, 235, 0.2), rgba(6, 182, 212, 0.2)); border: 1px solid rgba(103, 232, 249, 0.3); border-radius: 9999px; padding: 12px 24px;">
                <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Order Number</span>
                <span style="color: #67e8f9; font-size: 18px; font-weight: 600; margin-left: 12px;">${order.orderNumber}</span>
              </div>
            </td>
          </tr>

          <!-- Order Details Card -->
          <tr>
            <td style="background-color: #1f2937; border-radius: 12px; padding: 32px; margin-bottom: 24px;">

              <!-- Line Items Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <thead>
                  <tr>
                    <th style="text-align: left; color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 16px;">Item</th>
                    <th style="text-align: center; color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 16px;">Qty</th>
                    <th style="text-align: right; color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 16px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsHtml}
                </tbody>
              </table>

              <!-- Order Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td style="color: #d1d5db; font-size: 14px; padding: 8px 0;">Subtotal</td>
                  <td style="color: #f3f4f6; font-size: 14px; text-align: right; padding: 8px 0;">$${parseFloat(order.subtotalPrice).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #d1d5db; font-size: 14px; padding: 8px 0;">Tax</td>
                  <td style="color: #f3f4f6; font-size: 14px; text-align: right; padding: 8px 0;">$${parseFloat(order.totalTax).toFixed(2)}</td>
                </tr>
                <tr style="border-top: 2px solid #374151;">
                  <td style="color: #ffffff; font-size: 20px; font-weight: 600; padding: 16px 0 0 0;">Total</td>
                  <td style="color: #67e8f9; font-size: 24px; font-weight: 700; text-align: right; padding: 16px 0 0 0;">
                    $${parseFloat(order.totalPrice).toFixed(2)} ${order.currencyCode}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 40px 0;">
              <a href="${order.invoiceUrl}" style="display: inline-block; background: linear-gradient(to right, #2563eb, #06b6d4); color: #ffffff; padding: 16px 48px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s;">
                View Invoice & Pay
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding-top: 40px; border-top: 1px solid #1f2937;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px; font-weight: 300;">
                Questions? Reply to this email or visit
                <a href="https://orcaclub.pro" style="color: #67e8f9; text-decoration: none;">orcaclub.pro</a>
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px; font-weight: 300;">
                © 2025 ORCACLUB. Technical Operations Development Studio.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
