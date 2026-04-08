'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X, KeyRound, ChevronDown, Fingerprint, ShieldCheck, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { startRegistration } from '@simplewebauthn/browser'
import { updateUserProfile, changeUserPassword } from '@/actions/profile'

interface PasskeyCredential {
  id: string
  credentialID: string
  deviceName: string
  registeredAt?: string
  credentialDeviceType?: string
  credentialBackedUp?: boolean
}

interface UserSettingsModalProps {
  name: string
  email: string
  title?: string | null
  role?: string | null
}

const PANEL_BG = '#1C1C1C'
const fieldClass =
  'w-full h-9 rounded-lg px-3 text-sm text-[var(--space-text-primary)] placeholder:text-[var(--space-text-muted)] outline-none transition-colors duration-150 border border-[var(--space-border-hard)] focus:border-[rgba(139,156,182,0.15)] bg-[var(--space-bg-card)] focus:bg-[var(--space-bg-card-hover)]'

export function UserSettingsModal({ name, email, title, role }: UserSettingsModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const isClient = role === 'client'

  // Profile form
  const [form, setForm] = useState({ name, email, title: title ?? '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  // Password form
  const [showPassword, setShowPassword] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)

  // Passkey state
  const [passkeys, setPasskeys] = useState<PasskeyCredential[] | null>(null)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [addingPasskey, setAddingPasskey] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, profileLoading, pwLoading])

  async function fetchPasskeys() {
    setPasskeyLoading(true)
    setPasskeyError(null)
    try {
      const res = await fetch('/api/auth/passkey/credentials')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load passkeys')
      setPasskeys(data.credentials)
    } catch (err: any) {
      setPasskeyError(err.message || 'Failed to load passkeys')
      setPasskeys([])
    } finally {
      setPasskeyLoading(false)
    }
  }

  function handleOpen() {
    setForm({ name, email, title: title ?? '' })
    setProfileError(null); setProfileSaved(false)
    setPw({ current: '', next: '', confirm: '' })
    setPwError(null); setPwSaved(false)
    setShowPassword(false)
    setPasskeyError(null)
    setOpen(true)
    fetchPasskeys()
  }

  function handleClose() {
    if (profileLoading || pwLoading) return
    setVisible(false)
    setTimeout(() => setOpen(false), 300)
  }

  async function handleSaveProfile() {
    if (!form.name.trim()) { setProfileError('Name is required'); return }
    if (!form.email.trim()) { setProfileError('Email is required'); return }
    setProfileLoading(true)
    setProfileError(null)
    const result = await updateUserProfile({ name: form.name, email: form.email, title: form.title })
    setProfileLoading(false)
    if (result.success) {
      setProfileSaved(true)
      router.refresh()
      setTimeout(() => setProfileSaved(false), 2000)
    } else {
      setProfileError(result.error ?? 'Failed to update')
    }
  }

  async function handleChangePassword() {
    if (!pw.current) { setPwError('Current password is required'); return }
    if (pw.next.length < 8) { setPwError('New password must be at least 8 characters'); return }
    if (pw.next !== pw.confirm) { setPwError('Passwords do not match'); return }
    setPwLoading(true)
    setPwError(null)
    const result = await changeUserPassword({ currentPassword: pw.current, newPassword: pw.next })
    setPwLoading(false)
    if (result.success) {
      setPwSaved(true)
      setPw({ current: '', next: '', confirm: '' })
      setTimeout(() => { setPwSaved(false); setShowPassword(false) }, 2000)
    } else {
      setPwError(result.error ?? 'Failed to change password')
    }
  }

  async function handleAddPasskey() {
    setAddingPasskey(true)
    setPasskeyError(null)
    try {
      const optRes = await fetch('/api/auth/passkey/register-options', { method: 'POST' })
      if (!optRes.ok) throw new Error('Failed to get registration options')
      const { options } = await optRes.json()
      const credential = await startRegistration({ optionsJSON: options })
      const deviceName = (typeof window !== 'undefined'
        ? window.prompt('Name this passkey (e.g. "MacBook Touch ID"):', 'My Passkey')
        : null) ?? 'My Passkey'
      const verifyRes = await fetch('/api/auth/passkey/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, deviceName }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.error || 'Verification failed')
      await fetchPasskeys()
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError' && err?.name !== 'AbortError') {
        setPasskeyError(err.message || 'Failed to add passkey')
      }
    } finally {
      setAddingPasskey(false)
    }
  }

  async function handleDeletePasskey(credentialID: string) {
    if (!window.confirm('Remove this passkey? You can always add it again.')) return
    setDeletingId(credentialID)
    setPasskeyError(null)
    try {
      const res = await fetch(`/api/auth/passkey/credentials?credentialID=${encodeURIComponent(credentialID)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to remove passkey')
      setPasskeys(prev => prev?.filter(p => p.credentialID !== credentialID) ?? [])
    } catch (err: any) {
      setPasskeyError(err.message || 'Failed to remove passkey')
    } finally {
      setDeletingId(null)
    }
  }

  function fmtDate(dateStr?: string) {
    if (!dateStr) return ''
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
    catch { return '' }
  }

  const initial = (name || email || '?')[0].toUpperCase()

  return (
    <>
      <button
        onClick={handleOpen}
        className="group flex items-center justify-center w-12 h-12 rounded-lg hover:bg-[var(--space-bg-card-hover)] transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(139,156,182,0.15)]"
        aria-label="Profile"
      >
        <Image
          src="/orcaclubpro.png"
          alt="Profile"
          width={48}
          height={48}
          className="opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200"
        />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] transition-all duration-300"
            style={{
              background: visible ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0)',
            }}
            onClick={handleClose}
          />

          {/* Panel — the panel itself scrolls; header is sticky */}
          <div
            className="fixed top-0 right-0 bottom-0 z-[61] w-full sm:w-[380px] overflow-y-auto border-l border-[var(--space-border-hard)]"
            style={{
              background: PANEL_BG,
              transform: visible ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Header — sticky so it stays while scrolling */}
            <div className="sticky top-0 z-10 px-6 pt-8 pb-5 border-b border-[var(--space-border-hard)]" style={{ background: PANEL_BG }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 bg-[rgba(139,156,182,0.06)] border border-[rgba(139,156,182,0.15)]" style={{ color: 'var(--space-accent)' }}>
                    {initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--space-text-primary)] leading-tight">{name || email}</p>
                    <p className="text-[11px] text-[var(--space-text-muted)] mt-0.5 tracking-wide">Account Settings</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={profileLoading || pwLoading}
                  className="text-[var(--space-text-muted)] hover:text-[var(--space-text-tertiary)] transition-colors p-1.5 rounded-md hover:bg-[var(--space-bg-card-hover)] disabled:opacity-40"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Form body */}
            <div>

              {/* ── Profile section — admin/staff only ── */}
              {!isClient && <div className="px-6 py-6 space-y-4 border-b border-[var(--space-border-hard)]">
                <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--space-text-muted)] font-semibold">Profile</p>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[var(--space-text-secondary)]">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[var(--space-text-secondary)]">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[var(--space-text-secondary)]">Team Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Lead Developer"
                    className={fieldClass}
                  />
                  <p className="text-[10px] text-[var(--space-text-muted)]">Shown to clients on their team view</p>
                </div>

                {profileError && (
                  <div className="text-xs text-red-400 bg-red-400/[0.07] border border-red-400/20 rounded-lg px-3 py-2">
                    {profileError}
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={profileLoading || profileSaved}
                  className="w-full flex items-center justify-center gap-1.5 h-9 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-60 bg-[var(--space-accent)] hover:bg-[var(--space-accent)]/90 text-black"
                >
                  {profileSaved ? (
                    <><Check className="size-3.5" />Saved</>
                  ) : profileLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>}

              {/* ── Password section ── */}
              <div className="px-6 py-5">
                <button
                  onClick={() => { setShowPassword(!showPassword); setPwError(null); setPwSaved(false) }}
                  className="flex items-center justify-between w-full group"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-3.5 text-[var(--space-text-muted)]" />
                    <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--space-text-muted)] font-semibold">Change Password</p>
                  </div>
                  <ChevronDown className={`size-3.5 text-[var(--space-text-muted)] transition-transform duration-200 ${showPassword ? 'rotate-180' : ''}`} />
                </button>

                {showPassword && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs text-[var(--space-text-secondary)]">Current Password</label>
                      <input
                        type="password"
                        value={pw.current}
                        onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                        autoComplete="current-password"
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs text-[var(--space-text-secondary)]">New Password</label>
                      <input
                        type="password"
                        value={pw.next}
                        onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs text-[var(--space-text-secondary)]">Confirm New Password</label>
                      <input
                        type="password"
                        value={pw.confirm}
                        onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                        autoComplete="new-password"
                        className={fieldClass}
                      />
                    </div>

                    {pwError && (
                      <div className="text-xs text-red-400 bg-red-400/[0.07] border border-red-400/20 rounded-lg px-3 py-2">
                        {pwError}
                      </div>
                    )}

                    <button
                      onClick={handleChangePassword}
                      disabled={pwLoading || pwSaved}
                      className="w-full flex items-center justify-center gap-1.5 h-9 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-60 bg-[var(--space-bg-card-hover)] hover:bg-[var(--space-bg-card-hover)] border border-[var(--space-border-hard)] text-[var(--space-text-primary)]"
                    >
                      {pwSaved ? (
                        <><Check className="size-3.5" style={{ color: 'var(--space-accent)' }} />Password Updated</>
                      ) : pwLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Passkey section ── */}
              <div className="px-6 py-5 border-t border-[var(--space-border-hard)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="size-3.5 text-[var(--space-text-muted)]" />
                    <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--space-text-muted)] font-semibold">Passkey</p>
                  </div>
                  {/* Status badge */}
                  {passkeys !== null && !passkeyLoading && (
                    passkeys.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5" style={{ color: 'var(--space-accent)' }} />
                        <span className="text-[11px] font-medium" style={{ color: 'var(--space-accent)' }}>
                          {passkeys.length === 1 ? 'Passkey set' : `${passkeys.length} passkeys`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--space-text-muted)]">Not set up</span>
                    )
                  )}
                </div>

                {passkeyLoading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-[var(--space-text-muted)]" />
                  </div>
                )}

                {passkeyError && (
                  <div className="text-xs text-red-400 bg-red-400/[0.07] border border-red-400/20 rounded-lg px-3 py-2 mb-3">
                    {passkeyError}
                  </div>
                )}

                {/* Passkey list */}
                {!passkeyLoading && passkeys !== null && passkeys.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {passkeys.map((pk) => (
                      <div
                        key={pk.credentialID}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 border border-[var(--space-border-hard)] bg-[var(--space-bg-card)]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Fingerprint className="size-3.5 shrink-0 text-[var(--space-text-muted)]" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[var(--space-text-primary)] truncate">{pk.deviceName}</p>
                            {pk.registeredAt && (
                              <p className="text-[10px] text-[var(--space-text-muted)]">Added {fmtDate(pk.registeredAt)}{pk.credentialBackedUp ? ' · Synced' : ''}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePasskey(pk.credentialID)}
                          disabled={deletingId === pk.credentialID}
                          className="ml-2 shrink-0 p-1 rounded text-[var(--space-text-muted)] hover:text-red-400 transition-colors disabled:opacity-40"
                          aria-label="Remove passkey"
                        >
                          {deletingId === pk.credentialID
                            ? <Loader2 className="size-3.5 animate-spin" />
                            : <Trash2 className="size-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add passkey button */}
                {!passkeyLoading && (
                  <button
                    onClick={handleAddPasskey}
                    disabled={addingPasskey}
                    className="w-full flex items-center justify-center gap-1.5 h-9 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-60 border border-[var(--space-border-hard)] text-[var(--space-text-secondary)] hover:border-[var(--space-accent)]/40 hover:text-[var(--space-accent)] bg-transparent"
                  >
                    {addingPasskey
                      ? <><Loader2 className="size-3.5 animate-spin" />Setting up…</>
                      : <><Fingerprint className="size-3.5" />{passkeys?.length ? 'Add another passkey' : 'Set up passkey'}</>}
                  </button>
                )}
              </div>

            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
