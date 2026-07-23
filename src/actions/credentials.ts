'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { baseEmailTemplate } from '@/lib/email/templates/base'
import { cookies } from 'next/headers'

const VAULT_COOKIE = 'orcaclub-vault-session'
const VAULT_MAX_AGE = 60 * 60 // 1 hour of inactivity (sliding — refreshed on each checkVaultSession)

/** Verify the currently-authenticated user's account password.
 *  On success, fires a non-blocking security notification email to the account. */
export async function verifyCurrentPassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user?.email) return { success: false, error: 'Not authenticated' }

    const payload = await getPayload({ config })
    await payload.login({ collection: 'users', data: { email: user.email, password } })

    // Non-blocking security notification email
    ;(async () => {
      try {
        const now = new Date()
        const formatted = now.toLocaleString('en-US', {
          timeZone: 'America/New_York',
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
        })

        const html = baseEmailTemplate({
          content: `
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <p class="oc-eyebrow" style="margin:0 0 12px 0;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#555555;">Security Alert</p>
                <h1 class="oc-heading" style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.25;">Credential Vault Unlocked</h1>
                <p class="oc-body-text" style="margin:0;font-size:14px;color:#aaaaaa;line-height:1.6;">
                  Your ORCACLUB credential vault was just unlocked using your account password.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                  class="oc-detail-box-lborder"
                  style="background-color:#0d0d0d;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;border-radius:6px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding-bottom:8px;">
                            <span class="oc-detail-key" style="font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#555555;">Time</span><br>
                            <span class="oc-detail-val" style="font-size:13px;color:#dddddd;font-weight:500;">${formatted}</span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span class="oc-detail-key" style="font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#555555;">Account</span><br>
                            <span class="oc-detail-val" style="font-size:13px;color:#dddddd;font-weight:500;">${user.email}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 40px 40px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                  class="oc-warn-box"
                  style="background-color:#1a0a0a;border:1px solid #3a1010;border-left:3px solid #ef4444;border-radius:6px;">
                  <tr>
                    <td style="padding:14px 18px;">
                      <p class="oc-warn-text" style="margin:0;font-size:13px;color:#f87171;line-height:1.5;">
                        If this wasn't you, contact ORCACLUB support immediately — your credentials may be at risk.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `,
        })

        await payload.sendEmail({
          to: user.email,
          subject: 'Your Vault was accessed | ORCACLUB',
          html,
          text: `Your ORCACLUB credential vault was unlocked at ${formatted} by account ${user.email}. If this wasn't you, contact support immediately.`,
        })
      } catch (e) {
        console.error('[verifyCurrentPassword] Notification email failed:', e)
      }
    })()

    return { success: true }
  } catch {
    return { success: false, error: 'Incorrect password' }
  }
}

/**
 * Verify password and persist a 24-hour vault session cookie.
 * Returns `expiresAt` (ms timestamp) so the client can show a countdown.
 */
export async function unlockVault(
  password: string,
): Promise<{ success: boolean; error?: string; expiresAt?: number }> {
  // Reuse existing verify logic (sends security email, validates via payload.login)
  const result = await verifyCurrentPassword(password)
  if (!result.success) return result

  const user = await getCurrentUser()
  if (!user?.id) return { success: false, error: 'Not authenticated' }

  const unlockedAt = Date.now()
  const expiresAt = unlockedAt + VAULT_MAX_AGE * 1000

  const cookieStore = await cookies()
  cookieStore.set(
    VAULT_COOKIE,
    JSON.stringify({ userId: String(user.id), unlockedAt: new Date(unlockedAt).toISOString() }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: VAULT_MAX_AGE,
    },
  )

  return { success: true, expiresAt }
}

/**
 * Check whether the current user has an active vault session.
 * Validates the cookie belongs to the authenticated user and hasn't expired.
 */
