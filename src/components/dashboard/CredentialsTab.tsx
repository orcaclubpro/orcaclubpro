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
  Lock,
  X,
  ShieldCheck,
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
import { createCredential, updateCredential, deleteCredential, verifyCurrentPassword } from '@/actions/credentials'
import { cn } from '@/lib/utils'

// ─── Badge Colors ─────────────────────────────────────────────────────────────

const BADGE_COLORS = [
  { bg: 'bg-blue-400/10',    border: 'border-blue-400/20',    text: 'text-blue-400'    },
  { bg: 'bg-violet-400/10',  border: 'border-violet-400/20',  text: 'text-violet-400'  },
  { bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', text: 'text-emerald-400' },
  { bg: 'bg-orange-400/10',  border: 'border-orange-400/20',  text: 'text-orange-400'  },
  { bg: 'bg-pink-400/10',    border: 'border-pink-400/20',    text: 'text-pink-400'    },
  { bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   text: 'text-amber-400'   },
  { bg: 'bg-[rgba(139,156,182,0.10)]', border: 'border-[rgba(139,156,182,0.15)]', text: 'text-[#1E3A6E]' },
  { bg: 'bg-red-400/10',     border: 'border-red-400/20',     text: 'text-red-400'     },
]

function serviceBadge(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0
  const color = BADGE_COLORS[hash % BADGE_COLORS.length]
  const initials = title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '??'
  return { ...color, initials }
}

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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation()
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="size-6 flex items-center justify-center rounded text-[#4A4A4A] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-all"
    >
      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
    </button>
  )
}

// ─── Credential Card ──────────────────────────────────────────────────────────

