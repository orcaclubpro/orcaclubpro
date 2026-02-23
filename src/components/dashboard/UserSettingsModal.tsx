'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X, KeyRound, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { updateUserProfile, changeUserPassword } from '@/actions/profile'

interface UserSettingsModalProps {
  name: string
  email: string
  title?: string | null
}

const PANEL_BG = '#0d0d0d'
const fieldClass =
  'w-full h-9 rounded-lg px-3 text-sm text-white placeholder:text-gray-700 outline-none transition-colors duration-150 border border-white/[0.09] focus:border-cyan-400/30 bg-white/[0.04] focus:bg-white/[0.06]'

export function UserSettingsModal({ name, email, title }: UserSettingsModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

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

  function handleOpen() {
    setForm({ name, email, title: title ?? '' })
    setProfileError(null); setProfileSaved(false)
    setPw({ current: '', next: '', confirm: '' })
    setPwError(null); setPwSaved(false)
    setShowPassword(false)
    setOpen(true)
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

  const initial = (name || email || '?')[0].toUpperCase()

  return (
    <>
      <button
        onClick={handleOpen}
        className="group flex items-center justify-center w-12 h-12 rounded-lg hover:bg-white/[0.06] hover:shadow-[0_0_14px_rgba(103,232,249,0.18)] transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/50"
        aria-label="Profile"
      >
        <Image
          src="/orcaclubpro.png"
          alt="Profile"
          width={48}
          height={48}
          className="brightness-0 invert opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200"
        />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] transition-all duration-300"
            style={{
              background: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
              backdropFilter: visible ? 'blur(4px)' : 'blur(0px)',
            }}
            onClick={handleClose}
          />

          {/* Panel — the panel itself scrolls; header is sticky */}
          <div
            className="fixed top-0 right-0 bottom-0 z-[61] w-full sm:w-[380px] overflow-y-auto border-l border-white/[0.07]"
            style={{
              background: PANEL_BG,
              transform: visible ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Header — sticky so it stays while scrolling */}
            <div className="sticky top-0 z-10 px-6 pt-8 pb-5 border-b border-white/[0.06]" style={{ background: PANEL_BG }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-semibold text-cyan-300 flex-shrink-0 bg-gradient-to-br from-cyan-400/15 to-cyan-600/5 border border-cyan-400/20">
                    {initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{name || email}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5 tracking-wide">Account Settings</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={profileLoading || pwLoading}
                  className="text-gray-700 hover:text-gray-300 transition-colors p-1.5 rounded-md hover:bg-white/[0.05] disabled:opacity-40"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Form body */}
            <div>

              {/* ── Profile section ── */}
              <div className="px-6 py-6 space-y-4 border-b border-white/[0.05]">
                <p className="text-[10px] tracking-[0.15em] uppercase text-gray-600 font-semibold">Profile</p>

                <div className="space-y-1.5">
                  <label className="block text-xs text-gray-500">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-gray-500">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-gray-500">Team Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Lead Developer"
                    className={fieldClass}
                  />
                  <p className="text-[10px] text-gray-700">Shown to clients on their team view</p>
                </div>

                {profileError && (
                  <div className="text-xs text-red-400 bg-red-400/[0.07] border border-red-400/20 rounded-lg px-3 py-2">
                    {profileError}
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={profileLoading || profileSaved}
                  className="w-full flex items-center justify-center gap-1.5 h-9 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-60 bg-cyan-400 hover:bg-cyan-300 text-black"
                >
                  {profileSaved ? (
                    <><Check className="size-3.5" />Saved</>
                  ) : profileLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>

              {/* ── Password section ── */}
              <div className="px-6 py-5">
                <button
                  onClick={() => { setShowPassword(!showPassword); setPwError(null); setPwSaved(false) }}
                  className="flex items-center justify-between w-full group"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-3.5 text-gray-600" />
                    <p className="text-[10px] tracking-[0.15em] uppercase text-gray-600 font-semibold">Change Password</p>
                  </div>
                  <ChevronDown className={`size-3.5 text-gray-700 transition-transform duration-200 ${showPassword ? 'rotate-180' : ''}`} />
                </button>

                {showPassword && (
                  <div className="mt-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs text-gray-500">Current Password</label>
                      <input
                        type="password"
                        value={pw.current}
                        onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                        autoComplete="current-password"
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs text-gray-500">New Password</label>
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
                      <label className="block text-xs text-gray-500">Confirm New Password</label>
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
                      className="w-full flex items-center justify-center gap-1.5 h-9 text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-60 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.10] text-white"
                    >
                      {pwSaved ? (
                        <><Check className="size-3.5 text-cyan-400" />Password Updated</>
                      ) : pwLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </div>
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
