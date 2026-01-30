import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for Revdata multi-tenant authentication and routing
 *
 * Protected routes:
 * - /api/v1/* - API endpoints (require auth)
 * - /[workspaceSlug]/* - Dashboard pages (require auth)
 *
 * Public routes:
 * - /api/v1/webhooks/* - Webhook receivers (signature verification only)
 * - /api/auth/* - NextAuth endpoints
 * - /auth/* - Auth pages
 * - / - Landing page
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public API routes - webhooks don't require auth
  if (pathname.startsWith('/api/v1/webhooks/')) {
    return NextResponse.next()
  }

  // Public routes
  if (
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next()
  }

  // Legacy dashboard route - redirect to workspace selection
  if (pathname === '/dashboard') {
    // For now, allow access to legacy dashboard
    // Later, redirect to workspace selection: return NextResponse.redirect(new URL('/workspaces', request.url))
    return NextResponse.next()
  }

  // Protected API routes
  if (pathname.startsWith('/api/v1/')) {
    // API authentication is handled in route handlers
    // Here we just pass through
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
