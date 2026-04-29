import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT, SESSION_COOKIE } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const store = await cookies()
  const session = store.get(SESSION_COOKIE)?.value

  if (!session) {
    return NextResponse.json({ ok: false, error: 'no_session' }, { status: 401 })
  }

  const payload = await verifyJWT(session)
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: 'invalid_session' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    ok: true,
    email: payload.email,
    userId: payload.userId,
  })
}
