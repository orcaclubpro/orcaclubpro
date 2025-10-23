import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
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
