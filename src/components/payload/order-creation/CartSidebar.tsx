'use client'

import React from 'react'
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import type { LineItem } from './ProductSearch'

interface CartSidebarProps {
  lineItems: LineItem[]
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
  onProceedToReview: () => void
}

export default function CartSidebar({
  lineItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToReview,
}: CartSidebarProps) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.originalUnitPrice * item.quantity,
    0
  )

  const totalItems = lineItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="w-80 flex-shrink-0 hidden lg:block">
      <div className="bg-gray-900 border border-gray-600 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-b border-gray-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-gray-100">
                Cart {lineItems.length > 0 && `(${totalItems})`}
              </h3>
            </div>
          </div>

          {/* Cart Items */}
          <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
            {lineItems.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  Your cart is empty
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Add products to get started
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {lineItems.map((item, index) => (
                  <div key={index} className="p-3 hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-100 line-clamp-2 flex-1">
                        {item.title}
                      </p>
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            onUpdateQuantity(index, Math.max(1, item.quantity - 1))
                          }
                          className="w-7 h-7 rounded bg-gray-600 hover:bg-gray-500 text-white text-lg font-bold flex items-center justify-center transition-colors border border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.quantity <= 1}
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-sm text-gray-100 font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          className="w-7 h-7 rounded bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold flex items-center justify-center transition-colors border border-blue-500"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          ${item.originalUnitPrice.toFixed(2)} each
                        </p>
                        <p className="text-sm font-semibold text-gray-100">
                          ${(item.originalUnitPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Subtotal */}
          {lineItems.length > 0 && (
            <div className="border-t border-gray-600 bg-gray-800">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300 font-medium">Subtotal:</span>
                  <span className="text-lg font-bold text-blue-400">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={onProceedToReview}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  Review Order
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
