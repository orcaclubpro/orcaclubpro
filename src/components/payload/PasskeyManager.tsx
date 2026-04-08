'use client'

import React, { useEffect, useRef, useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import { Key } from 'lucide-react'

interface PasskeyCredential {
  id: string
  credentialID: string
  deviceName: string
  registeredAt?: string
  credentialDeviceType?: string
  credentialBackedUp?: boolean
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Unknown date'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return 'Unknown date'
  }
}

export default function PasskeyManager() {
  const [credentials, setCredentials] = useState<PasskeyCredential[] | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showError(msg: string) {
    setError(msg)
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => setError(null), 5000)
  }

  async function fetchCredentials() {
    try {
      const res = await fetch('/api/auth/passkey/credentials')
      if (!res.ok) throw new Error('Failed to load passkeys')
      const data = await res.json()
      setCredentials(data.credentials ?? [])
    } catch (err) {
      setCredentials([])
      showError(err instanceof Error ? err.message : 'Failed to load passkeys')
    }
  }

  useEffect(() => {
    fetchCredentials()
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [])

  async function handleAddPasskey() {
    const deviceName = window.prompt('Name this passkey (e.g. "MacBook Touch ID"):', 'My Passkey')
    if (deviceName === null) return // user cancelled

    setIsRegistering(true)
    try {
      const optRes = await fetch('/api/auth/passkey/register-options', { method: 'POST' })
      if (!optRes.ok) throw new Error('Failed to get registration options')
      const { options } = await optRes.json()

      const credential = await startRegistration({ optionsJSON: options })

      const verifyRes = await fetch('/api/auth/passkey/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, deviceName: deviceName.trim() || 'My Passkey' }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error ?? 'Registration failed')
      }

      await fetchCredentials()
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        // user cancelled the browser prompt — silent
      } else {
        showError(err instanceof Error ? err.message : 'Registration failed')
      }
    } finally {
      setIsRegistering(false)
    }
  }

  async function handleDelete(credentialID: string) {
    if (!window.confirm('Remove this passkey?')) return

    setDeletingId(credentialID)
    try {
      const res = await fetch(
        `/api/auth/passkey/credentials?credentialID=${encodeURIComponent(credentialID)}`,
        { method: 'DELETE' },
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to delete passkey')
      }
      setCredentials((prev) => prev?.filter((c) => c.credentialID !== credentialID) ?? null)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete passkey')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid #1f2937',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '2rem',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#9ca3af',
              margin: 0,
            }}
          >
            Passkeys
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
            Sign in without a password
          </p>
        </div>
        <button
          onClick={handleAddPasskey}
          disabled={isRegistering}
          style={{
            background: 'transparent',
            border: '1px solid #67e8f9',
            color: isRegistering ? '#6b7280' : '#67e8f9',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: isRegistering ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.15s',
            opacity: isRegistering ? 0.6 : 1,
          }}
        >
          {isRegistering ? 'Registering…' : '+ Add Passkey'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '6px',
            color: '#f87171',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1f2937', marginTop: '16px' }} />

      {/* Credential list */}
      {credentials === null ? (
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '16px', marginBottom: 0 }}>
          Loading…
        </p>
      ) : credentials.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '16px', marginBottom: 0 }}>
          No passkeys registered yet.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {credentials.map((cred, idx) => (
            <li
              key={cred.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: idx < credentials.length - 1 ? '1px solid #1f2937' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Key size={16} color="#9ca3af" strokeWidth={1.5} />
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#e5e5e5',
                      fontWeight: 500,
                    }}
                  >
                    {cred.deviceName || 'Unnamed Passkey'}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Registered {formatDate(cred.registeredAt)}
                    {cred.credentialBackedUp && (
                      <span
                        style={{
                          marginLeft: '6px',
                          color: '#67e8f9',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        · Synced
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <DeleteButton
                isDeleting={deletingId === cred.credentialID}
                onDelete={() => handleDelete(cred.credentialID)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DeleteButton({
  isDeleting,
  onDelete,
}: {
  isDeleting: boolean
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onDelete}
      disabled={isDeleting}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'transparent',
        border: `1px solid ${hovered ? '#ef4444' : '#374151'}`,
        color: hovered ? '#ef4444' : '#6b7280',
        padding: '4px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s, color 0.15s',
        opacity: isDeleting ? 0.5 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {isDeleting ? 'Removing…' : 'Delete'}
    </button>
  )
}
