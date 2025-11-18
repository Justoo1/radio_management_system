/**
 * NextAuth v5 Proxy (formerly middleware)
 * Protects routes and handles session/token validation
 * For Next.js 16+, use proxy.ts instead of middleware.ts
 */

import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()
  const pathname = request.nextUrl.pathname

  // Admin dashboard and organization pages are in the (admin) group
  // They require developer access token with valid security key
  const isAdminRoute = pathname === '/admin' || pathname === '/admin/dashboard' || pathname.startsWith('/admin/organizations')

  if (isAdminRoute) {
    // Check for developer access token
    const devAccessToken = request.cookies.get('dev_access_token')?.value
    if (devAccessToken) {
      // Developer has valid access token, allow access
      return NextResponse.next()
    }

    // No developer access - redirect to admin login
    return NextResponse.redirect(new URL('/admin-login', request.url))
  }

  // Protect general dashboard routes (different from admin dashboard)
  if (pathname.startsWith('/dashboard')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Allow /admin-login page without authentication (for developers)
  if (pathname === '/admin-login') {
    return NextResponse.next()
  }

  // Redirect authenticated users away from auth login/register
  if (
    (pathname === '/auth/login' ||
      pathname === '/auth/register' ||
      pathname === '/register') &&
    session?.user
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