export async function checkVaultSession(): Promise<{ unlocked: boolean; expiresAt?: number }> {
  try {
    const user = await getCurrentUser()
    if (!user?.id) return { unlocked: false }

    const cookieStore = await cookies()
    const raw = cookieStore.get(VAULT_COOKIE)?.value
    if (!raw) return { unlocked: false }

    const data = JSON.parse(raw) as { userId?: string; unlockedAt?: string }
    // Ensure the cookie belongs to the currently authenticated user
    if (data.userId !== String(user.id)) return { unlocked: false }

    const lastActiveAt = data.unlockedAt ? new Date(data.unlockedAt).getTime() : 0
    // Inactivity check: lock only if more than VAULT_MAX_AGE has passed since the
    // last activity, not since the original unlock.
    if (Date.now() - lastActiveAt > VAULT_MAX_AGE * 1000) return { unlocked: false }

    // Sliding window: each valid check counts as activity and resets the timer,
    // so the vault stays open while in use and re-locks only after
    // VAULT_MAX_AGE of inactivity.
    const refreshedAt = Date.now()
    const expiresAt = refreshedAt + VAULT_MAX_AGE * 1000
    cookieStore.set(
      VAULT_COOKIE,
      JSON.stringify({ userId: String(user.id), unlockedAt: new Date(refreshedAt).toISOString() }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: VAULT_MAX_AGE,
      },
    )

    return { unlocked: true, expiresAt }
  } catch {
    return { unlocked: false }
  }
}

/** Clear the vault session cookie (manual lock or logout). */
export async function lockVault(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(VAULT_COOKIE)
}

interface SecretInput {
  key: string
  value: string
}

interface CredentialInput {
  projectId: string
  title: string
  website?: string
  username?: string
  password?: string
  secrets?: SecretInput[]
}

export async function createCredential(data: CredentialInput) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Access denied' }

    const payload = await getPayload({ config })

    const credential = await payload.create({
      collection: 'credentials',
      data: {
        title: data.title,
        project: data.projectId,
        website: data.website || undefined,
        username: data.username || undefined,
        password: data.password || undefined,
        secrets: data.secrets || [],
      },
    })

    return { success: true, credential }
  } catch (error) {
    console.error('[createCredential]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create credential',
    }
  }
}

export async function updateCredential(id: string, data: Partial<CredentialInput>) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    // SECURITY: verify the caller owns the credential's project before editing.
    // Without this, any authenticated user could overwrite any project's
    // credentials by guessing/enumerating credential IDs (cross-tenant IDOR).
    const existing = await payload.findByID({ collection: 'credentials', id, depth: 1 })
    const project = existing?.project
    if (!project || typeof project === 'string') {
      return { success: false, error: 'Access denied' }
    }

    const projectClientId =
      typeof project.client === 'string' ? project.client : (project.client as any)?.id
    const assignedIds = (Array.isArray(project.assignedTo) ? project.assignedTo : [])
      .map((a: any) => (typeof a === 'string' ? a : a?.id))
      .filter(Boolean)
    const userClientId =
      typeof user.clientAccount === 'string' ? user.clientAccount : (user.clientAccount as any)?.id

    const authorized =
      user.role === 'admin' ||
      (user.role === 'user' && assignedIds.includes(user.id)) ||
      (user.role === 'client' && userClientId && projectClientId === userClientId)

    if (!authorized) {
      return { success: false, error: 'Access denied' }
    }

    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.website !== undefined) updateData.website = data.website
    if (data.username !== undefined) updateData.username = data.username
    if (data.password !== undefined) updateData.password = data.password
    if (data.secrets !== undefined) updateData.secrets = data.secrets

    const credential = await payload.update({
      collection: 'credentials',
      id,
      data: updateData as any,
    })

    return { success: true, credential }
  } catch (error) {
    console.error('[updateCredential]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update credential',
    }
  }
}

export async function deleteCredential(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    if (user.role === 'client') return { success: false, error: 'Access denied' }

    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'credentials',
      id,
    })

    return { success: true }
  } catch (error) {
    console.error('[deleteCredential]', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete credential',
    }
  }
}
