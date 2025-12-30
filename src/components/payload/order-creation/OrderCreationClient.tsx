'use client'

import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import CustomerSelector from './CustomerSelector'
import ProductSearch, { LineItem } from './ProductSearch'
import OrderSummary from './OrderSummary'
import CartSidebar from './CartSidebar'

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  service?: string
  shopifyCustomerId?: string
}

export default function OrderCreationClient() {
  const [step, setStep] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Lead | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  function handleAddToCart(item: LineItem) {
    setLineItems((prev) => {
      // Check if item already exists in cart
      const existingIndex = prev.findIndex((existing) => {
        // For Shopify products, match by variantId
        if (item.variantId && existing.variantId) {
          return existing.variantId === item.variantId
        }
        // For custom items, match by title
        return existing.title === item.title && existing.isCustom === item.isCustom
      })

      // If item exists, increment quantity
      if (existingIndex !== -1) {
        return prev.map((existingItem, index) =>
          index === existingIndex
            ? { ...existingItem, quantity: existingItem.quantity + item.quantity }
            : existingItem
        )
      }

      // If item doesn't exist, add it to cart
      return [...prev, item]
    })
  }

  function handleUpdateQuantity(index: number, quantity: number) {
    setLineItems((prev) => prev.map((item, i) => (i === index ? { ...item, quantity } : item)))
  }

  function handleRemoveItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreateOrder(orderData: any) {
    try {
      const response = await fetch('/api/shopify/draft-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create order',
        }
      }

      return {
        success: true,
        draftOrder: data.draftOrder,
      }
    } catch (error) {
      console.error('[Order Creation] Error:', error)
      return {
        success: false,
        error: 'Network error. Please try again.',
      }
    }
  }

  function canProceedToStep2() {
    return selectedCustomer !== null
  }

  function canProceedToStep3() {
    return lineItems.length > 0
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start gap-4">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-100 transition-colors flex-shrink-0 mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <ShoppingCart className="w-7 h-7 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">
                Create Order
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Create draft orders for customers via Shopify Admin API
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: 'Select Customer', completed: step > 1 },
              { num: 2, title: 'Add Products', completed: step > 2 },
              { num: 3, title: 'Review & Submit', completed: false },
            ].map((s, index) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      s.completed
                        ? 'bg-green-600 text-white'
                        : step === s.num
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {s.completed ? '✓' : s.num}
                  </div>
                  <div>
                    <p
                      className={`font-medium ${step === s.num ? 'text-blue-400' : 'text-gray-300'}`}
                    >
                      {s.title}
                    </p>
                  </div>
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded ${s.completed ? 'bg-green-600' : 'bg-gray-700'}`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Select Customer - No sidebar */}
        {step === 1 && (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-100 mb-2">
                  Step 1: Select Customer
                </h2>
                <p className="text-gray-400">
                  Choose a customer from your leads who has a Shopify account
                </p>
              </div>

              <CustomerSelector
                onSelect={setSelectedCustomer}
                selectedCustomer={selectedCustomer}
              />

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2()}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Continue to Products
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Add Products - WITH sidebar outside card */}
        {step === 2 && (
          <div className="flex gap-6">
            {/* Left: Main card with product search */}
            <div className="flex-1 min-w-0">
              <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-100 mb-2">
                        Step 2: Add Products & Services
                      </h2>
                      <p className="text-gray-400">
                        Add Shopify products or create custom service line items
                      </p>
                    </div>
                    {/* Show cart count badge on mobile only (when sidebar is hidden) */}
                    <div className="lg:hidden bg-blue-900/30 border border-blue-500/50 rounded-lg px-4 py-2">
                      <p className="text-sm text-gray-400">Cart Items:</p>
                      <p className="text-2xl font-bold text-blue-400">{lineItems.length}</p>
                    </div>
                  </div>

                  <ProductSearch onAddToCart={handleAddToCart} />

                  <div className="flex justify-between pt-4 border-t border-gray-700">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 text-gray-300 hover:text-gray-100 px-6 py-3 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors font-medium"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back to Customer
                    </button>

                    <button
                      onClick={() => setStep(3)}
                      disabled={!canProceedToStep3()}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Review Order
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Cart Sidebar (outside card, hidden on mobile) */}
            <CartSidebar
              lineItems={lineItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onProceedToReview={() => setStep(3)}
            />
          </div>
        )}

        {/* Step 3: Review & Submit - No sidebar */}
        {step === 3 && (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-100 mb-2">
                  Step 3: Review & Submit Order
                </h2>
                <p className="text-gray-400">
                  Review order details and create the draft order in Shopify
                </p>
              </div>

              {selectedCustomer && (
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Customer:</p>
                  <p className="font-semibold text-gray-100">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-400">{selectedCustomer.email}</p>
                </div>
              )}

              <OrderSummary
                customer={selectedCustomer}
                lineItems={lineItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCreateOrder={handleCreateOrder}
              />

              <div className="flex justify-start pt-4 border-t border-gray-700">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-gray-300 hover:text-gray-100 px-6 py-3 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors font-medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Products
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
