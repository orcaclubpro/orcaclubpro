'use client'

import { ExternalLink, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PayNowButtonProps {
  paymentUrl: string
  orderNumber: string
  amount: number
}

export function PayNowButton({ paymentUrl, orderNumber, amount }: PayNowButtonProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const handlePayment = () => {
    // Open Stripe hosted invoice in new tab
    window.open(paymentUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      onClick={handlePayment}
      className="group bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium shadow-lg shadow-intelligence-cyan/20 hover:shadow-intelligence-cyan/30 transition-all duration-300 hover:scale-105"
      size="lg"
    >
      <CreditCard className="size-4 mr-2 group-hover:scale-110 transition-transform" />
      Pay {formatCurrency(amount)}
      <ExternalLink className="size-3 ml-2 opacity-70" />
    </Button>
  )
}
