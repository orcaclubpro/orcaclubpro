'use client'

import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, Receipt, Sparkles } from 'lucide-react'
import Link from 'next/link'
import CustomerSelector from './CustomerSelector'
import ProductForm, { LineItem } from './ProductForm'
import Cart from './Cart'
import InvoiceSummary from './InvoiceSummary'

interface ClientAccount {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  firstName?: string
  lastName?: string
  projects?: Array<{
    name: string
    status: string
    description?: string
  }>
}

export default function OrderCreationClient() {
  const [step, setStep] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<ClientAccount | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  function handleAddToCart(item: LineItem) {
    setLineItems((prev) => {
      // Check if identical item exists
      const existingIndex = prev.findIndex(
        (existing) =>
          existing.title === item.title &&
          existing.unitPrice === item.unitPrice &&
          existing.isRecurring === item.isRecurring &&
          existing.recurringInterval === item.recurringInterval
      )

      if (existingIndex !== -1) {
        // Increment quantity
        return prev.map((existingItem, index) =>
          index === existingIndex
            ? { ...existingItem, quantity: existingItem.quantity + item.quantity }
            : existingItem
        )
      }

      // Add new item
      return [...prev, item]
    })
  }

  function handleUpdateQuantity(index: number, quantity: number) {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity } : item)))
  }

  function handleRemoveItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreateInvoice(orderData: any) {
    try {
      const response = await fetch('/api/stripe/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: selectedCustomer?.email,
          customerName: selectedCustomer?.name,
          lineItems,
          project: selectedProject,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create invoice',
        }
      }

      return {
        success: true,
        paymentLink: data.invoiceUrl,
        invoiceUrl: data.invoiceUrl,
        invoiceId: data.invoiceId,
        orderNumber: data.orderNumber,
        totalAmount: data.totalAmount,
      }
    } catch (error) {
      console.error('[Order Creation] Error:', error)
      return {
        success: false,
        error: 'Network error. Please try again.',
      }
    }
  }

  const canProceedToStep2 = selectedCustomer !== null
  const canProceedToStep3 = lineItems.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-start gap-4">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-cyan-400 transition-colors flex-shrink-0 mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
              <Receipt className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Create Invoice
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Generate custom Stripe invoices for your clients
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="sticky top-[89px] z-40 backdrop-blur-xl bg-gray-900/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { num: 1, title: 'Select Client', completed: step > 1 },
              { num: 2, title: 'Add Items', completed: step > 2 },
              { num: 3, title: 'Create Invoice', completed: false },
            ].map((s, index) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold transition-all border ${
                      s.completed
                        ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400'
                        : step === s.num
                          ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400'
                          : 'bg-white/5 border-white/10 text-gray-500'
                    }`}
                  >
                    {s.completed ? '✓' : s.num}
                  </div>
                  <div>
                    <p
                      className={`font-medium text-sm ${
                        step === s.num
                          ? 'text-cyan-400'
                          : s.completed
                            ? 'text-green-400'
                            : 'text-gray-500'
                      }`}
                    >
                      {s.title}
                    </p>
                  </div>
                </div>
                {index < 2 && (
                  <div className="flex-1 h-0.5 mx-4">
                    <div
                      className={`h-full rounded transition-all ${
                        s.completed
                          ? 'bg-gradient-to-r from-green-500/50 to-green-500/30'
                          : 'bg-white/10'
                      }`}
                    ></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Select Customer */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Step Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-cyan-500/20 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"></div>
              <div className="relative flex items-start gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-100 mb-2">Select Client Account</h2>
                  <p className="text-gray-400 text-sm">
                    Choose the client who will receive this invoice
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Selector */}
            <CustomerSelector onSelect={setSelectedCustomer} selectedCustomer={selectedCustomer} />

            {/* Project Selection */}
            {selectedCustomer && selectedCustomer.projects && selectedCustomer.projects.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                <h3 className="text-lg font-medium text-gray-100 mb-2">
                  Associate with Project (Optional)
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Link this invoice to a specific client project
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedProject === null
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
                        : 'bg-white/5 border-white/10 hover:border-cyan-500/30'
                    }`}
                  >
                    <p className="font-medium text-gray-100">No Project</p>
                    <p className="text-sm text-gray-400">General invoice not linked to any project</p>
                  </button>
                  {selectedCustomer.projects.map((project) => (
                    <button
                      key={project.name}
                      onClick={() => setSelectedProject(project.name)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedProject === project.name
                          ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
                          : 'bg-white/5 border-white/10 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-100">{project.name}</p>
                          {project.description && (
                            <p className="text-sm text-gray-400 mt-1">{project.description}</p>
                          )}
                        </div>
                        <span
                          className={`ml-4 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                            project.status === 'active'
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : project.status === 'on-hold'
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                : project.status === 'completed'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="group relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3.5 rounded-xl disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative z-10">Continue to Items</span>
                <ArrowRight className="w-5 h-5 relative z-10" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Add Products */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Product Form (2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step Header */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-cyan-500/20 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"></div>
                <div className="relative">
                  <h2 className="text-xl font-semibold text-gray-100 mb-2">Add Invoice Items</h2>
                  <p className="text-gray-400 text-sm">
                    Configure products or services for this invoice
                  </p>
                </div>
              </div>

              {/* Product Form */}
              <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6">
                <ProductForm onAddToCart={handleAddToCart} />
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-cyan-400 transition-all font-medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Client
                </button>

                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedToStep3}
                  className="group relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3.5 rounded-xl disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:shadow-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative z-10">Review Invoice</span>
                  <ArrowRight className="w-5 h-5 relative z-10" />
                </button>
              </div>
            </div>

            {/* Right: Cart Sidebar (1 column) */}
            <div className="lg:col-span-1">
              <div className="sticky top-[200px]">
                <Cart
                  lineItems={lineItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Step Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-cyan-500/20 p-6">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"></div>
              <div className="relative">
                <h2 className="text-xl font-semibold text-gray-100 mb-2">Review & Create Invoice</h2>
                <p className="text-gray-400 text-sm">
                  Confirm details and generate Stripe invoice for your client
                </p>
              </div>
            </div>

            {/* Client Info */}
            {selectedCustomer && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/30 p-5">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"></div>
                <div className="relative">
                  <p className="text-xs font-medium text-cyan-400 mb-2">CLIENT</p>
                  <p className="font-semibold text-gray-100 text-lg">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-400">{selectedCustomer.email}</p>
                  {selectedCustomer.company && (
                    <p className="text-sm text-gray-500 mt-1">{selectedCustomer.company}</p>
                  )}
                </div>
              </div>
            )}

            {/* Project Info */}
            {selectedProject && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/30 p-5">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent"></div>
                <div className="relative">
                  <p className="text-xs font-medium text-purple-400 mb-2">PROJECT</p>
                  <p className="font-semibold text-gray-100">{selectedProject}</p>
                </div>
              </div>
            )}

            {/* Invoice Summary */}
            <InvoiceSummary
              customer={selectedCustomer}
              lineItems={lineItems}
              project={selectedProject}
              onCreateInvoice={handleCreateInvoice}
            />

            {/* Navigation */}
            <div className="flex justify-start pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-cyan-400 transition-all font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Items
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
