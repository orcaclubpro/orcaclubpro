'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

/**
 * Floating Action Button for creating orders
 * Appears in the PayloadCMS admin panel
 * Uses React Portal to render outside Payload's container to avoid CSS conflicts
 */
export default function CreateOrderButton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const button = (
    <Link
      href="/admin/order"
      className="create-order-fab"
      title="Create Order"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'linear-gradient(to right, #2563eb, #06b6d4)',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '9999px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        transition: 'all 0.2s',
        fontWeight: '600',
        fontSize: '0.875rem',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
      }}
    >
      <ShoppingCart style={{ width: '1.25rem', height: '1.25rem' }} />
      <span>Create Order</span>
    </Link>
  )

  // Only render on client-side and use portal to append to body
  if (!mounted) return null

  return createPortal(button, document.body)
}
