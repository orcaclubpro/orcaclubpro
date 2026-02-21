'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteClientAccount } from '@/actions/clients'

interface Props {
  clientId: string
  clientEmail: string
  clientName: string
}

export function DeleteClientButton({ clientId, clientEmail, clientName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmed = confirmation === clientEmail

  async function handleDelete() {
    if (!confirmed) return
    setLoading(true)
    setError(null)

    const result = await deleteClientAccount({ id: clientId })
    setLoading(false)

    if (result.success) {
      setOpen(false)
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to delete client account')
    }
  }

  function handleOpenChange(val: boolean) {
    if (loading) return
    setOpen(val)
    if (!val) {
      setConfirmation('')
      setError(null)
    }
  }

  return (
    <>
      {/* Trigger — visible on row hover */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 p-1.5 rounded-md text-gray-700 hover:text-red-400 hover:bg-red-400/[0.08] relative z-[3]"
        aria-label={`Delete ${clientName}`}
      >
        <Trash2 className="size-3.5" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-[#111] border border-white/[0.10] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Delete Client Account
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm leading-relaxed pt-1">
              This will permanently delete{' '}
              <span className="text-gray-300 font-medium">{clientName}</span>
              &apos;s account and remove them from Stripe. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-sm">
                Type{' '}
                <span className="text-white font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">
                  {clientEmail}
                </span>{' '}
                to confirm
              </Label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={clientEmail}
                autoComplete="off"
                spellCheck={false}
                className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-gray-700 focus-visible:ring-red-400/30 focus-visible:ring-1 font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && confirmed) handleDelete()
                }}
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-400/[0.05] border border-red-400/[0.18] rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                className="flex-1 border-white/[0.12] text-white hover:bg-white/[0.04]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={!confirmed || loading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-25 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  'Delete Account'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
