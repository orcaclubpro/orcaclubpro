'use client'

import React from 'react'
import { ShoppingBag, CreditCard, Check } from 'lucide-react'

export type OrderType = 'shopify' | 'stripe'

interface OrderTypeSidebarProps {
  selectedType: OrderType
  onSelectType: (type: OrderType) => void
}

export default function OrderTypeSidebar({
  selectedType,
  onSelectType,
}: OrderTypeSidebarProps) {
  const orderTypes = [
    {
      id: 'shopify' as OrderType,
      name: 'Shopify Order',
      description: 'Create draft orders via Shopify Admin API',
      icon: ShoppingBag,
      features: [
        'Sync with Shopify inventory',
        'Full product catalog',
        'Automatic fulfillment',
        'Shopify checkout',
      ],
      color: {
        border: 'border-green-500/50',
        bg: 'bg-green-900/30',
        hover: 'hover:border-green-400',
        icon: 'text-green-400',
        active: 'border-green-400 bg-green-900/50',
      },
    },
    {
      id: 'stripe' as OrderType,
      name: 'Stripe Payment',
      description: 'Create custom payment links with Stripe',
      icon: CreditCard,
      features: [
        'Custom pricing',
        'Subscription support',
        'One-time payments',
        'Payment links',
      ],
      color: {
        border: 'border-blue-500/50',
        bg: 'bg-blue-900/30',
        hover: 'hover:border-blue-400',
        icon: 'text-blue-400',
        active: 'border-blue-400 bg-blue-900/50',
      },
    },
  ]

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-gray-900 border border-gray-600 rounded-lg overflow-hidden sticky top-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-gray-600 px-4 py-4">
          <h3 className="font-semibold text-gray-100 text-lg">Order Type</h3>
          <p className="text-xs text-gray-400 mt-1">
            Choose your order creation method
          </p>
        </div>

        {/* Order Type Options */}
        <div className="p-4 space-y-3">
          {orderTypes.map((type) => {
            const Icon = type.icon
            const isSelected = selectedType === type.id

            return (
              <button
                key={type.id}
                onClick={() => onSelectType(type.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `${type.color.active} shadow-lg`
                    : `${type.color.border} ${type.color.bg} ${type.color.hover}`
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Icon className={`w-6 h-6 ${type.color.icon} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-100 flex items-center gap-2">
                      {type.name}
                      {isSelected && (
                        <Check className="w-4 h-4 text-green-400" />
                      )}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-1.5 ml-9">
                  {type.features.map((feature, index) => (
                    <li
                      key={index}
                      className="text-xs text-gray-400 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 bg-gray-500 rounded-full flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        {/* Info Footer */}
        <div className="border-t border-gray-700 px-4 py-3 bg-gray-800/50">
          <p className="text-xs text-gray-500 leading-relaxed">
            {selectedType === 'shopify' ? (
              <>
                <strong className="text-gray-400">Shopify Mode:</strong> Orders
                are created as draft orders in your Shopify admin and can be sent
                to customers for checkout.
              </>
            ) : (
              <>
                <strong className="text-gray-400">Stripe Mode:</strong> Create
                custom payment links for services or products not in your Shopify
                catalog.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
