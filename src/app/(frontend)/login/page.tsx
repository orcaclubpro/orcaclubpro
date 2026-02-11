import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { getCurrentUser } from '@/actions/auth'

export const metadata = {
  title: 'Client Login - ORCACLUB',
  description: 'Login to your ORCACLUB client dashboard',
}

export default async function LoginPage() {
  // Check if user is already logged in
  const user = await getCurrentUser()

  // If user is already logged in with a username, redirect to their dashboard
  if (user && user.username) {
    redirect(`/u/${user.username}`)
  }

  // If admin/user is logged in without a username, redirect to admin panel
  if (user && (user.role === 'admin' || user.role === 'user')) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-12 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-intelligence-cyan/5 via-transparent to-transparent opacity-30 blur-3xl" />
      <div className="absolute top-20 left-10 w-96 h-96 bg-intelligence-cyan/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-intelligence-blue/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="w-full max-w-md relative z-10 fluid-enter">
        {/* Logo section */}
        <div className="text-center mb-10">
          <div className="inline-block mb-6 relative">
            <div className="absolute inset-0 bg-intelligence-cyan/20 blur-2xl rounded-full scale-150" />
            <h1 className="text-5xl font-bold relative">
              <span className="text-white">ORCA</span>
              <span className="gradient-text">CLUB</span>
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Client Dashboard</p>
          <p className="text-gray-500 text-sm mt-1">Secure Access Portal</p>
        </div>

        {/* Login card */}
        <div className="relative group">
          {/* Card glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-intelligence-cyan/20 via-intelligence-blue/20 to-intelligence-cyan/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />

          {/* Main card */}
          <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 shadow-2xl">
            <LoginForm />
          </div>
        </div>

        {/* Support link */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-gray-500 text-sm">
            Need help accessing your account?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-intelligence-cyan hover:text-intelligence-cyan/80 text-sm font-medium transition-colors group"
          >
            Contact Support
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        {/* Security badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-600 text-xs">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secured with enterprise-grade encryption</span>
        </div>
      </div>
    </div>
  )
}
