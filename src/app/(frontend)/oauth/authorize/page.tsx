import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/actions/auth'
import { decideAuthorization } from '@/actions/oauth'
import { AUTHORIZE_PARAM_KEYS, checkAuthorizeRequest, type AuthorizeParams } from '@/lib/oauth/authorize'
import { isLoopbackRedirect } from '@/lib/oauth/core'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Connect an application',
  robots: { index: false, follow: false },
}

/** OAuth consent for the MCP endpoint. Staff only — see src/lib/oauth/core.ts. */
export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const params: AuthorizeParams = {}
  for (const key of AUTHORIZE_PARAM_KEYS) {
    const v = raw[key]
    if (typeof v === 'string' && v) params[key] = v
  }

  const check = await checkAuthorizeRequest(params)
  if (check.kind === 'fatal') return <Shell title="Can't connect">{check.message}</Shell>
  if (check.kind === 'redirect') redirect(check.url)

  const user = await getCurrentUser()
  if (!user) {
    const here = `/oauth/authorize?${new URLSearchParams(params as Record<string, string>).toString()}`
    redirect(`/login?callbackUrl=${encodeURIComponent(here)}`)
  }
  if (user.role === 'client') {
    return <Shell title="Staff only">Connecting applications is limited to ORCACLUB staff accounts.</Shell>
  }

  const redirectHost = new URL(check.redirectUri).host
  const local = isLoopbackRedirect(check.redirectUri)

  return (
    <Shell title="Connect an application">
      <p>
        <span className="text-white font-medium">{check.client.displayName}</span> wants to act as{' '}
        <span className="text-white font-medium">{user.email}</span> through the ORCACLUB MCP server.
      </p>
      <ul className="mt-5 space-y-2 text-sm text-gray-400 list-disc pl-5">
        <li>Read retainers, packages, clients and projects you can access</li>
        <li>Log hours, draft recaps and SOWs, and manage milestones</li>
        <li>It cannot create orders, charge cards, or email clients</li>
      </ul>
      <p className="mt-5 text-xs text-gray-500">
        Approving sends you back to <span className="text-gray-300">{redirectHost}</span>.
        {local && ' This is an app running on your own computer — only approve if you just started it.'}
      </p>

      <form action={decideAuthorization} className="mt-8 flex gap-3">
        {AUTHORIZE_PARAM_KEYS.map((key) =>
          params[key] ? <input key={key} type="hidden" name={key} value={params[key]} /> : null,
        )}
        <button
          type="submit"
          name="decision"
          value="approve"
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-black bg-[#67e8f9] hover:bg-[#67e8f9]/90 transition-colors"
        >
          Approve
        </button>
        <button
          type="submit"
          name="decision"
          value="deny"
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white border border-white/15 hover:bg-white/5 transition-colors"
        >
          Deny
        </button>
      </form>
      <p className="mt-6 text-xs text-gray-500">You can disconnect it any time from OAuth Grants in the admin panel.</p>
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-black">
      <div className="w-full max-w-[460px] rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-2xl font-light text-white tracking-wide">{title}</h1>
        <div className="mt-3 w-8 h-px bg-[#67e8f9]/40" />
        <div className="mt-6 text-gray-300 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
