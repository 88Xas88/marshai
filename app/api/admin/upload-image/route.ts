import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminJWT, ADMIN_COOKIE } from '@/lib/admin-auth'
import { uploadImage, r2Configured } from '@/lib/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_SIZE = 8 * 1024 * 1024 // 8 MB

export async function POST(req: Request) {
  const store = await cookies()
  const session = store.get(ADMIN_COOKIE)?.value
  if (!session || !(await verifyAdminJWT(session))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  if (!r2Configured) {
    return NextResponse.json(
      {
        ok: false,
        error: 'r2_not_configured',
        message: 'Image upload is not configured. Set R2_* env vars in shared/.env.production.',
      },
      { status: 503 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_form' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'no_file' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, error: 'too_large', max: MAX_SIZE },
      { status: 413 }
    )
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ ok: false, error: 'not_an_image' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const result = await uploadImage(buf, file.type, file.name)
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'upload_failed', detail: result.error },
      { status: 500 }
    )
  }
  return NextResponse.json({ ok: true, url: result.url })
}
