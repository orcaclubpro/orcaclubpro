'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
  const [proposalName, setProposalName] = useState<string>('')

  const selectedTemplate = templates.find((t) => t.id === selectedId)

  // Sync proposal name when template selection changes
  useEffect(() => {
    if (selectedTemplate) {
      setProposalName(selectedTemplate.name)
    } else {
      setProposalName('')
    }
  }, [selectedId, selectedTemplate])

  const handleOpen = async () => {
    setOpen(true)
    setLoading(true)
    setError(null)
    setSelectedId('')
    setProposalName('')
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
        proposalName: proposalName.trim() || undefined,
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

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpen}
        className="gap-1.5 h-8 text-xs border-[#404040] bg-[#252525] text-[#A0A0A0] hover:bg-[#2D2D2D] hover:text-[#F0F0F0]"
      >
        <Plus className="size-3.5" />
        Assign Package
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-[#1C1C1C] border border-[#404040] text-[#F0F0F0] p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-[#404040]">
            <DialogTitle className="text-base font-semibold text-[#F0F0F0]">Assign Package</DialogTitle>
            <p className="text-xs text-[#4A4A4A] mt-1">Select a package and optionally rename this proposal.</p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 text-[#4A4A4A] animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="p-3 rounded-xl bg-[#252525] border border-[#404040]">
                  <Package className="size-5 text-[#4A4A4A]" />
                </div>
                <p className="text-sm text-[#6B6B6B]">No packages available</p>
                <p className="text-xs text-[#4A4A4A]">Create a package in the admin panel first.</p>
              </div>
            ) : (
              <>
                {/* Template picker */}
                <div className="space-y-2">
                  <Label className="text-xs text-[#6B6B6B]">Select package</Label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {templates.map((t) => {
                      const lineCount = t.lineItems?.length ?? 0
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedId(t.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-150 ${
                            selectedId === t.id
                              ? 'border-[rgba(139,156,182,0.15)] bg-[rgba(139,156,182,0.06)] text-[#F0F0F0]'
                              : 'border-[#404040] bg-[#252525] text-[#A0A0A0] hover:bg-[#2D2D2D] hover:border-[#404040]'
                          }`}
                        >
                          <div className="font-medium text-sm">{t.name}</div>
                          {t.description && (
                            <div className="text-xs text-[#4A4A4A] mt-0.5 truncate">{t.description}</div>
                          )}
                          <div className="text-[10px] text-[#4A4A4A] mt-1">{lineCount} line {lineCount === 1 ? 'item' : 'items'}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Proposal name — shown once a template is picked */}
                {selectedId && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#6B6B6B]">Proposal name</Label>
                    <Input
                      value={proposalName}
                      onChange={e => setProposalName(e.target.value)}
                      placeholder="Enter a name for this proposal…"
                      className="bg-[#252525] border-[#404040] text-[#F0F0F0] placeholder:text-[#4A4A4A] focus-visible:ring-0 focus-visible:border-[rgba(139,156,182,0.15)] h-9 text-sm"
                    />
                    <p className="text-[10px] text-[#4A4A4A]">
                      Defaults to the template name. Rename to personalise for this client.
                    </p>
                  </div>
                )}
              </>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#404040] flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="text-[#6B6B6B] hover:text-[#A0A0A0] hover:bg-[#2D2D2D]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!selectedId || submitting || loading}
              className="bg-[var(--space-accent)] text-black hover:bg-[var(--space-accent)]/90 font-medium gap-1.5"
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
