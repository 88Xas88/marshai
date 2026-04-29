import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, SESSION_COOKIE } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /account/login открыт всем — это сама страница входа.
  if (pathname === '/account/login' || pathname.startsWith('/account/login/')) {
    return NextResponse.next()
  }

  // Только /account и его подпути требуют сессию.
  // (matcher ниже уже сужает список путей — но дублируем явно для ясности.)
  if (pathname === '/account' || pathname.startsWith('/account/')) {
    const session = req.cookies.get(SESSION_COOKIE)?.value
    if (!session) {
      const url = new URL('/account/login', req.url)
      return NextResponse.redirect(url)
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
  // Перехватываем только аккаунтные пути, чтобы middleware не запускался на каждый запрос.
  matcher: ['/account/:path*'],
}
