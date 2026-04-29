import { NextResponse } from 'next/server'
import {
  consumeAuthToken,
  findOrCreateUser,
  updateLastLogin,
  dbEnabled,
} from '@/lib/db'
import { signJWT, authEnabled, SESSION_COOKIE, SESSION_MAX_AGE_SEC } from '@/lib/auth'

export const runtime = 'nodejs'

interface Body {
  token?: string
  email?: string
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const token = (body.token ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()

  if (!token || !email) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 })
  }

  if (!dbEnabled || !authEnabled) {
    return NextResponse.json(
      { ok: false, error: 'auth_unavailable' },
      { status: 503 }
    )
  }

  const consumedEmail = await consumeAuthToken(token, email)
  if (!consumedEmail) {
    return NextResponse.json(
      { ok: false, error: 'invalid_token' },
      { status: 401 }
    )
  }

  const user = await findOrCreateUser(consumedEmail)
  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'user_lookup_failed' },
      { status: 500 }
    )
  }

  await updateLastLogin(user.id)

  const jwt = await signJWT({ email: user.email, userId: user.id })

  const res = NextResponse.json({ ok: true, email: user.email })
  res.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })
  return res
}
