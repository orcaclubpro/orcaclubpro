'use client'

import React, { useState } from 'react'
import { Trash2, Package, CheckCircle, Copy, ExternalLink, Repeat } from 'lucide-react'
import type { StripeLineItem } from './StripeProductForm'

interface Lead {
  id: string
  name: string
  email: string
}

interface StripeOrderSummaryProps {
  customer: Lead | null
  lineItems: StripeLineItem[]
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
  onCreateOrder: (orderData: any) => Promise<any>
}

export default function StripeOrderSummary({
  customer,
  lineItems,
  onUpdateQuantity,
  onRemoveItem,
  onCreateOrder,
}: StripeOrderSummaryProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [paymentLink, setPaymentLink] = useState('')
  const [orderNumber, setOrderNumber] = useState('')

  // Calculate totals
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )

  const hasRecurring = lineItems.some((item) => item.isRecurring)

  async function handleSubmit() {
    if (!customer) {
      setError('Please select a customer')
      return
    }

    if (lineItems.length === 0) {
      setError('Please add at least one item')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Create order data object (not used by Stripe flow but matches interface)
      const orderData = {
        customer,
        lineItems,
      }

      const result = await onCreateOrder(orderData)

      if (result.success) {
        setPaymentLink(result.paymentLink)
        setOrderNumber(result.orderNumber)
        setSuccess(true)
      } else {
        setError(result.error || 'Failed to create payment link')
      }
    } catch (err) {
      console.error('[Stripe Order Summary] Error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function copyPaymentLink() {
    navigator.clipboard.writeText(paymentLink)
    alert('Payment link copied to clipboard!')
  }

  if (success && paymentLink) {
    return (
      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500/50 rounded-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Payment Link Created!</h2>
        <p className="text-gray-300 mb-2">
          Order <strong>{orderNumber}</strong> has been created for{' '}
          <strong>{customer?.name}</strong>
        </p>
        <p className="text-sm text-green-300 mb-6">
          ✉️ Payment link email has been sent to {customer?.email}
        </p>

        <div className="bg-gray-800 border border-green-500/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400 mb-2">Payment Link:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={paymentLink}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded text-sm"
            />
            <button
              onClick={copyPaymentLink}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="Copy URL"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Create Another Order
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg divide-y divide-gray-700">
        <div className="p-4 bg-gray-800">
          <h3 className="font-semibold text-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Payment Items ({lineItems.length})
          </h3>
        </div>

        {lineItems.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No items added yet. Add products or services to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {lineItems.map((item, index) => (
              <div key={index} className="p-4 hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-100">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm text-gray-400">
                        ${item.unitPrice.toFixed(2)} each
                        {item.isRecurring && ` /${item.recurringInterval}`}
                      </p>
                      {item.isRecurring && (
                        <span className="flex items-center gap-1 text-xs text-purple-400">
                          <Repeat className="w-3 h-3" />
                          Recurring
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 text-gray-100 rounded text-center"
                    />

                    <p className="w-24 text-right font-semibold text-gray-100">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                      {item.isRecurring && (
                        <span className="text-xs text-purple-400">/{item.recurringInterval}</span>
                      )}
                    </p>

                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      {lineItems.length > 0 && (
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/50 rounded-lg p-6">
          <div className="space-y-2 text-gray-200">
            <div className="flex justify-between text-xl">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-blue-400">${subtotal.toFixed(2)}</span>
            </div>

            {hasRecurring && (
              <div className="mt-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-purple-400" />
                  <p className="text-sm text-purple-300">
                    This order includes recurring subscription items
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      {lineItems.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>What happens next:</strong> A payment link will be generated and automatically emailed to{' '}
            <strong>{customer?.email}</strong>. The customer can complete payment securely through Stripe. You'll
            also receive a copy of the payment link to share directly.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !customer || lineItems.length === 0}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
      >
        {loading ? 'Creating Payment Link...' : 'Create Payment Link'}
      </button>
    </div>
  )
}
