import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminJWT, ADMIN_COOKIE } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const store = await cookies()
  const session = store.get(ADMIN_COOKIE)?.value
  if (!session) return NextResponse.json({ ok: false, error: 'no_session' }, { status: 401 })
  const payload = await verifyAdminJWT(session)
  if (!payload) return NextResponse.json({ ok: false, error: 'invalid_session' }, { status: 401 })
  return NextResponse.json({ ok: true, adminId: payload.adminId, login: payload.login })
}
