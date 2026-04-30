import { NextResponse } from 'next/server'
import { signAdminJWT, ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE_SEC } from '@/lib/admin-auth'
import { verifyAdminCredentials } from '@/lib/admin-auth-server'

export const runtime = 'nodejs'

interface Body {
  login?: string
  password?: string
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const login = (body.login ?? '').trim()
  const password = body.password ?? ''
  if (!login || !password) {
    return NextResponse.json({ ok: false, error: 'missing_credentials' }, { status: 400 })
  }

  const user = await verifyAdminCredentials(login, password)
  if (!user) {
    return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 })
  }

  const jwt = await signAdminJWT({ adminId: user.id, login: user.login })
  const res = NextResponse.json({
    ok: true,
    admin: { id: user.id, login: user.login, displayName: user.displayName },
  })
  res.cookies.set(ADMIN_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  })
  return res
}
