'use client'

import React, { useState, useEffect } from 'react'
import { Search, User, Mail, Building2, Tag } from 'lucide-react'
import styles from './order-creation.module.css'

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  service?: string
  shopifyCustomerId?: string
}

interface CustomerSelectorProps {
  onSelect: (customer: Lead) => void
  selectedCustomer: Lead | null
}

export default function CustomerSelector({ onSelect, selectedCustomer }: CustomerSelectorProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch leads from PayloadCMS
  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoading(true)
        const response = await fetch('/api/leads?limit=1000&where[shopifyCustomerId][exists]=true')

        if (!response.ok) {
          throw new Error('Failed to fetch customers')
        }

        const data = await response.json()
        const leadsWithShopify = data.docs || []

        setLeads(leadsWithShopify)
        setFilteredLeads(leadsWithShopify)
      } catch (err) {
        console.error('[Customer Selector] Error fetching leads:', err)
        setError('Failed to load customers. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [])

  // Filter leads based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLeads(leads)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        lead.company?.toLowerCase().includes(term)
    )
    setFilteredLeads(filtered)
  }, [searchTerm, leads])

  if (loading) {
    return (
      <div className={styles.loadingSpinner}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (error) {
    return <div className={styles.errorBox}>{error}</div>
  }

  return (
    <div>
      {/* Search Box */}
      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className={styles.selectedCustomer}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className={styles.selectedCustomerText}>Selected Customer:</p>
              <p className={styles.selectedCustomerName}>{selectedCustomer.name}</p>
              <p className={styles.selectedCustomerEmail}>{selectedCustomer.email}</p>
            </div>
            <button onClick={() => onSelect(null!)} className={styles.changeButton}>
              Change
            </button>
          </div>
        </div>
      )}

      {/* Customer List */}
      {!selectedCustomer && (
        <div className={styles.customerList}>
          {filteredLeads.length === 0 ? (
            <div className={styles.emptyState}>
              {searchTerm ? 'No customers found matching your search.' : 'No customers with Shopify accounts found.'}
              <br />
              <small style={{ color: '#6b7280', marginTop: '8px', display: 'block' }}>
                Submit a contact or booking form to create customers.
              </small>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <button key={lead.id} onClick={() => onSelect(lead)} className={styles.customerCard}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <User className={styles.customerIcon} />
                      <p className={styles.customerName}>{lead.name}</p>
                    </div>

                    <div>
                      <div className={styles.customerDetail}>
                        <Mail className={styles.customerIcon} />
                        <span>{lead.email}</span>
                      </div>

                      {lead.company && (
                        <div className={styles.customerDetail}>
                          <Building2 className={styles.customerIcon} />
                          <span>{lead.company}</span>
                        </div>
                      )}

                      {lead.service && (
                        <div className={styles.customerDetail}>
                          <Tag className={styles.customerIcon} />
                          <span style={{ textTransform: 'capitalize' }}>
                            {lead.service.replace('-', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.arrow}>→</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {filteredLeads.length > 0 && !selectedCustomer && (
        <p className={styles.customerCount}>
          Showing {filteredLeads.length} of {leads.length} customers
        </p>
      )}
    </div>
  )
}