function CredentialCard({
  credential,
  readOnly,
  canDelete = true,
  onEdit,
  onDelete,
}: {
  credential: Credential
  readOnly: boolean
  canDelete?: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const secrets = credential.secrets?.filter((s) => s.key && s.value) ?? []
  const badge = serviceBadge(credential.title)
  const hasCredentials = credential.username || credential.password || secrets.length > 0

  return (
    <div className="group relative rounded-lg border border-[#404040] bg-[#1C1C1C] hover:border-[#404040] transition-all duration-150 overflow-hidden">
      {/* Left accent bar */}
      <div className="absolute left-0 inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-[#1E3A6E]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="p-4">
        {/* Top row: badge | title + link | edit/delete */}
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              'size-8 rounded-md flex items-center justify-center text-xs font-bold border shrink-0',
              badge.bg,
              badge.border,
              badge.text,
            )}
          >
            {badge.initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F0F0F0] truncate leading-tight">
              {credential.title}
            </p>
            {credential.website && (
              <a
                href={
                  credential.website.startsWith('http')
                    ? credential.website
                    : `https://${credential.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#4A4A4A] hover:text-[#F0F0F0] transition-colors mt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="size-2.5 shrink-0" />
                <span className="truncate">{credential.website}</span>
              </a>
            )}
          </div>

          {!readOnly && (
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={onEdit}
                className="size-6 flex items-center justify-center rounded text-[#4A4A4A] hover:text-[#A0A0A0] hover:bg-[#2D2D2D] transition-colors"
              >
                <Pencil className="size-3" />
              </button>
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="size-6 flex items-center justify-center rounded text-[#4A4A4A] hover:text-red-400 hover:bg-red-400/[0.08] transition-colors"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        {hasCredentials && <div className="h-px bg-[#333333] my-2.5" />}

        {/* Username row */}
        {credential.username && (
          <div className="flex items-center gap-2 group/row py-1.5">
            <User2 className="size-3.5 text-[#4A4A4A] shrink-0" />
            <span className="flex-1 font-mono text-[13px] text-[#A0A0A0] min-w-0 truncate">
              {credential.username}
            </span>
            <CopyButton value={credential.username} />
          </div>
        )}

        {/* Password row */}
        {credential.password && (
          <div className="flex items-center gap-2 group/row py-1.5">
            <Lock className="size-3.5 text-[#4A4A4A] shrink-0" />
            <span
              className={cn(
                'flex-1 font-mono text-[13px] min-w-0 truncate',
                showPassword ? 'text-[#A0A0A0]' : 'tracking-[0.2em] text-[#6B6B6B]',
              )}
            >
              {showPassword ? credential.password : '••••••••'}
            </span>
            <button
              onClick={() => setShowPassword((v) => !v)}
              className="opacity-0 group-hover/row:opacity-100 transition-opacity size-5 flex items-center justify-center text-[#4A4A4A] hover:text-[#A0A0A0]"
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
              className="flex items-center gap-1.5 text-[11px] text-[#4A4A4A] hover:text-[#6B6B6B] transition-colors mt-2.5"
            >
              {showSecrets ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              <span>
                {secrets.length} secret{secrets.length !== 1 ? 's' : ''}
              </span>
            </button>
            {showSecrets && (
              <div className="rounded-md bg-[#252525] border border-[#404040] px-3 py-1.5 mt-1.5 space-y-1">
                {secrets.map((secret, i) => (
                  <SecretRow key={i} label={secret.key} value={secret.value} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Secret Row ───────────────────────────────────────────────────────────────

function SecretRow({ label, value }: { label: string; value: string }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex items-center gap-2 group/row py-1">
      <span className="text-[11px] text-[#6B6B6B] flex-[0_0_auto] max-w-[40%] truncate font-mono">
        {label}
      </span>
      <span className="text-[11px] text-[#4A4A4A] shrink-0">:</span>
      <span
        className={cn(
          'text-[12px] font-mono text-[#A0A0A0] flex-1 min-w-0 truncate',
          !revealed && 'tracking-[0.2em] text-[#6B6B6B]',
        )}
      >
        {revealed ? value : '••••••••'}
      </span>
      <button
        onClick={() => setRevealed((v) => !v)}
        className="opacity-0 group-hover/row:opacity-100 transition-opacity size-5 flex items-center justify-center text-[#4A4A4A] hover:text-[#A0A0A0] shrink-0"
      >
        {revealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </button>
      <CopyButton value={value} />
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
      <DialogContent className="bg-[#1C1C1C] border-[#404040] sm:max-w-[480px] p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">
          {isEditing ? 'Edit Credential' : 'New Credential'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isEditing ? 'Update an existing credential' : 'Add a new credential to this project'}
        </DialogDescription>

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#404040]">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.10)] flex items-center justify-center">
              <KeyRound className="size-4 text-[#1E3A6E]" />
            </div>
            <h2 className="text-base font-semibold text-[#F0F0F0]">
              {isEditing ? 'Edit Credential' : 'New Credential'}
            </h2>
          </div>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6B6B6B]">
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              autoFocus
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="WordPress Admin, AWS Console..."
              className="bg-[#252525] border-[#404040] focus:border-[#404040] text-sm text-[#F0F0F0]"
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6B6B6B]">Website URL</Label>
            <Input
              value={form.website}
              onChange={(e) => setField('website', e.target.value)}
              placeholder="https://example.com/wp-admin"
              className="bg-[#252525] border-[#404040] focus:border-[#404040] text-sm text-[#F0F0F0]"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6B6B6B]">Username / Email</Label>
            <Input
              value={form.username}
              onChange={(e) => setField('username', e.target.value)}
              placeholder="admin@example.com"
              autoComplete="off"
              className="bg-[#252525] border-[#404040] focus:border-[#404040] text-sm text-[#F0F0F0]"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6B6B6B]">Password</Label>
            <div className="relative">
              <Input
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                type={form.showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className="bg-[#252525] border-[#404040] focus:border-[#404040] text-sm text-[#F0F0F0] pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setField('showPassword', !form.showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4A4A] hover:text-[#6B6B6B] transition-colors"
              >
                {form.showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Secrets */}
          <div className="space-y-2 border-t border-[#404040] pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-[#6B6B6B]">Secrets</Label>
              <button
                type="button"
                onClick={addSecret}
                className="flex items-center gap-1 text-xs text-[#1E3A6E] hover:text-[#1E3A6E]/70 transition-colors"
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
                      className="bg-[#252525] border-[#404040] focus:border-[#404040] text-xs flex-[2] font-mono text-[#F0F0F0]"
                    />
                    <Input
                      value={secret.value}
                      onChange={(e) => updateSecret(i, 'value', e.target.value)}
                      placeholder="value..."
                      className="bg-[#252525] border-[#404040] focus:border-[#404040] text-xs flex-[3] font-mono text-[#F0F0F0]"
                    />
                    <button
                      type="button"
                      onClick={() => removeSecret(i)}
                      className="size-9 flex items-center justify-center text-[#4A4A4A] hover:text-red-400 transition-colors shrink-0"
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#404040]">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-[#6B6B6B] hover:text-[#A0A0A0]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.title.trim()}
            className="bg-[#333333] text-[#F0F0F0] hover:bg-[#404040] font-semibold disabled:opacity-40"
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
      <DialogContent className="bg-[#1C1C1C] border-[#404040] sm:max-w-[400px] p-6 gap-4">
        <DialogTitle className="text-base font-semibold text-[#F0F0F0]">Delete credential?</DialogTitle>
        <DialogDescription className="text-sm text-[#6B6B6B]">
          <span className="text-[#A0A0A0] font-medium">{credentialTitle}</span> will be permanently
          deleted. This cannot be undone.
        </DialogDescription>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-[#6B6B6B] hover:text-[#A0A0A0]"
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

// ─── Vault Lock Gate ──────────────────────────────────────────────────────────

function VaultLockGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUnlock = async () => {
    if (!password) return
    setLoading(true)
    setError(null)
    const result = await verifyCurrentPassword(password)
    setLoading(false)
    if (result.success) {
      onUnlock()
    } else {
      setError(result.error ?? 'Incorrect password')
      setPassword('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="flex flex-col items-center gap-3">
        <div className="size-14 rounded-2xl bg-[#252525] border border-[#404040] flex items-center justify-center">
          <Lock className="size-6 text-[#4A4A4A]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#F0F0F0]">Vault Locked</p>
          <p className="text-xs text-[#4A4A4A] mt-1">Enter your account password to access stored credentials.</p>
        </div>
      </div>

      <div className="w-full max-w-[280px] space-y-3">
        <div className="relative">
          <Input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="Account password"
            autoFocus
            autoComplete="current-password"
            className="bg-[#252525] border-[#404040] focus:border-[#404040] text-sm text-[#F0F0F0] pr-10 font-mono"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A4A4A] hover:text-[#6B6B6B] transition-colors"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400 text-center">{error}</p>
        )}

        <Button
          onClick={handleUnlock}
          disabled={!password || loading}
          className="w-full bg-[#333333] text-[#F0F0F0] hover:bg-[#404040] font-semibold disabled:opacity-40"
        >
          {loading
            ? <><Loader2 className="size-4 mr-2 animate-spin" /> Verifying…</>
            : <><ShieldCheck className="size-4 mr-2" /> Unlock Vault</>
          }
        </Button>
      </div>
    </div>
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

  // Vault lock — all users must confirm their password to access credential data
  const [unlocked, setUnlocked] = useState(false)

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

  // clients can edit credentials but not create or delete
  const canEdit = true
  const canCreate = !readOnly
  const canDelete = !readOnly

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-[#F0F0F0]">Accounts</h2>
        <span className="text-[11px] text-[#4A4A4A] font-mono tabular-nums bg-[#252525] border border-[#404040] rounded px-1.5 py-0.5">
          {credentials.length}
        </span>
        {unlocked && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-500/70 font-medium ml-1">
            <ShieldCheck className="size-3" /> Unlocked
          </span>
        )}
        {canCreate && unlocked && (
          <Button
            onClick={openCreate}
            className="ml-auto h-7 px-3 bg-[#252525] border border-[#404040] hover:bg-[#2D2D2D] text-[#F0F0F0] text-xs font-medium"
          >
            <Plus className="size-3.5 mr-1.5" /> Add Account
          </Button>
        )}
      </div>

      {/* Vault gate or content */}
      {!unlocked ? (
        <VaultLockGate onUnlock={() => setUnlocked(true)} />
      ) : credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-10 rounded-xl bg-[#252525] border border-[#404040] flex items-center justify-center mb-3">
            <Lock className="size-5 text-[#4A4A4A]" />
          </div>
          <p className="text-sm font-medium text-[#6B6B6B]">No accounts stored yet</p>
          {canCreate && (
            <p className="text-xs text-[#4A4A4A] mt-1">
              Add logins, API keys, and secrets for this project.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {credentials.map((c) => (
            <CredentialCard
              key={c.id}
              credential={c}
              readOnly={!canEdit}
              canDelete={canDelete}
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
