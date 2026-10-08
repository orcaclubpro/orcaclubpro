'use server'

/**
 * Consent decisions for /oauth/authorize. Both re-validate the full request — the form's
 * hidden fields are attacker-controllable — and re-check that the caller is staff.
 */
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { getCurrentUser } from '@/actions/auth'
import { AUTHORIZE_PARAM_KEYS, checkAuthorizeRequest, clientRedirect, type AuthorizeParams } from '@/lib/oauth/authorize'
import { createAuthorizationCode } from '@/lib/oauth/grants'

function paramsFrom(formData: FormData): AuthorizeParams {
  const out: AuthorizeParams = {}
  for (const key of AUTHORIZE_PARAM_KEYS) {
    const v = formData.get(key)
    if (typeof v === 'string' && v) out[key] = v
  }
  return out
}

export async function decideAuthorization(formData: FormData): Promise<void> {
  const params = paramsFrom(formData)
  const check = await checkAuthorizeRequest(params)
  if (check.kind === 'fatal') throw new Error(check.message)
  if (check.kind === 'redirect') redirect(check.url)

  const user = await getCurrentUser()
  if (!user || user.role === 'client') throw new Error('Only ORCACLUB staff can connect applications.')

  if (formData.get('decision') !== 'approve') {
    redirect(clientRedirect(check.redirectUri, { error: 'access_denied', state: check.state }))
  }

  const payload = await getPayload({ config })
  const code = await createAuthorizationCode(payload, {
    userId: String(user.id),
    clientId: check.client.clientId,
    clientName: check.client.displayName,
    redirectUri: check.redirectUri,
    codeChallenge: check.codeChallenge,
  })
  redirect(clientRedirect(check.redirectUri, { code, state: check.state }))
}
