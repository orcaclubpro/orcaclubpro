'use client'

import { useState } from 'react'
import { ChevronDown, Calendar, Package, Receipt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PayNowButton } from './PayNowButton'
import type { Order } from '@/types/payload-types'

interface EnhancedOrderCardProps {
  order: Order
  isPending?: boolean
}

export function EnhancedOrderCard({ order, isPending = false }: EnhancedOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          color: 'text-green-400',
          bg: 'bg-green-400/10',
          border: 'border-green-400/20',
          label: 'Paid',
        }
      case 'pending':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          border: 'border-yellow-400/20',
          label: 'Pending Payment',
        }
      case 'cancelled':
        return {
          color: 'text-red-400',
          bg: 'bg-red-400/10',
          border: 'border-red-400/20',
          label: 'Cancelled',
        }
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-400/10',
          border: 'border-gray-400/20',
          label: status,
        }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  const statusConfig = getStatusConfig(order.status)
  const hasLineItems = order.lineItems && order.lineItems.length > 0
  const showPayButton = isPending && order.stripeInvoiceUrl

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-white/[0.03] backdrop-blur-md transition-all duration-300 ${
        isPending
          ? 'border-yellow-400/20 hover:border-yellow-400/30 hover:bg-white/[0.05]'
          : 'border-white/[0.08] hover:border-white/[0.12] hover:bg-white/[0.04]'
      }`}
    >
      {/* Subtle glow for pending orders */}
      {isPending && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/[0.06] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Receipt className={`size-4 ${statusConfig.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Order Number
                </p>
                <p className="text-white font-semibold text-lg">{order.orderNumber}</p>
              </div>
            </div>
            {order.project && (
              <p className="text-sm text-gray-400 ml-11">Project: {order.project}</p>
            )}
          </div>

          <Badge
            variant="outline"
            className={`${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border} px-3 py-1 text-xs font-medium`}
          >
            {statusConfig.label}
          </Badge>
        </div>

        {/* Amount and Date */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              Amount
            </p>
            <p className="text-white font-bold text-xl">
              {formatCurrency(order.amount || 0)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              <Calendar className="size-3 inline mr-1" />
              Order Date
            </p>
            <p className="text-gray-300 font-medium text-sm">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Line Items Toggle */}
        {hasLineItems && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all duration-200"
            >
              <div className="flex items-center gap-2 text-sm text-gray-300 font-medium">
                <Package className="size-4 text-intelligence-cyan" />
                View Order Details ({order.lineItems?.length} {order.lineItems?.length === 1 ? 'item' : 'items'})
              </div>
              <ChevronDown
                className={`size-4 text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Expanded Line Items */}
            {isExpanded && (
              <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {order.lineItems?.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Quantity: {item.quantity} × {formatCurrency(item.price || 0)}
                        </p>
                      </div>
                      <p className="text-white font-semibold">
                        {formatCurrency((item.quantity || 0) * (item.price || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pay Now Button for Pending Orders */}
        {showPayButton && (
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <PayNowButton
              paymentUrl={order.stripeInvoiceUrl!}
              orderNumber={order.orderNumber}
              amount={order.amount || 0}
            />
          </div>
        )}
      </div>
    </div>
  )
}
