'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export default function SendInvoiceButton() {
  const { id } = useDocumentInfo()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [docData, setDocData] = useState<any>(null)

  // Fetch document data
  React.useEffect(() => {
    if (id) {
      fetch(`/api/orders/${id}`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => setDocData(data))
        .catch((err) => console.error('Failed to fetch order data:', err))
    }
  }, [id])

  const handleSendInvoice = async () => {
    if (!id) {
      setError('Order ID not found')
      return
    }

    if (!docData?.clientAccount) {
      setError('Order must have a client account to send invoice')
      return
    }

    // Check if invoice was already sent
    if (docData?.invoices && docData.invoices.length > 0) {
      const lastSent = new Date(docData.invoices[docData.invoices.length - 1].sentAt).toLocaleString()
      const confirmed = window.confirm(
        `An invoice was already sent ${docData.invoices.length} time(s).\nLast sent: ${lastSent}\n\nSend again?`
      )
      if (!confirmed) return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // Send invoice via API endpoint
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invoice')
      }

      setSuccess(data.message || 'Invoice sent successfully!')

      // Reload page after 2 seconds to show updated invoice history
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Show order info
  const orderNumber = docData?.orderNumber || 'Loading...'
  const clientEmail = docData?.clientAccount?.email || 'No email'
  const orderType = docData?.orderType || 'unknown'

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
        Send Invoice Email
      </h3>
      <p style={{ marginBottom: '12px', fontSize: '14px', color: '#9ca3af' }}>
        Send invoice email to the client for order <strong>{orderNumber}</strong>
      </p>

      {docData && (
        <>
          <div
            style={{
              marginBottom: '12px',
              padding: '12px',
              background: '#111827',
              borderRadius: '6px',
              border: '1px solid #374151',
            }}
          >
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
              Email will be sent to:
            </p>
            <p style={{ margin: '0', fontSize: '14px', color: '#67e8f9', fontWeight: '500' }}>
              {clientEmail}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              Order Type: <span style={{ color: '#d1d5db' }}>{orderType}</span>
            </p>
          </div>

          {docData.invoices && docData.invoices.length > 0 && (
            <div
              style={{
                marginBottom: '12px',
                padding: '12px',
                background: '#fef3c7',
                borderRadius: '6px',
                border: '1px solid #fbbf24',
              }}
            >
              <p style={{ margin: '0', fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
                ⚠️ Invoice already sent {docData.invoices.length} time(s)
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#78350f' }}>
                Last sent: {new Date(docData.invoices[docData.invoices.length - 1].sentAt).toLocaleString()}
              </p>
            </div>
          )}
        </>
      )}

      <button
        onClick={handleSendInvoice}
        disabled={loading || !!success || !docData}
        style={{
          padding: '10px 20px',
          background: loading || success ? '#374151' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading || success || !docData ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'background 0.2s',
        }}
      >
        {loading ? 'Sending Invoice...' : success ? 'Invoice Sent!' : 'Send Invoice Email'}
      </button>

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
