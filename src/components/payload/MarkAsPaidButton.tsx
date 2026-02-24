'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export default function MarkAsPaidButton() {
  const { id } = useDocumentInfo()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [docData, setDocData] = useState<any>(null)

  React.useEffect(() => {
    if (id) {
      fetch(`/api/orders/${id}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => setDocData(data))
        .catch((err) => console.error('Failed to fetch order data:', err))
    }
  }, [id])

  const handleConfirm = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      setConfirming(false)

      const response = await fetch(`/api/orders/${id}/fulfill`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark order as paid')
      }

      setSuccess(data.stripeUpdated ? 'Order marked as paid and Stripe invoice closed.' : 'Order marked as paid.')

      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const status = docData?.status
  const orderNumber = docData?.orderNumber || '...'
  const amount = docData?.amount != null ? `$${Number(docData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '...'
  const hasStripeInvoice = Boolean(docData?.stripeInvoiceId)

  const alreadyPaid = status === 'paid'
  const cancelled = status === 'cancelled'
  const disabled = loading || !!success || !docData || alreadyPaid || cancelled

  return (
    <div
      style={{
        padding: '16px',
        background: '#1f2937',
        borderRadius: '8px',
        marginTop: '16px',
        border: '1px solid #374151',
      }}
    >
      <h3
        style={{
          marginBottom: '8px',
          fontSize: '16px',
          fontWeight: '600',
          color: '#f3f4f6',
        }}
      >
        Mark as Paid
      </h3>

      <p style={{ marginBottom: '12px', fontSize: '14px', color: '#9ca3af' }}>
        {alreadyPaid
          ? 'This order has already been paid.'
          : cancelled
          ? 'This order has been cancelled.'
          : `Record an offline payment for ${orderNumber} (${amount}).`}
      </p>

      {docData && !alreadyPaid && !cancelled && (
        <div
          style={{
            marginBottom: '12px',
            padding: '12px',
            background: '#111827',
            borderRadius: '6px',
            border: '1px solid #374151',
          }}
        >
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Amount</p>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#f3f4f6', fontWeight: '600' }}>
            {amount}
          </p>
          <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
            {hasStripeInvoice
              ? 'Stripe invoice will also be closed (paid out of band).'
              : 'No Stripe invoice linked — Payload record only.'}
          </p>
        </div>
      )}

      {/* Confirmation prompt */}
      {confirming && (
        <div
          style={{
            marginBottom: '12px',
            padding: '12px',
            background: '#451a03',
            borderRadius: '6px',
            border: '1px solid #92400e',
          }}
        >
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#fcd34d', fontWeight: '500' }}>
            Are you sure? This will mark the order as paid and{hasStripeInvoice ? ' close the Stripe invoice' : ' update Payload only'}.
            This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleConfirm}
              style={{
                padding: '8px 16px',
                background: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Yes, Mark as Paid
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                padding: '8px 16px',
                background: '#374151',
                color: '#d1d5db',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!confirming && (
        <button
          onClick={() => setConfirming(true)}
          disabled={disabled}
          style={{
            padding: '10px 20px',
            background: disabled ? '#374151' : '#16a34a',
            color: disabled ? '#6b7280' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Processing...' : success ? 'Marked as Paid!' : alreadyPaid ? 'Already Paid' : cancelled ? 'Order Cancelled' : 'Mark as Paid'}
        </button>
      )}

      {error && (
        <p style={{ marginTop: '12px', color: '#ef4444', fontSize: '14px', fontWeight: '500' }}>
          ❌ {error}
        </p>
      )}

      {success && (
        <p style={{ marginTop: '12px', color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
          ✅ {success}
        </p>
      )}
    </div>
  )
}
