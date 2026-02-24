'use client'

import { useState } from 'react'
import {
  Globe,
  User2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
  FolderKanban,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Badge Colors ─────────────────────────────────────────────────────────────

const BADGE_COLORS = [
  { bg: 'bg-blue-400/10',    border: 'border-blue-400/20',    text: 'text-blue-400'    },
  { bg: 'bg-violet-400/10',  border: 'border-violet-400/20',  text: 'text-violet-400'  },
  { bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', text: 'text-emerald-400' },
  { bg: 'bg-orange-400/10',  border: 'border-orange-400/20',  text: 'text-orange-400'  },
  { bg: 'bg-pink-400/10',    border: 'border-pink-400/20',    text: 'text-pink-400'    },
  { bg: 'bg-amber-400/10',   border: 'border-amber-400/20',   text: 'text-amber-400'   },
  { bg: 'bg-[#67e8f9]/10',   border: 'border-[#67e8f9]/20',   text: 'text-[#67e8f9]'   },
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

interface CredentialWithProject {
  id: string
  title: string
  website?: string | null
  username?: string | null
  password?: string | null
  secrets?: Array<{ id?: string; key: string; value: string }> | null
  project: { id: string; name: string }
}

interface ClientCredentialsTabProps {
  credentials: CredentialWithProject[]
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
      className="size-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-all"
    >
      {copied ? <Check className="size-3 text-[#67e8f9]" /> : <Copy className="size-3" />}
    </button>
  )
}

// ─── Secret Row ───────────────────────────────────────────────────────────────

function SecretRow({ label, value }: { label: string; value: string }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex items-center gap-2 group/row py-1">
      <span className="text-[11px] text-gray-500 flex-[0_0_auto] max-w-[40%] truncate font-mono">
        {label}
      </span>
      <span className="text-[11px] text-gray-700 shrink-0">:</span>
      <span
        className={cn(
          'text-[12px] font-mono text-gray-300 flex-1 min-w-0 truncate',
          !revealed && 'tracking-[0.2em] text-gray-500',
        )}
      >
        {revealed ? value : '••••••••'}
      </span>
      <button
        onClick={() => setRevealed((v) => !v)}
        className="opacity-0 group-hover/row:opacity-100 transition-opacity size-5 flex items-center justify-center text-gray-600 hover:text-gray-300 shrink-0"
      >
        {revealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </button>
      <CopyButton value={value} />
    </div>
  )
}

// ─── Credential Card ──────────────────────────────────────────────────────────

function CredentialCard({ credential }: { credential: CredentialWithProject }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const secrets = credential.secrets?.filter((s) => s.key && s.value) ?? []
  const badge = serviceBadge(credential.title)
  const hasCredentials = credential.username || credential.password || secrets.length > 0
  const projectName =
    typeof credential.project === 'object' && credential.project !== null
      ? (credential.project as { id: string; name: string }).name
      : ''

  return (
    <div className="group relative rounded-lg border border-white/[0.08] bg-[#111111] hover:border-white/[0.13] transition-all duration-150 overflow-hidden">
      {/* Left accent bar */}
      <div className="absolute left-0 inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-[#67e8f9]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="p-4">
        {/* Top row: badge | title + link */}
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
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {credential.title}
            </p>
            {credential.website ? (
              <a
                href={
                  credential.website.startsWith('http')
                    ? credential.website
                    : `https://${credential.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-[#67e8f9] transition-colors mt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="size-2.5 shrink-0" />
                <span className="truncate">{credential.website}</span>
              </a>
            ) : projectName ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-0.5">
                <FolderKanban className="size-3" />
                {projectName}
              </span>
            ) : null}
          </div>
        </div>

        {/* Project badge (shown below website if website also present) */}
        {credential.website && projectName && (
          <div className="mt-1.5 ml-10">
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
              <FolderKanban className="size-3" />
              {projectName}
            </span>
          </div>
        )}

        {/* Divider */}
        {hasCredentials && <div className="h-px bg-white/[0.05] my-2.5" />}

        {/* Username row */}
        {credential.username && (
          <div className="flex items-center gap-2 group/row py-1.5">
            <User2 className="size-3.5 text-gray-600 shrink-0" />
            <span className="flex-1 font-mono text-[13px] text-gray-300 min-w-0 truncate">
              {credential.username}
            </span>
            <CopyButton value={credential.username} />
          </div>
        )}

        {/* Password row */}
        {credential.password && (
          <div className="flex items-center gap-2 group/row py-1.5">
            <Lock className="size-3.5 text-gray-600 shrink-0" />
            <span
              className={cn(
                'flex-1 font-mono text-[13px] min-w-0 truncate',
                showPassword ? 'text-gray-300' : 'tracking-[0.2em] text-gray-500',
              )}
            >
              {showPassword ? credential.password : '••••••••'}
            </span>
            <button
              onClick={() => setShowPassword((v) => !v)}
              className="opacity-0 group-hover/row:opacity-100 transition-opacity size-5 flex items-center justify-center text-gray-600 hover:text-gray-300"
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
              className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-gray-400 transition-colors mt-2.5"
            >
              {showSecrets ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              <span>
                {secrets.length} secret{secrets.length !== 1 ? 's' : ''}
              </span>
            </button>
            {showSecrets && (
              <div className="rounded-md bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 mt-1.5 space-y-1">
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

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ClientCredentialsTab({ credentials }: ClientCredentialsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-white">Accounts</h2>
        <span className="text-[11px] text-gray-600 font-mono tabular-nums bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">
          {credentials.length}
        </span>
      </div>

      {/* Grid or empty state */}
      {credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
            <Lock className="size-5 text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400">No accounts stored yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Credentials added to this client&apos;s projects will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {credentials.map((c) => (
            <CredentialCard key={c.id} credential={c} />
          ))}
        </div>
      )}
    </div>
  )
}
