import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { getCurrentUser } from '@/actions/auth'
import AnimatedBackground from '@/components/layout/animated-background'
import LoginGreeting from '@/components/auth/LoginGreeting'
import Link from 'next/link'

export const metadata = {
  title: 'Client Login - ORCACLUB',
  description: 'Login to your ORCACLUB client dashboard',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const [user, { callbackUrl }] = await Promise.all([getCurrentUser(), searchParams])

  if (user && user.username) {
    const dest = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : `/u/${user.username}`
    redirect(dest)
  }

  if (user && (user.role === 'admin' || user.role === 'user')) {
    redirect('/admin')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />

      {/* Full-screen two-panel layout above animated background */}
      <div className="relative z-10 flex min-h-screen">

        {/* ── LEFT PANEL ── transparent over animated background */}
        <div className="hidden lg:flex flex-col w-[55%] px-16 py-16">
          {/* Brand wordmark */}
          <div>
            <Link href="/">
              <span className="text-sm font-light tracking-[0.35em] uppercase text-white/50">
                ORCA<span className="text-[#67e8f9]/60">CLUB</span>
              </span>
            </Link>
          </div>

          {/* Animated greeting — gothic tag + Welcome back. */}
          <div className="flex-1 flex items-center justify-center">
            <LoginGreeting />
          </div>

          {/* Bottom label */}
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-white/15" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-light">
              Secure Access
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── frosted glass card */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div
            className="w-full max-w-[400px] rounded-2xl p-8 lg:p-10"
            style={{
              background: 'rgba(8, 8, 12, 0.75)',
              backdropFilter: 'blur(24px) saturate(1.2)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            {/* Mobile brand */}
            <div className="lg:hidden mb-8">
              <Link href="/">
                <span className="text-sm font-light tracking-[0.35em] uppercase text-white/50">
                  ORCA<span className="text-[#67e8f9]/60">CLUB</span>
                </span>
              </Link>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p className="text-xs tracking-[0.4em] uppercase text-white/30 font-light mb-3">
                Secure Access
              </p>
              <h2 className="text-4xl font-bold tracking-widest gradient-text">
                SPACES
              </h2>
              <div className="mt-4 w-8 h-px bg-[#67e8f9]/40" />
            </div>

            {/* Login form — all logic preserved inside */}
            <LoginForm callbackUrl={callbackUrl} />

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.07]">
              <p className="text-xs text-white/25 font-light">
                Need access?{' '}
                <Link
                  href="/contact"
                  className="text-[#67e8f9]/60 hover:text-[#67e8f9] transition-colors duration-200"
                >
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
