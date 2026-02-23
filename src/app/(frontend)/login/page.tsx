import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { getCurrentUser } from '@/actions/auth'
import DynamicGreeting from '@/components/layout/dynamic-greeting'
import { SpacesHeader } from '@/components/layout/spaces-header'
import Link from 'next/link'
import { Cinzel_Decorative } from 'next/font/google'

const gothic = Cinzel_Decorative({ weight: '700', subsets: ['latin'] })

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
    <div className="flex h-screen overflow-hidden bg-black pt-16">
      <SpacesHeader />

      {/* ── LEFT PANEL ── atmospheric, structural, greeting */}
      <div className="relative hidden lg:flex flex-col w-[60%] overflow-hidden bg-black">

        {/* Orbital geometry — barely visible, references logo grid */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <svg
            width="600"
            height="600"
            viewBox="0 0 600 600"
            fill="none"
            aria-hidden="true"
            className="opacity-[0.032]"
          >
            <circle cx="300" cy="300" r="299" stroke="white" strokeWidth="1" />
            <circle cx="300" cy="300" r="226" stroke="white" strokeWidth="0.5" />
            <line x1="300" y1="0" x2="300" y2="600" stroke="white" strokeWidth="0.5" />
            <line x1="0" y1="300" x2="600" y2="300" stroke="white" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="3" stroke="white" strokeWidth="0.5" fill="none" />
            <line x1="300" y1="1" x2="300" y2="20" stroke="white" strokeWidth="1" />
            <line x1="300" y1="580" x2="300" y2="599" stroke="white" strokeWidth="1" />
            <line x1="1" y1="300" x2="20" y2="300" stroke="white" strokeWidth="1" />
            <line x1="580" y1="300" x2="599" y2="300" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        {/* Greeting — floats in the center of the darkness */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <DynamicGreeting />
        </div>

        {/* Bottom-left client portal label */}
        <div className="relative z-10 px-12 pb-10 flex items-center gap-4">
          <div className="h-px w-8 bg-white/10" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-light">
            Client Portal
          </span>
        </div>
      </div>

      {/* Panel separator — a single hair-line */}
      <div className="hidden lg:block w-px bg-white/[0.05] flex-shrink-0" />

      {/* ── RIGHT PANEL ── clean, monastic, functional */}
      <div className="flex-1 bg-[#080808] flex flex-col items-center justify-center px-10 py-12 relative overflow-hidden">

        {/* Mobile-only logo */}
        <div className="lg:hidden mb-12 text-center">
          <h1 className={`${gothic.className} text-4xl tracking-tight`}>
            <span className="text-white">Client </span>
            <span className="gradient-text">Portal</span>
          </h1>
        </div>

        <div className="w-full max-w-[320px]">

          {/* Heading block */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/25 font-light mb-4">
              Secure Access
            </p>
            <h2 className={`${gothic.className} text-3xl text-white`}>
              Welcome back.
            </h2>
            <div className="mt-5 w-6 h-px bg-cyan-400/40" />
          </div>

          {/* Login form — all functionality preserved */}
          <LoginForm callbackUrl={callbackUrl} />

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-white/[0.06]">
            <p className="text-[11px] text-white/20 font-light">
              Need access?{' '}
              <Link
                href="/contact"
                className="text-cyan-400/50 hover:text-cyan-400/80 transition-colors duration-300 hover:underline underline-offset-2"
              >
                Contact us
              </Link>
            </p>
          </div>
        </div>

        {/* Corner geometry — bottom-right structural accent */}
        <div className="absolute bottom-0 right-0 pointer-events-none select-none" aria-hidden="true">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" className="opacity-[0.05]">
            <path d="M96 0 L96 96 L0 96" stroke="white" strokeWidth="1" />
            <path d="M96 28 L96 96 L28 96" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

      </div>
    </div>
  )
}
