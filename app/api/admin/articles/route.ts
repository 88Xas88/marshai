import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminJWT, ADMIN_COOKIE } from '@/lib/admin-auth'
import { listAll, createArticle, type ArticleInput } from '@/lib/blog-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const store = await cookies()
  const session = store.get(ADMIN_COOKIE)?.value
  if (!session) return null
  return verifyAdminJWT(session)
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const articles = await listAll()
  return NextResponse.json({ ok: true, articles })
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  let body: ArticleInput
  try {
    body = (await req.json()) as ArticleInput
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  if (!body.slug || !body.title || !body.description || !body.content) {
    return NextResponse.json(
      { ok: false, error: 'missing_required_fields' },
      { status: 400 }
    )
  }
  const article = await createArticle(body, admin.adminId)
  if (!article) return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 })
  return NextResponse.json({ ok: true, article })
}
