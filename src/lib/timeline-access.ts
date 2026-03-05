export function cookieName(slug: string): string {
  return `tl_access_${slug.replace(/[^a-z0-9]/gi, '_')}`
}

export async function computeHash(code: string, slug: string): Promise<string> {
  const salt = process.env.ACCESS_CODE_SALT ?? 'orca-default-salt'
  const data = new TextEncoder().encode(`${code}:${slug}:${salt}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
