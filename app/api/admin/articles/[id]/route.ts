import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminJWT, ADMIN_COOKIE } from '@/lib/admin-auth'
import { getById, updateArticle, deleteArticle, type ArticleInput } from '@/lib/blog-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const store = await cookies()
  const session = store.get(ADMIN_COOKIE)?.value
  if (!session) return null
  return verifyAdminJWT(session)
}

interface RouteCtx {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const article = await getById(id)
  if (!article) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true, article })
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  let body: Partial<ArticleInput>
  try {
    body = (await req.json()) as Partial<ArticleInput>
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  const article = await updateArticle(id, body)
  if (!article) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true, article })
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const { id } = await ctx.params
  const ok = await deleteArticle(id)
  if (!ok) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
