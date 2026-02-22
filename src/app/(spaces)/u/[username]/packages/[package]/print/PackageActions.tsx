'use client'

import { useState } from 'react'
import { Printer, FileText, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react'
import { createOrderFromPackage } from '@/actions/packages'

interface PackageActionsProps {
  packageId: string
  isStaff: boolean
  hasLineItems: boolean
}

export function PackageActions({ packageId, isStaff, hasLineItems }: PackageActionsProps) {
  const [invoiceState, setInvoiceState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleCreateInvoice() {
    setInvoiceState('loading')
    setErrorMsg(null)
    const result = await createOrderFromPackage(packageId)
    if (result.success && result.invoiceUrl) {
      setInvoiceState('done')
      setInvoiceUrl(result.invoiceUrl)
      window.open(result.invoiceUrl, '_blank')
    } else {
      setInvoiceState('error')
      setErrorMsg(result.error ?? 'Failed to create invoice')
    }
  }

  return (
    <div className="print:hidden fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Print */}
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111] text-white text-sm font-medium hover:bg-[#1a1a1a] transition-colors shadow-xl border border-white/10"
      >
        <Printer className="size-4" />
        Save as PDF
      </button>

      {/* Create Invoice — staff only */}
      {isStaff && hasLineItems && (
        <>
          {invoiceState === 'done' && invoiceUrl ? (
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors shadow-xl"
            >
              <CheckCircle2 className="size-4" />
              Invoice created
              <ExternalLink className="size-3.5 opacity-70" />
            </a>
          ) : (
            <button
              onClick={handleCreateInvoice}
              disabled={invoiceState === 'loading'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#67e8f9] text-[#080808] text-sm font-semibold hover:bg-[#a5f3fc] transition-colors shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {invoiceState === 'loading' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              {invoiceState === 'loading' ? 'Creating…' : 'Create Invoice'}
            </button>
          )}

          {invoiceState === 'error' && errorMsg && (
            <div className="max-w-[220px] px-3 py-2 rounded-lg bg-red-900/80 border border-red-500/30 text-xs text-red-300 shadow-xl text-right leading-snug">
              {errorMsg}
            </div>
          )}
        </>
      )}
    </div>
  )
}
