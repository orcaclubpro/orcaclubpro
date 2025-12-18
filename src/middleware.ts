import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// SECURITY: Detect common exploit patterns and malicious payloads
const EXPLOIT_PATTERNS = [
  /wget\s+/i,           // Remote file download
  /curl\s+/i,           // Remote file download
  /bash/i,              // Shell execution
  /sh\s/i,              // Shell execution
  /eval\(/i,            // Code evaluation
  /exec\(/i,            // Command execution
  /base64/i,            // Base64 encoding (often used in exploits)
  /\.\.\//,             // Path traversal
  /%00/,                // Null byte injection
  /%2e%2e/i,            // URL-encoded path traversal
  /chmod/i,             // File permission changes
  /\/etc\/passwd/i,     // System file access
  /\/bin\//i,           // Binary execution
  /uname/i,             // System information gathering
  /whoami/i,            // User enumeration
  /NEXT_REDIRECT/,      // CVE-2025-66478 exploit signature
]

export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname + request.nextUrl.search

  // SECURITY: Block requests containing exploit patterns
  for (const pattern of EXPLOIT_PATTERNS) {
    if (pattern.test(url)) {
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                       request.headers.get('x-real-ip') ||
                       'unknown'
      console.error(`[SECURITY] Blocked malicious request from ${clientIp}: ${url}`)
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // SECURITY: Additional check for suspicious User-Agent strings
  const userAgent = request.headers.get('user-agent') || ''
  if (/bot|crawler|spider|scraper/i.test(userAgent) &&
      !/(googlebot|bingbot|duckduckbot)/i.test(userAgent)) {
    console.warn(`[SECURITY] Suspicious user-agent: ${userAgent}`)
  }

  // Check if accessing a protected dashboard route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/login/u/')

  if (isProtectedRoute) {
    // Check for authentication token
    const token = request.cookies.get('payload-token')?.value

    if (!token) {
      // Redirect to login if no token found
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - admin (PayloadCMS admin)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|admin).*)',
  ],
}
