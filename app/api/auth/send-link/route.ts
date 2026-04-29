import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { dbEnabled, findOrCreateUser, createAuthToken } from '@/lib/db'
import { emailEnabled, sendMagicLinkEmail } from '@/lib/email'

export const runtime = 'nodejs'

interface Body {
  email?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function originFromReq(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL
  if (env) return env.replace(/\/$/, '')
  // В локальной разработке fallback на тот же origin что и запрос.
  try {
    return new URL(req.url).origin
  } catch {
    return 'https://marshai.ru'
  }
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }

  if (!dbEnabled) {
    return NextResponse.json(
      { ok: false, error: 'database_unavailable' },
      { status: 503 }
    )
  }

  const user = await findOrCreateUser(email)
  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'user_create_failed' },
      { status: 500 }
    )
  }

  const token = randomUUID()
  const created = await createAuthToken(email, token)
  if (!created) {
    return NextResponse.json(
      { ok: false, error: 'token_create_failed' },
      { status: 500 }
    )
  }

  const origin = originFromReq(req)
  const link = `${origin}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

  let mailed = false
  if (emailEnabled) {
    mailed = await sendMagicLinkEmail({ to: email, link })
  } else {
    // В деве без RESEND_API_KEY — печатаем ссылку в консоль, чтобы можно было
    // протестить флоу.
    console.warn('[auth] RESEND_API_KEY not set — magic link:', link)
  }

  return NextResponse.json({ ok: true, mailed })
}
