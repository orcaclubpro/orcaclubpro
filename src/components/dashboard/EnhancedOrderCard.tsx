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

  const primaryTitle = order.lineItems?.[0]?.title ?? 'Order'
  const extraItems = (order.lineItems?.length ?? 0) - 1
  const projectName =
    order.projectRef && typeof order.projectRef !== 'string'
      ? (order.projectRef as any).name as string
      : null

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-[var(--space-bg-base)] transition-all duration-300 ${
        isPending
          ? 'border-yellow-400/20 hover:border-yellow-400/30 hover:bg-[var(--space-bg-card)]'
          : 'border-[var(--space-border-hard)] hover:border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card-hover)]'
      }`}
    >
      {/* Subtle glow for pending orders */}
      {isPending && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/[0.06] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] shrink-0">
                <Receipt className={`size-4 ${statusConfig.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[var(--space-text-primary)] font-semibold text-lg leading-tight truncate">
                  {primaryTitle}
                  {extraItems > 0 && (
                    <span className="text-sm text-[var(--space-text-muted)] font-normal ml-2">+{extraItems} more</span>
                  )}
                </p>
                {projectName && (
                  <p className="text-xs text-[var(--space-text-muted)] mt-0.5 truncate">{projectName}</p>
                )}
                <p className="text-xs text-[var(--space-text-muted)] mt-0.5">#{order.orderNumber}</p>
              </div>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`shrink-0 ml-3 ${statusConfig.color} ${statusConfig.bg} border ${statusConfig.border} px-3 py-1 text-xs font-medium`}
          >
            {statusConfig.label}
          </Badge>
        </div>

        {/* Amount and Date */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-[var(--space-bg-card)] border border-[var(--space-border-hard)]">
            <p className="text-xs text-[var(--space-text-muted)] uppercase tracking-wider font-medium mb-1">
              Amount
            </p>
            <p className="text-[var(--space-text-primary)] font-bold text-xl">
              {formatCurrency(order.amount || 0)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--space-bg-card)] border border-[var(--space-border-hard)]">
            <p className="text-xs text-[var(--space-text-muted)] uppercase tracking-wider font-medium mb-1">
              <Calendar className="size-3 inline mr-1" />
              Order Date
            </p>
            <p className="text-[var(--space-text-tertiary)] font-medium text-sm">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Line Items Toggle */}
        {hasLineItems && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--space-bg-card)] border border-[var(--space-border-hard)] hover:bg-[var(--space-bg-card-hover)] transition-all duration-200"
            >
              <div className="flex items-center gap-2 text-sm text-[var(--space-text-tertiary)] font-medium">
                <Package className="size-4" style={{ color: 'var(--space-accent)' }} />
                View Order Details ({order.lineItems?.length} {order.lineItems?.length === 1 ? 'item' : 'items'})
              </div>
              <ChevronDown
                className={`size-4 text-[var(--space-text-secondary)] transition-transform duration-200 ${
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
                    className="p-3 rounded-lg bg-[var(--space-bg-card)] border border-[var(--space-border-hard)]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-[var(--space-text-primary)] font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-[var(--space-text-muted)] mt-1">
                          Quantity: {item.quantity} × {formatCurrency(item.price || 0)}
                        </p>
                      </div>
                      <p className="text-[var(--space-text-primary)] font-semibold">
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
          <div className="mt-6 pt-6 border-t border-[var(--space-border-hard)]">
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
