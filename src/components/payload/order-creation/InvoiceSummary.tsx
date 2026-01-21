'use client'

import React, { useState } from 'react'
import { CheckCircle2, Loader2, ExternalLink, Copy, Check, Repeat, Mail } from 'lucide-react'
import type { LineItem } from './ProductForm'

interface ClientAccount {
  id: string
  name: string
  email: string
  company?: string
}

interface InvoiceSummaryProps {
  customer: ClientAccount | null
  lineItems: LineItem[]
  project?: string | null
  onCreateInvoice: (data: any) => Promise<any>
}

export default function InvoiceSummary({
  customer,
  lineItems,
  project,
  onCreateInvoice,
}: InvoiceSummaryProps) {
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [invoiceUrl, setInvoiceUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const total = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const hasRecurring = lineItems.some(item => item.isRecurring)

  async function handleSubmit() {
    if (!customer) return

    setCreating(true)
    setError('')

    const result = await onCreateInvoice({
      customerEmail: customer.email,
      customerName: customer.name,
      lineItems,
      project,
    })

    setCreating(false)

    if (result.success) {
      setSuccess(true)
      setInvoiceUrl(result.paymentLink || '')
    } else {
      setError(result.error || 'Failed to create invoice')
    }
  }

  async function handleCopy() {
    if (invoiceUrl) {
      await navigator.clipboard.writeText(invoiceUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (success && invoiceUrl) {
    return (
      <div className="space-y-6">
        {/* Success Message */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/30 p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent"></div>
          <div className="relative flex items-start gap-4">
            <div className="p-3 rounded-full bg-green-500/20 border border-green-500/30">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-400 mb-2">Invoice Created Successfully!</h3>
              <p className="text-gray-300 text-sm mb-4">
                The Stripe invoice has been generated and is ready to be sent to your client.
              </p>

              {/* Invoice URL */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400">Payment Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={invoiceUrl}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <a
                    href={invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 border border-cyan-500/50 transition-all"
                    title="Open link"
                  >
                    <ExternalLink className="w-5 h-5 text-white" />
                  </a>
                </div>
              </div>

              {/* Next Steps */}
              <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  Next Steps
                </h4>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">1.</span>
                    <span>Copy the payment link above and send it to your client</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">2.</span>
                    <span>Client will receive invoice and payment instructions via email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">3.</span>
                    <span>Order status will automatically update when payment is received</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/admin"
            className="flex-1 text-center px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 font-medium transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Admin
          </a>
          <a
            href="/admin/collections/orders"
            className="flex-1 text-center px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 font-medium transition-all"
          >
            View All Orders
          </a>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all shadow-lg shadow-cyan-500/20"
          >
            Create Another Invoice
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Line Items Summary */}
      <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Invoice Items</h3>
        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-4 pb-3 border-b border-white/10 last:border-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-200 mb-1">{item.title}</h4>
                {item.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-2">{item.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>${item.unitPrice.toFixed(2)} × {item.quantity}</span>
                  {item.isRecurring && (
                    <span className="flex items-center gap-1 text-purple-400">
                      <Repeat className="w-3 h-3" />
                      {item.recurringInterval === 'month' ? 'Monthly' : 'Yearly'}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-100">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 pt-4 border-t border-cyan-500/20">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-gray-300">Total Amount</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              ${total.toFixed(2)}
            </span>
          </div>
          {hasRecurring && (
            <p className="text-xs text-purple-400 mt-2 flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              Includes recurring charges
            </p>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="relative overflow-hidden rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-500/30 p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Create Invoice Button */}
      <button
        onClick={handleSubmit}
        disabled={creating || lineItems.length === 0}
        className="w-full relative overflow-hidden group bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-4 rounded-xl transition-all font-semibold text-lg flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-600 disabled:hover:to-blue-600"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        {creating ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin relative z-10" />
            <span className="relative z-10">Creating Invoice...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-6 h-6 relative z-10" />
            <span className="relative z-10">Create Stripe Invoice</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        Invoice will be sent to <span className="text-cyan-400 font-medium">{customer?.email}</span>
      </p>
    </div>
  )
}
