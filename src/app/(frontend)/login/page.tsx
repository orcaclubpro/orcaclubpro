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
    <div className="relative h-screen overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex h-screen">

        {/* ── LEFT PANEL ── transparent over animated background */}
        <div className="hidden lg:flex flex-col w-[50%] px-16 py-14">
          <div className="flex-1 flex items-center justify-center">
            <LoginGreeting />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-white/15" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-light">Secure Access</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── full-height frosted glass */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            background: 'rgba(8, 8, 12, 0.70)',
            backdropFilter: 'blur(28px) saturate(1.2)',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Mobile header */}
          <div className="lg:hidden px-6 pt-8 pb-5 flex-shrink-0 border-b border-white/[0.07]">
            <h1 className="text-xl font-semibold text-white mb-1">Welcome back.</h1>
            <p className="text-xs text-white/35 font-light">Secure access to your client portal</p>
          </div>

          {/* Form area */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 lg:px-10 py-8 lg:py-12">
            <div className="w-full max-w-[420px]">

              <div className="mb-8">
                <h2 className="text-3xl font-light text-white tracking-wide">Sign in.</h2>
                <p className="text-base text-white/40 mt-2 font-light">Access your projects, orders, and files.</p>
                <div className="mt-4 w-8 h-px bg-[#67e8f9]/30" />
              </div>

              <LoginForm callbackUrl={callbackUrl} />

              <div className="mt-8 pt-5 border-t border-white/[0.07] space-y-4">
                <Link
                  href="/contact"
                  className="block w-full py-3 rounded-xl text-sm font-semibold text-center text-black bg-white hover:bg-white/90 transition-all duration-200"
                >
                  Get Access
                </Link>
                <p className="text-xs text-white/25 font-light">
                  New to ORCACLUB?{' '}
                  <Link
                    href="/contact"
                    className="text-[#67e8f9]/60 hover:text-[#67e8f9] transition-colors duration-200"
                  >
                    Start a project
                  </Link>
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
