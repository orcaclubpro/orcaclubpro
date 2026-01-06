'use client'

import React, { useState } from 'react'
import { DollarSign, Plus, Package, Repeat } from 'lucide-react'

export interface StripeLineItem {
  title: string
  description?: string
  quantity: number
  unitPrice: number
  isRecurring: boolean
  recurringInterval?: 'month' | 'year'
}

interface StripeProductFormProps {
  onAddToCart: (item: StripeLineItem) => void
}

export default function StripeProductForm({ onAddToCart }: StripeProductFormProps) {
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

    const lineItem: StripeLineItem = {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-400 text-sm mb-1">
              Stripe Payment Configuration
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Create custom products or services with flexible pricing. Supports one-time
              payments and recurring subscriptions.
            </p>
          </div>
        </div>
      </div>

      {/* Product/Service Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Product/Service Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g., Premium Web Development Package"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          placeholder="Add details about this product or service..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
        />
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quantity <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Unit Price ($) <span className="text-red-400">*</span>
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
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
        </div>
      </div>

      {/* Recurring Payment Toggle */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-blue-400" />
              <span className="font-medium text-gray-100">Recurring Payment</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Create a subscription that charges customers automatically
            </p>
          </div>
        </label>

        {isRecurring && (
          <div className="mt-4 pl-7">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Billing Interval
            </label>
            <select
              value={recurringInterval}
              onChange={(e) => setRecurringInterval(e.target.value as 'month' | 'year')}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add to Cart
      </button>

      {/* Total Preview */}
      {unitPrice && parseFloat(unitPrice) > 0 && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total Amount:</span>
            <span className="text-xl font-bold text-blue-400">
              ${(parseFloat(unitPrice) * quantity).toFixed(2)}
              {isRecurring && (
                <span className="text-sm text-gray-400 font-normal">
                  /{recurringInterval}
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </form>
  )
}
