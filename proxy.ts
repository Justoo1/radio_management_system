/**
 * Next.js Proxy (Next.js 16+)
 * Enforces authentication and subscription access control
 */

import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await auth()

  // Allow public routes
  const publicPaths = [
    '/api/auth',
    '/auth/login',
    '/auth/register',
    '/stream',
    '/book',
    '/broadcast',
    '/_next',
    '/favicon.ico',
    '/api/public',
    '/api/webhooks',
  ]

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Admin dashboard and organization pages require developer access token
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

  // Allow /admin-login page without authentication (for developers)
  if (pathname === '/admin-login') {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    if (!session?.user) {
      // Redirect to login for dashboard pages
      if (pathname.startsWith('/dashboard')) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
      }

      // Return 401 for API routes
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check organization status for non-admin users
    if (session.user.organizationId) {
      // Skip status check for status API itself
      if (pathname === '/api/organization/status') {
        return NextResponse.next()
      }

      // Skip status check for upgrade page and subscription APIs
      const upgradeAllowedPaths = [
        '/upgrade',
        '/api/subscription',
        '/settings/billing',
      ]
      const isUpgradeAllowed = upgradeAllowedPaths.some((path) =>
        pathname.startsWith(path)
      )

      if (!isUpgradeAllowed) {
        // Fetch organization status
        try {
          const { prisma } = await import('@/lib/prisma')
          const organization = await prisma.organization.findUnique({
            where: { id: session.user.organizationId },
            select: {
              status: true,
              trialEndDate: true,
            },
          })

          if (!organization) {
            if (pathname.startsWith('/dashboard')) {
              const url = request.nextUrl.clone()
              url.pathname = '/auth/login'
              return NextResponse.redirect(url)
            }
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
          }

          // Block access if trial/subscription expired
          if (organization.status === 'EXPIRED' || organization.status === 'SUSPENDED') {
            // Redirect to upgrade page for dashboard
            if (pathname.startsWith('/dashboard')) {
              const url = request.nextUrl.clone()
              url.pathname = '/upgrade'
              url.searchParams.set('reason', 'expired')
              return NextResponse.redirect(url)
            }

            // Return error for API routes
            if (pathname.startsWith('/api/')) {
              return NextResponse.json(
                {
                  error: 'Subscription required',
                  message: 'Your trial has expired. Please subscribe to continue.',
                  redirectUrl: '/upgrade',
                },
                { status: 403 }
              )
            }
          }
        } catch (error) {
          console.error('Error checking organization status:', error)
          // Allow request to proceed on error to prevent blocking all access
        }
      }
    }
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
