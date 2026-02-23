'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Globe,
  User2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Loader2,
  KeyRound,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCredential, updateCredential, deleteCredential } from '@/actions/credentials'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CredentialSecret {
  id?: string
  key: string
  value: string
}

export interface Credential {
  id: string
  title: string
  project: string | { id: string }
  website?: string | null
  username?: string | null
  password?: string | null
  secrets?: CredentialSecret[] | null
  createdAt: string
  updatedAt: string
}

interface CredentialsTabProps {
  credentials: Credential[]
  projectId: string
  username: string
  readOnly?: boolean
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center justify-center size-6 rounded hover:bg-white/[0.08] text-gray-500 hover:text-gray-300 transition-colors',
        className,
      )}
    >
      {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
    </button>
  )
}

// ─── Secret Row ───────────────────────────────────────────────────────────────

function SecretRow({ label, value }: { label: string; value: string }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex items-center gap-2 py-1.5 group border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-gray-500 flex-[0_0_auto] max-w-[40%] truncate">{label}</span>
      <span className="text-xs text-gray-600 shrink-0">:</span>
      <span
        className={cn(
          'text-xs font-mono text-gray-300 flex-1 min-w-0 truncate',
          !revealed && 'tracking-widest',
        )}
      >
        {revealed ? value : '••••••••'}
      </span>
      <button
        onClick={() => setRevealed((v) => !v)}
        className="opacity-0 group-hover:opacity-100 transition-opacity size-5 flex items-center justify-center text-gray-500 hover:text-gray-300 shrink-0"
      >
        {revealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </button>
      <CopyButton value={value} />
    </div>
  )
}

// ─── Credential Card ──────────────────────────────────────────────────────────

