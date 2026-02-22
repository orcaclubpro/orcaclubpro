'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { getPackageTemplates, assignPackageToClient } from '@/actions/packages'

interface Template {
  id: string
  name: string
  description?: string | null
  lineItems?: any[]
}

interface AssignPackageModalProps {
  clientId: string
}

export function AssignPackageModal({ clientId }: AssignPackageModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string>('')

  const handleOpen = async () => {
    setOpen(true)
    setLoading(true)
    setError(null)
    setSelectedId('')
    try {
      const result = await getPackageTemplates()
      if (result.success) {
        setTemplates(result.templates as Template[])
      } else {
        setError(result.error ?? 'Failed to load packages')
      }
    } catch {
      setError('Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedId) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await assignPackageToClient({
        packageId: selectedId,
        clientAccountId: clientId,
      })
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to assign package')
      }
    } catch {
      setError('Failed to assign package')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTemplate = templates.find((t) => t.id === selectedId)

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpen}
        className="gap-1.5 h-8 text-xs border-white/[0.12] bg-white/[0.03] text-gray-300 hover:bg-white/[0.06] hover:text-white"
      >
        <Plus className="size-3.5" />
        Assign Package
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-[#111] border border-white/[0.12] text-white p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-white/[0.08]">
            <DialogTitle className="text-base font-semibold text-white">Assign Package</DialogTitle>
            <p className="text-xs text-gray-500 mt-1">Select a package to assign to this client.</p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 text-gray-500 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <Package className="size-5 text-gray-500" />
                </div>
                <p className="text-sm text-gray-400">No packages available</p>
                <p className="text-xs text-gray-600">Create a package in the admin panel first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Select package</Label>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {templates.map((t) => {
                    const lineCount = t.lineItems?.length ?? 0
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-150 ${
                          selectedId === t.id
                            ? 'border-intelligence-cyan/50 bg-intelligence-cyan/[0.06] text-white'
                            : 'border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.05] hover:border-white/[0.15]'
                        }`}
                      >
                        <div className="font-medium text-sm">{t.name}</div>
                        {t.description && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">{t.description}</div>
                        )}
                        <div className="text-[10px] text-gray-600 mt-1">{lineCount} line {lineCount === 1 ? 'item' : 'items'}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!selectedId || submitting || loading}
              className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-medium gap-1.5"
            >
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Assign Package
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
