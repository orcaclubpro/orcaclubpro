'use client'

import React, { useState } from 'react'
import { Trash2, Percent, DollarSign, Package, CheckCircle, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import type { LineItem } from './ProductSearch'

interface Lead {
  id: string
  name: string
  email: string
  shopifyCustomerId?: string
}

interface OrderSummaryProps {
  customer: Lead | null
  lineItems: LineItem[]
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
  onCreateOrder: (orderData: any) => Promise<any>
}

export default function OrderSummary({
  customer,
  lineItems,
  onUpdateQuantity,
  onRemoveItem,
  onCreateOrder,
}: OrderSummaryProps) {
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')
  const [shippingPrice, setShippingPrice] = useState('')
  const [orderNote, setOrderNote] = useState('')
  const [sendInvoice, setSendInvoice] = useState(true) // Default to true - send invoice automatically
  const [showAdjustments, setShowAdjustments] = useState(false) // Start minimized
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [invoiceUrl, setInvoiceUrl] = useState('')
  const [draftOrderId, setDraftOrderId] = useState('')

  // Calculate totals
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.originalUnitPrice * item.quantity,
    0
  )

  const discountAmount =
    discountType === 'PERCENTAGE'
      ? (subtotal * (parseFloat(discountValue) || 0)) / 100
      : parseFloat(discountValue) || 0

  const shipping = parseFloat(shippingPrice) || 0
  const total = subtotal - discountAmount + shipping

  async function handleSubmit() {
    if (!customer || !customer.shopifyCustomerId) {
      setError('Please select a customer with a Shopify account')
      return
    }

    if (lineItems.length === 0) {
      setError('Please add at least one item to the order')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const orderData: any = {
        customerId: customer.shopifyCustomerId,
        email: customer.email,
        lineItems: lineItems.map((item) => ({
          variantId: item.variantId,
          title: item.title,
          quantity: item.quantity,
          originalUnitPrice: item.originalUnitPrice,
        })),
        note: orderNote || `Created via ORCACLUB admin for ${customer.name}`,
        tags: ['orcaclub-admin', 'manual-order'],
      }

      // Add discount if set
      if (discountValue && parseFloat(discountValue) > 0) {
        orderData.appliedDiscount = {
          description: `${discountType === 'PERCENTAGE' ? discountValue + '%' : '$' + discountValue} discount`,
          value: parseFloat(discountValue),
          valueType: discountType,
        }
      }

      // Add shipping if set
      if (shipping > 0) {
        orderData.shippingLine = {
          title: 'Shipping',
          price: shipping,
        }
      }

      const result = await onCreateOrder(orderData)

      if (result.success) {
        const createdDraftOrderId = result.draftOrder.id
        const createdInvoiceUrl = result.draftOrder.invoiceUrl

        setDraftOrderId(createdDraftOrderId)
        setInvoiceUrl(createdInvoiceUrl)

        // Send invoice email if checkbox is checked
        if (sendInvoice && createdDraftOrderId) {
          console.log('[Order Summary] Sending invoice email...')

          try {
            const invoiceResponse = await fetch('/api/shopify/draft-orders/send-invoice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                draftOrderId: createdDraftOrderId,
              }),
            })

            const invoiceData = await invoiceResponse.json()

            if (!invoiceResponse.ok || !invoiceData.success) {
              console.error('[Order Summary] Failed to send invoice:', invoiceData.error)
              setError(`Order created but failed to send invoice: ${invoiceData.error}`)
              return
            }

            console.log('[Order Summary] Invoice sent successfully at:', invoiceData.invoiceSentAt)
          } catch (invoiceErr) {
            console.error('[Order Summary] Invoice send error:', invoiceErr)
            setError('Order created but failed to send invoice email')
            return
          }
        }

        setSuccess(true)
      } else {
        setError(result.error || 'Failed to create order')
      }
    } catch (err) {
      console.error('[Order Summary] Error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function copyInvoiceUrl() {
    navigator.clipboard.writeText(invoiceUrl)
    alert('Invoice URL copied to clipboard!')
  }

  if (success && invoiceUrl) {
    return (
      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500/50 rounded-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Order Created Successfully!</h2>
        <p className="text-gray-300 mb-2">
          Draft order has been created for <strong>{customer?.name}</strong>
        </p>
        {sendInvoice && (
          <p className="text-sm text-green-300 mb-6">
            ✉️ Invoice email has been sent to {customer?.email}
          </p>
        )}

        <div className="bg-gray-800 border border-green-500/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400 mb-2">Invoice URL:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={invoiceUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded text-sm"
            />
            <button
              onClick={copyInvoiceUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="Copy URL"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={invoiceUrl}
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
            Order Items ({lineItems.length})
          </h3>
        </div>

        {lineItems.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No items added yet. Add products or services to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {lineItems.map((item, index) => (
              <div key={index} className="p-4 hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-100">{item.title}</p>
                    <p className="text-sm text-gray-400">
                      ${item.originalUnitPrice.toFixed(2)} each
                    </p>
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
                      ${(item.originalUnitPrice * item.quantity).toFixed(2)}
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

      {/* Discount & Shipping */}
      {lineItems.length > 0 && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowAdjustments(!showAdjustments)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-semibold text-gray-100">Adjustments (Optional)</h3>
            {showAdjustments ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showAdjustments && (
            <div className="p-4 pt-0 space-y-4">
              {/* Discount */}
              <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Discount Value
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Shipping ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={shippingPrice}
                onChange={(e) => setShippingPrice(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Order Note */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Order Note (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Internal notes about this order..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Send Invoice Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <input
              type="checkbox"
              id="sendInvoice"
              checked={sendInvoice}
              onChange={(e) => setSendInvoice(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="sendInvoice" className="text-sm text-gray-200 cursor-pointer flex-1">
              Send invoice email to customer
              <p className="text-xs text-gray-400 mt-0.5">
                Customer will receive a secure checkout link via email to {customer?.email || 'their email address'}
              </p>
            </label>
          </div>
            </div>
          )}
        </div>
      )}

      {/* Totals */}
      {lineItems.length > 0 && (
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/50 rounded-lg p-6">
          <div className="space-y-2 text-gray-200">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount:</span>
                <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            {shipping > 0 && (
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-semibold">${shipping.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t-2 border-blue-500/50 pt-2 mt-2 flex justify-between text-xl">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-blue-400">${total.toFixed(2)}</span>
            </div>
          </div>
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
        {loading ? 'Creating Order...' : 'Create Order'}
      </button>
    </div>
  )
}
