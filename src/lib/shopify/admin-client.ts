/**
 * Shopify Admin API Client with Token Refresh
 * Uses client credentials grant flow for authentication
 * Tokens are valid for 24 hours and automatically refreshed
 */

// Token cache to avoid requesting on every API call
interface TokenCache {
  token: string
  expiresAt: number
}

let cachedToken: TokenCache | null = null

/**
 * Validate required environment variables
 */
function validateEnv(): void {
  if (!process.env.SHOPIFY_STORE_DOMAIN) {
    throw new Error('SHOPIFY_STORE_DOMAIN is not defined in environment variables')
  }
  if (!process.env.SHOPIFY_ADMIN_CLIENT_ID) {
    throw new Error('SHOPIFY_ADMIN_CLIENT_ID is not defined in environment variables')
  }
  if (!process.env.SHOPIFY_ADMIN_CLIENT_SECRET) {
    throw new Error('SHOPIFY_ADMIN_CLIENT_SECRET is not defined in environment variables')
  }
}

/**
 * Request a new Admin API access token using client credentials grant
 * Tokens are valid for 24 hours (86,399 seconds)
 */
async function requestAccessToken(): Promise<{ token: string; expiresIn: number }> {
  validateEnv()

  const tokenEndpoint = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`

  console.log('[Shopify Admin] Requesting new access token...')

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_ADMIN_CLIENT_SECRET!,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Shopify Admin] Token request failed:', errorText)
    throw new Error(`Failed to obtain Admin API access token: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.access_token) {
    throw new Error('No access token in response')
  }

  console.log('[Shopify Admin] Access token obtained successfully')

  return {
    token: data.access_token,
    expiresIn: data.expires_in || 86399, // Default to 24 hours
  }
}

/**
 * Get a valid Admin API access token (uses cache when available)
 * Tokens are cached with a 5-minute buffer before expiry
 */
export async function getAdminAccessToken(): Promise<string> {
  const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds

  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now() + bufferTime) {
    return cachedToken.token
  }

  // Request new token
  const { token, expiresIn } = await requestAccessToken()

  // Cache token with expiry time
  cachedToken = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  }

  return token
}

/**
 * Make a GraphQL request to the Shopify Admin API
 * Automatically handles token refresh
 */
export async function shopifyAdminRequest<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<{ data: T | null; errors?: any[] }> {
  validateEnv()

  const token = await getAdminAccessToken()
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2025-01'
  const endpoint = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${apiVersion}/graphql.json`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Shopify Admin] GraphQL request failed:', errorText)
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      console.error('[Shopify Admin] GraphQL errors:', JSON.stringify(result.errors, null, 2))
      return {
        data: null,
        errors: result.errors,
      }
    }

    return {
      data: result.data,
      errors: result.errors,
    }
  } catch (error) {
    console.error('[Shopify Admin] Request error:', error)
    throw error
  }
}

/**
 * Clear the token cache (useful for testing or forced refresh)
 */
export function clearTokenCache(): void {
  cachedToken = null
  console.log('[Shopify Admin] Token cache cleared')
}

console.log('[Shopify Admin] Client module loaded')
