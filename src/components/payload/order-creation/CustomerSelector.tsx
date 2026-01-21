'use client'

import React, { useState, useEffect } from 'react'
import { Search, User, Mail, Building2, Tag, Loader2 } from 'lucide-react'

interface ClientAccount {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  service?: string
  firstName?: string
  lastName?: string
  projects?: Array<{
    name: string
    status: string
    description?: string
  }>
}

interface CustomerSelectorProps {
  onSelect: (customer: ClientAccount) => void
  selectedCustomer: ClientAccount | null
}

export default function CustomerSelector({ onSelect, selectedCustomer }: CustomerSelectorProps) {
  const [clients, setClients] = useState<ClientAccount[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientAccount[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch client accounts from PayloadCMS
  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true)
        const response = await fetch('/api/client-accounts?limit=1000')

        if (!response.ok) {
          throw new Error('Failed to fetch client accounts')
        }

        const data = await response.json()
        const clientAccounts = data.docs || []

        setClients(clientAccounts)
        setFilteredClients(clientAccounts)
      } catch (err) {
        console.error('[Customer Selector] Error fetching client accounts:', err)
        setError('Failed to load client accounts. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Filter clients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.company?.toLowerCase().includes(term)
    )
    setFilteredClients(filtered)
  }, [searchTerm, clients])

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Loading client accounts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-red-500/10 backdrop-blur-sm border border-red-500/30 p-6">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        <input
          type="text"
          placeholder="Search by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 text-gray-100 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
        />
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/30 p-5">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-cyan-400 mb-2">SELECTED CLIENT</p>
              <p className="font-semibold text-gray-100 text-lg mb-1">{selectedCustomer.name}</p>
              <p className="text-sm text-gray-400">{selectedCustomer.email}</p>
              {selectedCustomer.company && (
                <p className="text-sm text-gray-500 mt-1">{selectedCustomer.company}</p>
              )}
            </div>
            <button
              onClick={() => onSelect(null!)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-cyan-400 transition-all text-sm font-medium"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Customer List */}
      {!selectedCustomer && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {filteredClients.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-12 text-center">
              <p className="text-gray-400">
                {searchTerm ? 'No clients found matching your search.' : 'No client accounts found.'}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Create client accounts to start managing invoices.
              </p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => onSelect(client)}
                className="group w-full relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30 p-4 transition-all text-left hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <User className="w-4 h-4 text-cyan-400" />
                      </div>
                      <p className="font-semibold text-gray-100 truncate">{client.name}</p>
                    </div>

                    <div className="space-y-1.5 ml-10">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>

                      {client.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{client.company}</span>
                        </div>
                      )}

                      {client.service && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="capitalize">{client.service.replace('-', ' ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Results Count */}
      {filteredClients.length > 0 && !selectedCustomer && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Showing {filteredClients.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
