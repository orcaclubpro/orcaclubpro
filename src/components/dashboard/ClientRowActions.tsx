'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClientAccount, deleteClientAccount } from '@/actions/clients'

interface Props {
  clientId: string
  clientName: string
  clientEmail: string
  firstName: string
  lastName: string
  company?: string | null
}

type ActiveModal = 'edit' | 'delete' | null

export function ClientRowActions({
  clientId,
  clientName,
  clientEmail,
  firstName,
  lastName,
  company,
}: Props) {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit form
  const [form, setForm] = useState({
    name: clientName,
    firstName,
    lastName,
    company: company ?? '',
  })

  // Delete confirmation
  const [deleteInput, setDeleteInput] = useState('')
  const deleteConfirmed = deleteInput === clientEmail

  function openEdit() {
    setForm({ name: clientName, firstName, lastName, company: company ?? '' })
    setError(null)
    setActiveModal('edit')
  }

  function openDelete() {
    setDeleteInput('')
    setError(null)
    setActiveModal('delete')
  }

  function closeModal() {
    if (loading) return
    setActiveModal(null)
    setError(null)
  }

  async function handleEdit() {
    setLoading(true)
    setError(null)
    const result = await updateClientAccount({
      id: clientId,
      name: form.name,
      firstName: form.firstName,
      lastName: form.lastName,
      company: form.company || undefined,
    })
    setLoading(false)
    if (result.success) {
      setActiveModal(null)
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to update')
    }
  }

  async function handleDelete() {
    if (!deleteConfirmed) return
    setLoading(true)
    setError(null)
    const result = await deleteClientAccount({ id: clientId })
    setLoading(false)
    if (result.success) {
      setActiveModal(null)
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to delete')
    }
  }

  return (
    <>
      {/* ── 3-dot trigger ── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 p-1.5 rounded-md text-gray-600 hover:text-white hover:bg-white/[0.08] relative z-[3]"
            aria-label={`Actions for ${clientName}`}
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="bg-[#1c1c1c] border border-white/[0.10] text-white min-w-[140px] shadow-xl"
          // Prevent the portal click from propagating to the row link
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onClick={() => openEdit()}
            className="gap-2 text-sm text-gray-300 hover:text-white focus:text-white cursor-pointer"
          >
            <Pencil className="size-3.5 shrink-0" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-white/[0.06]" />

          <DropdownMenuItem
            onClick={() => openDelete()}
            className="gap-2 text-sm text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
          >
            <Trash2 className="size-3.5 shrink-0" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Edit modal ── */}
      <Dialog open={activeModal === 'edit'} onOpenChange={(v) => !v && closeModal()}>
        <DialogContent className="bg-[#111] border border-white/[0.10] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Edit Client</DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              Update account details for{' '}
              <span className="text-gray-300 font-medium">{clientName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">
                  First Name
                </Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((f) => ({ ...f, firstName: val, name: `${val} ${f.lastName}`.trim() }))
                  }}
                  className="bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">
                  Last Name
                </Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm((f) => ({ ...f, lastName: val, name: `${f.firstName} ${val}`.trim() }))
                  }}
                  className="bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">
                Display Name
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-white/[0.04] border-white/[0.08] text-white focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">
                Company
              </Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Optional"
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-700 focus-visible:ring-[#67e8f9]/30 focus-visible:ring-1"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/[0.05] border border-red-400/[0.18] rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={loading}
                className="flex-1 border-white/[0.12] text-white hover:bg-white/[0.04]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={loading}
                className="flex-1 bg-[#67e8f9] hover:bg-[#67e8f9]/90 text-black font-semibold"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete modal ── */}
      <Dialog open={activeModal === 'delete'} onOpenChange={(v) => !v && closeModal()}>
        <DialogContent className="bg-[#111] border border-white/[0.10] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Delete Client Account</DialogTitle>
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
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={clientEmail}
                autoComplete="off"
                spellCheck={false}
                className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-gray-700 focus-visible:ring-red-400/30 focus-visible:ring-1 font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deleteConfirmed) handleDelete()
                }}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/[0.05] border border-red-400/[0.18] rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={loading}
                className="flex-1 border-white/[0.12] text-white hover:bg-white/[0.04]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={!deleteConfirmed || loading}
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
