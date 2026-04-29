import { NextResponse } from 'next/server'
import { attachEmailToPlan, dbEnabled, loadPlan } from '@/lib/db'
import { sendPlanSavedEmail, emailEnabled } from '@/lib/email'

export const runtime = 'nodejs'

interface Body {
  planId?: string
  email?: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const email = (body.email ?? '').trim()
  const planId = (body.planId ?? '').trim()

  if (!email.includes('@') || email.length < 5) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }
  if (!planId) {
    return NextResponse.json({ ok: false, error: 'invalid_plan_id' }, { status: 400 })
  }

  const isUuid = UUID_RE.test(planId)
  let persisted = false
  let mailed = false

  // Реальный план в Neon (UUID): прикрепляем email и шлём подтверждение.
  // Демо-планы (`example-spb`, `demo*`) не лежат в БД — для них просто говорим OK,
  // чтобы UI на демо-страницах работал без ошибок.
  if (dbEnabled && isUuid) {
    persisted = await attachEmailToPlan(planId, email)

    if (persisted && emailEnabled) {
      const saved = await loadPlan(planId)
      if (saved) {
        mailed = await sendPlanSavedEmail({
          to: email,
          planId,
          fromCity: saved.fromCity,
          toCity: saved.toCity,
          dates: saved.dates,
        })
      }
    }
  }

  return NextResponse.json({
    ok: true,
    planId,
    persisted,  // true если запись в БД действительно обновилась
    mailed,     // true если письмо ушло (требует RESEND_API_KEY)
  })
}
