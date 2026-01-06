'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

export default function ConvertToClientButton() {
  const { id } = useDocumentInfo()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [docData, setDocData] = useState<any>(null)

  // Fetch document data
  React.useEffect(() => {
    if (id) {
      fetch(`/api/leads/${id}`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => setDocData(data))
        .catch(err => console.error('Failed to fetch lead data:', err))
    }
  }, [id])

  const handleConvert = async () => {
    if (!docData?.email || !docData?.name) {
      setError('Lead must have name and email to convert')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create client account via PayloadCMS API
      const response = await fetch('/api/client-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: docData.name,
          email: docData.email,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.errors?.[0]?.message || 'Failed to create client account')
      }

      const data = await response.json()

      setSuccess(`Client account created! Redirecting...`)

      // Redirect to new client account
      setTimeout(() => {
        router.push(`/admin/collections/client-accounts/${data.doc.id}`)
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', marginTop: '16px' }}>
      <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
        Convert to Client Account
      </h3>
      <p style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280' }}>
        Create a client account from this lead. This will automatically create a Shopify customer.
      </p>

      <button
        onClick={handleConvert}
        disabled={loading || !!success}
        style={{
          padding: '8px 16px',
          background: loading || success ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading || success ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        {loading ? 'Converting...' : success ? 'Converted!' : 'Convert to Client Account'}
      </button>

      {error && (
        <p style={{ marginTop: '8px', color: '#ef4444', fontSize: '14px' }}>{error}</p>
      )}

      {success && (
        <p style={{ marginTop: '8px', color: '#10b981', fontSize: '14px' }}>{success}</p>
      )}
    </div>
  )
}
