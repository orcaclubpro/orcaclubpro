'use client'

import React, { useState } from 'react'
import { DollarSign, Plus, Package, Repeat, Sparkles } from 'lucide-react'

export interface LineItem {
  title: string
  description?: string
  quantity: number
  unitPrice: number
  isRecurring: boolean
  recurringInterval?: 'month' | 'year'
}

interface ProductFormProps {
  onAddToCart: (item: LineItem) => void
}

export default function ProductForm({ onAddToCart }: ProductFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringInterval, setRecurringInterval] = useState<'month' | 'year'>('month')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim() || !unitPrice || parseFloat(unitPrice) <= 0) {
      alert('Please fill in all required fields with valid values')
      return
    }

    const lineItem: LineItem = {
      title,
      description: description.trim() || undefined,
      quantity,
      unitPrice: parseFloat(unitPrice),
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : undefined,
    }

    onAddToCart(lineItem)

    // Reset form
    setTitle('')
    setDescription('')
    setQuantity(1)
    setUnitPrice('')
    setIsRecurring(false)
    setRecurringInterval('month')
  }

  const totalAmount = unitPrice && parseFloat(unitPrice) > 0
    ? (parseFloat(unitPrice) * quantity).toFixed(2)
    : '0.00'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Info Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-cyan-500/20 p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5"></div>
        <div className="relative flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-cyan-400 text-sm mb-1">
              Custom Product Configuration
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Create invoice line items for services or products. Supports one-time and recurring billing.
            </p>
          </div>
        </div>
      </div>

      {/* Product Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Product/Service Name <span className="text-cyan-400">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g., Premium Web Development Package"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 text-gray-100 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Description <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <textarea
          placeholder="Add details about this product or service..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 text-gray-100 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
        />
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Quantity <span className="text-cyan-400">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 text-gray-100 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Unit Price ($) <span className="text-cyan-400">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 text-gray-100 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
              required
            />
          </div>
        </div>
      </div>

      {/* Recurring Payment Card */}
      <div className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="mt-1 w-4 h-4 text-cyan-600 bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-cyan-500/50"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-gray-100">Recurring Payment</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Create a subscription that charges customers automatically
            </p>
          </div>
        </label>

        {isRecurring && (
          <div className="mt-4 pl-7 animate-in slide-in-from-top-2 duration-200">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Billing Interval
            </label>
            <select
              value={recurringInterval}
              onChange={(e) => setRecurringInterval(e.target.value as 'month' | 'year')}
              className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            >
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        )}
      </div>

      {/* Total Preview */}
      {parseFloat(totalAmount) > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/30 p-4">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <span className="text-sm text-gray-400">Line Total:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                ${totalAmount}
              </span>
              {isRecurring && (
                <span className="text-sm text-gray-400 font-normal">
                  /{recurringInterval}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full relative overflow-hidden group bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3.5 rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        <Plus className="w-5 h-5 relative z-10" />
        <span className="relative z-10">Add to Invoice</span>
      </button>
    </form>
  )
}