function CredentialCard({
  credential,
  readOnly,
  onEdit,
  onDelete,
}: {
  credential: Credential
  readOnly: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const secrets = credential.secrets?.filter((s) => s.key && s.value) ?? []

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex flex-col gap-3 hover:border-white/[0.12] transition-colors">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-intelligence-cyan/[0.08] border border-intelligence-cyan/[0.15] flex items-center justify-center shrink-0">
            <KeyRound className="size-4 text-intelligence-cyan" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{credential.title}</p>
            {credential.website && (
              <a
                href={
                  credential.website.startsWith('http')
                    ? credential.website
                    : `https://${credential.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-intelligence-cyan transition-colors mt-0.5"
              >
                <Globe className="size-3 shrink-0" />
                <span className="truncate">{credential.website}</span>
              </a>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={onEdit}
              className="size-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] transition-colors"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="size-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/[0.08] transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {(credential.username || credential.password || secrets.length > 0) && (
        <div className="h-px bg-white/[0.05]" />
      )}

      {/* Username */}
      {credential.username && (
        <div className="flex items-center gap-2">
          <User2 className="size-3.5 text-gray-600 shrink-0" />
          <span className="text-xs text-gray-400 flex-1 font-mono truncate min-w-0">
            {credential.username}
          </span>
          <CopyButton value={credential.username} />
        </div>
      )}

      {/* Password */}
      {credential.password && (
        <div className="flex items-center gap-2">
          <KeyRound className="size-3.5 text-gray-600 shrink-0" />
          <span
            className={cn(
              'text-xs flex-1 font-mono text-gray-400 truncate min-w-0',
              !showPassword && 'tracking-widest',
            )}
          >
            {showPassword ? credential.password : '••••••••'}
          </span>
          <button
            onClick={() => setShowPassword((v) => !v)}
            className="size-6 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors shrink-0"
          >
            {showPassword ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          </button>
          <CopyButton value={credential.password} />
        </div>
      )}

      {/* Secrets collapsible */}
      {secrets.length > 0 && (
        <div>
          <button
            onClick={() => setShowSecrets((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showSecrets ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            <span>
              {secrets.length} secret{secrets.length !== 1 ? 's' : ''}
            </span>
          </button>
          {showSecrets && (
            <div className="mt-2 rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 py-1">
              {secrets.map((secret, i) => (
                <SecretRow key={i} label={secret.key} value={secret.value} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Form State ───────────────────────────────────────────────────────────────

interface FormState {
  title: string
  website: string
  username: string
  password: string
  showPassword: boolean
  secrets: Array<{ key: string; value: string }>
}

const EMPTY_FORM: FormState = {
  title: '',
  website: '',
  username: '',
  password: '',
  showPassword: false,
  secrets: [],
}

function credentialToForm(c: Credential): FormState {
  return {
    title: c.title,
    website: c.website ?? '',
    username: c.username ?? '',
    password: c.password ?? '',
    showPassword: false,
    secrets: (c.secrets ?? [])
      .filter((s) => s.key && s.value)
      .map(({ key, value }) => ({ key, value })),
  }
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function CredentialFormModal({
  open,
  onOpenChange,
  projectId,
  editingCredential,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  editingCredential: Credential | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  // Initialise form whenever the modal opens
  useEffect(() => {
    if (open) {
      setForm(editingCredential ? credentialToForm(editingCredential) : EMPTY_FORM)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const addSecret = () =>
    setForm((f) => ({ ...f, secrets: [...f.secrets, { key: '', value: '' }] }))

  const removeSecret = (i: number) =>
    setForm((f) => ({ ...f, secrets: f.secrets.filter((_, idx) => idx !== i) }))

  const updateSecret = (i: number, field: 'key' | 'value', value: string) => {
    setForm((f) => {
      const secrets = [...f.secrets]
      secrets[i] = { ...secrets[i], [field]: value }
      return { ...f, secrets }
    })
  }

  const handleSubmit = () => {
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    setError(null)
    startTransition(async () => {
      const data = {
        projectId,
        title: form.title.trim(),
        website: form.website.trim() || undefined,
        username: form.username.trim() || undefined,
        password: form.password || undefined,
        secrets: form.secrets.filter((s) => s.key.trim() && s.value.trim()),
      }

      const result = editingCredential
        ? await updateCredential(editingCredential.id, data)
        : await createCredential(data)

      if (!result.success) {
        setError(result.error ?? 'Something went wrong.')
        return
      }

      onOpenChange(false)
      router.refresh()
    })
  }

  const isEditing = Boolean(editingCredential)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/[0.08] sm:max-w-[480px] p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">
          {isEditing ? 'Edit Credential' : 'New Credential'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isEditing ? 'Update an existing credential' : 'Add a new credential to this project'}
        </DialogDescription>

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-intelligence-cyan/[0.08] border border-intelligence-cyan/[0.15] flex items-center justify-center">
              <KeyRound className="size-4 text-intelligence-cyan" />
            </div>
            <h2 className="text-base font-semibold text-white">
              {isEditing ? 'Edit Credential' : 'New Credential'}
            </h2>
          </div>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              autoFocus
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="WordPress Admin, AWS Console..."
              className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/40 text-sm"
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Website URL</Label>
            <Input
              value={form.website}
              onChange={(e) => setField('website', e.target.value)}
              placeholder="https://example.com/wp-admin"
              className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/40 text-sm"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Username / Email</Label>
            <Input
              value={form.username}
              onChange={(e) => setField('username', e.target.value)}
              placeholder="admin@example.com"
              autoComplete="off"
              className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/40 text-sm"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Password</Label>
            <div className="relative">
              <Input
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                type={form.showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/40 text-sm pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setField('showPassword', !form.showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {form.showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Secrets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-400">Secrets</Label>
              <button
                type="button"
                onClick={addSecret}
                className="flex items-center gap-1 text-xs text-intelligence-cyan hover:text-intelligence-cyan/70 transition-colors"
              >
                <Plus className="size-3" /> Add secret
              </button>
            </div>
            {form.secrets.length > 0 && (
              <div className="space-y-2">
                {form.secrets.map((secret, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={secret.key}
                      onChange={(e) => updateSecret(i, 'key', e.target.value)}
                      placeholder="KEY_NAME"
                      className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/40 text-xs flex-[2] font-mono"
                    />
                    <Input
                      value={secret.value}
                      onChange={(e) => updateSecret(i, 'value', e.target.value)}
                      placeholder="value..."
                      className="bg-white/[0.03] border-white/[0.08] text-white focus:border-intelligence-cyan/40 text-xs flex-[3] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeSecret(i)}
                      className="size-9 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-1 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.title.trim()}
            className="bg-intelligence-cyan text-black hover:bg-intelligence-cyan/90 font-semibold disabled:opacity-40"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                {isEditing ? 'Saving...' : 'Adding...'}
              </>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Add Credential'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  open,
  onOpenChange,
  credentialTitle,
  onConfirm,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  credentialTitle: string
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/[0.08] sm:max-w-[400px] p-6 gap-4">
        <DialogTitle className="text-base font-semibold text-white">Delete credential?</DialogTitle>
        <DialogDescription className="text-sm text-gray-400">
          <span className="text-gray-200 font-medium">{credentialTitle}</span> will be permanently
          deleted. This cannot be undone.
        </DialogDescription>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-200"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-red-500/90 text-white hover:bg-red-500 font-semibold"
          >
            {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function CredentialsTab({
  credentials,
  projectId,
  username,
  readOnly = false,
}: CredentialsTabProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [formOpen, setFormOpen] = useState(false)
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingCredential, setDeletingCredential] = useState<Credential | null>(null)

  const openCreate = () => {
    setEditingCredential(null)
    setFormOpen(true)
  }

  const openEdit = (c: Credential) => {
    setEditingCredential(c)
    setFormOpen(true)
  }

  const openDelete = (c: Credential) => {
    setDeletingCredential(c)
    setDeleteOpen(true)
  }

  const handleDelete = () => {
    if (!deletingCredential) return
    startTransition(async () => {
      await deleteCredential(deletingCredential.id)
      setDeleteOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Accounts</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Passwords and secrets are encrypted at rest.
          </p>
        </div>
        {!readOnly && (
          <Button
            onClick={openCreate}
            className="h-8 px-3 bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.10] text-white text-sm font-medium"
          >
            <Plus className="size-4 mr-1.5" /> Add Credential
          </Button>
        )}
      </div>

      {/* Grid or empty state */}
      {credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
            <KeyRound className="size-6 text-gray-600" />
          </div>
          <p className="text-sm text-gray-400">No credentials yet</p>
          {!readOnly && (
            <p className="text-xs text-gray-600 mt-1">
              Add logins, API keys, and secrets for this project.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {credentials.map((c) => (
            <CredentialCard
              key={c.id}
              credential={c}
              readOnly={readOnly}
              onEdit={() => openEdit(c)}
              onDelete={() => openDelete(c)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <CredentialFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        projectId={projectId}
        editingCredential={editingCredential}
      />

      {/* Delete confirm modal */}
      <DeleteConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        credentialTitle={deletingCredential?.title ?? ''}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  )
}
