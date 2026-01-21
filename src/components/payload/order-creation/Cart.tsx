'use client'

import React from 'react'
import { Trash2, Minus, Plus, ShoppingCart, Repeat } from 'lucide-react'
import type { LineItem } from './ProductForm'

interface CartProps {
  lineItems: LineItem[]
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemoveItem: (index: number) => void
}

export default function Cart({ lineItems, onUpdateQuantity, onRemoveItem }: CartProps) {
  const total = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const hasRecurring = lineItems.some(item => item.isRecurring)

  if (lineItems.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-white/5 border border-white/10 mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">No items added yet</p>
          <p className="text-gray-600 text-xs mt-1">Add products to build your invoice</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cart Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-gray-100">Invoice Items</h3>
          </div>
          <span className="text-sm text-gray-400">{lineItems.length} item{lineItems.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-3">
        {lineItems.map((item, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 group hover:border-cyan-500/30 transition-all"
          >
            {/* Item Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-100 mb-1 truncate">{item.title}</h4>
                {item.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
                )}
                {item.isRecurring && (
                  <div className="flex items-center gap-1 mt-2">
                    <Repeat className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-purple-400 font-medium">
                      Recurring {item.recurringInterval === 'month' ? 'Monthly' : 'Yearly'}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onRemoveItem(index)}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all text-gray-400 hover:text-red-400"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Item Footer */}
            <div className="flex items-center justify-between gap-4">
              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                  disabled={item.quantity <= 1}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <span className="text-sm font-medium text-gray-300 min-w-[2rem] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>

              {/* Price */}
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  ${item.unitPrice.toFixed(2)} × {item.quantity}
                </div>
                <div className="text-sm font-semibold text-cyan-400">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Total */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-cyan-500/30 p-5">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"></div>
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Subtotal</span>
            <span className="text-lg font-semibold text-gray-100">${total.toFixed(2)}</span>
          </div>
          {hasRecurring && (
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-purple-400 flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                Includes recurring charges
              </p>
            </div>
          )}
          <div className="pt-3 border-t border-cyan-500/20">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-300">Total Amount</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
