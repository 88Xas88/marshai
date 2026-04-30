import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, SESSION_COOKIE } from '@/lib/auth'
import { verifyAdminJWT, ADMIN_COOKIE } from '@/lib/admin-auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // === /admin/* — отдельный admin-flow ===

  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return NextResponse.next()
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminSession = req.cookies.get(ADMIN_COOKIE)?.value
    if (!adminSession) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    const adminPayload = await verifyAdminJWT(adminSession)
    if (!adminPayload) {
      const url = new URL('/admin/login', req.url)
      url.searchParams.set('error', 'invalid_session')
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // === /account/* — пользовательский magic-link flow ===

  if (pathname === '/account/login' || pathname.startsWith('/account/login/')) {
    return NextResponse.next()
  }
  if (pathname === '/account' || pathname.startsWith('/account/')) {
    const session = req.cookies.get(SESSION_COOKIE)?.value
    if (!session) {
      return NextResponse.redirect(new URL('/account/login', req.url))
    }
    const payload = await verifyJWT(session)
    if (!payload) {
      const url = new URL('/account/login', req.url)
      url.searchParams.set('error', 'invalid_session')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
}
