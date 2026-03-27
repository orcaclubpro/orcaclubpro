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

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter
// Works within a single server process. For multi-instance deployments,
// replace with an external store (e.g. Upstash Redis).
// ---------------------------------------------------------------------------
interface RateEntry { count: number; resetAt: number }
const rateLimits = new Map<string, RateEntry>()

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = rateLimits.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { allowed: true, retryAfter: 0 }
}

// Rate limit configs: [maxRequests, windowMs]
const RATE_LIMIT_RULES: Record<string, [number, number]> = {
  '/api/users/login':              [10, 15 * 60 * 1000], // 10 attempts / 15 min — admin brute-force
  '/api/users/forgot-password':    [5,  15 * 60 * 1000], // 5 / 15 min
  '/api/auth/request-login-code':  [5,  15 * 60 * 1000], // 5 / 15 min
  '/api/auth/verify-login-code':   [10, 15 * 60 * 1000], // 10 / 15 min
  '/api/auth/forgot-password':     [5,  15 * 60 * 1000], // 5 / 15 min
  '/api/contact':                  [5,  60 * 60 * 1000], // 5 / hour — spam prevention
  '/api/booking':                  [5,  60 * 60 * 1000], // 5 / hour
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function rateLimitedResponse(retryAfter: number): NextResponse {
  return new NextResponse(
    JSON.stringify({ errors: [{ message: 'Too many requests. Please try again later.' }] }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    },
  )
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const url = pathname + request.nextUrl.search

  // SECURITY: Block requests containing exploit patterns
  for (const pattern of EXPLOIT_PATTERNS) {
    if (pattern.test(url)) {
      const clientIp = getClientIp(request)
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

  // SECURITY: Block /api/access for unauthenticated users.
  // This endpoint exposes the full permission map for every collection.
  if (pathname === '/api/access') {
    const token = request.cookies.get('payload-token')?.value
    if (!token) {
      return new NextResponse(
        JSON.stringify({ errors: [{ message: 'You are not allowed to perform this action.' }] }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }

  // SECURITY: Rate limiting on sensitive endpoints
  const ruleKey = Object.keys(RATE_LIMIT_RULES).find((k) => pathname === k || pathname.startsWith(k + '/'))
  if (ruleKey) {
    const [limit, windowMs] = RATE_LIMIT_RULES[ruleKey]
    const ip = getClientIp(request)
    const { allowed, retryAfter } = checkRateLimit(`${ruleKey}:${ip}`, limit, windowMs)
    if (!allowed) {
      console.warn(`[SECURITY] Rate limit hit for ${ruleKey} from ${ip}`)
      return rateLimitedResponse(retryAfter)
    }
  }

  // Smart redirect: returning visitors with an active session go straight to their dashboard
  if (pathname === '/') {
    const payloadToken = request.cookies.get('payload-token')?.value
    const sessionCookie = request.cookies.get('orcaclub-session')?.value

    if (payloadToken && sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie) as { username?: string; role?: string }
        if (session.role === 'client' && session.username) {
          return NextResponse.redirect(new URL(`/u/${session.username}`, request.url))
        }
        if (session.role === 'admin' || session.role === 'user') {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      } catch {
        // Malformed cookie — show the home page normally
      }
    }
  }

  // Check if accessing a protected dashboard route
  const isProtectedRoute = pathname.startsWith('/u/')

  if (isProtectedRoute) {
    // Check for authentication token
    const token = request.cookies.get('payload-token')?.value

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }

    // Refresh the 2-day session window on each dashboard visit
    const sessionCookie = request.cookies.get('orcaclub-session')?.value
    if (sessionCookie) {
      const response = NextResponse.next()
      response.cookies.set('orcaclub-session', sessionCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 2, // reset 2-day window on activity
      })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Run on all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - files with extensions (public assets)
     * - admin (Payload CMS admin — Payload handles its own auth)
     *
     * Intentionally includes /api/* so rate limiting and /api/access
     * protection apply to Payload's REST API endpoints.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|admin).*)',
  ],
}
